/**
 * A packed model from four sides on one sheet — to see which way it faces (a small box marks the file's +z
 * side) and that a mirrored copy is a true mirror image. Uses glb-preview.html on the dev server.
 *   node --experimental-strip-types tools/glb/preview.ts <id>… [--out=dir]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const outArg = process.argv.find((a) => a.startsWith('--out='))
const out = outArg ? outArg.slice(6) : resolve(import.meta.dirname, '..', '..', 'docs', 'shots', 'models')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 800, height: 800 } })
const tiles: string[] = []
for (const id of ids) {
  await page.goto(`http://localhost:5200/glb-preview.html?file=models/paris/${id}.glb`)
  await page.waitForFunction('window.__ready === true', null, { timeout: 60_000 })
  for (const [label, a] of [['from +z', Math.PI / 2], ['from +x', 0], ['from −z', -Math.PI / 2], ['from −x', Math.PI]] as const) {
    const url = await page.evaluate(`window.__shoot(${a})`) as string
    tiles.push(`<div><img src="${url}" width="300"><div>${id} ${label}</div></div>`)
  }
}
const sheet = await browser.newPage({ viewport: { width: 1220, height: 100 } })
await sheet.setContent(`<body style="margin:0;background:#222;color:#eee;font:12px sans-serif;display:grid;grid-template-columns:repeat(4,302px);gap:2px">${tiles.join('')}</body>`)
const file = resolve(out, `models-${ids.join('_').slice(0, 60)}.png`)
await sheet.screenshot({ path: file, fullPage: true })
console.log(file)
await browser.close()
