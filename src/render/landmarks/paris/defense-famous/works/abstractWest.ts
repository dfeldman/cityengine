import type { MeshBuilder } from '../../../../buildings.ts'
import { box, car, EMIT, FIXED, prism, strut, type Rgb } from '../../../../models.ts'
import type { Fit } from '../../../fit.ts'

/*
 * La Défense's west-end abstract works on the dalle: Takis's Signaux Lumineux, Serra's Slat, Buren's two installations,
 * Miyawaki's Utsurohi, Philolaos's Les Cheminées, Bufalino's car on a lamp post. Each entry sits at its work's centre
 * with rotateDeg 0, so the local frame is the city's; positions below are metres from that centre.
 * Heights and counts the sources do not give are GUESSES, marked as such in each entry's note.
 */

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** the ground of the dalle at the model's middle, above the model's base (the max over a few samples: a road under the slab is lower) */
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

/** deterministic 0..1 noise */
const rnd = (n: number): number => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s) }

/** a flat plate from its bottom centre: width w along horizontal angle ang, thickness t across it, h up, the top shifted by (lx, lz): a lean */
function leaning(out: MeshBuilder, x: number, z: number, ang: number, w: number, t: number, h: number, lx: number, lz: number, col: Rgb): void {
  const u: [number, number] = [Math.cos(ang), Math.sin(ang)]
  const n: [number, number] = [-u[1], u[0]]
  const P = (a: number, b: number, top: number): [number, number, number] =>
    [x + u[0] * a * w / 2 + n[0] * b * t / 2 + lx * top, h * top, z + u[1] * a * w / 2 + n[1] * b * t / 2 + lz * top]
  const faces: [[number, number, number][], [number, number, number]][] = [
    [[[-1, 1, 0], [1, 1, 0], [1, 1, 1], [-1, 1, 1]], [n[0], 0, n[1]]],
    [[[1, -1, 0], [-1, -1, 0], [-1, -1, 1], [1, -1, 1]], [-n[0], 0, -n[1]]],
    [[[1, 1, 0], [1, -1, 0], [1, -1, 1], [1, 1, 1]], [u[0], 0, u[1]]],
    [[[-1, -1, 0], [-1, 1, 0], [-1, 1, 1], [-1, -1, 1]], [-u[0], 0, -u[1]]],
    [[[-1, 1, 1], [1, 1, 1], [1, -1, 1], [-1, -1, 1]], [0, 1, 0]],
  ]
  for (const [c, nn] of faces) out.quad(c.map(([a, b, top]) => P(a, b, top)), nn, UV, col, FIXED)
}

const STEEL: Rgb = [0.55, 0.57, 0.6]
const DARK: Rgb = [0.2, 0.21, 0.23]
const WHITE: Rgb = [0.93, 0.93, 0.92]

// ---------------------------------------------------------------- Takis, Signaux lumineux (1990)
const SIG_AXIS = (55 * Math.PI) / 180   // OSM way 186981679's long axis, from +x toward +z
const SIG_ROWS = 3
const SIG_PER_ROW = [6, 5, 6]   // 17 signals in all (parisladefense.com)
const SIG_LEN = 22
const SIG_ACROSS = 11
const SIG_H0 = 6.5   // masts 6.5 to 11.5 m (artatsite, parisladefense)
const SIG_H1 = 11.5
const SIG_LAMPS: Rgb[] = [[1, 0.2, 0.15], [1, 0.8, 0.1], [0.2, 0.85, 0.3], [0.2, 0.5, 1], [0.95, 0.95, 0.95], [0.9, 0.3, 0.9]]

/**
 * TAKIS, SIGNAUX LUMINEUX (1990), OSM way 186981679 behind the Arche: a field of slim steel rods of unequal height each
 * topped with a bright geometric lamp (cube, pyramid, flat plate) that flashes. Rows along the way's long axis. 17 masts, 6.5 to 11.5 m (parisladefense.com, artatsite).
 * Their arrangement in rows and the lamp shapes are guessed.
 */
