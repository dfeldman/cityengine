/**
 * Where a city's JS memory goes: Chrome's sampling heap profiler over the load, reported as retained bytes by
 * the function that allocated them (top 25). For "why does this city hold a gigabyte".
 *   node --experimental-strip-types tools/heap-profile.ts --city=paris-centre
 */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : f
}
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
const cdp = await page.context().newCDPSession(page)
await cdp.send('HeapProfiler.enable')
await cdp.send('HeapProfiler.startSampling', { samplingInterval: 65536 })
await page.goto(`http://localhost:${arg('port', '5200')}/?city=${arg('city', 'paris-centre')}&freeze=1&without=life`)
await page.waitForFunction('window.__marks && window.__marks.firstFrame !== undefined', null, { timeout: 300_000 })
await page.waitForTimeout(3000)
await page.evaluate('window.gc && window.gc()')
const { profile } = await cdp.send('HeapProfiler.getSamplingProfile') as { profile: { head: Node } }
interface Node { callFrame: { functionName: string; url: string; lineNumber: number }; selfSize: number; children: Node[] }
const by = new Map<string, number>()
const walk = (n: Node, path: string[]): void => {
  const f = n.callFrame
  const here = `${f.functionName || '(anon)'} ${f.url.split('/').slice(-2).join('/').replace(/\?.*/, '')}:${f.lineNumber + 1}`
  if (n.selfSize) by.set(here, (by.get(here) ?? 0) + n.selfSize)
  for (const c of n.children) walk(c, [...path, here])
}
walk(profile.head, [])
const total = [...by.values()].reduce((a, b) => a + b, 0)
console.log(`retained (sampled): ${Math.round(total / 1e6)} MB`)
for (const [k, v] of [...by].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${String(Math.round(v / 1e6)).padStart(5)} MB  ${k}`)
await browser.close()
