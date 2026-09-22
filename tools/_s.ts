import { chromium } from 'playwright'
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } })
await page.goto(`http://localhost:5200/?city=paris-centre&at=48.85300,2.34820&freeze=1&without=life`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.waitForTimeout(2000)
const p = await page.evaluate(`(window.__placed() || []).find(q => /notre/i.test(q.name))`) as { x: number; z: number; rotation: number }
console.log(JSON.stringify(p))
// local −z is the front: rotation.y θ sends local (0, −d) to (−d sin θ, −d cos θ)
const d = Number(process.argv[3] ?? 38), off = Number(process.argv[4] ?? 0)
const c = Math.cos(p.rotation), s = Math.sin(p.rotation)
const fx = p.x - d * s + off * c, fz = p.z - d * c - off * s
const tx = p.x - 8 * s + off * c * 0.6, tz = p.z - 8 * c - off * s * 0.6
await page.evaluate(`window.__viewLocal([${fx}, 2.2, ${fz}], [${tx}, 9, ${tz}])`)
await page.waitForTimeout(3500)
await page.screenshot({ path: process.argv[2] })
await browser.close()
