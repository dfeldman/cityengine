// Steep ways round a point, for the bridge-end and overpass work (2026-11-06): how many non-step ways within R m are over 15%, then the
// steepest ten with points, heights and flags (F foot, B bridge, T tunnel, R ramp). node --experimental-strip-types tools/steep-ways.ts city lat lon R
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { Projection } from '../src/city/geo.ts'
const [city, lat, lon, R] = process.argv.slice(2)
const { origin } = JSON.parse(readFileSync(`public/cities/${city}/v3/index.json`, 'utf8'))
const c = new Projection(origin).toLocal({ lat: Number(lat), lon: Number(lon) })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 800, height: 500 } })
await page.goto(`http://localhost:5200/?city=${city}&at=${lat},${lon}&freeze=1&dev=1`)
await page.waitForFunction('window.riderReady === true', null, { timeout: 180_000 })
await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 90_000 }).catch(() => {})
const r = await page.evaluate(`(() => {
  const seen = new Set(), out = []
  for (const list of window.__city.edgesIn.values()) for (const e of list) {
    if (seen.has(e) || !e.heights) continue; seen.add(e)
    let near = 1e9, hs = [], d0 = 0, steep = 0
    for (let i = 0; i < e.points.length; i += 2) {
      const d = Math.hypot(e.points[i] - ${c.x}, e.points[i+1] - ${c.z}); near = Math.min(near, d)
      if (i) { const run = Math.hypot(e.points[i] - e.points[i-2], e.points[i+1] - e.points[i-1]); if (run > 0.5) steep = Math.max(steep, Math.abs(e.heights[i/2] - e.heights[i/2-1]) / run) }
    }
    if (near > ${R}) continue
    out.push([steep, JSON.stringify(e.points.map(Math.round)) + ' ' + JSON.stringify(e.heights) + ' ' + (e.name || e.kind) + (e.foot ? ' F' : '') + (e.bridge ? ' B' : '') + (e.tunnel ? ' T' : '') + (e.ramp ? ' R' : ''), Math.min(...e.heights).toFixed(1), Math.max(...e.heights).toFixed(1), Math.round(near)])
  }
  out.sort((a, b) => b[0] - a[0])
  return out.filter((o) => o[0] > 0.15 && !/steps/.test(o[1])).length + ' over 15%\\n' + out.slice(0, 10).map((o) => (o[0]*100).toFixed(0) + '% | ' + o.slice(1).join(' | ')).join('\\n')
})()`)
console.log(r)
await browser.close()
