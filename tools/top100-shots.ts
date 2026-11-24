import { VIEWPORT, SHOT_RES } from './shot-size.ts'
/**
 * Three in-city views of each listed landmark for a photo comparison (2026-11-16, the Paris top-100 audit):
 * `front` from the entry's front bearing (or SSW), `back` from front+130°, and a high `aerial`. One page load.
 *   npx tsx tools/top100-shots.ts --sites=<json [{rank,name,lat,lon,R,front?}]> --out=<dir> --medres [--from=1 --to=100]
 * A site may pin the front camera with dist (m) and camH (m) where a square is too small for the formula.
 * Tunables: FRONT_K/FRONT_C set distance = K·R + C, LIFT the camera height as a share of it; AER_* the aerial.
 */
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'
const FRONT_K = 1.7, FRONT_C = 45, LIFT = 0.32, AER_K = 1.3, AER_C = 40, AER_H_K = 1.4, AER_H_C = 70, AIM_K = 0.25
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'paris-centre'), out = resolve(arg('out', '/tmp/top100'))
const from = Number(arg('from', '1')), to = Number(arg('to', '999'))
const sites = (JSON.parse(readFileSync(arg('sites'), 'utf8')) as { rank: number; name: string; lat: number; lon: number; R: number; H: number; front?: number | null; dist?: number; camH?: number }[]).filter((s) => s.rank >= from && s.rank <= to)
mkdirSync(out, { recursive: true })
const { origin } = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'public', 'cities', city, 'v3', 'index.json'), 'utf8')) as { origin: { lat: number; lon: number } }
const proj = new Projection(origin)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: VIEWPORT })
await page.goto(`${process.env.SHOTS_BASE ?? 'http://localhost:5200'}/?city=${city}&at=${sites[0].lat},${sites[0].lon}&freeze=1&without=life&dev=1`)
await page.waitForFunction('window.riderReady === true || (!!window.__heightAt && !!window.__cityIdle && window.__cityIdle())', null, { timeout: 240_000 })
await page.addStyleTag({ content: 'body * { visibility: hidden !important } canvas { visibility: visible !important }' })
for (const s of sites) {
  const tag = String(s.rank).padStart(3, '0')
  if (existsSync(`${out}/${tag}-aerial.png`)) continue
  const c = proj.toLocal({ lat: s.lat, lon: s.lon }), fb = typeof s.front === 'number' ? s.front : 200
  await page.evaluate(`window.__jump(${s.lat}, ${s.lon}, 0)`)
  await page.waitForTimeout(500)
  await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 90_000 }).catch(async () => { console.log(`  (tiles still coming at ${s.name}, waiting longer)`); await page.waitForFunction("window.__cityIdle && window.__cityIdle()", null, { timeout: 150_000 }).catch(() => console.log(`  (STILL not idle at ${s.name})`)) })
  await page.waitForTimeout(Number(process.env.BUILD_WAIT ?? 8000)) // landmark GLBs and builders
  const d = Math.max(FRONT_K * s.R + FRONT_C, 1.5 * s.H + 40), aim = Math.min(Math.max(AIM_K * s.R, 0.4 * s.H), 140)
  const views: [string, number, number, number, number][] = [
    ['front', fb, s.dist ?? d, s.camH ?? d * LIFT, aim], ['back', fb + 130, d, d * LIFT, aim], ['aerial', fb + 35, AER_K * s.R + AER_C, Math.max(AER_H_K * s.R + AER_H_C, 1.3 * s.H + 40), 0.2 * s.H]]
  for (const [nm, bdeg, r, h, th] of views) {
    const b = (bdeg * Math.PI) / 180, px = c.x + Math.sin(b) * r, pz = c.z + Math.cos(b) * r
    await page.evaluate(`(() => {
      const sc = window.__scene, cam = sc.activeCamera
      if (window.__siteHold) sc.onBeforeRenderObservable.removeCallback(window.__siteHold)
      const ty = window.__heightAt(${c.x}, ${c.z})
      window.__siteHold = () => { cam.position.set(${px}, ty + ${h}, ${pz}); cam.setTarget(new cam.position.constructor(${c.x}, ty + ${th}, ${c.z})) }
      sc.onBeforeRenderObservable.add(window.__siteHold)
    })()`)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${out}/${tag}-${nm}.png` })
  }
  console.log(`${tag} ${s.name}`)
}
await browser.close()
console.log(`done ${SHOT_RES}`)
