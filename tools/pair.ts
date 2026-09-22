/**
 * Two shots side by side, labelled, as one image — for looking at a before/after in one read.
 *   node --experimental-strip-types tools/pair.ts <before.png> <after.png> <out.png>
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const [a, b, out] = process.argv.slice(2)
const img = (f: string): string => `data:image/png;base64,${readFileSync(f).toString('base64')}`
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1412, height: 440 } })
await page.setContent(`<body style="margin:0;background:#222;color:#eee;font:13px sans-serif;display:flex;gap:4px;padding:4px">
<div><img src="${img(a)}" width="700"><div>before — ${a.split('/').slice(-2).join('/')}</div></div>
<div><img src="${img(b)}" width="700"><div>after — ${b.split('/').slice(-2).join('/')}</div></div></body>`)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
