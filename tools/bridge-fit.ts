/**
 * HOW WELL DO THE RIDDEN WAYS FIT THE BRIDGE MODELS? (2026-09-29, the owner: "the paths all need to line up to bike
 * over the bridge models, which are not exactly the same shape as the data from OSM".)
 *
 * The bridge models (render/landmarks/sf/golden-gate.ts, bay-bridge.ts) declare their walkable decks (`out.decks`,
 * rectangles in the model's frame with a height). This runs each bridge's builder headless, places its decks with
 * the manifest's own transform (public/landmarks/<city>/bridges.json — the same arithmetic as render/landmarks.ts
 * `place`), and measures every ride-graph edge and every drivable street over the bridge against them:
 *
 *   * ACROSS — how far the way runs from the deck's edge (0 inside the deck, positive outside: riding in the air);
 *   * UP — the way's own height against the deck's height under it (0 on the deck; positive floating, negative under).
 *
 *   node --experimental-strip-types tools/bridge-fit.ts [city=san-francisco]
 *
 * Prints, per bridge, a table along the deck every 100 m, and the worst of each.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'
import { unpackPoints } from '../src/city/package.ts'
import { BridgeDecks, placement, toModel, type GraphEdge } from '../src/city/bridge-decks.ts'
import { SF_BRIDGE_DECKS } from '../src/city/sf/bridges.ts'
import { Terrain } from '../src/city/terrain.ts'

const city = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'san-francisco'
// --baseY=<m>: measure as though the model stood at this datum (to try a change before making it)
const baseOverride = (() => { const a = process.argv.find((x) => x.startsWith('--baseY=')); return a ? Number(a.split('=')[1]) : null })()
const root = resolve(import.meta.dirname, '..', 'public')
const pkg = JSON.parse(readFileSync(resolve(root, 'cities', `${city}.json`), 'utf8'))
const manifest = resolve(root, 'landmarks', city, 'bridges.json')
if (!existsSync(manifest)) { console.error(`no ${manifest}`); process.exit(1) }
const entries = JSON.parse(readFileSync(manifest, 'utf8')) as { name: string; procedural: string; lat: number; lon: number; rotateDeg?: number; baseY?: number; scale?: number; offset?: [number, number, number]; size?: [number, number]; height?: number }[]
const ride = JSON.parse(readFileSync(resolve(root, 'cities', city, 'ride-bike.json'), 'utf8')) as { edges: { id: number; points: number[]; heights?: number[]; kind?: string; name?: string; over: number[] }[] }
const proj = new Projection(pkg.origin)
const terrain = new Terrain(pkg.terrain)
// --step=<m>: how often along the deck to print the profile (default 200)
const step = (() => { const a = process.argv.find((x) => x.startsWith('--step=')); return a ? Number(a.split('=')[1]) : 200 })()
/*
 * --conform: first put the PACKAGE's ways onto the declared decks and regrade the chains off them, exactly as the
 * bake does (src/city/bridge-decks.ts conformGraph), then measure those — what a bake with the present declarations
 * would give, in a few seconds. Without it: the ride graph as it is on disk.
 */
