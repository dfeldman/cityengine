/**
 * Shoot the named best views of a city, many per page load, and put them on contact sheets.
 *
 * Retaking a landmark because the right thing was not in frame cost more than anything else in the landmark
 * work (user, 2026-09-21). So every place worth checking has ONE stored view — where the camera stands and
 * what it looks at, as [lat, lon, metres above the ground there] — in `views/<city>.json`, and this loads the
 * city once and shoots a batch of them in the same browser session. Each batch also becomes a contact sheet
 * (a grid of labelled thumbnails), so a dozen views are looked at in one image.
 *
 *   node --experimental-strip-types tools/views.ts --city=paris-marais                 first batch of 12
 *   node --experimental-strip-types tools/views.ts --city=paris-marais --page=2        views 25–36
 *   node --experimental-strip-types tools/views.ts --city=paris-marais --group=landmark --batch=9
 *   node --experimental-strip-types tools/views.ts --city=paris-marais --only=Vosges,Bastille
 *   node --experimental-strip-types tools/views.ts --city=paris-marais --list          names and pages
 *   node --experimental-strip-types tools/views.ts --city=paris-marais --seed          propose views for
 *       every modelled landmark missing from the file (street and air), appended with "seeded": true
 *
 * Options: --life (keep the crowd; off by default, it costs load time and hides facades), --without=a,b, --q=high, --assets=local
 * (load the shared assets from public/ rather than the bucket: before/after comparisons of src/assets.ts),
 * --time=dusk, --port=5200, --out=<dir> (default docs/shots/views/<city>/). A view may carry its own
 * `query` (e.g. "paths=1") — views are grouped by query so the page reloads only when it changes.
 *
 * In the game, V copies the current camera as a view entry (frozen: the orbit's focus is the target).
 */
import { chromium, type Page } from 'playwright'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'

export interface View {
  name: string
  /** landmark · street · junction · bridge · river · skyline · bug — for filtering */
  group: string
  /** camera position: lat, lon, metres above the ground there */
  from: [number, number, number]
  /** what it looks at, the same way */
  to: [number, number, number]
  note?: string
  /** extra URL query for this view only, e.g. "paths=1" */
  query?: string
  /** proposed by --seed and not yet looked at by anyone: worth checking the framing */
  seeded?: boolean
}

const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a === `--${n}` || a.startsWith(`--${n}=`))
  if (!h) return f
  return h.includes('=') ? h.slice(n.length + 3) : 'true'
}
const ROOT = resolve(import.meta.dirname, '..')
const city = arg('city', 'paris-marais')
const file = resolve(ROOT, 'views', `${city}.json`)
const views: View[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []
const port = arg('port', '5200')
const out = arg('out') ? resolve(arg('out')) : resolve(ROOT, 'docs', 'shots', 'views', city)
const batch = Number(arg('batch', '12'))
const slug = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

let chosen = views
if (arg('group')) chosen = chosen.filter((v) => arg('group').split(',').includes(v.group))
if (arg('only')) {
  const want = arg('only').split(',').map((w) => w.toLowerCase())
  chosen = chosen.filter((v) => want.some((w) => v.name.toLowerCase().includes(w)))
}
if (arg('seeded')) chosen = chosen.filter((v) => v.seeded)

if (arg('list')) {
  chosen.forEach((v, i) => {
    if (i % batch === 0) console.log(`-- page ${i / batch}`)
    console.log(`  ${String(i).padStart(3)}  [${v.group}] ${v.name}${v.seeded ? '  (seeded)' : ''}`)
  })
  process.exit(0)
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 200)))

async function open(query: string): Promise<void> {
  // --without=a,b: subsystems to leave out as well (the crowd is left out unless --life)
  const without = [arg('life') ? '' : 'life', ...(arg('without') ? arg('without').split(',') : [])].filter(Boolean).join(',')
  const q = [`city=${city}`, 'freeze=1', without ? `without=${without}` : '', arg('q') ? `q=${arg('q')}` : '',
    arg('time') ? `time=${arg('time')}` : '', arg('assets') ? `assets=${arg('assets')}` : '', query].filter(Boolean).join('&')
  await page.goto(`http://localhost:${port}/?${q}`)
  await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
  await page.waitForFunction('window.treesReady === true', null, { timeout: 120_000 }).catch(() => console.warn('  (trees still loading)'))
  if (arg('life')) await page.waitForFunction('window.crowdReady === true', null, { timeout: 180_000 }).catch(() => console.warn('  (crowd still baking)'))
  // the interface off: menus, HUD, minimap and toasts are not what is being judged
  await page.addStyleTag({ content: 'body > *:not(canvas):not(#app):not(.sr-keep), #minimap { visibility: hidden !important }' })
  await page.waitForTimeout(1500)
}

