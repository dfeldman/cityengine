/**
 * The café-front kit: the ground floor of a Paris café-brasserie, drawn on one face of a block. A rider going by sees
 * a painted WOODEN SHOPFRONT (panelled base, glazing between mullions, a fascia board with gold lettering), the
 * sloped AWNINGS over it with their valance lettered, and the TERRACE on the pavement: round tables and bentwood or
 * wicker chairs facing the street, with a glass windscreen along the open end.
 *
 * Everything is a field of `CafeStyle`, so a new café is one call with its colours and name. Faces follow the rest of
 * render/landmarks (F = which side of the block it is on; `plane` the wall, t along it).
 */
import { MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { hex, shade } from '../../kit.ts'
import { lettersOn, lettersWidth } from '../palaces/showfront.ts'
import type { F } from '../palaces/common.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export interface CafeStyle {
  /** shopfront: the painted wood, the glazing, the height of the fascia's top above the pavement */
  wood: Rgb
  glass: Rgb
  height: number
  /** the base panel under the glass, and the mullion spacing */
  base: number
  mullion: number
  /** fascia board colour, its lettering, the lettering's cap height, 0 for none */
  fascia: Rgb
  fasciaText: string
  gold: Rgb
  fasciaLetter: number
  /** awnings: colours (stripes alternate when two), depth out, how far the front edge drops, bay width, valance height */
  awning: Rgb[]
  awningText: string
  awningLetter: Rgb
  awningDepth: number
  awningDrop: number
  awningBay: number
  valance: number
  /** terrace: depth of pavement used, table spacing along the front, rows, colours, windscreen */
  terraceDepth: number
  tableStep: number
  rows: number
  chairs: Rgb
  tableTop: Rgb
  screen: boolean
  /** Art Deco sign board above the fascia: text ('' for none), cap height, board and letter colours, board height, rise above the fascia */
  signText: string
  signLetter: number
  signBoard: Rgb
  signGold: Rgb
  signHeight: number
  signRise: number
  /** Art Deco stone piers between the glazing bays: spacing along the front ('' none = 0) and their width */
  pierStep: number
  pierWidth: number
}

export const CAFE_DEFAULT: CafeStyle = {
  wood: hex('#2f4a36'), glass: hex('#2a3236'), height: 4.4, base: 0.85, mullion: 1.5,
  fascia: hex('#2f4a36'), fasciaText: '', gold: hex('#d8b24a'), fasciaLetter: 0.5,
  awning: [hex('#7a1d1d')], awningText: '', awningLetter: hex('#efe6cf'), awningDepth: 1.9, awningDrop: 0.7, awningBay: 3.2, valance: 0.4,
  terraceDepth: 3.6, tableStep: 1.25, rows: 2, chairs: hex('#b0763a'), tableTop: hex('#d9d2c0'), screen: true,
  signText: '', signLetter: 1.1, signBoard: hex('#1c2a24'), signGold: hex('#e0b94e'), signHeight: 1.8, signRise: 0.0,
  pierStep: 0, pierWidth: 0.35,
}

export const cafeStyle = (o: Partial<CafeStyle>): CafeStyle => ({ ...CAFE_DEFAULT, ...o })

/** where (t along the face, y up, d out from the wall) is in the block's frame */
function at(f: F, plane: number, t: number, y: number, d: number): [number, number, number] {
  switch (f) {
    case '-z': return [t, y, plane - d]
    case '+z': return [t, y, plane + d]
    case '-x': return [plane - d, y, t]
    default: return [plane + d, y, t]
  }
}
const NORMAL: Record<F, [number, number, number]> = { '-z': [0, 0, -1], '+z': [0, 0, 1], '-x': [-1, 0, 0], '+x': [1, 0, 0] }
const OUT: Record<F, number> = { '-z': -1, '+z': 1, '-x': -1, '+x': 1 }

/** a box in face terms: centre (t, y, d), half sizes along the face, up, out */
function bx(o: MeshBuilder, f: F, plane: number, t: number, y: number, d: number, ht: number, hy: number, hd: number, c: Rgb): void {
  const [x, yy, z] = at(f, plane, t, y, d)
  const zAxis = f === '-z' || f === '+z'
  box(o, x, yy, z, zAxis ? ht : hd, hy, zAxis ? hd : ht, c, FIXED)
}

