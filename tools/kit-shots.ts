/**
 * Photograph every part of the shared building kit, for the catalogue in docs/KIT.md.
 *
 * MODELING_IMPROVEMENT_1.md found that nine modelling runs used five of the kit's 45 functions, and that the
 * reason is that no document shows what any of them DRAW. This renders each `kit_*` builder from
 * src/render/landmarks/sf/experiments/kit-demo.ts on its own, writes one PNG per part (which KIT.md links
 * individually) and tiles them into a sheet per section (which is what a human can scan).
 *
 *     node --experimental-strip-types tools/kit-shots.ts
 *
 * Needs the dev server on 5200 (SHOTS_BASE overrides). The camera stands to the −z/+x side, because that is
 * the side every demo puts its front on: `pane`, `archedPane`, `pediment` and `courtFacade` draw on −z, and
 * the parts.ts helpers are given `heading: Math.PI` to match.
 */
import { readFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const ROOT = resolve(import.meta.dirname, '..')
const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '=').split('=')[1]

/** the builders, read out of the source: importing the module here would drag in Babylon */
const src = readFileSync(resolve(ROOT, 'src/render/landmarks/sf/experiments/kit-demo.ts'), 'utf8')
const ALL = [...src.matchAll(/^ {2}(kit_\w+):/gm)].map((m) => m[1])

/** the doc's sections, in the order KIT.md uses them; anything unlisted lands in `other` */
const SECTIONS: [string, string[]][] = [
  ['ground-floor', ['kit_arcade_vs_colonnade', 'kit_arcade', 'kit_arcade_naive', 'kit_arcade_piers', 'kit_colonnade', 'kit_colonnade_naive', 'kit_marquee', 'kit_panelOn']],
  ['facade', ['kit_face_punched', 'kit_face_punched_arched', 'kit_face_curtain', 'kit_face_fins', 'kit_face_bands',
    'kit_face_blank', 'kit_face_xbrace', 'kit_face_bays', 'kit_faceOn', 'kit_quoins', 'kit_windows', 'kit_pane',
    'kit_archedPane', 'kit_pointedPane', 'kit_courtFacade']],
  ['crown', ['kit_crown_parapet', 'kit_crown_hip', 'kit_crown_mansard', 'kit_crown_pyramid', 'kit_crown_spire',
    'kit_crown_dome', 'kit_crown_lantern', 'kit_crown_stepped', 'kit_crown_mast', 'kit_crown_sawtooth',
    'kit_crown_spires', 'kit_crown_sliced', 'kit_cupola', 'kit_spireOn', 'kit_stripRoof', 'kit_dome',
    'kit_pinnacle', 'kit_turret', 'kit_roundRing']],
  ['signs', ['kit_signText', 'kit_signText_lit', 'kit_bulbText', 'kit_bladeSign']],
  ['classical', ['kit_column', 'kit_classicalColumn_tuscan', 'kit_classicalColumn_doric',
    'kit_classicalColumn_ionic', 'kit_classicalColumn_corinthian', 'kit_pediment', 'kit_beam']],
]
const listed = new Set(SECTIONS.flatMap(([, v]) => v))
const missing = ALL.filter((k) => !listed.has(k))
if (missing.length) SECTIONS.push(['other', missing])
const unknown = [...listed].filter((k) => !ALL.includes(k))
if (unknown.length) console.log(`(listed but not in kit-demo.ts: ${unknown.join(', ')})`)

const out = resolve(ROOT, 'docs', 'shots', 'kit')
mkdirSync(out, { recursive: true })
console.log(`${ALL.length} kit demos`)

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 620, height: 620 } })
page.on('pageerror', (e) => console.log(`  ! ${e.message.split('\n')[0]}`))

const done = new Map<string, number>()
for (const name of ALL) {
  if (only && !name.includes(only)) continue
  try {
    await page.goto(`${BASE}/?model=${name}`)
    await page.waitForFunction('window.modelReady === true', null, { timeout: 30_000 })
    // the demos ignore the fit and draw at their own fixed size; rebuild anyway to get the bounds back
    const b = await page.evaluate('window.__rebuild({ hx: 4.5, hz: 3, height: 7 })') as { min: number[]; max: number[]; triangles: number }
    const cx = (b.min[0] + b.max[0]) / 2
    const cz = (b.min[2] + b.max[2]) / 2
    const H = b.max[1] - Math.min(0, b.min[1])
    const R = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2], H)
    // alpha −1.15 puts the camera at −z and a little +x: a three-quarter view of the side every demo faces
    // the four classical orders differ only in the CAPITAL, which is a smudge in a whole-column shot: those
    // demos get a close view of the top of the shaft instead
    const wide = name === 'kit_arcade_vs_colonnade'
    // a parapet is a low wall round the roof EDGE: from the standard raised camera it hides behind the roof
    const low = name === 'kit_crown_parapet'
    const cap = name.startsWith('kit_classicalColumn')
    if (cap) await page.evaluate(`window.__modelView(${-1.15},${1.38},${6.4},${cx},${7.4},${cz})`)
    else if (low) await page.evaluate(`window.__modelView(${-1.15},${1.29},${R * 1.55},${cx},${H * 0.66},${cz})`)
    else if (wide) await page.evaluate(`window.__modelView(${-1.28},${1.24},${33},${cx},${5.2},${cz})`)
    else await page.evaluate(`window.__modelView(${-1.15},${1.2},${R * 1.9},${cx},${H * 0.5},${cz})`)
    await page.waitForTimeout(220)
    await page.screenshot({ path: resolve(out, `${name}.png`) })
    done.set(name, b.triangles)
  } catch (e) { console.log(`  ✗ ${name}: ${String(e).split('\n')[0]}`) }
}
await browser.close()
console.log(`${done.size} of ${ALL.length} rendered`)

const sharp = (await import('sharp')).default
const esc = (t: string): string => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
for (const [section, names] of SECTIONS) {
  const shots = names.filter((n) => done.has(n))
  if (!shots.length) continue
  const cols = Math.min(4, shots.length)
  const cell = 300
  const label = 24
  const rows = Math.ceil(shots.length / cols)
  const W = cols * cell
  const Ht = rows * (cell + label)
  const tiles = await Promise.all(shots.map(async (n, i) => ({
    input: await sharp(resolve(out, `${n}.png`)).resize(cell, cell, { fit: 'cover' }).toBuffer(),
    left: (i % cols) * cell, top: Math.floor(i / cols) * (cell + label),
  })))
  const text = shots.map((n, i) => {
    const x = (i % cols) * cell + 6
    const y = Math.floor(i / cols) * (cell + label) + cell + 17
    return `<text x="${x}" y="${y}" font-family="sans-serif" font-size="12" fill="#111">${esc(n.replace('kit_', ''))}</text>`
      + `<text x="${x + cell - 12}" y="${y}" text-anchor="end" font-family="sans-serif" font-size="10" fill="#999">${done.get(n)} tris</text>`
  }).join('')
  const dest = resolve(out, `sheet-${section}.png`)
  await sharp({ create: { width: W, height: Ht, channels: 3, background: '#f4f4f2' } })
    .composite([...tiles, { input: Buffer.from(`<svg width="${W}" height="${Ht}">${text}</svg>`), top: 0, left: 0 }])
    .png().toFile(dest)
  console.log(dest)
}
