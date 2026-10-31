/**
 * One command per recipe building: the model beside its photograph, brightness already corrected.
 *   node --experimental-strip-types tools/recipe-sheet.ts <entry name> <photo path> [--out=docs/shots/recipes] [--view=a,b,r,tx,ty,tz]
 * The model-showcase's dim blue lighting reads a white wall as about (105,111,122); every model pixel is multiplied by
 * 255/that, so white reads white and nobody chases brightness. Writes <out>/<entry>.png (photo | model) and restacks
 * every pair there into <out>/sheet.png. Needs the :5200 dev server (the model-shots route); one browser shot.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import sharp from 'sharp'

export const WHITE: [number, number, number] = [105, 111, 122]
const GAIN = WHITE.map((w) => 255 / w)
const [entry, photo] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const out = resolve(process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? 'docs/shots/recipes')
if (!entry || !photo) throw new Error('usage: recipe-sheet.ts <entry> <photo> [--out=dir]')
mkdirSync(out, { recursive: true })
// (--view: the camera a front at local -z needs; the auto corner looks at +z)
const v = process.argv.find((a) => a.startsWith('--view='))?.slice(7)
const view = v ? [`--view=corner:${v}`] : []
const tmp = mkdtempSync(join(tmpdir(), 'recipe-'))
execFileSync('node', ['--experimental-strip-types', 'tools/model-shots.ts', `--entry=${entry}`, '--city=paris', '--views=auto', `--out=${tmp}`, ...view], { stdio: 'inherit' })
const shot = readdirSync(tmp).find((f) => f.endsWith('-corner.png'))
if (!shot) throw new Error('no corner view was written')
const H = 480
const { data, info } = await sharp(join(tmp, shot)).removeAlpha().raw().toBuffer({ resolveWithObject: true })
for (let i = 0; i < data.length; i += 3) for (let c = 0; c < 3; c++) data[i + c] = Math.min(255, Math.round(data[i + c] * GAIN[c]))
const model = await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).resize({ height: H }).png().toBuffer()
const ph = await sharp(photo).resize({ height: H }).png().toBuffer()
const mw = (await sharp(model).metadata()).width!, pw = (await sharp(ph).metadata()).width!
await sharp({ create: { width: pw + mw, height: H, channels: 3, background: '#fff' } }).composite([{ input: ph, left: 0, top: 0 }, { input: model, left: pw, top: 0 }])
  .png().toFile(join(out, `${entry.replace(/[^\w-]+/g, '_')}.png`))
const pairs = await Promise.all(readdirSync(out).filter((f) => f.endsWith('.png') && f !== 'sheet.png').sort().map(async (f) => {
  const b = await sharp(join(out, f)).toBuffer(); return { b, ...(await sharp(b).metadata()) }
}))
const W = Math.max(...pairs.map((p) => p.width!))
await sharp({ create: { width: W, height: H * pairs.length, channels: 3, background: '#fff' } })
  .composite(pairs.map((p, i) => ({ input: p.b, left: 0, top: i * H }))).png().toFile(join(out, 'sheet.png'))
console.log('pair', join(out, `${entry.replace(/[^\w-]+/g, '_')}.png`), '\nsheet', join(out, 'sheet.png'), `(${pairs.length} pairs)`)
