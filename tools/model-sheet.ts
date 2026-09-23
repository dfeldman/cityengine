/**
 * A contact sheet of every hand-modelled building, so a batch can be JUDGED instead of trusted.
 *
 * `tools/model-shots.ts` photographs one building from four angles, which is right while you are working on it
 * and useless for review: nobody opens three hundred files. This takes ONE corner view of every procedural
 * entry in the manifest and tiles them with their names, so a whole city can be looked over at a glance. The
 * hand-modelled buildings are where the work goes wrong — a generic box where the building is a Y, a portico
 * whose entablature juts out sideways, a sign facing the wrong way — and every one of those is obvious on a
 * sheet and invisible in a report. Two such bugs were found this way within a minute of the first sheet.
 *
 *   node --experimental-strip-types tools/model-sheet.ts                     every fragment but the refaces
 *   node --experimental-strip-types tools/model-sheet.ts --files=civic-1,parks
 *   node --experimental-strip-types tools/model-sheet.ts --cols=6 --cell=320
 *
 * ONE browser for the whole run. The first version spawned model-shots per building, and at three hundred
 * buildings nearly all the time went into launching Chromium rather than drawing anything.
 *
 * Needs the dev server on 5200; it does not start one.
 */
import { readdirSync, readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { fitForEntry } from './model-shots.ts'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')

const city = arg('city', 'san-francisco')
/*
 * A city's own manifest, else its region's: Paris's cities share public/landmarks/paris.json, the same
 * fallback model-shots.ts and nested-parts.ts use. Without it `--city=paris-centre` found no manifest at all
 * and reported "nothing to shoot" rather than failing, which is the worst way for a check to be wrong.
 */
const base = [city, city.split('-')[0]].find((n) => existsSync(resolve(ROOT, 'public', 'landmarks', `${n}.json`))) ?? city
const dir = resolve(ROOT, 'public', 'landmarks', base)
const cols = Number(arg('cols', '5'))
const cell = Number(arg('cell', '340'))
const out = resolve(ROOT, arg('out', 'docs/shots/sheets'))
const only = arg('files') ? arg('files').split(',').map((s) => s.trim()) : null

interface Entry { name: string; procedural?: string; file?: string }

const jobs: { file: string; name: string }[] = []
/*
 * The city's OWN manifest too, not just the fragments it includes. Salesforce Tower — the tallest building in
 * San Francisco — lives there, so the first full sheet silently missed it and the gap was only noticed by
 * someone looking for it.
 */
if (!only || only.includes(base)) {
  try {
    const own = JSON.parse(readFileSync(resolve(ROOT, 'public', 'landmarks', `${base}.json`), 'utf8')) as (Entry & { include?: string })[]
    for (const e of own) if (!e.include && e.procedural) jobs.push({ file: base, name: e.name })
  } catch { /* no city file */ }
}
/*
 * The fragments, in either layout the project uses: San Francisco's live in a directory of their own
 * (public/landmarks/san-francisco/*.json), Paris's are siblings named paris-*.json. Reading only the first
 * silently skipped every Paris fragment.
 */
const frags: { id: string; path: string }[] = existsSync(dir)
  ? readdirSync(dir).filter((x) => x.endsWith('.json')).map((x) => ({ id: x.replace(/\.json$/, ''), path: resolve(dir, x) }))
  : readdirSync(resolve(ROOT, 'public', 'landmarks'))
    .filter((x) => x.startsWith(`${base}-`) && x.endsWith('.json'))
    .map((x) => ({ id: x.replace(/\.json$/, ''), path: resolve(ROOT, 'public', 'landmarks', x) }))
for (const f of frags.filter((x) => (only ? only.includes(x.id) : !x.id.startsWith('reface-')))) {
  let entries: Entry[] = []
  // not every sibling is a list of entries: paris-info.json is an object of notes
  try {
    const j = JSON.parse(readFileSync(f.path, 'utf8')) as unknown
    if (!Array.isArray(j)) continue
    entries = j as Entry[]
  } catch { continue }
  for (const e of entries) if (e.procedural) jobs.push({ file: f.id, name: e.name })
}
if (jobs.length === 0) { console.log('nothing to shoot'); process.exit(0) }
console.log(`${jobs.length} models`)

const tmp = resolve(out, 'tmp')
mkdirSync(tmp, { recursive: true })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 900, height: 900 } })
page.on('pageerror', () => { /* a broken builder is reported by the missing shot */ })

const shot: { name: string; file: string; path: string }[] = []
let failed = 0
for (const j of jobs) {
  try {
    const { model, fit, spin } = await fitForEntry(j.name, city)
    await page.goto(`http://localhost:5200/?model=${model}`)
    await page.waitForFunction('window.modelReady === true', null, { timeout: 30_000 })
    const b = await page.evaluate(`window.__rebuild(${JSON.stringify(fit)})`) as { min: number[]; max: number[] }
    const H = b.max[1]
    const R = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2], H)
    await page.evaluate(`window.__modelView(${Math.PI / 2 - 0.9 - spin},${1.3},${R * 1.8},0,${H * 0.45},0)`)
    await page.waitForTimeout(260)
    const path = resolve(tmp, `${shot.length}.png`)
    await page.screenshot({ path })
    shot.push({ name: j.name, file: j.file, path })
    if (shot.length % 25 === 0) console.log(`  ${shot.length}/${jobs.length}`)
  } catch {
    failed++
    console.log(`  ✗ ${j.name} (${j.file})`)
  }
}
await browser.close()
console.log(`${shot.length} shot, ${failed} failed`)

const sharp = (await import('sharp')).default
const perSheet = cols * 7
const label = 24
for (let s = 0; s * perSheet < shot.length; s++) {
  const part = shot.slice(s * perSheet, (s + 1) * perSheet)
  const rows = Math.ceil(part.length / cols)
  const W = cols * cell
  const H = rows * (cell + label)
  const tiles = await Promise.all(part.map(async (p, i) => ({
    input: await sharp(p.path).resize(cell, cell, { fit: 'cover' }).toBuffer(),
    left: (i % cols) * cell, top: Math.floor(i / cols) * (cell + label),
  })))
  const esc = (t: string): string => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const text = part.map((p, i) => {
    const x = (i % cols) * cell + 5
    const y = Math.floor(i / cols) * (cell + label) + cell + 16
    const nm = p.name.length > 30 ? `${p.name.slice(0, 29)}…` : p.name
    return `<text x="${x}" y="${y}" font-family="sans-serif" font-size="12" fill="#111">${esc(nm)}</text>`
      + `<text x="${x + cell - 10}" y="${y}" text-anchor="end" font-family="sans-serif" font-size="10" fill="#999">${esc(p.file)}</text>`
  }).join('')
  const file = resolve(out, `sheet-${s + 1}.png`)
  await sharp({ create: { width: W, height: H, channels: 3, background: '#f4f4f2' } })
    .composite([...tiles, { input: Buffer.from(`<svg width="${W}" height="${H}">${text}</svg>`), top: 0, left: 0 }])
    .png().toFile(file)
  console.log(`${file}  (${part.length})`)
}
rmSync(tmp, { recursive: true, force: true })
