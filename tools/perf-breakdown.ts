/**
 * Where the triangles go (PARIS_EXPAND §6 item 7, the performance pass): active indices by mesh family (the
 * name before its tile key), at one spot, sorted. `--q` passes URL options.
 *   node --experimental-strip-types tools/perf-breakdown.ts --city=paris-centre --at=48.8656,2.3211
 */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
await page.goto(`http://localhost:5200/?city=${arg('city', 'paris-centre')}&at=${arg('at')}&freeze=1&${arg('q')}`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.waitForTimeout(8000)
const r = await page.evaluate(`(() => {
  const sc = window.__scene
  const by = {}
  for (const m of sc.getActiveMeshes().data.slice(0, sc.getActiveMeshes().length)) {
    const fam = m.name.replace(/[:.].*$/, '').replace(/[0-9]+$/, '') || m.name
    const inst = m.thinInstanceCount || (m.instances ? m.instances.length + 1 : 1)
    const n = (m.getTotalIndices ? m.getTotalIndices() : 0) * Math.max(1, inst)
    by[fam] = by[fam] || { tris: 0, meshes: 0 }
    by[fam].tris += n / 3
    by[fam].meshes++
  }
  return Object.entries(by).sort((a, b) => b[1].tris - a[1].tris).slice(0, 18).map(([k, v]) => [k, Math.round(v.tris / 1000) + 'k tris', v.meshes + ' meshes'])
})()`)
for (const row of r as string[][]) console.log(row.join('  '))
await browser.close()
