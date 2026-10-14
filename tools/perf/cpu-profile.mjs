// CPU profile of the running game (Chromium, CDP sampling profiler): self time by function and by source file,
// plus inclusive time of the game's top-level per-frame calls.
//   node tools/perf/cpu-profile.mjs --url=http://localhost:5200 --at=37.788,-122.4075 [--q=...] [--secs=5]
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const arg = (n, f = '') => { const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`)); return h ? h.slice(n.length + 3) : f }
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await page.goto(`${arg('url', 'http://localhost:5200')}/?city=san-francisco&at=${arg('at', '37.788,-122.4075')}&freeze=1${arg('q') ? '&' + arg('q') : ''}`)
await page.waitForFunction('window.gameReady === true', null, { timeout: 240_000 })
await page.waitForTimeout(Number(arg('settle', '20000')))
const cdp = await page.context().newCDPSession(page)
await cdp.send('Profiler.enable')
await cdp.send('Profiler.setSamplingInterval', { interval: 200 })
await cdp.send('Profiler.start')
const t0 = Date.now()
const frames = await page.evaluate(`new Promise((done) => { let n = 0; const t = performance.now(); const f = () => { n++; performance.now() - t < ${Number(arg('secs', '5')) * 1000} ? requestAnimationFrame(f) : done(n) }; requestAnimationFrame(f) })`)
const { profile } = await cdp.send('Profiler.stop')
const secs = (Date.now() - t0) / 1000
await browser.close()
writeFileSync(arg('out', 'cpu.cpuprofile'), JSON.stringify(profile))

// self time per node from samples
const byId = new Map(profile.nodes.map((n) => [n.id, n]))
const dt = new Map()
for (let i = 0; i < profile.samples.length; i++) dt.set(profile.samples[i], (dt.get(profile.samples[i]) || 0) + (profile.timeDeltas[i] || 0))
const parent = new Map()
for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id)
const name = (n) => `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.replace(/^.*\/(node_modules\/[^/]+\/|src\/)/, '$1').replace(/\?.*$/, '')}:${n.callFrame.lineNumber + 1}`
const fileOf = (n) => { const u = n.callFrame.url; if (!u) return n.callFrame.functionName || '(native)'; const m = /node_modules\/(@[^/]+\/[^/]+|[^/]+)/.exec(u); if (m) return m[1]; const s = /\/(src\/.*?)(\?|$)/.exec(u); return s ? s[1] : u.slice(-40) }
const self = new Map(), files = new Map()
let total = 0
for (const [id, us] of dt) { const n = byId.get(id); total += us; const k = name(n); self.set(k, (self.get(k) || 0) + us); const f = fileOf(n); files.set(f, (files.get(f) || 0) + us) }
// inclusive time for named game functions: walk ancestors once per sampled node
const incl = new Map()
for (const [id, us] of dt) {
  const seen = new Set()
  let cur = id
  while (cur !== undefined) { const k = name(byId.get(cur)); if (!seen.has(k)) { seen.add(k); incl.set(k, (incl.get(k) || 0) + us) } cur = parent.get(cur) }
}
const ms = (us) => (us / 1000 / frames).toFixed(2)
console.log(`${frames} frames in ${secs.toFixed(1)} s; sampled ${(total / 1000).toFixed(0)} ms (${ms(total)} ms/frame incl. idle)`)
console.log('\nSELF ms/frame, top 30:')
for (const [k, v] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(`  ${ms(v).padStart(6)}  ${k}`)
console.log('\nBY FILE ms/frame, top 25:')
for (const [k, v] of [...files].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${ms(v).padStart(6)}  ${k}`)
console.log('\nINCLUSIVE ms/frame for src/ functions, top 40:')
for (const [k, v] of [...incl].filter(([k]) => / src\//.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(`  ${ms(v).padStart(6)}  ${k}`)
