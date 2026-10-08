/**
 * TANGLED INTERSECTIONS, found by machine (owner, 2026-10-07: "we need to have a process for detecting these, they make no
 * sense, because of course OSM was not designed for this application").
 *
 * OSM maps what is legally and topologically true — every carriageway, slip lane, driveway and lane-count change — and the
 * renderer draws each as its own strip with its own junction hull. Four patterns turn a corner into a tangle, each seen in
 * an owner report:
 *
 *   cluster    three or more drivable junctions within CLUSTER_R of each other (Market–Duboce–Buchanan at the Mint, the
 *              dual carriageways of Dolores and Market): hulls overlap into a ragged pad.
 *   driveway   a service way meeting a street within DRIVEWAY_R of another junction (Dolores between 17th and 18th): its
 *              junction pad spreads under the buildings.
 *   widthStep  the same street running straight through a node with a width jump over STEP_M (Taylor at Turk, one lane
 *              tagged against three): the arms do not line up.
 *   overlap    a same-named one-way pair whose surfaces overlap (Powell's two halves): together wider than the street.
 *
 * It reads the map exactly as the game draws it — v3 tiles with the patches applied — through the running dev server,
 * scores each finding, and writes docs/JUNCTION-AUDIT.md plus top-down views ("JX …") for the worst, so a person can look
 * at a contact sheet and decide what to patch.
 *
 *   npx vite-node tools/junction-audit.ts -- [--city=san-francisco] [--top=36] [--views] [--server=http://localhost:5200/]
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { openV3 } from '../src/map/store.ts'
import { unpackPoints, type PackedEdge } from '../src/city/package.ts'
import { Projection } from '../src/city/geo.ts'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'san-francisco')
const server = arg('server', 'http://localhost:5200/')
const TOP = Number(arg('top', '36'))
const CLUSTER_R = 18
const DRIVEWAY_R = 14
const STEP_M = 3
const ROOT = resolve(import.meta.dirname, '..')

const NOT_DRIVEN = new Set(['footway', 'steps', 'path', 'cycleway', 'pedestrian', 'track', 'bridleway', 'busway', 'construction', 'platform', 'corridor'])
type P = { x: number; z: number }
interface E { id: number; a: number; b: number; pts: P[]; width: number; kind: string; name?: string; oneway: boolean; service: boolean }

const src = await openV3(server, city)
if (!src) { console.error(`no v3 city at ${server}cities/${city}/v3 — is the dev server running?`); process.exit(1) }
const idx = await (await fetch(`${server}cities/${city}/v3/index.json`)).json() as { tiles: { key: string }[]; origin: { lat: number; lon: number } }
const proj = new Projection(idx.origin)

// ---- every drivable edge in the city, once (an edge crossing a tile edge is in both tiles)
const edges = new Map<number, E>()
let n = 0
for (const t of idx.tiles) {
  const tile = await src.load(t.key)
  if (!tile) continue
  for (const e of (tile.edges ?? []) as (PackedEdge & { kind?: string; oneway?: boolean; tunnel?: boolean; bridge?: boolean; layer?: number })[]) {
    if (e.foot || NOT_DRIVEN.has(e.kind ?? '') || e.tunnel || (e.layer ?? 0) !== 0 || edges.has(e.id)) continue
    edges.set(e.id, { id: e.id, a: e.a, b: e.b, pts: unpackPoints(e.points), width: e.width, kind: e.kind ?? 'residential', name: e.name, oneway: !!e.oneway, service: e.kind === 'service' })
  }
  if (++n % 500 === 0) process.stdout.write(`  ${n}/${idx.tiles.length} tiles\r`)
}
console.log(`${edges.size} drivable edges`)

// ---- nodes: position and the edges at each
const at = new Map<number, P>()
const arms = new Map<number, E[]>()
for (const e of edges.values()) {
  for (const [id, p] of [[e.a, e.pts[0]], [e.b, e.pts[e.pts.length - 1]]] as [number, P][]) {
    at.set(id, p)
    const l = arms.get(id) ?? []
    l.push(e)
    arms.set(id, l)
  }
}
const junctions = [...arms.entries()].filter(([, l]) => l.length >= 3).map(([id]) => id)
// a grid for neighbour queries
const CELL = 30
const grid = new Map<string, number[]>()
const key = (x: number, z: number): string => `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`
for (const id of junctions) { const p = at.get(id)!; const k = key(p.x, p.z); (grid.get(k) ?? grid.set(k, []).get(k)!).push(id) }
const near = (p: P, r: number): number[] => {
  const out: number[] = []
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (const id of grid.get(`${Math.floor(p.x / CELL) + dx},${Math.floor(p.z / CELL) + dz}`) ?? []) {
      const q = at.get(id)!
      if (Math.hypot(q.x - p.x, q.z - p.z) <= r) out.push(id)
    }
  }
  return out
}

interface Finding { kind: 'cluster' | 'driveway' | 'widthStep' | 'overlap'; at: P; score: number; what: string }
const findings: Finding[] = []

// ---- cluster: union-find over junctions within CLUSTER_R, counting the non-service ones
{
  const parent = new Map<number, number>()
  const find = (x: number): number => { while (parent.get(x) !== x) { const g = parent.get(parent.get(x)!)!; parent.set(x, g); x = g } return x }
  for (const id of junctions) parent.set(id, id)
  for (const id of junctions) for (const o of near(at.get(id)!, CLUSTER_R)) if (o !== id) parent.set(find(id), find(o))
  const groups = new Map<number, number[]>()
  for (const id of junctions) { const r = find(id); (groups.get(r) ?? groups.set(r, []).get(r)!).push(id) }
  for (const g of groups.values()) {
    if (g.length < 3) continue
    const names = new Set<string>()
    let service = 0
    for (const id of g) for (const e of arms.get(id)!) { if (e.service) service++; else if (e.name) names.add(e.name) }
    // (a car park's aisles are all service ways: a tangle nobody rides through)
    if (names.size === 0) continue
    const c = { x: g.reduce((s, id) => s + at.get(id)!.x, 0) / g.length, z: g.reduce((s, id) => s + at.get(id)!.z, 0) / g.length }
    findings.push({ kind: 'cluster', at: c, score: g.length * 2 + service, what: `${g.length} junctions within ${CLUSTER_R} m: ${[...names].slice(0, 5).join(', ')}${service ? ` (+${service} service arms)` : ''}` })
  }
}
// ---- driveway: a service arm at a junction that has another (street) junction within DRIVEWAY_R
for (const id of junctions) {
  const l = arms.get(id)!
  const svc = l.filter((e) => e.service)
  const streets = l.filter((e) => !e.service)
  if (!svc.length || streets.length < 2) continue
  const p = at.get(id)!
  const other = near(p, DRIVEWAY_R).filter((o) => o !== id && arms.get(o)!.filter((e) => !e.service).length >= 3)
  if (!other.length) continue
  findings.push({ kind: 'driveway', at: p, score: 3 + other.length, what: `service way into ${streets.map((e) => e.name ?? e.kind).filter((v, i, a) => a.indexOf(v) === i).join(' / ')}, ${Math.round(Math.min(...other.map((o) => Math.hypot(at.get(o)!.x - p.x, at.get(o)!.z - p.z))))} m from a junction` })
}
// ---- widthStep: same-named arms straight through a node with a width jump
for (const [id, l] of arms) {
  const p = at.get(id)!
  for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) {
    const e = l[i], f = l[j]
    if (!e.name || e.name !== f.name || Math.abs(e.width - f.width) < STEP_M) continue
    const dir = (x: E): P => { const q = x.a === id ? x.pts[Math.min(1, x.pts.length - 1)] : x.pts[Math.max(0, x.pts.length - 2)]; const L = Math.hypot(q.x - p.x, q.z - p.z) || 1; return { x: (q.x - p.x) / L, z: (q.z - p.z) / L } }
    const u = dir(e), v = dir(f)
    if (u.x * v.x + u.z * v.z > -0.94) continue        // not straight through (within ~20°)
    findings.push({ kind: 'widthStep', at: p, score: Math.abs(e.width - f.width), what: `${e.name}: ${e.width.toFixed(1)} m meets ${f.width.toFixed(1)} m` })
  }
}
// ---- overlap: one-way pairs, same name, near-parallel, closer than their half-widths
{
  const byName = new Map<string, E[]>()
  for (const e of edges.values()) if (e.oneway && e.name && !e.service) (byName.get(e.name) ?? byName.set(e.name, []).get(e.name)!).push(e)
  const seen = new Set<string>()
  for (const [name, list] of byName) {
    for (const e of list) {
      const m = e.pts[Math.floor(e.pts.length / 2)]
      for (const f of list) {
        if (f.id <= e.id) continue
        // distance from e's middle to f's polyline, and whether the two run (anti)parallel
        // (a split pair runs the OTHER way and alongside: e's middle lands inside one of f's segments, not past its
        //  end — the next block of the same one-way street lies ahead of it, in line, and is no pair)
        if (e.a === f.a || e.a === f.b || e.b === f.a || e.b === f.b) continue
        let best = Infinity, dot = 0, inside = false
        const ea = e.pts[0], eb = e.pts[e.pts.length - 1], El = Math.hypot(eb.x - ea.x, eb.z - ea.z) || 1
        for (let k = 1; k < f.pts.length; k++) {
          const a = f.pts[k - 1], b = f.pts[k], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1
          const t0 = ((m.x - a.x) * dx + (m.z - a.z) * dz) / L2
          const t = Math.max(0, Math.min(1, t0))
          const d = Math.hypot(a.x + t * dx - m.x, a.z + t * dz - m.z)
          if (d < best) { best = d; inside = t0 > 0.02 && t0 < 0.98; const L = Math.sqrt(L2); dot = (dx / L) * ((eb.x - ea.x) / El) + (dz / L) * ((eb.z - ea.z) / El) }
        }
        const gap = best - (e.width + f.width) / 2
        if (inside && best > 1 && best < 40 && dot < -0.9 && gap < -1) {
          const k = `${name}:${Math.round(m.x / 50)},${Math.round(m.z / 50)}`
          if (seen.has(k)) continue
          seen.add(k)
          findings.push({ kind: 'overlap', at: m, score: -gap, what: `${name}: two one-way halves ${best.toFixed(1)} m apart, ${(-gap).toFixed(1)} m of overlap` })
        }
      }
    }
  }
}

// ---- merge findings at the same place, rank, report
const merged: (Finding & { kinds: Set<string>; notes: string[] })[] = []
for (const f of findings.sort((a, b) => b.score - a.score)) {
  const m = merged.find((x) => Math.hypot(x.at.x - f.at.x, x.at.z - f.at.z) < 30)
  if (m) { m.score += f.score; m.kinds.add(f.kind); if (m.notes.length < 4) m.notes.push(f.what) } else merged.push({ ...f, kinds: new Set([f.kind]), notes: [f.what] })
}
merged.sort((a, b) => b.score - a.score)
const count = (k: string): number => findings.filter((f) => f.kind === k).length
const rows = merged.map((m, i) => {
  const ll = proj.toLatLon(m.at)
  return { rank: i + 1, lat: +ll.lat.toFixed(6), lon: +ll.lon.toFixed(6), score: +m.score.toFixed(1), kinds: [...m.kinds].join('+'), notes: m.notes.join('; ') }
})
const md = `# Junction audit — ${city} (${new Date().toISOString().slice(0, 10)})

Generated by \`npx vite-node tools/junction-audit.ts\` (see its header): the map as the game draws it, patches applied.
${edges.size} drivable edges, ${junctions.length} junctions. Findings: ${count('cluster')} clusters, ${count('driveway')} driveways at junctions,
${count('widthStep')} width steps, ${count('overlap')} overlapping one-way pairs — merged into ${merged.length} places.
Views of the top ${TOP}: "JX nn" (run with --views), contact sheets in docs/shots/views/${city}/.

| # | score | patterns | where | what |
|---:|---:|---|---|---|
${rows.slice(0, 300).map((r) => `| ${r.rank} | ${r.score} | ${r.kinds} | ${r.lat}, ${r.lon} | ${r.notes.replace(/\|/g, '/')} |`).join('\n')}
`
writeFileSync(resolve(ROOT, 'docs', 'JUNCTION-AUDIT.md'), md)
writeFileSync(resolve(ROOT, 'docs', 'junction-audit.json'), JSON.stringify(rows, null, 1))
console.log(`${merged.length} places; docs/JUNCTION-AUDIT.md`)
for (const r of rows.slice(0, 12)) console.log(`  ${r.rank}. ${r.score} ${r.kinds} ${r.lat},${r.lon}  ${r.notes.slice(0, 110)}`)

if (process.argv.includes('--views')) {
  const { execFileSync } = await import('node:child_process')
  for (const r of rows.slice(0, TOP)) {
    execFileSync('node', ['--experimental-strip-types', 'tools/aim-view.ts', `--city=${city}`, `--name=JX ${String(r.rank).padStart(2, '0')}`, `--at=${r.lat},${r.lon}`, '--from=180', '--dist=5', '--h=70', '--look=0'], { cwd: ROOT, stdio: 'ignore' })
  }
  console.log(`stored ${Math.min(TOP, rows.length)} views "JX nn"; shoot them with: node --experimental-strip-types tools/views.ts --city=${city} --only="JX "`)
}
