/**
 * The parks' small structures (Batch 1, 2026-10-31; docs/landmarks/PARIS-BATCHES.md; the planting is tools/gardens/paris-parks.ts): what a rider notices in an
 * English park besides the trees. Each says what it was read from. Local frames: front −z (the manifest's `front` turns it); nothing here but a short wall
 * is a building. Monceau's gates, pyramid, arcade and bridge; the Buttes' grotto; Montsouris's cascade and the Mire du Sud; Citroën's balloon and jets; Bercy's
 * rails; Brassens's belfry and bulls; the Gloriette de Buffon; Ranelagh's bandstand and carousel.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { strut } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { beam, block, box, dome, hex, lathe, prism, roof, rotated, shade, type Rgb } from '../../kit.ts'
import { MeshBuilder as MB } from '../../../buildings.ts'
import { arcade, archRing } from '../palaces/common.ts'

const STONE = hex('#d9cfba'), STONE_DK = shade(STONE, 0.82), IRON = hex('#1d2124'), GILT: Rgb = [0.84, 0.66, 0.24]
const ROCK = hex('#9a9284'), ROCK_DK = shade(ROCK, 0.72)
const WATER: Rgb = [0.3, 0.4, 0.42]
const ash = surfaceTag('ashlar')
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const groundOf = (fit: Fit) => (x: number, z: number): number => fit.groundAt?.(x, z) ?? fit.grade ?? 0
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

/* ---------------------------------------------------------------------------------------- Monceau's gilded gates */

/**
 * The gates of the Parc Monceau (Davioud, 1861): tall black iron, every spear gilded, the leaves standing open against the side screens, either side of stone
 * piers with their lanterns (Wikipedia fr "Parc Monceau" and Commons' category; the park's whole silhouette from the avenues). `front` to the avenue.
 */
function parkGate(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  const W = Math.max(6, fit.hx - 8) // half the opening, what the walk needs, then 8 m of screen each side
  for (const s of [-1, 1]) {
    block(out, s * W - 0.65, s * W + 0.65, -0.65, 0.65, y, y + 4.6, STONE)
    block(out, s * W - 0.8, s * W + 0.8, -0.8, 0.8, y + 4.6, y + 4.95, shade(STONE, 1.06))
    // the lantern on its pier
    prism(out, s * W, 0, y + 4.95, y + 5.5, 0.12, 6, IRON, 0)
    prism(out, s * W, 0, y + 5.5, y + 6.2, 0.3, 6, [0.85, 0.82, 0.68], surfaceTag('glass'), 0.38)
    prism(out, s * W, 0, y + 6.2, y + 6.5, 0.42, 6, GILT, surfaceTag('metal'), 0.05)
    // the side screen, out from the pier, with its gilded spears
    for (let k = 0; k <= 22; k++) {
      const x = s * (W + 0.75 + (k * 7.25) / 22)
      const tall = k % 4 === 0
      block(out, x - 0.035, x + 0.035, -0.035, 0.035, y + 0.45, y + (tall ? 3.8 : 3.3), IRON)
      if (tall) block(out, x - 0.05, x + 0.05, -0.05, 0.05, y + 3.8, y + 4.05, GILT)
      else block(out, x - 0.035, x + 0.035, -0.035, 0.035, y + 3.3, y + 3.48, GILT)
    }
    block(out, s * W, s * (W + 8), -0.3, 0.3, y, y + 0.45, STONE_DK)
    block(out, Math.min(s * (W + 0.7), s * (W + 8)), Math.max(s * (W + 0.7), s * (W + 8)), -0.05, 0.05, y + 2.9, y + 3.02, GILT)
    block(out, Math.min(s * (W + 0.7), s * (W + 8)), Math.max(s * (W + 0.7), s * (W + 8)), -0.05, 0.05, y + 0.65, y + 0.75, IRON)
    // the leaf, folded back on the avenue side at right angles
    for (let k = 0; k <= 10; k++) {
      const z = -0.7 - (k * 2.6) / 10
      block(out, s * W - 0.03, s * W + 0.03, z - 0.03, z + 0.03, y + 0.15, y + 3.6, IRON)
      block(out, s * W - 0.04, s * W + 0.04, z - 0.04, z + 0.04, y + 3.6, y + 3.82, GILT)
    }
    block(out, s * W - 0.04, s * W + 0.04, -3.3, -0.7, y + 3.0, y + 3.12, GILT)
  }
}

/* ---------------------------------------------------------------------------------------------- Monceau's follies */

