/**
 * Golden Gate Park's famous small buildings, rebuilt 2026-10-05 (owner: "we should do better models of some famous gg
 * park buildings"), each from a photograph:
 *
 *  - THE CONSERVATORY OF FLOWERS (1878; way/30675038). Commons "Front of Conservatory of Flowers, San Francisco.jpg": a
 *    white Victorian glasshouse — a tall central pavilion of glass under a ribbed glass DOME and a little cupola, a
 *    glass entrance porch at its foot up a broad flight of steps, two long low WINGS with arched glass roofs, and a
 *    small domed pavilion at each end. Everything white-painted frame and milky glass. It was an opaque white mass
 *    (the owner: "I think we did a model? It does not appear").
 *  - THE PIONEER LOG CABIN (1911; way/120479798). Commons "Pioneer Log Cabin, Golden Gate Park - San Francisco, CA -
 *    01.jpg": walls of weathered round logs with their ends crossing at the corners, a steep brown-shingle gable
 *    roof, a porch on log posts under the gable at one end, little shuttered windows. It was a flat-roofed box.
 *  - THE ANGLERS LODGE (1938, WPA; way/287927001), by the casting pools. Commons "Anglers Lodge and Casting Pools - …
 *    01.jpg": low, dark red-brown board walls, a dark shingle hip roof on the long wing, a gabled wing with chevron
 *    boarding in the gable and two plank doors, and between them a rough STONE entrance with an arched plank door and
 *    a stone chimney. It was a pale modern block.
 *  - THE COUNTY FAIR BUILDING (Hall of Flowers, 1960; way/25822470), Mapillary on 9th Avenue: long low walls of dark
 *    brown brick under a thin white flat roof slab that oversails them all round. It was the park's colonial style
 *    (red tile hips), which the park zone gives every building in it.
 *
 * The box builders take the fit's frame: local x along the long side, the front (−z) to the street.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism, strut } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { faceBand, insetRing, towerRing } from '../tower.ts'

type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
/** a quad drawn both ways round, so it reads from either side */
const both = (out: MeshBuilder, q: V3[], c: Rgb, tag = 0): void => {
  const e1 = [q[1][0] - q[0][0], q[1][1] - q[0][1], q[1][2] - q[0][2]], e2 = [q[3][0] - q[0][0], q[3][1] - q[0][1], q[3][2] - q[0][2]]
  const n: V3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
  out.quad(q, n, UV, c, tag)
  out.quad([q[3], q[2], q[1], q[0]], [-n[0], -n[1], -n[2]], UV, c, tag)
}

// ---- the Conservatory of Flowers ---------------------------------------------------------------------------------
const WHITE: Rgb = [0.92, 0.92, 0.9]
const MILK: Rgb = [0.74, 0.79, 0.8]

