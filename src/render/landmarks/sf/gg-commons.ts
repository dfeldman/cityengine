/**
 * GOLDEN GATEWAY COMMONS (Fisher-Friedman Associates, 1978–85; Jackson to Pacific, Front to Drumm): brick townhouses
 * and flats on two-storey bases of shops and offices round the parking, garden paths and courtyards on the podium.
 * From the owner's photographs (2026-10-03): a deep maroon brick everywhere; square windows under dark sloped awnings;
 * a top storey of half-round windows; the base an arcade of dark round-arched openings; pale pink-buff roof decks,
 * each with its dark sloping greenhouse skylight and tall square brick chimneys; and on the Jackson Street front, facing
 * Sydney Walton Square, a great brick gateway — an arch rising above the roofline over the way in, a straight flight
 * down from the podium to a landing, and two flights curving off it to the pavement between solid brick parapets.
 *
 * `ggCommonsHouse` is fitted to each of OSM's ~25 `building:part`s (14 m from the ground: base and houses together);
 * `ggCommonsGateway` stands alone on the Jackson front (local +z out to the street).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { tower, towerRing } from '../tower.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const BRICK: Rgb = [0.3, 0.14, 0.12]
const BRICK_DARK: Rgb = [0.24, 0.11, 0.1]
const GLASS: Rgb = [0.13, 0.13, 0.15]
const AWNING: Rgb = [0.17, 0.17, 0.19]
const SKYLIGHT: Rgb = [0.15, 0.17, 0.2]
const ROOF: Rgb = [0.58, 0.46, 0.41]
const BASE = 6.4

export function ggCommonsHouse(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 6 && fit.height < 20 ? fit.height : 14
  const ring = towerRing(fit)
  const low = H < 11
  tower(out, fit, {
    height: H,
    base: { height: Math.min(BASE, H - 3), face: { kind: 'punched', material: 'brick', wall: BRICK_DARK, glass: GLASS, pitch: 3.6, solid: 0.38, floor: BASE, arched: true } },
    tiers: low
      ? [{ to: H, face: { kind: 'punched', material: 'brick', wall: BRICK, glass: GLASS, pitch: 3.2, solid: 0.45, floor: 3.1, arched: true }, cornice: { depth: 0.25, height: 0.35, colour: BRICK_DARK } }]
      : [
        { to: H - 3.3, face: { kind: 'punched', material: 'brick', wall: BRICK, glass: GLASS, pitch: 3.2, solid: 0.42, floor: 3.2 } },
        { to: H, face: { kind: 'punched', material: 'brick', wall: BRICK, glass: GLASS, pitch: 3.2, solid: 0.5, floor: 3.3, arched: true }, cornice: { depth: 0.25, height: 0.35, colour: BRICK_DARK } },
      ],
    roof: ROOF,
  })
  const brick = surfaceTag('brick')
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= ring.length; cz /= ring.length
  const edges = ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    // the outward normal, whichever way the ring winds
    let nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2
    if ((mx - cx) * nx + (mz - cz) * nz < 0) { nx = -nx; nz = -nz }
    return { a, b, L, tx: (b.x - a.x) / L, tz: (b.z - a.z) / L, nx, nz }
  })
  // the awnings: a dark sloped canopy over every other window of the middle storeys
  if (!low) {
    for (const e of edges) {
      if (e.L < 4) continue
      const bays = Math.max(1, Math.round(e.L / 3.2))
      const bw = e.L / bays
      for (let k = 0; k < bays; k++) {
        if (k % 2) continue
        const u = (k + 0.5) * bw
        for (const y of [BASE + 2.6, BASE + 5.8]) {
          if (y > H - 3.5) continue
          const P = (du: number, o: number, dy: number): [number, number, number] =>
            [e.a.x + e.tx * (u + du) + e.nx * o, y + dy, e.a.z + e.tz * (u + du) + e.nz * o]
          const w = bw * 0.36
          out.quad([P(-w, 0.75, -0.45), P(w, 0.75, -0.45), P(w, 0.05, 0.05), P(-w, 0.05, 0.05)], [e.nx * 0.6, 0.8, e.nz * 0.6], [[0, 0], [1, 0], [1, 1], [0, 1]], AWNING, 0)
        }
      }
    }
  }
  // the greenhouse skylight: a dark glass lean-to on the roof along the longest side, sloping up away from it
  const long = edges.reduce((m, e) => (e.L > m.L ? e : m), edges[0])
  if (long.L > 6) {
    const u0 = long.L * 0.25, u1 = long.L * 0.75
    const P = (u: number, o: number, y: number): [number, number, number] =>
      [long.a.x + long.tx * u - long.nx * o, y, long.a.z + long.tz * u - long.nz * o]
    out.quad([P(u0, 0.6, H), P(u1, 0.6, H), P(u1, 3.4, H + 2.3), P(u0, 3.4, H + 2.3)], [long.nx * 0.6, 0.8, long.nz * 0.6], [[0, 0], [1, 0], [1, 1], [0, 1]], SKYLIGHT, 0)
    // its back wall and ends, in brick
    out.quad([P(u1, 3.4, H), P(u0, 3.4, H), P(u0, 3.4, H + 2.3), P(u1, 3.4, H + 2.3)], [-long.nx, 0, -long.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], BRICK, brick)
    for (const u of [u0, u1]) {
      const s = u === u0 ? -1 : 1
      out.quad([P(u, 0.6, H), P(u, 3.4, H), P(u, 3.4, H + 2.3), P(u, 3.4, H + 2.3)], [long.tx * s, 0, long.tz * s], [[0, 0], [1, 0], [1, 1], [0, 1]], BRICK, brick)
    }
  }
  // the chimneys: tall square brick stacks at two corners, drawn in a metre from the walls
  for (const i of [0, Math.floor(ring.length / 2)]) {
    const p = ring[i]
    const dx = cx - p.x, dz = cz - p.z, d = Math.hypot(dx, dz) || 1
    const x = p.x + (dx / d) * 1.2, z = p.z + (dz / d) * 1.2
    box(out, x, H + 1.6, z, 0.45, 1.6, 0.45, BRICK, brick)
    box(out, x, H + 3.3, z, 0.55, 0.1, 0.55, AWNING, 0)
  }
}

/**
 * A block's BASE: the two storeys of shops and offices round the parking, an arcade of dark round-arched openings in
 * the brick, and on its roof the podium's gardens between the houses (which stand on it — their own parts, drawn from
 * the ground through it). Drawn at OSM's block outlines (way/941869555, way/941869556), copied here: since the bake
 * fetched the Commons' relation parts (#225) those outlines are superseded by their parts and no longer in the
 * package, so the base is placed by its own centre (prominent.json) instead of claiming them.
 */
