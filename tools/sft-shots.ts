/**
 * Photograph one builder from several distances, for judging a tall landmark's SILHOUETTE.
 *
 *   node --experimental-strip-types tools/sft-shots.ts --model=salesforceTower
 *
 * Needs the dev server on 5200 (SHOTS_BASE overrides). Writes docs/shots/sft/<model>.png.
 */
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
const model = arg('model', 'salesforceTower')
// --hx/--hz/--height override; the defaults are Salesforce Tower's, which is what this was written for
// Salesforce Tower's OSM footprint is about 47 m across; the bake's fit for way/431972186
const fit = { hx: Number(arg('hx', '23.5')), hz: Number(arg('hz', '24.5')), height: Number(arg('height', '326')) }

const out = resolve(ROOT, 'docs', 'shots', 'sft')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 520, height: 900 } })
page.on('pageerror', (e) => console.log(`  ! ${e.message.split('\n')[0]}`))

await page.goto(`${BASE}/?model=${model}`)
await page.waitForFunction('window.modelReady === true', null, { timeout: 30_000 })
const b = await page.evaluate(`window.__rebuild(${JSON.stringify(fit)})`) as { min: number[]; max: number[] }
const tris = await page.evaluate('window.__modelTris') as number
const H = b.max[1]
console.log(`${model}: ${tris} triangles, ${H.toFixed(1)} m tall, ${(b.max[0] - b.min[0]).toFixed(1)} × ${(b.max[2] - b.min[2]).toFixed(1)} m`)

/** the whole tower, the view from a kilometre off, and the crown (beta is the polar angle: ~1.5 is level) */
const views: [string, number, number, number][] = [
  ['whole', Math.PI / 2 - 0.9, 1.40, H * 1.5],
  ['far', Math.PI / 2 - 0.3, 1.52, H * 4.5],
  ['crown', Math.PI / 2 - 0.9, 1.35, H * 0.30],
]
const shots: string[] = []
for (const [name, az, el, r] of views) {
  const cy = name === 'crown' ? H * 0.90 : H * 0.48
  await page.evaluate(`window.__modelView(${az},${el},${r},0,${cy},0)`)
  await page.waitForTimeout(260)
  const path = resolve(out, `${model}-${name}.png`)
  await page.screenshot({ path })
  shots.push(path)
}
await browser.close()

const sharp = (await import('sharp')).default
const cell = 480
const tiles = await Promise.all(shots.map(async (p, i) => ({
  input: await sharp(p).resize(cell, Math.round(cell * 900 / 520), { fit: 'contain', background: '#fff' }).toBuffer(),
  left: i * cell, top: 0,
})))
const sheet = resolve(out, `${model}.png`)
await sharp({ create: { width: cell * shots.length, height: Math.round(cell * 900 / 520), channels: 3, background: '#fff' } })
  .composite(tiles).png().toFile(sheet)
console.log(sheet)
