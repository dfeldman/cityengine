import type { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { block, hex, shade } from '../kit.ts'
import { sign } from '../parts.ts'
import { along, cornice, fin } from './louvre-palace.ts'
import { rectOn } from './palaces/common.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type P = [number, number]

/**
 * THE PALAIS DE CHAILLOT (Carlu, Boileau, Azéma, 1937; top-25 audit, 2026-10-30): it was two curved blocks of flats. Off OSM's relation 6826569,
 * IGN's aerial and "Palais de Chaillot - 20150801" (Commons, from the Eiffel Tower): the two HEAD PAVILIONS either side of the parvis, their
 * tall piers, the great bronze-framed bay in the front, flat-roofed, the words of Paul Valéry in gold over them; the two curved GALLERIES
 * falling away down the hill, one tall window to each bay between stone piers on the garden side, a flat roof with its row of lights; and
 * the END PAVILIONS with their four square columns.
 *
 * Local frame: the axis, −z toward the Eiffel Tower (entry's front 134.3), +x to the viewer's right (north-east), y = 0 the parvis (the entry's
 * baseY). The hill falls some 20 m to the far end of the north-east wing, so every wall goes down to LOW and the ground cuts it off.
 */
const STONE: Rgb = hex('#b9b09c')
const TRIM: Rgb = shade(STONE, 1.07)
const DEEP: Rgb = shade(STONE, 0.72)
const GLASS: Rgb = [0.14, 0.16, 0.17]
const BRONZE: Rgb = hex('#3b3a33')
const GOLD: Rgb = [0.76, 0.6, 0.26]
const LEAD: Rgb = hex('#70767a')
const LOW = -26
const WING = 9

/** A garden-side bay wall along one polyline segment: pier, tall window. */
function garden(q: MeshBuilder, L: number): void {
  q.quad([[0, LOW, 0], [L, LOW, 0], [L, WING, 0], [0, WING, 0]], [0, 0, -1], UV, STONE, FIXED)
  const n = Math.max(1, Math.round(L / 5.7))
  const b = L / n
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * b
    rectOn(q, '-z', 0, x - 1.65, x + 1.65, -19, 5.9, GLASS, 0.05)
    // the mullions and the spandrel at each floor
    rectOn(q, '-z', 0, x - 0.07, x + 0.07, -19, 5.9, BRONZE, 0.08)
    for (const y of [-8, 0]) rectOn(q, '-z', 0, x - 1.65, x + 1.65, y, y + 0.55, DEEP, 0.08)
    fin(q, x - b / 2 - 0.5, x - b / 2 + 0.5, LOW, 7, 0.55, TRIM)
  }
  cornice(q, 0, L, 7, 7.7, 0.7, TRIM)
  fin(q, 0, L, 7.7, WING, 0.16, STONE)
}
/** The street side: plain stone, a row of square windows. */
function street(q: MeshBuilder, L: number): void {
  q.quad([[0, LOW, 0], [L, LOW, 0], [L, WING, 0], [0, WING, 0]], [0, 0, -1], UV, STONE, FIXED)
  const n = Math.max(1, Math.round(L / 6.4))
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * (L / n)
    rectOn(q, '-z', 0, x - 1, x + 1, 2.4, 5.6, GLASS, 0.05)
    rectOn(q, '-z', 0, x - 1, x + 1, -3.6, 0, GLASS, 0.05)
  }
  cornice(q, 0, L, 7.4, 7.9, 0.5, TRIM)
}

