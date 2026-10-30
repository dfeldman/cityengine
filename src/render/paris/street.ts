/**
 * Paris's street furniture beyond the fittings every region has (owner, 2026-10-29: "recreate the street feel with street
 * furniture"; "food and craft stands"): the litter hoop with its pale green bag, the glass bell, the Sanisette, the figures
 * on their plinths that stand all over the city, a street market's stalls, the crêpe and ice-cream stands and the Place du
 * Tertre's painters. Each along +z, its front to +x; placed by render/city.ts from the bake's furniture.
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, FIXED, prism, strut, type Rgb } from '../models.ts'

export const PARIS_STREET = new Set<string>(['litter', 'recycling', 'sanisette', 'statue', 'bust', 'sculpture', 'market', 'crepes', 'glaces', 'souvenirs', 'painter'])

const STONE: Rgb = [0.8, 0.77, 0.7]
const DARK_STONE: Rgb = [0.62, 0.6, 0.55]
const BRONZE: Rgb = [0.24, 0.28, 0.23]
const VERDIGRIS: Rgb = [0.34, 0.47, 0.41]
const MARBLE: Rgb = [0.88, 0.87, 0.83]

const picker = (seed: number): (() => number) => {
  let h = seed >>> 0
  return () => { h = (Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0; return h / 4294967296 }
}

/** the city's litter bin since 1995: a steel hoop on a post, holding a translucent green sack open to the air */
function litterHoop(out: MeshBuilder): void {
  const steel: Rgb = [0.2, 0.28, 0.24]
  box(out, 0, 0.5, -0.24, 0.022, 0.5, 0.022, steel, FIXED)
  prism(out, 0, 0, 0.92, 0.95, 0.225, 10, steel)
  prism(out, 0, 0, 0.3, 0.92, 0.13, 10, [0.62, 0.74, 0.55], FIXED, 0.21)
}

/** the glass bell (colonne à verre): a dark green drum, domed, with its round mouths; every so often a pair */
function glassBell(seed: number): (out: MeshBuilder) => void {
  return (out) => {
    const green: Rgb = [0.13, 0.27, 0.19]
    const n = seed % 4 === 0 ? 2 : 1
    for (let i = 0; i < n; i++) {
      const z = (i - (n - 1) / 2) * 1.7
      prism(out, 0, z, 0, 0.12, 0.76, 12, [0.28, 0.28, 0.27])
      prism(out, 0, z, 0.12, 1.45, 0.72, 12, green, FIXED, 0.66)
      prism(out, 0, z, 1.45, 1.75, 0.66, 12, green, FIXED, 0.28)
      for (const a of [Math.PI / 2, -Math.PI / 2]) box(out, Math.sin(a) * 0.7, 1.2, z + Math.cos(a) * 0.7, 0.02, 0.09, 0.09, [0.03, 0.03, 0.03], FIXED)
      box(out, 0.69, 0.72, z, 0.012, 0.22, 0.2, [0.86, 0.87, 0.82], FIXED)
    }
  }
}

/** the Sanisette: a rounded grey-green booth, a steel door in its long side, a roof that overhangs */
function sanisette(out: MeshBuilder): void {
  const body: Rgb = [0.42, 0.47, 0.44]
  const roof: Rgb = [0.25, 0.28, 0.27]
  box(out, 0, 1.25, 0, 1.05, 1.25, 1.45, body, FIXED)
  for (const z of [-1.45, 1.45]) prism(out, 0, z, 0, 2.5, 1.05, 12, body)
  box(out, 0, 2.58, 0, 1.15, 0.08, 1.55, roof, FIXED)
  for (const z of [-1.45, 1.45]) prism(out, 0, z, 2.5, 2.66, 1.15, 12, roof)
  box(out, 1.06, 1.05, 0.2, 0.02, 1.05, 0.5, [0.66, 0.68, 0.68], FIXED)
  box(out, 1.06, 2.25, 0.2, 0.02, 0.1, 0.5, [0.1, 0.25, 0.5], FIXED)
  box(out, 1.06, 2.25, 0.2, 0.024, 0.05, 0.36, [0.9, 0.9, 0.88], FIXED)
}

