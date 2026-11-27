import { chromium } from 'playwright'
const [city, at] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await page.goto(`http://localhost:5200/?city=${city}&at=${at}&freeze=1&without=life`)
await page.waitForFunction('window.gameReady === true', null, { timeout: 240_000 })
await page.waitForFunction('window.treesReady === true', null, { timeout: 120_000 }).catch(() => {})
await page.waitForTimeout(20000)
const out = await page.evaluate(async () => {
  const s = window.__scene, e = s.getEngine()
  const gl = e._gl, ext = gl.getExtension('EXT_disjoint_timer_query_webgl2')
  let q = null; const pending = []; let gpuLast = 0
  s.onBeforeRenderObservable.add(() => { if (!ext || q) return; q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q) })
  s.onAfterRenderObservable.add(() => { if (!q) return; gl.endQuery(ext.TIME_ELAPSED_EXT); pending.push(q); q = null
    while (pending.length && gl.getQueryParameter(pending[0], gl.QUERY_RESULT_AVAILABLE)) { const p = pending.shift(); if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) gpuLast = gl.getQueryParameter(p, gl.QUERY_RESULT) * 1e-6; gl.deleteQuery(p) } })
  const gi = { gpuFrameTimeCounter: { get current() { return gpuLast * 1e6 } } }
  const count = {}
  for (const m of s.meshes) { const k = m.material?.name; if (k?.startsWith('shadow')) { const c = (count[k] ??= { meshes: 0, tris: 0 }); c.meshes++; c.tris += (m.getTotalIndices?.() ?? 0) / 3 } }
  const med = (a) => { const b = [...a].sort((x, y) => x - y); return +b[b.length >> 1].toFixed(2) }
  const run = (n) => new Promise((done) => { const g = [], f = []; let last = performance.now(); const tick = () => { const now = performance.now(); f.push(now - last); last = now; g.push(gi.gpuFrameTimeCounter.current * 1e-6); g.length < n ? requestAnimationFrame(tick) : done({ gpu: med(g.slice(10)), frame: med(f.slice(10)), draws: e._drawCalls?.current }) }; requestAnimationFrame(tick) })
  const set = (names, on) => { for (const m of s.meshes) if (names.includes(m.material?.name)) m.setEnabled(on) }
  const res = { on: [], noSkirt: [], noSoft: [] }
  for (let r = 0; r < 3; r++) {
    set(['shadowSoft', 'shadowLeaf'], true); res.on.push(await run(100))
    set(['shadowSoft'], false); res.noSkirt.push(await run(100))
    set(['shadowLeaf'], false); res.noSoft.push(await run(100))
    set(['shadowSoft', 'shadowLeaf'], true)
  }
  return { count, total: s.meshes.length, res }
})
console.log(JSON.stringify(out))
await browser.close()
