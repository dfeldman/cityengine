/**
 * LOOK: city shots from a camera at a point, headless, against the dev server on :5200 — the everyday "what does it
 * look like there" tool (it lived in a scratch folder until a reboot took it, 2026-10-17).
 *
 *   nice -n 20 node --experimental-strip-types tools/look.ts <out.png> [--fov=0.9] [--time=day|night|dusk|dawn]
 *       [--wait=20] [--keys=j,…] camLat,camLon,camY tgtLat,tgtLon,tgtY [cam tgt …]
 *
 * Heights are metres over the ground at each point. Each pair writes <out>-<k>.png. The game is loaded frozen with no
 * fog and a far plane of 7 km; the browser is closed at the end (never leave a headless Chrome behind).
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pw = require('playwright')
const args = process.argv.slice(2)
const opt = (k: string, d: string): string => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d
const rest = args.filter((a) => !a.startsWith('--'))
const out = rest.shift()!
if (!out || rest.length < 2 || rest.length % 2) {
  console.error('usage: tools/look.ts <out.png> [--fov=] [--time=] cam tgt [cam tgt …]  (each lat,lon,heightOverGround)')
  process.exit(1)
}
const P = (s: string): number[] => s.split(',').map(Number)
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal'] })
try {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1080 } })).newPage()
  page.on('pageerror', (e: Error) => console.log('PAGEERROR', String(e.stack ?? e).slice(0, 600)))
  const [la, lo] = rest[0].split(',')
  const time = opt('time', 'day')
  await page.goto(`http://localhost:5200/?city=san-francisco&at=${la},${lo}&freeze=1&fog=off&far=7000&time=${time}`)
  await page.waitForFunction('window.gameReady === true', null, { timeout: 240000 }).catch(() => console.log('(not ready in 4 min)'))
  await page.waitForTimeout(3000)
  // (keys to press once loaded: `--keys=j` turns on the large path lines)
  for (const k of opt('keys', '').split(',').filter(Boolean)) { await page.keyboard.press(k); await page.waitForTimeout(500) }
  const fov = Number(opt('fov', '0.9')), wait = Number(opt('wait', '20')) * 1000
  for (let i = 0; i < rest.length; i += 2) {
    await page.evaluate(async ([c, t, f, w]: [number[], number[], number, number]) => {
      const win = window as unknown as { __view: (c: number[], t: number[]) => void; __scene: { activeCamera?: { fov: number; maxZ: number } } }
      win.__view(c as number[], t as number[])
      const cam = win.__scene?.activeCamera
      if (cam) { cam.fov = f as number; cam.maxZ = 20000 }
      await new Promise((r) => setTimeout(r, w as number))
    }, [P(rest[i]), P(rest[i + 1]), fov, wait] as [number[], number[], number, number])
    const f = out.replace(/\.png$/, `-${i / 2}.png`)
    await page.screenshot({ path: f })
    console.log(f)
  }
} finally {
  await browser.close()
}