/** The little Egyptian pyramid of the Duc de Chartres's folie (OSM way/757659087, `historic=tomb`, 7 m square), its door on the walk's side. */
export function monceauPyramid(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, hx = Math.min(fit.hx, 3.6), hz = Math.min(fit.hz, 3.6)
  block(out, -hx, hx, -hz, hz, y - 0.4, y + 0.3, STONE_DK)
  roof(out, -hx + 0.25, hx - 0.25, -hz + 0.25, hz - 0.25, y + 0.3, 6.6, hx - 0.25, hz - 0.25, hex('#bfb6a3'))
  block(out, -0.55, 0.55, -hz + 0.05, -hz + 0.5, y + 0.3, y + 2.1, hex('#2a2926'))
  block(out, -0.8, 0.8, -hz - 0.02, -hz + 0.5, y + 2.1, y + 2.4, STONE)
}

/**
 * The Renaissance arcade by the Petite Rivière: one bay of the old Hôtel de Ville, burned in 1871 and set up here (Commons, "Arcade Renaissance, Parc Monceau").
 * A round arch between pilasters on plinths, its frieze and open pediment, standing alone in the shrubs, so both faces. Placed from memory of the pool's side.
 */
export function monceauArcade(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  const q = new MB()
  arcade(q, -0.5, -4.2, 4.2, y, y + 7.2, [0], 4.6, 5.7, 0.5, STONE, STONE_DK, null)
  archRing(q, -0.5, 0, y + 3.4, 2.3, 2.75, 0.18, shade(STONE, 1.05))
  for (const x of [-3.5, 3.5]) {
    block(q, x - 0.5, x + 0.5, -0.8, -0.5, y, y + 0.9, STONE_DK)
    block(q, x - 0.36, x + 0.36, -0.75, -0.5, y + 0.9, y + 6.4, shade(STONE, 1.03))
    block(q, x - 0.5, x + 0.5, -0.85, -0.5, y + 6.1, y + 6.5, shade(STONE, 1.06))
  }
  block(q, -4.5, 4.5, -0.9, -0.5, y + 6.5, y + 7.2, shade(STONE, 1.06))
  rotated(out, q, 0)
  rotated(out, q, Math.PI)
  block(out, -4.2, 4.2, -0.5, 0.5, y + 7.2, y + 7.5, STONE)
  // (the pediment, broken over the arch: two raking lengths and a gilded nothing, an urn)
  for (const s of [-1, 1]) strut(out, [s * 4.2, y + 7.65, 0], [s * 1.1, y + 8.9, 0], 0.5, 0.3, shade(STONE, 1.04), ash)
  prism(out, 0, 0, y + 7.5, y + 9.2, 0.3, 8, STONE, ash, 0.14)
}

/** The park's humped stone bridge over the Petite Rivière: a little rustic span with balustrades, `front` along the stream. Its place is read off OSM's path crossing the water, its look from memory. */
export function monceauBridge(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, L = 8, W = 1.6
  const at = (t: number): [number, number] => [t * L, y + 1.5 * (1 - t * t)]
  const n = 10
  for (let i = 0; i < n; i++) {
    const [x0, y0] = at((i / n) * 2 - 1), [x1, y1] = at(((i + 1) / n) * 2 - 1)
    const nn: [number, number, number] = [-(y1 - y0), x1 - x0, 0]
    out.quad([[x0, y0, W], [x1, y1, W], [x1, y1, -W], [x0, y0, -W]], nn, UVQ, hex('#b9b0a0'), ash)
    for (const s of [-1, 1]) {
      // the spandrel down to the water, and the parapet on it
      out.quad([[x0, y - 0.4, s * W], [x1, y - 0.4, s * W], [x1, y1, s * W], [x0, y0, s * W]], [0, 0, s], UVQ, STONE_DK, ash)
      strut(out, [x0, y0 + 0.75, s * W], [x1, y1 + 0.75, s * W], 0.3, 0.16, STONE, ash)
      block(out, x0 - 0.1, x0 + 0.1, s * W - 0.1, s * W + 0.1, y0, y0 + 0.7, STONE)
    }
  }
  // the arch's dark eye under it
  prism(out, 0, 0, y - 0.3, y + 0.05, 0.1, 4, STONE_DK, ash)
  for (const s of [-1, 1]) {
    for (let k = 0; k < 8; k++) {
      const a0 = (k / 8) * Math.PI, a1 = ((k + 1) / 8) * Math.PI
      out.quad([[Math.cos(a0) * 3.1, y - 0.35 + Math.sin(a0) * 1.15, s * (W + 0.03)], [Math.cos(a1) * 3.1, y - 0.35 + Math.sin(a1) * 1.15, s * (W + 0.03)],
        [Math.cos(a1) * 3.1, y - 0.35, s * (W + 0.03)], [Math.cos(a0) * 3.1, y - 0.35, s * (W + 0.03)]], [0, 0, s], UVQ, hex('#23282a'), 0)
    }
  }
}

