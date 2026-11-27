// Screenshot the grass lab. node tools/perf/grass-lab-shot.mjs --q="tech=blades&type=meadow" --out=name [--w=700 --h=400 --t=0,0.1 --scale=1]
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pw = require('playwright')
const arg = (n, f = '') => { const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`)); return h ? h.slice(n.length + 3) : f }
const dir = '/private/tmp/claude-501/-Users-dfeldman-cityengine/897c0434-74ad-4be2-be18-e1661ce47e44/scratchpad/grass2/'
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const W = Number(arg('w', '700')), H = Number(arg('h', '400'))
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: Number(arg('scale', '1')) })).newPage()
page.on('pageerror', (e) => console.log('ERR', String(e).slice(0, 300)))
page.on('console', (m) => { if (m.type() === 'error') console.log('CON', m.text().slice(0, 300)) })
await page.goto(`${arg('url', 'http://localhost:5200')}/?grasslab=1&${arg('q')}`)
await page.waitForFunction('window.grassReady === true', null, { timeout: 60000 })
const ts = arg('t', '').split(',').filter(Boolean)
const out = arg('out', 'shot')
if (!ts.length) { await page.waitForTimeout(500); await page.screenshot({ path: `${dir}${out}.png` }) }
else for (const t of ts) { await page.evaluate((t) => window.__lab.setTime(+t), t); await page.waitForTimeout(300); await page.screenshot({ path: `${dir}${out}-t${t}.png` }) }
console.log(JSON.stringify(await page.evaluate('window.labStats')))
await browser.close()
