/**
 * Photographs San Francisco's street trees (src/tree-showcase.ts): each species' pair from pavement distance,
 * and the whole row, into one contact sheet per level of detail.
 *   node --experimental-strip-types tools/tree-shots.ts [--out=docs/shots/trees] [--lod=0]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const out = arg('out', 'docs/shots/trees')
const lod = Number(arg('lod', '0'))
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 900, height: 700 } })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 300)))
await page.goto(`http://localhost:5200/?trees=sf&lod=${lod}`)
await page.waitForFunction('window.treesReady === true', null, { timeout: 120_000 })
const row = await page.evaluate('window.__treeRow') as Record<string, number>
for (const [sp, x] of Object.entries(row)) {
  // from across the street, a little below the crowns, as a rider sees them
  await page.evaluate(`window.__treeView(${-Math.PI / 2 + 0.25}, 1.45, 24, ${x}, 5.5, 0)`)
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/${sp.replace(':', '-')}${lod ? `-lod${lod}` : ''}.png` })
  console.log(sp)
}
await browser.close()
