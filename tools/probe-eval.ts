/**
 * Load a city headless and print the value of a page expression once it is ready — for counters and
 * debugging state the Browser pane cannot show (it pauses animation frames while hidden, so no tiles build).
 *   node --experimental-strip-types tools/probe-eval.ts <city> '<expression>' [start-edge] [extra query, e.g. at=48.86,2.35]
 */
import { chromium } from 'playwright'
const [city = 'paris-marais', expr = 'window.__signs', start, extra] = process.argv.slice(2)
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'] })
const page = await b.newPage({ viewport: { width: 900, height: 600 } })
page.on('console', (m) => { if (m.type() === 'error' || /crowd/.test(m.text())) console.log('console:', m.text().slice(0, 300)) })
page.on('pageerror', (e) => console.log('pageerror:', e.message.slice(0, 300)))
await page.goto(`http://localhost:5200/?city=${city}${start && start !== '-' ? `&start=${start}` : ''}${extra ? `&${extra}` : ''}`)
await page.waitForFunction('window.gameReady === true', null, { timeout: 90_000 })
await page.waitForTimeout(3000)
console.log(JSON.stringify(await page.evaluate(expr)))
await b.close()
