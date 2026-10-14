// Load profile of Cycle Dash: every request (bytes on the wire and decoded, timing), the game's __marks, and
// main-thread long tasks, from a cold cache.
//   node tools/perf/profile-load.mjs [--url=http://localhost:5201] [--city=san-francisco] [--net=Mbps] [--rtt=ms] [--cpu=4]
//     [--cache: HTTP cache on (a real first visit; without it every repeat is refetched)] [--warm: a second visit] [--out=file.json]
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const arg = (n, f = '') => { const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`)); return h ? h.slice(n.length + 3) : f }

const base = arg('url', 'http://localhost:5201').replace(/\/$/, '')
const city = arg('city', 'san-francisco')
const launchArgs = { args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--enable-precise-memory-info'] }
const ctx = process.argv.includes('--warm')
  ? await chromium.launchPersistentContext(require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'cd-prof-')), { ...launchArgs, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  : await (await chromium.launch(launchArgs)).newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const browser = { close: async () => { const b = ctx.browser(); await ctx.close(); if (b) await b.close() } }
const page = await ctx.newPage()
const cdp = await ctx.newCDPSession(page)
await cdp.send('Network.enable')
await cdp.send('Network.setCacheDisabled', { cacheDisabled: !process.argv.includes('--cache') })
if (arg('net')) {
  const bps = Number(arg('net')) * 1e6 / 8
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: Number(arg('rtt', '30')), downloadThroughput: bps, uploadThroughput: bps / 5 })
}
if (arg('cpu')) await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(arg('cpu')) })

const reqs = new Map()
cdp.on('Network.requestWillBeSent', (e) => reqs.set(e.requestId, { url: e.request.url, start: e.timestamp, type: e.type }))
cdp.on('Network.responseReceived', (e) => { const r = reqs.get(e.requestId); if (r) { r.status = e.response.status; r.mime = e.response.mimeType; r.enc = e.response.headers['content-encoding'] || e.response.headers['Content-Encoding'] || ''; r.ttfb = e.timestamp } })
cdp.on('Network.dataReceived', (e) => { const r = reqs.get(e.requestId); if (r) r.decoded = (r.decoded || 0) + e.dataLength })
cdp.on('Network.requestServedFromCache', (e) => { const r = reqs.get(e.requestId); if (r) r.cached = true })
cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) { r.end = e.timestamp; r.wire = e.encodedDataLength } })
cdp.on('Network.loadingFailed', (e) => { const r = reqs.get(e.requestId); if (r) { r.end = e.timestamp; r.failed = e.errorText } })

await page.addInitScript(() => {
  window.__long = []
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push([Math.round(e.startTime), Math.round(e.duration)]) }).observe({ type: 'longtask', buffered: true }) } catch {}
})
if (process.argv.includes('--warm')) { await page.goto(`${base}/${arg("page", "")}?city=${city}`); await page.waitForFunction('window.__marks && window.__marks.firstFrame !== undefined', null, { timeout: 300_000 }); await page.waitForTimeout(30000); reqs.clear(); await page.evaluate(() => { window.__long = [] }) }
const t0 = Date.now()
const wallStart = await cdp.send('Runtime.evaluate', { expression: 'Date.now()' }).catch(() => null)
await page.goto(`${base}/${arg("page", "")}?city=${city}${arg('q') ? '&' + arg('q') : ''}`, { waitUntil: 'commit' })
let firstFrame = null
try {
  await page.waitForFunction('window.__marks && window.__marks.firstFrame !== undefined', null, { timeout: 300_000 })
  firstFrame = Date.now() - t0
} catch (e) { console.error('no first frame:', String(e).slice(0, 200)) }
// let streaming settle: no request finishing for 3 s (cap 60 s)
let lastEnd = Date.now()
const settleStart = Date.now()
const n0 = () => [...reqs.values()].filter((r) => r.end).length
let seen = n0()
while (Date.now() - settleStart < 60_000) {
  await page.waitForTimeout(500)
  const n = n0(); if (n !== seen) { seen = n; lastEnd = Date.now() }
  if (Date.now() - lastEnd > 3000) break
}
const settled = Date.now() - t0
const pageInfo = await page.evaluate(() => ({ marks: window.__marks, long: window.__long, heapMB: Math.round((performance.memory?.usedJSHeapSize || 0) / 1e6), engine: window.__scene?.getEngine?.().constructor?.name, isWebGPU: window.__scene?.getEngine?.().isWebGPU }))
await browser.close()

const list = [...reqs.values()].filter((r) => r.end)
const t = Math.min(...list.map((r) => r.start))
const cat = (r) => {
  const u = r.url
  if (/r2\.dev/.test(u)) return /asset-index|master-index/.test(u) ? 'bucket: indexes' : /\.glb/.test(u) ? 'bucket: models' : /\.(png|jpg|webp|ktx2)/.test(u) ? 'bucket: textures' : 'bucket: other (avatar bins etc.)'
  if (/\/assets\/.*\.js/.test(u) || /\.js(\?|$)/.test(u)) return 'js'
  // a city ships as public/cities/<id>/v3/ (tools/bake-files.ts): its tiles are <tx>_<ty>.json beside the index
  if (/\/cities\/[^/]+\/v3\/-?\d+_-?\d+\.json/.test(u)) return 'city tiles'
  if (/\/cities\//.test(u)) return 'city other (index, ride, terrain, river)'
  if (/\/mh\/|\/env\//.test(u)) return 'avatar (local)'
  if (/\.(png|jpg|webp)/.test(u)) return 'textures (local)'
  if (/\.glb/.test(u)) return 'models (local)'
  return 'other'
}
const by = {}
for (const r of list) { const k = cat(r); by[k] ??= { n: 0, wireMB: 0, decodedMB: 0, firstStart: 1e9, lastEnd: 0 }; const b = by[k]; b.n++; b.wireMB += (r.wire || 0) / 1e6; b.decodedMB += (r.decoded || 0) / 1e6; b.firstStart = Math.min(b.firstStart, r.start - t); b.lastEnd = Math.max(b.lastEnd, r.end - t) }
for (const b of Object.values(by)) { b.wireMB = +b.wireMB.toFixed(2); b.decodedMB = +b.decodedMB.toFixed(2); b.firstStart = +b.firstStart.toFixed(2); b.lastEnd = +b.lastEnd.toFixed(2) }
const top = list.sort((a, b) => (b.wire || 0) - (a.wire || 0)).slice(0, 15).map((r) => ({ url: r.url.replace(base, '').slice(0, 90), wireMB: +((r.wire || 0) / 1e6).toFixed(2), decodedMB: +((r.decoded || 0) / 1e6).toFixed(2), enc: r.enc, start: +(r.start - t).toFixed(2), dur: +(r.end - r.start).toFixed(2) }))
const long = pageInfo.long || []
const out = {
  url: base, city, net: arg('net') || 'unthrottled', cpu: arg('cpu') || 1,
  toFirstFrameMs: firstFrame, settledMs: settled, requests: list.length, fromCache: list.filter((r) => r.cached || r.wire === 0).length,
  wireMB: +(list.reduce((s, r) => s + (r.wire || 0), 0) / 1e6).toFixed(1), decodedMB: +(list.reduce((s, r) => s + (r.decoded || 0), 0) / 1e6).toFixed(1),
  engine: pageInfo.engine, isWebGPU: pageInfo.isWebGPU, heapMB: pageInfo.heapMB, marks: pageInfo.marks,
  longTasks: { count: long.length, totalMs: long.reduce((s, x) => s + x[1], 0), top: long.sort((a, b) => b[1] - a[1]).slice(0, 10) },
  byCategory: by, top,
}
console.log(JSON.stringify(out, null, 1))
if (arg('out')) writeFileSync(arg('out'), JSON.stringify({ ...out, all: list }, null, 1))
