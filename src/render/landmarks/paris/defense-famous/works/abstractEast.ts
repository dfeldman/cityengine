import type { MeshBuilder } from '../../../../buildings.ts'
import { box, FIXED, prism, strut, type Rgb } from '../../../../models.ts'
import type { Fit } from '../../../fit.ts'

/*
 * La Défense's east-end abstract works on the dalle (Esplanade, Reflets, Michelet, Corolles sectors). Each entry sits at
 * its work's centre with rotateDeg 0, so the local frame is the city's (x east, z south); positions are metres from that
 * centre. Forms were corrected 2026-11-24 from Paris La Défense's own photos and pages (parisladefense.com/en/district/
 * artworks/<slug>), viewed for reference only; each function's comment says what the photo showed. Sizes are read off
 * the photos against people and façades, so they are TUNABLE constants, not measurements.
 */

/** the ground of the dalle at the model's middle (max over a few samples: a road under the slab is lower) */
function dalle(fit: Fit, r = 0): number {
  const g = fit.groundAt
  if (!g) return fit.grade ?? 0
  let m = Number.NEGATIVE_INFINITY
  const pts: [number, number][] = r > 0 ? [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]] : [[0, 0]]
  for (const [x, z] of pts) {
    const v = g(x, z)
    if (Number.isFinite(v)) m = Math.max(m, v)
  }
  return Number.isFinite(m) ? m : (fit.grade ?? 0)
}

/** run a drawing, then lift what it drew by dy (the dalle's height) */
function lifted(out: MeshBuilder, dy: number, draw: () => void): void {
  const from = out.positions.length
  draw()
  for (let i = from; i < out.positions.length; i += 3) out.positions[i + 1] += dy
}

/** a ball of radius r centred (cx, cy, cz), from stacked tapered prisms */
function ball(out: MeshBuilder, cx: number, cy: number, cz: number, r: number, col: Rgb, bands = 8, sides = 12): void {
  for (let i = 0; i < bands; i++) {
    const a0 = Math.PI * (i / bands) - Math.PI / 2
    const a1 = Math.PI * ((i + 1) / bands) - Math.PI / 2
    prism(out, cx, cz, cy + r * Math.sin(a0), cy + r * Math.sin(a1), Math.max(0.001, r * Math.cos(a0)), sides, col, FIXED, Math.max(0.001, r * Math.cos(a1)), i === bands - 1)
  }
}

const GRANITE: Rgb = [0.5, 0.5, 0.5]
const BLACK: Rgb = [0.1, 0.1, 0.11]
const MIRROR: Rgb = [0.78, 0.8, 0.84]

/** small deterministic pseudo-random in [0,1) */
function rnd(i: number): number { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }

// ---------------------------------------------------------------- Lim Dong-lak, Point - Croissance
const POINT_BALL = 1.25                    // polished stainless sphere radius (photo: ~2.5 m across)
const POINT_STALK_W = 0.2
const POINT_STALK: [number, number, number][] = [[0.1, 2.2, 0], [0.0, 3.0, 0.1], [-0.35, 3.7, 0.1], [-0.15, 4.3, 0], [0.3, 4.8, 0], [0.35, 5.3, 0.05], [0.0, 5.6, 0.05]]

/** LIM DONG-LAK, POINT - CROISSANCE (2007; parisladefense.com photos): a big mirror-polished stainless sphere with a thin black wavy stalk, a "young shoot", curling up out of its top. */
export function pointCroissance(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 3), () => {
    ball(out, 0, POINT_BALL, 0, POINT_BALL, MIRROR, 10, 16)
    for (let i = 0; i + 1 < POINT_STALK.length; i++) {
      const w = POINT_STALK_W * (1 - 0.6 * i / POINT_STALK.length)
      strut(out, POINT_STALK[i], POINT_STALK[i + 1], w, w, BLACK)
    }
  })
}

// ---------------------------------------------------------------- Morellet, La Défonce
const DEF_LEN = 25.5      // rail length along the pavilion's long axis
const DEF_W = 8.4         // distance between the two rails
const DEF_RISE = 8        // height of the high end
const DEF_BAR = 0.4       // square bar section
const DEF_AXIS = 25.6     // degrees from +x toward +z: the FNAC pavilion's long side (OSM way)
const DEF_CX = 0.5, DEF_CZ = -12.5   // pavilion centre, from the entry point (OSM)
const DEF_COL: Rgb = [0.27, 0.14, 0.14]
const DEF_CROSS = [0, 0.38, 1]       // cross-bar positions along the rails (share of length)

