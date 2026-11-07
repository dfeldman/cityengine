/**
 * THE STRUCTURE AUDIT (owner, 2026-11-06: "the seine bridge ends (37*2) and peripheque overpasses and underpasses (about 250)"):
 * every Seine bridge's two ends and every place a way crosses the Boulevard Périphérique over or under it, from a city's bake-private
 * package, scored, then ridden and photographed in ONE browser session (the :5200 dev server), into an HTML sheet ranked worst first.
 *
 *   node --max-old-space-size=8192 --experimental-strip-types tools/structure-audit.ts [--city=paris-centre] [--limit=N] [--no-shots]
 *   → plans/structure-audit/<city>/index.html (+ thumbs/, spots.json)
 *
 * Per spot: the steepest way within AUDIT_R (not steps), how many are over STEEP, and a route across the structure (AUDIT_RUN m before
 * to AUDIT_RUN m after, along the way that crosses): its length over the straight distance, or "none".
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { Projection } from '../src/city/geo.ts'
import type { CityPackage, PackedEdge } from '../src/city/package.ts'

const AUDIT_R = 60
const STEEP = 0.15
const AUDIT_RUN = 70
const CLUSTER = 80
const BRIDGE_END_MERGE = 40
const THUMB = { width: 360, height: 220 }
/** the camera: this far back (south-west of the spot) and up */
const CAM_BACK = 55
const CAM_UP = 40

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'paris-centre')
const limit = Number(arg('limit', '0')) || Infinity
const ROOT = resolve(import.meta.dirname, '..')
const OUT = resolve(ROOT, 'plans', 'structure-audit', city)
mkdirSync(resolve(OUT, 'thumbs'), { recursive: true })

type P = { x: number; z: number }
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'tools', 'cache', 'bake', city, 'package.json'), 'utf8')) as CityPackage
const proj = new Projection(pkg.origin)
const pts = (e: PackedEdge): P[] => { const o: P[] = []; for (let i = 0; i < e.points.length; i += 2) o.push({ x: e.points[i], z: e.points[i + 1] }); return o }
const edges = pkg.edges.filter((e) => e.heights && e.heights.length * 2 === e.points.length)
console.log(`${city}: ${edges.length} ways`)

// ---- the river, for which bridges are the Seine's
const rivers = pkg.areas.filter((a) => a.kind === 'water' && a.river).map((a) => {
  const r: P[] = []; for (let i = 0; i < a.ring.length; i += 2) r.push({ x: a.ring[i], z: a.ring[i + 1] })
  return r
})
const inRing = (r: P[], x: number, z: number): boolean => {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) c = !c
  return c
}
const wet = (x: number, z: number): boolean => rivers.some((r) => inRing(r, x, z))

type Spot = { id: string; kind: 'bridge end' | 'périphérique'; name: string; at: P; along?: [P, P]; steepest?: number; steepWay?: string; over?: number; detour?: number | null; thumb?: string }
const spots: Spot[] = []

// ---- Seine bridge ends: chains of road bridge ways joined end to end, over the river
{
  const br = edges.filter((e) => e.bridge && !e.tunnel && !e.foot)
  const byNode = new Map<number, PackedEdge[]>()
  for (const e of br) for (const n of [e.a, e.b]) (byNode.get(n) ?? byNode.set(n, []).get(n)!).push(e)
  const seen = new Set<PackedEdge>()
  for (const e of br) {
    if (seen.has(e)) continue
    const chain: PackedEdge[] = [], todo = [e]
    seen.add(e)
    while (todo.length) {
      const c = todo.pop()!
      chain.push(c)
      for (const n of [c.a, c.b]) for (const o of byNode.get(n) ?? []) if (!seen.has(o) && (o.name ?? '') === (c.name ?? '')) { seen.add(o); todo.push(o) }
    }
    const all = chain.flatMap(pts)
    if (!all.some((q) => wet(q.x, q.z))) continue
    // its two ends: the chain's nodes used once
    const count = new Map<number, number>()
    for (const c of chain) for (const n of [c.a, c.b]) count.set(n, (count.get(n) ?? 0) + 1)
    const ends: P[] = []
    for (const c of chain) {
      const p = pts(c)
      if (count.get(c.a) === 1) ends.push(p[0])
      if (count.get(c.b) === 1) ends.push(p[p.length - 1])
    }
    for (const q of ends) {
      if (wet(q.x, q.z)) continue
      // across: from on the deck to off its end, straight on
      const near = all.reduce((b, p) => Math.abs(Math.hypot(p.x - q.x, p.z - q.z) - 40) < Math.abs(Math.hypot(b.x - q.x, b.z - q.z) - 40) ? p : b, all[0])
      const ux = (q.x - near.x) / (Math.hypot(q.x - near.x, q.z - near.z) || 1), uz = (q.z - near.z) / (Math.hypot(q.x - near.x, q.z - near.z) || 1)
      // (one per end: a bridge's lanes and pavements are separate chains, ending side by side)
      if (spots.some((o) => o.kind === 'bridge end' && Math.hypot(o.at.x - q.x, o.at.z - q.z) < BRIDGE_END_MERGE)) continue
      spots.push({ id: '', kind: 'bridge end', name: e.name ?? 'bridge', at: q, along: [near, { x: q.x + ux * AUDIT_RUN, z: q.z + uz * AUDIT_RUN }] })
    }
  }
}

