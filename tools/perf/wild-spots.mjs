import { chromium } from 'playwright'
const [city, at] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 200, height: 120 } })
const errs = []
page.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 300)))
await page.goto(`http://localhost:5200/?city=${city}&at=${at}&freeze=1&without=life`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.waitForTimeout(3000)
const r = await page.evaluate(() => { const c = window.__scene.activeCamera.position; return { cam: [Math.round(c.x), Math.round(c.z)], w: window.__wildPlaced.map((a) => [...a, Math.round(Math.hypot(a[0] - c.x, a[1] - c.z))]).sort((a, b) => a[4] - b[4]).slice(0, 8), n: window.__wildPlaced.length } })
console.log(JSON.stringify(r), errs.slice(0, 3).join('\n'))
await browser.close()
