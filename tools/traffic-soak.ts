/**
 * Run the traffic (src/sim/traffic.ts) on a REAL city's streets, headless, for minutes of simulated time, and report
 * anything that jams for good — the failure a crossroads test cannot show: a ring of queues round a block, a car
 * parked at the end of a short street with nowhere to go, a stop that never clears.
 *
 *   npx vite-node tools/traffic-soak.ts -- sf-mini [seconds=600] [x z]
 *
 * The rider is a fixed point (default the city's origin), so every street in range stays populated. Lights are
 * approximated by the renderer's rule (three or more driving arms with a pavement: render/city.ts `lightsIn`).
 * Exit code 1 if any vehicle stood still for STUCK seconds, with the chain of who waits for whom.
 */
import { readV2, readV2Tile } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { mapEdges } from '../src/city/ridefile.ts'
import { addEdges, type CityGraph } from '../src/city/graph.ts'
import { onSurface } from '../src/city/package.ts'
import { Signals, drives } from '../src/sim/signals.ts'
import { Traffic, type Vehicle } from '../src/sim/traffic.ts'
import { overlap } from '../src/sim/collide.ts'

const args = process.argv.slice(2).filter((a) => a !== '--')
const city = args[0] ?? 'sf-mini'
const seconds = Number(args[1] ?? 600)
const at = { x: Number(args[2] ?? 0), z: Number(args[3] ?? 0) }
const STUCK = 60
// the bake-private v2 index and tiles (tools/bake-files.ts): the index is checked fresh, then the tiles in range read
const index = readV2(city, false).index
const terrain = new Terrain(null)
const graph: CityGraph = { nodes: new Map(), edges: new Map() }
for (const e of index.tiles) {
  if (Math.hypot((e.tx + 0.5) * 200 - at.x, (e.tz + 0.5) * 200 - at.z) > 800) continue
  const t = readV2Tile(city, e.tx, e.tz)
  if (!t) continue
  addEdges(graph, mapEdges(t.edges.filter((x) => onSurface(x) && !graph.edges.has(x.id)), terrain))
}
const lit = (id: number): boolean => {
  const n = graph.nodes.get(id)
  if (!n) return false
  const arms = n.edges.map((k) => graph.edges.get(k)!).filter((e) => drives(e))
  return arms.length >= 3 && arms.every((e) => e.walk >= 1.2)
}
const signals = new Signals(graph, lit)
// DENSITY=<cars per km> to try another density than the shipped 'dense'
const traffic = new Traffic(graph, process.env.DENSITY ? { density: Number(process.env.DENSITY), range: 230 } : 'dense', { signals, lookAhead: process.env.LOOKAHEAD !== '0' })
const edges = [...graph.edges.values()]
const still = new Map<number, number>()
const dt = 0.05
let worst = 0
let jammed: Vehicle[] = []
const overlaps = new Map<string, number>()
let deep = 0
const deepPairs = new Map<string, { n: number; what: string }>()
const overlapSamples: string[] = []
// TURNS IN ONE STEP (owner, 2026-10-02: "cars turning left seem to stop, then jump 90 degrees instead of moving
// smoothly"): a heading change of more than 20° between two steps, by what the car was doing
const lastHeading = new Map<number, { h: number; edge: number }>()
const jumps = new Map<string, number>()
const jumpSamples: string[] = []
for (let t = 0; t < seconds; t += dt) {
  traffic.update(dt, at, edges)
  // DEBUG_EDGE=<id>: every vehicle on that edge (or in a box onto it) every 5 s
  if (process.env.DEBUG_EDGE && Math.abs(t % 5) < dt / 2) {
    const id = Number(process.env.DEBUG_EDGE)
    const on = traffic.all.filter((v) => v.edgeId === id || v.next?.edgeId === id)
    if (on.length) console.log(`t=${t.toFixed(0)} e${id}: ` + on.map((v) => `${v.id}@${v.edgeId === id ? 's' + v.s.toFixed(1) : 'e' + v.edgeId + ':' + v.s.toFixed(1)} v${v.speed.toFixed(1)} ${v.why ?? '-'}${v.inBox ? ' box' + v.inBox.nodeId : ''}${v.refused ? ' ref:' + v.refused : ''}`).join(' | '))
  }
  for (const v of traffic.all) {
    if (v.speed < 0.1) still.set(v.id, (still.get(v.id) ?? 0) + dt)
    else still.delete(v.id)
    const was = lastHeading.get(v.id)
    if (was) {
      let dh = v.heading - was.h
      while (dh > Math.PI) dh -= 2 * Math.PI
      while (dh < -Math.PI) dh += 2 * Math.PI
      if (Math.abs(dh) > (20 * Math.PI) / 180) {
        const k = `${v.inBox ? `in box ${v.inBox.turn}` : v.next ? `approaching ${v.next.turn}` : 'on street'}${was.edge !== v.edgeId ? ', changed edge' : ''}, ${v.speed < 0.3 ? 'standing' : 'moving'}`
        jumps.set(k, (jumps.get(k) ?? 0) + 1)
        const ee = graph.edges.get(v.edgeId)
        if (jumpSamples.length < 12 && v.speed >= 0.3) jumpSamples.push(`${Math.round((Math.abs(dh) * 180) / Math.PI)}° ${v.kind} ${v.id} e${was.edge}→e${v.edgeId} len ${ee?.length.toFixed(1)} s ${v.s.toFixed(1)} dir ${v.dir} v ${v.speed.toFixed(1)} box ${v.inBox ? `${v.inBox.nodeId} from e${v.inBox.from}` : '-'} next ${v.next ? `e${v.next.edgeId} ${v.next.turn}` : '-'} ends ${ee?.a}/${ee?.b} pts ${ee?.points.length} | ${k}`)
      }
    }
    lastHeading.set(v.id, { h: v.heading, edge: v.edgeId })
  }
  // cars THROUGH cars (owner: "I still see vehicles going through other vehicles, especially at intersections"):
  // every second, each overlapping pair, and where — both in a junction, one, or neither
  if (Math.round(t / dt) % Math.round(1 / dt) === 0) {
    const all = traffic.all
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j]
      if (Math.abs(a.at.x - b.at.x) > 14 || Math.abs(a.at.z - b.at.z) > 14) continue
      if (!overlap(traffic.boxOf(a), traffic.boxOf(b))) continue
      const where = a.inBox && b.inBox ? 'both in box' : a.inBox || b.inBox ? 'one in box' : 'on street'
      // DEEP: still overlapping with both boxes shrunk to 70% — one car visibly inside another, not a touch
      const shrink = (x: ReturnType<typeof traffic.boxOf>) => ({ ...x, halfLen: x.halfLen * 0.7, halfWid: x.halfWid * 0.7 })
      if (overlap(shrink(traffic.boxOf(a)), shrink(traffic.boxOf(b)))) {
        deep++
        const pk = `${a.id}×${b.id}`
        const was = deepPairs.get(pk)
        deepPairs.set(pk, { n: (was?.n ?? 0) + 1, what: was?.what ?? `${a.kind} ${a.id}[e${a.edgeId}/${graph.edges.get(a.edgeId)!.length.toFixed(0)} s${a.s.toFixed(1)} v${a.speed.toFixed(1)} ${a.inBox ? 'box ' + a.inBox.turn : 'street'} why:${a.why ?? '-'}] × ${b.kind} ${b.id}[e${b.edgeId}/${graph.edges.get(b.edgeId)!.length.toFixed(0)} s${b.s.toFixed(1)} v${b.speed.toFixed(1)} ${b.inBox ? 'box ' + b.inBox.turn : 'street'} why:${b.why ?? '-'}]` })
      }
      const moving = (a.speed > 0.5 ? 1 : 0) + (b.speed > 0.5 ? 1 : 0)
      const ang = Math.round(Math.abs(Math.atan2(Math.sin(a.heading - b.heading), Math.cos(a.heading - b.heading))) * 180 / Math.PI / 30) * 30
      const k = `${where} ${a.kind}/${b.kind} moving${moving} ~${ang}°`
      overlaps.set(k, (overlaps.get(k) ?? 0) + 1)
      if (overlapSamples.length < 6) overlapSamples.push(`${k}: ${a.id}[e${a.edgeId} s${a.s.toFixed(1)} v${a.speed.toFixed(1)} ${a.inBox?.turn ?? ''} why:${a.why ?? '-'}] × ${b.id}[e${b.edgeId} s${b.s.toFixed(1)} v${b.speed.toFixed(1)} ${b.inBox?.turn ?? ''} why:${b.why ?? '-'}]`)
    }
  }
  if (Math.round(t / dt) % Math.round(30 / dt) === 0) {
    const stuck = traffic.all.filter((v) => (still.get(v.id) ?? 0) > STUCK)
    worst = Math.max(worst, stuck.length)
    const moving = traffic.all.filter((v) => v.speed > 0.5).length
    console.log(`t=${t.toFixed(0)}s  vehicles ${traffic.all.length}  moving ${moving}  stuck>${STUCK}s ${stuck.length}`)
    jammed = stuck
  }
}
console.log(`heading jumps > 20° in one step: ${[...jumps.values()].reduce((p, q) => p + q, 0)}`, JSON.stringify(Object.fromEntries(jumps)))
for (const j of jumpSamples) console.log('  ' + j)
console.log(`deep overlaps (pair-seconds): ${deep}, distinct pairs ${deepPairs.size}`)
for (const [, x] of [...deepPairs].sort((p, q) => q[1].n - p[1].n).slice(0, 8)) console.log(`  ${x.n}s  ${x.what}`)
console.log('overlapping pairs (pair-seconds):', JSON.stringify(Object.fromEntries(overlaps)))
for (const x of overlapSamples) console.log('  ' + x)
if (jammed.length === 0) { console.log(`no jam: nothing stood still for ${STUCK} s (worst count ${worst})`); process.exit(0) }
// the chain: follow each stuck car's `why` to the car it waits for
const byId = new Map(traffic.all.map((v) => [v.id, v]))
const shown = new Set<number>()
for (const v of jammed.slice(0, 6)) {
  if (shown.has(v.id)) continue
  const chain: string[] = []
  let cur: Vehicle | undefined = v
  for (let k = 0; cur && k < 12; k++) {
    shown.add(cur.id)
    const e = graph.edges.get(cur.edgeId)!
    const node = cur.dir > 0 ? e.b : e.a
    const c = signals.control(node)
    chain.push(`${cur.id}[e${cur.edgeId}${cur.dir > 0 ? '→' : '←'} s${cur.s.toFixed(1)}/${e.length.toFixed(0)} v${cur.speed.toFixed(2)} cruise${cur.cruise.toFixed(1)} ${c.kind}${cur.inBox ? ` box${cur.inBox.nodeId === node ? '' : `(prev ${cur.inBox.nodeId} from ${cur.inBox.from})`}:${cur.inBox.turn}` : ''} next:${cur.next ? cur.next.edgeId + cur.next.turn : '-'}] ${cur.why ?? 'nothing'}${cur.why === 'may not enter' ? ` (${cur.refused})` : ''}`)
    const m = /car (\d+)/.exec(cur.why ?? '')
    cur = m ? byId.get(Number(m[1])) : undefined
    if (cur && shown.has(cur.id)) { chain.push(`→ back to ${cur.id} (a cycle)`); break }
  }
  console.log('\n  ' + chain.join('\n    waits for '))
  // who is "in" the junction the head of the chain is refused at
  const head = byId.get(Number(/^(\d+)/.exec(chain[chain.length - 1] ?? '')?.[1] ?? -1))
  if (head && head.refused === 'junction busy') {
    const he = graph.edges.get(head.edgeId)!
    const node = head.dir > 0 ? he.b : he.a
    const inIt = traffic.all.filter((o) => o.inBox?.nodeId === node)
    console.log(`    junction ${node} holds: ` + inIt.map((o) => `${o.id}[e${o.edgeId}${o.dir > 0 ? '→' : '←'} s${o.s.toFixed(1)}/${graph.edges.get(o.edgeId)!.length.toFixed(0)} v${o.speed.toFixed(2)} from e${o.inBox!.from} ${o.inBox!.turn} next:${o.next ? o.next.edgeId : '-'} why:${o.why ?? '-'}${o.why === 'may not enter' ? `(${o.refused})` : ''}]`).join(', '))
  }
}
process.exit(1)
