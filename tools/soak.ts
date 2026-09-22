/**
 * The memory soak (BUGS.md #39): the tab crashes when the JS heap reaches ~3 GB, so a long ride must level
 * off, not climb. Loads a city, rides a preplanned route at 700 W (about 40 km/h, so tiles stream in and out
 * all the way), and samples every `--every` seconds for `--minutes`: JS heap (CDP), meshes, materials,
 * textures, geometries, tiles loaded. Prints a table and the growth over the second half.
 *   node --experimental-strip-types tools/soak.ts --city=paris-centre --minutes=10 [--route=2] [--every=30]
 */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const minutes = Number(arg('minutes', '10'))
const every = Number(arg('every', '30'))
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
page.on('pageerror', (e) => console.log('pageerror', e.message))
const cdp = await page.context().newCDPSession(page)
await page.goto(`http://localhost:${arg('port', '5200')}/?city=${arg('city', 'paris-centre')}`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
// the route: pick it from the routes menu; then 700 W
await page.evaluate(`(() => { const m = document.querySelector('.sr-routes'); if (!m) return; m.selectedIndex = ${Number(arg('route', '3'))}; m.dispatchEvent(new Event('change')) })()`)
for (let i = 0; i < 10; i++) await page.keyboard.press('Shift+ArrowUp')
// --profile: what is allocated from here on and still alive at the end, by the function that allocated it
const profiling = process.argv.includes('--profile')
if (profiling) {
  await cdp.send('HeapProfiler.enable')
  await cdp.send('HeapProfiler.startSampling', { samplingInterval: 65536 })
}
const t0 = Date.now()
const rows: { t: number; heap: number; meshes: number; mats: number; tex: number; geo: number; tiles: number; km: number }[] = []
for (;;) {
  const t = (Date.now() - t0) / 60000
  // a real floor, not wherever the collector happened to be: collect first
  await page.evaluate('window.gc && window.gc()')
  const h = await cdp.send('Runtime.getHeapUsage') as { usedSize: number }
  const s = await page.evaluate(`(() => { const s = window.__scene; return { meshes: s.meshes.length, mats: s.materials.length, tex: s.textures.length, geo: s.geometries.length,
    tiles: window.__tiles ? (window.__tiles.size ?? Object.keys(window.__tiles).length) : -1, km: window.__travelled ? window.__travelled() / 1000 : -1 } })()`) as Omit<(typeof rows)[number], 't' | 'heap'>
  const row = { t, heap: h.usedSize / 1048576, ...s }
  rows.push(row)
  console.log(`${t.toFixed(1).padStart(5)} min  heap ${row.heap.toFixed(0).padStart(5)} MB  meshes ${String(row.meshes).padStart(5)}  mats ${String(row.mats).padStart(4)}  tex ${String(row.tex).padStart(4)}  geo ${String(row.geo).padStart(5)}  tiles ${row.tiles}  ${row.km.toFixed(2)} km`)
  if (t >= minutes) break
  await page.waitForTimeout(every * 1000)
}
const half = rows.filter((r) => r.t >= minutes / 2)
if (half.length >= 2) {
  const a = half[0]
  const b = half[half.length - 1]
  console.log(`second half: heap ${a.heap.toFixed(0)} → ${b.heap.toFixed(0)} MB (${((b.heap - a.heap) / (b.t - a.t)).toFixed(1)} MB/min), meshes ${a.meshes} → ${b.meshes}, textures ${a.tex} → ${b.tex}`)
}
console.log(`peak heap ${Math.max(...rows.map((r) => r.heap)).toFixed(0)} MB`)
if (profiling) {
  await page.evaluate('window.gc && window.gc()')
  const { profile } = await cdp.send('HeapProfiler.getSamplingProfile') as { profile: { head: PNode } }
  interface PNode { callFrame: { functionName: string; url: string; lineNumber: number }; selfSize: number; children: PNode[] }
  const by = new Map<string, number>()
  const walk = (n: PNode): void => {
    const f = n.callFrame
    const here = `${f.functionName || '(anon)'} ${f.url.split('/').slice(-2).join('/').replace(/\?.*/, '')}:${f.lineNumber + 1}`
    if (n.selfSize) by.set(here, (by.get(here) ?? 0) + n.selfSize)
    for (const c of n.children) walk(c)
  }
  walk(profile.head)
  const total = [...by.values()].reduce((a, b) => a + b, 0)
  console.log(`allocated since the ride began and still alive: ${Math.round(total / 1e6)} MB`)
  for (const [k, v] of [...by].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${String(Math.round(v / 1e6)).padStart(5)} MB  ${k}`)
}
await browser.close()
