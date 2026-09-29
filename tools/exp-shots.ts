/**
 * Render every builder an experiment produced, so eight runs can be judged the SAME way.
 *
 * The experiments deliberately take no screenshots of their own: every model that has judged its own output
 * on this project has graded it generously, so quality is assessed centrally, once, from one server. This
 * reads an experiment's manifest (docs/sf-batches/exp/e<N>.json), photographs each entry ON ITS REAL
 * FOOTPRINT, and tiles the results into one sheet per experiment — and also writes one image per building,
 * because an agent inspecting its OWN building wants that building, not a 10-up sheet.
 *
 *   node --experimental-strip-types tools/exp-shots.ts --exp=3
 *   node --experimental-strip-types tools/exp-shots.ts --exp=10 --only=256067734   one building
 *
 * THE FOOTPRINT IS READ, NOT ASSUMED. This tool used to pass a hardcoded hx/hz and `ring: []`, so every
 * experiment render since E1 was a builder on a RECTANGLE — including 256067734, whose plan has sixteen
 * corners and which was judged "basically a box". `tools/footprint.ts` reads the outline out of the baked
 * city (and the hull of its parts where the bake dropped a superseded outline), so a rebake keeps this
 * honest. The FIT table below survives only as a fallback for an id that does not resolve.
 *
 * Needs the dev server on 5200 (SHOTS_BASE overrides), and a baked city on disk for the footprints.
 */
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { planFor, archetypePositions, type Plan } from './footprint.ts'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
const exp = arg('exp', '1')

/** FALLBACK ONLY: hx, hz, height per building, used where the baked footprint cannot be found. These are
 *  half-extents with no plan, which is what made every earlier experiment render a rectangle. */
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
const city = arg('city', 'san-francisco')
const only = arg('only')
const pos = archetypePositions(city)
const jobs = entries.filter((e) => e.procedural).map((e) => {
  const id = String((e.osm ?? [])[0] ?? '').replace('way/', '')
  const f = FIT[id] ?? [15, 20, 30]
  let plan: Plan | null = null
  try { plan = planFor(city, Number(id), pos.get(Number(id))) } catch (err) { console.log(`  (no baked city: ${String(err).split('\n')[0]})`) }
  return {
    id,
    name: e.name ?? id,
    model: e.procedural!,
    plan,
    fit: {
      hx: plan?.hx ?? f[0],
      hz: plan?.hz ?? f[1],
      height: e.height ?? f[2],
      ring: plan?.ring ?? ([] as { x: number; z: number }[]),
    },
  }
}).filter((j) => !only || only.split(',').some((w) => j.id === w || j.model.includes(w) || j.name.includes(w)))
if (jobs.length === 0) { console.log(`experiment ${exp}: no procedural entries`); process.exit(0) }
const real = jobs.filter((j) => j.plan).length
console.log(`experiment ${exp}: ${jobs.length} builders, ${real} on their real footprint`
  + `${real < jobs.length ? `, ${jobs.length - real} on the fallback rectangle` : ''}`)
for (const j of jobs.filter((x) => x.plan)) {
  console.log(`  ${j.name}: ${j.plan!.corners} corners, ${j.plan!.hx.toFixed(1)} x ${j.plan!.hz.toFixed(1)} m (${j.plan!.source})`)
}

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
    // the showcase's own "loading…" label is not part of the model
    await page.addStyleTag({ content: 'body > *:not(canvas):not(#app) { visibility: hidden !important }' })
    // the RING goes with the fit: a builder raised from its own outline (the tower grammar) needs the plan,
    // not the box round it
    const b = await page.evaluate(`window.__rebuild(${JSON.stringify(j.fit)})`) as { min: number[]; max: number[] }
    const tris = await page.evaluate('window.__modelTris') as number
    const H = b.max[1]
    const W = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2])
    const R = Math.max(W, H)
    // a long low building fills the frame across, not up: pulling back by the tallest dimension alone leaves
    // it a smudge in the middle
    const radius = R * (H / Math.max(1, W) < 0.5 ? 1.3 : 1.85)
    const cx = (b.min[0] + b.max[0]) / 2
    const cz = (b.min[2] + b.max[2]) / 2
    await page.evaluate(`window.__modelView(${Math.PI / 2 - 0.9},${1.24},${radius},${cx},${H * 0.45},${cz})`)
    await page.waitForTimeout(240)
    const path = resolve(tmp, `${shot.length}.png`)
    await page.screenshot({ path })
    // one image per building as well as the sheet: an agent inspecting its own work wants its own building,
    // and a 10-up contact sheet is the wrong tool for that
    const per = resolve(out, `e${exp}`)
    mkdirSync(per, { recursive: true })
    await page.screenshot({ path: resolve(per, `${j.id || j.model}.png`) })
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