/* -------------------------------------------------------------------------------------------- rocks and cascades */

/** a piece of rockwork: a lump with `n` corners and three bands, irregular and the same every time */
function rock(out: MeshBuilder, cx: number, cz: number, y0: number, h: number, r: number, seed: number, c: Rgb = ROCK): void {
  const n = 7, bands = [0, 0.4, 0.8, 1], tag = surfaceTag('rock')
  const R = (k: number, b: number): [number, number, number] => {
    const a = ((k % n) / n) * Math.PI * 2 + seed
    const m = (1 - bands[b] * 0.72) * (0.74 + hash(seed + (k % n), b + seed) * 0.5)
    return [cx + Math.cos(a) * r * m, y0 + bands[b] * h, cz + Math.sin(a) * r * m]
  }
  for (let b = 0; b + 1 < bands.length; b++) {
    for (let k = 0; k < n; k++) {
      const a = R(k, b), d = R(k + 1, b), e = R(k + 1, b + 1), f = R(k, b + 1)
      const nx = Math.cos(((k + 0.5) / n) * Math.PI * 2 + seed), nz = Math.sin(((k + 0.5) / n) * Math.PI * 2 + seed)
      out.quad([d, a, f, e], [nx, 0.45, nz], UVQ, shade(c, 0.86 + hash(k, b + seed) * 0.26), tag)
    }
  }
  const tops = Array.from({ length: n }, (_, k) => R(k, bands.length - 1))
  for (let k = 1; k + 1 < n; k++) out.quad([tops[0], tops[k + 1], tops[k], tops[k]], [0, 1, 0], UVQ, shade(c, 1.02), tag)
}

/** a waterfall: a pale sheet of it from y1 to y0 at z, x0..x1, and its splash */
function fall(out: MeshBuilder, x0: number, x1: number, z: number, y0: number, y1: number): void {
  out.water.push({ kind: 'sheet', a: [x0, y1, z], b: [x1, y1, z], out: 0.35, drop: y1 - y0 })
  out.water.push({ kind: 'splash', at: [(x0 + x1) / 2, y0, z - 0.6], r: Math.max(1.4, (x1 - x0) * 0.5) })
}

/**
 * The GROTTE of the Buttes-Chaumont and its Grande Cascade (Alphand and Combaz, 1867; OSM's way/125420680, `natural=cave`, and way/125420674, `waterway=waterfall`):
 * the artificial cave under the rock, 20 m high, the stream falling through its roof. From a walk outside, the thing is a rock face with a dark mouth, pale water
 * falling in its depth, its stalactites of cement in the mouth's head. `front` to the path in front of the mouth. The Grande Cascade's own stream runs on to the lake.
 */
export function buttesGrotto(out: MeshBuilder, fit: Fit): void {
  const y = (fit.grade ?? 0) - 0.5, D: Rgb = hex('#191c1c')
  // the dark back of the cave
  block(out, -6, 6, 1.5, 3, y, y + 11, D)
  // the rock either side and over the mouth, in lumps
  for (let i = 0; i < 14; i++) {
    const a = (i / 13) * Math.PI
    const x = Math.cos(a) * 9.5, h = 4 + Math.sin(a) * 9
    rock(out, x, -1 + hash(i, 1) * 2, y + Math.sin(a) * 6.5, h, 3.4 + hash(i, 2) * 1.8, i * 1.7)
    rock(out, x * 1.2, 4 + hash(i, 3) * 3, y, 8 + Math.sin(a) * 9, 5 + hash(i, 4) * 2, i * 2.3, ROCK_DK)
  }
  // the stalactites in the mouth's head
  for (let i = 0; i < 9; i++) {
    const x = -4.6 + (i * 9.2) / 8
    prism(out, x, 0.5 + hash(i, 5) * 1.2, y + 7.8 + Math.cos(x * 0.3) * 2 - 1.8 - hash(i, 6) * 1.5, y + 7.8 + Math.cos(x * 0.3) * 2, 0.06, 5, ROCK, surfaceTag('rock'), 0.45)
  }
  // the fall, inside the mouth, and the pool it falls to
  fall(out, -1.8, 1.8, 1.2, y + 0.3, y + 10)
  out.water.push({ kind: 'pool', ring: Array.from({ length: 10 }, (_, k) => ({ x: Math.cos((k / 10) * Math.PI * 2) * 5, z: 0.5 + Math.sin((k / 10) * Math.PI * 2) * 3 })), y: y + 0.32, colour: WATER })
}

