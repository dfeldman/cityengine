/**
 * What is drawn at a pixel of a stored view (views/<city>.json): the mesh's name and the world point hit, for
 * finding what a visual bug is made of.
 *   node --experimental-strip-types tools/pick.ts --city=san-francisco "<view name part>" 900,620 800,600 …
 * `--without=trees,signs` switches subsystems off as well (the game's ?without=). Also writes the frame to docs/shots/pick.png with the probed pixels marked.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const args = process.argv.slice(2)
const city = (args.find((a) => a.startsWith('--city='))?.slice(7)) ?? 'san-francisco'
const extra = args.find((a) => a.startsWith('--without='))?.slice(10)
const rest = args.filter((a) => !a.startsWith('--'))
const views = JSON.parse(readFileSync(new URL(`../views/${city}.json`, import.meta.url), 'utf8'))
const v = views.find((x: any) => x.name.includes(rest[0]))
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
page.on('console', (m) => { if (m.type() !== 'debug') console.log(`console ${m.type()}:`, m.text().slice(0, 300)) })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 300)))
await page.goto(`http://localhost:5200/?city=${city}&freeze=1&without=life${extra ? `,${extra}` : ''}`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
  await page.waitForFunction('window.treesReady === true', null, { timeout: 120_000 }).catch(() => console.warn('  (trees still loading)'))
await page.evaluate(`window.__view(${JSON.stringify(v.from)}, ${JSON.stringify(v.to)})`)
await page.waitForTimeout(Number(args.find((a) => a.startsWith('--wait='))?.slice(7) ?? 3000))
for (const p of rest.slice(1)) {
  const [x, y] = p.split(',').map(Number)
  console.log(p, JSON.stringify(await page.evaluate(`window.__pick(${x}, ${y})`)))
}
await page.screenshot({ path: new URL('../docs/shots/pick.png', import.meta.url).pathname })
await browser.close()