export function conservatoryGlasshouse(out: MeshBuilder, fit: Fit): void {
  const glass = surfaceTag('glass'), wood = surfaceTag('clapboard')
  const L = Math.min(fit.hx, 38), D = Math.min(fit.hz, 20)
  const WD = Math.min(5, D * 0.3)            // the wings' half-depth
  const WALL = 1.1, EAVE = 4.2, VAULT = 2.6  // white base, glass wall, arched roof's rise
  // the wings: a white base, a glass wall with white glazing bars, an arched glass roof on white ribs
  for (const s of [-1, 1]) {
    const x0 = s * 9, x1 = s * (L - 6)
    const cx = (x0 + x1) / 2, hx = Math.abs(x1 - x0) / 2
    box(out, cx, WALL / 2, 0, hx, WALL / 2, WD, WHITE, wood)
    box(out, cx, (WALL + EAVE) / 2, 0, hx - 0.05, (EAVE - WALL) / 2, WD - 0.05, MILK, glass)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1) + 0.01; x += 1.3) {
      for (const z of [-WD - 0.02, WD + 0.02]) box(out, x, (WALL + EAVE) / 2, z, 0.05, (EAVE - WALL) / 2, 0.03, WHITE, wood)
    }
    box(out, cx, EAVE, 0, hx + 0.1, 0.12, WD + 0.15, WHITE, wood)
    // the arch: six facets each side of the crown
    const N = 6
    const at = (k: number): [number, number] => { const a = (k / N) * Math.PI; return [Math.cos(a) * WD, EAVE + Math.sin(a) * VAULT] }
    for (let k = 0; k < N; k++) {
      const [z0, y0] = at(k), [z1, y1] = at(k + 1)
      both(out, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z1], [x0, y1, z1]], MILK, glass)
    }
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1) + 0.01; x += 2.6) {
      for (let k = 0; k < N; k++) {
        const [z0, y0] = at(k), [z1, y1] = at(k + 1)
        strut(out, [x, y0 + 0.03, z0], [x, y1 + 0.03, z1], 0.08, 0.08, WHITE, wood)
      }
    }
    // the end pavilion: a low octagon of glass under a small ribbed dome and a finial
    const ex = s * (L - 5)
    prism(out, ex, 0, 0, WALL, 5.2, 8, WHITE, wood)
    prism(out, ex, 0, WALL, EAVE + 0.6, 5, 8, MILK, glass)
    prism(out, ex, 0, EAVE + 0.6, EAVE + 0.85, 5.3, 8, WHITE, wood)
    domeOf(out, ex, 0, EAVE + 0.85, 5, 3.2, 8)
    strut(out, [ex, EAVE + 4, 0], [ex, EAVE + 5.4, 0], 0.12, 0.12, WHITE, wood)
  }
  // the central pavilion: a tall octagon of glass, a ribbed dome, a glazed cupola and a finial
  const R = Math.min(9, D * 0.48)
  prism(out, 0, 0, 0, WALL, R + 0.2, 8, WHITE, wood)
  prism(out, 0, 0, WALL, 10, R, 8, MILK, glass)
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) / 8) * Math.PI * 2
    strut(out, [Math.cos(a) * R, WALL, Math.sin(a) * R], [Math.cos(a) * R, 10, Math.sin(a) * R], 0.14, 0.14, WHITE, wood)
  }
  prism(out, 0, 0, 10, 10.4, R + 0.4, 8, WHITE, wood)
  domeOf(out, 0, 0, 10.4, R, 6.4, 8)
  prism(out, 0, 0, 16.6, 18.4, 1.8, 8, MILK, glass)
  prism(out, 0, 0, 18.4, 19.4, 2, 8, WHITE, wood, 0.4)
  strut(out, [0, 19.4, 0], [0, 21.6, 0], 0.1, 0.1, WHITE, wood)
  // the glass entrance porch out in front, and the broad steps up to it
  box(out, 0, WALL / 2, -R - 2, 3.2, WALL / 2, 2.4, WHITE, wood)
  box(out, 0, (WALL + 5) / 2, -R - 2, 3.1, (5 - WALL) / 2, 2.3, MILK, glass)
  for (const zz of [-R - 4.35, -R + 0.3]) for (let x = -3; x <= 3.01; x += 1.5) box(out, x, (WALL + 5) / 2, zz, 0.06, (5 - WALL) / 2, 0.06, WHITE, wood)
  box(out, 0, 5.1, -R - 2, 3.4, 0.15, 2.6, WHITE, wood)
  both(out, [[-3.4, 5.25, -R - 4.6], [3.4, 5.25, -R - 4.6], [0, 7.2, -R - 4.6], [0, 7.2, -R - 4.6]], WHITE, wood)
  for (let i = 0; i < 6; i++) box(out, 0, 0.1 + i * 0.18, -R - 5 - (5 - i) * 0.4, 5.5, 0.1 + i * 0.09, 0.2 + (5 - i) * 0.2, [0.75, 0.74, 0.7], surfaceTag('concrete'))
}

