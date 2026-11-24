/**
 * A still of a stranger walking a dog (render/dog-walks.ts), the camera side-on to the dog, via the :5200 dev server.
 *   node tools/dog-shot.mjs <out.png> [city=paris-centre] [side m=3] [up m=1.1] [w=480] [h=300] [wait s=4] [nth dog=0]
 * Loads with ?dogs=1 (every walking group has a dog). DBG='<js expr>' prints that expression from the page first.
 */
import { chromium } from 'playwright'
const [out, city = 'paris-centre', side = '3', up = '1.1', W = '480', H = '300', wait = '4', nth = '0'] = process.argv.slice(2)
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await (await b.newContext({ viewport: { width: +W, height: +H } })).newPage()
const errs = []
p.on('console', (m) => { if (m.type() === 'error' || /dog/i.test(m.text())) errs.push(m.text().slice(0, 200)) })
p.on('pageerror', (e) => errs.push('PAGEERR ' + String(e).slice(0, 300)))
await p.goto(`http://localhost:5200/?city=${city}&dev=1&dogs=1`)
try {
  await p.waitForFunction('window.crowdReady === true', null, { timeout: 180000 })
  await p.waitForFunction('(window.__dogs?.drawnCount ?? 0) > 0', null, { timeout: 90000 })
} catch (e) { console.log('TIMEOUT', String(e).slice(0,120), await p.evaluate(`JSON.stringify({cr: window.crowdReady, d: !!window.__dogs, ready: window.__dogs?.breeds.filter(b=>b.geometry).length, n: window.__dogs?.drawnCount})`), errs.filter(x=>!x.includes('#define')).slice(-6).join('\n')); await b.close(); process.exit(1) }
await p.addStyleTag({ content: 'body * { visibility: hidden !important } canvas { visibility: visible !important }' })
await p.evaluate(`(() => {
  const sc = window.__scene, cam = sc.activeCamera, D = window.__dogs
  sc.onBeforeRenderObservable.add(() => {
    const ks = [...D.walking.values()]; const k = ks[Math.min(ks.length - 1, ${nth})]; if (!k) return
    const P = k.pos, h = k.heading, rx = Math.cos(h), rz = -Math.sin(h)
    cam.position.set(P.x + rx * ${side} - Math.sin(h) * 0.6, P.y + ${up}, P.z + rz * ${side} - Math.cos(h) * 0.6)
    cam.setTarget(new cam.position.constructor(P.x - Math.sin(h) * 0.5, P.y + 0.45, P.z - Math.cos(h) * 0.5))
  })
})()`)
await p.waitForTimeout(+wait * 1000)
console.log('dogs', await p.evaluate('window.__dogs.drawnCount'), 'breeds ready', await p.evaluate('window.__dogs.breeds.filter(b=>b.geometry).length'))
if (process.env.DBG) console.log(await p.evaluate(process.env.DBG))
await p.screenshot({ path: out })
console.log(errs.slice(-5).join('\n'))
await b.close()
