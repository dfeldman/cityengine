/**
 * Any page's console errors and warnings (a shader that will not compile, an uncaught error), for when a shot
 * tool times out waiting on a page that never became ready. (tools/console.ts is the same for a ride.)
 *   node --experimental-strip-types tools/page-errors.ts "?model=phelanBuilding" [--wait=12000]
 */
import { chromium } from 'playwright'
const wait = Number(process.argv.find((a) => a.startsWith('--wait='))?.slice(7) ?? 12000)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(m.type(), m.text().slice(0, 2000)) })
page.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 1000)))
await page.goto(`http://localhost:5200/${process.argv[2] ?? ''}`)
await page.waitForTimeout(wait)
await browser.close()