// ---- the périphérique's crossings: a way crossing a périphérique way in plan, sharing no node with it
{
  const peri = edges.filter((e) => /^Boulevard Périphérique/.test(e.name ?? ''))
  const others = edges.filter((e) => !/^Boulevard Périphérique/.test(e.name ?? '') && !/^(service|steps)$/.test(e.kind ?? ''))
  const C = 60, B = new Map<string, { e: PackedEdge; a: P; b: P }[]>()
  for (const e of peri) { const p = pts(e); for (let i = 1; i < p.length; i++) { const k = `${Math.floor(p[i].x / C)},${Math.floor(p[i].z / C)}`; (B.get(k) ?? B.set(k, []).get(k)!).push({ e, a: p[i - 1], b: p[i] }) } }
  const raw: Spot[] = []
  for (const o of others) {
    const p = pts(o)
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i]
      const cands = new Set<{ e: PackedEdge; a: P; b: P }>()
      for (const q of [a, b]) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const s of B.get(`${Math.floor(q.x / C) + dx},${Math.floor(q.z / C) + dz}`) ?? []) cands.add(s)
      for (const s of cands) {
        if (s.e.a === o.a || s.e.a === o.b || s.e.b === o.a || s.e.b === o.b) continue
        const rx = b.x - a.x, rz = b.z - a.z, sx = s.b.x - s.a.x, sz = s.b.z - s.a.z, den = rx * sz - rz * sx
        if (Math.abs(den) < 1e-9) continue
        const t = ((s.a.x - a.x) * sz - (s.a.z - a.z) * sx) / den, w = ((s.a.x - a.x) * rz - (s.a.z - a.z) * rx) / den
        if (t < 0 || t > 1 || w < 0 || w > 1) continue
        const at = { x: a.x + rx * t, z: a.z + rz * t }, L = Math.hypot(rx, rz) || 1
        // (a route across only on a way a bike may take: not a motorway's or a trunk's)
        const rideable = !/^(motorway|trunk)(_link)?$/.test(o.kind ?? '')
        raw.push({ id: '', kind: 'périphérique', name: `${o.name ?? o.kind}${o.bridge ? ' (bridge)' : o.tunnel ? ' (tunnel)' : ''}`, at,
          along: rideable ? [{ x: at.x - (rx / L) * AUDIT_RUN, z: at.z - (rz / L) * AUDIT_RUN }, { x: at.x + (rx / L) * AUDIT_RUN, z: at.z + (rz / L) * AUDIT_RUN }] : undefined })
      }
    }
  }
  // one spot per CLUSTER m, roads before foot ways
  raw.sort((p, q) => Number(!p.along) - Number(!q.along) || Number(/footway|path|cycleway|pedestrian/.test(p.name)) - Number(/footway|path|cycleway|pedestrian/.test(q.name)))
  for (const s of raw) if (!spots.some((o) => o.kind === s.kind && Math.hypot(o.at.x - s.at.x, o.at.z - s.at.z) < CLUSTER)) spots.push(s)
}

// ---- the steepest ways round each
for (const s of spots) {
  let steepest = 0, steepWay = '', over = 0
  for (const e of edges) {
    if (e.kind === 'steps' || e.tunnel) continue
    const p = pts(e), h = e.heights!
    let worst = 0, near = false
    for (let i = 1; i < p.length; i++) {
      if (Math.hypot(p[i].x - s.at.x, p[i].z - s.at.z) > AUDIT_R) continue
      near = true
      const run = Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z)
      if (run > 0.5) worst = Math.max(worst, Math.abs(h[i] - h[i - 1]) / run)
    }
    if (!near) continue
    if (worst > STEEP) over++
    if (worst > steepest) { steepest = worst; steepWay = `${e.name ?? e.kind}${e.foot ? ' (foot)' : ''}${e.bridge ? ' (bridge)' : ''}` }
  }
  Object.assign(s, { steepest, steepWay, over })
}
spots.forEach((s, i) => { s.id = `${s.kind === 'bridge end' ? 'B' : 'P'}${String(i).padStart(3, '0')}` })
const take = spots.slice(0, limit)
console.log(`${spots.filter((s) => s.kind === 'bridge end').length} bridge ends, ${spots.filter((s) => s.kind === 'périphérique').length} périphérique crossings; auditing ${take.length}`)