/** a standing figure on the plinth's top, of height `h`: the legs in a long coat, the arms, the head; one arm out, by seed */
function figure(out: MeshBuilder, y: number, h: number, c: Rgb, seed: number): void {
  const r = picker(seed)
  const stride = 0.07 * h
  for (const s of [-1, 1]) prism(out, 0, s * stride, y, y + h * 0.48, h * 0.055, 6, c, FIXED, h * 0.07)
  prism(out, 0, 0, y + h * 0.2, y + h * 0.56, h * 0.15, 8, c, FIXED, h * 0.115)   // the coat's skirt
  prism(out, 0, 0, y + h * 0.56, y + h * 0.82, h * 0.115, 8, c, FIXED, h * 0.125) // the chest and shoulders
  prism(out, 0, 0, y + h * 0.82, y + h * 0.87, h * 0.05, 6, c)                    // the neck
  prism(out, 0, 0, y + h * 0.87, y + h * 0.99, h * 0.065, 8, c, FIXED, h * 0.05)  // the head
  const sh = y + h * 0.79
  strut(out, [0, sh, -h * 0.13], [0.02 * h, y + h * 0.52, -h * 0.17], h * 0.05, h * 0.05, c)
  const pose = r()
  if (pose < 0.4) strut(out, [0, sh, h * 0.13], [h * 0.2, y + h * 0.98, h * 0.2], h * 0.05, h * 0.05, c)       // the arm raised
  else if (pose < 0.7) strut(out, [0, sh, h * 0.13], [h * 0.28, sh, h * 0.15], h * 0.05, h * 0.05, c)          // the arm out
  else strut(out, [0, sh, h * 0.13], [h * 0.02, y + h * 0.52, h * 0.17], h * 0.05, h * 0.05, c)                // at rest
}

function plinth(out: MeshBuilder, w: number, h: number, c: Rgb = STONE): void {
  prism(out, 0, 0, 0, 0.25, w * 1.35, 4, DARK_STONE)
  prism(out, 0, 0, 0.25, h - 0.15, w, 4, c)
  prism(out, 0, 0, h - 0.15, h, w * 1.15, 4, DARK_STONE)
}

function statue(seed: number): (out: MeshBuilder) => void {
  return (out) => {
    const r = picker(seed)
    const white = r() < 0.3
    const h = 2.1 + r() * 0.9
    const py = 1.6 + r() * 1.8
    plinth(out, 0.9 + r() * 0.3, py)
    figure(out, py, h, white ? MARBLE : r() < 0.35 ? VERDIGRIS : BRONZE, seed)
  }
}

function bust(seed: number): (out: MeshBuilder) => void {
  return (out) => {
    const c = seed % 3 === 0 ? MARBLE : BRONZE
    prism(out, 0, 0, 0, 0.2, 0.55, 4, DARK_STONE)
    prism(out, 0, 0, 0.2, 1.45, 0.3, 4, STONE, FIXED, 0.36)
    prism(out, 0, 0, 1.45, 1.55, 0.42, 4, DARK_STONE)
    prism(out, 0, 0, 1.55, 1.95, 0.27, 8, c, FIXED, 0.17)
    prism(out, 0, 0, 1.95, 2.05, 0.08, 6, c)
    prism(out, 0, 0, 2.05, 2.32, 0.13, 8, c, FIXED, 0.1)
  }
}

/** the modern kind the city is also full of: a stack of masses, a ring, or a leaning blade */
function sculpture(seed: number): (out: MeshBuilder) => void {
  return (out) => {
    const r = picker(seed)
    const c: Rgb = ([BRONZE, [0.56, 0.57, 0.58], MARBLE, [0.42, 0.26, 0.18], [0.72, 0.16, 0.12]] as Rgb[])[Math.floor(r() * 5)]
    prism(out, 0, 0, 0, 0.5, 1.0, 4, STONE)
    const kind = Math.floor(r() * 3)
    if (kind === 0) {
      let y = 0.5
      for (let i = 0; i < 3; i++) {
        const h = 0.6 + r() * 0.5
        const R = 0.3 + r() * 0.4
        prism(out, (r() - 0.5) * 0.2, (r() - 0.5) * 0.2, y, y + h, R, 8, c, FIXED, R * (0.6 + r() * 0.6))
        y += h
      }
    } else if (kind === 1) {
      const R = 1.1, n = 12
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2
        strut(out, [0, 0.5 + R + Math.cos(a) * R, Math.sin(a) * R], [0, 0.5 + R + Math.cos(b) * R, Math.sin(b) * R], 0.2, 0.2, c)
      }
    } else {
      strut(out, [0, 0.5, -0.35], [0.5, 3.4, 0.35], 0.5, 0.14, c)
      strut(out, [0, 0.5, 0.45], [-0.3, 2.3, 0.2], 0.3, 0.14, c)
    }
  }
}

