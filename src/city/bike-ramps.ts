/*
 * BIKE RAMPS BESIDE A BRIDGEHEAD'S STAIRS (owner, 2026-11-07: "a made up bike ramp makes sense, most of these do have stairs
 * but bikes can't go up stairs"). Not OSM: each is declared here, one per bridge end, and laid as a ride edge between an
 * existing node at the top (the deck's end, an upper quay) and one at the bottom (a quay, a lower quay), at a gentle grade.
 * It is drawn as a raised way (`ramp`: a paved deck with its rails, render/city.ts deck()) and ridden like any cycleway.
 *
 * Laid by the full bake (tools/bake.ts, on the finished package) AND by `npm run bake -- <city> --rides`, which strips the
 * last ramps, lays these again, rewrites the tiles they lie in and the ride files: adding or moving one needs no full bake.
 *
 * To declare one: the bridge, a label, `top` and `bottom` (lat/lon near a NODE of the named way — the nearest node of a way
 * whose name contains `way`, or of any way if `way` is unset, within SNAP_R), and `via`: the line it takes between them
 * (along the quay wall, or a switchback). Its grade is the rise over that line's length; over `maxGrade` (default
 * RAMP_MAX_GRADE) the bake warns and lays it anyway, so add a via point or a hairpin until it fits.
 */
import type { PackedEdge } from './package.ts'
import { packPoints } from './package.ts'

export interface BikeRampDecl {
  bridge: string
  label: string
  top: { lat: number; lon: number; way?: string }
  bottom: { lat: number; lon: number; way?: string }
  via?: [number, number][]
  maxGrade?: number
  width?: number
}

/** steepest a declared ramp should be; the snap radius for its ends; its points' spacing; its width */
export const RAMP_MAX_GRADE = 0.07, RAMP_SNAP_R = 25, RAMP_STEP = 4, RAMP_WIDTH = 3
/** ids of the ramps' edges start here (above any OSM or bake-made id) */
const RAMP_ID0 = 9.6e14

export const BIKE_RAMPS: Record<string, BikeRampDecl[]> = {
  paris: [
    // Pont National, left bank: the elevated boulevard (h 5.1 in bake 2) down to the upper-quay cycleway (1.8) along the sidewalk's
    // west side — the only way up was steps and a lift. ~64 m at ~5 %. (Unlooked: no overhead shot yet of walls along the line)
    { bridge: 'Pont National', label: 'left bank, boulevard to Quai d\'Ivry',
      top: { lat: 48.827052, lon: 2.385394, way: 'Jean Simon' }, via: [[48.827294, 2.385217]],
      bottom: { lat: 48.827537, lon: 2.385408, way: 'Quai d\'Ivry' } },
  ],
}

type XZ = { x: number; z: number }

/** Strips the last bake's ramps and lays the region's again; returns what changed (ids removed, edges added) and a report. */
export function layBikeRamps(edges: PackedEdge[], region: string, toLocal: (lat: number, lon: number) => XZ): { removed: number[]; added: PackedEdge[]; log: string[] } {
  const removed: number[] = []
  for (let i = edges.length - 1; i >= 0; i--) if (edges[i].bikeRamp) { removed.push(edges[i].id); edges.splice(i, 1) }
  const log: string[] = [], added: PackedEdge[] = []
  const decls = BIKE_RAMPS[region] ?? []
  if (!decls.length) return { removed, added, log }
  // every node with its position and height, by the ways it ends
  const nodes: { n: number; x: number; z: number; h: number; e: PackedEdge }[] = []
  for (const e of edges) {
    if (!e.heights || e.tunnel || e.kind === 'steps' || e.kind === 'elevator') continue
    const p = e.points
    nodes.push({ n: e.a, x: p[0], z: p[1], h: e.heights[0], e }, { n: e.b, x: p[p.length - 2], z: p[p.length - 1], h: e.heights[e.heights.length - 1], e })
  }
  const snap = (q: { lat: number; lon: number; way?: string }) => {
    const at = toLocal(q.lat, q.lon)
    let best: (typeof nodes)[number] | null = null, bd = RAMP_SNAP_R
    for (const t of nodes) {
      if (q.way && !(t.e.name ?? t.e.kind).includes(q.way)) continue
      const d = Math.hypot(t.x - at.x, t.z - at.z)
      if (d < bd) { bd = d; best = t }
    }
    return best
  }
  let id = RAMP_ID0
  for (const d of decls) {
    const top = snap(d.top), bot = snap(d.bottom)
    if (!top || !bot) { log.push(`${d.bridge} ${d.label}: no ${top ? 'bottom' : 'top'} node within ${RAMP_SNAP_R} m`); continue }
    const line: XZ[] = [{ x: top.x, z: top.z }, ...(d.via ?? []).map(([lat, lon]) => toLocal(lat, lon)), { x: bot.x, z: bot.z }]
    // resampled at RAMP_STEP, heights straight from top to bottom by distance
    const pts: XZ[] = [line[0]], cum = [0]
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1], b = line[i], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.round(L / RAMP_STEP))
      for (let k = 1; k <= n; k++) { pts.push({ x: a.x + (b.x - a.x) * k / n, z: a.z + (b.z - a.z) * k / n }); cum.push(cum[cum.length - 1] + L / n) }
    }
    const L = cum[cum.length - 1], grade = Math.abs(top.h - bot.h) / Math.max(L, 1e-6)
    const heights = cum.map((c) => Math.round((top.h + (bot.h - top.h) * c / L) * 100) / 100)
    const e: PackedEdge = {
      id: id++, a: top.n, b: bot.n, points: packPoints(pts), heights, surface: 'asphalt', width: d.width ?? RAMP_WIDTH, walk: 0,
      name: `${d.bridge} bike ramp`, foot: false, kind: 'cycleway', ramp: true, bikeRamp: true,
    }
    edges.push(e); added.push(e)
    log.push(`${d.bridge} ${d.label}: ${Math.round(L)} m, ${top.h.toFixed(1)} → ${bot.h.toFixed(1)}, ${(grade * 100).toFixed(1)} %${grade > (d.maxGrade ?? RAMP_MAX_GRADE) ? ' — STEEPER than its max: add a via point' : ''} (top ${top.e.name ?? top.e.kind}, bottom ${bot.e.name ?? bot.e.kind})`)
  }
  return { removed, added, log }
}
