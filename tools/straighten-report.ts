/**
 * The measurement behind BUGS.md #183: how many junctions each tolerance would touch, and what the
 * straightening does to `rideStats().nearDuplicates` — without running a bake.
 *
 * It takes the same cached Overpass answer the bake takes, does the same `joinNearMisses`, splits the ways at
 * their shared nodes the way the bake does, and builds the ride graph only to measure it. So it can be run
 * while a bake is running, and it answers in under a minute.
 *
 *   node --experimental-strip-types tools/straighten-report.ts san-francisco [--sweep] [--box=lat,lon,r]
 */
import { Projection } from '../src/city/geo.ts'
import { resolve } from '../src/city/graph.ts'
import { rideExits, rideGraph, rideStats } from '../src/city/ridegraph.ts'
import { city, detailBboxOf } from './cities.ts'
import { joinNearMisses } from './gaps.ts'
import { cityQuery, overpassTiled, type OsmWay } from './overpass.ts'
import { DEFAULTS, straightenJunctions, type JunctionRow, type StraightenOpts } from './straighten.ts'

const id = process.argv[2]?.startsWith('--') ? 'san-francisco' : (process.argv[2] ?? 'san-francisco')
const spec = city(id)
const proj = new Projection(spec.centre)

const raw = await overpassTiled(cityQuery, detailBboxOf(spec))
const clone = (): OsmWay[] => JSON.parse(JSON.stringify(
  raw.ways.filter((w) => w.tags.highway && w.geometry && w.geometry.length === w.nodes.length))) as OsmWay[]

const haversine = (a: { lat: number; lon: number }, b: { lat: number; lon: number }): number => {
  const p = proj.toLocal(a)
  const q = proj.toLocal(b)
  return Math.hypot(p.x - q.x, p.z - q.z)
}

/** the bake's split, reduced to what the ride graph reads from an edge */
function split(streets: OsmWay[]): { id: number; a: number; b: number; points: { x: number; z: number }[];
  length: number; name?: string; foot: boolean; kind: string; service?: string; oneway?: boolean;
  layer?: number; bridge?: boolean; tunnel?: boolean; width: number; walk: number }[] {
  const use = new Map<number, number>()
  for (const w of streets) for (const n of w.nodes) use.set(n, (use.get(n) ?? 0) + 1)
  const out: ReturnType<typeof split> = []
  let next = 1
  for (const w of streets) {
    let start = 0
    for (let i = 1; i < w.nodes.length; i++) {
      if ((use.get(w.nodes[i]) ?? 0) <= 1 && i !== w.nodes.length - 1) continue
      const geom = w.geometry.slice(start, i + 1)
      let len = 0
      for (let k = 1; k < geom.length; k++) len += haversine(geom[k - 1], geom[k])
      if (geom.length >= 2 && len > 0.5) {
        const t = w.tags
        out.push({
          id: next++, a: w.nodes[start], b: w.nodes[i], points: geom.map((g) => proj.toLocal(g)), length: len,
          name: t.name, kind: t.highway,
          foot: /^(footway|path|pedestrian|steps|track|bridleway)$/.test(t.highway),
          service: t.service, oneway: t.oneway === 'yes' || undefined,
          layer: t.layer ? parseFloat(t.layer) : undefined,
          bridge: t.bridge && t.bridge !== 'no' ? true : undefined,
          tunnel: t.tunnel && t.tunnel !== 'no' ? true : undefined,
          width: 6, walk: 2,
        })
      }
      start = i
    }
  }
  return out
}

const graphOf = (streets: OsmWay[]) => rideGraph(split(streets) as never, 'bike',
  { roundabouts: [], wideJunctions: true, heightAt: () => 0 })

function measure(streets: OsmWay[]): { dup: number; raw: number; edges: number } {
  const st = rideStats(graphOf(streets))
  return { dup: st.nearDuplicates, raw: st.rawNearDuplicates, edges: st.edges }
}

const prepared = (): OsmWay[] => {
  const s = clone()
  joinNearMisses(s, (g) => proj.toLocal(g))
  return s
}

/** --near=lat,lon,r restricts the measurement to one demo corridor */
const nearArg = process.argv.find((a) => a.startsWith('--near='))
const near = nearArg ? nearArg.slice(7).split(',').map(Number) : null
const inBox = (p: { x: number; z: number }): boolean => {
  if (!near) return true
  const c = proj.toLocal({ lat: near[0], lon: near[1] })
  return Math.hypot(p.x - c.x, p.z - c.z) <= near[2]
}