// ---- ridden and photographed, in one session
if (!process.argv.includes('--no-shots')) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
  const page = await browser.newPage({ viewport: THUMB })
  const first = proj.toLatLon(take[0].at)
  await page.goto(`http://localhost:5200/?city=${city}&at=${first.lat.toFixed(6)},${first.lon.toFixed(6)}&freeze=1&dev=1`)
  await page.waitForFunction('window.riderReady === true', null, { timeout: 300_000 })
  // (the canvas only: the HUD and the route's panel off, as tools/look-at.ts does)
  await page.addStyleTag({ content: 'body * { visibility: hidden !important } canvas { visibility: visible !important }' })
  for (const [k, s] of take.entries()) {
    try {
      if (s.along) {
        const a = proj.toLatLon(s.along[0])
        await page.evaluate(`window.__jump(${a.lat}, ${a.lon})`)
        await page.waitForTimeout(300)
        const r = await page.evaluate(`window.__routeXZ(${s.along[1].x}, ${s.along[1].z})`) as { length: number } | null
        const straight = Math.hypot(s.along[1].x - s.along[0].x, s.along[1].z - s.along[0].z)
        s.detour = r ? Math.round((r.length / straight) * 10) / 10 : null
      }
      const t = proj.toLatLon(s.at), f = proj.toLatLon({ x: s.at.x - CAM_BACK * 0.7, z: s.at.z - CAM_BACK * 0.7 })
      await page.evaluate(`window.__view([${f.lat}, ${f.lon}, ${CAM_UP}], [${t.lat}, ${t.lon}, 0])`)
      await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 60_000 }).catch(() => {})
      await page.waitForTimeout(600)
      s.thumb = `thumbs/${s.id}.jpg`
      await page.screenshot({ path: resolve(OUT, s.thumb), type: 'jpeg', quality: 70 })
    } catch (err) { console.log(`  ${s.id}: ${(err as Error).message.split('\n')[0]}`) }
    if (k % 10 === 0) console.log(`  ${k + 1}/${take.length}`)
  }
  await browser.close()
}

// ---- the sheet, worst first: no route, then a long detour, then the steepest
const score = (s: Spot): number => (s.detour === null ? 100 : 0) + Math.max(0, (s.detour ?? 1) - 1.5) * 10 + (s.steepest ?? 0) * 10 + (s.over ?? 0)
take.sort((p, q) => score(q) - score(p))
writeFileSync(resolve(OUT, 'spots.json'), JSON.stringify(take.map((s) => ({ ...s, ll: proj.toLatLon(s.at) })), null, 1))
const rows = take.map((s) => {
  const ll = proj.toLatLon(s.at), lat = ll.lat.toFixed(6), lon = ll.lon.toFixed(6)
  const route = s.along === undefined ? '' : s.detour === null ? '<b class=bad>none</b>' : `${s.detour}×`
  return `<tr><td>${s.id}</td><td>${s.kind}</td><td>${s.name}</td><td><code>${lat}, ${lon}</code></td>`
    + `<td class=${(s.steepest ?? 0) > 0.3 ? 'bad' : (s.steepest ?? 0) > STEEP ? 'warn' : ''}>${Math.round((s.steepest ?? 0) * 100)}%<br><small>${s.steepWay}</small></td>`
    + `<td>${s.over}</td><td>${route}</td><td>${s.thumb ? `<img src="${s.thumb}" loading=lazy>` : ''}</td></tr>`
}).join('\n')
writeFileSync(resolve(OUT, 'index.html'), `<!doctype html><meta charset=utf-8><title>Structure audit: ${city}</title>
<style>body{font:13px system-ui;margin:16px}table{border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:4px 8px;vertical-align:top;text-align:left}
img{width:${THUMB.width}px;height:${THUMB.height}px}.bad{color:#b00020;font-weight:600}.warn{color:#b26a00}small{color:#666}</style>
<h1>Structure audit: ${city}</h1><p>${take.length} spots, worst first. Steepest: the steepest way within ${AUDIT_R} m (not steps); over: ways over ${STEEP * 100}%;
route: a ride across the structure (${AUDIT_RUN} m each side) over the straight distance. Camera from the south-west, ${CAM_UP} m up.</p>
<table><tr><th>id</th><th>kind</th><th>name</th><th>where</th><th>steepest</th><th>over</th><th>route</th><th>view</th></tr>
${rows}</table>`)
console.log(`→ ${resolve(OUT, 'index.html')}`)