export function signauxLumineux(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 6), () => {
    const c = Math.cos(SIG_AXIS), s = Math.sin(SIG_AXIS)
    let k = 0
    for (let r = 0; r < SIG_ROWS; r++) for (let i = 0; i < SIG_PER_ROW[r]; i++, k++) {
      const a = (((i + 0.5 + (rnd(k) - 0.5) * 0.4) / SIG_PER_ROW[r]) - 0.5) * SIG_LEN
      const b = ((r / (SIG_ROWS - 1)) - 0.5) * SIG_ACROSS + (rnd(k + 50) - 0.5) * 1.2
      const x = a * c - b * s
      const z = a * s + b * c
      const h = SIG_H0 + (SIG_H1 - SIG_H0) * rnd(k + 9)
      prism(out, x, z, 0, h, 0.045, 6, STEEL, FIXED, 0.03)
      const col = SIG_LAMPS[k % SIG_LAMPS.length]
      const col2 = SIG_LAMPS[(k * 5 + 2) % SIG_LAMPS.length]
      box(out, x, h + 0.2, z, 0.2, 0.2, 0.2, col, EMIT)
      if (k % 3 === 0) prism(out, x, z, h + 0.4, h + 1.0, 0.28, 4, col2, EMIT, 0.02, true, Math.PI / 4)
      else box(out, x, h + 0.6, z, 0.35, 0.02, 0.35, col2, EMIT)
    }
  })
}

// ---------------------------------------------------------------- Serra, Slat
const SLAT_PLATES = 5
const SLAT_R = 2.6
const SLAT_H = 12
const SLAT_W = 3.65   // 12 ft wide x 40 ft tall (artatsite)
const SLAT_T = 0.1
const SLAT_LEAN = 1.2
const CORTEN: Rgb = [0.45, 0.24, 0.13]

/**
 * RICHARD SERRA, SLAT (1983, set up 2008), OSM node 7437390233: five tall Cor-ten plates round a pentagon, each leaning
 * so together they form an open prism about 12 m high. Plate size, radius and lean guessed.
 */
export function slatSerra(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit), () => {
    for (let i = 0; i < SLAT_PLATES; i++) {
      const a = (i / SLAT_PLATES) * Math.PI * 2 + 0.3
      const lean = i % 2 === 0 ? SLAT_LEAN : -SLAT_LEAN
      leaning(out, Math.cos(a) * SLAT_R, Math.sin(a) * SLAT_R, a + Math.PI / 2, SLAT_W, SLAT_T, SLAT_H, Math.cos(a) * lean, Math.sin(a) * lean, i % 2 ? [0.4, 0.21, 0.11] : CORTEN)
    }
  })
}

// ---------------------------------------------------------------- Buren
const PIL_COLS = 10
const PIL_ROWS = 5
const PIL_STEP = 2.7
const PIL_W = 0.261   // Dibond sleeves 26.1 cm square over the existing posts (parisladefense.com, 2017): three 8.7 cm stripes a face
const PIL_STRIPE = 0.087
const PIL_H0 = 3.0   // post height unknown: GUESSED, uniform 3 m (posts, not a sculpted field)
const PIL_H1 = 3.0

/**
 * DANIEL BUREN, LE CARREFOUR AUX 50 PILIERS: fifty square pillars in 5 rows of 10, banded in Buren's 8.7 cm white and
 * dark stripes (vertical). Grid, heights and pillar width guessed (OSM does not map it).
 */