type Way = { id: number; points: { x: number; z: number }[]; heights?: number[]; kind?: string; name?: string; layer?: number; bridge?: boolean; ramp?: boolean; tunnel?: boolean; a?: number; b?: number }
let ways: Way[] = ride.edges.map((r) => ({ ...r, points: unpackPoints(r.points) }))
let changed = new Set<number>()
if (process.argv.includes('--conform')) {
  const decks = new BridgeDecks()
  for (const e of entries) {
    const d = SF_BRIDGE_DECKS[e.procedural]
    if (d) decks.add(placement({ ...e, baseY: baseOverride ?? e.baseY }, proj), d)
  }
  // (from what the ways were BEFORE the bake conformed them, where it kept that)
  const undoFile = resolve(root, 'cities', city, 'decks-undo.json')
  if (existsSync(undoFile)) {
    const undo = JSON.parse(readFileSync(undoFile, 'utf8')) as Record<string, Record<string, unknown>>
    for (const e of pkg.edges as Record<string, unknown>[]) {
      const u = undo[e.id as number]
      if (!u) continue
      e.heights = u.heights
      if (u.points) e.points = u.points
      for (const k of ['bridge', 'ramp', 'bore', 'cut']) { if (u[k]) e[k] = true; else delete e[k] }
    }
  }
  const edges = (pkg.edges as (GraphEdge & { points: never })[]).map((r) => ({ ...r, points: unpackPoints(r.points as number[]), heights: (r.heights as number[] | undefined)?.slice() })) as GraphEdge[]
  const before = new Map(edges.map((e) => [e.id, e.heights?.slice()]))
  const r = decks.conformGraph(edges, (x, z) => terrain.rawHeightAt(x, z))
  changed = r.changed
  ways = edges.filter((e) => r.changed.has(e.id)) as Way[]
  console.log(`conformed the package: ${r.pinned} ways on a deck, ${r.regraded} regraded off them (${r.flagged} newly ramps, ${r.grounded} junctions put on the ground, ${r.heldUp} crossings held up); `
    + `steepest ${(r.steepest.grade * 100).toFixed(1)}% on ${r.steepest.id} at (${r.steepest.at.x.toFixed(0)}, ${r.steepest.at.z.toFixed(0)})`)
  if (process.argv.includes('--chain')) {
    // every regraded way, steepest first: its grade, how far it moved, how it stands over the ground
    const rows = ways.map((e) => {
      const h = e.heights!
      let len = 0
      for (let i = 1; i < e.points.length; i++) len += Math.hypot(e.points[i].x - e.points[i - 1].x, e.points[i].z - e.points[i - 1].z)
      const was = before.get(e.id) ?? []
      const moved = Math.max(...h.map((v, i) => Math.abs(v - (was[i] ?? v))))
      const over = h.map((v, i) => v - terrain.rawHeightAt(e.points[i].x, e.points[i].z))
      let worst = 0
      for (let i = 1; i < h.length; i++) { const d = Math.hypot(e.points[i].x - e.points[i - 1].x, e.points[i].z - e.points[i - 1].z); if (d > 2) worst = Math.max(worst, Math.abs(h[i] - h[i - 1]) / d) }
      return { e, len, grade: Math.abs(h[h.length - 1] - h[0]) / (len || 1), worst, moved, lo: Math.min(...over), hi: Math.max(...over) }
    }).sort((p, q) => q.worst - p.worst)
    console.log('  the regraded ways, steepest first (id kind layer flags length: h from→to, end-to-end grade, steepest step, moved, over the ground lo..hi):')
    for (const x of rows.slice(0, Number(process.argv.find((a) => a.startsWith('--top='))?.split('=')[1] ?? 25))) {
      const e = x.e
      console.log(`    ${String(e.id).padStart(6)} ${(e.kind ?? '').padEnd(13)} L${e.layer ?? 0} ${e.bridge ? 'br' : e.ramp ? 'rp' : e.tunnel ? 'tu' : '  '} ${x.len.toFixed(0).padStart(5)}m: ${e.heights![0].toFixed(1)}→${e.heights![e.heights!.length - 1].toFixed(1)}  ${(x.grade * 100).toFixed(1)}%  step ${(x.worst * 100).toFixed(1)}%  moved ${x.moved.toFixed(1)}  over ${x.lo.toFixed(1)}..${x.hi.toFixed(1)}  ${(e.name ?? '').slice(0, 26)}`)
    }
    // two regraded ways crossing in plan without the height to pass: a deck through a deck
    const seg = (p1: { x: number; z: number }, p2: { x: number; z: number }, q1: { x: number; z: number }, q2: { x: number; z: number }): [number, number] | null => {
      const d = (p2.x - p1.x) * (q2.z - q1.z) - (p2.z - p1.z) * (q2.x - q1.x)
      if (Math.abs(d) < 1e-9) return null
      const t = ((q1.x - p1.x) * (q2.z - q1.z) - (q1.z - p1.z) * (q2.x - q1.x)) / d
      const u = ((q1.x - p1.x) * (p2.z - p1.z) - (q1.z - p1.z) * (p2.x - p1.x)) / d
      return t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98 ? [t, u] : null
    }
    let clashes = 0
    const all = edges.filter((e) => e.heights)
    for (const w of ways) {
      const bx = [Math.min(...w.points.map((q) => q.x)), Math.max(...w.points.map((q) => q.x)), Math.min(...w.points.map((q) => q.z)), Math.max(...w.points.map((q) => q.z))]
      for (const o of all) {
        if (o.id === w.id || (changed.has(o.id) && o.id < w.id)) continue
        if (o.a === w.a || o.a === w.b || o.b === w.a || o.b === w.b) continue
        if (!o.points.some((q) => q.x >= bx[0] && q.x <= bx[1] && q.z >= bx[2] && q.z <= bx[3])) continue
        for (let i = 1; i < w.points.length; i++) for (let j = 1; j < o.points.length; j++) {
          const c = seg(w.points[i - 1], w.points[i], o.points[j - 1], o.points[j])
          if (!c) continue
          const hw = w.heights![i - 1] + (w.heights![i] - w.heights![i - 1]) * c[0]
          const ho = o.heights![j - 1] + (o.heights![j] - o.heights![j - 1]) * c[1]
          if (Math.abs(hw - ho) < 4.5) {
            clashes++
            if (clashes <= 30) console.log(`    CLASH ${w.id} ${w.kind} L${w.layer ?? 0} (${hw.toFixed(1)}) × ${o.id} ${o.kind} L${o.layer ?? 0}${o.tunnel ? ' tunnel' : ''} (${ho.toFixed(1)}) at (${w.points[i].x.toFixed(0)}, ${w.points[i].z.toFixed(0)}): ${(hw - ho).toFixed(1)} m apart`)
          }
        }
      }
    }
    console.log(`  ${clashes} crossings without 4.5 m between the ways`)
  }
}

