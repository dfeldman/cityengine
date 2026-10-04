/**
 * THE SEWARD STREET SLIDES (visitor joys; owner, 2026-10-03, with a photograph: "one of SF's weirdest landmarks. note
 * they are curved and have colorful metal. and the park is heavily wooded"). Seward Mini Park (1973), Seward Street up to
 * Corwin: two concrete chutes side by side, snaking down the hill in S-curves, their walls grey concrete rounded over;
 * hoops of painted steel tube — red, yellow, half-and-half — over the top and the bottom; a concrete path beside them
 * edged with red and yellow bollards; at the foot a sand pit with green stepping-stump seats and cardboard lying about;
 * thick planting and trees on both sides (a planting zone: data/zones `seward-mini-park`). OSM maps the park (way/138662530) and the Acme Alley steps, not the slides.
 *
 * DRAPED (the manifest's `drape`), built in half-metre lengths so it follows the hill. Local frame: the top on −z, the
 * foot on +z; the S-curve swings the chutes ±1.6 m across x.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const CONCRETE: Rgb = [0.5, 0.5, 0.46]
const POLISHED: Rgb = [0.58, 0.58, 0.55]
const PATH: Rgb = [0.66, 0.65, 0.62]
const RED: Rgb = [0.82, 0.12, 0.1]
const YELLOW: Rgb = [0.95, 0.8, 0.12]
const STUMP: Rgb = [0.18, 0.3, 0.22]
const SAND: Rgb = [0.78, 0.7, 0.52]
const CARDBOARD: Rgb = [0.62, 0.47, 0.3]

/** the slides' length, metres, each chute's width, the walls' */
const L = 26
const CHUTE = 0.7
const WALL = 0.16
/** where the chutes' middle line is across x, at z: an S-curve, straight at both ends */
const swing = (z: number): number => {
  const t = (z + L / 2) / L
  return 1.6 * Math.sin(t * Math.PI * 2) * Math.sin(t * Math.PI)
}

/** a hoop of steel tube over the chutes: up, round the top, down, each half its own colour */
function hoop(out: MeshBuilder, x: number, z: number, half: number, h: number, a: Rgb, b: Rgb): void {
  const N = 10
  for (let i = 0; i < N; i++) {
    const t0 = (i / N) * Math.PI, t1 = ((i + 1) / N) * Math.PI
    const p = (t: number): [number, number, number] => [x - Math.cos(t) * half, h - half + Math.sin(t) * half, z]
    strut(out, p(t0), p(t1), 0.07, 0.07, i < N / 2 ? a : b)
  }
  strut(out, [x - half, 0, z], [x - half, h - half, z], 0.07, 0.07, a)
  strut(out, [x + half, 0, z], [x + half, h - half, z], 0.07, 0.07, b)
}

export function sewardSlides(out: MeshBuilder, _fit: Fit): void {
  const stone = surfaceTag('concrete')
  const metal = surfaceTag('metal')
  const half = CHUTE + WALL * 1.5
  const STEP = 0.5
  // the two chutes and the path beside them, half a metre at a time along the curve
  for (let z = -L / 2; z < L / 2; z += STEP) {
    const zc = z + STEP / 2
    const x = swing(zc)
    box(out, x, 0.15, zc, half, 0.15, STEP / 2 + 0.02, CONCRETE, stone)
    for (const s of [-1, 1]) {
      box(out, x + s * (CHUTE / 2 + WALL / 4), 0.3, zc, CHUTE / 2 - WALL / 4, 0.01, STEP / 2 + 0.02, POLISHED, stone)
      // the outer walls, rounded over: a wall and a fat coping
      box(out, x + s * (half - WALL / 2), 0.55, zc, WALL / 2, 0.25, STEP / 2 + 0.02, CONCRETE, stone)
      box(out, x + s * (half - WALL / 2), 0.83, zc, WALL / 2 + 0.04, 0.05, STEP / 2 + 0.02, CONCRETE, stone)
    }
    box(out, x, 0.5, zc, WALL / 3, 0.2, STEP / 2 + 0.02, CONCRETE, stone)
    // the path, a metre and a half wide, a little way off to the east
    box(out, x + half + 1.3, 0.06, zc, 0.8, 0.06, STEP / 2 + 0.02, PATH, stone)
  }
  // the bollards along the path's far edge, red and yellow by turns
  for (let z = -L / 2 + 1, i = 0; z < L / 2 - 1; z += 2.6, i++) {
    prism(out, swing(z) + half + 2.35, z, 0, 1.0, 0.09, 8, i % 2 ? YELLOW : RED, metal)
  }
  // the hoops: three over the top, red and yellow; one half-and-half at the foot
  for (let k = 0; k < 3; k++) {
    const z = -L / 2 + 0.6 + k * 0.7
    hoop(out, swing(z), z, half + 0.15, 2.4, k === 1 ? YELLOW : RED, k === 1 ? YELLOW : RED)
  }
  hoop(out, swing(L / 2 - 0.5), L / 2 - 0.5, half + 0.2, 2.2, YELLOW, RED)
  // the top: a pad to sit down on, and the red rail across it
  box(out, swing(-L / 2), 0.2, -L / 2 - 1.2, half + 0.4, 0.2, 1.2, PATH, stone)
  strut(out, [swing(-L / 2) - half, 1.1, -L / 2 - 0.2], [swing(-L / 2) + half, 1.1, -L / 2 - 0.2], 0.06, 0.06, RED)
  // the foot: the chutes flatten out into the sand pit, the green stepping stumps beside it
  const fx = swing(L / 2)
  box(out, fx, 0.03, L / 2 + 3, half + 3, 0.03, 3, SAND, 0)
  for (const [dx, dz, h] of [[half + 1.2, 1.2, 0.5], [half + 1.9, 1.4, 0.7], [half + 1.5, 2.1, 0.35], [half + 2.4, 2.4, 0.9], [half + 2.6, 0.6, 0.5]] as const) {
    prism(out, fx + dx, L / 2 + dz, 0, h, 0.32, 10, STUMP, stone)
  }
  // cardboard, at the foot and halfway up
  box(out, fx - 1.4, 0.07, L / 2 + 3.4, 0.4, 0.01, 0.5, CARDBOARD, 0)
  box(out, fx + 0.6, 0.07, L / 2 + 4.6, 0.45, 0.01, 0.32, CARDBOARD, 0)
  box(out, swing(-2) - 0.4, 0.32, -2, 0.28, 0.01, 0.35, CARDBOARD, 0)
  // the slides, their path and the sand pit are a clearing in the woods
  out.grounds.push([{ x: -half - 2.2, z: -L / 2 - 2.6 }, { x: half + 3, z: -L / 2 - 2.6 }, { x: half + 3, z: L / 2 + 6 }, { x: -half - 3.5, z: L / 2 + 6 }])
  // (the woods are a planting zone, data/zones `seward-mini-park`: a deck here would not follow the hill)
}

export const SEWARD_SLIDES: Record<string, (out: MeshBuilder, fit: Fit) => void> = { sewardSlides }
