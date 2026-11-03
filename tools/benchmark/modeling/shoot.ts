/**
 * The render sheets: each answer from three sides beside the first reference photograph, for the judging look.
 *
 *   node --experimental-strip-types tools/benchmark/modeling/shoot.ts <run label>              one sheet per model
 *   node --experimental-strip-types tools/benchmark/modeling/shoot.ts <run label> --compare    one sheet per building, a row per model
 *
 * Needs the dev server on :5200 (viewer.html is served by vite; SHOTS_BASE=http://localhost:<port> for another).
 * One browser, shots taken one at a time — this machine has crashed on parallel browsers. Sheets go to
 * runs/<label>/sheets/. Columns: photograph, front three-quarter, rear three-quarter, plan from above with the
 * footprint in red (front at the bottom). Framing follows the footprint and given height, so a model at the wrong
 * scale looks wrong. Each render is also kept alone in runs/<label>/renders/ for judge.ts.
 */
import { chromium } from 'playwright'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { HERE, loadBuildings } from './buildings.ts'
import { photoPath } from './photos.ts'
import { loadRun, scoreRecord } from './score.ts'

const require = createRequire(import.meta.url)
const sharp = require('sharp')
const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
const label = process.argv[2]
if (!label) { console.error('usage: shoot.ts <run label> [--compare]'); process.exit(1) }
const compare = process.argv.includes('--compare')
const W = 420, H = 315, VIEWS = ['front34', 'rear34', 'top'] as const

const byId = new Map(loadBuildings().map((b) => [b.id, b]))
const runs = loadRun(label).sort((a, b) => a.rec.building.localeCompare(b.rec.building) || a.rec.modelId.localeCompare(b.rec.modelId))
const outDir = resolve(HERE, 'runs', label, 'sheets')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: W, height: H } })
await page.goto(`${BASE}/tools/benchmark/modeling/viewer.html`)
await page.waitForFunction('window.__ready === true', null, { timeout: 120_000 })

const text = (s: string, w: number): Buffer => Buffer.from(`<svg width="${w}" height="22"><rect width="${w}" height="22" fill="#000b"/><text x="6" y="15" font-size="13" fill="#fff" font-family="sans-serif">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`)

/** one row: the photo and three renders */
async function row(r: (typeof runs)[number], caption: string): Promise<Buffer[]> {
  const b = byId.get(r.rec.building)!
  const tiles: Buffer[] = []
  const photo = existsSync(photoPath(b, 0))
    ? await sharp(photoPath(b, 0)).resize(W, H, { fit: 'cover' }).composite([{ input: text(caption, W), top: 0, left: 0 }]).png().toBuffer()
    : await sharp({ create: { width: W, height: H, channels: 3, background: '#333' } }).composite([{ input: text(caption, W), top: 0, left: 0 }]).png().toBuffer()
  tiles.push(photo)
  await page.evaluate(([m, o, h]) => (window as unknown as { __show: (a: unknown, b: unknown, c: unknown) => unknown }).__show(m, o, h), [r.rec.final.json ?? {}, r.rec.plan.outline, r.rec.plan.height] as const)
  for (const v of VIEWS) {
    const url = await page.evaluate((view) => (window as unknown as { __shoot: (v: string) => Promise<string> }).__shoot(view), v) as string
    let img = Buffer.from(url.split(',')[1], 'base64')
    // each render also on its own, for judge.ts
    const rdir = resolve(HERE, 'runs', label, 'renders', r.rec.modelId)
    mkdirSync(rdir, { recursive: true })
    writeFileSync(resolve(rdir, `${r.rec.building}${r.sample ? `.s${r.sample}` : ''}-${v}.png`), img)
    if (r.rec.final.status !== 'ok' && v === 'front34') img = await sharp(img).composite([{ input: text(r.rec.final.status === 'bail' ? `BAIL: ${r.rec.final.bail ?? ''}`.slice(0, 60) : r.rec.final.status.toUpperCase(), W), top: Math.round(H / 2 - 11), left: 0 }]).png().toBuffer()
    tiles.push(img)
  }
  return tiles
}

async function sheet(rows: Buffer[][], file: string): Promise<void> {
  const comp = rows.flatMap((r, y) => r.map((input, x) => ({ input, left: x * (W + 2), top: y * (H + 2) })))
  await sharp({ create: { width: 4 * (W + 2), height: rows.length * (H + 2), channels: 3, background: '#222' } }).composite(comp).jpeg({ quality: 80 }).toFile(file)
  console.log(file)
}

const groups = new Map<string, typeof runs>()
for (const r of runs) {
  const k = compare ? r.rec.building : r.rec.modelId
  groups.set(k, [...(groups.get(k) ?? []), r])
}
for (const [k, rs] of groups) {
  const rows: Buffer[][] = []
  for (const r of rs) {
    const s = scoreRecord(r.rec, byId.get(r.rec.building)!, r.sample)
    const who = compare ? r.rec.modelId : r.rec.building
    rows.push(await row(r, `${who}${r.sample ? ` s${r.sample}` : ''}  ${s.status === 'ok' ? `screen ${s.screen}  ${s.parts} parts` : s.status}`))
  }
  await sheet(rows, resolve(outDir, `${k}.jpg`))
}
await browser.close()
