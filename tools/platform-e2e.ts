/**
 * CITY DASH ON DANDYHORSE, END TO END (INTEGRATION.md §9). Needs a Dandyhorse server running locally in its
 * development login mode (`make serve` in the dandyhorse checkout, port 8080) and, for GAME=http://localhost:5200,
 * this repo's dev server. Logs in, launches a debug bike session, plays the bridge (a simulated bike at WATTS,
 * reporting every 500 ms; 0 W after 40 s), opens the platform's shim as the bridge would, and prints both sides
 * every 10 s: the game's HUD, and what the bridge is asked for (`requested.grade`, the d-pad prompt). Presses
 * d-pad left once, ends the session complete and checks History got its picture.
 *   [DH=http://localhost:8080] GAME=https://dash.dfeldman.org WATTS=200 SECS=60 node tools/platform-e2e.ts
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pw = require('playwright')
const DH = process.env.DH ?? 'http://localhost:8080'
const GAME = process.env.GAME ?? 'http://localhost:5200'
const WATTS = Number(process.env.WATTS ?? 220)
const SECS = Number(process.env.SECS ?? 90)
const login = await fetch(`${DH}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid: 1 }) })
const token = ((await login.json()) as { token: string }).token
const cookie = `dh_token=${token}`
const api = async (method: string, path: string, body?: unknown) => {
  const r = await fetch(`${DH}${path}`, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) })
  const t = await r.text()
  try { return JSON.parse(t) } catch { return { status: r.status, text: t.slice(0, 200) } }
}
// any session already running for this user ends first
const cur = await api('GET', '/api/sessions/current')
if (cur?.session?.sessionId) await api('POST', `/api/sessions/${cur.session.sessionId}/end`, {})
const launched = await api('POST', '/api/sessions/launch', { gameId: 'citydash', variant: 'bike', deviceType: 'bike', debug: true, duration: 900, options: { traffic: 'some' } })
const sid = launched.sessionId
console.log('launched', sid, launched.session?.status ?? JSON.stringify(launched).slice(0, 200))
// the bridge: a simulated bike, reporting every 500 ms
let watts = WATTS
const bridge = setInterval(() => {
  void api('POST', '/bridgeapi/putstate', {
    bridgeId: 'e2e-bridge', timestamp: Date.now(),
    devices: [{ role: 'fitness', type: 'bike', name: 'Simulated bike', address: 'sim:e2e', protocol: 'sim', status: 'simulated' }],
    actual: { power: watts, cadence: 85 },
  })
}, 500)
const b = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal'] })
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } })
await ctx.addCookies([{ name: 'dh_token', value: token, url: DH }])
const page = await ctx.newPage()
page.on('console', (m: any) => { const t = m.text(); if (/citydash|error|Error/.test(t)) console.log('  [page]', t.slice(0, 200)) })
await page.goto(`${DH}/games/citydash/index.html?session=${sid}&variant=bike&seed=1&debug=1&citydash=${encodeURIComponent(GAME)}`)
const t0 = Date.now()
let inner: any = null
while (Date.now() - t0 < 240000) {
  inner = page.frames().find((f: any) => f.url().startsWith(GAME))
  if (inner && await inner.evaluate(() => (window as any).gameReady === true).catch(() => false)) break
  await page.waitForTimeout(2000)
}
console.log('game ready after', Math.round((Date.now() - t0) / 1000), 's; frame', inner?.url().slice(0, 120))
if (!inner) { console.log('no game frame from', GAME, '— is it running?'); clearInterval(bridge); await api('POST', `/api/sessions/${sid}/end`, { status: 'discarded' }); await b.close(); process.exit(1) }
for (let s = 0; s < SECS; s += 10) {
  await page.waitForTimeout(10000)
  const game = await inner.evaluate(() => { const hud = document.querySelector('.sr-speed, [class*=speed]'); return hud?.textContent?.trim().slice(0, 40) ?? null }).catch((e: any) => String(e))
  const st = await api('GET', `/api/sessions/${sid}`)
  const bv = await api('GET', '/bridgeapi/getstate?bridgeId=e2e-bridge')
  console.log(`t+${s + 10}s`, 'hud:', game, '| server:', JSON.stringify({ status: st?.status ?? st?.session?.status, distance: Math.round(st?.distance ?? st?.session?.distance ?? 0),
    toBridge: { grade: bv?.requested?.grade, incline: bv?.requested?.incline, speed: bv?.requested?.speed, prompt: bv?.requestedInput?.id ?? bv?.requestedInput?.promptId ?? null } }).slice(0, 300))
    if (s === 10) console.log('  d-pad left:', JSON.stringify(await api('POST', '/bridgeapi/sendinput', { bridgeId: 'e2e-bridge', promptId: 'steer', choice: 'left' })))
  if (s === 30) watts = 0
}
clearInterval(bridge)
// ended as a rider's ■ End does: complete (a discard sends no picture)
await api('POST', `/api/sessions/${sid}/end`, { status: 'complete' })
for (let k = 0; k < 6; k++) {
  await page.waitForTimeout(4000)
  const img = await fetch(`${DH}/api/sessions/${sid}/image`, { headers: { Cookie: cookie } })
  const n = (await img.arrayBuffer()).byteLength
  console.log(`History image ${4 * (k + 1)} s after the end:`, img.status, img.headers.get('content-type'), n, 'bytes')
  if (img.status === 200) break
}
await b.close()
