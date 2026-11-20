/**
 * The zoo (render/zoo.ts) in the game: a fixed camera over a paddock, a still and a short recording.
 *   node tools/zoo-clip.mjs <out-dir> [seconds=10] [cam x,z,h] [look x,z,h] [lat,lon to start at] [w h]
 * cam=follow: the camera keeps 16 m to the side of whichever animal is walking (sticky), 3 m up.
 * CITY=san-francisco shoots another city (default paris-centre).
 * Defaults look west across the Vincennes giraffe plain from beside the Maison des girafes.
 */
import { chromium } from 'playwright'
const [dir, secs = '10', cam = '6400,-3112,7', look = '6352,-3104,2', at = '48.8326,2.4187', w = '700', h = '400'] = process.argv.slice(2)
const size = { width: +w, height: +h }
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const ctx = await b.newContext({ viewport: size, recordVideo: +secs > 0 ? { dir, size } : undefined })
const p = await ctx.newPage()
p.on('console', (m) => { if (/zoo/i.test(m.text())) console.log('console:', m.text().slice(0, 200)) })
await p.goto(`http://localhost:5200/?city=${process.env.CITY ?? 'paris-centre'}&dev=1&at=${at}`)
await p.waitForFunction('window.__zoo && window.__zoo.animals.length > 0', null, { timeout: 180000 })
await p.addStyleTag({ content: 'body * { visibility: hidden !important } canvas { visibility: visible !important }' })
const [cx, cz, ch] = cam.split(',').map(Number), [lx, lz, lh] = look.split(',').map(Number)
if (cam === 'follow') await p.evaluate(`(() => {
  const sc = window.__scene, c = sc.activeCamera, V = c.position.constructor, z = window.__zoo
  let k = -1, pos = null, tgt = null
  sc.onBeforeRenderObservable.add(() => {
    const as = z.animals
    if (k < 0 || !as[k]) k = Math.max(0, as.findIndex((a) => a.clip === 'walk'))
    if (as[k].clip !== 'walk') { const w = as.findIndex((a) => a.clip === 'walk'); if (w >= 0) k = w }
    const a = as[k], sx = ${process.env.FRONT ? "Math.sin(a.heading)" : "Math.cos(a.heading)"}, sz = ${process.env.FRONT ? "Math.cos(a.heading)" : "-Math.sin(a.heading)"}
    const P = new V(a.at.x + sx * ${+(process.env.SIDE ?? 16)}, window.__heightAt(a.at.x, a.at.z) + 3, a.at.z + sz * ${+(process.env.SIDE ?? 16)})
    const T = new V(a.at.x, window.__heightAt(a.at.x, a.at.z) + 2.4, a.at.z)
    pos = pos ? V.Lerp(pos, P, 0.03) : P; tgt = tgt ? V.Lerp(tgt, T, 0.1) : T
    c.position.copyFrom(pos); c.setTarget(tgt)
  })
})()`)
else await p.evaluate(`(() => {
  const sc = window.__scene, c = sc.activeCamera, V = c.position.constructor
  const C = new V(${cx}, window.__heightAt(${cx}, ${cz}) + ${ch}, ${cz}), T = new V(${lx}, window.__heightAt(${lx}, ${lz}) + ${lh}, ${lz})
  sc.onBeforeRenderObservable.add(() => { c.position.copyFrom(C); c.setTarget(T) })
})()`)
await p.waitForTimeout(1500)
await p.screenshot({ path: `${dir}/still.png` })
console.log(JSON.stringify(await p.evaluate('window.__zoo.animals.map(a => [Math.round(a.at.x), Math.round(a.at.z), a.clip])')))
if (+secs > 0) await p.waitForTimeout(+secs * 1000)
await ctx.close(); await b.close()
