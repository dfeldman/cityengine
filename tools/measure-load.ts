/**
 * How long a city takes to load, stage by stage, how much memory it holds and how fast it then draws — the
 * baseline for tiling (PARIS_EXPAND.md §2, §6 step 1) and the check after it.
 *   node --experimental-strip-types tools/measure-load.ts --city=paris-marais [--without=life] [--runs=2]
 */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : f
}
const city = arg('city', 'paris-marais')
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc'] })
for (let run = 0; run < Number(arg('runs', '1')); run++) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
  const t0 = Date.now()
  await page.goto(`http://localhost:${arg('port', '5200')}/?city=${city}&dev=1&freeze=1${arg('without') ? `&without=${arg('without')}` : ''}`)
  await page.waitForFunction('window.__marks && window.__marks.firstFrame !== undefined', null, { timeout: 300_000 })
  const ready = Date.now() - t0
  await page.waitForTimeout(4000)
  const r = await page.evaluate(`(async () => {
    if (window.gc) window.gc()
    const s = window.__scene
    const e = s.getEngine()
    // frame time over 120 frames, the camera where the shot harness leaves it
    const t = performance.now()
    await new Promise((res) => { let k = 120; const f = () => (--k <= 0 ? res(0) : requestAnimationFrame(f)); requestAnimationFrame(f) })
    const ms = (performance.now() - t) / 120
    let tris = 0
    for (const m of s.getActiveMeshes().data.slice(0, s.getActiveMeshes().length)) tris += (m.getTotalIndices ? m.getTotalIndices() : 0) / 3 * Math.max(1, m.thinInstanceCount || 0)
    // GPU memory, roughly: every texture at 4 bytes a texel (and a third more for mips), every vertex buffer
    let texMB = 0
    for (const t of s.textures) { const z = t.getSize ? t.getSize() : null; if (z && z.width) texMB += z.width * z.height * 4 * 1.33 / 1e6 }
    let vertMB = 0
    for (const m of s.meshes) {
      const g = m.geometry
      if (!g) continue
      const n = g.getTotalVertices()
      for (const k of g.getVerticesDataKinds()) { const b = g.getVertexBuffer(k); if (b) vertMB += n * b.getSize() * 4 / 1e6 }
      const ix = g.getTotalIndices(); vertMB += ix * 4 / 1e6
    }
    return { marks: window.__marks, textures: s.textures.length, texMB: Math.round(texMB), vertMB: Math.round(vertMB), heapMB: Math.round(performance.memory.usedJSHeapSize / 1e6), meshes: s.meshes.length,
      active: s.getActiveMeshes().length, trisM: Math.round(tris / 1e5) / 10, frameMs: Math.round(ms * 10) / 10 }
  })()`)
  console.log(JSON.stringify({ city, run, toFirstFrameMs: ready, ...(r as object) }))
  await page.close()
}
await browser.close()
