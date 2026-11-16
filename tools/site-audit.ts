/** compact anomaly audit per site in a baked city: npx tsx site-audit.ts <city> name:lat,lon ... (R env, default 60) */
import { readPackage, readV2 } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { unpackPoints, onSurface } from '../src/city/package.ts'
import { Projection } from '../src/city/geo.ts'
import { ignLidar } from './ign-lidar.ts'
const [city, ...sites] = process.argv.slice(2), R = Number(process.env.R ?? 60), V = process.env.V === '1'
const pkg = readPackage(city), v2 = readV2(city), terrain = new Terrain(pkg.terrain)
for (const t of v2.tiles) { const [tx, tz] = t.key.split(',').map(Number); terrain.addTile(tx, tz, t.terrain) }
const proj = new Projection(v2.index.origin), datum = (v2.index as unknown as { datumMsl?: number }).datumMsl ?? 32.94
const edges = pkg.edges.map((e) => ({ e, p: unpackPoints(e.points) }))
const f = (v: number) => v.toFixed(1)
const segD = (x: number, z: number, a: { x: number; z: number }, b: { x: number; z: number }) => { const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L)) : 0; return Math.hypot(a.x + t * dx - x, a.z + t * dz - z) }
for (const s of sites) {
  const [name, ll] = s.split(':'), [lat, lon] = ll.split(',').map(Number), c = proj.toLocal({ lat, lon })
  const d = 0.0012, mnt = await ignLidar({ south: lat - d, north: lat + d, west: lon - d * 1.5, east: lon + d * 1.5 }, 512)
  const M = (x: number, z: number) => { const q = proj.toLatLon({ x, z }), v = mnt.at(q.lat, q.lon); return v === null ? NaN : v - datum }
  const near = edges.filter(({ p }) => p.some((q) => Math.hypot(q.x - c.x, q.z - c.z) < R))
  const out: string[] = [], tally: Record<string, number> = {}
  const add = (k: string, line: string) => { tally[k] = (tally[k] ?? 0) + 1; if (V) out.push(`  ${k}: ${line}`) }
  const flag = (e: typeof near[0]['e']) => `${e.id} ${e.kind}${e.name ? ' "' + e.name + '"' : ''} ${e.bridge ? 'B' : ''}${e.tunnel ? 'T' : ''}${e.ramp ? 'R' : ''}${e.cut ? 'C' : ''}${e.bore ? 'O' : ''}${e.lid ? 'Li' : ''}${e.trench ? 'Tr' : ''} L${e.layer ?? 0}`
  for (const { e, p } of near) {
    // (only what the game draws: a way off the surface — a tunnel, a layer −2 passage — is never seen or ridden; a bore is)
    if (!e.heights || (!onSurface(e) && !e.bore)) continue
    if (e.ramp) add('rampFlag', flag(e))
    if (e.bridge) { let lo = Infinity; p.forEach((q, i) => { lo = Math.min(lo, e.heights![i] - terrain.rawHeightAt(q.x, q.z)) }); continue }
    let bur = 0, flo = 0, vsM = 0
    p.forEach((q, i) => {
      const g = terrain.rawHeightAt(q.x, q.z), h = e.heights![i]
      if (!e.tunnel && !e.cut && !e.bore && h < g - 0.8) bur = Math.max(bur, g - h)
      if (!e.ramp && h > g + 1.5) flo = Math.max(flo, h - g)
      const m = M(q.x, q.z); if (Number.isFinite(m) && Math.abs(h - m) > Math.abs(vsM)) vsM = h - m
    })
    if (bur) add('buriedWay', `${flag(e)} ${f(bur)} m under ground`)
    if (flo) add('floatingWay', `${flag(e)} ${f(flo)} m over ground`)
    if (Math.abs(vsM) > 2.5 && !e.tunnel) add('wayVsLidar', `${flag(e)} ${f(vsM)} vs MNT`)
    for (let i = 1; i < p.length; i++) {
      const L = Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z), g = Math.abs(e.heights[i] - e.heights[i - 1]) / Math.max(L, 1)
      if (L > 1.5 && g > 0.12 && e.kind !== 'steps') { add('steep', `${flag(e)} ${(g * 100).toFixed(0)}% over ${f(L)} m`); break }
    }
  }
  // junction height mismatches: endpoints of different edges within 0.5 m with heights differing > 0.6 m (excluding bridge-over-road crossings: only shared endpoints)
  const ends = near.flatMap(({ e, p }) => e.heights ? [{ e, q: p[0], h: e.heights[0] }, { e, q: p[p.length - 1], h: e.heights[p.length - 1] }] : [])
  for (let i = 0; i < ends.length; i++) for (let j = i + 1; j < ends.length; j++) {
    const a = ends[i], b = ends[j]
    if (a.e !== b.e && Math.hypot(a.q.x - b.q.x, a.q.z - b.q.z) < 0.5 && Math.abs(a.h - b.h) > 0.6) add('junctionStep', `${flag(a.e)} ${f(a.h)} | ${flag(b.e)} ${f(b.h)}`)
  }
  // ground vs lidar MNT on a 3 m grid (skip where no MNT)
  let n = 0, hi = 0, lo = 0, worst = 0; const cls: Record<string, number> = {}, spots: string[] = []
  for (let x = c.x - R; x <= c.x + R; x += 3) for (let z = c.z - R; z <= c.z + R; z += 3) {
    if (Math.hypot(x - c.x, z - c.z) > R) continue
    const m = M(x, z); if (!Number.isFinite(m)) continue
    const dd = terrain.rawHeightAt(x, z) - m; n++
    if (dd > 2) hi++; if (dd < -2) lo++; if (Math.abs(dd) > Math.abs(worst)) worst = dd
    if (dd < -2.5 || dd > 2.5) {
      const dist = (pred: (e: typeof near[0]['e']) => boolean) => Math.min(...near.filter((x) => pred(x.e)).map(({ p }) => Math.min(...p.slice(1).map((q, i) => segD(x, z, p[i], q)))), 1e9)
      const k = m < -5 ? 'water' : dist((e) => !!e.bridge) < 7 ? 'underDeck' : dist((e) => !!(e.cut || e.trench || e.tunnel || e.bore || (e.layer ?? 0) < 0)) < 9 ? 'trenchCorr' : dist(() => true) < 6 ? 'onRoad' : 'open'
      cls[(dd > 0 ? 'hi:' : 'lo:') + k] = (cls[(dd > 0 ? 'hi:' : 'lo:') + k] ?? 0) + 1
      if (k === 'open' || k === 'onRoad') { const q = proj.toLatLon({ x, z }); spots.push(`${q.lat.toFixed(6)},${q.lon.toFixed(6)} ${f(dd)}`) }
    }
  }
  const kinds = { bridge: near.filter((x) => x.e.bridge).length, tunnel: near.filter((x) => x.e.tunnel).length, layered: near.filter((x) => (x.e.layer ?? 0) !== 0).length }
  console.log(`${name} (${lat},${lon}) R${R}: ${near.length} ways (B${kinds.bridge} T${kinds.tunnel} L≠0 ${kinds.layered}); ground vs MNT: ${hi}/${n} >2 m high, ${lo}/${n} >2 m low, worst ${f(worst)}; ${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  console.log(`   ground off MNT by class: ${JSON.stringify(cls)}  e.g. ${spots.filter((_, i) => i % 7 === 0).slice(0, 5).join('; ')}`)
  if (V) console.log(out.slice(0, 40).join('\n'))
}
