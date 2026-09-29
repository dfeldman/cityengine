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
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CityIndex, TileData } from '../src/city/tiles.ts'
import { Terrain } from '../src/city/terrain.ts'
import { mapEdges } from '../src/city/ridefile.ts'
import { addEdges, type CityGraph } from '../src/city/graph.ts'
import { onSurface } from '../src/city/package.ts'
import { Signals, drives } from '../src/sim/signals.ts'
import { Traffic, type Vehicle } from '../src/sim/traffic.ts'

const args = process.argv.slice(2).filter((a) => a !== '--')
const city = args[0] ?? 'sf-mini'
const seconds = Number(args[1] ?? 600)
const at = { x: Number(args[2] ?? 0), z: Number(args[3] ?? 0) }
const STUCK = 60
const dir = join('public/cities', city)
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8')) as CityIndex
const terrain = new Terrain(null)
const graph: CityGraph = { nodes: new Map(), edges: new Map() }
for (const e of index.tiles) {
  if (Math.hypot((e.tx + 0.5) * 200 - at.x, (e.tz + 0.5) * 200 - at.z) > 800) continue
  const f = join(dir, 'tiles', `${e.tx}_${e.tz}.json`)
  if (!existsSync(f)) continue
  const t = JSON.parse(readFileSync(f, 'utf8')) as TileData
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
const traffic = new Traffic(graph, process.env.DENSITY ? { density: Number(process.env.DENSITY), range: 230 } : 'dense', { signals })
const edges = [...graph.edges.values()]
const still = new Map<number, number>()
const dt = 0.05
let worst = 0
let jammed: Vehicle[] = []
for (let t = 0; t < seconds; t += dt) {
  traffic.update(dt, at, edges)
  for (const v of traffic.all) {
    if (v.speed < 0.1) still.set(v.id, (still.get(v.id) ?? 0) + dt)
    else still.delete(v.id)
  }
  if (Math.round(t / dt) % Math.round(30 / dt) === 0) {
    const stuck = traffic.all.filter((v) => (still.get(v.id) ?? 0) > STUCK)
    worst = Math.max(worst, stuck.length)
    const moving = traffic.all.filter((v) => v.speed > 0.5).length
    console.log(`t=${t.toFixed(0)}s  vehicles ${traffic.all.length}  moving ${moving}  stuck>${STUCK}s ${stuck.length}`)
    jammed = stuck
  }
}
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
