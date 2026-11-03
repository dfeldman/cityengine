/**
 * The benchmark's photographs: the Commons files named in buildings.json, downloaded once at a fixed size.
 *
 *   node --experimental-strip-types tools/benchmark/modeling/photos.ts [id…]     fetch what is missing
 *   node --experimental-strip-types tools/benchmark/modeling/photos.ts --sheet    one contact sheet of all twenty
 *
 * Every run sees the identical files: chosen once by eye, pinned by title, never searched for at run time (a
 * research step cost 75k–127k tokens a building in the earlier experiment, and would make runs incomparable).
 * Files land in tools/cache/benchmark-photos/<id>/<n>.jpg — a download cache, gitignored like the rest of
 * tools/cache. Attribution stays in buildings.json beside each title.
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { HERE, loadBuildings, type Building } from './buildings.ts'

const require = createRequire(import.meta.url)
const UA = 'streetrunner-bench/1.0 (building-modelling benchmark; https://github.com/)'
export const PHOTO_DIR = resolve(HERE, '..', '..', 'cache', 'benchmark-photos')
const sleep = (ms: number): Promise<void> => new Promise((ok) => setTimeout(ok, ms))

export const photoPath = (b: Building, n: number): string => resolve(PHOTO_DIR, b.id, `${n}.jpg`)

/** the photographs as JPEG bytes, longest side `px` */
export async function photoBytes(b: Building, count: number, px: number): Promise<Buffer[]> {
  const sharp = require('sharp')
  const out: Buffer[] = []
  for (let n = 0; n < Math.min(count, b.photos.length); n++) {
    const f = photoPath(b, n)
    if (!existsSync(f)) throw new Error(`${b.id}: photo ${n} is not downloaded — run photos.ts first`)
    out.push(await sharp(readFileSync(f)).resize(px, px, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer())
  }
  return out
}

async function fetchOne(b: Building, n: number): Promise<void> {
  const f = photoPath(b, n)
  if (existsSync(f)) return
  mkdirSync(resolve(PHOTO_DIR, b.id), { recursive: true })
  const q = `https://commons.wikimedia.org/w/api.php?format=json&formatversion=2&action=query&prop=imageinfo&iiprop=url&iiurlwidth=1600&titles=${encodeURIComponent(b.photos[n].title)}`
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(q, { headers: { 'User-Agent': UA } })
    if (r.ok) {
      const info = (await r.json()).query.pages[0].imageinfo?.[0]
      if (!info) throw new Error(`${b.id}: ${b.photos[n].title} is not on Commons`)
      await sleep(1500)
      const img = await fetch(info.thumburl ?? info.url, { headers: { 'User-Agent': UA } })
      if (img.ok) { writeFileSync(f, Buffer.from(await img.arrayBuffer())); console.log(`  ${b.id}/${n}.jpg  ${b.photos[n].title}`); return }
    }
    await sleep(5000 * (attempt + 1))
  }
  throw new Error(`${b.id}: could not download ${b.photos[n].title}`)
}

async function sheet(bs: Building[]): Promise<string> {
  const sharp = require('sharp')
  const W = 300, H = 210, cols = 4
  const tiles: { input: Buffer; left: number; top: number }[] = []
  let row = 0
  for (const b of bs) {
    const label = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="24" fill="#000a"/><text x="6" y="17" font-size="14" fill="#fff" font-family="sans-serif">${b.id}</text></svg>`)
    for (let n = 0; n < Math.min(cols, b.photos.length); n++) {
      if (!existsSync(photoPath(b, n))) continue
      const t = await sharp(photoPath(b, n)).resize(W, H, { fit: 'cover' }).composite(n === 0 ? [{ input: label, top: 0, left: 0 }] : []).jpeg().toBuffer()
      tiles.push({ input: t, left: n * (W + 2), top: row * (H + 2) })
    }
    row++
  }
  mkdirSync(PHOTO_DIR, { recursive: true })
  const file = resolve(PHOTO_DIR, 'sheet.jpg')
  await sharp({ create: { width: cols * (W + 2), height: row * (H + 2), channels: 3, background: '#222' } }).composite(tiles).jpeg({ quality: 75 }).toFile(file)
  return file
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const bs = loadBuildings().filter((b) => ids.length === 0 || ids.includes(b.id))
  if (process.argv.includes('--sheet')) console.log(await sheet(bs))
  else for (const b of bs) {
    if (b.photos.length === 0) { console.log(`  ${b.id}: no photographs chosen yet`); continue }
    for (let n = 0; n < b.photos.length; n++) await fetchOne(b, n)
  }
}
