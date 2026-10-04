/**
 * HANDS OFF (owner, 2026-10-03: "in trainer mode, it is very important that the user never has to touch the controls
 * at all (they may not have any controls) … get through gridlocked intersections seamlessly, without having to wait for
 * minutes or back up or scoot around things"). Rides the game in trainer-debug mode at a steady 180 W with NO input at
 * all — no turns, no U-turns, no backing up — for `--minutes`, from a start point in the thick of the traffic, and
 * reports every stall: the rider standing still while pedalling, how long, where, and what held them.
 *
 *   node --experimental-strip-types tools/trainer-soak.ts --at=37.7879,-122.4075 --minutes=10 [--limit=20]
 *
 * Exit code 1 if any stall lasted longer than `--limit` seconds. Needs the dev server on 5200.
 */
import { chromium } from 'playwright'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const at = arg('at', '37.7879,-122.4075')
const minutes = Number(arg('minutes', '10'))
const limit = Number(arg('limit', '20'))
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 960, height: 600 } })
page.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 200)))
await page.goto(`http://localhost:${arg('port', '5200')}/?city=san-francisco&mode=debug&at=${at}`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
// (the welcome card, if any, goes the way a trainer rider's would: on its own, or not at all — so nothing is pressed)
type Ride = { hold: string; speed: number; x: number; z: number; lead: { gap: number; speed: number } | null; stalled: number }
type Stall = { from: number; seconds: number; x: number; z: number; hold: string; lead: string; solid: string; ll: string }
const stalls: Stall[] = []
let cur: Stall | null = null
let travelled = 0
let last: Ride | null = null
const t0 = Date.now()
while (Date.now() - t0 < minutes * 60_000) {
  await page.waitForTimeout(500)
  const r = await page.evaluate('window.__ride()') as Ride
  const solid = await page.evaluate('JSON.stringify(window.__solid?.last ?? null)') as string
  if (last) travelled += Math.hypot(r.x - last.x, r.z - last.z)
  last = r
  const t = (Date.now() - t0) / 1000
  if (r.speed < 0.3) {
    if (!cur) {
      const ll = await page.evaluate('window.__here ? window.__here() : ""') as string
      cur = { from: t, seconds: 0, x: Math.round(r.x), z: Math.round(r.z), hold: r.hold, lead: r.lead ? `gap ${r.lead.gap.toFixed(1)} v ${r.lead.speed.toFixed(1)}` : '-', solid, ll }
    }
    cur.seconds = t - cur.from
    if (r.hold) cur.hold = r.hold
    if (r.lead) cur.lead = `gap ${r.lead.gap.toFixed(1)} v ${r.lead.speed.toFixed(1)}`
    if (solid !== 'null') cur.solid = solid
  } else if (cur) {
    if (cur.seconds >= 2) stalls.push(cur)
    cur = null
  }
}
if (cur && cur.seconds >= 2) stalls.push(cur)
await browser.close()
const total = stalls.reduce((a, s) => a + s.seconds, 0)
console.log(`${minutes} min hands off from ${at}: ${Math.round(travelled)} m ridden, ${stalls.length} stalls ≥ 2 s, ${total.toFixed(0)} s standing`)
for (const s of stalls.sort((a, b) => b.seconds - a.seconds).slice(0, 25)) {
  console.log(`  ${s.seconds.toFixed(1).padStart(6)} s  at ${s.ll || `${s.x},${s.z}`}  hold=${s.hold || '-'}  lead=${s.lead}  solid=${s.solid}`)
}
const worst = Math.max(0, ...stalls.map((s) => s.seconds))
process.exit(worst > limit ? 1 : 0)