const AWNINGS: [Rgb, Rgb][] = [[[0.14, 0.42, 0.24], [0.9, 0.9, 0.86]], [[0.72, 0.14, 0.12], [0.92, 0.9, 0.85]], [[0.14, 0.26, 0.5], [0.9, 0.9, 0.86]],
  [[0.86, 0.66, 0.14], [0.92, 0.9, 0.84]], [[0.82, 0.82, 0.8], [0.62, 0.64, 0.66]]]
const GOODS: Rgb[] = [[0.82, 0.22, 0.12], [0.9, 0.56, 0.12], [0.86, 0.76, 0.2], [0.36, 0.56, 0.18], [0.2, 0.42, 0.14], [0.56, 0.16, 0.3], [0.62, 0.42, 0.22], [0.88, 0.84, 0.7]]

/** a sloped canopy in stripes down the slope, 3 m along z, over x −1.1 (the high back) to 1.3 (the low front) */
function canopy(out: MeshBuilder, pair: [Rgb, Rgb], y: number): void {
  const n = 8
  const w = 3.1 / n
  for (let i = 0; i < n; i++) {
    const z = -1.55 + (i + 0.5) * w
    strut(out, [-1.1, y + 0.45, z], [1.3, y, z], w, 0.03, pair[i % 2])
    box(out, 1.31, y - 0.12, z, 0.01, 0.12, w / 2, pair[i % 2], FIXED)   // the valance
  }
}

/** one market stall: its poles, the trestle under a cloth, crates of whatever it sells, the striped canopy */
export function marketStall(seed: number): (out: MeshBuilder) => void {
  return (out) => {
    const r = picker(seed)
    const pole: Rgb = [0.3, 0.32, 0.33]
    for (const x of [-1.05, 1.25]) for (const z of [-1.45, 1.45]) box(out, x, x < 0 ? 1.3 : 1.1, z, 0.025, x < 0 ? 1.3 : 1.1, 0.025, pole, FIXED)
    box(out, 0.55, 0.4, 0, 0.5, 0.4, 1.4, [0.82, 0.8, 0.74], FIXED)
    box(out, 0.55, 0.82, 0, 0.56, 0.02, 1.45, [0.32, 0.26, 0.2], FIXED)
    for (let i = 0; i < 6; i++) {
      const z = -1.15 + i * 0.46
      for (const x of [0.28, 0.82]) {
        const c = GOODS[Math.floor(r() * GOODS.length)]
        box(out, x, 0.9, z, 0.22, 0.06, 0.2, [0.68, 0.54, 0.36], FIXED)
        box(out, x, 0.98, z, 0.19, 0.04, 0.17, c, FIXED)
      }
    }
    canopy(out, AWNINGS[Math.floor(r() * AWNINGS.length)], 2.15)
  }
}

