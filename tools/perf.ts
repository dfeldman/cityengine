/**
 * Frame time for one spot under one set of URL options, measured in a real (headless) GPU browser.
 * Absolute numbers are this machine's; the point is comparing two settings on the same spot.
 *   npx tsx tools/perf.ts --edge=5525 --q="bodies=6&bodyq=high"
 */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : f
}
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
await page.goto(`http://localhost:5200/?city=${arg('city', 'paris-marais')}&start=${arg('edge')}&freeze=1&${arg('q')}`)
await page.waitForFunction('window.gameReady === true', null, { timeout: 60_000 })
await page.waitForFunction('window.crowdReady === true || window.riderReady === true', null, { timeout: 90_000 }).catch(() => {})
await page.waitForTimeout(Number(arg('wait', '6000')))   // bodies and trees arrive asynchronously
// a string, not a function: the TS runner decorates named functions with a helper the page does not have
const r = await page.evaluate(`(async () => {
  const sc = window.__scene
  const times = []
  let last = performance.now()
  await new Promise((done) => {
    function tick() {
      const now = performance.now(); times.push(now - last); last = now
      if (times.length < 240) requestAnimationFrame(tick); else done()
    }
    requestAnimationFrame(tick)
  })
  times.sort((a, b) => a - b)
  return {
    medianMs: times[Math.floor(times.length / 2)].toFixed(2),
    p90Ms: times[Math.floor(times.length * 0.9)].toFixed(2),
    activeMeshes: sc.getActiveMeshes().length,
    activeIndices: sc.getActiveIndices(),
  }
})()`)
console.log(arg('q') || '(default)', JSON.stringify(r))
await browser.close()
