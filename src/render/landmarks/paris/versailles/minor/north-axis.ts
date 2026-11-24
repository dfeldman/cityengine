/**
 * VERSAILLES, THE NORTH AXIS: the descent from the Parterre du Nord to the Bassin de Neptune (owner, 2026-11-24; group "north-axis"
 * of docs/landmarks/VERSAILLES_MINOR_MONUMENTS.md). Four builders, one per manifest entry, all in the model frame x east, z north
 * (front 180), origin at the entry's lat/lon, the ground read from `fit.groundAt` (else `fit.grade`):
 *   - versaillesPyramide: the Bassin de la Pyramide (OSM way/124531640, ~10 m radius), Girardon's four tiered basins (1670s)
 *     on a stepped island, the lowest carried by four tritons, the next by crayfish, then dolphins; a stone rim round the pool.
 *   - versaillesNymphes: the Bain des Nymphes de Diane (way/23707418, a 13.8 m square turned 21.7 degrees off north with the Allée
 *     d'Eau): a stone rim and the retaining wall on its far side with Girardon's lead relief (1668-70) set in a moulded frame.
 *   - versaillesAlleeEau: the Allée d'Eau (way/124531622, 132 m long, 22.05 degrees east of north): its 22 small round white-marble
 *     basins of the Marmousets, 7 pairs along the walk and 4 more pairs fanning out at its foot, each holding three bronze children
 *     (stand-in: a low drum and three small figures). The nodes' own positions (the "Trois ..." amenity=fountain points) are the table.
 *   - versaillesDragon: the Bassin du Dragon (way/124531629, 20 m radius): a stone curb, a central rock plinth for the gilt-lead
 *     dragon and four plinths for the dolphin-and-putti groups (a stand-in each; Modly's, see the queue file).
 * The bake draws the pool water of the Pyramide, Nymphes and Dragon (OSM water) and tools/versailles-fountains.py the jets; so
 * those three get rims and sculpture only. The 22 small basins have no OSM water polygon, so each draws its own sheet.
 * Measured: positions (OSM), radii (OSM rings). Guessed: every height and rim width, the tier radii (from Commons photos), which
 * side of the Nymphes holds the relief (the far side, facing the Pyramide), the Dragon's four groups' radius.
 */
import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { boxAlong } from '../../../parts.ts'
import { capPolygonWithHoles } from '../../../../buildings.ts'
import { ccw, FIXED, walls, type P2 } from '../../monuments/common.ts'
import { circle } from '../../monuments/plaza-common.ts'
import { fountainBowl } from '../../monuments/minor/monument-kit.ts'

const MARBLE = hex('#e4dfd2'), STONE = hex('#d6cdb6'), LEAD = hex('#4f5753'), BRONZE = hex('#4d4130'), GILT = hex('#a8893f'), WATER = hex('#7fa3ad')

/** The tunables. Metres. */
export const NA = {
  /** the pool rims: outer radius, width, height over the ground (the Pyramide's and the Dragon's) */
  pyr: { r: 10.2, rim: 0.9, h: 0.45, island: 3.6, islandH: 0.5,
    /** the four tiers: bowl radius, depth, stem height under it (to the tier below's rim), stem radius */
    tiers: [{ r: 3.7, d: 0.9, stem: 0.9, sr: 0.9 }, { r: 2.8, d: 0.75, stem: 0.85, sr: 0.5 }, { r: 2.0, d: 0.6, stem: 0.8, sr: 0.38 }, { r: 1.3, d: 0.5, stem: 0.7, sr: 0.28 }],
    /** the four tritons under the lowest bowl: ring radius, plinth section and height, stand-in figure height */
    tritons: { r: 2.6, sec: 0.75, h: 0.7, fig: 1.7 }, finialH: 1.0 },
  /** the Nymphes: half side, rim width and height, wall depth and height, the relief panel's width, height and base */
  nym: { half: 6.9, rim: 0.7, rimH: 0.45, wallT: 1.0, wallH: 3.0, panelW: 8.6, panelH: 1.7, panelY: 0.9, frame: 0.25, heading: 21.7 },
  /** the Marmousets basins: outer radius, rim width and height, water drop, drum radius and height, child height and ring radius */
  marm: { r: 1.9, rim: 0.3, h: 0.4, drum: 0.65, drumH: 0.5, child: 0.95, ring: 0.42 },
  /** the Dragon: rim as the Pyramide's, central plinth radius and height, dolphin groups' ring radius and plinth */
  dragon: { r: 20.4, rim: 0.7, h: 0.4, plinthR: 2.4, plinthH: 1.1, dragonH: 3.2, ringR: 8.5, gR: 1.1, gH: 0.8, groups: 4 },
}

