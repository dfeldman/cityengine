/**
 * 30 OTIS STREET (2023; OSM building:part way/1411169908, 26 storeys, 76 m), at Otis and South Van Ness. Tall-building
 * census 2026-10-05, from Mapillary on South Van Ness: a white tower gridded close in a fine white frame of floor bands
 * and mullions, with a full-height slot of blue glass down its South Van Ness (east) face. Was a dark grey `bauhaus`
 * punched box. Front 90.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { tower, towerRing } from '../tower.ts'
import { boxAlong, edgeAt, edgeFacing, faceOn } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const WHITE: Rgb = [0.9, 0.9, 0.88]
const GLASS: Rgb = [0.3, 0.4, 0.5]
const BLUE: Rgb = [0.32, 0.47, 0.64]

export function thirtyOtis(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 40 ? fit.height : 76
  tower(out, fit, {
    height: H,
    base: { height: 6, face: { kind: 'curtain', wall: [0.35, 0.36, 0.38], glass: [0.25, 0.3, 0.34], pitch: 3, floor: 6 } },
    tiers: [{ to: H, face: { kind: 'punched', wall: WHITE, glass: GLASS, pitch: 1.6, solid: 0.32, floor: 2.9, material: 'concrete' } }],
    roof: [0.6, 0.6, 0.6],
    crown: { kind: 'parapet', height: 1.2, colour: WHITE },
  })
  // the blue glass slot: a curtain over the middle of the east face, a hand proud of it, base to parapet (which edge
  // is east was measured: edgeFacing's default put it on the south face here)
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring, 90))
  const w = e.L * 0.4
  const a = { x: e.mid.x - e.tx * w / 2, z: e.mid.z - e.tz * w / 2 }, b = { x: e.mid.x + e.tx * w / 2, z: e.mid.z + e.tz * w / 2 }
  if (e.L > 4) faceOn(out, [a, b], 0, 6, H + 1.2, { kind: 'curtain', wall: BLUE, glass: BLUE, pitch: 1.5, floor: 2.9, material: 'metal' }, 0.12)
}

/**
 * BAY VIEW TOWER, 2601 Mission Street at 22nd (63 m; way/258640389). Same census, Mapillary on 22nd Street: a dark
 * office tower ribbed close with thin vertical fins, standing on a four-storey parking podium screened all round in
 * black steel mesh, the tower's soffit oversailing it. Was a generic `skyscraper` box.
 */
export function bayViewTower(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 40 ? fit.height : 63
  tower(out, fit, {
    height: H,
    base: { height: 13, face: { kind: 'fins', wall: [0.14, 0.14, 0.15], glass: [0.08, 0.08, 0.09], pitch: 1.2, solid: 0.3, depth: 0.15, floor: 3.2, material: 'metal' } },
    tiers: [{ to: H, face: { kind: 'fins', wall: [0.34, 0.36, 0.38], glass: [0.16, 0.19, 0.23], pitch: 1.5, solid: 0.22, depth: 0.35, floor: 3.6, material: 'metal' }, cornice: { depth: 0.6, height: 0.4, colour: [0.3, 0.31, 0.33] } }],
    roof: [0.4, 0.4, 0.4],
    crown: { kind: 'parapet', height: 1.4, colour: [0.3, 0.31, 0.33] },
  })
}


/**
 * YERBA BUENA LOFTS, 855 Folsom (Stanley Saitowitz, 2002; way/149086544). Unique-modern census 2026-10-05, Mapillary
 * on Folsom: an exposed concrete frame of floor slabs and columns, every cell of the grid either a FROSTED GLASS panel
 * (blue-grey, ribbed; some standing proud of the frame as a glass box) or left open as a dark recessed balcony — a
 * chequer that changes floor by floor. A glazed base behind a low wall. Was a `brutalist` box.
 */
