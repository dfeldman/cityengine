import { VIEWPORT, SHOT_RES } from './shot-size.ts'
/**
 * A SITE CONTACT SHEET (2026-11-16, the plazas and bridgeheads pass): one page load, then for each site a ring of views at rider height
 * looking at it from RING_N bearings RING_R m out, plus one high oblique, each held as a fixed camera (as look-at does) once the tiles
 * round it have streamed. One labelled sheet per site, and an index of what each cell is.
 *   npx tsx tools/site-sheet.ts --city=paris-centre --sites=<json> --out=<dir> [--lowres|--medres]
 *     sites json: [{ "name": "iena-rb", "lat": 48.8606, "lon": 2.2916, "r": 18, "bearing0": 0 }, ...]  (r, bearing0 optional)
 *   --probe=1 also lists, for a 5×3 grid of pixels in every cell, the meshes the ray hits (render/city.ts groups clear depth)
 */
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { Projection } from '../src/city/geo.ts'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'paris-centre')
const out = resolve(arg('out', '/tmp/site-sheet'))
const sites = JSON.parse(readFileSync(arg('sites'), 'utf8')) as { name: string; lat: number; lon: number; r?: number; bearing0?: number; h?: number }[]
/** views round a site, how far out (m), the eye's height (m), and the oblique's height and distance (m) */
const RING_N = Number(arg('n', '4')), RING_R = 18, EYE = 1.7, HIGH_H = 28, HIGH_R = 30
mkdirSync(out, { recursive: true })
const { origin } = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'public', 'cities', city, 'v3', 'index.json'), 'utf8')) as { origin: { lat: number; lon: number } }
const proj = new Projection(origin)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: VIEWPORT })
const first = sites[0]
await page.goto(`${process.env.SHOTS_BASE ?? 'http://localhost:5200'}/?city=${city}&at=${first.lat},${first.lon}&freeze=1&without=life&dev=1`)
await page.waitForFunction('window.riderReady === true || (!!window.__heightAt && !!window.__cityIdle && window.__cityIdle())', null, { timeout: 240_000 })
await page.addStyleTag({ content: 'body * { visibility: hidden !important } canvas { visibility: visible !important }' })
const index: string[] = []
for (const s of sites) {
  const c = proj.toLocal({ lat: s.lat, lon: s.lon }), r = s.r ?? RING_R, b0 = ((s.bearing0 ?? 0) * Math.PI) / 180
  await page.evaluate(`window.__jump(${s.lat}, ${s.lon}, 0)`)
  await page.waitForTimeout(500)
  await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 90_000 }).catch(() => console.log(`  (tiles still coming at ${s.name})`))
  await page.waitForTimeout(1500)
  const views: { label: string; px: number; pz: number; ph: number; tx: number; tz: number; th: number }[] = []
  for (let i = 0; i < RING_N; i++) {
    const b = b0 + (i / RING_N) * Math.PI * 2
    views.push({ label: `${s.name} from ${Math.round((b * 180) / Math.PI) % 360}°`, px: c.x + Math.sin(b) * r, pz: c.z + Math.cos(b) * r, ph: EYE, tx: c.x, tz: c.z, th: 1 })
  }
  views.push({ label: `${s.name} high`, px: c.x + Math.sin(b0 + 0.6) * HIGH_R, pz: c.z + Math.cos(b0 + 0.6) * HIGH_R, ph: s.h ?? HIGH_H, tx: c.x, tz: c.z, th: 0 })
  const files: string[] = []
  for (const [vi, v] of views.entries()) {
    await page.evaluate(`(() => {
      const sc = window.__scene, cam = sc.activeCamera
      if (window.__siteHold) sc.onBeforeRenderObservable.removeCallback(window.__siteHold)
      const gy = window.__heightAt(${v.px}, ${v.pz}), ty = window.__heightAt(${v.tx}, ${v.tz})
      const ey = Math.max(gy, ty) + ${v.ph}
      window.__siteHold = () => { cam.position.set(${v.px}, ey, ${v.pz}); cam.setTarget(new cam.position.constructor(${v.tx}, ty + ${v.th}, ${v.tz})) }
      sc.onBeforeRenderObservable.add(window.__siteHold)
    })()`)
    await page.waitForTimeout(700)
    const f = `${out}/${s.name}-${vi}.png`
    await page.screenshot({ path: f })
    files.push(f)
    index.push(`${s.name}-${vi}: ${v.label} camera ${v.px.toFixed(1)},${v.pz.toFixed(1)} +${v.ph} → ${v.tx.toFixed(1)},${v.tz.toFixed(1)}`)
    if (arg('probe') === '1') {
      const hits = await page.evaluate(`(() => { const s = window.__scene, W = ${VIEWPORT.width}, H = ${VIEWPORT.height}, o = []; for (const m of s.meshes) m.isPickable = true
        for (const fy of [0.35, 0.55, 0.75]) for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) { const r = s.createPickingRay(fx * W, fy * H, null, s.activeCamera)
          const h = (s.multiPickWithRay(r) ?? []).filter((q) => q.pickedMesh.isVisible && !q.pickedMesh.name.startsWith('ground:occluder')).sort((a, b) => a.distance - b.distance).slice(0, 4)
          o.push(Math.round(fx * W) + ',' + Math.round(fy * H) + ' ' + h.map((q) => q.pickedMesh.name.slice(0, 28) + '@' + q.pickedMesh.renderingGroupId + ':' + q.distance.toFixed(1)).join(' ')) } return o })()`) as string[]
      index.push(...hits.map((h) => `    ${h}`))
    }
  }
  // the sheet: the ring across the top, the oblique below, labels burnt in
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
fs = sys.argv[2:]; ims = [Image.open(f).convert('RGB') for f in fs]; w, h = ims[0].size
cols = min(3, len(ims)); rows = (len(ims) + cols - 1) // cols
o = Image.new('RGB', (w * cols, h * rows), (0, 0, 0)); d = ImageDraw.Draw(o)
for i, im in enumerate(ims):
  x, y = (i % cols) * w, (i // cols) * h; o.paste(im, (x, y)); d.text((x + 3, y + 2), str(i), fill=(255, 255, 0))
o.save(sys.argv[1])`, `${out}/${s.name}.png`, ...files])
  console.log(`${s.name}: ${out}/${s.name}.png`)
}
writeFileSync(`${out}/index.txt`, index.join('\n') + '\n')
console.log(`index ${out}/index.txt; ${SHOT_RES}`)
await browser.close()