type G2 = (x: number, z: number) => number
const groundOf = (fit: Fit): G2 => (x, z) => fit.groundAt ? fit.groundAt(x, z) : (fit.grade ?? 0)

/** A round stone rim: wall up to `h`, its top ring from r−w to r (no inner wall: nothing sees one). */
function ringRim(out: MeshBuilder, cx: number, cz: number, y: number, r: number, w: number, h: number, c: Rgb, sides = 48): void {
  const mv = (rr: number): P2[] => circle(rr, sides).map((p) => ({ x: p.x + cx, z: p.z + cz }))
  walls(out, mv(r), y - 0.35, y + h, c)
  capPolygonWithHoles(out, [ccw(mv(r)), [...ccw(mv(r - w))].reverse()], y + h, shade(c, 1.05), FIXED)
}

/** A stand-in figure: a tapered lead column with a head, over a base at (x, y, z), `h` high, `r` wide at the foot. */
function standIn(out: MeshBuilder, x: number, y: number, z: number, h: number, r: number, c: Rgb): void {
  prism(out, x, z, y, y + h * 0.78, r, 8, c, FIXED, r * 0.55, true)
  prism(out, x, z, y + h * 0.78, y + h, r * 0.5, 8, shade(c, 1.1), FIXED, r * 0.3, true)
}

/** Where the Pyramide's four tritons stand (local x, y over the ground, z) and the height their model should have: the Modly attach points. */
export const PYRAMIDE_TRITONS = (): [number, number, number][] => [0, 1, 2, 3].map((i) => [Math.sin((i + 0.5) * Math.PI / 2) * NA.pyr.tritons.r, NA.pyr.islandH + NA.pyr.tritons.h, Math.cos((i + 0.5) * Math.PI / 2) * NA.pyr.tritons.r])

export function versaillesPyramide(out: MeshBuilder, fit: Fit): void {
  const P = NA.pyr, g = groundOf(fit)(0, 0)
  ringRim(out, 0, 0, g, P.r, P.rim, P.h, STONE)
  // the island: two low round steps in the pool
  prism(out, 0, 0, g - 0.3, g + P.islandH * 0.55, P.island, 28, shade(STONE, 0.95), FIXED, P.island, true)
  prism(out, 0, 0, g + P.islandH * 0.55, g + P.islandH, P.island - 0.45, 28, STONE, FIXED, P.island - 0.45, true)
  let y = g + P.islandH
  // the four tritons' plinths and stand-ins, carrying the lowest bowl
  const T = P.tritons
  for (let i = 0; i < 4; i++) {
    const a = (i + 0.5) * Math.PI / 2, x = Math.sin(a) * T.r, z = Math.cos(a) * T.r
    block(out, x - T.sec / 2, x + T.sec / 2, z - T.sec / 2, z + T.sec / 2, y, y + T.h, shade(MARBLE, 0.95))
    standIn(out, x, y + T.h, z, T.fig, 0.32, LEAD)
  }
  y += T.fig * 0.85
  // the tiers: central shaft, bowl, repeat; crayfish (second) and dolphins (third) are small stand-ins round the stems
  P.tiers.forEach((t, k) => {
    prism(out, 0, 0, y - 0.05, y + (k === 0 ? 0.5 : 0.1), t.sr * 1.2, 20, MARBLE, FIXED, t.sr * 1.2, true)
    const top = fountainBowl(out, 0, 0, y, t.r, { depth: t.d, stem: t.sr, body: MARBLE, water: WATER })
    if (k < 3) {
      const nx = P.tiers[k + 1]
      prism(out, 0, 0, top - t.d * 0.6, top + t.stem, nx.sr, 16, MARBLE, FIXED, nx.sr * 0.8, true)
      if (k >= 1) for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + k * 0.5, rr = nx.r * 0.7
        standIn(out, Math.sin(a) * rr, top - 0.02, Math.cos(a) * rr, t.stem * 0.9, 0.16, shade(LEAD, 1.05))
      }
      y = top + t.stem
    } else {
      lathe(out, 0, 0, [[0.1, top], [0.35, top + 0.25], [0.2, top + 0.55], [0.3, top + 0.8], [0.0, top + P.finialH]], 14, MARBLE)
    }
  })
}