/** a ribbed dome: rings of glass narrowing up, white ribs over them */
function domeOf(out: MeshBuilder, cx: number, cz: number, y0: number, r: number, rise: number, sides: number): void {
  const glass = surfaceTag('glass'), wood = surfaceTag('clapboard')
  const N = 5
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * Math.PI / 2, a1 = ((k + 1) / N) * Math.PI / 2
    prism(out, cx, cz, y0 + Math.sin(a0) * rise, y0 + Math.sin(a1) * rise, Math.cos(a0) * r, sides, MILK, glass, Math.max(0.2, Math.cos(a1) * r))
  }
  for (let s = 0; s < sides; s++) {
    const t = (s / sides) * Math.PI * 2
    for (let k = 0; k < N; k++) {
      const a0 = (k / N) * Math.PI / 2, a1 = ((k + 1) / N) * Math.PI / 2
      const p = (a: number): V3 => [cx + Math.cos(t) * Math.cos(a) * (r + 0.05), y0 + Math.sin(a) * rise + 0.05, cz + Math.sin(t) * Math.cos(a) * (r + 0.05)]
      strut(out, p(a0), p(a1), 0.09, 0.09, WHITE, wood)
    }
  }
}

// ---- the Pioneer Log Cabin ---------------------------------------------------------------------------------------
export function pioneerLogCabin(out: MeshBuilder, fit: Fit): void {
  const LOG: Rgb[] = [[0.42, 0.33, 0.25], [0.36, 0.28, 0.21], [0.47, 0.38, 0.29]]
  const END: Rgb = [0.6, 0.5, 0.38]
  const ROOF: Rgb = [0.36, 0.24, 0.17]
  const wood = surfaceTag('clapboard')
  const hx = Math.min(fit.hx - 1, 9), hz = Math.min(fit.hz - 1, 3.8)
  const PORCH = 3, WALL = 2.6, RISE = hz * 0.85
  const wx = hx - PORCH          // the walls stop short of the porch at the +x end
  // the walls: round logs stacked, the ends crossing out past each corner
  let n = 0
  for (let y = 0.17; y < WALL; y += 0.32) {
    n++
    const c = LOG[n % 3]
    for (const s of [-1, 1]) {
      strut(out, [-hx - 0.4, y, s * hz], [wx + 0.4, y, s * hz], 0.34, 0.32, c, wood, true)
      strut(out, [s < 0 ? -hx : wx, y + 0.16, -hz - 0.4], [s < 0 ? -hx : wx, y + 0.16, hz + 0.4], 0.34, 0.32, LOG[(n + 1) % 3], wood, true)
    }
  }
  // the pale cut ends of the logs at the corners
  for (const x of [-hx - 0.4, wx + 0.4]) for (const z of [-hz, hz]) box(out, x, WALL / 2, z, 0.02, WALL / 2, 0.16, END, wood)
  // the gable ends, boarded with logs up to the ridge
  for (const x of [-hx, wx]) {
    for (let y = WALL; y < WALL + RISE - 0.2; y += 0.32) {
      const w = hz * (1 - (y - WALL) / RISE)
      strut(out, [x, y, -w], [x, y, w], 0.3, 0.3, LOG[Math.floor(y * 3) % 3], wood, true)
    }
  }
  // the roof: brown shingle, steep, over the walls and the porch, eaves past the walls
  const o = 0.6, xa = -hx - 0.7, xb = hx + 0.3
  for (const s of [-1, 1]) {
    both(out, [[xa, WALL - 0.2, s * (hz + o)], [xb, WALL - 0.2, s * (hz + o)], [xb, WALL + RISE, 0], [xa, WALL + RISE, 0]], ROOF, surfaceTag('tile'))
    strut(out, [xa, WALL - 0.25, s * (hz + o)], [xb, WALL - 0.25, s * (hz + o)], 0.12, 0.12, [0.3, 0.22, 0.17], wood)
  }
  strut(out, [xa, WALL + RISE + 0.05, 0], [xb, WALL + RISE + 0.05, 0], 0.18, 0.12, [0.28, 0.21, 0.17], wood)
  // the porch: log posts at the open end, a plank floor
  for (const z of [-hz + 0.2, -hz / 3, hz / 3, hz - 0.2]) strut(out, [hx - 0.2, 0, z], [hx - 0.2, WALL - 0.2, z], 0.22, 0.22, LOG[1], wood)
  strut(out, [hx - 0.2, WALL - 0.15, -hz - 0.3], [hx - 0.2, WALL - 0.15, hz + 0.3], 0.26, 0.26, LOG[0], wood)
  box(out, (wx + hx) / 2, 0.1, 0, (hx - wx) / 2, 0.1, hz, [0.4, 0.32, 0.24], wood)
  // shuttered windows and a plank door on the long front, and a door under the porch
  for (const x of [-hx + 1.6, -hx + 4.2]) box(out, x, 1.3, -hz - 0.2, 0.45, 0.5, 0.05, [0.33, 0.22, 0.16], wood)
  box(out, wx - 1.4, 1, -hz - 0.2, 0.5, 1, 0.05, [0.3, 0.2, 0.14], wood)
  box(out, wx + 0.18, 1, 0, 0.05, 1, 0.5, [0.3, 0.2, 0.14], wood)
}