/** The cascade at the head of the Parc Montsouris's lake (OSM node/9176469533): the same rockwork, smaller, a thin fall over it into the stream. `front` to the path. */
export function montsourisCascade(out: MeshBuilder, fit: Fit): void {
  const y = (fit.grade ?? 0) - 0.3
  for (let i = 0; i < 9; i++) {
    const x = -6 + (i * 12) / 8
    rock(out, x, 1.5 + hash(i, 1) * 2, y, 3 + hash(i, 2) * 3.5 - Math.abs(x) * 0.2, 2.6 + hash(i, 3), i * 1.3)
  }
  fall(out, -1.2, 1.2, 0.3, y + 0.25, y + 4.6)
  out.water.push({ kind: 'pool', ring: Array.from({ length: 10 }, (_, k) => ({ x: Math.cos((k / 10) * Math.PI * 2) * 3.8, z: -1.5 + Math.sin((k / 10) * Math.PI * 2) * 2.4 })), y: y + 0.28, colour: WATER })
}

/** The MIRE DU SUD (Cassini's meridian mark, 1806, OSM node/3588040118): a slim stone stele on a stepped base with the slot for the Observatoire's telescope. */
export function mireDuSud(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  block(out, -0.85, 0.85, -0.85, 0.85, y - 0.2, y + 0.35, STONE_DK)
  block(out, -0.6, 0.6, -0.6, 0.6, y + 0.35, y + 0.8, STONE)
  block(out, -0.32, 0.32, -0.32, 0.32, y + 0.8, y + 4.2, STONE)
  block(out, -0.42, 0.42, -0.42, 0.42, y + 4.2, y + 4.4, shade(STONE, 1.05))
  block(out, -0.3, 0.3, -0.3, 0.3, y + 4.4, y + 4.8, STONE)
  block(out, -0.1, 0.1, -0.34, -0.3, y + 3.4, y + 4.1, hex('#2b2c2b'))
  roof(out, -0.3, 0.3, -0.3, 0.3, y + 4.8, 0.45, 0.3, 0.3, STONE_DK)
}

/* ------------------------------------------------------------------------------------------------- Citroën's two */

/**
 * The BALLON DE PARIS (Aérophile, since 1999), the white ball on the lawn's west end in IGN's photograph, 22 m across: it rises on its cable for most of the day,
 * and every picture has it high or moored: moored here, on its round pad with the ring gondola under it. Its net in lines of latitude and longitude.
 */
export function citroenBallon(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  const R = 11, c = y + 15.5, BAL: Rgb = hex('#efece2'), N = 14
  prism(out, 0, 0, y, y + 0.25, 11, 28, hex('#b7b2a6'), surfaceTag('concrete'))
  const prof: [number, number][] = Array.from({ length: N + 1 }, (_, k) => {
    const a = -Math.PI / 2 + (k / N) * Math.PI
    return [Math.max(0.02, Math.cos(a) * R), c + Math.sin(a) * R]
  })
  lathe(out, 0, 0, prof, 22, BAL, 0)
  // the net: lines of longitude as thin ribs and two rings
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    for (let k = 2; k < N - 1; k += 2) {
      const [r0, y0] = prof[k], [r1, y1] = prof[k + 2 > N ? N : k + 2]
      beam(out, [Math.sin(a) * (r0 + 0.04), y0, Math.cos(a) * (r0 + 0.04)], [Math.sin(a) * (r1 + 0.04), y1, Math.cos(a) * (r1 + 0.04)], 0.04, hex('#55595c'))
    }
  }
  // the gondola: a steel ring, its rail and its load lines
  prism(out, 0, 0, y + 0.3, y + 1.1, 3.1, 16, hex('#3a4a55'), surfaceTag('metal'))
  prism(out, 0, 0, y + 1.1, y + 2.1, 3.1, 16, hex('#6f7d86'), surfaceTag('glass'), 3.1, false)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    beam(out, [Math.sin(a) * 3, y + 2.1, Math.cos(a) * 3], [Math.sin(a) * 2.2, c - R + 0.4, Math.cos(a) * 2.2], 0.03, IRON)
  }
}

/**
 * The FONTAINE of the Parc André-Citroën: the esplanade's grid of jets between the two great greenhouses (IGN's photograph, 48.8406 2.2763), set in the slope of a
 * tilted paved square so they play across it, and children run through it. Local x along the grid's long side; a low kerb round it. `front` turns it to the lawn's axis.
 */