/** FRANÇOIS MORELLET, LA DÉFONCE (1990; photos): a rectangle of square-section dark-maroon steel bars, two long rails and cross bars, lying slanted half-buried in the plaza and rising along the glass FNAC pavilion to pass over its roof (the page says a bar pierces the building like a stake). */
export function defonce(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 5), () => {
    const a = (DEF_AXIS * Math.PI) / 180, ux = Math.cos(a), uz = Math.sin(a), vx = -uz, vz = ux
    const P = (s: number, t: number): [number, number, number] => {
      const u = (s - 0.5) * DEF_LEN, v = t * DEF_W / 2
      return [DEF_CX + u * ux + v * vx, s * DEF_RISE, DEF_CZ + u * uz + v * vz]
    }
    for (const t of [-1, 1]) strut(out, P(0, t), P(1, t), DEF_BAR, DEF_BAR, DEF_COL)
    for (const s of DEF_CROSS) strut(out, P(s, -1), P(s, 1), DEF_BAR, DEF_BAR, DEF_COL)
  })
}

// ---------------------------------------------------------------- Venet, Doubles lignes indéterminées
const VEN_LOOPS: [number, number, number, number, number][] = [   // yaw deg, tilt deg, rx, ry, spin offset
  [0, 80, 3.0, 3.1, 0], [40, 70, 2.8, 3.3, 1], [95, 85, 3.2, 3.0, 2], [140, 62, 2.6, 3.2, 3], [65, 40, 3.4, 2.4, 4],
]
const VEN_BAR = 0.38
const VEN_PLATFORM = 5.2

/** BERNAR VENET, DOUBLES LIGNES INDÉTERMINÉES (1988; photos): a tangle of thick black steel bands looping and crossing in space, standing on a low round stone platform; drawn as five tilted elliptical loops of one bar section. */
export function venetLignes(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 8), () => {
    prism(out, 0, 0, 0, 0.3, VEN_PLATFORM, 24, GRANITE, FIXED)
    const SEG = 28
    for (const [yawD, tiltD, rx, ry, sp] of VEN_LOOPS) {
      const f = (yawD * Math.PI) / 180, th = (tiltD * Math.PI) / 180
      const U = [Math.cos(f), 0, Math.sin(f)], V = [-Math.sin(f) * Math.cos(th), Math.sin(th), Math.cos(f) * Math.cos(th)]
      const cy = 0.3 + ry * Math.abs(Math.sin(th)) + 0.1
      const ox = (rnd(sp) - 0.5) * 1.6, oz = (rnd(sp + 9) - 0.5) * 1.6
      let prev: [number, number, number] | null = null
      for (let i = 0; i <= SEG; i++) {
        const t = (i / SEG) * Math.PI * 2
        const p: [number, number, number] = [ox + rx * Math.cos(t) * U[0] + ry * Math.sin(t) * V[0], cy + ry * Math.sin(t) * V[1], oz + rx * Math.cos(t) * U[2] + ry * Math.sin(t) * V[2]]
        if (prev) strut(out, prev, p, VEN_BAR, VEN_BAR, BLACK)
        prev = p
      }
    }
  })
}

// ---------------------------------------------------------------- Atila, Le Sculpteur de nuages
const ATI_W = 8, ATI_D = 5, ATI_H = 4.6   // tile-clad kiosk
const ATI_COLS: Rgb[] = [[0.9, 0.72, 0.12], [0.15, 0.32, 0.65], [0.78, 0.2, 0.15], [0.93, 0.5, 0.12], [0.95, 0.95, 0.9], [0.1, 0.12, 0.35], [0.2, 0.55, 0.45]]
const ATI_NX = 5, ATI_NY = 3

