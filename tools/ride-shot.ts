/**
 * The chase camera at a place: loads the city with `?at=lat,lon` (the rider put on the nearest rideable
 * street), frozen, and screenshots what the rider sees — for reports given as "at 48.86, 2.29".
 *   node --experimental-strip-types tools/ride-shot.ts --city=paris-centre --at=48.863689,2.297469 --out=x.png [--view=high] [--life] [--device=treadmill] [--clean]
 */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
await page.goto(`http://localhost:${arg('port', '5200')}/?city=${arg('city', 'paris-centre')}&at=${arg('at')}&freeze=1${process.argv.includes('--life') ? '' : '&without=life'}${arg('view') ? `&view=${arg('view')}` : ''}${arg('device') ? `&device=${arg('device')}` : ''}`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
// --clean: the interface off (for the console's screenshot.jpg)
if (process.argv.includes('--clean')) await page.addStyleTag({ content: 'body > *:not(canvas):not(#app), #minimap { visibility: hidden !important }' })
await page.waitForTimeout(2500)
await page.screenshot({ path: arg('out') })
await browser.close()
