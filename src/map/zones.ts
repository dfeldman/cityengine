/**
 * Zones as the bake reads them (docs/MAP-FORMAT.md §7): the universal way to mark an area — a neighbourhood, a
 * town, a large park, a stretch of coast — with properties that change how things are made there. The owner,
 * 2026-09-28: *"zones are our universal way to distinguish neighborhoods, towns, large parks, distinct areas
 * with different properties."*
 *
 * They are BAKE INPUT, hand-authored in lat/lon under `data/zones/<region>.json` and `data/zones/<city>.json`
 * (the region's first, so a test area cut from a city gets the city's zones). They are not patchable: a zone
 * that changes the ground changes every height baked from it, which only a bake can redo.
 *
 * What reads them today: the terrain model (`terrain: 'fine'`, src/map/ground.ts). Planting is next.
 */
import type { ZoneProps } from './format.ts'

/** A zone as authored: a ring of [lat, lon] corners. */
export interface ZoneSpec {
  ref: string
  name?: string
  ring: [number, number][]
  priority?: number
  props: ZoneProps
}

export interface ZoneFile {
  v: 1
  zones: ZoneSpec[]
}

/** A zone in local metres (code frame: x east, z north), ready to test against. */
export interface LocalZone {
  ref: string
  name?: string
  /** flat x, z pairs */
  ring: number[]
  priority: number
  props: ZoneProps
  bbox: [number, number, number, number]
}

export function localZones(specs: ZoneSpec[], toLocal: (lat: number, lon: number) => { x: number; z: number }): LocalZone[] {
  return specs.map((s) => {
    const ring: number[] = []
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity
    for (const [lat, lon] of s.ring) {
      const p = toLocal(lat, lon)
      ring.push(p.x, p.z)
      x0 = Math.min(x0, p.x); z0 = Math.min(z0, p.z); x1 = Math.max(x1, p.x); z1 = Math.max(z1, p.z)
    }
    return { ref: s.ref, ...(s.name ? { name: s.name } : {}), ring, priority: s.priority ?? 0, props: s.props, bbox: [x0, z0, x1, z1] }
  })
}

export function inRing(ring: number[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    if ((ring[i + 1] > z) !== (ring[j + 1] > z) && x < ((ring[j] - ring[i]) * (z - ring[i + 1])) / (ring[j + 1] - ring[i + 1]) + ring[i]) o = !o
  }
  return o
}

const segsCross = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number, dx: number, dz: number): boolean => {
  const d = (px: number, pz: number, qx: number, qz: number, rx: number, rz: number): number => (qx - px) * (rz - pz) - (qz - pz) * (rx - px)
  const d1 = d(cx, cz, dx, dz, ax, az)
  const d2 = d(cx, cz, dx, dz, bx, bz)
  const d3 = d(ax, az, bx, bz, cx, cz)
  const d4 = d(ax, az, bx, bz, dx, dz)
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))
}

/** Does a zone overlap an axis-aligned rectangle (a tile) at all? */
export function zoneTouchesRect(zn: LocalZone, x0: number, z0: number, x1: number, z1: number): boolean {
  const [bx0, bz0, bx1, bz1] = zn.bbox
  if (bx1 < x0 || bx0 > x1 || bz1 < z0 || bz0 > z1) return false
  const r = zn.ring
  // a zone corner inside the rect, or a rect corner inside the zone
  for (let i = 0; i < r.length; i += 2) if (r[i] >= x0 && r[i] <= x1 && r[i + 1] >= z0 && r[i + 1] <= z1) return true
  for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) if (inRing(r, x, z)) return true
  // or an edge of each crossing
  const rect = [x0, z0, x1, z0, x1, z1, x0, z1]
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    for (let k = 0; k < 8; k += 2) {
      const m = (k + 2) % 8
      if (segsCross(r[j], r[j + 1], r[i], r[i + 1], rect[k], rect[k + 1], rect[m], rect[m + 1])) return true
    }
  }
  return false
}

/** The zones over a point, highest priority first. */
export function zonesAt(zones: LocalZone[], x: number, z: number): LocalZone[] {
  return zones
    .filter((zn) => x >= zn.bbox[0] && x <= zn.bbox[2] && z >= zn.bbox[1] && z <= zn.bbox[3] && inRing(zn.ring, x, z))
    .sort((a, b) => b.priority - a.priority)
}