// ---- the Anglers Lodge --------------------------------------------------------------------------------------------
export function anglersLodge(out: MeshBuilder, fit: Fit): void {
  const BOARD: Rgb = [0.3, 0.15, 0.13], TRIM: Rgb = [0.24, 0.11, 0.1], SHINGLE: Rgb = [0.24, 0.24, 0.24]
  const STONE: Rgb[] = [[0.42, 0.34, 0.3], [0.36, 0.29, 0.26], [0.47, 0.38, 0.33], [0.32, 0.26, 0.24]]
  const wood = surfaceTag('clapboard'), stone = 0
  const hx = Math.min(fit.hx - 0.5, 10), hz = Math.min(fit.hz - 0.5, 6)
  const W = 3.2
  // the long wing (−x half): board walls, green-framed windows, a dark shingle hip roof
  const lx0 = -hx, lx1 = 0.5
  box(out, (lx0 + lx1) / 2, W / 2, 0, (lx1 - lx0) / 2, W / 2, hz - 1, BOARD, wood)
  for (const x of [lx0 + 1.6, lx0 + 3.2]) {
    box(out, x, 1.8, -hz + 0.95, 0.75, 0.75, 0.06, [0.15, 0.4, 0.22], wood)
    box(out, x, 1.8, -hz + 0.93, 0.62, 0.62, 0.06, [0.14, 0.17, 0.19], 0)
  }
  hipRoof(out, lx0 - 0.5, lx1, -hz + 0.5, hz - 0.5, W, 1.7, SHINGLE)
  // the stone chimney at the far end of the long wing
  for (let y = 0; y < W + 2.6; y += 0.35) box(out, lx0 + 1.2, y + 0.17, hz - 2, 0.6, 0.17, 0.6, STONE[Math.floor(y * 7) % 4], stone)
  box(out, lx0 + 1.2, W + 2.8, hz - 2, 0.25, 0.25, 0.25, [0.12, 0.12, 0.12], 0)
  // the gabled wing (+x half): board walls, two plank doors under a gable of chevron boards
  const gx0 = 2.6, gx1 = hx, GR = 1.8
  box(out, (gx0 + gx1) / 2, W / 2, 0, (gx1 - gx0) / 2, W / 2, hz, BOARD, wood)
  for (const x of [gx0 + 1.6, gx1 - 1.6]) box(out, x, 1.2, -hz - 0.05, 0.75, 1.2, 0.05, TRIM, wood)
  for (const s of [-1, 1]) both(out, [[gx0 - 0.3, W, -hz - 0.4], [gx1 + 0.3, W, -hz - 0.4], [gx1 + 0.3, W + GR, 0], [gx0 - 0.3, W + GR, 0]].map((p) => [p[0], p[1], p[2] * s]) as V3[], SHINGLE, surfaceTag('tile'))
  const gz = -hz - 0.05, gm = (gx0 + gx1) / 2, gw = (gx1 - gx0) / 2
  both(out, [[gx0, W, gz], [gx1, W, gz], [gm, W + GR, gz], [gm, W + GR, gz]], BOARD, wood)
  for (let k = 1; k < 5; k++) {
    const t = k / 5
    strut(out, [gx0 + gw * t, W + 0.05, gz - 0.03], [gm, W + GR * (1 - t) + 0.05, gz - 0.03], 0.05, 0.05, TRIM, wood)
    strut(out, [gx1 - gw * t, W + 0.05, gz - 0.03], [gm, W + GR * (1 - t) + 0.05, gz - 0.03], 0.05, 0.05, TRIM, wood)
  }
  box(out, gm, W + 0.1, gz - 0.05, gw + 0.3, 0.1, 0.08, [0.55, 0.2, 0.15], wood)
  // between them, the rough stone entrance with its arched plank door
  const ex0 = lx1, ex1 = gx0
  let k = 0
  for (let y = 0.15; y < W; y += 0.3) for (let x = ex0 + 0.2; x < ex1; x += 0.45) {
    k++
    const door = Math.abs(x - (ex0 + ex1) / 2) < 0.7 && y < 2.4
    if (door) continue
    box(out, x + ((k % 2) * 0.2 - 0.1), y, -hz + 0.6, 0.24, 0.15, 0.25, STONE[k % 4], stone)
  }
  box(out, (ex0 + ex1) / 2, W / 2, -hz + 0.9, (ex1 - ex0) / 2, W / 2, 0.3, STONE[1], stone)
  box(out, (ex0 + ex1) / 2, 1.1, -hz + 0.4, 0.6, 1.1, 0.04, [0.42, 0.3, 0.2], wood)
  prism(out, (ex0 + ex1) / 2, -hz + 0.4, 2.15, 2.4, 0.6, 8, [0.42, 0.3, 0.2], wood)
}

