/**
 * A short clip of one dog from render/dogs.ts walking, the camera following it side-on while the city runs.
 *   node tools/dog-clip.mjs <out-dir> [mesh="dog.golden retriever"] [seconds=6] [side m=2.4] [up m=0.6] [city=san-francisco]
 * Writes a .webm into out-dir (Playwright's recorder). mesh=line: every breed walking on the spot in a row, side-on
 * (render/dogs.ts `test`), a little behind where the rider starts.
 */
import { chromium } from 'playwright'
const [dir, mesh = 'dog.golden retriever', secs = '6', side = '2.4', up = '0.6', city = 'san-francisco'] = process.argv.slice(2)
const size = { width: 700, height: 400 }
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const ctx = await b.newContext({ viewport: size, recordVideo: { dir, size } })
const p = await ctx.newPage()
await p.goto(`http://localhost:5200/?city=${city}&dev=1&dogs=1`)
await p.waitForFunction('window.crowdReady === true', null, { timeout: 150000 })
if (mesh !== 'line') await p.waitForFunction(`(window.__scene.meshes.find(m => m.name === ${JSON.stringify(mesh)})?.thinInstanceCount ?? 0) > 0`, null, { timeout: 60000 })
await p.addStyleTag({ content: 'body * { visibility: hidden !important } canvas { visibility: visible !important }' })
if (mesh === 'line') {
  await p.waitForFunction('!!window.__dogs', null, { timeout: 60000 })
  await p.evaluate(`(() => {
    const sc = window.__scene, cam = sc.activeCamera, P = cam.getTarget().clone()
    const f = P.subtract(cam.position); f.y = 0; f.normalize()
    const r = { x: f.z, z: -f.x }
    const Q = { x: P.x - f.x * 5, z: P.z - f.z * 5 }
    window.__dogs.test = [0, 1, 2, 3, 4].map((i) => {
      const x = Q.x + r.x * (i - 2) * 1.5, z = Q.z + r.z * (i - 2) * 1.5
      return { at: { x, z }, y: window.__heightAt(x, z), heading: Math.atan2(r.x, r.z), speed: 1.35 }
    })
    const y = window.__heightAt(Q.x, Q.z)
    const C = new cam.position.constructor(Q.x + f.x * ${side}, y + ${up}, Q.z + f.z * ${side}), T = new cam.position.constructor(Q.x, y + 0.3, Q.z)
    sc.onBeforeRenderObservable.add(() => { cam.position.copyFrom(C); cam.setTarget(T) })
  })()`)
} else await p.evaluate(`(() => {
  const sc = window.__scene, m = sc.meshes.find(x => x.name === ${JSON.stringify(mesh)}), cam = sc.activeCamera
  let last = null
  window.__lookHold = () => {
    const d = m._thinInstanceDataStorage.matrixData, n = m.thinInstanceCount
    if (!n) return
    // follow the same dog: the instance nearest where it was last frame
    let k = 0, best = Infinity
    for (let i = 0; i < n; i++) { const e = last ? Math.hypot(d[i*16+12] - last[0], d[i*16+14] - last[1]) : 0; if (e < best) { best = e; k = i } }
    const o = k * 16, x = d[o+12], y = d[o+13], z = d[o+14], rx = d[o], rz = d[o+2], l = Math.hypot(rx, rz) || 1
    last = [x, z]
    cam.position.set(x + rx / l * ${side}, y + ${up}, z + rz / l * ${side})
    cam.setTarget(new cam.position.constructor(x, y + 0.3, z))
  }
  sc.onBeforeRenderObservable.add(window.__lookHold)
})()`)
await p.waitForTimeout(+secs * 1000)
await p.screenshot({ path: `${dir}/frame.png` })
await ctx.close(); await b.close()
