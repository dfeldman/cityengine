/**
 * CARS ON HILLS: how far the cars pitch beyond their own street's slope (owner, 2026-10-17, BUGS.md #308: "on steep
 * changing inclines they can look like they're tipping over backward"). Loads the game at each spot, lets the traffic
 * run, and samples render/street-fleet.ts `worst` every half second: the worst extra pitch, degrees, and where.
 *
 *   nice -n 20 node --experimental-strip-types tools/probe-cars.ts [lat,lon …] [--secs=30]
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pw = require('playwright')
const args = process.argv.slice(2)
const secs = Number(args.find((a) => a.startsWith('--secs='))?.split('=')[1] ?? 30)
const spots = args.filter((a) => !a.startsWith('--'))
if (!spots.length) spots.push('37.793186,-122.407746', '37.79690,-122.41930', '37.80180,-122.41870')
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal'] })
try {
  for (const at of spots) {
    const page = await (await browser.newContext({ viewport: { width: 960, height: 720 } })).newPage()
    await page.goto(`http://localhost:5200/?city=san-francisco&at=${at}&freeze=1&fog=off`)
    await page.waitForFunction('window.gameReady === true', null, { timeout: 240000 }).catch(() => {})
    await page.waitForTimeout(5000)
    const deg: number[] = []
    let worst = { excess: 0, x: 0, z: 0, slope: 0, pitch: 0, n: 0 }
    for (let k = 0; k < secs * 2; k++) {
      const w = await page.evaluate('({ ...(globalThis.__fleetWorst ?? {}) })') as typeof worst
      if (w.n) { deg.push(w.excess * 57.3); if (w.excess > worst.excess) worst = w }
      await page.waitForTimeout(500)
    }
    deg.sort((a, b) => a - b)
    const q = (f: number): string => (deg[Math.floor(f * (deg.length - 1))] ?? 0).toFixed(1)
    console.log(`${at}: ${deg.length} samples · extra pitch per frame (worst car) median ${q(0.5)}°, 90% ${q(0.9)}°, max ${q(1)}° (slope ${(worst.slope * 100).toFixed(0)} %, pitch ${(Math.atan(worst.slope) * 57.3).toFixed(1)}° street vs ${(worst.pitch * 57.3).toFixed(1)}° car)`)
    await page.close()
  }
} finally { await browser.close() }
