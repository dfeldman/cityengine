/**
 * PIER 39 (1978): the shopping pier's buildings — A to Q, Fog Harbor, the kiosks — built of timber salvaged from old
 * piers and left to weather: dark brown boards, a ground floor of shopfronts in heavy frames, an upper storey of small
 * windows and balconies, low hipped roofs of grey shingle. The bake drew them as a jumble of Victorians, brick lofts
 * and stucco flats (waterfront sweep, 2026-10-03). Mapillary 137588811859150.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing } from '../tower.ts'
import { edgeAt, railing } from '../parts.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const hash = (a: number, b: number): number => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h) }
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/*
 * The timber, weathered as it is (owner, 2026-10-17: "the pier 39 amusement park stuff needs a lot more work"; Commons
 * "Pier 39 (San Francisco) July 2022 (2)", "Pier 39 - San Francisco, CA - DSC03487"): silvered grey-brown boards on most,
 * a few painted pale butter-yellow or white with white trim. Chosen per building by its own outline, so it is stable.
 */
const SIDINGS: { wall: Rgb; upper: Rgb; trim: Rgb }[] = [
  { wall: [0.46, 0.41, 0.34], upper: [0.56, 0.51, 0.43], trim: [0.86, 0.84, 0.78] },
  { wall: [0.40, 0.36, 0.31], upper: [0.50, 0.46, 0.40], trim: [0.82, 0.80, 0.74] },
  { wall: [0.52, 0.47, 0.39], upper: [0.62, 0.57, 0.48], trim: [0.90, 0.88, 0.82] },
  { wall: [0.80, 0.74, 0.55], upper: [0.86, 0.80, 0.60], trim: [0.96, 0.95, 0.90] },
]
/** awning canvases: solid and the stripe's second colour */
const AWNINGS: [Rgb, Rgb][] = [
  [[0.16, 0.34, 0.62], [0.95, 0.95, 0.93]], [[0.74, 0.14, 0.14], [0.95, 0.95, 0.93]], [[0.12, 0.42, 0.30], [0.93, 0.88, 0.70]],
  [[0.88, 0.62, 0.14], [0.36, 0.20, 0.10]], [[0.16, 0.50, 0.66], [0.95, 0.95, 0.93]],
]

/**
 * PIER 39's shops: two storeys of weathered timber over a ground floor of glazed shopfronts; a deep, overhanging roof of
 * grey shingle with dormers; on the long sides an upper GALLERY — a plank deck on posts with a wooden railing, the walk
 * the second-floor shops open onto; and over the shopfronts a run of bright scalloped awnings. One storey for the kiosks.
 */