/** ATILA, LE SCULPTEUR DE NUAGES (1972; photos, "enamelled lava plates", a fresco painted 1969): NOT a mast but a tile-covered kiosk/box on the dalle, its four faces patchworked in saturated enamel colours (yellow, blue, red, orange, cloud white). Colour patches are a deterministic stand-in for the painted scene. */
export function sculpteurDeNuages(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 4), () => {
    box(out, 0, ATI_H / 2, 0, ATI_W / 2, ATI_H / 2, ATI_D / 2, [0.2, 0.22, 0.3], FIXED)
    let n = 0
    for (const face of [0, 1, 2, 3]) {
      const alongX = face < 2, L = alongX ? ATI_W : ATI_D, s = face % 2 ? -1 : 1
      const cols = Math.round(ATI_NX * L / ATI_W) + 1
      for (let i = 0; i < cols; i++) for (let j = 0; j < ATI_NY; j++) {
        const c = ATI_COLS[Math.floor(rnd(n++) * ATI_COLS.length)]
        const w = L / cols, h = ATI_H / ATI_NY
        const a = -L / 2 + (i + 0.5) * w, y = (j + 0.5) * h
        if (alongX) box(out, a, y, s * (ATI_D / 2 + 0.03), w / 2 * 0.98, h / 2 * 0.98, 0.03, c, FIXED)
        else box(out, s * (ATI_W / 2 + 0.03), y, a, 0.03, h / 2 * 0.98, w / 2 * 0.98, c, FIXED)
      }
    }
  })
}

// ---------------------------------------------------------------- Jankovic, Dans les traces de nos pères
const JAN_RED: Rgb = [0.55, 0.26, 0.19]
const JAN_LEG_H = 3.1
const JAN_PAIRS = 2

/** JOZEF JANKOVIC, DANS LES TRACES DE NOS PÈRES (1988; photos; concrete, polyester, paint): NOT a row of blocks but figurative: two huge pairs of red-brown legs and feet on a stone plinth, a child climbing up out of the space between the parents' legs, one arm stretched up. */
export function tracesDeNosPeres(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 4), () => {
    box(out, 0, 0.25, 0, 2.0, 0.25, 1.1, GRANITE, FIXED)
    for (let k = 0; k < JAN_PAIRS; k++) {
      const z = (k - (JAN_PAIRS - 1) / 2) * 0.01, x0 = (k ? 1 : -1) * 0.0
      for (const s of [-1, 1]) {
        const x = x0 + s * 0.62
        box(out, x, 0.6, z + 0.35, 0.3, 0.1, 0.55, JAN_RED, FIXED)                    // foot
        prism(out, x, z, 0.5, 0.5 + JAN_LEG_H, 0.42, 10, JAN_RED, FIXED, 0.5)          // leg, swelling to the thigh
      }
      box(out, x0, 0.5 + JAN_LEG_H, z, 1.2, 0.18, 0.5, JAN_RED, FIXED)                 // hips
      // child climbing between: torso and raised arm
      prism(out, x0, z + 0.15, 0.8, 2.6, 0.26, 8, JAN_RED, FIXED, 0.3)
      strut(out, [x0, 2.5, z + 0.15], [x0 + 0.35, 3.9, z + 0.1], 0.18, 0.18, JAN_RED)
      ball(out, x0 - 0.1, 2.8, z + 0.15, 0.22, JAN_RED, 4, 8)
    }
  })
}

// ---------------------------------------------------------------- Caro, After Olympia
const CARO_RUST: Rgb = [0.42, 0.25, 0.16]
const CARO_RUST2: Rgb = [0.5, 0.3, 0.19]
const CARO_LEN = 23, CARO_W = 2.6, CARO_BASE = 0.8, CARO_PEAK = 3.2, CARO_PIECES = 16

/** ANTHONY CARO, AFTER OLYMPIA (1985-86; photos; varnished rusted steel, 23 m long): a long heavy steel slab base carrying an assemblage of rolled plates, tubes and angled sheets that peak in the middle and fall away at both ends like the Olympia pediment. Individual pieces are a seeded stand-in. */
export function afterOlympia(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 4), () => {
    box(out, 0, CARO_BASE / 2, 0, CARO_LEN / 2, CARO_BASE / 2, CARO_W / 2, CARO_RUST, FIXED)
    for (let i = 0; i < CARO_PIECES; i++) {
      const t = (i + 0.5) / CARO_PIECES * 2 - 1
      const h = 0.8 + (CARO_PEAK - 0.8) * (1 - Math.abs(t)) * (0.7 + 0.5 * rnd(i))
      const x = t * (CARO_LEN / 2 - 1.2), z = (rnd(i + 20) - 0.5) * (CARO_W - 0.8)
      const c = i % 2 ? CARO_RUST2 : CARO_RUST
      const kind = i % 3
      if (kind === 0) prism(out, x, z, CARO_BASE, CARO_BASE + h, 0.3 + 0.15 * rnd(i + 5), 10, c, FIXED)
      else if (kind === 1) box(out, x, CARO_BASE + h / 2, z, 0.08, h / 2, 0.5 + 0.3 * rnd(i + 7), c, FIXED)
      else strut(out, [x - 0.7, CARO_BASE + 0.1, z], [x + 0.7, CARO_BASE + h, z + (rnd(i + 3) - 0.5)], 0.9, 0.1, c)
    }
  })
}