/** Where the Dragon's central gilt-lead group and its four dolphin groups stand (local x, y over the ground, z). */
export const DRAGON_AT = (): { dragon: [number, number, number]; groups: [number, number, number][] } => {
  const D = NA.dragon
  return { dragon: [0, D.plinthH, 0], groups: Array.from({ length: D.groups }, (_, i) => { const a = (i + 0.5) * 2 * Math.PI / D.groups; return [Math.sin(a) * D.ringR, D.gH, Math.cos(a) * D.ringR] as [number, number, number] }) }
}

export function versaillesDragon(out: MeshBuilder, fit: Fit): void {
  const D = NA.dragon, g = groundOf(fit)(0, 0), at = DRAGON_AT()
  ringRim(out, 0, 0, g, D.r, D.rim, D.h, STONE, 64)
  // central plinth: two round steps and a rock-like drum, the dragon's stand-in coiled on it
  prism(out, 0, 0, g - 0.3, g + D.plinthH * 0.4, D.plinthR + 0.7, 24, shade(STONE, 0.92), FIXED, D.plinthR + 0.7, true)
  prism(out, 0, 0, g + D.plinthH * 0.4, g + D.plinthH, D.plinthR, 20, STONE, FIXED, D.plinthR * 0.8, true)
  // stand-in dragon: a gilt coil (three stacked rings tapering) and a raised head
  for (let k = 0; k < 3; k++) prism(out, 0, 0, g + D.plinthH + k * 0.55, g + D.plinthH + (k + 1) * 0.55, 1.5 - k * 0.3, 14, GILT, FIXED, 1.3 - k * 0.3, true)
  standIn(out, 0.2, g + D.plinthH + 1.6, 0, D.dragonH - 1.4, 0.45, GILT)
  for (const [x, y, z] of at.groups) {
    prism(out, x, z, g - 0.3, g + y, D.gR, 12, shade(STONE, 0.9), FIXED, D.gR * 0.8, true)
    standIn(out, x, g + y, z, 1.6, 0.45, GILT)
  }
}

// ---- the Nymphes ----
const rot = (u: number, w: number, hd: number): { x: number; z: number } => ({ x: u * Math.cos(hd) + w * Math.sin(hd), z: -u * Math.sin(hd) + w * Math.cos(hd) })

