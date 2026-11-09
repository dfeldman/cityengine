/*
 * BD TOPO vs the baked mini city (2026-11-08): per OSM way within ME_NEAR m of a bridge, the baked heights (as NGF) against the
 * BD TOPO troncons matched by geometry, and the hand deck zone's level there; then the BD TOPO roads passing under the bridge.
 *   npx vite-node tools/bdtopo-measure.ts -- <city> "<bridge OSM name>" "<BD TOPO bridge name>"
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { readPackage } from './bake-files.ts'
import { Projection } from '../src/city/geo.ts'
import { DeckZone, type DeckZoneSpec } from './deck-zones.ts'
import { fetchBdTopo, fillNoZ, btSegs, btMatchEdge, btSol, btName } from './bdtopo-zones.ts'

const ME_NEAR = 150, ME_DATUM = 32.94, ME_BOX_PAD = 0.004
const [city = 'pont-national-mini', bridge = 'Pont National', btBridge = 'PONT NATIONAL'] = process.argv.slice(2).filter((a) => a !== '--')
const pkg = readPackage(city), proj = new Projection(pkg.origin), toL = (la: number, lo: number) => proj.toLocal({ lat: la, lon: lo })
const deck = pkg.edges.filter((e) => e.name === bridge && e.bridge)
const dpts: number[] = deck.flatMap((e) => e.points)
const near = (x: number, z: number) => { for (let i = 0; i < dpts.length; i += 2) if (Math.hypot(dpts[i] - x, dpts[i + 1] - z) < ME_NEAR) return true; return false }
const c = proj.toLatLon({ x: dpts[0], z: dpts[1] })
const [s, w, n, e] = [c.lat - ME_BOX_PAD, c.lon - ME_BOX_PAD * 1.5, c.lat + ME_BOX_PAD, c.lon + ME_BOX_PAD * 1.5]
const roads = await fetchBdTopo('troncon_de_route', s, w, n, e); fillNoZ(roads)
const segs = btSegs(roads, toL)
const zones = ((JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'src', 'city', 'regions.json'), 'utf8')).paris.deckZones ?? []) as DeckZoneSpec[]).map((z) => new DeckZone(z, toL, ME_DATUM))
type Row = { osm: number[]; bt: number[]; hand: number[]; bts: Set<string>; n: number; m: number }
const rows = new Map<string, Row>()
for (const ed of pkg.edges) {
  const p = ed.points; let any = false
  for (let i = 0; i < p.length; i += 2) if (near(p[i], p[i + 1])) { any = true; break }
  if (!any || ed.kind === 'steps') continue
  const key = `${ed.name ?? '(' + ed.kind + ')'}${ed.bridge ? ' [B]' : ''}${ed.tunnel ? ' [T]' : ''}`
  const r = rows.get(key) ?? { osm: [], bt: [], hand: [], bts: new Set(), n: 0, m: 0 }; rows.set(key, r)
  const mt = btMatchEdge(ed, segs)
  for (let i = 0; i < p.length / 2; i++) {
    if (!near(p[2 * i], p[2 * i + 1])) continue
    r.n++
    const m = mt[i]; if (!m) continue
    r.m++; r.bt.push(m.z); r.bts.add(`${btName(m.s.f) || '-'}/${m.s.f.props.nature}/${btSol(m.s.f)}`)
    if (ed.heights) r.osm.push(ed.heights[i] + ME_DATUM)
    const zn = zones.find((z) => z.inside(p[2 * i], p[2 * i + 1])); if (zn) r.hand.push(zn.levelAt(p[2 * i], p[2 * i + 1]) + ME_DATUM)
  }
}
const rng = (v: number[]) => v.length ? `${Math.min(...v).toFixed(1)}–${Math.max(...v).toFixed(1)}` : '   -   '
const avg = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length
console.log('way | matched/near pts | baked NGF | BD TOPO NGF | hand level | baked−BDT mean | BD TOPO troncons')
for (const [k, r] of [...rows].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (!r.m) { console.log(`${k} | 0/${r.n} | (no BD TOPO match)`); continue }
  const dif = r.osm.length ? (avg(r.osm) - avg(r.bt)).toFixed(1) : '-'
  console.log(`${k} | ${r.m}/${r.n} | ${rng(r.osm)} | ${rng(r.bt)} | ${rng(r.hand)} | ${dif} | ${[...r.bts].slice(0, 3).join('; ')}`)
}
// BD TOPO roads under the bridge: 2D crossings of non-bridge segments with the BD TOPO bridge's sol-1 segments
const top = segs.filter((g) => btSol(g.f) === '1' && btName(g.f) === btBridge), low = segs.filter((g) => btSol(g.f) !== '1')
const cross = (a: typeof segs[number], b: typeof segs[number]) => {
  const d = (a.bx - a.ax) * (b.bz - b.az) - (a.bz - a.az) * (b.bx - b.ax); if (!d) return null
  const t = ((b.ax - a.ax) * (b.bz - b.az) - (b.az - a.az) * (b.bx - b.ax)) / d, u = ((b.ax - a.ax) * (a.bz - a.az) - (b.az - a.az) * (a.bx - a.ax)) / d
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { t, u } : null
}
console.log(`\nunder ${btBridge} (sol 1):`)
for (const l of low) for (const t of top) {
  const x = cross(l, t); if (!x) continue
  const ll = proj.toLatLon({ x: l.ax + (l.bx - l.ax) * x.t, z: l.az + (l.bz - l.az) * x.t })
  console.log(`  ${(btName(l.f) || '(unnamed)').padEnd(22)} ${String(l.f.props.nature).padEnd(20)} sol ${btSol(l.f).padStart(2)} z ${(l.za + (l.zb - l.za) * x.t).toFixed(1)} under deck ${(t.za + (t.zb - t.za) * x.u).toFixed(1)} at ${ll.lat.toFixed(6)},${ll.lon.toFixed(6)}`)
}