export function pier39Shop(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const seed = hash(fit.hx, fit.hz)
  const sd = SIDINGS[Math.floor(seed * SIDINGS.length) % SIDINGS.length]
  const two = (fit.height || 9) >= 7 && Math.min(fit.hx, fit.hz) > 3
  const G = 4.2, U = two ? 3.4 : 0, H = G + U
  const WT = surfaceTag('clapboard')
  tower(out, { ...fit, height: H }, {
    height: H,
    base: two ? { height: G, face: { kind: 'curtain', wall: sd.trim, glass: [0.2, 0.23, 0.25], pitch: 3.0, floor: G, material: 'glass' } } : undefined,
    tiers: [{ to: 1, face: two
      ? { kind: 'punched', wall: sd.upper, glass: [0.22, 0.24, 0.25], pitch: 2.4, floor: U, solid: 0.62, material: 'clapboard' }
      : { kind: 'curtain', wall: sd.trim, glass: [0.2, 0.23, 0.25], pitch: 3.0, floor: H, material: 'glass' } }],
    crown: { kind: 'hip', height: two ? 2.4 : 1.6, inset: -0.7, colour: [0.42, 0.39, 0.35], material: 'tile', dormers: two ? 2 : 0 },
  })
  // the timber between the shopfronts: a sill board and a fascia band round the whole ground floor
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 1) continue
    const ux = e.tx, uz = e.tz, nx = e.nx, nz = e.nz
    const at = (u: number, y: number, o: number): [number, number, number] => [e.a.x + ux * u + nx * o, y, e.a.z + uz * u + nz * o]
    for (const [y0, y1, c] of [[0, 0.5, sd.wall], [G - 0.55, G, sd.wall]] as [number, number, Rgb][]) {
      out.quad([at(0, y0, 0.06), at(e.L, y0, 0.06), at(e.L, y1, 0.06), at(0, y1, 0.06)], [nx, 0, nz], UVQ, c, WT)
    }
    // AWNINGS over the shopfronts, a bay at a time, on every wall long enough for a shop
    if (e.L >= 4) {
      const [solid, second] = AWNINGS[Math.floor(hash(e.mid.x, e.mid.z) * AWNINGS.length)]
      const striped = hash(e.mid.z, e.mid.x) > 0.45
      const n = Math.max(1, Math.round(e.L / 3.2)), bw = e.L / n
      for (let k = 0; k < n; k++) {
        if (hash(e.mid.x + k, e.mid.z - k) < 0.25) continue
        const u0 = k * bw + 0.2, u1 = (k + 1) * bw - 0.2
        const top = G - 0.65, low = G - 1.45, outw = 1.3
        const stripes = striped ? 6 : 1
        for (let s2 = 0; s2 < stripes; s2++) {
          const a0 = u0 + ((u1 - u0) * s2) / stripes, a1 = u0 + ((u1 - u0) * (s2 + 1)) / stripes
          const c = striped && s2 % 2 ? second : solid
          out.quad([at(a0, top, 0.05), at(a1, top, 0.05), at(a1, low, outw), at(a0, low, outw)], [nx * 0.6, 0.8, nz * 0.6], UVQ, c, WT)
          // the scalloped valance
          out.quad([at(a0, low, outw), at(a1, low, outw), at(a1, low - 0.28, outw), at(a0, low - 0.28, outw)], [nx, 0, nz], UVQ, c, WT)
        }
        // its two side cheeks
        for (const u of [u0, u1]) out.quad([at(u, top, 0.05), at(u, low, outw), at(u, low - 0.28, outw), at(u, low - 0.28, 0.05)], [ux, 0, uz], UVQ, solid, WT)
      }
    }
  }
  // the GALLERY on the long sides of a two-storey building: plank deck, posts to the boardwalk, wooden railing
  if (!two) return
  const order = ring.map((_, i) => i).filter((i) => edgeAt(ring, i).L >= 10).sort((p, q) => edgeAt(ring, q).L - edgeAt(ring, p).L).slice(0, 2)
  for (const i of order) {
    const e = edgeAt(ring, i)
    const D = 1.7
    const nx = e.nx, nz = e.nz, ux = e.tx, uz = e.tz
    const P = (u: number, o: number): { x: number; z: number } => ({ x: e.a.x + ux * u + nx * o, z: e.a.z + uz * u + nz * o })
    const q = (u: number, o: number, y: number): [number, number, number] => { const p = P(u, o); return [p.x, y, p.z] }
    out.quad([q(0.3, 0, G), q(e.L - 0.3, 0, G), q(e.L - 0.3, D, G), q(0.3, D, G)], [0, 1, 0], UVQ, [0.48, 0.42, 0.34], WT)
    out.quad([q(0.3, D, G - 0.25), q(e.L - 0.3, D, G - 0.25), q(e.L - 0.3, D, G), q(0.3, D, G)], [nx, 0, nz], UVQ, sd.wall, WT)
    out.quad([q(0.3, 0, G - 0.25), q(e.L - 0.3, 0, G - 0.25), q(e.L - 0.3, D, G - 0.25), q(0.3, D, G - 0.25)], [0, -1, 0], UVQ, [0.3, 0.27, 0.23], WT)
    railing(out, [P(0.3, D - 0.08), P(e.L - 0.3, D - 0.08)], G, { kind: 'posts', colour: [0.4, 0.34, 0.27], material: 'clapboard' })
    const posts = Math.max(2, Math.round(e.L / 3.5))
    for (let k = 0; k <= posts; k++) {
      const p = P(0.4 + ((e.L - 0.8) * k) / posts, D - 0.15)
      box(out, p.x, (G - 0.25) / 2, p.z, 0.11, (G - 0.25) / 2, 0.11, [0.38, 0.33, 0.27], WT)
    }
  }
}

/** FISH ALLEY's working sheds behind Jefferson Street (Pier 45 and the inner lagoon): one-storey corrugated metal,
 *  grey-green or rust, a roller door and a low roof — where the bake drew three-metre Victorians. */
export function fishAlleyShed(out: MeshBuilder, fit: Fit): void {
  const H = Math.max(3.5, Math.min(fit.height || 4, 6))
  const rust = (Math.round(fit.hx * 7 + fit.hz * 13) % 3) === 0
  const wall: [number, number, number] = rust ? [0.5, 0.32, 0.24] : [0.46, 0.5, 0.46]
  tower(out, { ...fit, height: H }, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'fins', wall, glass: [0.3, 0.32, 0.32], pitch: 4.5, solid: 0.45, depth: 0.08, floor: H, material: 'metal' } }],
    crown: { kind: 'hip', height: 1.0, inset: -0.4, colour: [0.52, 0.52, 0.5], material: 'metal' },
  })
}

export const PIER_39: Record<string, (out: MeshBuilder, fit: Fit) => void> = { pier39Shop, fishAlleyShed }