export function yerbaBuenaLofts(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 15 ? fit.height : 26
  const CONC: Rgb = [0.72, 0.72, 0.7], FROST: Rgb = [0.68, 0.75, 0.79], DARK: Rgb = [0.16, 0.17, 0.18]
  const conc = surfaceTag('concrete'), glass = surfaceTag('glass')
  tower(out, fit, {
    height: H,
    base: { height: 4, face: { kind: 'curtain', wall: [0.62, 0.62, 0.6], glass: [0.3, 0.4, 0.44], pitch: 3, floor: 4 } },
    tiers: [{ to: H, face: { kind: 'blank', wall: DARK, material: 'concrete' } }],
    roof: [0.5, 0.5, 0.5],
    crown: { kind: 'parapet', height: 0.6, colour: CONC },
  })
  const ring = towerRing(fit)
  const FL = 3.6, CELL = 4.2
  let k = 7
  const rnd = (): number => { k = (k * 1103515245 + 12345) & 0x7fffffff; return (k % 1000) / 1000 }
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 6) continue
    const n = Math.max(1, Math.round(e.L / CELL)), cw = e.L / n
    const at = (u: number, o: number): [number, number] => [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
    // the slabs, a hand proud of the infill
    for (let y = 4; y <= H + 0.01; y += FL) {
      const [x, z] = at(0, 0.15)
      boxAlong(out, x, y, z, e.L / 2, 0.2, 0.15, e.heading, CONC, conc)
    }
    for (let c = 0; c <= n; c++) {
      const [x, z] = at(-e.L / 2 + c * cw, 0.15)
      boxAlong(out, x, (4 + H) / 2, z, 0.2, (H - 4) / 2, 0.15, e.heading, CONC, conc)
    }
    // the cells: frosted glass flush, a glass box proud, or open
    for (let y = 4; y + FL <= H + 0.01; y += FL) {
      for (let c = 0; c < n; c++) {
        const r = rnd()
        if (r < 0.32) continue
        const proud = r > 0.82
        const [x, z] = at(-e.L / 2 + (c + 0.5) * cw, proud ? 0.7 : 0.05)
        boxAlong(out, x, y + FL / 2, z, cw / 2 - 0.25, FL / 2 - 0.25, proud ? 0.65 : 0.05, e.heading, FROST, glass)
      }
    }
  }
}

/**
 * 8 OCTAVIA (Stanley Saitowitz, 2014; way/215705485), at Market and Octavia. Same census, Mapillary on Octavia: five
 * storeys of blue-silver aluminium, the floors banded, each bay either a flat panel or a screen of thin vertical
 * louvres that the residents slide — so the facade is a shifting patchwork of plain and striped — over a glazed ground
 * floor. Was a `bauhaus` box.
 */
export function eightOctavia(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 10 && fit.height < 25 ? fit.height : 17   // five storeys; anything else is not this building
  const PANEL: Rgb = [0.56, 0.66, 0.72], LOUVRE: Rgb = [0.72, 0.78, 0.82], DARK: Rgb = [0.2, 0.24, 0.27]
  const metal = surfaceTag('metal')
  tower(out, fit, {
    height: H,
    base: { height: 4, face: { kind: 'curtain', wall: [0.4, 0.42, 0.44], glass: [0.18, 0.22, 0.25], pitch: 3.5, floor: 4 } },
    tiers: [{ to: H, face: { kind: 'blank', wall: DARK, material: 'metal' } }],
    roof: [0.5, 0.5, 0.5],
    crown: { kind: 'parapet', height: 0.5, colour: PANEL },
  })
  const ring = towerRing(fit)
  const FL = 3.1, CELL = 2.6
  let k = 11
  const rnd = (): number => { k = (k * 1103515245 + 12345) & 0x7fffffff; return (k % 1000) / 1000 }
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 5) continue
    const n = Math.max(1, Math.round(e.L / CELL)), cw = e.L / n
    const at = (u: number, o: number): [number, number] => [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
    for (let y = 4; y + FL <= H + 0.01; y += FL) {
      for (let c = 0; c < n; c++) {
        const u = -e.L / 2 + (c + 0.5) * cw
        if (rnd() < 0.55) {
          const [x, z] = at(u, 0.06)
          boxAlong(out, x, y + FL / 2, z, cw / 2 - 0.04, FL / 2 - 0.08, 0.05, e.heading, PANEL, metal)
        } else {
          // (a pale backing panel with three fins on it: six fins a bay came to 39 000 triangles, over the budget)
          const [bx, bz] = at(u, 0.05)
          boxAlong(out, bx, y + FL / 2, bz, cw / 2 - 0.04, FL / 2 - 0.08, 0.04, e.heading, DARK, 0)
          for (let f = 0; f < 3; f++) {
            const [x, z] = at(u - cw / 2 + (f + 0.5) * (cw / 3), 0.18)
            boxAlong(out, x, y + FL / 2, z, 0.06, FL / 2 - 0.08, 0.12, e.heading, LOUVRE, metal)
          }
        }
      }
      const [x, z] = at(0, 0.1)
      boxAlong(out, x, y, z, e.L / 2, 0.08, 0.1, e.heading, LOUVRE, metal)
    }
  }
}

export const THIRTY_OTIS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { thirtyOtis, bayViewTower, yerbaBuenaLofts, eightOctavia }