const juncArg = process.argv.find((a) => a.startsWith('--junction='))
if (juncArg) {
  /*
   * What the rider is offered at one junction, built from OSM here rather than read from a baked ride file —
   * so a change to the ride graph can be checked while a bake is running. BUGS.md #183: California Street at
   * Leidesdorff, where "straight on" used to take the alley.
   */
  const [lat, lon] = juncArg.slice(11).split(',').map(Number)
  const streets = prepared()
  if (process.argv.includes('--straighten')) straightenJunctions(streets, proj)
  const g = graphOf(streets)
  const c = proj.toLocal({ lat, lon })
  let best = -1
  let bd = Infinity
  for (const [nid, n] of g.nodes) {
    const d = Math.hypot(n.at.x - c.x, n.at.z - c.z)
    if (d < bd) { bd = d; best = nid }
  }
  const at = proj.toLatLon(g.nodes.get(best)!.at)
  console.log(`nearest ride node ${best} at ${at.lat.toFixed(6)}, ${at.lon.toFixed(6)} (${bd.toFixed(1)} m from the report)`)
  const deg = (r: number): string => (r * 180 / Math.PI).toFixed(1)
  for (const arr of g.nodes.get(best)!.edges) {
    const ae = g.edges.get(arr)!
    const xs = rideExits(g, best, arr)
    console.log(`\narriving on "${ae.name ?? '(' + ae.kind + ')'}" ${Math.round(ae.length)} m`)
    for (const x of xs) {
      const e = g.edges.get(x.edgeId)!
      console.log(`   ${deg(x.angle).padStart(7)}°  ${x.turn.padEnd(8)} "${e.name ?? '(' + e.kind + ')'}" ${Math.round(e.length)} m`)
    }
    const ch = resolve(xs, 'straight')
    const ce = ch ? g.edges.get(ch.edgeId)! : null
    console.log(`   → straight on takes "${ce?.name ?? '(none)'}" at ${ch ? deg(ch.angle) : '-'}°`)
  }
} else if (process.argv.includes('--short')) {
  /*
   * Why half the junctions are declined "too short a run". Two very different causes hide in that number: a
   * driveway or parking aisle stub (correctly declined — there is no crossing there to straighten) and a
   * REAL street whose next junction node is two metres away, which is the owner's "halves of a street split
   * at slightly different places" and is node MERGING, not node moving.
   */
  const ways = prepared().filter((w) => !/^(footway|path|pedestrian|steps|track|bridleway|cycleway)$/.test(w.tags.highway))
  const use = new Map<number, number>()
  for (const w of ways) for (const n of w.nodes) use.set(n, (use.get(n) ?? 0) + 1)
  const kindOf = new Map<number, string>()
  for (const w of ways) for (const n of w.nodes) if ((use.get(n) ?? 0) > 1) {
    const k = w.tags.service ? `service:${w.tags.service}` : w.tags.highway
    const had = kindOf.get(n)
    // the SMALLEST class at the node is what blocks: a driveway joining a street is a driveway
    if (!had || k.startsWith('service') || k === 'service') kindOf.set(n, k)
  }
  const gaps: { d: number; kind: string }[] = []
  for (const w of ways) {
    let prevJ = -1
    let d = 0
    for (let i = 0; i < w.nodes.length; i++) {
      if (i > 0) d += haversine(w.geometry[i - 1], w.geometry[i])
      if ((use.get(w.nodes[i]) ?? 0) <= 1) continue
      if (prevJ >= 0 && d < 12) gaps.push({ d, kind: kindOf.get(w.nodes[i]) ?? '?' })
      prevJ = i
      d = 0
    }
  }
  const by = new Map<string, number[]>()
  for (const g of gaps) (by.get(g.kind) ?? by.set(g.kind, []).get(g.kind)!).push(g.d)
  console.log(`${spec.name}: ${gaps.length} junction-to-junction gaps under 12 m, by the class that blocks`)
  for (const [k, ds] of [...by].sort((a, b) => b[1].length - a[1].length).slice(0, 12)) {
    ds.sort((a, b) => a - b)
    console.log(`  ${k.padEnd(22)} ${String(ds.length).padStart(5)}   median ${ds[Math.floor(ds.length / 2)].toFixed(1)} m`)
  }
} else if (process.argv.includes('--histogram')) {
  const rows: JunctionRow[] = []
  straightenJunctions(prepared(), proj, { dryRun: true, record: (r) => { if (inBox(r.at)) rows.push(r) } })
  const square = rows.filter((r) => r.opposite < 5)
  const pct = (xs: number[], q: number): number => xs[Math.min(xs.length - 1, Math.floor(q * xs.length))]
  const show = (name: string, pick: (r: JunctionRow) => number, unit: string): void => {
    const xs = rows.map(pick).filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
    console.log(`${name.padEnd(10)} n=${xs.length}  median ${pct(xs, 0.5).toFixed(2)}${unit}  `
      + `p75 ${pct(xs, 0.75).toFixed(2)}  p90 ${pct(xs, 0.9).toFixed(2)}  p99 ${pct(xs, 0.99).toFixed(2)}  max ${pct(xs, 1).toFixed(2)}`)
  }
  console.log(`${spec.name}: ${rows.length} junctions with 3 or 4 roadway arms and a measurable run`)
  console.log(`  ${rows.filter((r) => r.arms === 4).length} four-arm, ${rows.filter((r) => r.arms === 3).length} three-arm`)
  console.log(`  ${square.length} of them are TRUE crossings (halves collinear within 5°)`)
  show('opposite', (r) => r.opposite, '°')
  show('square', (r) => r.square, '°')
  show('bend', (r) => r.bend, ' m')
  show('lateral', (r) => r.lateral, ' m')
  show('move', (r) => r.move, ' m')
  const s2 = square.map((r) => r.bend).sort((a, b) => a - b)
  const l2 = square.map((r) => r.lateral).sort((a, b) => a - b)
  const m2 = square.map((r) => r.move).filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  console.log(`  at TRUE crossings only: bend p90 ${pct(s2, 0.9).toFixed(2)} m, lateral p90 ${pct(l2, 0.9).toFixed(2)} m, `
    + `move p90 ${pct(m2, 0.9).toFixed(2)} m (median ${pct(m2, 0.5).toFixed(2)} m)`)
} else if (process.argv.includes('--sweep')) {
  // one tolerance at a time around the default, not the full cross product
  const axes: [keyof StraightenOpts, number[]][] = [
    ['bend', [0.3, 0.5, 1.0, 1.5, 2.5]],
    ['square', [5, 8, 12, 18, 25]],
    ['opposite', [5, 8, 12, 18, 25]],
    ['move', [1, 2, 4, 6, 10]],
    ['jitter', [3, 6, 9, 12]],
  ]
  console.log(`${spec.name}: sweeping one tolerance at a time around`,
    Object.entries(DEFAULTS).map(([k, v]) => `${k}=${v}`).join(' '))
  console.log('tolerance        4-way    tee   moved(m avg/max)   declined: arms  axes  short  bend   far')
  for (const [k, vals] of axes) {
    for (const v of vals) {
      const s = prepared()
      const r = straightenJunctions(s, proj, { [k]: v, dryRun: true })
      const n = r.crossings + r.tees
      console.log(`${(k + '=' + v).padEnd(14)} ${String(r.crossings).padStart(7)} ${String(r.tees).padStart(6)}`
        + `   ${(r.moved / Math.max(1, n)).toFixed(2)} / ${r.maxMove.toFixed(2)}`.padEnd(20)
        + `${String(r.declined.arms).padStart(12)} ${String(r.declined.axes).padStart(5)} `
        + `${String(r.declined.short).padStart(5)} ${String(r.declined.bend).padStart(5)} `
        + `${String(r.declined.far).padStart(5)}`
        + (k === 'bend' && v === DEFAULTS.bend ? `   (junctions ${r.junctions}, twinned pairs ${r.twinned})` : ''))
    }
  }
} else {
  const before = measure(prepared())
  const after = prepared()
  const r = straightenJunctions(after, proj)
  const a = measure(after)
  console.log(`${spec.name}: ${r.junctions} junction nodes, ${r.crossings} four-way crossings and ${r.tees} tees `
    + `straightened, ${r.removed} jitter vertices deleted, ${r.projected} shared vertices put on the axis`)
  console.log(`  moved ${(r.moved / Math.max(1, r.crossings + r.tees)).toFixed(2)} m on average, ${r.maxMove.toFixed(2)} m at most`)
  console.log(`  declined: ${r.declined.arms} not two-street, ${r.declined.axes} not square, `
    + `${r.declined.short} too short a run, ${r.declined.bend} a real bend, ${r.declined.far} a real offset`)
  console.log(`  left alone: ${r.twinned} pairs of junction nodes under 8 m apart (node merging, not attempted)`)
  console.log(`  nearDuplicates ${before.dup} → ${a.dup}   (raw ${before.raw} → ${a.raw}, edges ${before.edges} → ${a.edges})`)
}