// ---------------------------------------------------------------- Lancelin, Cube Sphère Gold
const CSG_N = 6          // spheres along each edge
const CSG_R = 0.27       // sphere radius
const CSG_PLINTH = 0.5
const GOLD_SHINE: Rgb = [0.92, 0.72, 0.2]

/** CYRIL LANCELIN, CUBE SPHÈRE GOLD (2021; photos): a cube assembled from a regular lattice of mirror-gold balls, hollowed by tunnels in all three directions (it reads as an arch from the side), on a low stone plinth. */
export function cubeSphereGold(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 2), () => {
    const e = CSG_N * CSG_R * 2
    box(out, 0, CSG_PLINTH / 2, 0, e / 2 + 0.3, CSG_PLINTH / 2, e / 2 + 0.3, GRANITE, FIXED)
    const lo = Math.floor(CSG_N / 2) - 1, hi = CSG_N - lo - 1
    const inner = (k: number) => k >= lo && k <= hi
    for (let i = 0; i < CSG_N; i++) for (let j = 0; j < CSG_N; j++) for (let k = 0; k < CSG_N; k++) {
      if ((+inner(i) + +inner(j) + +inner(k)) >= 2) continue
      ball(out, -e / 2 + CSG_R + i * CSG_R * 2, CSG_PLINTH + CSG_R + j * CSG_R * 2, -e / 2 + CSG_R + k * CSG_R * 2, CSG_R, GOLD_SHINE, 4, 8)
    }
  })
}

// ---------------------------------------------------------------- Jakober, BC1
const BC1_RX = 1.55, BC1_RZ = 1.2, BC1_H = 1.9, BC1_BAR = 0.14
const BC1_COL: Rgb = [0.16, 0.13, 0.12]

/** BEN JAKOBER, BC1 (1987-88; photos; painted steel from solid iron rollers, ~3 t): a dark open-lattice "American football helmet" dome of bent rings on a pale stone slab set in a lawn bed. */
export function bc1Jakober(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 2), () => {
    box(out, 0, 0.1, 0, 2.6, 0.1, 2.6, [0.78, 0.76, 0.7], FIXED)
    const y0 = 0.25, RINGS = 5, MER = 10, SEG = 16
    const at = (lat: number, lon: number): [number, number, number] => [BC1_RX * Math.cos(lat) * Math.cos(lon), y0 + BC1_H * Math.sin(lat), BC1_RZ * Math.cos(lat) * Math.sin(lon)]
    for (let r = 0; r < RINGS; r++) {
      const lat = ((r + 0.4) / RINGS) * (Math.PI / 2) * 0.95
      for (let i = 0; i < SEG; i++) strut(out, at(lat, (i / SEG) * Math.PI * 2), at(lat, ((i + 1) / SEG) * Math.PI * 2), BC1_BAR, BC1_BAR, BC1_COL)
    }
    for (let m = 0; m < MER; m++) {
      const lon = (m / MER) * Math.PI * 2 + 0.2
      for (let r = 0; r < 6; r++) strut(out, at((r / 6) * (Math.PI / 2), lon), at(((r + 1) / 6) * (Math.PI / 2), lon), BC1_BAR, BC1_BAR, BC1_COL)
    }
  })
}

// ---------------------------------------------------------------- Bourgeat, Banc public
const BAN_L = 5.0
const BAN_D = 1.25
const BAN_SEAT_H = 1.15
const BAN_SLATS = 4
const BAN_BACK_H = 1.1
const BAN_COL: Rgb = [0.2, 0.55, 0.27]     // painted green slats (photo)
const BAN_LEG: Rgb = [0.9, 0.9, 0.87]      // white legs