/** A curved gallery between its two polylines, going the same way: the walls (outside on the right of each walk), the roof, its lights. */
function gallery(out: MeshBuilder, gardenLine: P[], streetLine: P[], gardenRight: boolean): void {
  const walk = (line: P[], draw: (q: MeshBuilder, L: number) => void, right: boolean): void => {
    const l = right ? line : [...line].reverse()
    for (let i = 0; i + 1 < l.length; i++) along(out, l[i], l[i + 1], draw)
  }
  walk(gardenLine, garden, gardenRight)
  walk(streetLine, street, !gardenRight)
  // the roof: a strip between the two lines, sampled along each by length
  const at = (line: P[], t: number): P => {
    const lens = line.slice(1).map((p, i) => Math.hypot(p[0] - line[i][0], p[1] - line[i][1]))
    let d = t * lens.reduce((a, b) => a + b, 0)
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i] || i === lens.length - 1) { const k = d / lens[i]; return [line[i][0] + (line[i + 1][0] - line[i][0]) * k, line[i][1] + (line[i + 1][1] - line[i][1]) * k] }
      d -= lens[i]
    }
    return line[line.length - 1]
  }
  const N = 22
  const Y = WING - 0.05
  for (let i = 0; i < N; i++) {
    const a = at(gardenLine, i / N), b = at(gardenLine, (i + 1) / N), c = at(streetLine, (i + 1) / N), d = at(streetLine, i / N)
    out.quad([[a[0], Y, a[1]], [b[0], Y, b[1]], [c[0], Y, c[1]], [d[0], Y, d[1]]], [0, 1, 0], UV, LEAD, FIXED)
    // a skylight in the garden band, as on the aerial
    const m = (u: P, v: P, k: number): P => [u[0] + (v[0] - u[0]) * k, u[1] + (v[1] - u[1]) * k]
    const p0 = m(a, d, 0.2), p1 = m(b, c, 0.2), p2 = m(b, c, 0.5), p3 = m(a, d, 0.5)
    const q0 = m(p0, p1, 0.18), q1 = m(p0, p1, 0.82), q2 = m(p3, p2, 0.82), q3 = m(p3, p2, 0.18)
    out.quad([[q0[0], Y + 0.25, q0[1]], [q1[0], Y + 0.25, q1[1]], [q2[0], Y + 0.25, q2[1]], [q3[0], Y + 0.25, q3[1]]], [0, 1, 0], UV, shade(GLASS, 2), FIXED)
  }
}

/** A head pavilion, x0..x1 across (`inner` the parvis side), z −30..28. */
function head(out: MeshBuilder, x0: number, x1: number, inner: number): void {
  const TOP = 17
  const Z0 = -30
  const Z1 = 28
  const s = Math.sign(x0 + x1)
  // the walls: front (toward the Tower) and back, the parvis side, the outer side
  const front = (q: MeshBuilder, L: number): void => {
    q.quad([[0, LOW, 0], [L, LOW, 0], [L, TOP, 0], [0, TOP, 0]], [0, 0, -1], UV, STONE, FIXED)
    const m = L / 2
    // the great bay: a tall recess, three bronze-framed lights, a stone lintel
    rectOn(q, '-z', 0, m - 7, m + 7, -6, 12.8, BRONZE, 0.04)
    for (const u of [-4.6, 0, 4.6]) {
      rectOn(q, '-z', 0, m + u - 2, m + u + 2, -5, 11.8, GLASS, 0.07)
      rectOn(q, '-z', 0, m + u - 2, m + u + 2, 2.5, 2.8, BRONZE, 0.09)
    }
    fin(q, m - 7.6, m + 7.6, 12.8, 14.4, 0.25, TRIM)
    // the great flat pylons either side
    for (const x of [m - 15.2, m + 15.2]) fin(q, x - 5.8, x + 5.8, -22, TOP - 0.2, 0.9, TRIM)
    for (const x of [m - 10.2, m + 10.2]) rectOn(q, '-z', 0, x - 0.6, x + 0.6, -5, 10.6, GLASS, 0.05)
    cornice(q, -0.2, L + 0.2, TOP - 0.9, TOP, 1, TRIM)
  }
  const parvis = (q: MeshBuilder, L: number): void => {
    q.quad([[0, LOW, 0], [L, LOW, 0], [L, TOP, 0], [0, TOP, 0]], [0, 0, -1], UV, STONE, FIXED)
    const n = 9
    const b = (L - 6) / n
    for (let i = 0; i < n; i++) {
      const x = 3 + (i + 0.5) * b
      rectOn(q, '-z', 0, x - b * 0.33, x + b * 0.33, 0.6, 11.8, GLASS, 0.05)
      rectOn(q, '-z', 0, x - b * 0.33, x + b * 0.33, 5.2, 5.5, BRONZE, 0.08)
      fin(q, x + b / 2 - 0.42, x + b / 2 + 0.42, 0, 12.8, 0.4, TRIM)
    }
    cornice(q, 0, L, 12.8, 13.2, 0.45, TRIM)
    // Valéry's words in gold along the frieze, the ones every photograph of the parvis looks up at
    sign(q, { type: 'flat', text: s < 0 ? 'TOUT HOMME CRÉE SANS LE SAVOIR' : 'COMME IL RESPIRE MAIS L’ARTISTE', h: 1, w: L - 12, face: 'roman', colour: GOLD, tracking: 0.12, lit: 'none' }, { x: L / 2, y: 14.3, z: -0.08, heading: Math.PI })
    cornice(q, -0.2, L + 0.2, TOP - 0.9, TOP, 1, TRIM)
  }
  const plainWall = (q: MeshBuilder, L: number): void => {
    q.quad([[0, LOW, 0], [L, LOW, 0], [L, TOP, 0], [0, TOP, 0]], [0, 0, -1], UV, STONE, FIXED)
    const n = Math.round(L / 6)
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * (L / n); rectOn(q, '-z', 0, x - 1.1, x + 1.1, 1, 11, GLASS, 0.05) }
    cornice(q, -0.2, L + 0.2, TOP - 0.9, TOP, 1, TRIM)
  }
  along(out, [x0, Z0], [x1, Z0], front)
  along(out, [x1, Z1], [x0, Z1], plainWall)
  // walk so that the outside is on the right
  if (s > 0) {
    along(out, [x0, Z1], [x0, Z0], inner === x0 ? parvis : plainWall)
    along(out, [x1, Z0], [x1, Z1], plainWall)
  } else {
    along(out, [x1, Z0], [x1, Z1], inner === x1 ? parvis : plainWall)
    along(out, [x0, Z1], [x0, Z0], plainWall)
  }
  // the roof and the attic that stands back on it, the lights in it (the aerial's)
  block(out, x0, x1, Z0, Z1, TOP - 0.1, TOP, LEAD)
  block(out, x0 + 7, x1 - 7, Z0 + 9, Z1 - 9, TOP, TOP + 4.6, STONE)
  block(out, x0 + 6.8, x1 - 6.8, Z0 + 8.8, Z1 - 8.8, TOP + 4.6, TOP + 5, TRIM)
  block(out, x0 + 12, x1 - 12, Z0 + 14, Z1 - 14, TOP + 5, TOP + 5.3, shade(GLASS, 1.8))
}

