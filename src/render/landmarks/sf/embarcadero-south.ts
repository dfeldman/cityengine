/**
 * THE EMBARCADERO SOUTH OF MARKET, from Mapillary (owner, 2026-10-06: "really we should do the same thing along
 * embarcadero that we did on market — look at EVERY building on mapillary and do a custom build"; "the two tall curved
 * buildings are identical i believe"). Raised from their own fitted footprints with the tower grammar.
 *
 * - infinityTower: THE INFINITY I and II (301 Main, 338 Spear; 2008), one design twice — green glass ellipses, the
 *   floors drawn as thin pale slab edges across the glass, two setbacks near the top, a parapet. They were two
 *   different generic glass boxes.
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
 * THE TOWERS AT RINCON / RINCON CENTER (1989, Spear/Howard/Steuart): two 93 m residential wings on a six-storey
 * granite podium, a one-storey round court between them, the old Rincon Annex post office on the north half of the
 * block (its own model, rinconAnnex). From the owner's Street View and aerial (2026-10-06: "rincon center is huge"):
 * grey granite and glass podium on tall square piers; the wings pale, banded with stacked balconies, each stepping
 * back near the top to a rounded glass lantern and a mast. Built on OSM's own parts (ways 944891683-88, 1301393950/1),
 * in the frame of the manifest's centre (1720, −113).
 */
