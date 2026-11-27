// (WAIT=ms before reading, TIME=day|dusk|night, SHOT=out.png W= H= to also photograph the rider's view, interface hidden)
// Lamps placed round a spot after dark (the glow layer's lights per tile) and the furniture skip log near it:
//   node tools/perf/lamp-count.mjs <city> <lat,lon>
import { chromium } from 'playwright'
const [city = 'paris-centre', at = '48.85340,2.33300'] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 350), height: Number(process.env.H ?? 200) } })
const errs = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 300)) })
page.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 400)))
await page.goto(`http://localhost:5200/?city=${city}&at=${at}&freeze=1&without=life&time=${process.env.TIME ?? 'night'}`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.waitForTimeout(Number(process.env.WAIT ?? 3000))
const r = await page.evaluate(() => {
  const scene = window.__scene
  const streets = scene.meshes.filter((m) => m.name.startsWith('street:')).map((m) => m.name.slice(7) + '=' + m.getTotalIndices() / 3).join(' ')
  const glow = scene.meshes.filter((m) => m.name.startsWith('lampglow:')).map((m) => `${m.name.slice(9)}=${m.getTotalVertices() / 33}`)
  const cam = scene.activeCamera.position
  const sk = window.__furnitureSkipped
  const near = sk.at.filter(([x, z]) => Math.hypot(x - cam.x, z - cam.z) < 120).map((a) => a.join(' '))
  const kinds = {}
  for (const [, , w] of sk.at) { const k = w.replace(/\(.*$/, ''); kinds[k] = (kinds[k] ?? 0) + 1 }
  const t04 = [...new Set(scene.meshes.filter((m) => m.name.includes('0,-4')).map((m) => m.name.replace(/[-0-9,]+.*$/, '')))].join(' ')
  const hist = window.__lampsPlaced
  return { hist, t04, streets, cam: [Math.round(cam.x), Math.round(cam.z)], glow: glow.join(' '), skippedN: sk.n, kinds, near: near.slice(0, 12) }
})
console.log(JSON.stringify(r, null, 1)); console.log(errs.filter((e) => /error|Error|street|furniture/i.test(e)).slice(0, 8).join('\n'))
if (process.env.SHOT) { await page.addStyleTag({ content: 'body > *:not(canvas):not(#app), #minimap { visibility: hidden !important }' }); await page.waitForTimeout(500); await page.screenshot({ path: process.env.SHOT }) }
await browser.close()