/** way/941869555's outline, metres about its centre (37.7984143, -122.3980590): x east, z north */
const BLOCK_941869555 = [{x: -32.6, z: -40.81}, {x: -30.04, z: -40.41}, {x: -12.45, z: -37.67}, {x: -6.07, z: -36.68}, {x: -0.31, z: -35.78}, {x: 4.25, z: -35.06}, {x: 6.51, z: -34.72}, {x: 10.55, z: -34.08}, {x: 13.25, z: -33.66}, {x: 16.84, z: -33.1}, {x: 19.82, z: -32.65}, {x: 23.94, z: -32.0}, {x: 27.76, z: -31.4}, {x: 31.18, z: -30.88}, {x: 51.08, z: -27.77}, {x: 50.94, z: -26.86}, {x: 47.42, z: -4.32}, {x: 47.11, z: -2.34}, {x: 45.39, z: 8.74}, {x: 43.19, z: 8.4}, {x: 41.34, z: 20.23}, {x: 41.08, z: 21.92}, {x: 39.32, z: 33.2}, {x: 35.98, z: 32.67}, {x: 33.24, z: 50.21}, {x: 28.94, z: 52.78}, {x: 26.99, z: 52.47}, {x: 25.23, z: 52.2}, {x: 5.37, z: 49.1}, {x: -19.42, z: 45.24}, {x: -25.06, z: 44.36}, {x: -39.65, z: 42.09}, {x: -45.38, z: 41.2}, {x: -44.88, z: 38.0}, {x: -44.3, z: 34.29}, {x: -43.4, z: 28.54}, {x: -42.33, z: 21.7}, {x: -41.23, z: 14.62}, {x: -38.63, z: -2.09}, {x: -38.13, z: -5.34}, {x: -37.44, z: -9.72}, {x: -36.71, z: -14.4}, {x: -35.61, z: -21.49}, {x: -34.82, z: -26.58}, {x: -34.35, z: -29.63}, {x: -33.9, z: -32.5}]
/** way/941869556's outline, metres about its centre (37.7982646, -122.3991341): x east, z north */
const BLOCK_941869556 = [{x: -53.73, z: 41.13}, {x: -53.52, z: 39.82}, {x: -48.39, z: 8.42}, {x: -48.07, z: 6.12}, {x: -47.2, z: 3.92}, {x: -46.02, z: -3.48}, {x: -45.7, z: -5.62}, {x: -44.05, z: -16.61}, {x: -42.87, z: -24.26}, {x: -40.6, z: -39.26}, {x: -40.32, z: -41.09}, {x: -20.32, z: -38.06}, {x: -12.71, z: -36.9}, {x: -5.07, z: -35.74}, {x: 0.58, z: -34.89}, {x: 7.05, z: -33.91}, {x: 9.1, z: -33.6}, {x: 9.72, z: -32.64}, {x: 14.87, z: -31.79}, {x: 22.51, z: -30.55}, {x: 36.45, z: -28.29}, {x: 40.94, z: -27.55}, {x: 39.65, z: -19.61}, {x: 39.26, z: -17.21}, {x: 38.35, z: -11.65}, {x: 36.66, z: -1.22}, {x: 35.93, z: 3.18}, {x: 35.2, z: 7.73}, {x: 34.6, z: 11.37}, {x: 31.95, z: 27.62}, {x: 30.74, z: 35.0}, {x: 28.14, z: 50.98}, {x: 27.59, z: 54.39}, {x: 22.05, z: 53.49}, {x: 17.02, z: 52.67}, {x: 15.05, z: 52.35}, {x: 2.95, z: 50.37}, {x: -27.8, z: 45.36}]

