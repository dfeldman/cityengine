/**
 * BUGS.md #207: what the chase camera is actually AIMING at, sampled while riding — because the symptom is
 * a moving one and a still cannot show it. Prints, every half second of ride time: the rider's position, the
 * camera's eye and target, the PITCH of the aim (negative = looking down) and the deck height under the aim
 * point against the terrain height there.
 *   node --experimental-strip-types tools/cam-probe.ts --at=37.8199,-122.4783 [--seconds=60] [--city=san-francisco] [--port=5200] [--back]
 */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const seconds = Number(arg('seconds', '60'))
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 900, height: 520 } })
page.on('console', (m) => { if (m.type() === 'error') console.log('  page error:', m.text().slice(0, 160)) })
await page.goto(`http://localhost:${arg('port', '5200')}/?city=${arg('city', 'san-francisco')}&at=${arg('at')}&without=life`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 240_000 })
await page.waitForTimeout(2000)
if (process.argv.includes('--back')) { await page.keyboard.press('KeyU'); await page.waitForTimeout(500) }
for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp')
const probe = `(() => {
  const s = window.__scene, c = s.activeCamera, t = c.getTarget()
  const dx = t.x - c.position.x, dz = t.z - c.position.z, dy = t.y - c.position.y
  const flat = Math.hypot(dx, dz)
  const h = window.__here().split(',')
  return { lat: +h[0], lon: +h[1], sec: window.__clock().seconds, speed: window.__clock().speed,
    ex: +c.position.x.toFixed(1), ey: +c.position.y.toFixed(1), ez: +c.position.z.toFixed(1),
    tx: +t.x.toFixed(1), ty: +t.y.toFixed(1), tz: +t.z.toFixed(1),
    pitch: +((Math.atan2(dy, flat) * 180) / Math.PI).toFixed(1), reach: +flat.toFixed(1) }
})()`
let next = 0
const rows: Record<string, number>[] = []
for (let i = 0; i < seconds * 2; i++) {
  await page.waitForFunction(`window.__clock().seconds >= ${next}`, null, { timeout: 120_000 })
  const r = await page.evaluate(probe) as Record<string, number>
  rows.push(r)
  console.log(`t=${r.sec.toFixed(1)}s ${r.lat.toFixed(5)},${r.lon.toFixed(5)} ${(r.speed * 3.6).toFixed(0)} km/h  eye y ${r.ey}  target y ${r.ty}  drop ${(r.ty - r.ey).toFixed(1)} m over ${r.reach} m  PITCH ${r.pitch}°`)
  next = r.sec + 0.5
  if (r.sec > seconds) break
}
const pitches = rows.map((r) => r.pitch)
console.log(`\n${rows.length} samples: pitch min ${Math.min(...pitches)}° max ${Math.max(...pitches)}°, mean ${(pitches.reduce((a, b) => a + b, 0) / pitches.length).toFixed(1)}°`)
await browser.close()
