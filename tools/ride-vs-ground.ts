// Ride-graph edges round a point that run under the drawn terrain (owner, 2026-11-06: "the rider spends quite a while under the street
// before reemerging"): per edge, its kind/name, how far and how deep under. node --experimental-strip-types tools/ride-vs-ground.ts city lat lon [R]
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { Projection } from '../src/city/geo.ts'
const [city, lat, lon, R = '60'] = process.argv.slice(2)
const { origin } = JSON.parse(readFileSync(`public/cities/${city}/v3/index.json`, 'utf8'))
const c = new Projection(origin).toLocal({ lat: Number(lat), lon: Number(lon) })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 800, height: 500 } })
await page.goto(`http://localhost:5200/?city=${city}&at=${lat},${lon}&freeze=1&dev=1`)
await page.waitForFunction('window.riderReady === true', null, { timeout: 180_000 })
await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 90_000 }).catch(() => {})
const r = process.env.JS ? await page.evaluate(readFileSync(process.env.JS, 'utf8')) : await page.evaluate(`(() => {
  const g = window.__rides, t = window.__city.terrain, out = []
  const e0 = g.edges.values().next().value
  const keys = Object.keys(e0).join(',')
  for (const e of g.edges.values()) {
    const P = e.points, H = e.heights
    if (!P || !H) continue
    let near = 1e9, under = 0, deep = 0, n = 0
    for (let i = 0; i < P.length; i++) {
      const p = P[i], d = Math.hypot(p.x - ${c.x}, p.z - ${c.z}); near = Math.min(near, d)
      const gy = t.heightAt(p.x, p.z), u = gy - H[i]
      if (u > 0.5) { under++; deep = Math.max(deep, u) }
      n++
    }
    if (near > ${R} || !under) continue
    out.push([deep, e.id + ' ' + (e.name || e.kind) + (e.tunnel ? ' T' : '') + (e.bridge ? ' B' : '') + ' pts ' + under + '/' + n + ' deep ' + deep.toFixed(1) + ' near ' + Math.round(near) + ' h ' + JSON.stringify(H.map((h) => Math.round(h * 10) / 10))])
  }
  out.sort((a, b) => b[0] - a[0])
  return 'keys: ' + keys + '\\n' + out.length + ' under\\n' + out.slice(0, 12).map((o) => o[1]).join('\\n')
})()`)
console.log(r)
await browser.close()