/** An end pavilion: x0..x1, z0..z1 (z0 to the gardens), four square columns over a high base, flat. */
function endPavilion(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number): void {
  const TOP = 5
  block(out, x0, x1, z0 + 2.4, z1, LOW, TOP, STONE)
  block(out, x0 - 0.1, x1 + 0.1, z0, z1, -16, -14.4, TRIM)
  block(out, x0, x1, z0, z0 + 2.4, LOW, -16, STONE)
  const w = x1 - x0
  for (let i = 0; i < 4; i++) {
    const x = x0 + (w * (i + 0.5)) / 4
    block(out, x - 1.15, x + 1.15, z0 + 0.1, z0 + 2.3, -14.4, 2.7, TRIM)
  }
  // the dark wall behind the columns, the entablature, the lid
  block(out, x0 + 0.5, x1 - 0.5, z0 + 2.3, z0 + 2.45, -14.4, 2.7, GLASS)
  block(out, x0 - 0.2, x1 + 0.2, z0, z1, 2.7, TOP, TRIM)
  block(out, x0, x1, z0 + 0.5, z1 - 0.5, TOP, TOP + 0.1, LEAD)
}

export function palaisChaillot(out: MeshBuilder): void {
  head(out, 27.5, 70, 27.5)
  head(out, -70, -27.5, -27.5)
  // north-east: garden line and street line, both walked from the head out (the garden is on the right)
  gallery(out, [[70, -21.6], [116.3, -26.4], [148, -37.4], [162, -47.5], [172.5, -59.6], [177.9, -76.7], [178, -93.6]],
    [[70, 7.4], [121.6, 1.1], [147, -6.3], [165.3, -15], [182.8, -27.2], [194.6, -40.8], [202.2, -55.7], [206.2, -74.2]], true)
  // south-west, the same out the other way: walked from the head the garden is on the left
  gallery(out, [[-70.3, -21.2], [-108.5, -24.9], [-140.5, -35.1], [-162.5, -48.3], [-171.9, -58.8], [-177, -72.1], [-179.4, -96.9]],
    [[-70.5, 13.5], [-108.1, 3.4], [-133.7, -2], [-157.1, -12.3], [-179.2, -25.4], [-195, -40.8], [-205.2, -67.5]], false)
  endPavilion(out, 178, 212.5, -100.4, -73.6)
  endPavilion(out, -213.5, -179, -102, -72)
}
