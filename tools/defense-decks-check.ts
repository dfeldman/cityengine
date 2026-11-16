/** La Défense decks at BD TOPO heights, tried on the baked package (no bake, nothing written): npx tsx tools/defense-decks-check.ts [city] */
import { readPackage, readV2 } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { Projection } from '../src/city/geo.ts'
import { region } from '../src/city/region.ts'
import { fetchBdTopo, fillNoZ, btSegs, segIndex } from './bdtopo-zones.ts'
import { stairsAtDeckEnds, btFootDecks, btOffset, capUnderDecks, dalleHeight, dalleVerts } from './defense-decks.ts'
import { alignDeckEnds } from './bridges.ts'
const city = process.argv[2] ?? 'paris-centre'
const pkg = readPackage(city), t = new Terrain(pkg.terrain)
for (const tl of readV2(city).tiles) { const [a, b] = tl.key.split(',').map(Number); t.addTile(a, b, tl.terrain) }
const proj = new Projection(pkg.origin), g0 = (x: number, z: number): number => t.rawHeightAt(x, z)
let g = g0
for (const c of region('paris').footBridgeLayers ?? []) {
  const dLat = c.radius / 111200, dLon = c.radius / (111200 * Math.cos(c.lat * Math.PI / 180))
  const fs = await fetchBdTopo('troncon_de_route', c.lat - dLat, c.lon - dLon, c.lat + dLat, c.lon + dLon); fillNoZ(fs)
  const segs = segIndex(btSegs(fs, (lat, lon) => proj.toLocal({ lat, lon })))
  const cap = [{ ...proj.toLocal({ lat: c.lat, lon: c.lon }), radius: c.radius }]
  const off = btOffset(pkg.edges, segs, cap)
  console.log(`${c.name}: offset NGF − ${off?.toFixed(2)}`)
  if (off === null) continue
  // the dalle lift, as the bake would lay it (DALLE_BT), and the at-grade ways re-draped on it
  if (process.env.DALLE_BT !== '0') {
    const verts = dalleVerts(fs, (lat, lon) => proj.toLocal({ lat, lon }), off)
    const memo = new Map<string, number>()
    g = (x, z) => { const k = `${Math.round(x)},${Math.round(z)}`; let v = memo.get(k); if (v === undefined) { const b = g0(x, z); v = dalleHeight(verts, x, z, b) ?? b; memo.set(k, v) } return v }
    let raised = 0
    for (const e of pkg.edges) {
      if (e.bridge || e.tunnel || !e.heights) continue
      const p = e.points; let ch = false
      e.heights = e.heights.map((h, i) => { const x = p[2 * i], z = p[2 * i + 1]; if (!cap.some((c) => Math.hypot(x - c.x, z - c.z) < c.radius)) return h; const d = g(x, z) - g0(x, z); if (d > 0.05) ch = true; return h + d })
      if (ch) raised++
    }
    console.log(`  dalle lift: ${raised} at-grade ways re-draped`)
  }
  const before = new Map(pkg.edges.filter((e) => e.bridge && e.foot).map((e) => [e.id, [...(e.heights ?? [])]]))
  const ids = btFootDecks(pkg.edges, segs, cap, off, g)
  alignDeckEnds(pkg.edges as any, cap)
  console.log(`  ${stairsAtDeckEnds(pkg.edges, cap).length} ways made or re-sloped as flights (stairsAtDeckEnds)`)
  console.log(`  ${ids.length} foot decks moved`)
  for (const e of pkg.edges) if (ids.includes(e.id)) { const b = before.get(e.id) ?? e.heights!, h = e.heights!; console.log(`  ${e.id} ${e.name ?? ''}: ${Math.min(...b).toFixed(1)}–${Math.max(...b).toFixed(1)} → ${Math.min(...h).toFixed(1)}–${Math.max(...h).toFixed(1)}`) }
  // the ends of foot decks in the zone, against the ground and the ways that meet them
  const byNode = new Map<number, typeof pkg.edges>()
  for (const e of pkg.edges) for (const n of [e.a, e.b]) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
  const endStep = (e: any, n: number, h: number, hsOf: (o: any) => number[]): number => {
    const others = (byNode.get(n) ?? []).filter((o) => o !== e && o.heights)
    return others.length ? Math.min(...others.map((o) => { const hh = hsOf(o); return Math.abs((o.a === n ? hh[0] : hh[hh.length - 1]) - h) })) : NaN
  }
  console.log('  ends standing > 1 m off the ground with no way at their level (NEW = worse than before by > 1 m):')
  for (const e of pkg.edges) {
    if (!e.bridge || !e.foot || !e.heights) continue
    const p = e.points
    for (const [n, x, z, h] of [[e.a, p[0], p[1], e.heights[0]], [e.b, p[p.length - 2], p[p.length - 1], e.heights[e.heights.length - 1]]]) {
      if (!cap.some((c) => Math.hypot(x - c.x, z - c.z) < c.radius)) continue
      const step = h - g(x, z)
      if (Math.abs(step) <= 1) continue
      const others = (byNode.get(n) ?? []).filter((o) => o !== e && o.heights)
      const met = others.some((o) => Math.abs((o.a === n ? o.heights![0] : o.heights![o.heights!.length - 1]) - h) <= 1)
      if (met) continue
      const bh = before.get(e.id), hb = bh ? (n === e.a ? bh[0] : bh[bh.length - 1]) : h
      const was = endStep(e, n, hb, (o) => before.get(o.id) ?? o.heights), now = endStep(e, n, h, (o) => o.heights)
      const tag = Number.isNaN(now) ? (Math.abs(step) > Math.abs(hb - g(x, z)) + 1 ? 'NEW' : '') : now > was + 1 ? 'NEW' : ''
      const ll = proj.toLatLon ? proj.toLatLon({ x, z }) : null
      console.log(`  ${tag} ${e.id} ${e.name ?? ''} ${ids.includes(e.id) ? '(moved)' : ''} at ${x.toFixed(0)},${z.toFixed(0)}${ll ? ` (${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)})` : ''}: deck ${h.toFixed(1)}, ground ${(h - step).toFixed(1)}, step ${step.toFixed(1)}, ${others.length ? `${others.length} way(s) off its level` : 'joined to nothing'}`)
    }
  }
  const capped = capUnderDecks(pkg.buildings, pkg.edges, g, new Set(), (x, z) => cap.some((c) => Math.hypot(x - c.x, z - c.z) < c.radius))
  console.log(`  generic buildings a deck runs through, capped: ${capped.join(', ') || 'none'} (landmark claims not excluded here)`)
}