export function burenCarrefour(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 8), () => {
    let k = 0
    for (let r = 0; r < PIL_ROWS; r++) for (let i = 0; i < PIL_COLS; i++, k++) {
      const x = (i - (PIL_COLS - 1) / 2) * PIL_STEP
      const z = (r - (PIL_ROWS - 1) / 2) * PIL_STEP
      const h = PIL_H0 + (PIL_H1 - PIL_H0) * (0.5 + 0.5 * Math.sin(k * 1.7 + r))
      const hw = PIL_W / 2
      box(out, x, h / 2, z, hw, h / 2, hw, DARK, FIXED)
      for (const f of [-1, 1]) for (const j of [-1, 1]) {
        const o = j * PIL_STRIPE
        box(out, x + o, h / 2, z + f * (hw + 0.004), PIL_STRIPE / 2, h / 2, 0.004, WHITE, FIXED)
        box(out, x + f * (hw + 0.004), h / 2, z + o, 0.004, h / 2, PIL_STRIPE / 2, WHITE, FIXED)
      }
    }
  })
}

const RONDE_N = 16
const RONDE_R = 15.28   // 30.56 m circle (parisladefense.com)
const RONDE_POLE = 10
const RONDE_COLS: Rgb[] = [[0.85, 0.15, 0.15], [0.1, 0.65, 0.65], [0.15, 0.3, 0.75], [1, 0.5, 0.1], [0.2, 0.65, 0.3]]
const SOCK_LEN = 4.3, SOCK_R0 = 0.42, SOCK_R1 = 0.12, SOCK_RINGS = 8   // hang from the pole head, striped in rings (Panoramax photo)

/**
 * DANIEL BUREN, LA RONDE DES MANCHES A AIR: sixteen 10 m steel poles on a ring about 30 m across (centre 48.89244,
 * 2.23731), each carrying a lit, ring-striped windsock hanging about 4.3 m (Panoramax photo: red, teal, blue socks alternating with white). The ring and height are OSM's (aeroway=windsock
 * height=10, nodes 8907141908..8907169523); sock length and colours guessed.
 */
export function burenRonde(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, RONDE_R), () => {
    for (let i = 0; i < RONDE_N; i++) {
      const a = (i / RONDE_N) * Math.PI * 2
      const x = Math.cos(a) * RONDE_R
      const z = Math.sin(a) * RONDE_R
      prism(out, x, z, 0, RONDE_POLE, 0.07, 6, STEEL, FIXED, 0.045)
      const col = RONDE_COLS[i % RONDE_COLS.length]
      const lean = 0.06 + 0.05 * (i % 3)   // each hangs a little off the vertical, toward the east
      for (let s = 0; s < SOCK_RINGS; s++) {
        const t0 = s / SOCK_RINGS, t1 = (s + 1) / SOCK_RINGS
        const r0 = SOCK_R0 + (SOCK_R1 - SOCK_R0) * t0, r1 = SOCK_R0 + (SOCK_R1 - SOCK_R0) * t1
        prism(out, x + 0.45 + lean * t0 * SOCK_LEN, z, RONDE_POLE - 0.2 - t1 * SOCK_LEN, RONDE_POLE - 0.2 - t0 * SOCK_LEN, r1, 8, s % 2 ? WHITE : col, FIXED, r0)
      }
    }
  })
}

// ---------------------------------------------------------------- Miyawaki, Utsurohi
const UTS_AXIS = (62 * Math.PI) / 180
const UTS_ROWS = 3
const UTS_PER_ROW = 10
const UTS_LEN = 33
const UTS_ACROSS = 14
const UTS_R = 0.15
const UTS_H0 = 3.5
const UTS_H1 = 9
const UTS_COL: Rgb = [0.82, 0.86, 0.88]

/**
 * AIKO MIYAWAKI, UTSUROHI - DESSIN AU CIEL (1988), OSM way 186981705: thirty linked columns 30 cm across, steel clad in
 * crystallised glass, joined by steel rods (Wikipedia fr). Layout (3 rows of 10), heights (3.5 to 9 m, waving) and the
 * rods' pattern guessed.
 */