export function citroenJets(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, hx = 24, hz = 15
  const G = (x: number): number => y + 0.1 + ((x + hx) / (2 * hx)) * 0.7
  const P = hex('#d6d0c1')
  out.quad([[-hx, G(-hx), -hz], [hx, G(hx), -hz], [hx, G(hx), hz], [-hx, G(-hx), hz]], [0, 1, 0], UVQ, P, surfaceTag('concrete'))
  for (const s of [-1, 1]) {
    out.quad([[-hx, G(-hx), s * hz], [hx, G(hx), s * hz], [hx, y - 0.2, s * hz], [-hx, y - 0.2, s * hz]], [0, 0, s], UVQ, shade(P, 0.86), surfaceTag('concrete'))
  }
  out.quad([[hx, G(hx), -hz], [hx, G(hx), hz], [hx, y - 0.2, hz], [hx, y - 0.2, -hz]], [1, 0, 0], UVQ, shade(P, 0.86), surfaceTag('concrete'))
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 6; j++) {
      const x = -20 + (i * 40) / 8, z = -12 + (j * 24) / 5
      const h = 1.8 + ((i * 3 + j * 5) % 7) * 0.55
      out.water.push({ kind: 'jet', at: [x, G(x) + 0.02, z], v: [0, Math.sqrt(2 * 9.81 * h), 0], width: 0.09, spread: 0.2 })
      block(out, x - 0.16, x + 0.16, z - 0.16, z + 0.16, G(x), G(x) + 0.03, hex('#51565a'))
    }
  }
}

/* ------------------------------------------------------------------------------------------------ Bercy's old rails */

/**
 * THE WINE LANES' RAILS (Parc de Bercy: "the old wine cobbles and rails"): OSM has the warehouse lanes' surface in cobbles, and the game draws cobbles: what is left
 * is the rail, a pair at 1.435 m let into the lane the barrels came down. Lines in x east, z north about the entry's point (front 180), each read off OSM's ways
 * 94434–39, 94495–500 and 94780–83. A hand's height over the path, its own thin colour.
 */
const BERCY_LANES: [number, number][][] = [
  [[-49, 37], [-67, 54], [-85, 70], [-104, 86], [-123, 101], [-146, 128], [-154, 138]],
  [[-94, 177], [-76, 158], [-66, 148], [-58, 140], [-32, 113], [2, 79], [35, 43]],
  [[-170, 158], [-136, 190], [-117, 209], [-102, 222], [-74, 250]],
]
export function bercyRails(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit), RAIL = hex('#5b5046'), met = surfaceTag('metal')
  // (the entry stands at (−60, 140) of tools/gardens/paris-parks.ts's origin; these are about that origin)
  const O = { x: -60, z: 140 }
  for (const lane of BERCY_LANES) {
    for (let i = 0; i + 1 < lane.length; i++) {
      const [ax, az] = lane[i], [bx, bz] = lane[i + 1]
      const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 6))
      const ux = (bx - ax) / L, uz = (bz - az) / L
      for (let k = 0; k < n; k++) {
        const x0 = ax + (ux * L * k) / n - O.x, z0 = az + (uz * L * k) / n - O.z
        const x1 = ax + (ux * L * (k + 1)) / n - O.x, z1 = az + (uz * L * (k + 1)) / n - O.z
        for (const s of [-0.72, 0.72]) {
          const a: [number, number, number] = [x0 - uz * s, G(x0, z0) + 0.2, z0 + ux * s], b: [number, number, number] = [x1 - uz * s, G(x1, z1) + 0.2, z1 + ux * s]
          strut(out, a, b, 0.09, 0.05, RAIL, met)
        }
      }
    }
  }
}

/* ----------------------------------------------------------------------------------------- Brassens's belfry and bulls */

/**
 * The BEFFROI of the Vaugirard horse market (1897, OSM way/1035080632, 7 m square, on the auction pavilion way/53724046, 18 × 11 m): a brick-and-stone clock tower over
 * the long low hall where the horses were sold, slate spire, its back to the pool. −z toward the esplanade. Height from Commons' pictures and its neighbours, about 22 m.
 */
