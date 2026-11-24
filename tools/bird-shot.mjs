/**
 * A still of a flock of scenery birds (render/birds.ts, birdkit), via the :5200 dev server.
 *   node tools/bird-shot.mjs <out.png> [city=paris-centre] [dist m=2.2] [up m=0.7] [w=480] [h=300] [wait s=4] [nth flock=0]
 * Loads with ?birds=1 (a flock in every square) and frames the nth-nearest flock's first ground bird.
 * RIDE=<m/s> drives a fake rider through the flock at that speed after the wait, then shoots WAIT2 s later (flush test).
 * DBG='<js expr>' prints that expression from the page.
 */
import { chromium } from 'playwright'
const [out, city = 'paris-centre', dist = '2.2', up = '0.7', W = '480', H = '300', wait = '4', nth = '0'] = process.argv.slice(2)
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await (await b.newContext({ viewport: { width: +W, height: +H } })).newPage()
const errs = []
p.on('console', (m) => { if (m.type() === 'error' || /bird/i.test(m.text())) errs.push(m.text().slice(0, 200)) })
p.on('pageerror', (e) => errs.push('PAGEERR ' + String(e).slice(0, 300)))
await p.goto(`http://localhost:5200/?city=${city}&dev=1&birds=1`)
try {
  await p.waitForFunction('window.riderReady === true && !!window.__birds', null, { timeout: 180000 })
  await p.waitForFunction('(window.__birds?.drawnCount ?? 0) > 0', null, { timeout: 90000 })
} catch (e) { console.log('TIMEOUT', String(e).slice(0, 120), await p.evaluate(`JSON.stringify({b: !!window.__birds, f: window.__birds?.flocks.length, n: window.__birds?.drawnCount})`), errs.filter((x) => !x.includes('#define')).slice(-6).join('\n')); await b.close(); process.exit(1) }
await p.addStyleTag({ content: 'body * { visibility: hidden !important } canvas { visibility: visible !important }' })
await p.evaluate(`(() => {
  const sc = window.__scene, cam = sc.activeCamera, B = window.__birds
  const c = cam.position.clone()
  const fs = B.flocks.filter(f => Math.hypot(f.x - c.x, f.z - c.z) < 90).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))
  const f = fs[Math.min(fs.length - 1, ${nth})]
  window.__shotFlock = f
  const bird = f.birds.find(b => b.mode === 'ground') ?? f.birds[0]
  const P = { x: bird.pose.x, y: bird.pose.y, z: bird.pose.z }
  sc.onBeforeRenderObservable.add(() => {
    cam.position.set(P.x + ${dist}, P.y + ${up}, P.z + ${dist} * 0.5)
    cam.setTarget(new cam.position.constructor(P.x, P.y + 0.15, P.z))
  })
})()`)
await p.waitForTimeout(+wait * 1000)
if (process.env.RIDE) {
  await p.evaluate(`(() => { const f = window.__shotFlock, B = window.__birds, v = ${+process.env.RIDE}
    let x = f.x - 15, t0 = performance.now()
    B.update = ((orig) => function (dt, at) { const s = (performance.now() - t0) / 1000; return orig.call(this, dt, { x: f.x - 15 + v * s, z: f.z }) })(B.update)
  })()`)
  await p.waitForTimeout(+(process.env.WAIT2 ?? 3) * 1000)
}
const f = await p.evaluate('JSON.stringify({flocks: window.__birds.flocks.length, drawn: window.__birds.drawnCount, shot: window.__shotFlock.spec.name, n: window.__shotFlock.birds.length, modes: window.__shotFlock.birds.map(b => b.mode[0]).join("")})')
console.log(f)
if (process.env.DBG) console.log(await p.evaluate(process.env.DBG))
await p.screenshot({ path: out })
console.log(errs.filter((x) => !x.includes('#define')).slice(-5).join('\n'))
await b.close()
