/**
 * HANDS OFF (owner, 2026-10-03: "in trainer mode, it is very important that the user never has to touch the controls
 * at all (they may not have any controls) … get through gridlocked intersections seamlessly, without having to wait for
 * minutes or back up or scoot around things"). Rides the game in trainer-debug mode at a steady 180 W with NO input at
 * all — no turns, no U-turns, no backing up — for `--minutes`, from a start point in the thick of the traffic, and
 * reports every stall: the rider standing still while pedalling, how long, where, and what held them.
 *
 *   node --experimental-strip-types tools/trainer-soak.ts --at=37.7879,-122.4075 --minutes=10 [--limit=20] [--city=paris-centre] [--without=parkplan,parkline]
 *
 * Also tallies the seconds spent slow (under 2 m/s): held by a car or cyclist ahead, by a hold, or neither.
 *
 * Exit code 1 if any stall lasted longer than `--limit` seconds. Needs the dev server on 5200.
 */
import { chromium } from 'playwright'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const at = arg('at', '37.7879,-122.4075')
const city = arg('city', 'san-francisco')
const minutes = Number(arg('minutes', '10'))
const limit = Number(arg('limit', '20'))
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 960, height: 600 } })
page.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 200)))
await page.goto(`http://localhost:${arg('port', '5200')}/?city=${city}&mode=debug&at=${at}${arg('without') ? `&without=${arg('without')}` : ''}`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
// (the welcome card, if any, goes the way a trainer rider's would: on its own, or not at all — so nothing is pressed)
type Ride = { sim?: number; travelled?: number; limit?: string; surface?: string; foot?: boolean; grade?: number; junction?: number | null; hold: string; speed: number; x: number; z: number; lead: { gap: number; speed: number } | null; stalled: number }
type Stall = { from: number; seconds: number; x: number; z: number; hold: string; lead: string; solid: string; ll: string }
const stalls: Stall[] = []
let cur: Stall | null = null
let travelled = 0
/** seconds under 2 m/s: under a hold (a card, a light), within 8 m of a leader, or neither (a corner, a junction) */
const slow = { hold: 0, behind: 0, other: 0 }
/** seconds and mean speed by what held the speed (`why` below), and how many of them within 25 m of a junction */
const spent: Record<string, { s: number; v: number; near: number }> = {}
let last: Ride | null = null
const t0 = Date.now()
let first: Ride | null = null
while (Date.now() - t0 < minutes * 60_000) {
  await page.waitForTimeout(500)
  const r = await page.evaluate('window.__ride()') as Ride
  const solid = await page.evaluate('JSON.stringify(window.__solid?.last ?? null)') as string
  if (last) travelled += Math.hypot(r.x - last.x, r.z - last.z)
  last = r
  first ??= r
  const t = (Date.now() - t0) / 1000
  {
    // what the time went to: the cap that held the speed this frame, else the ground (a climb, cobbles, a path)
    const why = r.hold ? `hold:${r.hold}` : r.limit ? r.limit : (r.grade ?? 0) > 0.03 ? 'climb' : r.foot ? 'path' : r.surface && r.surface !== 'asphalt' ? r.surface : 'free'
    const b = (spent[why] ??= { s: 0, v: 0, near: 0 })
    b.s += 0.5; b.v += r.speed * 0.5; if (r.junction !== null && r.junction !== undefined && r.junction < 25) b.near += 0.5
  }
  if (r.speed < 2) slow[r.hold ? 'hold' : r.lead && r.lead.gap < 8 ? 'behind' : 'other'] += 0.5
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
if (first && last && last.sim !== undefined && first.sim !== undefined) {
  const simS = last.sim - first.sim, m = (last.travelled ?? 0) - (first.travelled ?? 0)
  console.log(`sim clock ${simS.toFixed(0)} s of ${((Date.now() - t0) / 1000).toFixed(0)} s wall: ${m.toFixed(0)} m ridden, ${(m / Math.max(1, simS)).toFixed(1)} m/s in game time`)
}
const total = stalls.reduce((a, s) => a + s.seconds, 0)
console.log(`${minutes} min hands off from ${at}: ${Math.round(travelled)} m ridden, ${stalls.length} stalls ≥ 2 s, ${total.toFixed(0)} s standing; slow (<2 m/s): ${slow.hold} s hold, ${slow.behind} s behind a leader, ${slow.other} s other`)
for (const [k, b] of Object.entries(spent).sort((a, c) => c[1].s - a[1].s)) console.log(`  ${k.padEnd(18)} ${b.s.toFixed(0).padStart(4)} s  mean ${(b.v / b.s).toFixed(1)} m/s  ${Math.round(100 * b.near / b.s)}% near a junction`)
for (const s of stalls.sort((a, b) => b.seconds - a.seconds).slice(0, 25)) {
  console.log(`  ${s.seconds.toFixed(1).padStart(6)} s  at ${s.ll || `${s.x},${s.z}`}  hold=${s.hold || '-'}  lead=${s.lead}  solid=${s.solid}`)
}
const worst = Math.max(0, ...stalls.map((s) => s.seconds))
process.exit(worst > limit ? 1 : 0)
