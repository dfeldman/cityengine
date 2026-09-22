/**
 * Joining the paths that nearly meet.
 *
 * OSM's ways meet only where they share a node, and mappers often stop a path a metre or three short of the
 * path or street it obviously runs into — or draw it up to the other way's line without joining it. In the
 * graph that is a dead end, and the rider, arriving there, found the path "surprisingly ends" and was turned
 * round (user report, 2026-09-21).
 *
 * So before the ways are split into edges: every way END that no other way uses, and that lies within
 * `reach` of another way, is joined to it — to that way's nearest node if one is close, otherwise to a new
 * node inserted into it at the nearest point — by extending the dangling way to the join. Layers are
 * respected: a path does not join a bridge above it or a tunnel below it.
 */
import type { LatLon } from '../src/city/geo.ts'

export interface GapWay {
  id: number
  nodes: number[]
  geometry: LatLon[]
  tags: Record<string, string>
}

/** How close a dangling end must be to another way to be joined to it, metres. */
export const GAP_REACH = 5
/** Within this of an existing node, join to the node rather than insert a new one. */
const SNAP_NODE = 2

// a building passage is at street level (an arch, not a tunnel): it joins the street it runs into — the
// Pavillon du Roi's arch was left 0.4 m short of the rest of Rue de Birague, and the ride graph dropped it
const level = (t: Record<string, string>): string => {
  const tunnel = t.tunnel && t.tunnel !== 'no' && t.tunnel !== 'building_passage'
  const layer = t.tunnel === 'building_passage' ? '0' : (t.layer ?? '0')
  return `${layer}|${t.bridge && t.bridge !== 'no' ? 'b' : ''}|${tunnel ? 't' : ''}`
}

/**
 * The ids of the joins' new nodes: far above any OSM node id (about 1.3e10 in 2026) and positive. NOT
 * negative — the ride graph hands out negative ids to its own synthetic nodes (ridegraph.ts `Ids`), and the
 * first bake with negative joins had a node −52 in both, which stitched Richard-Lenoir to the Rue de
 * Saintonge a kilometre away: the rider was drawn on one street at the other's height and "flew".
 */
export const GAP_NODE_BASE = 9e14