/** a hip roof over [x0,x1] × [z0,z1] from the eaves at y, rising `rise` to a ridge along x */
function hipRoof(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, rise: number, c: Rgb): void {
  const tag = surfaceTag('tile')
  const zm = (z0 + z1) / 2, inset = Math.min((x1 - x0) / 2, (z1 - z0) / 2)
  const r0: V3 = [x0 + inset, y + rise, zm], r1: V3 = [x1 - inset, y + rise, zm]
  both(out, [[x0, y, z0], [x1, y, z0], r1, r0], c, tag)
  both(out, [[x1, y, z1], [x0, y, z1], r0, r1], c, tag)
  both(out, [[x0, y, z1], [x0, y, z0], r0, r0], c, tag)
  both(out, [[x1, y, z0], [x1, y, z1], r1, r1], c, tag)
}

// ---- the County Fair Building ------------------------------------------------------------------------------------
export function countyFairBuilding(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const BRICK: Rgb = [0.46, 0.33, 0.26], SLAB: Rgb = [0.85, 0.85, 0.82]
  const H = 5
  faceBand(out, ring, 0, H, { kind: 'blank', wall: BRICK, material: 'brick' })
  // a dark clerestory band of glass under the slab
  faceBand(out, insetRing(ring, 0.05), H - 0.9, H, { kind: 'blank', wall: [0.16, 0.18, 0.2], material: 'glass' })
  // the white roof slab, oversailing the walls 2.4 m all round, thin
  const slab = insetRing(ring, -2.4)
  faceBand(out, slab, H, H + 0.85, { kind: 'blank', wall: SLAB, material: 'concrete' })
  capPolygon(out, slab.map((p) => ({ x: p.x, z: p.z })), H + 0.85, [0.4, 0.4, 0.39], surfaceTag('concrete'))
  // its soffit, the slab's underside from the wall out to the edge
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], A = slab[i], B = slab[(i + 1) % slab.length]
    both(out, [[a.x, H, a.z], [b.x, H, b.z], [B.x, H, B.z], [A.x, H, A.z]], [0.7, 0.7, 0.68])
  }
}


// ---- California Kahve, the kiosk by the carousel ------------------------------------------------------------------
/**
 * The kiosk at 300 Bowling Green Drive (way/287951728), now California Kahve. From lotsafunmaps' photographs: a little
 * pavilion of white textured stucco, tall ROUND-ARCHED windows on every side in dark green frames with fanlights, the
 * front one a service window over a counter with the menu boards either side, a round wooden sign in the arch, a red
 * tile hip roof. Planters along the front.
 */
