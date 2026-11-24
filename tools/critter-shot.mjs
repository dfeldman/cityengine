/**
 * Stills of the small mammals (render/critters.ts, critterkit), via the :5200 dev server.
 *   node tools/critter-shot.mjs <out-prefix> <city> <lat,lon,family[,dist,up]> ... [W=320 H=200 WAIT=5]
 * Loads with ?critters=1 (a group in every square), and for each stop jumps there (window.__jump), waits WAIT s, frames
 * the nearest group of that family (squirrel | rabbit | canid | cat) and writes <out-prefix>-<n>.png.
 * RIDE=<m/s> then drives a fake rider through the group and shoots WAIT2 s later (flush test).
 */
import { chromium } from 'playwright'
const [prefix, city, ...stops] = process.argv.slice(2)
const W = +(process.env.W ?? 320), H = +(process.env.H ?? 200), WAIT = +(process.env.WAIT ?? 5)
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage()
const errs = []
p.on('console', (m) => { if (m.type() === 'error' || /critter/i.test(m.text())) errs.push(m.text().slice(0, 200)) })
p.on('pageerror', (e) => errs.push('PAGEERR ' + String(e).slice(0, 300)))
await p.goto(`http://localhost:5200/?city=${city}&dev=1&critters=1`)
try { await p.waitForFunction('window.riderReady === true && !!window.__critters', null, { timeout: 180000 }) }
catch (e) { console.log('TIMEOUT', String(e).slice(0, 120), errs.filter((x) => !x.includes('#define')).slice(-6).join('\n')); await b.close(); process.exit(1) }
await p.addStyleTag({ content: 'body * { visibility: hidden !important } canvas { visibility: visible !important }' })
let n = 0
for (const s of stops) {
  const [lat, lon, fam, dist = '1.6', up = '0.5'] = s.split(',')
  await p.evaluate(`window.__shotHook && window.__scene.onBeforeRenderObservable.remove(window.__shotHook); if (window.__origUpdate) window.__critters.update = window.__origUpdate; window.__jump(${lat}, ${lon}, 0)`)
  await p.waitForTimeout(WAIT * 1000)
  const ok = await p.evaluate(`(() => {
    const sc = window.__scene, cam = sc.activeCamera, C = window.__critters, c = cam.position.clone()
    const gs = C.groups.filter(g => g.spec.habits.family === '${fam}').sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))
    if (!gs.length) return 'none of ${fam} among ' + C.groups.length + ' groups: ' + [...new Set(C.groups.map(g => g.spec.name))].join(' ')
    const g = gs[0]; window.__shotGroup = g
    // the rider (who decides what is drawn) a calm 40 m off, so a far group still shows
    if (!window.__origUpdate) window.__origUpdate = C.update
    C.update = function (dt, at) { return window.__origUpdate.call(this, dt, { x: window.__shotGroup.x + 40, z: window.__shotGroup.z }) }
    const k = g.critters[0], L = g.spec.length * ${dist} * 2.2
    window.__shotHook = sc.onBeforeRenderObservable.add(() => {
      const P = k.pose
      cam.position.set(P.x + L, P.y + L * ${up}, P.z + L * 0.5)
      cam.setTarget(new cam.position.constructor(P.x, P.y + g.spec.length * 0.3, P.z))
    })
    return g.spec.name + ' x' + g.critters.length + ' ' + Math.round(Math.hypot(g.x - c.x, g.z - c.z)) + 'm off'
  })()`)
  await p.waitForTimeout(1500)
  if (process.env.RIDE) {
    await p.evaluate(`(() => { const g = window.__shotGroup, C = window.__critters, v = ${+process.env.RIDE}, t0 = performance.now()
      C.update = function (dt, at) { const s = (performance.now() - t0) / 1000; return window.__origUpdate.call(this, dt, { x: g.x - 15 + v * s, z: g.z }) } })()`)
    await p.waitForTimeout(+(process.env.WAIT2 ?? 3) * 1000)
  }
  if (process.env.DBG) console.log(await p.evaluate(process.env.DBG))
  const st = await p.evaluate(`window.__shotGroup ? window.__shotGroup.critters.map(c => c.state).join(',') : ''`)
  const out = `${prefix}-${n++}.png`
  await p.screenshot({ path: out })
  console.log(out, fam, ok, st)
}
console.log(errs.filter((x) => !x.includes('#define')).slice(-5).join('\n'))
await b.close()