export function brassensBelfry(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  const BR = hex('#a65a3e'), brick = surfaceTag('brick'), SL = hex('#454c52'), GL = hex('#26292b')
  // the auction hall
  const q = (x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, c: Rgb, t: number): void => box(out, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, c, t)
  q(-9, 9, -5.5, 5.5, y, y + 5.5, BR, brick)
  block(out, -9.25, 9.25, -5.75, 5.75, y + 5.3, y + 5.7, STONE)
  roof(out, -9.3, 9.3, -5.8, 5.8, y + 5.7, 2.6, 5.8, 5.8, SL)
  for (const x of [-6.6, -2.2, 2.2, 6.6]) {
    for (const s of [-1, 1]) {
      block(out, x - 0.95, x + 0.95, s * 5.5 - 0.05, s * 5.5 + 0.05, y + 1.1, y + 4.2, shade(STONE, 1.03))
      block(out, x - 0.7, x + 0.7, s * 5.5 - 0.08, s * 5.5 + 0.08, y + 1.3, y + 4.0, GL)
    }
  }
  // the tower
  const R = 2.3, T = y + 17
  q(-R, R, -R, R, y, T, BR, brick)
  for (const h of [5.8, 10.5, T - y - 0.3]) block(out, -R - 0.14, R + 0.14, -R - 0.14, R + 0.14, y + h - 0.2, y + h + 0.2, STONE)
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) block(out, sx * R - 0.22, sx * R + 0.22, sz * R - 0.22, sz * R + 0.22, y, T, STONE)
  for (const f of [0, 1, 2, 3]) {
    const a = (f / 4) * Math.PI * 2, sn = Math.sin(a), cs = Math.cos(a)
    const P = (u: number, h: number, d = 0.06): [number, number, number] => [sn * (R + d) + cs * u, y + h, cs * (R + d) - sn * u]
    out.quad([P(-0.55, 11.3), P(0.55, 11.3), P(0.55, 13.6), P(-0.55, 13.6)], [sn, 0, cs], UVQ, GL, 0)
    // the clock
    for (let k = 0; k < 14; k++) {
      const t0 = (k / 14) * Math.PI * 2, t1 = ((k + 1) / 14) * Math.PI * 2
      out.quad([P(0, 15.1), P(Math.cos(t0) * 1.2, 15.1 + Math.sin(t0) * 1.2), P(Math.cos(t1) * 1.2, 15.1 + Math.sin(t1) * 1.2), P(0, 15.1)], [sn, 0, cs], UVQ, [0.93, 0.91, 0.84], 0)
    }
    const H = (h0: number, h1: number, u: number): void => out.quad([P(-0.05 + u, h0, 0.1), P(0.05 + u, h0, 0.1), P(0.05 + u, h1, 0.1), P(-0.05 + u, h1, 0.1)], [sn, 0, cs], UVQ, IRON, 0)
    H(15.1, 15.95, 0)
    H(14.5, 15.1, 0.08)
  }
  roof(out, -R - 0.3, R + 0.3, -R - 0.3, R + 0.3, T, 4.8, R + 0.3, R + 0.3, SL)
  prism(out, 0, 0, T + 4.6, T + 6.2, 0.05, 6, IRON, 0)
}

/**
 * LES TAUREAUX (Auguste Cain, 1878 Exposition; given to the horse market's gate, OSM's ways 80146212 and 80146226, each 4 × 3 m "buildings"): a bronze bull each on
 * a stone plinth at the Rue des Morillons gate. A STAND-IN for Tripo (docs/landmarks/PARIS-TRIPO-NOTES.md): the mass and the horns. −z to where it looks.
 */
function bull(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, BZ = hex('#3a4238'), P = y + 1.5, cop = surfaceTag('copper')
  block(out, -1.8, 1.8, -1, 1, y, y + 1.4, STONE)
  block(out, -1.95, 1.95, -1.15, 1.15, y + 1.4, y + 1.5, shade(STONE, 1.05))
  // the barrel, its hump, and its neck forward (local −x), legs under it
  const seg = (a: [number, number, number], b: [number, number, number], w: number, h: number): void => strut(out, a, b, w, h, BZ, cop)
  seg([-0.4, P + 1.25, 0], [1.15, P + 1.15, 0], 0.95, 1.05)
  seg([-1, P + 1.5, 0], [-0.2, P + 1.45, 0], 0.95, 1.12)
  seg([-1, P + 1.5, 0], [-1.55, P + 1.15, 0], 0.68, 0.72)
  box(out, -1.72, P + 1, 0, 0.26, 0.28, 0.24, BZ, cop)
  for (const s of [-1, 1]) {
    seg([-1.6, P + 1.28, s * 0.22], [-1.72, P + 1.5, s * 0.5], 0.09, 0.09)
    seg([-1.72, P + 1.5, s * 0.5], [-1.92, P + 1.68, s * 0.38], 0.06, 0.06)
    seg([-0.8, P + 0.9, s * 0.32], [-0.75, P, s * 0.32], 0.19, 0.22)
    seg([1, P + 0.75, s * 0.33], [1.05, P, s * 0.33], 0.2, 0.25)
  }
  seg([1.55, P + 1.5, 0], [1.75, P + 0.65, 0.05], 0.06, 0.06)
}

/* ---------------------------------------------------------------------------------------------------- small pavilions */

/**
 * The GLORIETTE DE BUFFON (Verniquet, 1788, OSM way/1039573855; said to be the oldest metal structure in Paris) at the top of the Grand Labyrinthe: a little round temple
 * in iron and bronze, thin colonnettes on a stone plinth, the dome on them, a gilded sphere with its sundial on top (Commons' category).
 */