export function utsurohiMiyawaki(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 8), () => {
    const c = Math.cos(UTS_AXIS), s = Math.sin(UTS_AXIS)
    const tops: [number, number, number][][] = []
    for (let r = 0; r < UTS_ROWS; r++) {
      const row: [number, number, number][] = []
      for (let i = 0; i < UTS_PER_ROW; i++) {
        const a = ((i / (UTS_PER_ROW - 1)) - 0.5) * UTS_LEN
        const b = ((r / (UTS_ROWS - 1)) - 0.5) * UTS_ACROSS
        const x = a * c - b * s
        const z = a * s + b * c
        const h = UTS_H0 + (UTS_H1 - UTS_H0) * (0.5 + 0.5 * Math.sin(i * 0.8 + r * 2.1))
        prism(out, x, z, 0, h, UTS_R, 8, UTS_COL, FIXED)
        row.push([x, h, z])
      }
      tops.push(row)
    }
    for (let r = 0; r < UTS_ROWS; r++) for (let i = 0; i < UTS_PER_ROW; i++) {
      if (i + 1 < UTS_PER_ROW) strut(out, tops[r][i], tops[r][i + 1], 0.04, 0.04, STEEL, FIXED, false)
      if (r + 1 < UTS_ROWS && i % 2 === 0) strut(out, tops[r][i], tops[r + 1][i], 0.04, 0.04, STEEL, FIXED, false)
    }
  })
}

// ---------------------------------------------------------------- Philolaos, Les Cheminees
const CHIM_H: [number, number, number][] = [[0, 0, 6], [1.9, 0.6, 4.5], [0.9, -1.8, 7.5]]
const CHIM_R = 0.85
const CHIM_PALE: Rgb = [0.72, 0.74, 0.76]   // stainless steel (parisladefense.com)

/**
 * PHILOLAOS, LES CHEMINEES (1973), OSM nodes 5705436105 and 5705436106 (12 m apart, tagged man_made=chimney): sculpted
 * ventilation stacks. Entry centred between the nodes: two clusters of three round stacks of unequal height (4.5 to
 * 7.5 m), concrete grey with a dark mouth. Form guessed; the sources give none.
 */
export function cheminees(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit, 6), () => {
    for (const [ox, oz, flip] of [[-5.5, 1.5, 1], [5.5, -1.5, -1]] as const) {
      for (const [dx, dz, h] of CHIM_H) {
        const x = ox + dx * flip
        const z = oz + dz * flip
        prism(out, x, z, 0, h, CHIM_R, 12, CHIM_PALE, FIXED, CHIM_R * 0.8)
        prism(out, x, z, h - 0.02, h + 0.06, CHIM_R * 0.55, 12, DARK, FIXED)
      }
    }
  })
}

// ---------------------------------------------------------------- Bufalino
const LAMP_H = 3.8   // lamp ~4 m, the car on top ~5 m up (defense-92, pariszigzag)
const LAMP_COL: Rgb = [0.3, 0.32, 0.35]

/**
 * BENEDETTO BUFALINO, LA VOITURE SUR LE LAMPADAIRE (2019), OSM node 8641700148: a small car stood on top of a street-lamp
 * pole as though it were the lamp. A Peugeot 406 (white) inverted on a ~4 m lamp pole (defense-92: 4 m pole, car on its roof; 5 m overall). The car is the game's generic car.
 */
export function voitureLampadaireBufalino(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit), () => {
    prism(out, 0, 0, 0, LAMP_H, 0.13, 8, LAMP_COL, FIXED, 0.09)
    prism(out, 0, 0, 0, 0.5, 0.2, 8, LAMP_COL, FIXED)
    const from = out.positions.length
    car(out)   // a white Peugeot 406, upside down on its roof: turned 180 deg about its long axis
    for (let i = from; i < out.positions.length; i += 3) { out.positions[i] = -out.positions[i]; out.positions[i + 1] = LAMP_H + 1.2 - out.positions[i + 1]; out.normals[i] = -out.normals[i]; out.normals[i + 1] = -out.normals[i + 1] }
  })
}
