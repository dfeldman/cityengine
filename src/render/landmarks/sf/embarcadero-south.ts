/**
 * THE EMBARCADERO SOUTH OF MARKET, from Mapillary (owner, 2026-10-06: "really we should do the same thing along
 * embarcadero that we did on market — look at EVERY building on mapillary and do a custom build"; "the two tall curved
 * buildings are identical i believe"). Raised from their own fitted footprints with the tower grammar.
 *
 * - infinityTower: THE INFINITY I and II (301 Main, 338 Spear; 2008), one design twice — green glass ellipses, the
 *   floors drawn as thin pale slab edges across the glass, two setbacks near the top, a parapet. They were two
 *   different generic glass boxes.
 * - twoFolsom: 2 FOLSOM STREET, a deep grid of dark red-brown granite with recessed windows (it was a plain blue glass
 *   box: its old note said no photograph was found; Mapillary on Folsom and Steuart has several).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, faceBand, type Face } from '../tower.ts'
import { capPolygon } from '../../buildings.ts'
import { drapeOn } from './embarcadero-plaza.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const INFINITY: Face = { kind: 'bands', wall: [0.78, 0.8, 0.78], glass: [0.16, 0.4, 0.37], floor: 3.05, solid: 0.14, material: 'concrete' }

export function infinityTower(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, {
    height: 120,
    base: { height: 6, face: { kind: 'curtain', wall: [0.7, 0.72, 0.7], glass: [0.2, 0.28, 0.3], pitch: 2 } },
    tiers: [{ to: 0.86, face: INFINITY }, { to: 0.94, inset: 2.2, face: INFINITY }, { to: 1, inset: 2.2, face: INFINITY }],
    crown: { kind: 'parapet', height: 1.4, colour: [0.74, 0.76, 0.74] },
  })
}

export function twoFolsom(out: MeshBuilder, fit: Fit): void {
  const GRANITE: Face = { kind: 'punched', wall: [0.38, 0.22, 0.17], glass: [0.12, 0.13, 0.15], floor: 4, pitch: 3, solid: 0.42, material: 'granite' }
  tower(out, fit, {
    height: 91,
    base: { height: 8, face: { kind: 'fins', wall: [0.34, 0.2, 0.16], glass: [0.14, 0.16, 0.18], pitch: 3, solid: 0.35, material: 'granite' } },
    tiers: [{ to: 1, face: GRANITE }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.34, 0.2, 0.16], material: 'granite' },
    penthouse: 1,
  })
}

/**
 * 201 SPEAR (1987): the owner, "the brick building (201 Spear St) is very unusual too" — a salmon-red precast tower cut
 * into a deep grid of square windows, its corners notched in steps, stepping back in tiers to the top (Mapillary on
 * Spear and Howard).
 */
export function twoOOneSpear(out: MeshBuilder, fit: Fit): void {
  const RED: Face = { kind: 'punched', wall: [0.7, 0.4, 0.31], glass: [0.14, 0.15, 0.17], floor: 3.9, pitch: 2.1, solid: 0.42, material: 'brick' }
  tower(out, fit, {
    height: 81,
    base: { height: 7, face: { kind: 'fins', wall: [0.62, 0.36, 0.28], glass: [0.16, 0.18, 0.2], pitch: 3, solid: 0.3, material: 'brick' } },
    tiers: [{ to: 0.78, face: RED }, { to: 0.9, inset: 2.4, face: RED }, { to: 1, inset: 2.4, face: RED }],
    crown: { kind: 'stepped', steps: 2, height: 3, inset: 1.6, face: RED },
  })
}

/**
 * ONE STEUART LANE (2021): a stack of glass boxes, each three or four floors, shifted off one another, each framed in
 * pale aluminium with white-edged bays (Mapillary on Steuart and the Embarcadero). Built as the footprint raised in
 * blocks, each block slid a little along the long side, alternately.
 */
export function oneSteuartLane(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height > 30 && fit.height < 120 ? fit.height : 67
  const GLASS: Face = { kind: 'fins', wall: [0.9, 0.9, 0.88], glass: [0.42, 0.55, 0.6], floor: 3.3, pitch: 1.6, solid: 0.12, depth: 0.25, material: 'metal' }
  const BASE: Face = { kind: 'curtain', wall: [0.8, 0.8, 0.78], glass: [0.18, 0.22, 0.25], pitch: 3 }
  faceBand(out, ring, 0, 6, BASE)
  capPolygon(out, ring, 6, [0.8, 0.8, 0.78], 0)
  const blocks = Math.max(3, Math.round((H - 6) / 11))
  const step = (H - 6) / blocks
  for (let k = 0; k < blocks; k++) {
    const dx = (k % 2 ? 1 : -1) * 1.1 * (k % 3 === 2 ? 0.4 : 1), dz = (k % 2 ? -0.6 : 0.6)
    const r = ring.map((p) => ({ x: p.x * 0.97 + dx, z: p.z * 0.97 + dz }))
    const y0 = 6 + k * step, y1 = y0 + step
    faceBand(out, r, y0, y1 - 0.35, GLASS)
    faceBand(out, r.map((p) => ({ x: p.x * 1.01, z: p.z * 1.01 })), y1 - 0.35, y1, { kind: 'blank', wall: [0.92, 0.92, 0.9], material: 'concrete' })
    capPolygon(out, r.map((p) => ({ x: p.x * 1.01, z: p.z * 1.01 })), y1, [0.88, 0.88, 0.86], 0)
  }
}