/** a crêpe, ice-cream or souvenir stand: a little closed booth with a counter and a canopy; what it sells in the colours */
function stand(kind: 'crepes' | 'glaces' | 'souvenirs', seed: number): (out: MeshBuilder) => void {
  return (out) => {
    const r = picker(seed)
    const [body, trim]: [Rgb, Rgb] = kind === 'crepes' ? [[0.42, 0.14, 0.13], [0.86, 0.8, 0.62]]
      : kind === 'glaces' ? [[0.94, 0.86, 0.8], [0.84, 0.42, 0.52]]
      : [[0.14, 0.25, 0.42], [0.86, 0.84, 0.76]]
    box(out, -0.1, 1.15, 0, 1.0, 1.15, 1.45, body, FIXED)
    box(out, -0.1, 2.38, 0, 1.1, 0.08, 1.55, trim, FIXED)
    box(out, 0.95, 1.55, 0, 0.02, 0.5, 1.2, [0.16, 0.14, 0.12], FIXED)                 // the hatch
    box(out, 1.05, 1.02, 0, 0.12, 0.03, 1.3, trim, FIXED)                              // the counter
    box(out, -0.1, 2.68, 0, 0.9, 0.24, 0.02, trim, FIXED)                              // the sign on the roof
    canopy(out, kind === 'crepes' ? [[0.72, 0.14, 0.12], [0.92, 0.9, 0.85]] : kind === 'glaces' ? [[0.84, 0.42, 0.52], [0.94, 0.9, 0.85]] : [[0.14, 0.26, 0.5], [0.9, 0.9, 0.86]], 2.1)
    if (kind === 'souvenirs') {
      // the racks of little Eiffel Towers, cards and scarves out front
      for (const z of [-1.0, 0, 1.0]) {
        box(out, 1.6, 0.7, z, 0.02, 0.7, 0.3, [0.2, 0.2, 0.2], FIXED)
        for (let k = 0; k < 4; k++) box(out, 1.63, 0.35 + k * 0.28, z, 0.015, 0.11, 0.26, GOODS[Math.floor(r() * GOODS.length)], FIXED)
      }
    }
  }
}

/** a painter's pitch on the Place du Tertre: a parasol, an easel with its canvas, a stool, finished canvases leaning */
function painter(seed: number): (out: MeshBuilder) => void {
  return (out) => {
    const r = picker(seed)
    const wood: Rgb = [0.46, 0.34, 0.22]
    const pair = AWNINGS[Math.floor(r() * AWNINGS.length)]
    box(out, -0.5, 1.05, -0.5, 0.018, 1.05, 0.018, [0.75, 0.75, 0.74], FIXED)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      strut(out, [-0.5, 2.3, -0.5], [-0.5 + Math.sin(a) * 1.15, 1.95, -0.5 + Math.cos(a) * 1.15], 0.7, 0.02, pair[i % 2])
    }
    // the easel, its legs splayed
    for (const z of [-0.25, 0.25]) strut(out, [0.4, 0, z], [0.3, 1.6, 0], 0.03, 0.03, wood)
    strut(out, [0.05, 0, 0], [0.3, 1.6, 0], 0.03, 0.03, wood)
    box(out, 0.36, 1.15, 0, 0.012, 0.36, 0.3, [0.92, 0.9, 0.84], FIXED)
    for (let k = 0; k < 5; k++) box(out, 0.375, 0.95 + r() * 0.42, -0.22 + r() * 0.44, 0.005, 0.03 + r() * 0.06, 0.03 + r() * 0.07, GOODS[Math.floor(r() * GOODS.length)], FIXED)
    box(out, -0.15, 0.27, 0.1, 0.14, 0.02, 0.14, wood, FIXED)
    box(out, -0.15, 0.13, 0.1, 0.02, 0.13, 0.02, wood, FIXED)
    // the work for sale, on the ground against a rack
    for (let k = 0; k < 3; k++) {
      const c = GOODS[Math.floor(r() * GOODS.length)]
      box(out, -0.85, 0.3, 0.1 + k * 0.5, 0.012, 0.3, 0.2, [0.3, 0.22, 0.14], FIXED)
      box(out, -0.837, 0.3, 0.1 + k * 0.5, 0.004, 0.25, 0.16, c, FIXED)
    }
  }
}

export function parisStreetModel(kind: string, seed: number): ((out: MeshBuilder) => void) | null {
  switch (kind) {
    case 'litter': return litterHoop
    case 'recycling': return glassBell(seed)
    case 'sanisette': return sanisette
    case 'statue': return statue(seed)
    case 'bust': return bust(seed)
    case 'sculpture': return sculpture(seed)
    case 'crepes': case 'glaces': case 'souvenirs': return stand(kind, seed)
    case 'painter': return painter(seed)
  }
  return null
}
