// Road heights vs the ground under and beside them, per edge near a spot: city lat lon [R]
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { Projection } from '../src/city/geo.ts'
const [city, la, lo, R] = [process.argv[2], +process.argv[3], +process.argv[4], +(process.argv[5] ?? 80)]
const { origin } = JSON.parse(readFileSync(`public/cities/${city}/v3/index.json`, 'utf8'))
const q = new Projection(origin).toLocal({ lat: la, lon: lo })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 800, height: 450 } })
await page.goto(`http://localhost:5200/?city=${city}&at=${la},${lo}&freeze=1&dev=1`)
await page.waitForFunction('window.riderReady === true', null, { timeout: 180_000 })
await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 90_000 }).catch(() => {})
const out = await page.evaluate(([x, z, R]) => {
  const c = (window as any).__city, T = (window as any).__terrainAt, seen = new Set(), res: string[] = []
  for (const list of c.edgesIn.values()) for (const e of list) {
    if (seen.has(e) || !e.heights) continue; seen.add(e)
    const P = e.points, n = P.length / 2, rows: string[] = []
    let worst = 0
    for (let i = 0; i < n; i++) {
      const px = P[2*i], pz = P[2*i+1], off = Math.hypot(px - x, pz - z); if (off > R) continue
      const j = Math.min(i + 1, n - 1), k = Math.max(i - 1, 0)
      let dx = P[2*j] - P[2*k], dz = P[2*j+1] - P[2*k+1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L
      const h = e.heights[i], g = T(px, pz).raw, s1 = T(px - dz * 10, pz + dx * 10).raw, s2 = T(px + dz * 10, pz - dx * 10).raw
      worst = Math.max(worst, g - h)
      if (i % 3 === 0) rows.push(`(${px.toFixed(0)},${pz.toFixed(0)}) ${off.toFixed(0)}m road ${h.toFixed(1)} ground ${g.toFixed(1)} drawn ${T(px, pz).drawn.toFixed(1)} side10 ${s1.toFixed(1)}/${s2.toFixed(1)}`)
    }
    if (rows.length) res.push(`#${e.id} ${e.name ?? ''} ${e.kind ?? ''}${e.foot ? ' foot' : ''}${e.bridge ? ' bridge' : ''}${e.raised ? ' raised' : ''}${e.tunnel ? ' tunnel' : ''} groundAboveRoad ${worst.toFixed(1)}\n  ` + rows.join('\n  '))
  }
  return res.join('\n')
}, [q.x, q.z, R])
console.log(out)
await browser.close()
