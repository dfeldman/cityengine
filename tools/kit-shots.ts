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
  ['facade-api', ['kit_facade_arcaded', 'kit_facade_temple', 'kit_facade_framed', 'kit_facade_plain',
    'kit_facade_pilastered', 'kit_facade_corner',
    'kit_facade_giant_order', 'kit_facade_in_antis', 'kit_facade_aedicules', 'kit_facade_quoins']],
  ['facade', ['kit_face_punched', 'kit_face_punched_arched', 'kit_face_curtain', 'kit_face_fins', 'kit_face_bands',
    'kit_face_blank', 'kit_face_xbrace', 'kit_face_bays', 'kit_faceOn', 'kit_quoins', 'kit_windows', 'kit_pane',
    'kit_archedPane', 'kit_pointedPane', 'kit_courtFacade']],
  ['crown', ['kit_crown_parapet', 'kit_crown_hip', 'kit_crown_mansard', 'kit_crown_pyramid', 'kit_crown_spire',
    'kit_crown_dome', 'kit_crown_lantern', 'kit_crown_stepped', 'kit_crown_mast', 'kit_crown_sawtooth',
    'kit_crown_spires', 'kit_crown_sliced', 'kit_crown_balustrade', 'kit_cupola', 'kit_spireOn', 'kit_stripRoof', 'kit_dome',
    'kit_pinnacle', 'kit_turret', 'kit_roundRing']],
  ['church', ['kit_church_before_stmarys', 'kit_church_stmarys', 'kit_church_before_ssp', 'kit_church_ssp',
    'kit_church_gothic', 'kit_church_brick', 'kit_church_baroque', 'kit_church_mission',
    'kit_church_basilica', 'kit_church_hall',
    'kit_church_gableRoof', 'kit_church_gableRoof_hip', 'kit_church_gableEnd', 'kit_church_crossFinial',
    'kit_church_roseWindow', 'kit_church_lancet', 'kit_church_lancetRow', 'kit_church_buttress',
    'kit_church_flyingButtress', 'kit_church_portal', 'kit_church_bellNiche', 'kit_church_curvedGable',
    'kit_church_spire', 'kit_church_churchTower', 'kit_church_churchTower_parapet',
    'kit_church_churchTower_lantern', 'kit_church_apse', 'kit_church_pagodaRoof']],
  ['signs', ['kit_sign_flat', 'kit_sign_script', 'kit_sign_engraved', 'kit_sign_roman', 'kit_sign_panel',
    'kit_sign_halo', 'kit_sign_vertical', 'kit_sign_slab',
    'kit_signText', 'kit_signText_lit', 'kit_bulbText', 'kit_bladeSign']],
  ['shape', ['kit_notch', 'kit_notch_edge', 'kit_vault', 'kit_vault_along', 'kit_vault_solid', 'kit_rake', 'kit_rake_batter',
    'kit_deckCut', 'kit_deckCut_rooflight', 'kit_deckCut_vault', 'kit_ybca_galleries', 'kit_ybca_theatre']],
  /*
   * The stair and railing demos. EVERY ONE is shot from a LOW OBLIQUE at rider's eye height, because both
   * defects these parts exist to prevent are invisible in a front elevation: the YBCA theatre's steps read
   * correctly in elevation and were floating louvres from the pavement, and #134a's pale mullions 0.34 m proud
   * of the glass read as a palisade only from where a rider stands. `kit_stair_under` is shot from BELOW the
   * flight, which is the only angle an unclosed underside shows up in — the same reason `deckCut` needed a
   * camera case of its own.
   */
  ['stairs', ['kit_stair', 'kit_stair_splay', 'kit_stair_under', 'kit_yb_theatre_steps', 'kit_esplanade',
    'kit_terrace', 'kit_railing', 'kit_facade_stoop',
    'kit_arc_stair', 'kit_arc_esplanade', 'kit_folsom_stair', 'kit_ramp']],
  ['classical', ['kit_column', 'kit_classicalColumn_tuscan', 'kit_classicalColumn_doric',
    'kit_classicalColumn_ionic', 'kit_classicalColumn_corinthian', 'kit_pediment', 'kit_friezes', 'kit_beam']],
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
    // a hole cut through a deck is edge-on and invisible from the standard camera: these look DOWN on it
    const down = /^kit_(deckCut|ybca_galleries)/.test(name)
    const cap = name.startsWith('kit_classicalColumn')
    /*
     * Stairs and railings: a LOW OBLIQUE from rider's eye. beta near 1.5 is nearly horizontal, the target is
     * at 1.6 m, and the radius is tight, so the shot is what a rider actually sees — daylight between treads,
     * or a fine repeated vertical standing proud of its wall. A front elevation hides both.
     *
     * alpha is squarer than the catalogue's own −1.15: at −1.15 the flight's END WALL faces the camera and
     * the risers are edge-on, which is the one thing these shots exist to show.
     */
    const eye = /^kit_(stair|yb_theatre_steps|esplanade|terrace|railing|facade_stoop|arc_|folsom_|ramp)/.test(name)
    // and one from UNDER the flight, looking up: the only view an unclosed underside fails in
    const under = name === 'kit_stair_under'

    /*
     * A whole church built by `church()` faces +z, the convention a CITY builder uses, while every part demo
     * (and every other demo in the file) faces −z. So the church views stand on the other side — and the
     * scene's sun comes from the −z side, so these six come out in shade. Tried and rejected: alpha 0.62 and
     * 2.1, both of which turn the front away again without gaining light.
     */
    const plusZ = /^kit_church_(stmarys|ssp|gothic|brick|baroque|mission|basilica|hall)$/.test(name)
    const alpha = plusZ ? 1.15 : -1.15
    // the under-view stands at 1 m and looks UP: beta past pi/2 with a radius small enough that the camera
    // does not sink below the showcase's ground box, which is where the first attempt put it (a black frame)
    if (under) await page.evaluate(`window.__modelView(${alpha},${1.72},${24},${cx},${3.4},${cz})`)
    // a wide flight (an esplanade, a terrace, a run of railing) needs the standard three-quarter and more
    // distance or it fills the frame; a single entrance flight needs the squarer one or its risers are edge-on
    // a fan is a wide SHALLOW dish: at rider's eye its concentric treads foreshorten into a flat disc, so the
    // arc demos are raised just enough to read while staying an oblique, never an elevation
    // a ramp lies ON a deck: from rider's eye on the ground the deck's own edge hides it, so this one looks
    // down, the way `deckCut` has to
    else if (name === 'kit_ramp') await page.evaluate(`window.__modelView(${-1.15},${1.02},${R * 1.2},${cx},${H * 0.6},${cz})`)
    else if (/arc_/.test(name)) await page.evaluate(`window.__modelView(${-1.15},${1.28},${R * 1.15},${cx},${H * 0.4},${cz})`)
    else if (eye) await page.evaluate(/terrace|railing|yb_theatre/.test(name)
      ? `window.__modelView(${-1.15},${1.46},${R * 1.5},${cx},${1.6},${cz})`
      : `window.__modelView(${-1.42},${1.53},${R * 1.05},${cx},${1.6},${cz})`)
    else if (cap) await page.evaluate(`window.__modelView(${alpha},${1.38},${6.4},${cx},${7.4},${cz})`)
    else if (low) await page.evaluate(`window.__modelView(${alpha},${1.29},${R * 1.55},${cx},${H * 0.66},${cz})`)
    else if (down) await page.evaluate(`window.__modelView(${alpha},${0.72},${R * 1.75},${cx},${H * 0.5},${cz})`)
    else if (wide) await page.evaluate(`window.__modelView(${-1.28},${1.24},${33},${cx},${5.2},${cz})`)
    else await page.evaluate(`window.__modelView(${alpha},${1.2},${R * 1.9},${cx},${H * 0.5},${cz})`)
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