/**
 * THE TOWERS AT RINCON / RINCON CENTER (1989, 88 Howard and 101 Spear): the owner's Street View (2026-10-06, "rincon
 * center towers") — two pale towers rising out of a stone podium, their shafts lined with stacked balconies, each
 * ending in a round drum with a stepped crown and a small finial; on the podium a glazed barrel vault and a glass
 * pyramid. Standalone over the bake's outline (local x east, z north, centre at the outline's middle).
 */
export function towersAtRincon(out: MeshBuilder, _fit: Fit): void {
  const STONE: Rgb = [0.84, 0.81, 0.74], PALE: Rgb = [0.88, 0.87, 0.83], GREY: Rgb = [0.55, 0.57, 0.58]
  const conc = surfaceTag('concrete'), glass = surfaceTag('glass')
  // the podium, six storeys of stone with windows, over most of the block
  const pod = [{ x: -40, z: -38 }, { x: 38, z: -38 }, { x: 38, z: 38 }, { x: -40, z: 38 }]
  faceBand(out, pod, 0, 5, { kind: 'fins', wall: STONE, glass: [0.18, 0.2, 0.22], pitch: 4, solid: 0.35, material: 'ashlar' })
  faceBand(out, pod, 5, 22, { kind: 'punched', wall: STONE, glass: [0.18, 0.2, 0.22], floor: 3.4, pitch: 3, solid: 0.5, material: 'ashlar' })
  capPolygon(out, pod, 22, [0.6, 0.6, 0.58], 0)
  // the glazed barrel vault along the middle of the podium roof, and the glass pyramid at its end
  for (let k = 0; k < 10; k++) {
    const a0 = (k / 10) * Math.PI, a1 = ((k + 1) / 10) * Math.PI, R = 6
    const y0 = 22 + Math.sin(a0) * R, y1 = 22 + Math.sin(a1) * R, x0 = Math.cos(a0) * R, x1 = Math.cos(a1) * R
    out.quad([[x0 - 6, y0, -20], [x1 - 6, y1, -20], [x1 - 6, y1, 18], [x0 - 6, y0, 18]], [(x0 + x1) / 2 / R, Math.sin((a0 + a1) / 2), 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.5, 0.62, 0.66], glass)
  }
  prism(out, 22, 24, 22, 30, 7, 4, [0.55, 0.66, 0.7], glass, 0.2)
  // the two towers: [centre x, z, half x, half z]
  for (const [cx, cz, hx, hz] of [[-13, -29, 24, 12], [26, 4, 12, 22]] as [number, number, number, number][]) {
    const shaft = [{ x: cx - hx, z: cz - hz }, { x: cx + hx, z: cz - hz }, { x: cx + hx, z: cz + hz }, { x: cx - hx, z: cz + hz }]
    faceBand(out, shaft, 22, 74, { kind: 'bands', wall: PALE, glass: [0.22, 0.26, 0.3], floor: 3, solid: 0.35, material: 'concrete' })
    capPolygon(out, shaft, 74, PALE, 0)
    // stacked balconies down the long faces
    const along = hx > hz
    for (let y = 25; y < 74; y += 3) {
      for (const s of [-1, 1]) {
        if (along) box(out, cx, y, cz + s * (hz + 0.7), hx * 0.8, 0.09, 0.7, PALE, conc)
        else box(out, cx + s * (hx + 0.7), y, cz, 0.7, 0.09, hz * 0.8, PALE, conc)
      }
    }
    // the round drum, the stepped crown, the finial
    const r = Math.min(hx, hz) * 0.95
    prism(out, cx, cz, 74, 86, r, 24, PALE, conc)
    for (let k = 0; k < 6; k++) prism(out, cx, cz, 75 + k * 2, 75.4 + k * 2, r + 0.2, 24, [0.24, 0.27, 0.3], glass)
    prism(out, cx, cz, 86, 89, r * 0.8, 24, GREY, conc)
    prism(out, cx, cz, 89, 91.5, r * 0.55, 24, GREY, conc)
    prism(out, cx, cz, 91.5, 97, 0.5, 8, GREY, surfaceTag('metal'), 0.05)
  }
}

/**
 * HILLS PLAZA's tower (345 Spear, 1990), rising out of the old Hills Bros. coffee works: cream stone with punched
 * windows on a red-brick base, stepping back near the top, a stepped crown (owner, 2026-10-06: "red-brick-and-white-
 * stone … with a stepped white tower in the middle"). It was drawn as a 14 m brick loft.
 */
