/**
 * The worst case for memory (BUGS.md #39): every tile of the city visited, as a very long ride would. The frozen
 * camera is walked over a grid covering the whole box (the city streams round what is looked at), and the heap
 * is read (after a collection) at each stop. The last number is the ceiling a session in this city can reach.
 *   node --experimental-strip-types tools/soak-sweep.ts --city=paris-centre [--step=900]
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { shippedDir } from './bake-files.ts'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'paris-centre')
// the city's box, from the shipped v3 index
const index = JSON.parse(readFileSync(resolve(shippedDir(city), 'index.json'), 'utf8'))
const box = index.box as { x0: number; x1: number; z0: number; z1: number }
const step = Number(arg('step', '900'))
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'] })
const page = await browser.newPage({ viewport: { width: 1024, height: 600 } })
const cdp = await page.context().newCDPSession(page)
await page.goto(`http://localhost:${arg('port', '5200')}/?city=${city}&freeze=1`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
let n = 0
let peak = 0
for (let z = box.z0; z <= box.z1; z += step) {
  for (let x = box.x0; x <= box.x1; x += step) {
    await page.evaluate(`window.__viewLocal([${x}, 60, ${z + 40}], [${x}, 0, ${z}])`)
    await page.waitForTimeout(4000)
    await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 60_000 }).catch(() => {})
    await page.evaluate('window.gc && window.gc()')
    const h = (await cdp.send('Runtime.getHeapUsage') as { usedSize: number }).usedSize / 1048576
    peak = Math.max(peak, h)
    const s = await page.evaluate(`({ tiles: window.__tiles.size ?? 0, meshes: window.__scene.meshes.length, tex: window.__scene.textures.length })`) as { tiles: number; meshes: number; tex: number }
    console.log(`stop ${++n}  (${Math.round(x)}, ${Math.round(z)})  heap ${h.toFixed(0)} MB  tiles ${s.tiles}  meshes ${s.meshes}  textures ${s.tex}`)
  }
}
console.log(`peak heap ${peak.toFixed(0)} MB over ${n} stops`)
await browser.close()
