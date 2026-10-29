import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { archedPane, beam, block, hex, pane, pediment, shade } from '../../kit.ts'
import { clockFace } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archBand, body, colonnade, engraved, frontAt, glazedArch, pilaster, ringOf, statue } from './front.ts'
import { trainShed } from './shed.ts'
import { NORD_SHED } from './data.ts'

/**
 * The Gare du Nord (Hittorff, 1861–65), its stone front on the Place Napoléon-III (references: Wikimedia Commons
 * "Facade of Gare de Paris-Nord, Paris 10 April 2017", "Paris gare nord face 1", and the 1860s photograph
 * "Gare du Nord, 10ème arrondissement, Paris. PH4867"; fr.wikipedia "Gare de Paris-Nord" for the statues). The gist:
 *
 * - the CENTRAL PAVILION as a triumphal arch: one great glazed arch with its clock, between two piers of paired giant
 *   Ionic pilasters, each carrying NORD on its entablature; a low gable over it all with PARIS (Cavelier's) on the
 *   apex and the eight foreign capitals on the pier tops, 5.5 m high;
 * - either side, a lower arched bay under a sloping shoulder — the section of the shed's aisles showing through;
 * - the fifteen French cities, 4 m, on the balustrades over the ground floor's colonnade ("GARE DU NORD" on its
 *   entablature);
 * - two-storey wings, arched windows over a colonnade, to the end pavilions with their giant pilasters.
 *
 * Fitted to OSM's head building (way 63195471, a U round the shed's end), front −z to the place (bearing 197°). The
 * shed behind it is `gareDuNordShed`, its own entry.
 */