export function hillsPlazaTower(out: MeshBuilder, fit: Fit): void {
  const STONE: Face = { kind: 'punched', wall: [0.9, 0.87, 0.8], glass: [0.18, 0.2, 0.24], floor: 3.7, pitch: 2.6, solid: 0.45, material: 'ashlar' }
  tower(out, fit, {
    height: 50,
    base: { height: 8, face: { kind: 'punched', wall: [0.56, 0.29, 0.21], glass: [0.16, 0.17, 0.19], floor: 4, pitch: 3, solid: 0.5, arched: true, material: 'brick' } },
    tiers: [{ to: 0.8, face: STONE }, { to: 0.92, inset: 1.6, face: STONE }, { to: 1, inset: 1.6, face: STONE }],
    crown: { kind: 'stepped', steps: 2, height: 2.4, inset: 1.2, face: STONE },
  })
}

/**
 * THE GRAVEL GARDENS between One Steuart Lane and 201 Spear (OSM ways 1295386895 and 1295386898, `surface=compacted`;
 * owner, 2026-10-06: "there's also a plaza between those buildings" — grey gravel under the trees, low black stone
 * planter walls with bench caps, inverted-cone lamps). Standalone, local x east, z north, about (1822, −195).
 */
const GRAVEL_BEDS: [number, number][][] = [
  [[1809.9, -196.7], [1825.3, -181.0], [1828.0, -183.6], [1822.4, -189.2], [1824.8, -191.5], [1821.0, -195.4], [1814.9, -201.6]],
  [[1839.5, -185.0], [1829.5, -175.3], [1826.0, -178.9], [1832.1, -184.7], [1806.0, -211.7], [1812.6, -218.1], [1822.9, -207.5], [1828.3, -199.3], [1835.8, -190.1]],
]
export function steuartGravelGardens(out: MeshBuilder, fit: Fit): void {
  const v0 = out.positions.length
  const C = { x: 1822, z: -195 }
  const BLACK: Rgb = [0.13, 0.13, 0.14], CAP: Rgb = [0.24, 0.23, 0.22], GRAVEL: Rgb = [0.48, 0.47, 0.44]
  const granite = surfaceTag('granite')
  for (const bed of GRAVEL_BEDS) {
    const ring = bed.map(([x, z]) => ({ x: x - C.x, z: z - C.z }))
    let a = 0
    for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; a += p.x * q.z - q.x * p.z }
    const ccw = a > 0 ? ring : [...ring].reverse()
    capPolygon(out, ccw, 0.08, GRAVEL, surfaceTag('rock'))
    // the low black stone walls along the bed's edges, a paler bench cap on top; a gap now and then to walk in
    for (let i = 0; i < ccw.length; i++) {
      const p = ccw[i], q = ccw[(i + 1) % ccw.length], L = Math.hypot(q.x - p.x, q.z - p.z)
      if (L < 2.5 || i % 3 === 2) continue
      const ux = (q.x - p.x) / L, uz = (q.z - p.z) / L, mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2
      const ang = Math.atan2(uz, ux)
      const part = (h: number, y: number, w: number, c: Rgb): void => {
        const hx = L / 2 - 0.3, hz = w
        const cs = Math.cos(ang), sn = Math.sin(ang)
        const P = (sx: number, sy: number, sz: number): [number, number, number] => [mx + cs * hx * sx - sn * hz * sz, y + h * (sy + 1) / 2, mz + sn * hx * sx + cs * hz * sz]
        for (const [n, q4] of [[[0, 1, 0], [P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1)]], [[-sn, 0, cs], [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)]], [[sn, 0, -cs], [P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1)]],
          [[cs, 0, sn], [P(1, -1, 1), P(1, -1, -1), P(1, 1, -1), P(1, 1, 1)]], [[-cs, 0, -sn], [P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1)]]] as [[number, number, number], [number, number, number][]][]) {
          out.quad(q4, n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, granite)
        }
      }
      part(0.42, 0, 0.22, BLACK)
      part(0.06, 0.42, 0.28, CAP)
    }
  }
  // the inverted-cone lamps along the walk between the beds
  for (const [x, z] of [[1818, -186], [1830, -192], [1811, -207], [1826, -176]] as [number, number][]) {
    const lx = x - C.x, lz = z - C.z
    prism(out, lx, lz, 0, 4.2, 0.07, 8, BLACK, surfaceTag('metal'))
    prism(out, lx, lz, 4.2, 4.9, 0.12, 12, BLACK, surfaceTag('metal'), 0.45)
    prism(out, lx, lz, 4.9, 4.95, 0.45, 12, [0.95, 0.93, 0.85], 0)
    box(out, lx, 0.1, lz, 0.25, 0.1, 0.25, BLACK, 0)
  }
  drapeOn(out, fit, v0)
}

export const EMBARCADERO_SOUTH: Record<string, (out: MeshBuilder, fit: Fit) => void> = { infinityTower, twoFolsom, twoOOneSpear, oneSteuartLane, towersAtRincon, hillsPlazaTower, steuartGravelGardens }