export function gloriette(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, R = 2.15, BRZ = hex('#3c4639'), cop = surfaceTag('copper')
  prism(out, 0, 0, y - 0.3, y + 0.3, R + 0.8, 16, STONE_DK, ash)
  prism(out, 0, 0, y + 0.3, y + 0.6, R + 0.35, 16, STONE, ash)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, x = Math.sin(a) * R, z = Math.cos(a) * R
    prism(out, x, z, y + 0.6, y + 4.3, 0.09, 6, BRZ, cop, 0.07)
    prism(out, x, z, y + 3.95, y + 4.3, 0.09, 6, GILT, surfaceTag('metal'), 0.17)
    for (const h of [1.2]) beam(out, [x, y + h, z], [Math.sin(a + Math.PI / 4) * R, y + h, Math.cos(a + Math.PI / 4) * R], 0.02, BRZ)
  }
  prism(out, 0, 0, y + 4.3, y + 4.75, R + 0.2, 16, BRZ, cop)
  dome(out, 0, 0, y + 4.75, R + 0.05, 1.9, BRZ)
  prism(out, 0, 0, y + 6.6, y + 7.05, 0.07, 6, IRON, 0)
  lathe(out, 0, 0, [[0.02, y + 7], [0.2, y + 7.08], [0.28, y + 7.25], [0.2, y + 7.42], [0.02, y + 7.5]], 10, GILT, surfaceTag('metal'))
}

/**
 * The bandstand on the Ranelagh's lawn (OSM way/158177310, `historic=bandstand`, 8 m): eight thin iron posts on a stone plinth with a railing, a pale zinc roof to a finial,
 * the eaves' frieze. The Second Empire's standard kiosk: Davioud's.
 */
export function ranelaghKiosk(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, R = 3.7, GR = hex('#2f4a3a'), ZN = hex('#8f989b')
  prism(out, 0, 0, y - 0.2, y + 1, R + 0.25, 8, STONE, ash)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8, x = Math.sin(a) * R, z = Math.cos(a) * R
    const b = a + Math.PI / 4, x2 = Math.sin(b) * R, z2 = Math.cos(b) * R
    prism(out, x, z, y + 1, y + 4.2, 0.08, 6, GR, surfaceTag('metal'))
    beam(out, [x, y + 1.9, z], [x2, y + 1.9, z2], 0.03, GR)
    beam(out, [x, y + 4.15, z], [x2, y + 4.15, z2], 0.06, GR)
    for (let k = 1; k < 5; k++) {
      const t = k / 5
      block(out, x + (x2 - x) * t - 0.02, x + (x2 - x) * t + 0.02, z + (z2 - z) * t - 0.02, z + (z2 - z) * t + 0.02, y + 1, y + 1.9, GR)
    }
  }
  prism(out, 0, 0, y + 4.2, y + 5.9, R + 0.6, 8, ZN, surfaceTag('metal'), 0.5)
  prism(out, 0, 0, y + 5.9, y + 6.7, 0.5, 8, ZN, surfaceTag('metal'), 0.04)
}

/**
 * The Ranelagh's CAROUSEL (hand-cranked, 1875ish, the children's rings game: "the oldest in Paris"), by the playground: a little striped canopy on its pole, a ring of wooden horses
 * at a hand's reach. Its place is by memory, inside OSM's playground way/158178015; street view would settle it.
 */
export function ranelaghManege(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, R = 3.8, W = hex('#c79a5e'), RED = hex('#a23a30'), CR = hex('#ece4cf'), pl = surfaceTag('planks')
  prism(out, 0, 0, y, y + 0.32, R + 0.2, 12, hex('#6b5a44'), pl)
  prism(out, 0, 0, y + 0.3, y + 3.8, 0.3, 8, CR, 0)
  const n = 12
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, c = i % 2 ? RED : CR
    const P = (a: number, r: number, h: number): [number, number, number] => [Math.sin(a) * r, y + h, Math.cos(a) * r]
    const am = (a0 + a1) / 2
    out.quad([P(a1, R + 0.4, 3.1), P(a0, R + 0.4, 3.1), P(a0, 0.1, 4.7), P(a1, 0.1, 4.7)], [Math.sin(am) * 0.4, 0.9, Math.cos(am) * 0.4], UVQ, c, 0)
    out.quad([P(a1, R + 0.4, 2.8), P(a0, R + 0.4, 2.8), P(a0, R + 0.4, 3.1), P(a1, R + 0.4, 3.1)], [Math.sin(am), 0, Math.cos(am)], UVQ, c, 0)
    const x = Math.sin(a0) * (R - 0.6), z = Math.cos(a0) * (R - 0.6)
    if (i % 2 === 0) {
      prism(out, Math.sin(a0) * R, Math.cos(a0) * R, y + 0.3, y + 2.9, 0.05, 5, hex('#c8b89a'), 0)
      // a wooden horse on its pole, tangent to the ring
      const tx = Math.cos(a0), tz = -Math.sin(a0)
      prism(out, x, z, y + 0.3, y + 2.9, 0.03, 4, GILT, surfaceTag('metal'))
      strut(out, [x - tx * 0.42, y + 1.1, z - tz * 0.42], [x + tx * 0.42, y + 1.1, z + tz * 0.42], 0.22, 0.3, W, pl)
      strut(out, [x + tx * 0.42, y + 1.2, z + tz * 0.42], [x + tx * 0.6, y + 1.6, z + tz * 0.6], 0.14, 0.14, W, pl)
      for (const s of [-0.35, 0.35]) strut(out, [x + tx * s, y + 1, z + tz * s], [x + tx * s, y + 0.6, z + tz * s], 0.08, 0.08, shade(W, 0.8), pl)
    }
  }
  prism(out, 0, 0, y + 4.6, y + 5.1, 0.05, 5, GILT, surfaceTag('metal'))
}

