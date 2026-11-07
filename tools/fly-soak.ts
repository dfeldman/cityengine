/**
 * The flying memory soak: freeze mode, the camera held over a loop of points (as the owner flies over the city),
 * sampling JS heap, meshes, geometries, textures and tiles at each. For "the heap climbs while I fly round Paris".
 *   node --experimental-strip-types tools/fly-soak.ts --city=paris-centre [--port=5200] [--hold=12] [--alt=120] [--laps=2]
 */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const HOLD = Number(arg('hold', '12')), ALT = Number(arg('alt', '120')), LAPS = Number(arg('laps', '2'))
const STOPS: [string, number, number][] = [
  ['Eiffel', 48.8584, 2.2945], ['Invalides', 48.8556, 2.3125], ['Concorde', 48.8656, 2.3212], ['Louvre', 48.8606, 2.3376],
  ['Notre-Dame', 48.853, 2.3499], ['Bastille', 48.8532, 2.3691], ['Republique', 48.8674, 2.3636], ['Opera', 48.8719, 2.3316],
  ['Etoile', 48.8738, 2.295], ['Trocadero', 48.8616, 2.2893], ['Montparnasse', 48.8421, 2.3219], ['Pantheon', 48.8462, 2.3464],
]
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
page.on('pageerror', (e) => console.log('pageerror', e.message))
const cdp = await page.context().newCDPSession(page)
await page.goto(`http://localhost:${arg('port', '5200')}/?city=${arg('city', 'paris-centre')}&freeze=1${arg('extra') ? '&' + arg('extra') : ''}`)
await page.waitForFunction('window.gameReady === true', null, { timeout: 300_000 })
const sample = async (label: string): Promise<void> => {
  if (!process.argv.includes('--nogc')) await page.evaluate('window.gc && window.gc()')
  const { usedSize } = await cdp.send('Runtime.getHeapUsage') as { usedSize: number }
  const s = await page.evaluate(`(() => { const sc = window.__scene; const c = window.__city
    return { meshes: sc.meshes.length, geo: sc.geometries.length, tex: sc.textures.length, mats: sc.materials.length,
      b: c.buildStats.builds, rb: c.buildStats.rebuilds, uniq: c.buildStats.keys.size, lm: sc.meshes.filter((m) => m.name.startsWith('landmark:')).length } })()`) as Record<string, number>
  console.log(`${label.padEnd(16)} heap ${String(Math.round(usedSize / 1048576)).padStart(5)} MB  meshes ${s.meshes}  geo ${s.geo}  tex ${s.tex}  mats ${s.mats}  landmarks ${s.lm}  builds ${s.b} (${s.uniq} tiles, ${s.rb} rebuilt)`)
}
const churn = process.argv.includes('--churn')
if (churn) {
  await cdp.send('HeapProfiler.enable')
  await cdp.send('HeapProfiler.startSampling', { samplingInterval: 65536, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true })
}
await sample('start')
for (let lap = 0; lap < LAPS; lap++) for (const [name, lat, lon] of STOPS) {
  await page.evaluate(`window.__view([${lat - 0.004}, ${lon}, ${ALT}], [${lat}, ${lon}, 20])`)
  await page.waitForTimeout(HOLD * 1000)
  await sample(`${lap + 1} ${name}`)
}
// --churn: everything allocated over the flight, garbage included, by the function that allocated it (top 30)
if (churn) {
  interface N { callFrame: { functionName: string; url: string; lineNumber: number }; selfSize: number; children: N[] }
  const { profile } = await cdp.send('HeapProfiler.getSamplingProfile') as { profile: { head: N } }
  const by = new Map<string, number>()
  const walk = (n: N): void => {
    const f = n.callFrame
    const k = `${f.functionName || '(anon)'} ${f.url.split('/').slice(-2).join('/').replace(/\?.*/, '')}:${f.lineNumber + 1}`
    if (n.selfSize) by.set(k, (by.get(k) ?? 0) + n.selfSize)
    for (const c of n.children) walk(c)
  }
  walk(profile.head)
  // --who=quad,push: for those functions, the chains of callers that allocated through them (top 12 each)
  for (const fn of arg('who').split(',').filter(Boolean)) {
    const chains = new Map<string, number>()
    const total = (n: N): number => n.selfSize + n.children.reduce((a, c) => a + total(c), 0)
    const find = (n: N, path: string[]): void => {
      const f = n.callFrame
      const here = `${f.functionName || '(anon)'}@${f.url.split('/').pop()!.replace(/\?.*/, '')}:${f.lineNumber + 1}`
      if (f.functionName === fn) { const k = path.slice(-4).join(' < '); chains.set(k, (chains.get(k) ?? 0) + total(n)); return }
      for (const c of n.children) find(c, [...path, here])
    }
    find(profile.head, [])
    console.log(`who allocates through ${fn}:`)
    for (const [k, v] of [...chains].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  ${String(Math.round(v / 1e6)).padStart(6)} MB  ${k.split(' < ').reverse().join(' < ')}`)
  }
  console.log(`allocated (sampled): ${Math.round([...by.values()].reduce((a, b) => a + b, 0) / 1e6)} MB`)
  for (const [k, v] of [...by].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(`  ${String(Math.round(v / 1e6)).padStart(6)} MB  ${k}`)
}
await browser.close()
