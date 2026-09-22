import { chromium } from 'playwright'
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } })
await page.goto(`http://localhost:5200/?city=paris-marais&freeze=1&without=life`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
// find a kiosk mesh instance position: the furniture points
const at = await page.evaluate(`(() => { const c = window.__cityObj; const pts = [...c.pointsIn.values()].flat().filter(p => p.kind === 'kiosk'); return pts.slice(0, 3) })()`)
console.log(JSON.stringify(at))
const k = (at as { x: number; z: number }[])[0]
await page.evaluate(`window.__viewLocal && window.__viewLocal([${k.x + 6}, 2.2, ${k.z + 5}], [${k.x}, 1.6, ${k.z}])`)
await page.waitForTimeout(3000)
await page.screenshot({ path: process.argv[2] })
await browser.close()
