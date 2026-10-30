import type { MeshBuilder } from '../../../buildings.ts'
import { type Rgb } from '../../../models.ts'
import { beam, block, classicalColumn, hex, lathe, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { archAlong, FIXED, UV } from './common.ts'
import { basin, blob, falls, G, lyingLion, octagon, seated, set } from './plaza-common.ts'

/*
 * THE FONTAINE SAINT-SULPICE, or des Quatre Évêques (Louis Visconti, 1843–48), on the place before the church: Wikipedia fr's
 * three octagonal basins stacked in a pyramid; FOUR LIONS holding the arms of Paris; at the corners of the
 * third, four vases pouring out; and on it the square shrine, 12 m to its cross, with a bishop seated larger than life in the
 * niche of each face — Bossuet north, Fénelon east, Fléchier west, Massillon south — under a pediment, pilasters at the
 * corners, a rounded cap. OSM (way 40068036, height 0.4) gives the outer kerb's octagon, its flats at bearings 352, 37, 82…:
 * the frame is that, −z north to Bossuet. The tiers' widths, the lions lying on the diagonals and the shrine's proportions
 * are from two Commons photographs (Fontaine Saint-Sulpice Paris 2008-03-14.jpg and "6"), scaled on that kerb, not a survey; they
 * put the first basin nearer 15 m across than the "environ 10 mètres" of Wikipedia fr, whose figure may be another tier's.
 */
const STONE: Rgb = hex('#d6cfbf')
const PALE: Rgb = hex('#e2dccd')
const SHADOW: Rgb = hex('#a39c8c')
const FIGURE: Rgb = hex('#c9c2b1')
const WATER: Rgb = hex('#6d93a0')
const FALL: Rgb = hex('#b6cbd0')

const R = 11

function shrineFace(q: MeshBuilder, y0: number): void {
  // (drawn on the −z face; `fourSides`-style copies are `set` round the centre by the caller)
  const hw = 2.0
  const yt = y0 + 3.9
  // the arched niche in its shadow, the bishop in it
  archAlong(q, 0, -hw - 0.03, 1, 0, 0, -1, y0 + 0.55, 2.3, 3.2, SHADOW)
  set(q, 0, y0 + 0.55, -hw - 0.15, Math.PI, 1.72, (m) => seated(m, FIGURE, shade(STONE, 0.92)))
  // the die under the niche and its tablet
  block(q, -1.5, 1.5, -hw - 0.12, -hw, y0 + 0.08, y0 + 0.55, PALE)
  // the arch's moulding: a crown of short beams round the niche
  const r = 1.2
  const sy = y0 + 0.55 + 3.2 - 1.15
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI
    const a1 = ((i + 1) / 6) * Math.PI
    beam(q, [Math.cos(a0) * r, sy + Math.sin(a0) * r, -hw - 0.08], [Math.cos(a1) * r, sy + Math.sin(a1) * r, -hw - 0.08], 0.09, PALE)
  }
  // the pediment over the cornice, with the arms on it
  const yp = yt + 0.46
  q.quad([[hw + 0.1, yp, -hw - 0.3], [-hw - 0.1, yp, -hw - 0.3], [0, yp + 0.8, -hw - 0.3], [0, yp + 0.8, -hw - 0.3]], [0, 0, -1], UV, PALE, FIXED)
  q.quad([[-hw - 0.1, yp, -hw - 0.3], [-hw - 0.1, yp, -hw + 0.6], [0, yp + 0.8, -hw + 0.6], [0, yp + 0.8, -hw - 0.3]], [-0.6, 0.8, 0], UV, STONE, FIXED)
  q.quad([[hw + 0.1, yp, -hw - 0.3], [hw + 0.1, yp, -hw + 0.6], [0, yp + 0.8, -hw + 0.6], [0, yp + 0.8, -hw - 0.3]], [0.6, 0.8, 0], UV, STONE, FIXED)
  blob(q, 0, yp + 0.34, -hw - 0.32, 0.26, 0.28, 0.08, SHADOW, 6, 3)
}

function draw(q: MeshBuilder): void {
  // the outer kerb and its water
  basin(q, octagon(R), octagon(R - 0.5), 0, G + 0.4, STONE, WATER)
  // the first basin, its water spilling all round
  basin(q, octagon(7.7), octagon(7.35), 0, G + 1.45, STONE, WATER)
  falls(q, octagon(7.7), G + 0.4, G + 1.4, FALL)
  // the second
  basin(q, octagon(4.6), octagon(4.25), G + 1.3, G + 2.9, STONE, WATER)
  falls(q, octagon(4.6), G + 1.45, G + 2.85, FALL)
  // the third, the shrine's stand, with its vases
  block(q, -2.55, 2.55, -2.55, 2.55, G + 2.8, G + 3.95, STONE)
  block(q, -2.75, 2.75, -2.75, 2.75, G + 3.95, G + 4.15, PALE)
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2
    const sx = Math.sin(a)
    const cz = Math.cos(a)
    // the lion lying on the first basin against the second, on the diagonal, the shield of Paris under his paws on the basin's face
    set(q, sx * 5.6, G + 1.45, cz * 5.6, a, 2.3, (m) => lyingLion(m, PALE))
    blob(q, sx * 7.72, G + 0.85, cz * 7.72, 0.55 * Math.abs(cz) + 0.08, 0.55, 0.55 * Math.abs(sx) + 0.08, SHADOW, 6, 3)
    // the vase at the stand's corner, pouring down to the second basin
    const vx = sx * Math.SQRT2 * 2.45
    const vz = cz * Math.SQRT2 * 2.45
    lathe(q, vx, vz, [[0.28, G + 3.95], [0.2, G + 4.25], [0.46, G + 4.65], [0.5, G + 5.0], [0.34, G + 5.2], [0.42, G + 5.32]], 8, PALE)
  }
  // the shrine: the corner pilasters, the wall, the cornice
  const y0 = G + 4.15
  const hw = 2.0
  const yt = y0 + 3.9
  block(q, -hw, hw, -hw, hw, y0, yt, STONE)
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) classicalColumn(q, x * (hw - 0.05), z * (hw - 0.05), y0, yt, 0.2, PALE, { order: 'corinthian', tier: 'mid' })
  block(q, -hw - 0.3, hw + 0.3, -hw - 0.3, hw + 0.3, yt, yt + 0.28, PALE)
  block(q, -hw - 0.42, hw + 0.42, -hw - 0.42, hw + 0.42, yt + 0.28, yt + 0.46, STONE)
  for (let k = 0; k < 4; k++) set(q, 0, 0, 0, (k * Math.PI) / 2, 1, (m) => shrineFace(m, y0))
  // the rounded cap, its lantern and its cross
  const yd = yt + 0.46
  const profile: [number, number][] = []
  for (let k = 0; k <= 6; k++) {
    const t = k / 6
    profile.push([0.1 + 2.25 * Math.cos(t * Math.PI / 2) ** 0.8, yd + 1.9 * Math.sin(t * Math.PI / 2)])
  }
  lathe(q, 0, 0, profile, 20, PALE)
  lathe(q, 0, 0, [[0.34, yd + 1.85], [0.16, yd + 2.05], [0.26, yd + 2.35], [0.09, yd + 2.65]], 10, STONE)
  block(q, -0.05, 0.05, -0.05, 0.05, yd + 2.6, yd + 3.2, STONE)
  block(q, -0.2, 0.2, -0.05, 0.05, yd + 2.92, yd + 3.02, STONE)
}

export function fontaineSaintSulpice(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, R, R, draw)
}
