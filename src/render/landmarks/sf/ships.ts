/**
 * THE FAMOUS SHIPS (BUGS.md #251, owner 2026-10-02: "we should write down to do specific renderings of the very
 * famous ships"). Each a gist — the masts, the rigging's yards, the funnels and the paddle boxes are what make one
 * recognisable from the quay; a generic hull is the floor, not the finish.
 *
 * At Hyde Street Pier (the Maritime National Historical Park; none but Alma in OSM, so placed standalone along the
 * pier, public/landmarks/san-francisco/ships.json): BALCLUTHA, the 1886 steel full-rigger; C.A. THAYER, the 1895
 * three-masted lumber schooner; EUREKA, the 1890 walking-beam paddle ferry; HERCULES, the 1907 steam tug; ALMA, the
 * 1891 scow schooner. By the Ferry Building: SANTA ROSA, the 1927 ferry (now offices), and the SAN FRANCISCO BELLE,
 * the paddle-wheel party boat. At Pier 45: the Liberty ship SS JEREMIAH O'BRIEN. (USS Pampanito is manual-1.ts's.)
 *
 * Frame: the waterline at y = 0 (each entry is placed with `deckAbove: 0`, on the sea's level); the hull along the
 * fit's LONGER axis, the bow at its + end.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { faceBand } from '../tower.ts'
import { beam } from './golden-gate.ts'

const BLACK: Rgb = [0.10, 0.10, 0.11]
const WHITE: Rgb = [0.90, 0.89, 0.85]
const BUFF: Rgb = [0.78, 0.66, 0.44]
const DECK: Rgb = [0.56, 0.47, 0.36]
const GREY: Rgb = [0.48, 0.50, 0.50]
const RED: Rgb = [0.55, 0.12, 0.10]
const SPAR: Rgb = [0.30, 0.24, 0.18]

type V3 = [number, number, number]

/** a ship's own frame: u along (stern −L … bow +L), v across, y up — mapped onto the fit's longer axis */
class Ship {
  readonly L: number
  readonly B: number
  private readonly alongX: boolean
  constructor(readonly out: MeshBuilder, fit: Fit, length: number, beamW: number) {
    this.alongX = fit.hx >= fit.hz
    const fl = Math.max(fit.hx, fit.hz) * 2
    const fb = Math.min(fit.hx, fit.hz) * 2
    // the footprint's size where it is plausible for this ship, the ship's own where it is not
    this.L = (fl > length * 0.6 && fl < length * 1.5 ? fl : length) / 2
    this.B = (fb > beamW * 0.5 && fb < beamW * 2 ? fb : beamW) / 2
  }
  p(u: number, y: number, v: number): V3 { return this.alongX ? [u, y, v] : [v, y, u] }
  box(u: number, y: number, v: number, hu: number, hy: number, hv: number, c: Rgb, tag = 0): void {
    if (this.alongX) box(this.out, u, y, v, hu, hy, hv, c, tag)
    else box(this.out, v, y, u, hv, hy, hu, c, tag)
  }
  /** a vertical pole or funnel at (u, v) */
  pole(u: number, v: number, y0: number, y1: number, r: number, c: Rgb, tag = 0, r1 = r): void {
    const [x, , z] = this.p(u, 0, v)
    prism(this.out, x, z, y0, y1, r, 8, c, tag, r1)
  }
  /** the hull: a pointed bow, a rounded stern, from below the water to `free`, its deck at `free` */
  hull(free: number, side: Rgb, deck: Rgb, band?: { y0: number; y1: number; c: Rgb }, bluff = 0.3): void {
    const { L, B } = this
    const ring: { u: number; v: number }[] = []
    const n = 10
    // the bow: from the beam at L·(1−bluff) curving to a point at +L
    for (let i = 0; i <= n; i++) { const t = i / n; ring.push({ u: L * (1 - bluff) + L * bluff * Math.sin((t * Math.PI) / 2), v: -B * Math.cos((t * Math.PI) / 2) }) }
    for (let i = n - 1; i >= 0; i--) { const t = i / n; ring.push({ u: L * (1 - bluff) + L * bluff * Math.sin((t * Math.PI) / 2), v: B * Math.cos((t * Math.PI) / 2) }) }
    // the stern: a rounded counter
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI; ring.push({ u: -L + B * 0.6 * (1 - Math.sin(a)), v: B * Math.cos(a) }) }
    const pts = ring.map((q) => { const [x, , z] = this.p(q.u, 0, q.v); return { x, z } })
    // wound counter-clockwise for faceBand
    let a2 = 0
    for (let i = 0; i < pts.length; i++) { const a = pts[i]; const b = pts[(i + 1) % pts.length]; a2 += a.x * b.z - b.x * a.z }
    const r = a2 >= 0 ? pts : [...pts].reverse()
    const metal = surfaceTag('metal')
    faceBand(this.out, r, -1.5, free, { kind: 'blank', wall: side, material: 'metal' })
    if (band) faceBand(this.out, r.map((q) => ({ x: q.x * 1.004, z: q.z * 1.004 })), band.y0, band.y1, { kind: 'blank', wall: band.c, material: 'metal' })
    capPolygon(this.out, r, free, deck, metal)
  }
  /** a square-rigged mast: the pole, and its yards, longest at the bottom */
  squareMast(u: number, y0: number, h: number, yards: number, span: number): void {
    this.pole(u, 0, y0, y0 + h, 0.35, SPAR, 0, 0.12)
    for (let k = 0; k < yards; k++) {
      const y = y0 + h * (0.3 + (0.62 * k) / Math.max(1, yards - 1))
      const w = span * (1 - 0.13 * k)
      this.box(u, y, 0, 0.12, 0.12, w, SPAR)
      // the furled sail along it
      this.box(u + 0.12, y - 0.25, 0, 0.18, 0.22, w * 0.92, [0.86, 0.83, 0.74])
    }
  }
  /** a fore-and-aft mast: the pole, its boom and gaff, a topmast */
  schoonerMast(u: number, y0: number, h: number, boom: number): void {
    this.pole(u, 0, y0, y0 + h, 0.3, SPAR, 0, 0.1)
    const b0: V3 = this.p(u, y0 + 2.2, 0), b1: V3 = this.p(u - boom, y0 + 2.4, 0)
    beam(this.out, b0, b1, 0.18, 0.18, SPAR)
    const g0: V3 = this.p(u, y0 + h * 0.62, 0), g1: V3 = this.p(u - boom * 0.8, y0 + h * 0.7, 0)
    beam(this.out, g0, g1, 0.15, 0.15, SPAR)
  }
  bowsprit(len: number, y: number): void {
    beam(this.out, this.p(this.L - 1, y, 0), this.p(this.L + len, y + len * 0.25, 0), 0.25, 0.25, SPAR)
  }
  /** a stay from (u0, y0) to (u1, y1) on the centreline — the rigging's main lines */
  stay(u0: number, y0: number, u1: number, y1: number): void {
    beam(this.out, this.p(u0, y0, 0), this.p(u1, y1, 0), 0.05, 0.05, [0.2, 0.18, 0.16], false)
  }
}