export function kahveKiosk(out: MeshBuilder, fit: Fit): void {
  const STUCCO: Rgb = [0.88, 0.87, 0.82], GREEN: Rgb = [0.13, 0.27, 0.19], GLASS: Rgb = [0.15, 0.18, 0.2]
  const ROOF: Rgb = [0.44, 0.17, 0.12], WOODC: Rgb = [0.55, 0.36, 0.2]
  const st = surfaceTag('stucco'), wood = surfaceTag('clapboard')
  const hx = Math.min(fit.hx, 4.2), hz = Math.min(fit.hz, 3.8), H = 3.8
  box(out, 0, H / 2, 0, hx, H / 2, hz, STUCCO, st)
  box(out, 0, H + 0.12, 0, hx + 0.2, 0.12, hz + 0.2, STUCCO, st)
  hipRoof(out, -hx - 0.45, hx + 0.45, -hz - 0.45, hz + 0.45, H + 0.24, Math.min(hx, hz) * 0.55, ROOF)
  // the arched windows: green frame, dark glass, a fanlight arch over each (a half-octagon of frame)
  const arch = (u: number, side: 'x' | 'z', s: number, w: number, counter: boolean): void => {
    const put = (a: number, y: number, hw: number, hh: number, d: number, c: Rgb, tag: number): void => {
      if (side === 'z') box(out, a, y, s * (hz + d), hw, hh, 0.05, c, tag)
      else box(out, s * (hx + d), y, a, 0.05, hh, hw, c, tag)
    }
    const y0 = counter ? 1.1 : 0.8, y1 = 2.6
    put(u, (y0 + y1) / 2, w / 2 + 0.1, (y1 - y0) / 2 + 0.05, 0.02, GREEN, wood)
    put(u, (y0 + y1) / 2, w / 2 - 0.05, (y1 - y0) / 2 - 0.05, 0.05, counter ? [0.08, 0.08, 0.09] : GLASS, 0)
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI, b = ((k + 1) / 4) * Math.PI
      const r = w / 2 + 0.05
      const ax = u + Math.cos(a) * r, ay = y1 + Math.sin(a) * r, bx = u + Math.cos(b) * r, by = y1 + Math.sin(b) * r
      if (side === 'z') strut(out, [ax, ay, s * (hz + 0.04)], [bx, by, s * (hz + 0.04)], 0.1, 0.1, GREEN, wood)
      else strut(out, [s * (hx + 0.04), ay, ax], [s * (hx + 0.04), by, bx], 0.1, 0.1, GREEN, wood)
    }
    put(u, y1 + w * 0.22, w / 2 - 0.15, w * 0.2, 0.04, GLASS, 0)
    if (counter) put(u, y0 - 0.05, w / 2 + 0.25, 0.05, 0.25, [0.9, 0.9, 0.88], st)
  }
  for (const u of [-hx * 0.5, hx * 0.5]) arch(u, 'z', 1, 1.3, false)
  arch(0, 'z', -1, 1.8, true)
  for (const u of [-hx * 0.55, hx * 0.55]) arch(u, 'z', -1, 1.1, false)
  for (const s of [-1, 1]) arch(0, 'x', s, 1.3, false)
  // the round sign in the front arch, the menu boards beside the counter, planters
  prism(out, 0, -hz - 0.12, 2.75, 2.8, 0.38, 14, WOODC, wood)
  box(out, 0, 3.05, -hz - 0.1, 0.38, 0.38, 0.03, WOODC, wood)
  for (const u of [-1.4, 1.4]) box(out, u, 1.7, -hz - 0.35, 0.4, 0.55, 0.03, [0.86, 0.78, 0.6], wood)
  for (const u of [-hx + 0.6, hx - 0.6]) {
    box(out, u, 0.3, -hz - 0.5, 0.45, 0.3, 0.3, [0.6, 0.35, 0.25], 0)
    prism(out, u, -hz - 0.5, 0.6, 1.2, 0.45, 7, [0.2, 0.36, 0.17], 0, 0.2)
  }
}

export const GGP_BUILDINGS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  conservatoryGlasshouse, pioneerLogCabin, anglersLodge, countyFairBuilding, kahveKiosk,
}
