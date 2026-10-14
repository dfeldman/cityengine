// Frame profile of Cycle Dash at one spot: total frame interval, the game loop's CPU time (everything in the
// render-loop callback), Babylon's scene.render CPU share, draw calls, active meshes; optionally at several
// render resolutions (hardware scaling) and with the HUD hidden.
//   node tools/perf/profile-frame.mjs --browser=chromium|webkit --url=http://localhost:5201 --at=37.788,-122.4075 [--q=without=crowd] [--scales=1,2,4] [--mobile] [--frames=180]
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pw = require('playwright')
const arg = (n, f = '') => { const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`)); return h ? h.slice(n.length + 3) : f }
const flag = (n) => process.argv.includes(`--${n}`)
const kind = arg('browser', 'chromium')
const base = arg('url', 'http://localhost:5201').replace(/\/$/, '')
const opts = kind === 'chromium'
  ? { args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] }
  : { headless: !process.argv.includes('--headed') }
const browser = await pw[kind].launch(opts)
const ctxOpts = flag('mobile')
  ? { ...pw.devices['iPhone 15'] }
  : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }
if (kind !== 'webkit' && flag('mobile')) delete ctxOpts.defaultBrowserType
const ctx = await browser.newContext(ctxOpts)
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)))
const url = `${base}/?city=${arg('city', 'san-francisco')}&at=${arg('at', '37.788,-122.4075')}${flag('hud') ? '' : '&freeze=1'}&mem=1${arg('q') ? '&' + arg('q') : ''}`
await page.goto(url)
await page.waitForFunction('window.gameReady === true', null, { timeout: 180_000 })
await page.waitForTimeout(Number(arg('settle', '15000')))
const frames = Number(arg('frames', '180'))
const scales = arg('scales', '').split(',').filter(Boolean).map(Number)
const measure = `async (n, scale) => {
  const s = window.__scene, e = s.getEngine()
  if (scale) { e.setHardwareScalingLevel(scale); await new Promise((r) => setTimeout(r, 1500)) }
  const loops = e._activeRenderLoops
  const loopMs = [], renderMs = []
  let tb = 0
  const o1 = s.onBeforeAnimationsObservable.add(() => { tb = performance.now() })
  const o2 = s.onAfterRenderObservable.add(() => { renderMs.push(performance.now() - tb) })
  const orig = loops.slice()
  for (let i = 0; i < loops.length; i++) { const fn = orig[i]; loops[i] = () => { const t = performance.now(); fn(); loopMs.push(performance.now() - t) } }
  const dc = []
  const iv = []
  let last = performance.now()
  await new Promise((done) => { const f = () => { const now = performance.now(); iv.push(now - last); last = now; dc.push(e._drawCalls ? e._drawCalls.current : -1); iv.length < n ? requestAnimationFrame(f) : done() }; requestAnimationFrame(f) })
  for (let i = 0; i < loops.length; i++) loops[i] = orig[i]
  s.onBeforeAnimationsObservable.remove(o1); s.onAfterRenderObservable.remove(o2)
  const med = (a) => { const b = a.slice().sort((x, y) => x - y); return +b[Math.floor(b.length / 2)].toFixed(2) }
  const p90 = (a) => { const b = a.slice().sort((x, y) => x - y); return +b[Math.floor(b.length * 0.9)].toFixed(2) }
  const gl = e._gl
  const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info')
  return {
    scale: e.getHardwareScalingLevel(), px: e.getRenderWidth() + 'x' + e.getRenderHeight(),
    frameMed: med(iv.slice(5)), frameP90: p90(iv.slice(5)), loopCpuMed: med(loopMs), renderCpuMed: med(renderMs),
    drawCalls: med(dc.slice(6).map((v, i) => v - dc[i + 5])), activeMeshes: s.getActiveMeshes().length, activeIndicesM: +(s.getActiveIndices() / 1e6).toFixed(2),
    meshes: s.meshes.length, materials: s.materials.length, textures: s.textures.length,
    renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '?', webgl: e.webGLVersion,
  }
}`
const results = []
for (const sc of scales.length ? scales : [0]) results.push(await page.evaluate(`(${measure})(${frames}, ${sc})`))
const mem = await page.evaluate(() => [...document.querySelectorAll('div')].map((d) => d.textContent).find((t) => /GPU ~/.test(t ?? '')) ?? '')
console.log(JSON.stringify({ mem: mem.replace(/\n/g, ' | '), browser: kind, mobile: flag('mobile'), q: arg('q') || '(default)', at: arg('at', '37.788,-122.4075'), results, errors: errs.slice(0, 3) }))
await browser.close()