export function versaillesNymphes(out: MeshBuilder, fit: Fit): void {
  const N = NA.nym, hd = N.heading * Math.PI / 180, g = groundOf(fit)(0, 0), H = N.half
  const box = (u: number, w: number, hu: number, hw: number, y0: number, y1: number, c: Rgb): void => {
    const p = rot(u, w, hd)
    boxAlong(out, p.x, (y0 + y1) / 2, p.z, hu, (y1 - y0) / 2, hw, hd, c, FIXED)
  }
  // the rim: four slabs round the square
  for (const s of [-1, 1]) {
    box(0, s * (H + N.rim / 2), H + N.rim, N.rim / 2, g - 0.35, g + N.rimH, STONE)
    box(s * (H + N.rim / 2), 0, N.rim / 2, H, g - 0.35, g + N.rimH, STONE)
  }
  // the retaining wall on the far (north-east) side, a plinth, the wall, a coping; the panel set in a moulded frame
  const w0 = H + N.rim, wc = w0 + N.wallT / 2, wl = H + N.rim + 1.4
  box(0, wc, wl, N.wallT / 2, g - 0.35, g + N.wallH, shade(STONE, 0.98))
  box(0, w0 - 0.05, wl + 0.1, 0.1, g + N.wallH - 0.1, g + N.wallH + 0.25, shade(STONE, 1.06))
  box(0, wc, wl + 0.2, N.wallT / 2 + 0.2, g + N.wallH + 0.15, g + N.wallH + 0.4, shade(STONE, 1.08))
  const py0 = g + N.panelY, py1 = py0 + N.panelH, f = N.frame, pw = N.panelW / 2
  box(0, w0 - 0.04, pw + f, 0.05, py0 - f, py1 + f, shade(STONE, 1.05))
  box(0, w0 - 0.09, pw, 0.05, py0, py1, LEAD)
  // the relief stand-in: a procession of low figures on the panel (Girardon's seven nymphs, bathing and attending Diana)
  for (let i = 0; i < 7; i++) {
    const u = -pw + (i + 0.5) * (N.panelW / 7), hh = N.panelH * (0.55 + 0.25 * ((i * 5) % 3) / 2)
    box(u, w0 - 0.2, 0.28, 0.1, py0 + 0.1, py0 + 0.1 + hh, shade(LEAD, 1.2))
    box(u, w0 - 0.2, 0.17, 0.1, py0 + 0.1 + hh, py0 + 0.1 + hh + 0.25, shade(LEAD, 1.3))
  }
}

// ---- the Allée d'Eau ----
/** The 22 basins as (along, across) of the Allée's axis from its south end, m: 7 pairs on the walk then four pairs fanning out below (the OSM "Trois ..." nodes). */
export const MARM_UV: [number, number][] = [
  [9.2, 4.8], [9.2, -6.3], [28.1, 4.8], [28.1, -6.3], [47, 4.8], [47, -6.3], [65.9, 4.8], [65.9, -6.4], [85, 4.9], [85, -6.5],
  [103.9, 4.9], [103.9, -6.6], [122.7, 4.9], [122.7, -6.6], [124.4, 14.2], [124.3, -14.2], [133.2, 19.3], [132.8, -20], [144.7, 29.1], [144.4, -31.3],
  [149.9, 34.6], [149.1, -36.5],
]
/** The Allée's axis: its south end in versailles-mini metres (x east, z north), bearing off north, and the entry's centre on it (m along). */
export const ALLEE = { x0: -413.456, z0: 268.882, bearing: 22.0547, mid: 80 }

/** The Marmousets basins' centres in the entry's frame (x east, z north), for attaching their bronze groups. */
export const marmousetCentres = (): [number, number][] => {
  const b = ALLEE.bearing * Math.PI / 180, ux = Math.sin(b), uz = Math.cos(b)
  return MARM_UV.map(([u, v]) => [(u - ALLEE.mid) * ux + v * uz, (u - ALLEE.mid) * uz - v * ux])
}

export function versaillesAlleeEau(out: MeshBuilder, fit: Fit): void {
  const M = NA.marm, g = groundOf(fit)
  for (const [x, z] of marmousetCentres()) {
    const y = g(x, z)
    ringRim(out, x, z, y, M.r, M.rim, M.h, MARBLE, 28)
    // the water sheet (the basins have no OSM water polygon) just under the rim, and the drum under the group
    prism(out, x, z, y + M.h - 0.1, y + M.h - 0.08, M.r - M.rim, 24, WATER, FIXED, M.r - M.rim, true)
    prism(out, x, z, y + M.h - 0.1, y + M.h - 0.1 + M.drumH, M.drum, 16, shade(MARBLE, 0.92), FIXED, M.drum * 0.85, true)
    for (let k = 0; k < 3; k++) {
      const a = k * 2 * Math.PI / 3 + x * 0.37
      standIn(out, x + Math.sin(a) * M.ring, y + M.h - 0.1 + M.drumH, z + Math.cos(a) * M.ring, M.child, 0.13, BRONZE)
    }
  }
}