/** BALCLUTHA (1886): the steel full-rigger — black hull, white band with painted ports, three square-rigged masts */
export function balclutha(out: MeshBuilder, fit: Fit): void {
  const s = new Ship(out, fit, 78, 12)
  const F = 6
  s.hull(F, BLACK, DECK, { y0: F - 1.4, y1: F - 0.6, c: WHITE }, 0.28)
  s.box(-s.L + 8, F + 1.2, 0, 6, 1.2, s.B * 0.7, WHITE, surfaceTag('metal'))
  for (const [u, h] of [[s.L * 0.5, 44], [0, 46], [-s.L * 0.45, 38]] as const) s.squareMast(u, F, h, 5, s.B * 1.5)
  s.bowsprit(14, F + 1)
  s.stay(s.L + 13, F + 4, s.L * 0.5, F + 40)
  s.stay(s.L * 0.5, F + 42, 0, F + 44)
  s.stay(0, F + 44, -s.L * 0.45, F + 36)
}

/** C.A. THAYER (1895): the lumber schooner — dark hull, three tall fore-and-aft masts, long bowsprit */
export function caThayer(out: MeshBuilder, fit: Fit): void {
  const s = new Ship(out, fit, 47, 11)
  const F = 4
  s.hull(F, [0.12, 0.17, 0.14], DECK, { y0: F - 0.5, y1: F, c: WHITE }, 0.35)
  s.box(-s.L + 6, F + 1.0, 0, 4, 1.0, s.B * 0.6, WHITE)
  for (const u of [s.L * 0.45, 0, -s.L * 0.45]) s.schoonerMast(u, F, 32, 11)
  s.bowsprit(12, F + 0.8)
  s.stay(s.L + 11, F + 3.5, s.L * 0.45, F + 30)
}

