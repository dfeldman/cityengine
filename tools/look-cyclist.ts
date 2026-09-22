/**
 * Photograph the nearest stranger cyclist (BUGS.md #1): waits for the crowd's kit bodies, freezes, and stands
 * the camera beside the first instanced crowd bike.
 *   node --experimental-strip-types tools/look-cyclist.ts --out=/path/shot.png [--city=paris-marais] [--q=high]
 */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : f
}
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 200)) })
await page.goto(`http://localhost:5200/?city=${arg('city', 'paris-marais')}&crowd=crowded${arg('q') ? `&q=${arg('q')}` : ''}`)
await page.waitForFunction('window.crowdReady === true', null, { timeout: 180_000 })
// the cyclist variants are built third and fifth; give the rest a moment and the crowd time to fill the road
await page.waitForTimeout(8000)
const found = await page.evaluate(`(() => {
  const sc = window.__scene
  const bikes = sc.meshes.filter((x) => x.name.startsWith('crowdBike') && x.thinInstanceCount > 0 && x.isEnabled())
  if (bikes.length === 0) return { names: sc.meshes.filter((x) => x.name.startsWith('crowdBike')).map((x) => x.name + ':' + x.thinInstanceCount) }
  const b = bikes[0]._thinInstanceDataStorage.matrixData
  const cyclists = window.__crowd.all.filter((w) => w.kind === 'cycle').length
  return { at: [b[12], b[13], b[14]], heading: Math.atan2(b[8], b[10]), cyclists }
})()`) as { at?: number[]; heading?: number; cyclists?: number; names?: string[] }
console.log(JSON.stringify(found))
if (!found.at) { await browser.close(); process.exit(1) }
await page.keyboard.press('KeyF')
await page.waitForTimeout(300)
// follow the first instanced bike every frame: the crowd keeps moving after the freeze
const side = Number(arg('side', '1'))
await page.evaluate(`(() => {
  const sc = window.__scene
  const cam = sc.activeCamera
  sc.onBeforeRenderObservable.add(() => {
    const m = sc.meshes.find((x) => x.name.startsWith('crowdBike') && x.thinInstanceCount > 0 && x.isEnabled())
    if (!m) return
    const b = m._thinInstanceDataStorage.matrixData
    const x = b[12], y = b[13], z = b[14], h = Math.atan2(b[8], b[10])
    cam.position.set(x + Math.cos(h) * 3.2 * ${side} + Math.sin(h) * 2.2, y + 1.5, z - Math.sin(h) * 3.2 * ${side} + Math.cos(h) * 2.2)
    cam.setTarget(new cam.position.constructor(x, y + 0.9, z))
  })
})()`)
await page.waitForTimeout(1500)
await page.screenshot({ path: arg('out') })
await browser.close()
