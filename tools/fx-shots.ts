import { VIEWPORT } from './shot-size.ts'
/**
 * A/B shots of the picture's finishing passes (src/render/post.ts) from ONE page load: every effect on, then each
 * zeroed in turn through the dev hook `window.__fx`, then all of them zeroed.
 *   node --experimental-strip-types tools/fx-shots.ts --city=paris-centre --at=48.8535,2.3335 --out=/dir/prefix [--lowres]
 * writes <prefix>-all.png, -noweather.png (walls unweathered), -noshadows.png, -nobloom.png, -nofilm.png, -none.png.
 * --without=a,b loads without those passes (ao, shadows, bloom, film, vignette, grain — AO cannot be switched live);
 * --extra=fxdebug=N shows the sun-shadow pass's debug views (render/post.ts): 1 mask, 2 depth, 3 normals, 4 facing,
 * 5 shadow-map coverage, 6 sun depth, 7 compare (red lit, green within the bias, blue shadowed, grey no caster).
 */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: VIEWPORT })
await page.goto(`http://localhost:${arg('port', '5200')}/?city=${arg('city', 'paris-centre')}&at=${arg('at')}&freeze=1&dev=1&without=life${arg('without') ? ',' + arg('without') : ''}${arg('view') ? `&view=${arg('view')}` : ''}${arg('extra') ? `&${arg('extra')}` : ''}`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.waitForFunction('window.treesReady === true', null, { timeout: 120_000 }).catch(() => {})
await page.addStyleTag({ content: 'body > *:not(canvas):not(#app), #minimap { visibility: hidden !important }' })
await page.waitForTimeout(2500)
const out = arg('out')
const set = (o: Record<string, number>): Promise<void> => page.evaluate((o) => {
  const fx = (window as unknown as { __fx: { set(n: string, v: number): void } }).__fx
  for (const [k, v] of Object.entries(o)) fx.set(k, v)
}, o)
const film0 = { vibrance: 0, curve: 0, split: 0, vignette: 0, grain: 0 }
const snap = async (name: string): Promise<void> => { await page.waitForTimeout(400); await page.screenshot({ path: `${out}-${name}.png` }) }
const before = await page.evaluate(() => ({ ...(window as unknown as { __gradeFx: Record<string, number> }).__gradeFx }))
await snap('all')
await page.evaluate(() => (window as unknown as { __weathering?: (v: number) => void }).__weathering?.(0)); await snap('noweather')
await page.evaluate(() => (window as unknown as { __weathering?: (v: number) => void }).__weathering?.(1))
await set({ shadows: 0 }); await snap('noshadows'); await set({ shadows: Number(arg('shadows', '0.62')) })
await set({ bloom: 0 }); await snap('nobloom'); await set({ bloom: Number(arg('bloom', '0.32')) })
await set(film0); await snap('nofilm'); await set(before)
await set({ shadows: 0, bloom: 0, ...film0 }); await snap('none')
await browser.close()
