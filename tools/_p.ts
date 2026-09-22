import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const v = (JSON.parse(readFileSync('views/paris-centre.json', 'utf8')) as any[]).find((x) => x.name === 'Notre-Dame — from the parvis')
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 700, height: 400 } })
for (const w of ['life', 'life,grade']) {
  await page.goto(`http://localhost:5200/?city=paris-centre&freeze=1&without=${w}`)
  await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
  await page.evaluate(`window.__view(${JSON.stringify(v.from)}, ${JSON.stringify(v.to)})`)
  await page.waitForTimeout(4000)
  await page.screenshot({ path: `${process.argv[2]}/nd-${w.replace(',', '_')}.png` })
}
await browser.close()