/* ---------------------------------------------------------------------------------------------------- the Villette's dragon */

/**
 * The DRAGON of the Parc de la Villette (François Hanss, 1987, in OSM's Jardin du Dragon way/81704884): an 80 m steel beast for children, a tube slide through its body, its back of black fins, head reared at the top. From
 * memory and Commons' category: from the ground, a dark serpent of hoops on legs with a toothed crest. Local x along it, head at +x (front 90 then takes x south, so `front` sets it).
 */
export function villetteDragon(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit), BK = hex('#22282c'), SL = hex('#b8bcbc'), met = surfaceTag('metal')
  const L = 32
  const at = (t: number): [number, number, number] => {
    const x = -L + t * 2 * L
    return [x, G(x, 0) + 2.6 + t * t * 8.5 + Math.sin(t * Math.PI * 3) * 1.2, Math.sin(t * Math.PI * 2.1) * 5]
  }
  const n = 26
  for (let i = 0; i < n; i++) {
    const a = at(i / n), b = at((i + 1) / n), r = 1.1 + Math.sin((i / n) * Math.PI) * 1.5
    strut(out, a, b, r * 1.8, r * 1.8, BK, met)
    // the fin on its back, the ribs of the belly, the legs at intervals
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, mz = (a[2] + b[2]) / 2
    for (const d of [0, 0.02]) out.quad(d ? [[mx - 0.2, my + r + 2.2, mz], [mx + 0.9, my + r + 2.2, mz], [b[0], my + r * 0.75, b[2]], [a[0], my + r * 0.75, a[2]]] : [[a[0], my + r * 0.75, a[2]], [b[0], my + r * 0.75, b[2]], [mx + 0.9, my + r + 2.2, mz], [mx - 0.2, my + r + 2.2, mz]], [0, 0, d ? 1 : -1], UVQ, shade(BK, 1.25), met)
    if (i % 4 === 1) for (const s of [-1, 1]) strut(out, [mx, my - r * 0.5, mz + s * r * 0.5], [mx + 0.6, G(mx, mz + s * 4), mz + s * 4], 0.5, 0.5, SL, met)
  }
  // the head
  const h = at(1)
  block(out, h[0] - 0.3, h[0] + 5, h[2] - 1.8, h[2] + 1.8, h[1] - 0.6, h[1] + 2.2, BK)
  block(out, h[0] + 5, h[0] + 8, h[2] - 1.3, h[2] + 1.3, h[1] - 0.8, h[1] + 0.8, shade(BK, 1.1))
  for (const s of [-1, 1]) {
    prism(out, h[0] + 1.4, h[2] + s * 1.1, h[1] + 2.2, h[1] + 5.2, 0.48, 5, SL, met, 0.05)
    block(out, h[0] + 4.3, h[0] + 4.9, h[2] + s * 1.75 - 0.1, h[2] + s * 1.75 + 0.1, h[1] + 1, h[1] + 1.7, [0.86, 0.3, 0.12])
  }
  // the slide's mouth at the tail
  const t = at(0)
  out.quad([[t[0] - 9, G(t[0] - 9, 0) + 0.2, t[2] - 1], [t[0], t[1], t[2] - 1], [t[0], t[1], t[2] + 1], [t[0] - 9, G(t[0] - 9, 0) + 0.2, t[2] + 1]], [-0.3, 0.95, 0], UVQ, SL, met)
}

/** one name per gate and per bull (a builder named by two entries reads as a dead duplicate to the audits) */
export const PARK_GATES = { monceauGateVelasquez: parkGate, monceauGateRuysdael: parkGate, monceauGateVanDyck: parkGate, monceauGateCourcelles: parkGate }
export const BRASSENS_BULLS = { brassensBullEast: bull, brassensBullWest: bull }