/** EUREKA (1890): the paddle ferry — white two-deck superstructure the length of her, paddle boxes, one tall stack */
export function eureka(out: MeshBuilder, fit: Fit): void {
  const s = new Ship(out, fit, 91, 13)
  const F = 2.5
  s.hull(F, WHITE, [0.4, 0.38, 0.36], undefined, 0.15)
  // the two decks of cabins, the upper narrower, windows as a dark band
  s.box(0, F + 2.0, 0, s.L * 0.86, 2.0, s.B * 0.92, WHITE)
  s.box(0, F + 2.4, 0, s.L * 0.86 + 0.05, 0.6, s.B * 0.92 + 0.05, [0.25, 0.27, 0.3])
  s.box(0, F + 5.6, 0, s.L * 0.72, 1.6, s.B * 0.78, WHITE)
  s.box(0, F + 5.9, 0, s.L * 0.72 + 0.05, 0.5, s.B * 0.78 + 0.05, [0.25, 0.27, 0.3])
  // a pilot house at each end — she was double-ended
  for (const e of [-1, 1]) s.box(e * s.L * 0.62, F + 8.4, 0, 2.2, 1.2, 2.6, WHITE)
  // the paddle boxes, either side amidships
  for (const v of [-1, 1]) s.box(0, F + 2.6, v * (s.B + 2.2), 6.5, 3.6, 2.2, WHITE)
  // the walking beam's A-frame and the tall black stack
  s.box(-4, F + 11, 0, 0.4, 3.5, 2.8, BLACK)
  s.box(-4, F + 14.3, 0, 5, 0.35, 0.35, BLACK)
  s.pole(6, 0, F + 7.2, F + 20, 1.1, BLACK)
}

/** HERCULES (1907): the ocean-going steam tug — black hull, buff deckhouse, tall buff stack with a black top */
export function hercules(out: MeshBuilder, fit: Fit): void {
  const s = new Ship(out, fit, 41, 8)
  const F = 3
  s.hull(F, BLACK, DECK, { y0: F - 0.5, y1: F, c: RED }, 0.35)
  s.box(-1, F + 1.6, 0, s.L * 0.45, 1.6, s.B * 0.62, BUFF)
  s.box(s.L * 0.25, F + 4.0, 0, 2.6, 1.0, s.B * 0.55, WHITE)
  s.pole(-2, 0, F + 3.2, F + 12, 0.9, BUFF)
  s.pole(-2, 0, F + 12, F + 13.4, 0.92, BLACK)
  s.pole(s.L * 0.55, 0, F, F + 14, 0.15, SPAR)
}

/** ALMA (1891): the scow schooner — a flat, square-ended hull low in the water, two masts */
export function alma(out: MeshBuilder, fit: Fit): void {
  const s = new Ship(out, fit, 18, 6.8)
  const F = 1.4
  s.hull(F, [0.30, 0.22, 0.16], DECK, { y0: F - 0.3, y1: F, c: WHITE }, 0.12)
  s.box(-s.L + 3, F + 0.8, 0, 1.6, 0.8, 1.6, WHITE)
  s.schoonerMast(s.L * 0.45, F, 20, 7)
  s.schoonerMast(-s.L * 0.15, F, 19, 7)
  s.bowsprit(5, F + 0.6)
}

/** SANTA ROSA (1927): the ferry, now offices — white, two decks of windows, a pilot house at each end, one stack */
export function santaRosa(out: MeshBuilder, fit: Fit): void {
  const s = new Ship(out, fit, 78, 19)
  const F = 2.2
  s.hull(F, WHITE, [0.4, 0.38, 0.36], { y0: 0, y1: 0.8, c: [0.3, 0.32, 0.35] }, 0.12)
  s.box(0, F + 2.1, 0, s.L * 0.88, 2.1, s.B * 0.95, WHITE)
  s.box(0, F + 2.6, 0, s.L * 0.88 + 0.05, 0.7, s.B * 0.95 + 0.05, [0.24, 0.27, 0.3])
  s.box(0, F + 5.8, 0, s.L * 0.7, 1.6, s.B * 0.82, WHITE)
  s.box(0, F + 6.1, 0, s.L * 0.7 + 0.05, 0.55, s.B * 0.82 + 0.05, [0.24, 0.27, 0.3])
  for (const e of [-1, 1]) s.box(e * s.L * 0.55, F + 8.6, 0, 2.4, 1.2, 3.2, WHITE)
  s.pole(0, 0, F + 7.4, F + 14, 1.3, WHITE)
  s.pole(0, 0, F + 14, F + 15, 1.32, BLACK)
}

