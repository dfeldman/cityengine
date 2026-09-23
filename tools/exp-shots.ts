/**
 * Render every builder an experiment produced, so eight runs can be judged the SAME way.
 *
 * The experiments deliberately take no screenshots of their own: every model that has judged its own output
 * on this project has graded it generously, so quality is assessed centrally, once, from one server. This
 * reads an experiment's manifest (docs/sf-batches/exp/e<N>.json), photographs each entry on a rectangle of
 * its real footprint, and tiles the results into one sheet per experiment.
 *
 *   node --experimental-strip-types tools/exp-shots.ts --exp=3
 *
 * Needs the dev server on 5200 (SHOTS_BASE overrides).
 */
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
const exp = arg('exp', '1')

/** the ten buildings' footprints and heights: hx, hz, height — the same fit the bake would give them */
const FIT: Record<string, [number, number, number]> = {
  '944039725': [19, 42, 58], '243794014': [19, 26.5, 55], '256067734': [16.5, 21, 48],
  '288511103': [17, 17.5, 30], '690663633': [13.5, 18, 36], '1309156123': [12, 17.5, 31],
  '260283286': [9, 21, 31], '256066230': [13, 20, 16], '256067726': [5, 14.5, 28],
  '151185875': [6.5, 11.5, 16],
  // the second ten, for the batch-of-twenty test
  '132125164': [23, 41, 15], '32947380': [16, 42.5, 48], '256076599': [21.5, 29.5, 32],
  '260280326': [17.5, 21, 42], '260283290': [18.5, 18.5, 33], '104627922': [16.5, 21, 20],
  '132125160': [15.5, 18.5, 32], '1432655283': [16.5, 22, 27], '260286446': [14, 19.5, 22],
  '32947542': [14.5, 19, 41],
}

const file = resolve(ROOT, 'docs', 'sf-batches', 'exp', `e${exp}.json`)
if (!existsSync(file)) { console.log(`no manifest for experiment ${exp}`); process.exit(0) }
const entries = JSON.parse(readFileSync(file, 'utf8')) as { osm?: string[]; name?: string; procedural?: string; height?: number }[]
const jobs = entries.filter((e) => e.procedural).map((e) => {
  const id = String((e.osm ?? [])[0] ?? '').replace('way/', '')
  const f = FIT[id] ?? [15, 20, 30]
  return { name: e.name ?? id, model: e.procedural!, fit: { hx: f[0], hz: f[1], height: e.height ?? f[2], ring: [] as { x: number; z: number }[] } }
})
if (jobs.length === 0) { console.log(`experiment ${exp}: no procedural entries`); process.exit(0) }
console.log(`experiment ${exp}: ${jobs.length} builders`)

const out = resolve(ROOT, 'docs', 'shots', 'exp')
const tmp = resolve(out, `tmp-${exp}`)
mkdirSync(tmp, { recursive: true })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 760, height: 760 } })
page.on('pageerror', () => { /* a broken builder shows as a missing tile */ })

const shot: { name: string; path: string; tris: number }[] = []
for (const j of jobs) {
  try {
    await page.goto(`${BASE}/?model=${j.model}`)
    await page.waitForFunction('window.modelReady === true', null, { timeout: 30_000 })
    const b = await page.evaluate(`window.__rebuild(${JSON.stringify({ hx: j.fit.hx, hz: j.fit.hz, height: j.fit.height })})`) as { min: number[]; max: number[] }
    const tris = await page.evaluate('window.__modelTris') as number
    const H = b.max[1]
    const R = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2], H)
    await page.evaluate(`window.__modelView(${Math.PI / 2 - 0.9},${1.25},${R * 1.9},0,${H * 0.45},0)`)
    await page.waitForTimeout(240)
    const path = resolve(tmp, `${shot.length}.png`)
    await page.screenshot({ path })
    shot.push({ name: j.name, path, tris })
  } catch { console.log(`  ✗ ${j.name} (${j.model})`) }
}
await browser.close()
console.log(`${shot.length} of ${jobs.length} rendered`)

const sharp = (await import('sharp')).default
const cols = Math.min(4, Math.max(1, shot.length))
const cell = 380
const label = 26
const rows = Math.ceil(shot.length / cols)
const W = cols * cell
const Ht = rows * (cell + label)
const tiles = await Promise.all(shot.map(async (p, i) => ({
  input: await sharp(p.path).resize(cell, cell, { fit: 'cover' }).toBuffer(),
  left: (i % cols) * cell, top: Math.floor(i / cols) * (cell + label),
})))
const esc = (t: string): string => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const text = shot.map((p, i) => {
  const x = (i % cols) * cell + 6
  const y = Math.floor(i / cols) * (cell + label) + cell + 18
  const nm = p.name.length > 34 ? `${p.name.slice(0, 33)}…` : p.name
  return `<text x="${x}" y="${y}" font-family="sans-serif" font-size="13" fill="#111">${esc(nm)}</text>`
    + `<text x="${x + cell - 12}" y="${y}" text-anchor="end" font-family="sans-serif" font-size="11" fill="#999">${p.tris} tris</text>`
}).join('')
const dest = resolve(out, `e${exp}.png`)
await sharp({ create: { width: W, height: Ht, channels: 3, background: '#f4f4f2' } })
  .composite([...tiles, { input: Buffer.from(`<svg width="${W}" height="${Ht}">${text}</svg>`), top: 0, left: 0 }])
  .png().toFile(dest)
console.log(dest)
rmSync(tmp, { recursive: true, force: true })