const RINCON_C = { x: 1720, z: -113 }
const rp = (pts: [number, number][]): { x: number; z: number }[] => {
  const r = pts.map(([x, z]) => ({ x: x - RINCON_C.x, z: z - RINCON_C.z }))
  let a = 0
  for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
  return a > 0 ? r : r.reverse()
}
const RINCON_PODIUM = [
  rp([[1709, -81], [1725, -65], [1744, -83], [1732, -95], [1737, -101], [1737, -115], [1733, -119], [1746, -131], [1736, -141], [1722, -128], [1715, -134], [1703, -134], [1697, -128], [1684, -141], [1667, -123], [1682, -107], [1706, -131], [1715, -124], [1713, -122], [1718, -116], [1723, -111], [1733, -110], [1733, -105]]),
  rp([[1695, -152], [1724, -153], [1727, -155], [1712, -169]]),
  rp([[1755, -94], [1771, -111], [1760, -122], [1758, -120], [1758, -103]]),
]
const RINCON_TOWERS = [
  rp([[1684, -141], [1697, -128], [1703, -134], [1715, -134], [1722, -128], [1736, -141], [1724, -153], [1712, -154], [1704, -154], [1695, -152]]),
  rp([[1746, -131], [1733, -119], [1737, -115], [1737, -101], [1732, -95], [1744, -83], [1755, -94], [1758, -103], [1758, -120]]),
]
const RINCON_COURT = [
  rp([[1723, -111], [1733, -105], [1709, -81], [1707, -83], [1709, -93], [1715, -97], [1717, -104]]),
  rp([[1713, -122], [1706, -115], [1698, -113], [1694, -108], [1682, -107], [1706, -131], [1711, -132], [1715, -124]]),
]
export function towersAtRincon(out: MeshBuilder, _fit: Fit): void {
  const GRANITE: Rgb = [0.8, 0.79, 0.76], PALE: Rgb = [0.86, 0.86, 0.84]
  const conc = surfaceTag('concrete')
  const PODIUM_H = 22
  for (const ring of RINCON_PODIUM) {
    faceBand(out, ring, 0, 6, { kind: 'fins', wall: GRANITE, glass: [0.18, 0.2, 0.22], pitch: 6, solid: 0.3, depth: 0.6, material: 'concrete' })
    faceBand(out, ring, 6, PODIUM_H, { kind: 'bands', wall: GRANITE, glass: [0.3, 0.36, 0.42], floor: 4, solid: 0.6, material: 'concrete' })
    capPolygon(out, ring, PODIUM_H, [0.6, 0.6, 0.58], 0)
  }
  // the round court between the wings: a one-storey glazed ring under the podium's edge
  for (const ring of RINCON_COURT) {
    faceBand(out, ring, 0, 3.5, { kind: 'curtain', wall: [0.8, 0.8, 0.78], glass: [0.3, 0.38, 0.42], pitch: 2 })
    capPolygon(out, ring, 3.5, [0.62, 0.6, 0.57], 0)
  }
  const shrink = (ring: { x: number; z: number }[], d: number): { x: number; z: number }[] => {
    const cx = ring.reduce((a, p) => a + p.x, 0) / ring.length, cz = ring.reduce((a, p) => a + p.z, 0) / ring.length
    return ring.map((p) => { const L = Math.hypot(p.x - cx, p.z - cz) || 1; const k = Math.max(0.2, (L - d) / L); return { x: cx + (p.x - cx) * k, z: cz + (p.z - cz) * k } })
  }
  const BAND: Face = { kind: 'bands', wall: PALE, glass: [0.42, 0.47, 0.52], floor: 3, solid: 0.6, material: 'concrete' }
  for (const ring of RINCON_TOWERS) {
    faceBand(out, ring, PODIUM_H, 76, BAND)
    // the stacked balconies: a slab every floor, standing proud of the wall round the whole wing
    for (let y = PODIUM_H + 3; y < 76; y += 3) {
      const lip = shrink(ring, -1.1)
      faceBand(out, lip, y, y + 0.22, { kind: 'blank', wall: PALE, material: 'concrete' })
    }
    // stepping back: two tiers, then the rounded glass lantern and its mast
    const t1 = shrink(ring, 3), t2 = shrink(ring, 6)
    capPolygon(out, ring, 76, PALE, 0)
    faceBand(out, t1, 76, 84, BAND)
    capPolygon(out, t1, 84, PALE, 0)
    faceBand(out, t2, 84, 90, { kind: 'curtain', wall: PALE, glass: [0.32, 0.4, 0.45], pitch: 1.6 })
    capPolygon(out, t2, 90, [0.7, 0.7, 0.68], 0)
    const cx = ring.reduce((a, p) => a + p.x, 0) / ring.length, cz = ring.reduce((a, p) => a + p.z, 0) / ring.length
    prism(out, cx, cz, 90, 93, 4, 20, [0.3, 0.36, 0.4], surfaceTag('glass'))
    prism(out, cx, cz, 93, 93.6, 4.4, 20, PALE, conc)
    prism(out, cx, cz, 93.6, 101, 0.25, 8, [0.6, 0.6, 0.6], surfaceTag('metal'), 0.05)
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

/**
 * 188 THE EMBARCADERO (Bayside Plaza, now Google's): a long curved front of white banded spandrels and blue ribbon
 * glazing, stepping back in terraces toward the top (Mapillary, 2026-10-06).
 */
export function baysidePlaza(out: MeshBuilder, fit: Fit): void {
  const BAND: Face = { kind: 'bands', wall: [0.9, 0.9, 0.88], glass: [0.3, 0.42, 0.55], floor: 3.8, solid: 0.42, material: 'concrete' }
  tower(out, fit, {
    height: 32,
    base: { height: 5, face: { kind: 'curtain', wall: [0.85, 0.85, 0.83], glass: [0.2, 0.25, 0.3], pitch: 3 } },
    tiers: [{ to: 0.7, face: BAND, cornice: { depth: 0.6 } }, { to: 0.86, inset: 2.2, face: BAND, cornice: { depth: 0.5 } }, { to: 1, inset: 2.2, face: BAND }],
    crown: { kind: 'flat' },
  })
}

/**
 * THE FRANCISCAN, Pier 43 1/2: a two-storey glass pavilion ringed by tall white angled fins under a wide flat roof
 * slab (Mapillary, 2026-10-06).
 */
export function franciscan(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  faceBand(out, ring, 0, 8, { kind: 'fins', wall: [0.95, 0.95, 0.93], glass: [0.2, 0.26, 0.3], floor: 4, pitch: 2.2, solid: 0.2, depth: 0.9, material: 'concrete' })
  const lip = ring.map((p) => ({ x: p.x * 1.12, z: p.z * 1.12 }))
  faceBand(out, lip, 8, 8.8, { kind: 'blank', wall: [0.95, 0.95, 0.93], material: 'concrete' })
  capPolygon(out, lip, 8.8, [0.85, 0.85, 0.83], 0)
  capPolygon(out, ring, 0.02, [0.6, 0.6, 0.58], 0)
}

export const EMBARCADERO_SOUTH: Record<string, (out: MeshBuilder, fit: Fit) => void> = { infinityTower, twoOOneSpear, oneSteuartLane, towersAtRincon, hillsPlazaTower, steuartGravelGardens, baysidePlaza, franciscan }
