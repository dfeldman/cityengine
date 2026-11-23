import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import { beam } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * LE MAUSOLÉE DE GASPARD MONGE (Père-Lachaise, division 18; Wikidata Q5526576; OSM way 1211895435, 5.5 x 5.7 m, tagged
 * building=service + historic=tomb). Pierre Clochar's tomb of 1820s: a rubble-stone crypt with ashlar corner piers and a
 * grilled door in a framed surround on the south face; its flat roof is a terrace behind an iron X-braced railing, and on
 * the terrace stands a small open Egyptian-style aedicule (two jambs, a lintel with a winged disc and a cavetto cornice)
 * sheltering a marble bust of Monge on a plain pedestal (Modly `tombe-monge-buste`, attached at BUST_AT).
 * Frame: −z the door front, x across, y up from the ground (G). Dimensions are scaled by eye off Commons photographs
 * (door grille ~0.95 m wide, OSM ring 5.5 x 5.7 m), not surveyed.
 */
export const HX = 2.75
export const HZ = 2.85

// tunables (metres above the ground unless noted)
const BX = 2.7, BZ = 2.8                                  // body half-width / half-depth
const DECK = 2.7                                          // top of the coping = terrace floor
const COPE_H = 0.17, COPE_OUT = 0.06                      // coping band under the deck
const PIER = 0.55, PIER_TOP = 3.6, COURSE = 0.37         // ashlar corner piers: size, top (cap included), course height
const DOOR_W = 0.9, DOOR_H = 2.05, GRILLE_W = 0.48, GRILLE_H = 1.45  // surround half-width/height, grille half-width/height
const RAIL_H = 0.88, RAIL_PITCH = 1.55                    // railing height above deck; approximate panel width
const AX = 1.05, AZ = 0.85, JAMB = 0.5                    // aedicule half-width, half-depth, jamb thickness
const A_OPEN = 2.05, A_LINTEL = 0.6                       // opening height, lintel+cornice height above the deck
const PED_H = 0.95                                        // bust pedestal height above the deck
export const BUST_AT: [number, number, number] = [0, G + DECK + PED_H, 0]

