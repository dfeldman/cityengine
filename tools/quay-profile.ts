// A transect of the drawn ground (street levels included) north to south across the river: city lons lat0 lat1 (2.2 m samples)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { Projection } from '../src/city/geo.ts'
const city = process.argv[2], lons = process.argv[3].split(',').map(Number), la0 = Number(process.argv[4]), la1 = Number(process.argv[5])
const { origin } = JSON.parse(readFileSync(`public/cities/${city}/v3/index.json`, 'utf8'))
const P = new Projection(origin)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
await page.goto(`http://localhost:5200/?city=${city}&at=${(la0 + la1) / 2},${lons[0]}&freeze=1&dev=1`)
await page.waitForFunction('window.riderReady === true', null, { timeout: 180_000 })
await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 90_000 }).catch(() => {})
for (const lon of lons) {
  const pts: number[][] = []
  for (let k = 0; ; k++) { const lat = la0 - k * 0.00002; if (lat < la1) break; const q = P.toLocal({ lat, lon }); pts.push([q.x, q.z]) }
  const r = await page.evaluate(`(${JSON.stringify(pts)}).map(([x, z]) => window.__terrainAt(x, z).drawn.toFixed(1)).join(' ')`)
  console.log(lon, r)
}
await browser.close()
