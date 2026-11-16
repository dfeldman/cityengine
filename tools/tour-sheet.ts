import { VIEWPORT, SHOT_RES } from './shot-size.ts'
/**
 * A TOUR'S CONTACT SHEET (owner, 2026-11-15: "a utility to show the view every N meters along the tour route, and put
 * together a contact sheet, so we can verify key entities are actually visible on the tour"). Routes the tour as tour
 * mode does (sim/route.ts `tourEdgeCost`), then jumps the rider along it — every `--every` metres, and once more just
 * before each announced stop, where its card comes up — and photographs the chase camera's view, facing along the route.
 *   node --experimental-strip-types tools/tour-sheet.ts --city=paris-centre --tour=paris-right-bank [--every=300] [--lowres]
 *     [--from=1 --to=3]   only the legs between those stops (1-based)
 * Each cell is labelled with the distance along the tour and the next announced stop with how far it is; a cell on a
 * tunnel edge is marked TUNNEL. The sheet goes to docs/shots/tours/<tour>.png.
 */
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { shippedDir } from './bake-files.ts'
import { unpackRide, type RideFile } from '../src/city/ridefile.ts'
import { Projection } from '../src/city/geo.ts'
import { SF_TOURS } from '../src/city/sf/tours.ts'
import { PARIS_TOURS } from '../src/city/paris/tours.ts'
import { isTunnel, nearestOnGraph, planRoute, tourEdgeCost } from '../src/sim/route.ts'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'paris-centre')
const tour = [...PARIS_TOURS, ...SF_TOURS].find((t) => t.id === arg('tour'))
if (!tour) { console.log(`no tour ${arg('tour')}: ${[...PARIS_TOURS, ...SF_TOURS].map((t) => t.id).join(' ')}`); process.exit(1) }
/** metres between shots */
const EVERY = Number(arg('every', '300'))
/** the extra shot before each announced stop: about where its card comes up (game/tour.ts APPROACH_ROUTE) */
const BEFORE_STOP = 120
/** cells across */
const COLS = Number(arg('cols', '5'))
const from = Number(arg('from', '1')) - 1
const to = Number(arg('to', String(tour.stops.length))) - 1

const index = JSON.parse(readFileSync(resolve(shippedDir(city), 'index.json'), 'utf8'))
const g = unpackRide(JSON.parse(readFileSync(resolve(shippedDir(city), 'ride-bike.json'), 'utf8')) as RideFile)
const proj = new Projection(index.origin)
type P = { x: number; z: number }

// the whole route, leg by leg, as one line; where along it each stop is reached
const line: P[] = []
const stopAt: { s: number; i: number }[] = []
const pts = tour.stops.map((s) => proj.toLocal(s))
for (let i = from + 1; i <= to; i++) {
  const s0 = nearestOnGraph(g, pts[i - 1], isTunnel)!
  const r = planRoute(g, { edgeId: s0.edgeId, s: s0.s, reversed: false }, pts[i], nearestOnGraph(g, pts[i], isTunnel), tourEdgeCost)
  if (!r) { console.log(`no route ${i}→${i + 1}`); continue }
  line.push(...r.line)
  let run = 0
  for (let k = 1; k < line.length; k++) run += Math.hypot(line[k].x - line[k - 1].x, line[k].z - line[k - 1].z)
  stopAt.push({ s: run, i })
}
const cum = [0]
for (let k = 1; k < line.length; k++) cum.push(cum[k - 1] + Math.hypot(line[k].x - line[k - 1].x, line[k].z - line[k - 1].z))
const total = cum[cum.length - 1]
const along = (s: number): { p: P; bearing: number } => {
  let k = cum.findIndex((c) => c >= s)
  if (k <= 0) k = 1
  const a = line[k - 1], b = line[k]
  const t = (s - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1])
  // the bearing over the next 20 m, not one short segment's
  const ahead = line[cum.findIndex((c) => c >= s + 20)] ?? b
  const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
  return { p, bearing: (Math.atan2(ahead.x - p.x, ahead.z - p.z) * 180) / Math.PI }
}
const marks = new Set<number>()
for (let s = 0; s < total; s += EVERY) marks.add(Math.round(s))
for (const st of stopAt) if (tour.stops[st.i].text) marks.add(Math.round(Math.max(0, st.s - BEFORE_STOP)))
const samples = [...marks].sort((a, b) => a - b).map((s) => {
  const { p, bearing } = along(s)
  const next = stopAt.find((q) => q.s >= s && tour.stops[q.i].text)
  const n = nearestOnGraph(g, p)
  const e = n ? g.edges.get(n.edgeId) : undefined
  return { s, p, bearing, ll: proj.toLatLon(p), next: next ? `${tour.stops[next.i].name} ${Math.round(next.s - s)} m` : '', tunnel: !!e && isTunnel(e) }
})
console.log(`${tour.name}: ${(total / 1000).toFixed(1)} km, ${samples.length} shots (${SHOT_RES})`)

const out = resolve(import.meta.dirname, '..', 'docs/shots/tours')
const tmp = resolve(out, `.tmp-${tour.id}`)
mkdirSync(tmp, { recursive: true })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: VIEWPORT })
const first = samples[0].ll
await page.goto(`${process.env.SHOTS_BASE ?? 'http://localhost:5200'}/?city=${city}&at=${first.lat.toFixed(7)},${first.lon.toFixed(7)}&freeze=1&without=life`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.addStyleTag({ content: 'body > *:not(canvas):not(#app), #minimap { visibility: hidden !important }' })
const shots: string[] = []
for (const [k, q] of samples.entries()) {
  await page.evaluate(`window.__jump(${q.ll.lat}, ${q.ll.lon}, ${q.bearing})`)
  await page.waitForTimeout(400)
  await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 60_000 }).catch(() => console.log(`  (tiles still coming at ${q.s} m)`))
  await page.waitForTimeout(1500)
  const f = resolve(tmp, `${String(k).padStart(3, '0')}.png`)
  await page.screenshot({ path: f })
  shots.push(f)
}
await browser.close()

const sharp = (await import('sharp')).default
const cw = VIEWPORT.width, ch = VIEWPORT.height, label = 30
const rows = Math.ceil(shots.length / COLS)
const W = COLS * cw, H = rows * (ch + label)
const esc = (t: string): string => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const fs = Math.max(9, Math.round(cw / 28))
const text = samples.map((q, i) => {
  const x = (i % COLS) * cw + 4
  const y = Math.floor(i / COLS) * (ch + label) + ch + fs + 2
  return `<text x="${x}" y="${y}" font-family="sans-serif" font-size="${fs}" font-weight="bold" fill="${q.tunnel ? '#c00' : '#111'}">${(q.s / 1000).toFixed(2)} km${q.tunnel ? ' TUNNEL' : ''}</text>`
    + `<text x="${x}" y="${y + fs + 2}" font-family="sans-serif" font-size="${fs}" fill="#444">${esc(q.next ? `→ ${q.next}` : '')}</text>`
}).join('')
const tiles = shots.map((f, i) => ({ input: f, left: (i % COLS) * cw, top: Math.floor(i / COLS) * (ch + label) }))
const file = resolve(out, `${tour.id}${from || to < tour.stops.length - 1 ? `-${from + 1}-${to + 1}` : ''}.png`)
await sharp({ create: { width: W, height: H, channels: 3, background: '#f4f4f2' } })
  .composite([...tiles, { input: Buffer.from(`<svg width="${W}" height="${H}">${text}</svg>`), top: 0, left: 0 }])
  .png().toFile(file)
rmSync(tmp, { recursive: true, force: true })
console.log(file)