/** SAN FRANCISCO BELLE: the party boat in Mississippi style — three white decks, twin black stacks, red stern wheel */
export function sfBelle(out: MeshBuilder, fit: Fit): void {
  const s = new Ship(out, fit, 80, 18)
  const F = 2
  s.hull(F, WHITE, [0.4, 0.38, 0.36], { y0: 0, y1: 0.6, c: RED }, 0.25)
  const decks = [[0.86, 0.95], [0.78, 0.86], [0.55, 0.62]] as const
  decks.forEach(([lu, lv], k) => {
    const y = F + k * 3.2
    s.box(-2, y + 1.5, 0, s.L * lu, 1.5, s.B * lv, WHITE)
    s.box(-2, y + 1.6, 0, s.L * lu + 0.05, 0.6, s.B * lv + 0.05, [0.24, 0.27, 0.3])
    // the gallery rail round each deck, gingerbread white
    s.box(-2, y + 3.1, 0, s.L * lu + 0.4, 0.1, s.B * lv + 0.4, WHITE)
  })
  // the twin stacks forward, with their crowns
  for (const v of [-1, 1]) { s.pole(s.L * 0.45, v * 3, F + 9, F + 21, 0.7, BLACK); s.pole(s.L * 0.45, v * 3, F + 21, F + 21.8, 1.1, BLACK) }
  s.box(s.L * 0.4, F + 11.5, 0, 2.4, 1.3, 3.4, WHITE)
  // the red paddle wheel at the stern
  s.box(-s.L - 2.5, F + 2.5, 0, 2.5, 3.5, s.B * 0.7, RED)
  for (let k = 0; k < 6; k++) s.box(-s.L - 2.5, F + 2.5, 0, 0.12, 3.6, s.B * 0.72, [0.4, 0.08, 0.06])
}

/** SS JEREMIAH O'BRIEN (1943): the Liberty ship — grey hull, the bridge house amidships with one funnel, three masts of derricks */
export function jeremiahOBrien(out: MeshBuilder, fit: Fit): void {
  const s = new Ship(out, fit, 135, 17)
  const F = 8
  s.hull(F, GREY, [0.36, 0.34, 0.3], { y0: -0.2, y1: 0.8, c: RED }, 0.22)
  // the forecastle and the poop
  s.box(s.L - 10, F + 1.2, 0, 9, 1.2, s.B * 0.8, GREY)
  s.box(-s.L + 9, F + 1.4, 0, 8, 1.4, s.B * 0.85, GREY)
  // the bridge house amidships: three tiers, the wheelhouse on top, the funnel behind
  s.box(0, F + 3, 0, 12, 3, s.B * 0.85, [0.84, 0.84, 0.8])
  s.box(1, F + 7.2, 0, 8, 1.2, s.B * 0.7, [0.84, 0.84, 0.8])
  s.box(3, F + 9.6, 0, 4, 1.2, s.B * 0.55, [0.84, 0.84, 0.8])
  s.pole(-6, 0, F + 6, F + 15, 1.6, GREY)
  s.pole(-6, 0, F + 15, F + 16, 1.62, BLACK)
  // the three masts and their derricks, raised at their working angle over the hatches
  for (const u of [s.L * 0.55, s.L * 0.22, -s.L * 0.4]) {
    s.pole(u, 0, F, F + 22, 0.4, GREY)
    s.box(u, F + 12, 0, 0.3, 0.3, 2.8, GREY)
    for (const d of [-1, 1]) beam(out, s.p(u, F + 1.5, 0), s.p(u + d * 10, F + 9, 0), 0.22, 0.22, GREY)
  }
}

export const SHIPS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  balclutha, caThayer, eureka, hercules, alma, santaRosa, sfBelle, jeremiahOBrien,
}