for (const e of entries) {
  const declared = SF_BRIDGE_DECKS[e.procedural]
  if (!declared?.length) { console.log(`\n== ${e.name} (${e.procedural}): declares no deck`); continue }
  const pl = placement({ ...e, baseY: baseOverride ?? e.baseY }, proj)
  const one = new BridgeDecks()
  one.add(pl, declared)
  const z0 = Math.min(...declared.map((d) => d.from))
  const z1 = Math.max(...declared.map((d) => d.to))
  console.log(`\n== ${e.name} (${e.procedural}): ${declared.length} deck(s) along ${z0.toFixed(0)}..${z1.toFixed(0)} m`)
  // every way with a point over a deck of its own layer: against the deck (up), across the model (x), over the ground
  type Row = { along: number; off: number; up: number; x: number; clear: number }
  for (const r of ways) {
    const hs = r.heights ?? []
    const rows: Row[] = []
    for (let i = 0; i < r.points.length; i++) {
      const q = r.points[i]
      if (Math.abs(q.x - pl.cx) > 6000 || Math.abs(q.z - pl.cz) > 6000) continue
      const hit = one.at(q.x, q.z, r.layer ?? 0, r.kind)
      if (!hit) continue
      const up = (hs[i] ?? NaN) - hit.y
      // a street under the bridge is not on it (without --conform the ride graph's plain ways are measured too)
      if (!(Math.abs(up) < 40)) continue
      rows.push({ along: hit.along, off: Math.max(0, hit.off), up, x: toModel(pl, q).x, clear: (hs[i] ?? NaN) - terrain.rawHeightAt(q.x, q.z) })
    }
    if (rows.length < 2) continue
    rows.sort((p, q) => p.along - q.along)
    const worstUp = rows.reduce((w, x) => (Math.abs(x.up) > Math.abs(w) ? x.up : w), 0)
    console.log(`  ${r.id} ${r.name ?? ''} ${r.kind} L${r.layer ?? 0}: ${rows.length} points along ${rows[0].along.toFixed(0)}..${rows[rows.length - 1].along.toFixed(0)}; `
      + `worst off the deck's edge ${Math.max(...rows.map((x) => x.off)).toFixed(1)} m, worst height ${worstUp >= 0 ? '+' : ''}${worstUp.toFixed(2)} m`)
    let next = -Infinity
    const line: string[] = []
    for (const x of rows) if (x.along >= next) { line.push(`${x.along.toFixed(0)}:${x.up >= 0 ? '+' : ''}${x.up.toFixed(1)}@x${x.x.toFixed(1)}^${x.clear.toFixed(0)}`); next = x.along + step }
    if (process.argv.includes('--profile')) console.log(`    along:up@x^over-ground  ${line.join('  ')}`)
    const buried = rows.filter((x) => x.clear < -1)
    if (buried.length) console.log(`    BURIED ${buried.length} points, along ${buried[0].along.toFixed(0)}..${buried[buried.length - 1].along.toFixed(0)}, worst ${Math.min(...buried.map((x) => x.clear)).toFixed(1)} m`)
  }
}