async function frames(p: Page, n: number): Promise<void> {
  await p.evaluate(`new Promise((r) => { let k = ${n}; const f = () => (--k <= 0 ? r(0) : requestAnimationFrame(f)); requestAnimationFrame(f) })`)
}

if (arg('seed')) {
  /*
   * Proposals, per modelled landmark: an AIR view from the side its nearest street is on, and a STREET view
   * from a point on a real street, chosen by line of sight — rays from a rider's-eye height to five points on
   * the model, cast against everything built round it, the spot that sees most of it nearest the ideal
   * distance winning. Views marked `seeded` (nobody has judged them yet) are recomputed; hand-made ones kept.
   */
  await open('pick=1')
  const placed = await page.evaluate('window.__placed()') as { name: string; x: number; z: number; hx?: number; hz?: number; height?: number }[]
  const origin = await page.evaluate('window.__pkg.origin') as { lat: number; lon: number }
  const proj = new Projection(origin)
  const toLL = (p: { x: number; z: number; y: number }): [number, number, number] => {
    const g = proj.toLatLon(p)
    return [Math.round(g.lat * 1e6) / 1e6, Math.round(g.lon * 1e6) / 1e6, Math.round(p.y * 10) / 10]
  }
  // --only=Flamel,Tournelles re-seeds just those; everything else in the file is kept as it is
  const only = arg('only') ? arg('only').split(',').map((w) => w.toLowerCase()) : null
  const mine = (name: string): boolean => !only || only.some((w) => name.toLowerCase().includes(w))
  const kept = views.filter((v) => !v.seeded || !mine(v.name))
  const have = new Set(kept.map((v) => v.name))
  const fresh: View[] = []
  for (const l of placed.filter((q) => mine(q.name))) {
    const size = Math.max(l.hx ?? 10, l.hz ?? 10)
    const h = l.height ?? 20
    const target = { x: l.x, z: l.z, y: Math.min(h * 0.45, 25) }
    // stream the city round it first, so the rays have something to hit
    const t = toLL(target)
    await page.evaluate(`window.__view(${JSON.stringify([t[0], t[1], 80])}, ${JSON.stringify(t)})`)
    await frames(page, 2)
    await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 60_000 }).catch(() => {})
    const best = await page.evaluate(`(() => {
      const sc = window.__scene
      const pkg = window.__pkg
      const l = ${JSON.stringify(l)}
      const size = ${size}, h = ${h}
      const ideal = Math.min(150, Math.max(26, size * 2.2, h * 1.5))
      for (const m of sc.meshes) m.isPickable = m.isEnabled() && m.isVisible && m.renderingGroupId === 3
      const V = sc.activeCamera.position.constructor
      const Ray = window.__Ray
      const ground = (x, z) => window.__heightAt(x, z)
      const aims = [[0, 0.3], [0, 0.65], [0.7, 0.4], [-0.7, 0.4], [0, 0.95]]
      // the model's own extent: a front on the street can stand 30 m from the plot's centre (Tournelles)
      const lm = sc.meshes.find((m) => m.name === 'landmark:' + l.name)
      const bb = lm ? lm.getBoundingInfo().boundingBox : null
      const gap = (x, z) => bb ? Math.hypot(Math.max(bb.minimumWorld.x - x, 0, x - bb.maximumWorld.x),
        Math.max(bb.minimumWorld.z - z, 0, z - bb.maximumWorld.z)) : Math.hypot(x - l.x, z - l.z) - size
      let best = null
      // one candidate per 6 m cell: street polylines are densified, and every point was thousands of rays
      const tried = new Set()
      for (const e of pkg.edges) {
        if (e.foot || e.tunnel || e.bridge || e.passage) continue
        const p = e.points
        for (let i = 0; i < p.length; i += 2) {
          const x = p[i], z = p[i + 1]
          const d = Math.hypot(x - l.x, z - l.z)
          if (d < Math.max(18, size * 0.9) || d > ideal * 1.8 || gap(x, z) < Math.max(14, h * 0.6)) continue
          const cell = Math.round(x / 6) + ',' + Math.round(z / 6)
          if (tried.has(cell)) continue
          tried.add(cell)
          const eye = new V(x, ground(x, z) + 2.4, z)
          // never under a roof: straight down from 60 m, the first thing hit must be (near) the ground
          const down = sc.pickWithRay(new Ray(new V(x, eye.y + 60, z), new V(0, -1, 0), 70), (m) => m.isPickable)
          if (down && down.hit && down.pickedPoint && down.pickedPoint.y > eye.y - 1) continue
          let seen = 0
          // across the line of sight, to aim left and right of the centre
          const ux = -(l.z - z) / d, uz = (l.x - x) / d
          for (const [k, f] of aims) {
            const tx = l.x + ux * k * size, tz = l.z + uz * k * size
            const ty = ground(l.x, l.z) + h * f
            const dir = new V(tx - eye.x, ty - eye.y, tz - eye.z)
            const len = dir.length()
            const hit = sc.pickWithRay(new Ray(eye, dir.scale(1 / len), len), (m) => m.isPickable)
            if (!hit || !hit.hit || hit.distance > len * 0.9 || (hit.pickedMesh && hit.pickedMesh.name === 'landmark:' + l.name)) seen++
          }
          const score = seen * 10 - Math.abs(d - ideal) / ideal * 6
          if (!best || score > best.score) best = { score, seen, x, z, d }
        }
      }
      return best
    })()`) as { score: number; seen: number; x: number; z: number; d: number } | null
    const dir = best ? Math.atan2(best.x - l.x, best.z - l.z) : 0
    const air = Math.max(60, h * 2.2)
    const street = best ? { x: best.x, z: best.z, y: 2.4 } : { x: l.x + Math.sin(dir) * 40, z: l.z + Math.cos(dir) * 40, y: 3 }
    const airFrom = { x: l.x + Math.sin(dir) * air * 1.3, z: l.z + Math.cos(dir) * air * 1.3, y: air }
    for (const [kind, from] of [['street', street], ['air', airFrom]] as const) {
      const name = `${l.name} — ${kind}`
      if (have.has(name)) continue
      fresh.push({ name, group: 'landmark', from: toLL(from), to: toLL(target), seeded: true,
        ...(kind === 'street' && best ? { note: `line of sight ${best.seen}/5 at ${Math.round(best.d)} m` } : {}) })
    }
    console.log(`  ${l.name}: ${best ? `${best.seen}/5 seen from ${Math.round(best.d)} m` : 'no street point'}`)
  }
  const all = [...kept, ...fresh]
  mkdirSync(resolve(ROOT, 'views'), { recursive: true })
  writeFileSync(file, `${JSON.stringify(all, null, 1).replace(/\[\n\s+([-\d.]+),\n\s+([-\d.]+),\n\s+([-\d.]+)\n\s+\]/g, '[$1, $2, $3]')}\n`)
  console.log(`seeded ${fresh.length} views → views/${city}.json (${all.length} in all, ${kept.length} kept as they were)`)
  await browser.close()
  process.exit(0)
}

