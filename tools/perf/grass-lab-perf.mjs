// GPU ms per frame of the grass lab. node tools/perf/grass-lab-perf.mjs [--techs=none,shells,blades,cards] [--types=...] [--scales=1,2] [--extra="density=1"]
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pw = require('playwright')
const arg = (n, f = '') => { const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`)); return h ? h.slice(n.length + 3) : f }
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] })
const techs = arg('techs', 'none,shells,blades,cards').split(',')
const types = arg('types', 'manicured,unkempt,meadow').split(',')
const scales = arg('scales', '1,2').split(',').map(Number)
const extras = arg('extra', '').split(';')
for (const sc of scales) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: sc })).newPage()
  for (const tech of techs) for (const type of (tech === 'none' ? [types[0]] : types)) for (const ex of extras) {
    const res = []
    for (let run = 0; run < Number(arg('runs', '3')); run++) {
      await page.goto(`${arg('url', 'http://localhost:5200')}/?grasslab=1&tech=${tech}&type=${type}&${ex}`, { timeout: 120000 })
      await page.waitForFunction('window.grassReady === true', null, { timeout: 60000 })
      res.push(await page.evaluate('window.__lab.gpu(300)'))
    }
    const st = await page.evaluate('window.labStats')
    console.log(`${1440 * sc}x${900 * sc}\t${tech}\t${type}\t${ex || '-'}\tmed=${[...res].filter((x) => x != null).sort((a, b) => a - b)[Math.floor(res.length / 2)]?.toFixed(2)} (${res.map((x) => x?.toFixed(2)).join('/')})\ttris=${st.tris}\tinst=${st.instances}`)
  }
}
await browser.close()
