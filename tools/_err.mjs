import { chromium } from 'playwright'
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await b.newPage(); const out = []
p.on('pageerror', e => out.push('PE ' + e.message + ' ' + (e.stack||'').split('\n')[1]))
p.on('console', m => { if (m.type() === 'error' || m.type()==='warning') out.push(m.type()[0]+' ' + m.text().slice(0, 200)) })
await p.goto(`http://localhost:${process.argv[2]}/?city=paris-centre&at=-7374,-3563`)
await p.waitForTimeout(45000)
console.log(out.slice(0, 10).join('\n')); await b.close()
