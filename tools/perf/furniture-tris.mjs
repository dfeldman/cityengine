// Street furniture's share of the scene's triangles at a place: node tools/perf/furniture-tris.mjs <city> <lat,lon>
import { chromium } from 'playwright'
const [city = 'paris-centre', at = '48.86795,2.33350'] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 700, height: 400 } })
await page.goto(`http://localhost:5200/?city=${city}&at=${at}&freeze=1&without=life&time=${process.env.TIME ?? 'day'}`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.waitForTimeout(Number(process.env.WAIT ?? 40000))
const r = await page.evaluate(() => {
  const scene = window.__scene ?? globalThis.BABYLON?.EngineStore?.LastCreatedScene ?? window.scene
  if (!scene) return 'no scene handle'
  let street = 0, all = 0, n = 0, streetMeshes = 0, glow = 0
  for (const m of scene.meshes) {
    if (!m.isEnabled() || !m.isVisible) continue
    const t = (m.getTotalIndices?.() ?? 0) / 3 * Math.max(1, m.thinInstanceCount || 1)
    all += t; n++
    if (m.name.startsWith('street:')) { street += t; streetMeshes++ }
    if (m.name.startsWith('lampglow:')) glow += t
  }
  return { meshes: n, allTris: Math.round(all), streetTris: Math.round(street), streetMeshes, glowTris: Math.round(glow) }
})
console.log(JSON.stringify(r))
await browser.close()
