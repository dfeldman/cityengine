/**
 * Load a city, press some keys, and take a screenshot — for UI that only appears on a key (the large map, M;
 * the path overlay, J). node --experimental-strip-types tools/press-shot.ts <out.png> <city> <keys,comma> [query]
 */
import { chromium } from 'playwright'
const [out = 'docs/shots/press.png', city = 'paris-marais', keys = 'KeyM', extra = ''] = process.argv.slice(2)
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await b.newPage({ viewport: { width: 1400, height: 900 } })
await page.goto(`http://localhost:5200/?city=${city}${extra ? `&${extra}` : ''}`)
await page.waitForFunction('window.gameReady === true', null, { timeout: 90_000 })
await page.waitForTimeout(3000)
for (const k of keys.split(',').filter(Boolean)) { await page.keyboard.press(k); await page.waitForTimeout(300) }
await page.waitForTimeout(1500)
await page.screenshot({ path: out })
await b.close()