const podium = (outline: { x: number; z: number }[]) => (out: MeshBuilder, _fit: Fit): void => {
  // 0.4 m in from the outline, so where a house's own wall stands on the same line the house's wall is the one seen
  const cx = outline.reduce((a, p) => a + p.x, 0) / outline.length, cz = outline.reduce((a, p) => a + p.z, 0) / outline.length
  const block = outline.map((p) => { const d = Math.hypot(p.x - cx, p.z - cz) || 1; return { x: p.x - ((p.x - cx) / d) * 0.4, z: p.z - ((p.z - cz) / d) * 0.4 } })
  tower(out, { hx: 1, hz: 1, height: BASE, ring: block }, {
    height: BASE,
    tiers: [{ to: BASE, face: { kind: 'punched', material: 'brick', wall: BRICK_DARK, glass: GLASS, pitch: 3.6, solid: 0.38, floor: BASE, arched: true }, cornice: { depth: 0.3, height: 0.4, colour: BRICK } }],
    roof: [0.3, 0.38, 0.22],
  })
}
export const ggCommonsPodiumDrumm = podium(BLOCK_941869555)
export const ggCommonsPodiumFront = podium(BLOCK_941869556)

/** The gateway on the Jackson Street front: local +z out to the street, the podium's face at z = 0. */
export function ggCommonsGateway(out: MeshBuilder, _fit: Fit): void {
  const brick = surfaceTag('brick')
  const glass = surfaceTag('glass')
  const TOP = 16.5
  const R = 3.6            // the arch's radius; its springing at SPRING
  const SPRING = 10.5
  // the two piers and the attic over the arch
  for (const s of [-1, 1]) box(out, s * (R + 0.9), TOP / 2, -0.6, 0.9, TOP / 2, 0.8, BRICK, brick)
  box(out, 0, TOP - 1, -0.6, R + 1.8, 1, 0.8, BRICK, brick)
  // the arch: voussoirs round a half circle, filling the attic's corners down to the springing
  const n = 12
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI
    const x = Math.cos(a) * (R + 0.45), y = SPRING + Math.sin(a) * (R + 0.45)
    box(out, x, (y + TOP - 2) / 2 + 0.2, -0.6, (Math.PI * (R + 0.45)) / n / 2 + 0.05, Math.max(0.3, (TOP - 2 - y) / 2 + 0.25), 0.8, i % 3 ? BRICK : BRICK_DARK, brick)
  }
  // in the opening: the podium's glazed lobby to the springing, the sky through the arch above it
  box(out, 0, (BASE + SPRING) / 2, -1.2, R, (SPRING - BASE) / 2, 0.08, GLASS, glass)
  // the straight flight down from the podium (y BASE at z 0) to the landing
  const LAND = 3.2
  const steps = 10
  for (let k = 0; k < steps; k++) {
    const y = BASE - ((k + 1) * (BASE - LAND)) / steps
    box(out, 0, y / 2, 0.25 + k * 0.4, 1.6, y / 2 + 0.01, 0.2, k % 2 ? BRICK_DARK : BRICK, brick)
  }
  // the landing, on a solid brick mass, its parapet round the front
  box(out, 0, LAND / 2, 5.6, 4.2, LAND / 2, 1.4, BRICK, brick)
  box(out, 0, LAND + 0.5, 6.9, 4.2, 0.5, 0.12, BRICK_DARK, brick)
  for (const s of [-1, 1]) box(out, s * 1.75, (BASE + LAND) / 2 + 0.3, 2.2, 0.12, (BASE - LAND) / 2 + 0.6, 2.1, BRICK_DARK, brick)
  // and the two flights off it, sideways down to the pavement, each between brick parapets
  for (const s of [-1, 1]) {
    const m = 9
    for (let k = 0; k < m; k++) {
      const y = LAND - ((k + 1) * LAND) / m
      const x = s * (4.2 + 0.4 + k * 0.42)
      box(out, x, Math.max(0.05, y / 2), 5.6, 0.21, Math.max(0.05, y / 2 + 0.01), 1.1, k % 2 ? BRICK_DARK : BRICK, brick)
      box(out, x, y + 0.55, 6.85, 0.22, 0.55 + LAND / m / 2, 0.12, BRICK_DARK, brick)
    }
  }
}

export const GG_COMMONS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { ggCommonsHouse, ggCommonsGateway, ggCommonsPodiumDrumm, ggCommonsPodiumFront }