/** Join the near misses, in place. `toLocal` projects to metres; returns how many ends were joined. */
export function joinNearMisses(ways: GapWay[], toLocal: (g: LatLon) => { x: number; z: number },
                               reach = GAP_REACH): number {
  const use = new Map<number, number>()
  for (const w of ways) for (const n of w.nodes) use.set(n, (use.get(n) ?? 0) + 1)
  // every segment, on a grid, in metres
  const CELL = 25
  type Seg = { w: GapWay; i: number; ax: number; az: number; bx: number; bz: number }
  const grid = new Map<string, Seg[]>()
  const local = new Map<GapWay, { x: number; z: number }[]>()
  for (const w of ways) {
    const pts = w.geometry.map(toLocal)
    local.set(w, pts)
    for (let i = 1; i < pts.length; i++) {
      const s: Seg = { w, i, ax: pts[i - 1].x, az: pts[i - 1].z, bx: pts[i].x, bz: pts[i].z }
      const x0 = Math.floor((Math.min(s.ax, s.bx) - reach) / CELL)
      const x1 = Math.floor((Math.max(s.ax, s.bx) + reach) / CELL)
      const z0 = Math.floor((Math.min(s.az, s.bz) - reach) / CELL)
      const z1 = Math.floor((Math.max(s.az, s.bz) + reach) / CELL)
      for (let gx = x0; gx <= x1; gx++) {
        for (let gz = z0; gz <= z1; gz++) {
          const k = `${gx},${gz}`
          const list = grid.get(k)
          if (list) list.push(s)
          else grid.set(k, [s])
        }
      }
    }
  }
  let nextId = GAP_NODE_BASE
  let joined = 0
  // the insertions into other ways, applied after the search so segment indices stay valid during it
  const inserts: { w: GapWay; i: number; node: number; at: LatLon; t: number }[] = []
  // and the extensions of the dangling ways, applied after the insertions for the same reason
  const extend: { w: GapWay; front: boolean; node: number; at: LatLon }[] = []
  for (const w of ways) {
    const pts = local.get(w)!
    for (const end of [0, w.nodes.length - 1] as const) {
      const node = w.nodes[end]
      if ((use.get(node) ?? 0) > 1) continue
      const p = pts[end]
      let best: { s: Seg; d: number; t: number } | null = null
      // a street joins a street: footways count only when no carriageway is in reach (the arcade footway
      // beside the Pavillon du Roi's arch took Rue de Birague's join, and a bike cannot ride on to it)
      const footy = (t: Record<string, string>): boolean => /^(footway|path|steps|pedestrian|corridor)$/.test(t.highway ?? '')
      const wantStreet = !footy(w.tags)
      const candidates = (grid.get(`${Math.floor(p.x / CELL)},${Math.floor(p.z / CELL)}`) ?? [])
      const streetNear = wantStreet && candidates.some((s) => s.w !== w && !footy(s.w.tags) && level(s.w.tags) === level(w.tags)
        && Math.hypot(p.x - (s.ax + s.bx) / 2, p.z - (s.az + s.bz) / 2) < reach + Math.hypot(s.bx - s.ax, s.bz - s.az))
      for (const s of candidates) {
        if (s.w === w || level(s.w.tags) !== level(w.tags)) continue
        if (streetNear && footy(s.w.tags)) continue
        const dx = s.bx - s.ax
        const dz = s.bz - s.az
        const l2 = dx * dx + dz * dz || 1e-9
        const t = Math.max(0, Math.min(1, ((p.x - s.ax) * dx + (p.z - s.az) * dz) / l2))
        const d = Math.hypot(p.x - s.ax - dx * t, p.z - s.az - dz * t)
        if (d <= reach && (!best || d < best.d)) best = { s, d, t }
      }
      if (!best) continue
      const { s, t } = best
      const segLen = Math.hypot(s.bx - s.ax, s.bz - s.az)
      // the join: an existing node of the other way if one is near, else a new node on its segment
      let target: number
      let at: LatLon
      if (t * segLen <= SNAP_NODE) { target = s.w.nodes[s.i - 1]; at = s.w.geometry[s.i - 1] }
      else if ((1 - t) * segLen <= SNAP_NODE) { target = s.w.nodes[s.i]; at = s.w.geometry[s.i] }
      else {
        const a = s.w.geometry[s.i - 1]
        const b = s.w.geometry[s.i]
        at = { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t }
        target = nextId++
        inserts.push({ w: s.w, i: s.i, node: target, at, t })
      }
      if (target === node) continue
      // extend the dangling way to the join
      extend.push({ w, front: end === 0, node: target, at })
      use.set(target, (use.get(target) ?? 0) + 1)
      use.set(node, 2)
      joined++
    }
  }
  // the new nodes into their ways — per way, latest segment first and furthest along first, so each
  // insertion leaves the indices of the ones still to come untouched
  const byWay = new Map<GapWay, typeof inserts>()
  for (const ins of inserts) {
    const list = byWay.get(ins.w)
    if (list) list.push(ins)
    else byWay.set(ins.w, [ins])
  }
  for (const list of byWay.values()) {
    list.sort((p, q) => q.i - p.i || q.t - p.t)
    for (const ins of list) {
      ins.w.nodes.splice(ins.i, 0, ins.node)
      ins.w.geometry.splice(ins.i, 0, ins.at)
    }
  }
  for (const e of extend) {
    if (e.front) { e.w.nodes.unshift(e.node); e.w.geometry.unshift(e.at) }
    else { e.w.nodes.push(e.node); e.w.geometry.push(e.at) }
  }
  return joined
}