/** a flat rectangle on the face, `d` out, facing out */
function rect(o: MeshBuilder, f: F, plane: number, t0: number, t1: number, y0: number, y1: number, d: number, c: Rgb): void {
  o.quad([at(f, plane, t0, y0, d), at(f, plane, t1, y0, d), at(f, plane, t1, y1, d), at(f, plane, t0, y1, d)], NORMAL[f], UV, c, FIXED)
}

/** The painted wooden shopfront and its fascia. */
export function shopfront(o: MeshBuilder, f: F, plane: number, t0: number, t1: number, s: CafeStyle): void {
  const top = s.height
  const fasciaH = Math.max(0.7, s.fasciaLetter * 1.5)
  const gTop = top - fasciaH
  bx(o, f, plane, (t0 + t1) / 2, s.base / 2, 0.08, (t1 - t0) / 2, s.base / 2, 0.08, s.wood)
  rect(o, f, plane, t0, t1, s.base, gTop, 0.05, s.glass)
  const n = Math.max(1, Math.round((t1 - t0) / s.mullion))
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n
    bx(o, f, plane, t, (s.base + gTop) / 2, 0.1, 0.06, (gTop - s.base) / 2, 0.06, s.wood)
  }
  bx(o, f, plane, (t0 + t1) / 2, s.base + 0.03, 0.1, (t1 - t0) / 2, 0.04, 0.07, s.wood)
  bx(o, f, plane, (t0 + t1) / 2, gTop, 0.1, (t1 - t0) / 2, 0.04, 0.07, s.wood)
  bx(o, f, plane, (t0 + t1) / 2, (gTop + top) / 2, 0.1, (t1 - t0) / 2, fasciaH / 2, 0.06, s.fascia)
  if (s.fasciaText) {
    const o2 = { h: s.fasciaLetter, c: s.gold, wide: 0.62, th: s.fasciaLetter / 7, d: 0.2 }
    const need = lettersWidth(s.fasciaText, o2)
    const avail = t1 - t0 - 0.6
    const k = need > avail ? avail / need : 1
    lettersOn(o, f, plane, (t0 + t1) / 2, gTop + (fasciaH - s.fasciaLetter * k) / 2, s.fasciaText,
      { ...o2, h: o2.h * k, th: o2.th * k })
  }
}

/** The sloped awnings along the front, a bay each, with the valance lettered on the middle ones. */
export function awnings(o: MeshBuilder, f: F, plane: number, t0: number, t1: number, s: CafeStyle): void {
  const n = Math.max(1, Math.round((t1 - t0) / s.awningBay))
  const w = (t1 - t0) / n
  const yTop = s.height + 0.15
  const yLow = yTop - s.awningDrop
  const dep = s.awningDepth
  const sgn = OUT[f]
  for (let i = 0; i < n; i++) {
    const c = s.awning[i % s.awning.length]
    const a = t0 + i * w + 0.03
    const b = t0 + (i + 1) * w - 0.03
    // the slope, up toward the wall
    o.quad([at(f, plane, a, yTop, 0.1), at(f, plane, b, yTop, 0.1), at(f, plane, b, yLow, dep), at(f, plane, a, yLow, dep)],
      [NORMAL[f][0] * 0.5, 0.85, NORMAL[f][2] * 0.5], UV, c, FIXED)
    // the valance hanging from the front edge
    o.quad([at(f, plane, a, yLow - s.valance, dep), at(f, plane, b, yLow - s.valance, dep), at(f, plane, b, yLow, dep), at(f, plane, a, yLow, dep)],
      NORMAL[f], UV, shade(c, 0.9), FIXED)
    // the end cheek, so it reads as a shape from the side
    for (const t of [a, b]) {
      o.quad([at(f, plane, t, yTop, 0.1), at(f, plane, t, yLow, dep), at(f, plane, t, yLow - s.valance, dep), at(f, plane, t, yLow - s.valance, 0.1)],
        f === '-z' || f === '+z' ? [1, 0, 0] : [0, 0, 1], UV, shade(c, 0.75), FIXED)
    }
    if (s.awningText) {
      const ch = Math.min(s.valance * 0.7, 0.28)
      const word = s.awningText
      const lo = { h: ch, c: s.awningLetter, wide: 0.62, th: ch / 7, d: 0.02 }
      if (lettersWidth(word, lo) < w - 0.3) {
        lettersOn(o, f, plane + sgn * dep, (a + b) / 2, yLow - s.valance + (s.valance - ch) / 2, word, lo)
      }
    }
  }
}

