/**
 * Several runs side by side: a row per building, the first photograph and then each run's front three-quarter
 * render, for comparing prompts or models on one sheet.
 *
 *   node --experimental-strip-types tools/benchmark/modeling/sidebyside.ts <label>[:<model>] <label>[:<model>] … [--view=front34|rear34|top] [--out=<file>]
 *
 * Each run must have been through shoot.ts (which keeps the single renders). The model defaults to haiku. The
 * sheet goes to runs/sidebyside-<view>.jpg unless --out says otherwise.
 */
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { HERE, loadBuildings } from './buildings.ts'
import { photoPath } from './photos.ts'
import type { RunRecord } from './run.ts'

const require = createRequire(import.meta.url)
const sharp = require('sharp')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const runs = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((r) => { const [label, model = 'haiku'] = r.split(':'); return { label, model } })
if (runs.length === 0) { console.error('usage: sidebyside.ts <label>[:<model>] … [--view=front34]'); process.exit(1) }
const view = arg('view', 'front34')
const out = arg('out', resolve(HERE, 'runs', `sidebyside-${view}.jpg`))
const W = 420, H = 315, HEAD = 30

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const bar = (s: string, w: number, h = 22, size = 13): Buffer => Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000b"/><text x="6" y="${h - 7}" font-size="${size}" fill="#fff" font-family="sans-serif">${esc(s)}</text></svg>`)
const blank = (): Promise<Buffer> => sharp({ create: { width: W, height: H, channels: 3, background: '#444' } }).png().toBuffer()

const tiles: { input: Buffer; left: number; top: number }[] = []
const heads = ['photograph', ...runs.map((r) => `${r.label}${r.model !== 'haiku' ? ` (${r.model})` : ''}`)]
heads.forEach((h, x) => tiles.push({ input: bar(h, W, HEAD, 15), left: x * (W + 2), top: 0 }))
const buildings = loadBuildings()
for (const [y, b] of buildings.entries()) {
  const top = HEAD + y * (H + 2)
  const photo = existsSync(photoPath(b, 0)) ? await sharp(photoPath(b, 0)).resize(W, H, { fit: 'cover' }).png().toBuffer() : await blank()
  tiles.push({ input: await sharp(photo).composite([{ input: bar(b.id, W), top: 0, left: 0 }]).png().toBuffer(), left: 0, top })
  for (const [x, r] of runs.entries()) {
    const img = resolve(HERE, 'runs', r.label, 'renders', r.model, `${b.id}-${view}.png`)
    const recFile = resolve(HERE, 'runs', r.label, r.model, `${b.id}.json`)
    const rec = existsSync(recFile) ? JSON.parse(readFileSync(recFile, 'utf8')) as RunRecord : null
    const caption = !rec ? 'not run' : (rec.final as { caption?: string }).caption ?? (rec.final.status !== 'ok' ? rec.final.status.toUpperCase() : `${rec.final.parts} parts${rec.final.feedbackFailed ? ', revision broke: draft shown' : ''}`)
    const base = existsSync(img) ? await sharp(img).resize(W, H).png().toBuffer() : await blank()
    tiles.push({ input: await sharp(base).composite([{ input: bar(caption, W), top: H - 22, left: 0 }]).png().toBuffer(), left: (x + 1) * (W + 2), top })
  }
}
await sharp({ create: { width: (runs.length + 1) * (W + 2), height: HEAD + buildings.length * (H + 2), channels: 3, background: '#222' } }).composite(tiles).jpeg({ quality: 80 }).toFile(out)
console.log(out)