/** LILIAN BOURGEAT, BANC PUBLIC (2009, installed 2018; photos; 2.5 x a park bench): a green-slatted bench on white legs, about 5 m long, seat 1.15 m, back to ~2.2 m. */
export function bancPublic(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 4), () => {
    for (const sx of [-1, 1]) {
      const x = sx * (BAN_L / 2 - 0.45)
      for (const sz of [-1, 1]) box(out, x, BAN_SEAT_H / 2, sz * (BAN_D / 2 - 0.12), 0.07, BAN_SEAT_H / 2, 0.07, BAN_LEG, FIXED)
      strut(out, [x, BAN_SEAT_H, -BAN_D / 2 + 0.1], [x, BAN_SEAT_H + BAN_BACK_H, -BAN_D / 2 - 0.25], 0.14, 0.14, BAN_LEG)
    }
    for (let i = 0; i < BAN_SLATS; i++) {
      const z = -BAN_D / 2 + 0.15 + (i / (BAN_SLATS - 1)) * (BAN_D - 0.3)
      box(out, 0, BAN_SEAT_H + 0.05, z, BAN_L / 2, 0.05, 0.13, BAN_COL, FIXED)
    }
    for (let i = 0; i < 3; i++) {
      const t = (i + 0.5) / 3
      box(out, 0, BAN_SEAT_H + 0.25 + t * (BAN_BACK_H - 0.35), -BAN_D / 2 - t * 0.25 + 0.08, BAN_L / 2, 0.13, 0.04, BAN_COL, FIXED)
    }
  })
}

// ---------------------------------------------------------------- Philolaos, Les Nymphéas
const NYM_BASIN: [number, number] = [6.5, 3.2]   // concrete trough, x then z
const NYM_FLOWERS: [number, number, number][] = [[-1.7, 0, 0.8], [0.5, 0.3, 1.0], [2.2, -0.2, 0.7]]   // x, z, scale
const NYM_PETALS = 5

/** PHILOLAOS, LES NYMPHÉAS (1989; photos, stainless steel): in a raised rectangular concrete trough of water, a few folded stainless-steel "flowers": petals of bent sheet opening upward like waterlilies. */
export function nympheasPhilolaos(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 4), () => {
    const [bx, bz] = NYM_BASIN
    box(out, 0, 0.35, 0, bx / 2, 0.35, bz / 2, [0.6, 0.6, 0.58], FIXED)
    box(out, 0, 0.72, 0, bx / 2 - 0.35, 0.02, bz / 2 - 0.35, [0.38, 0.55, 0.62], FIXED)
    for (const [x, z, sc] of NYM_FLOWERS) for (let p = 0; p < NYM_PETALS; p++) {
      const a = (p / NYM_PETALS) * Math.PI * 2 + x
      const dx = Math.cos(a), dz = Math.sin(a)
      strut(out, [x + dx * 0.1, 0.8, z + dz * 0.1], [x + dx * 1.2 * sc, 0.8 + 0.9 * sc, z + dz * 1.2 * sc], 0.7 * sc, 0.04, MIRROR)
    }
  })
}

// ---------------------------------------------------------------- Philolaos, L'Oiseau mécanique
const OIS_FINS: [number, number, number, number, number][] = [   // x, z, height, lean x, lean z
  [-1.1, 0.3, 3.4, 0.5, 0.2], [-0.2, -0.5, 4.3, 0.1, 0.4], [0.7, 0.4, 3.8, -0.4, -0.3], [1.5, -0.3, 2.9, -0.6, 0.2], [0.1, 1.0, 2.4, 0.2, -0.6], [-0.8, -1.0, 2.7, 0.5, 0.4],
]

/** PHILOLAOS, L'OISEAU MÉCANIQUE (1972; photos, stainless steel): not a bird body but a cluster of big tilted stainless cones/sails of unequal height, like folded wings, rising from a low planter. */
export function oiseauMecanique(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 2), () => {
    box(out, 0, 0.2, 0, 2.6, 0.2, 2.0, GRANITE, FIXED)
    for (const [x, z, h, lx, lz] of OIS_FINS) {
      const N = 5
      for (let s = 0; s < N; s++) {
        const t0 = s / N, t1 = (s + 1) / N
        prism(out, x + lx * t0 * h * 0.3, z + lz * t0 * h * 0.3, 0.4 + t0 * h, 0.4 + t1 * h, 0.85 * (1 - 0.8 * t0), 10, MIRROR, FIXED, 0.85 * (1 - 0.8 * t1), s === 0)
      }
    }
  })
}