export function gareDuNord(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#ddd2bb')
  const deep = shade(stone, 0.86)
  const pale = shade(stone, 1.04)
  const glass: Rgb = [0.2, 0.25, 0.28]
  const bars: Rgb = [0.24, 0.28, 0.27]
  const roofC = hex('#5d6266')
  const ring = ringOf(fit)
  // the front's two ends along it: the Hittorff front is the long straight run facing −z (OSM's east block
  // beyond it, set back, is later and plain)
  let x0 = Infinity, x1 = -Infinity
  const zf0 = Math.min(...ring.map((p) => p.z))
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    if (Math.abs(a.z - zf0) < 2.5 && Math.abs(b.z - zf0) < 2.5) { x0 = Math.min(x0, a.x, b.x); x1 = Math.max(x1, a.x, b.x) }
  }
  if (!Number.isFinite(x0)) { x0 = -fit.hx; x1 = fit.hx }
  const zf = Number.isFinite(frontAt(ring, (x0 + x1) / 2)) ? frontAt(ring, (x0 + x1) / 2) : zf0
  const xc = (x0 + x1) / 2
  const back = zf + 22                       // the head band's depth, to the shed
  const wingH = 19

  // ---- the body: the U raised to the wings' cornice, dressed all round
  body(out, ring, wingH, { kind: 'punched', wall: stone, glass, floor: 6.3, pitch: 4.6, solid: 0.55, arched: true, material: 'ashlar' }, roofC, { roofRise: 1.4, plainFront: true })

  // ---- the central pavilion: the triumphal arch
  const cw = 21                              // half its width
  const pier = 8.5
  // the two piers, each with two giant pilasters, the NORD entablature, two capitals on top
  for (const s of [-1, 1]) {
    const pa = xc + s * (cw - pier), pb = xc + s * cw
    const l = Math.min(pa, pb), r = Math.max(pa, pb)
    block(out, l, r, zf - 1.8, back, 0, 33, stone)
    for (const f of [0.27, 0.73]) pilaster(out, l + (r - l) * f, zf - 1.8, 3, 29.5, 2.1, stone)
    block(out, l - 0.3, r + 0.3, zf - 2.5, back, 29.5, 33, pale)
    engraved(out, 'NORD', (l + r) / 2, 31.2, zf - 2.56, 1.3, r - l - 1.5)
    block(out, l - 0.5, r + 0.5, zf - 2.8, back, 33, 34.2, deep)
    for (const f of [0.3, 0.7]) statue(out, l + (r - l) * f, 34.2, zf - 1.2, 5.5, pale)
    // a medallion between the pilasters
    pane(out, '-z', zf - 1.8, (l + r) / 2, 24, 1.8, 1.8, deep, 0.06)
  }
  // the bay between them: the wall, the great glazed arch and its archivolt, the clock, the gable over it all
  const aw = 2 * (cw - pier) - 1.5            // the arch's span
  const spring = 19
  block(out, xc - cw + pier, xc + cw - pier, zf - 0.9, back, 0, 33, stone)
  glazedArch(out, zf - 0.95, xc, 12.4, aw, spring + aw / 2 - 12.4, glass, bars, { pitch: 2.3, transoms: [16.6, spring] })
  archBand(out, zf - 1.0, xc, spring, aw / 2, aw / 2 + 1.3, pale, 20)
  clockFace(out, xc, spring + 2.6, zf - 1.15, 0, -1, 1.35, { dial: [0.95, 0.94, 0.9], rim: [0.75, 0.62, 0.3] })
  // the seven cities on their pedestals at the arch's foot
  for (let i = 0; i < 7; i++) statue(out, xc - aw / 2 + 1.6 + ((aw - 3.2) * i) / 6, 12.4, zf - 1.6, 4, pale)
  block(out, xc - aw / 2, xc + aw / 2, zf - 2.2, zf - 0.9, 11.4, 12.4, deep)            // their balustrade
  // the gable, the whole pavilion's width, with PARIS on its apex
  block(out, xc - cw - 0.5, xc + cw + 0.5, zf - 2.8, back, 33, 34.2, deep)
  pediment(out, xc - cw - 0.5, xc + cw + 0.5, zf - 2.0, 34.2, 6.4, back - zf + 2, stone)
  block(out, xc - 1.6, xc + 1.6, zf - 1.6, zf + 1.6, 39.6, 41.6, deep)
  statue(out, xc, 41.6, zf, 5.5, pale, false)
  // the ground floor: a colonnade of six under the entablature with the station's name
  colonnade(out, xc - aw / 2, xc + aw / 2, zf - 0.9, 0.6, 9.4, 6, stone, glass, 0.6)
  block(out, xc - aw / 2 - 0.3, xc + aw / 2 + 0.3, zf - 2.3, zf - 0.9, 9.4, 11.4, pale)
  engraved(out, 'GARE  DU  NORD', xc, 10.4, zf - 2.36, 1.0, aw - 4)

  // ---- the side bays: an arch each under a sloping shoulder, the outer pier with two cities on top
  for (const s of [-1, 1]) {
    const inner = xc + s * cw, outer = xc + s * (cw + 16)
    const l = Math.min(inner, outer), r = Math.max(inner, outer)
    block(out, l, r, zf - 0.9, back, 0, 24, stone)
    // the shoulder: a wedge from 24 at the outer edge up to 30 against the pier
    const yi = 30, yo = 24
    const xi = inner, xo = outer
    out.quad([[xo, yo, zf - 0.9], [xi, yo, zf - 0.9], [xi, yi, zf - 0.9], [xi, yi, zf - 0.9]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], stone, 0)
    out.quad([[xo, yo, zf - 0.9], [xi, yi, zf - 0.9], [xi, yi, back], [xo, yo, back]], [s * -0.35, 0.94, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], roofC, 0)
    // its raking cornice
    beam(out, [xo, yo + 0.1, zf - 1.3], [xi, yi + 0.1, zf - 1.3], 0.45, deep, 0.55)
    const bx = (l + r) / 2
    glazedArch(out, zf - 0.95, bx, 12.4, 9.6, 13.6, glass, bars, { pitch: 2.4, transoms: [17.6] })
    archBand(out, zf - 1.0, bx, 12.4 + 13.6 - 4.8, 4.8, 5.8, pale, 12)
    for (const f of [0.3, 0.7]) statue(out, l + (r - l) * f, 12.4, zf - 1.6, 4, pale)
    block(out, l + 1, r - 1, zf - 2.2, zf - 0.9, 11.4, 12.4, deep)
    colonnade(out, l + 1.2, r - 1.2, zf - 0.9, 0.6, 9.4, 4, stone, glass, 0.55)
    block(out, l + 0.8, r - 0.8, zf - 2.3, zf - 0.9, 9.4, 11.4, pale)
    // the outer pier, its NORD and its two cities
    const p0 = s > 0 ? r : l - 4, p1 = s > 0 ? r + 4 : l
    block(out, p0, p1, zf - 1.6, back, 0, 27.5, stone)
    pilaster(out, (p0 + p1) / 2, zf - 1.6, 3, 25, 2, stone)
    block(out, p0 - 0.3, p1 + 0.3, zf - 2.2, back, 25, 27.5, pale)
    engraved(out, 'NORD', (p0 + p1) / 2, 26.2, zf - 2.26, 0.9, 3.2)
    block(out, p0 - 0.5, p1 + 0.5, zf - 2.5, back, 27.5, 28.4, deep)
    for (const f of [0.28, 0.72]) statue(out, p0 + (p1 - p0) * f, 28.4, zf - 1.4, 4.4, pale)
  }

  // ---- the wings and end pavilions
  const wingIn = cw + 20
  const pav = 15
  for (const s of [-1, 1]) {
    const end = s > 0 ? x1 : x0
    const a = xc + s * wingIn, b = end - s * pav
    const l = Math.min(a, b), r = Math.max(a, b)
    if (r - l > 4) {
      // the colonnade below, the arched windows over it, the cornice and balustrade
      const n = Math.max(3, Math.round((r - l) / 4.6))
      for (let i = 0; i <= n; i++) {
        const x = l + ((r - l) * i) / n
        block(out, x - 0.5, x + 0.5, zf - 0.8, zf, 0.6, 10, shade(stone, 1.02))
        block(out, x - 0.45, x + 0.45, zf - 0.5, zf, 11.2, 17.6, shade(stone, 1.02))
      }
      for (let i = 0; i < n; i++) {
        const x = l + ((r - l) * (i + 0.5)) / n
        pane(out, '-z', zf - 0.02, x, 1, (r - l) / n - 1.6, 8.4, glass)
        archedPane(out, zf - 0.03, x, 12.2, (r - l) / n - 1.8, 5.2, glass)
      }
      block(out, l, r, zf - 0.9, zf, 10, 11.2, pale)
      block(out, l, r, zf - 1.1, zf, 17.6, 19, deep)
      block(out, l, r, zf - 0.6, zf, 19, 20.4, stone)
    }
    // the end pavilion: giant pilasters at its corners, three arched windows, the attic, statues at the corners
    const pl = Math.min(end, end - s * pav), pr = Math.max(end, end - s * pav)
    block(out, pl, pr, zf - 1.2, back, 0, 25, stone)
    for (const x of [pl + 1.3, pr - 1.3]) pilaster(out, x, zf - 1.2, 2, 22.5, 2.2, stone)
    for (let i = 0; i < 3; i++) {
      const x = pl + 4 + ((pav - 8) * (i + 0.5)) / 3
      archedPane(out, zf - 1.23, x, 12.6, 2.4, 6, glass)
      pane(out, '-z', zf - 1.23, x, 1.2, 2.6, 8, glass)
    }
    block(out, pl - 0.3, pr + 0.3, zf - 1.8, back, 22.5, 25, pale)
    engraved(out, 'NORD', (pl + pr) / 2, 23.7, zf - 1.86, 1.0, pav - 5)
    block(out, pl - 0.5, pr + 0.5, zf - 2.0, back, 25, 26, deep)
    block(out, pl, pr, zf - 1.0, back, 26, 27.6, stone)
    statue(out, s > 0 ? pr - 1.2 : pl + 1.2, 27.6, zf - 0.4, 4, pale)
  }
}

/**
 * The Gare du Nord's train shed: three gabled iron-and-glass halls over the thirty tracks — the tall nave behind the
 * front's central arch, a lower hall either side behind the aisles' arches — on OSM's outline (way 63197091, gabled,
 * `wall=no`), with the platforms between the track pairs.
 */
export function gareDuNordShed(out: MeshBuilder): void {
  const d = NORD_SHED
  // the front's centre is at x ≈ −7.4 in the shed's frame (the two entries share their turn)
  const xc = -7.4
  trainShed(out, d, {
    spans: [
      { a: -d.hx, b: xc - 20, kind: 'gable', eaves: 17, rise: 9 },
      { a: xc - 20, b: xc + 20, kind: 'gable', eaves: 23, rise: 13 },
      { a: xc + 20, b: d.hx, kind: 'gable', eaves: 17, rise: 9 },
    ],
    roof: hex('#5a6064'),
    glass: [0.5, 0.58, 0.62],
    iron: [0.22, 0.27, 0.27],
    bay: 9,
    ends: { head: true, throat: true },
  })
}