const pageNo = Number(arg('page', '0'))
const todo = chosen.slice(pageNo * batch, pageNo * batch + batch)
if (todo.length === 0) { console.log(`no views (${chosen.length} match; page ${pageNo} of batch ${batch})`); process.exit(0) }
mkdirSync(out, { recursive: true })
const shot: { name: string; file: string; note?: string }[] = []
let current: string | null = null
for (const v of todo) {
  if (v.query !== current || current === null) { await open(v.query ?? ''); current = v.query ?? '' }
  await page.evaluate(`window.__view(${JSON.stringify(v.from)}, ${JSON.stringify(v.to)})`)
  // tiles and layers stream in over a few frames within a budget: wait until nothing is left, then a moment
  // for textures and landmark models
  await frames(page, 2)
  await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 60_000 }).catch(() => console.log('  (city never idle)'))
  await frames(page, 2)
  await page.waitForTimeout(700)
  const f = resolve(out, `${slug(v.name)}.png`)
  await page.screenshot({ path: f })
  shot.push({ name: v.name, file: f, note: v.note })
  console.log(`  ${v.name} → ${f.slice(ROOT.length + 1)}`)
}

// the contact sheet: four across, labelled, one image for the whole batch
const cols = 4
const html = `<html><body style="margin:0;background:#1d1f22;font:13px -apple-system,sans-serif;color:#eee">
<div style="display:grid;grid-template-columns:repeat(${cols},350px);gap:6px;padding:6px">
${shot.map((s) => `<div><img src="data:image/png;base64,${readFileSync(s.file).toString('base64')}" style="width:350px;height:200px;display:block">
<div style="padding:2px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div></div>`).join('\n')}
</div></body></html>`
const sheet = await browser.newPage({ viewport: { width: cols * 356 + 6, height: 100 } })
await sheet.setContent(html)
const sheetFile = resolve(out, `sheet-${[arg('group'), arg('only') && 'only', `p${pageNo}`].filter(Boolean).join('-')}.png`)
await sheet.screenshot({ path: sheetFile, fullPage: true })
console.log(`sheet → ${sheetFile.slice(ROOT.length + 1)}  (${chosen.length} views match; ${Math.ceil(chosen.length / batch)} pages)`)
await browser.close()
