/**
 * The vegetation measurement of BUGS.md #204/#205, repeatable in one call.
 *
 * Stands in one square of Golden Gate Park (G2G by default), frozen, and reports for each URL query the
 * median frame, the p90, and what the vegetation actually is: how many meshes carry thin instances, how
 * many instances and triangles they carry, and how many distinct materials those meshes use. The mesh and
 * material counts are the point — #205 measured ~7 ms of fixed per-mesh/per-material overhead against ~5 ms
 * of actual plants, so a change that halves the frame by drawing fewer plants is not the same as one that
 * halves it by drawing the same plants from fewer meshes.
 *
 *   node --experimental-strip-types tools/veg-perf.ts --port=5241 \
 *     --q="without=life" --q="without=life,trees,plants" --q="without=life&veg=2"
 *
 * Measured the same way as #204: headless Chromium on ANGLE/Metal, vsync off, 1280x720, the median of 120
 * frames after a warm-up. Absolute numbers are this machine's; only the comparisons travel.
 */
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const arg = (n: string, f = ''): string => {
  const h = args.find((a) => a === `--${n}` || a.startsWith(`--${n}=`))
  return h ? (h.includes('=') ? h.slice(n.length + 3) : 'true') : f
}
const queries = args.filter((a) => a.startsWith('--q=')).map((a) => a.slice(4))
if (queries.length === 0) queries.push('without=life')
const at = arg('at', '37.770037,-122.474067')
const city = arg('city', 'san-francisco')
const port = arg('port', '5241')

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 160)))

const rows: Record<string, string | number>[] = []
for (const q of queries) {
  await page.goto(`http://localhost:${port}/?city=${city}&at=${at}&freeze=1&${q}`)
  await page.waitForFunction('window.gameReady === true', null, { timeout: 180_000 })
  await page.waitForFunction('window.treesReady === true', null, { timeout: 120_000 }).catch(() => {})
  await page.waitForTimeout(Number(arg('wait', '9000')))
  const r = await page.evaluate(`(async () => {
    const sc = window.__scene
    const times = []
    let last = performance.now()
    await new Promise((done) => {
      let n = 0
      function tick() {
        const now = performance.now(); if (n++ > 30) times.push(now - last); last = now
        if (n < 150) requestAnimationFrame(tick); else done()
      }
      requestAnimationFrame(tick)
    })
    times.sort((a, b) => a - b)
    // the vegetation: trees and plants are the only thin-instanced meshes in rendering group 3 that came
    // from a GLB, so they are counted by having a thin-instance buffer rather than by name
    let meshes = 0, drawn = 0, inst = 0, tris = 0
    const mats = new Set()
    for (const m of sc.meshes) {
      if (!m.thinInstanceCount && m.thinInstanceCount !== 0) continue
      if (m.renderingGroupId !== 3 || !m.getTotalVertices || m.getTotalVertices() === 0) continue
      if (!/tree|leaf|leaves|bark|LOD|plant|bush|palm|frond|flower|Mesh|primitive/i.test(m.name)) continue
      meshes++
      if (m.isEnabled() && m.thinInstanceCount > 0) {
        drawn++
        inst += m.thinInstanceCount
        tris += (m.getTotalIndices() / 3) * m.thinInstanceCount
        if (m.material) mats.add(m.material.uniqueId)
      }
    }
    return {
      medianMs: +times[Math.floor(times.length / 2)].toFixed(2),
      p90Ms: +times[Math.floor(times.length * 0.9)].toFixed(2),
      vegMeshes: meshes, vegDrawn: drawn, instances: inst, millionTris: +(tris / 1e6).toFixed(2),
      materials: mats.size, activeMeshes: sc.getActiveMeshes().length,
    }
  })()`) as Record<string, number>
  console.log(`${q}  ${JSON.stringify(r)}`)
  rows.push({ query: q, ...r })
}
console.log('\n| query | median ms | p90 | veg meshes drawn | instances | M tris | materials | active meshes |')
console.log('|---|---|---|---|---|---|---|---|')
for (const r of rows) console.log(`| \`${r.query}\` | ${r.medianMs} | ${r.p90Ms} | ${r.vegDrawn} | ${r.instances} | ${r.millionTris} | ${r.materials} | ${r.activeMeshes} |`)
await browser.close()