/** Tables and chairs on the pavement, `rows` deep, and the glass windscreen at its open end. */
export function terrace(o: MeshBuilder, f: F, plane: number, t0: number, t1: number, s: CafeStyle): void {
  const n = Math.max(1, Math.floor((t1 - t0) / s.tableStep))
  const step = (t1 - t0) / n
  const rowStep = (s.terraceDepth - 0.5) / Math.max(1, s.rows)
  const iron = hex('#2a2a2c')
  for (let r = 0; r < s.rows; r++) {
    const d = 0.9 + r * rowStep + rowStep * 0.2
    for (let i = 0; i < n; i++) {
      const t = t0 + step * (i + 0.5)
      bx(o, f, plane, t, 0.37, d, 0.03, 0.37, 0.03, iron)
      bx(o, f, plane, t, 0.74, d, 0.32, 0.025, 0.32, s.tableTop)
      // two chairs a side, on the wall side, backs to the wall, facing the street
      for (const k of [-1, 1]) {
        const ct = t + k * 0.38
        const cd = d - 0.52
        bx(o, f, plane, ct, 0.22, cd, 0.18, 0.22, 0.18, shade(s.chairs, 0.7))
        bx(o, f, plane, ct, 0.46, cd, 0.2, 0.025, 0.2, s.chairs)
        bx(o, f, plane, ct, 0.72, cd - 0.19, 0.19, 0.24, 0.02, s.chairs)
      }
    }
  }
  if (s.screen) {
    const d = s.terraceDepth
    const glass: Rgb = [0.55, 0.68, 0.72]
    rect(o, f, plane, t0, t1, 0.35, 1.5, d, glass)
    bx(o, f, plane, (t0 + t1) / 2, 1.5, d, (t1 - t0) / 2, 0.03, 0.03, s.wood)
    bx(o, f, plane, (t0 + t1) / 2, 0.32, d, (t1 - t0) / 2, 0.03, 0.04, s.wood)
  }
}

/** Art Deco extras: a tall lettered sign board above the awnings' line, and slim piers between glazing bays. */
export function deco(o: MeshBuilder, f: F, plane: number, t0: number, t1: number, s: CafeStyle): void {
  const mid = (t0 + t1) / 2
  if (s.pierStep > 0) {
    const n = Math.max(1, Math.round((t1 - t0) / s.pierStep))
    const gTop = s.height - Math.max(0.7, s.fasciaLetter * 1.5)
    for (let i = 0; i <= n; i++) {
      const t = t0 + ((t1 - t0) * i) / n
      bx(o, f, plane, t, (s.base + gTop) / 2, 0.14, s.pierWidth / 2, (gTop - s.base) / 2, 0.1, shade(s.wood, 1.1))
    }
  }
  if (s.signText) {
    const y0 = s.height + s.signRise
    bx(o, f, plane, mid, y0 + s.signHeight / 2, 0.12, (t1 - t0) / 2, s.signHeight / 2, 0.1, s.signBoard)
    const lo = { h: s.signLetter, c: s.signGold, wide: 0.7, th: s.signLetter / 6, d: 0.24 }
    const need = lettersWidth(s.signText, lo)
    const k = Math.min(1, (t1 - t0 - 1) / need)
    lettersOn(o, f, plane, mid, y0 + (s.signHeight - s.signLetter * k) / 2, s.signText, { ...lo, h: lo.h * k, th: lo.th * k })
  }
}

/** The whole café front on one face. */
export function cafeFront(o: MeshBuilder, f: F, plane: number, t0: number, t1: number, style: Partial<CafeStyle>): void {
  const s = cafeStyle(style)
  shopfront(o, f, plane, t0, t1, s)
  deco(o, f, plane, t0, t1, s)
  awnings(o, f, plane, t0, t1, s)
  terrace(o, f, plane, t0 + 0.2, t1 - 0.2, s)
}