const RUBBLE: Rgb = hex('#a39673')
const RUBBLE_D: Rgb = hex('#8d8062')
const ASHLAR: Rgb = hex('#bfb8a4')
const PALE: Rgb = hex('#cdc7b4')
const DARK: Rgb = hex('#8b8675')
const VOID: Rgb = hex('#1d1b1a')
const IRON: Rgb = hex('#1e1f21')
const MARBLE: Rgb = hex('#d9d6cc')
const GROUND: Rgb = hex('#7e7a5c')
const UVS: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A flat vertical disc in the plane z = zc, facing sign s (-1 front), n sides. */
function discZ(q: MeshBuilder, cx: number, cy: number, zc: number, r: number, s: number, c: Rgb, n = 14): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
    q.quad([[cx, cy, zc], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, zc], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, zc], [cx, cy, zc]],
      [0, 0, s], UVS, c, 0)
  }
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -HX, HX, -HZ, HZ, y(-0.02), y(0.03), GROUND)

  // the rubble body, with a few darker mortar bands so it reads as coursed rubble
  block(q, -BX, BX, -BZ, BZ, y(0), y(DECK - COPE_H), RUBBLE)
  for (let k = 1; k < 6; k++) {
    const v = k * ((DECK - COPE_H) / 6)
    block(q, -BX + PIER - 0.01, BX - PIER + 0.01, -BZ - 0.012, BZ + 0.012, y(v), y(v + 0.035), RUBBLE_D)
    block(q, -BX - 0.012, BX + 0.012, -BZ + PIER - 0.01, BZ - PIER + 0.01, y(v + 0.1), y(v + 0.135), RUBBLE_D)
  }
  // coping band and the deck
  block(q, -BX - COPE_OUT, BX + COPE_OUT, -BZ - COPE_OUT, BZ + COPE_OUT, y(DECK - COPE_H), y(DECK), ASHLAR)

  // ashlar corner piers in alternating courses, capped
  const n = Math.round((PIER_TOP - 0.12) / COURSE)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x0 = sx > 0 ? BX - PIER : -BX, z0 = sz > 0 ? BZ - PIER : -BZ
    for (let k = 0; k < n; k++) {
      const v0 = (k * (PIER_TOP - 0.12)) / n, v1 = ((k + 1) * (PIER_TOP - 0.12)) / n - 0.012
      block(q, x0, x0 + PIER, z0, z0 + PIER, y(v0), y(v1), k % 2 ? ASHLAR : shade(ASHLAR, 0.95))
    }
    block(q, x0 - 0.05 * (sx < 0 ? 1 : 0), x0 + PIER + 0.05 * (sx > 0 ? 1 : 0), z0 - 0.05 * (sz < 0 ? 1 : 0), z0 + PIER + 0.05 * (sz > 0 ? 1 : 0),
      y(PIER_TOP - 0.12), y(PIER_TOP), PALE)
  }

  // the door on the south (−z) face: a framed surround, a recessed-looking dark grille with iron bars, a blank panel above
  const zf = -BZ
  block(q, -DOOR_W, DOOR_W, zf - 0.07, zf, y(0), y(DOOR_H), PALE)
  block(q, -GRILLE_W - 0.1, GRILLE_W + 0.1, zf - 0.075, zf - 0.07, y(0), y(GRILLE_H + 0.1), shade(PALE, 0.9))
  block(q, -GRILLE_W, GRILLE_W, zf - 0.085, zf - 0.075, y(0), y(GRILLE_H), VOID)
  for (let i = 0; i <= 8; i++) { const x = -GRILLE_W + (i * 2 * GRILLE_W) / 8; block(q, x - 0.012, x + 0.012, zf - 0.1, zf - 0.085, y(0), y(GRILLE_H), IRON) }
  for (let j = 0; j <= 8; j++) { const v = (j * GRILLE_H) / 8; block(q, -GRILLE_W, GRILLE_W, zf - 0.1, zf - 0.085, y(v), y(v + 0.024), IRON) }
  block(q, -GRILLE_W - 0.1, GRILLE_W + 0.1, zf - 0.08, zf - 0.07, y(GRILLE_H + 0.18), y(DOOR_H - 0.1), shade(PALE, 0.93))

  // the railing round the terrace edge, between the piers: top and bottom rails, posts and X braces
  const ry = DECK, rt = DECK + RAIL_H
  const rail = (a: [number, number], b: [number, number]): void => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.round(len / RAIL_PITCH))
    for (let i = 0; i <= m; i++) {
      const px = a[0] + ((b[0] - a[0]) * i) / m, pz = a[1] + ((b[1] - a[1]) * i) / m
      beam(q, [px, y(ry), pz], [px, y(rt), pz], 0.022, IRON)
      if (i < m) {
        const qx = a[0] + ((b[0] - a[0]) * (i + 1)) / m, qz = a[1] + ((b[1] - a[1]) * (i + 1)) / m
        beam(q, [px, y(ry + 0.08), pz], [qx, y(rt - 0.08), qz], 0.012, IRON)
        beam(q, [px, y(rt - 0.08), pz], [qx, y(ry + 0.08), qz], 0.012, IRON)
      }
    }
    beam(q, [a[0], y(rt), a[1]], [b[0], y(rt), b[1]], 0.026, IRON)
    beam(q, [a[0], y(ry + 0.08), a[1]], [b[0], y(ry + 0.08), b[1]], 0.02, IRON)
  }
  const ex = BX - PIER, ez = BZ - PIER, ei = 0.12      // railing runs between the piers, set in a little from the edge
  rail([-ex, -BZ + ei], [ex, -BZ + ei])
  rail([-ex, BZ - ei], [ex, BZ - ei])
  rail([-BX + ei, -ez], [-BX + ei, ez])
  rail([BX - ei, -ez], [BX - ei, ez])

  // the aedicule on the deck: two jambs, lintel with inscription band, winged disc, cavetto cornice, dark ceiling
  const ty = DECK
  block(q, -AX - 0.06, AX + 0.06, -AZ - 0.06, AZ + 0.06, y(ty), y(ty + 0.12), DARK)                  // base course
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -AX : AX - JAMB, x1 = x0 + JAMB
    for (let k = 0; k < 5; k++) {
      const v0 = 0.12 + (k * (A_OPEN - 0.12)) / 5, v1 = 0.12 + ((k + 1) * (A_OPEN - 0.12)) / 5 - 0.012
      block(q, x0, x1, -AZ, AZ, y(ty + v0), y(ty + v1), k % 2 ? ASHLAR : shade(ASHLAR, 0.93))
    }
    discZ(q, sx * (AX - JAMB / 2), y(ty + 1.0), -AZ - 0.012, 0.12, -1, DARK, 10)                     // weathered roundel on each jamb
  }
  const lt = ty + A_OPEN
  block(q, -AX, AX, -AZ, AZ, y(lt), y(lt + 0.3), ASHLAR)                                             // architrave with the name band
  block(q, -AX + 0.1, AX - 0.1, -AZ - 0.02, -AZ, y(lt + 0.06), y(lt + 0.22), shade(ASHLAR, 0.82))
  block(q, -AX + 0.1, AX - 0.1, AZ, AZ + 0.02, y(lt + 0.06), y(lt + 0.22), shade(ASHLAR, 0.82))
  block(q, -AX - 0.08, AX + 0.08, -AZ - 0.08, AZ + 0.08, y(lt + 0.3), y(lt + 0.42), PALE)            // cavetto cornice, stepped out
  block(q, -AX - 0.16, AX + 0.16, -AZ - 0.16, AZ + 0.16, y(lt + 0.42), y(lt + 0.52), PALE)
  block(q, -AX - 0.2, AX + 0.2, -AZ - 0.2, AZ + 0.2, y(lt + 0.52), y(lt + A_LINTEL), shade(PALE, 1.03))
  for (const s of [-1, 1]) {                                                                          // winged disc on each face of the cavetto
    const zz = s * (AZ + 0.085)
    discZ(q, 0, y(lt + 0.36), zz + s * 0.004, 0.09, s, DARK, 12)
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
      block(q, sx * (0.12 + i * 0.1) - 0.045, sx * (0.12 + i * 0.1) + 0.045, s < 0 ? zz - 0.012 : zz, s < 0 ? zz : zz + 0.012, y(lt + 0.33 - i * 0.012), y(lt + 0.4 - i * 0.02), DARK)
    }
  }
  block(q, -AX + JAMB, AX - JAMB, -AZ + 0.02, AZ - 0.02, y(lt - 0.02), y(lt), VOID)                  // dark soffit

  // the bust's pedestal: a plain white block on a square foot
  block(q, -0.26, 0.26, -0.26, 0.26, y(ty + 0.12), y(ty + 0.24), MARBLE)
  block(q, -0.2, 0.2, -0.2, 0.2, y(ty + 0.24), y(ty + PED_H - 0.06), MARBLE)
  block(q, -0.24, 0.24, -0.24, 0.24, y(ty + PED_H - 0.06), y(ty + PED_H), MARBLE)
}

export function tombeGaspardMonge(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
