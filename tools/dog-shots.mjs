/**
 * A dog from render/dogs.ts, photographed side-on once the dogs are built (look-at.ts freezes before they are).
 *   node tools/dog-shots.mjs [mesh="dog.golden retriever"] [w h] <out.png> [side m] [up m]   — 175 100 to frame, 350 200 to judge
 */
import { chromium } from 'playwright'
const [mesh = 'dog.golden retriever', w = '350', h = '200', out, side = '2.2', up = '0.7'] = process.argv.slice(2)
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: +w, height: +h } })
await p.goto('http://localhost:5200/?city=san-francisco&dev=1&dogs=1')
await p.waitForFunction('window.crowdReady === true', null, { timeout: 150000 })
await p.waitForFunction(`(window.__scene.meshes.find(m => m.name === ${JSON.stringify(mesh)})?.thinInstanceCount ?? 0) > 0`, null, { timeout: 60000 })
await p.waitForTimeout(1500)
await p.addStyleTag({ content: 'body * { visibility: hidden !important } canvas { visibility: visible !important }' })
await p.keyboard.press('KeyF'); await p.waitForTimeout(300)
await p.evaluate(`(() => {
  const sc = window.__scene, m = sc.meshes.find(x => x.name === ${JSON.stringify(mesh)})
  const d = m._thinInstanceDataStorage.matrixData
  // the instance's own x axis (its right): stand off to its side
  const rx = d[0], rz = d[2], l = Math.hypot(rx, rz) || 1
  const x = d[12], y = d[13], z = d[14], cam = sc.activeCamera
  window.__lookHold = () => { cam.position.set(x + rx / l * ${side}, y + ${up}, z + rz / l * ${side}); cam.setTarget(new cam.position.constructor(x, y + 0.35, z)) }
  sc.onBeforeRenderObservable.add(window.__lookHold)
})()`)
await p.waitForTimeout(800)
await p.screenshot({ path: out })
await b.close()
