/**
 * Photograph the first hanging shop sign (or, in a blade-sign city, the first street blade) from both sides,
 * to check that its lettering reads left to right from each — the user's "some signs are backwards".
 *   node --experimental-strip-types tools/sign-sides.ts <out-prefix> [city]   → <out-prefix>-front.png, -back.png
 */
import { chromium } from 'playwright'
const out = process.argv[2]
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await b.newPage({ viewport: { width: 900, height: 600 } })
await page.goto(`http://localhost:5200/?city=${process.argv[3] ?? 'paris-marais'}&without=life`)
await page.waitForFunction('window.gameReady === true', null, { timeout: 90_000 })
await page.waitForTimeout(2500)
await page.keyboard.press('KeyF')
const probe = await page.evaluate('window.__signs.probe') as { x: number; y: number; z: number; ax: number; az: number }
console.log('probe', JSON.stringify(probe))
for (const side of [1, -1]) {
  await page.evaluate(`(() => {
    const sc = window.__scene; const cam = sc.activeCamera; const p = ${JSON.stringify(probe)}; const s = ${side}; const D = ${Number(process.env.D ?? 4)}
    if (window.__hold) sc.onBeforeRenderObservable.remove(window.__hold)
    window.__hold = sc.onBeforeRenderObservable.add(() => {
      cam.position.set(p.x + p.ax * D * s, p.y + 0.2, p.z + p.az * D * s)
      cam.setTarget(new cam.position.constructor(p.x, p.y, p.z))
    })
    const c = window.__city ?? null
  })()`)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${out}-${side > 0 ? 'front' : 'back'}.png` })
}
await b.close()
