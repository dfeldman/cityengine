/**
 * What is drawn under the screen of a stored view (views/<city>.json): holds the view's camera and names the
 * mesh, distance and world point under a few pixels — for "why is this view looking at a wall".
 *   node --experimental-strip-types tools/probe-view.ts --city=paris-marais --name="Synagogue de la rue des Tournelles — street" [--at=700,400;300,400]
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : f
}
const city = arg('city', 'paris-marais')
const views = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'views', `${city}.json`), 'utf8')) as { name: string; from: number[]; to: number[] }[]
const v = views.find((x) => x.name === arg('name')) ?? views.find((x) => x.name.includes(arg('name')))
if (!v) { console.log('no such view'); process.exit(1) }
const pts = (arg('at') || '700,400;300,400;1100,400;700,650;700,150').split(';').map((p) => p.split(',').map(Number))
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
await page.goto(`http://localhost:${arg('port', '5200')}/?city=${city}&freeze=1&without=life&pick=1`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.evaluate(`window.__view(${JSON.stringify(v.from)}, ${JSON.stringify(v.to)})`)
await page.waitForTimeout(500)
await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(800)
const got = await page.evaluate(`(() => {
  const s = window.__scene
  for (const m of s.meshes) m.isPickable = true
  const cam = s.activeCamera.position
  return { camera: cam.asArray().map((q) => Math.round(q * 10) / 10), ground: Math.round(window.__heightAt(cam.x, cam.z) * 10) / 10,
    hits: ${JSON.stringify(pts)}.map(([x, y]) => { const h = s.pick(x, y)
      return h && h.hit ? { px: [x, y], mesh: h.pickedMesh.name, d: Math.round(h.distance * 10) / 10, at: h.pickedPoint.asArray().map((q) => Math.round(q * 10) / 10) } : { px: [x, y], mesh: null } }) }
})()`)
console.log(v.name)
console.log(JSON.stringify(got, null, 1))
await browser.close()
