import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { block, classicalColumn, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, fitted, palette, pedimentOn, rectOn } from '../palaces/common.ts'
import { boxOn, edgeFrame, pilaster, rect, traceryWindow } from '../monuments/gothic.ts'

/*
 * THE BOURSE DE COMMERCE (Le Camus de Mézières' corn exchange of 1767; Bélanger's iron dome; Blondel's rebuilding of 1889; the
 * Pinault Collection since 2021). The owner: "we don't seem to have the art museum at all"; it was a restyled round block.
 *
 * What a rider sees, going round it on the Rue de Viarmes or coming across the Jardin Nelson-Mandela:
 *
 * - the great round DRUM, a ring of giant pilasters with a tall round-headed window in every other bay and a small one over
 *   it, an entablature, a cornice and an attic (the bays' rhythm is from memory and from no count: 20 is what the frame carries);
 * - the zinc ROOF, an annulus to a ring ridge, with lucarnes in it, and from inside that ring the DOME, its lower part
 *   solid metal, its upper part glass, on iron ribs, green-grey;
 * - the PORTICO on the Rue de Viarmes: four columns in two pairs on a plinth, a pediment, a gabled wing running back to the drum;
 * - the MÉDICIS COLUMN, free-standing against the drum at its south-east, the last of Catherine de Médicis's hôtel: a fluted
 *   column with a spiral stair inside and an iron cage on top (31 m tall, from memory: OSM has no height).
 *
 * All of the sizes are OSM's, in this frame (osmium, 2026-10-30), centre on the circle (the ways' own boxes, not their
 * vertices' mean, which is pulled by the portico), −z the portico at bearing 291.5: way 19856722 the outline, r 33.2; relation
 * 20087916's outer way 1467306818, the roof to 19.4 m; way 227149360 the dome, r 20.4, to 34.8; way 1467306827 its glass
 * from 28.4, r 15.7; 1467306828 its crown at 36.3; 1467306819…824 the portico's plinths and columns at 17.3; 1467306825 its
 * pediment, 1467306826 its wing to 20.5; 942543401 the column. OSM's diameter makes it about 208 m round.
 */
const HX = 35
const HZ = 35
const R = 33.2
const EAVES = 17.6

const FLAT = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export function bourseCommerce(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

const p = palette('#dcd2bd')
const METAL: Rgb = hex('#6f8782')
const IRON: Rgb = hex('#4d605d')
const PANE_A: Rgb = hex('#3b4c4d')
const PANE_B: Rgb = hex('#4a5d5c')
const ZINC: Rgb = hex('#7c8a8b')
const METAL_TAG = surfaceTag('metal')

function draw(out: MeshBuilder): void {
  drum(out)
  roofRing(out)
  domeOver(out)
  portico(out)
  medicisColumn(out, 25.25, 22.55)
}

/** The drum: 40 flat facets, two to a bay; a window in one, a pilaster on the join; everything but the portico's bays. */
function drum(out: MeshBuilder): void {
  const n = 40
  const at = (i: number, r: number): { x: number; z: number } => {
    const a = ((i + 0.5) / n) * Math.PI * 2 + Math.PI
    return { x: Math.sin(a) * r, z: Math.cos(a) * r }
  }
  prism(out, 0, 0, -1.5, 0.9, R + 0.45, n, shade(p.stone, 0.88), FLAT, R + 0.45, false)
  prism(out, 0, 0, 0.9, 1.25, R + 0.45, n, shade(p.stone, 0.96), FLAT, R + 0.05, false)
  const centre = { x: 0, z: 0 }
  for (let i = 0; i < n; i++) {
    const fr = edgeFrame(out, at(i, R), at(i + 1, R), centre)
    rect(fr, 0, fr.L, 0.9, EAVES, 0, p.stone)
    const am = (Math.abs((((i + 1) % n) / n) * 360 - 0) + 360) % 360
    // the bays behind the portico, either side of −z, have only its wing to show
    const hidden = am < 25 || am > 335
    if (i % 2 === 0) {
      if (hidden) continue
      traceryWindow(fr, fr.L / 2, 2.1, 3.3, 9.4, { stone: p.trim, glass: p.glass, head: 'round', lights: 2, far: true, transoms: 2 })
      // a small square window over it, in its frame, under the entablature
      rect(fr, fr.L / 2 - 1.15, fr.L / 2 + 1.15, 12.6, 14.9, 0.05, p.trim)
      rect(fr, fr.L / 2 - 0.9, fr.L / 2 + 0.9, 12.85, 14.65, 0.08, p.glass)
      boxOn(fr, fr.L / 2 - 1.5, fr.L / 2 + 1.5, 11.75, 12.05, 0, 0.25, p.trim)
    } else {
      pilaster(fr, 0, 1.2, 15.6, 1.1, 0.42, p.stone)
      pilaster(fr, fr.L, 1.2, 15.6, 1.1, 0.42, p.stone)
    }
  }
  // the entablature, the cornice, the attic
  prism(out, 0, 0, 15.6, 16.35, R + 0.42, n, p.trim, FLAT, R + 0.42, false)
  prism(out, 0, 0, 16.35, 16.8, R + 0.42, n, shade(p.trim, 1.04), FLAT, R + 0.95, false)
  prism(out, 0, 0, 16.8, EAVES, R + 0.1, n, p.stone, FLAT, R + 0.1, false)
}

/** The zinc roof: up from the attic to a ring ridge, down inside to the dome's foot; lucarnes round its outer slope. */
function roofRing(out: MeshBuilder): void {
  const n = 40
  prism(out, 0, 0, EAVES, 19.4, R + 0.1, n, ZINC, METAL_TAG, 26.8, false)
  prism(out, 0, 0, 19.4, 18.1, 26.8, n, shade(ZINC, 0.82), METAL_TAG, 20.4, false)
  const k = 20
  for (let i = 0; i < k; i++) {
    const a = ((i + 1) / k) * Math.PI * 2 + Math.PI
    const r = 30.6
    const cx = Math.sin(a) * r
    const cz = Math.cos(a) * r
    const tx = Math.cos(a)
    const tz = -Math.sin(a)
    if (Math.abs(Math.sin(a)) < 0.2 && Math.cos(a) < 0) continue
    const fr = edgeFrame(out, { x: cx - tx * 0.85, z: cz - tz * 0.85 }, { x: cx + tx * 0.85, z: cz + tz * 0.85 }, { x: 0, z: 0 })
    boxOn(fr, 0, 1.7, 18, 19.5, -1.1, 0, p.trim)
    traceryWindow(fr, 0.85, 18.15, 1.1, 1.15, { stone: p.trim, glass: p.glass, head: 'round', lights: 1, far: true })
  }
}

/**
 * The dome, on OSM's rings: the solid metal to r 15.7 at 28.4 m, glass from there, the crown. Iron ribs on the meridians and
 * rings of iron at each course; flat bars, because a dome's ribs are most of its triangles otherwise.
 */
function domeOver(out: MeshBuilder): void {
  const sides = 32
  const prof: [number, number, Rgb][] = [
    [18, 20.4, METAL], [21.2, 19.5, shade(METAL, 0.96)], [24.2, 18.1, METAL], [26.6, 16.8, shade(METAL, 0.96)], [28.4, 15.7, IRON],
    [29, 15.1, PANE_A], [31, 12.5, PANE_B], [32.6, 9.6, PANE_A], [33.7, 6.8, IRON], [35.2, 4.6, PANE_B], [36.3, 0.4, IRON],
  ]
  for (let i = 0; i + 1 < prof.length; i++) {
    const [y0, r0, c] = prof[i]
    const [y1, r1] = prof[i + 1]
    prism(out, 0, 0, y0, y1, r0, sides, c, c === METAL ? METAL_TAG : FLAT, r1, i === prof.length - 2)
  }
  const ribs = 16
  for (let m = 0; m < ribs; m++) {
    const a = (m / ribs) * Math.PI * 2
    const sa = Math.sin(a)
    const ca = Math.cos(a)
    for (let i = 0; i + 1 < prof.length - 1; i++) {
      const [y0, r0] = prof[i]
      const [y1, r1] = prof[i + 1]
      const w = 0.2
      const up = (r: number, y: number, s: number): [number, number, number] => [sa * (r + 0.08) + ca * w * s, y, ca * (r + 0.08) - sa * w * s]
      out.quad([up(r0, y0, -1), up(r0, y0, 1), up(r1, y1, 1), up(r1, y1, -1)], [sa, 0.5, ca], UV, IRON, FLAT)
    }
  }
}

/** The portico on the Rue de Viarmes and the wing behind it. */
function portico(out: MeshBuilder): void {
  const m = -0.35
  // the wing back to the drum, under its own gable
  block(out, -6.4, 5.6, -33.5, -19.5, -1, 17.4, p.stone)
  block(out, -6.7, 5.9, -33.7, -19.5, 16.7, 17.5, p.trim)
  roof(out, -6.7, 5.9, -33.7, -19.5, 17.5, 3, 6.3, 0.01, ZINC)
  // the plinth under the columns, and the steps up to it
  block(out, -7.1, 6.4, -35.8, -33.4, -1, 1.5, shade(p.stone, 0.9))
  for (let i = 0; i < 4; i++) block(out, -6.8 + i * 0.1, 6.1 - i * 0.1, -35.8 - (4 - i) * 0.34, -35.8, -1, (i + 1) * 0.36, shade(p.stone, 0.86))
  // the doors, and the windows behind the columns
  archOn(out, '-z', -33.5, m, 1.5, 3.8, 9.5, p.dark)
  rectOn(out, '-z', -33.5, m - 2.4, m + 2.4, 11.6, 11.9, p.trim, 0.1)
  archOn(out, '-z', -33.5, m, 12.2, 3, 3.8, p.glass)
  for (const x of [-6.1, -4.5, 3.9, 5.4]) classicalColumn(out, x, -34.6, 1.5, 17.3, 0.62, p.stone, { order: 'corinthian', tier: 'mid', heading: Math.PI })
  // the entablature, and the pediment on it
  block(out, -7.2, 6.5, -35.9, -33.3, 17.3, 18.4, p.trim)
  block(out, -7.5, 6.8, -36.1, -33.3, 18.4, 18.8, shade(p.trim, 1.03))
  pedimentOn(out, '-z', -33.3, -7.5, 6.8, 18.8, 2.8, 2.8, p.trim)
}

/**
 * The Médicis Column: its pedestal and the fountain against it, the fluted shaft, its capital, and the iron cage on the
 * platform at the head, the astrologers' from memory. About 500 triangles, most of them the shaft's flutes.
 */
function medicisColumn(out: MeshBuilder, x: number, z: number): void {
  const stone = shade(p.stone, 0.96)
  const H = 31
  block(out, x - 2.7, x + 2.7, z - 2.7, z + 2.7, -1, 2.4, shade(stone, 0.9))
  block(out, x - 2.9, x + 2.9, z - 2.9, z + 2.9, 2.4, 2.8, stone)
  classicalColumn(out, x, z, 2.8, H - 4, 1.5, stone, { order: 'doric', tier: 'near', flutes: true })
  // the platform at the head, and the cage: six uprights, a ring and a ball
  const y = H - 4
  block(out, x - 2, x + 2, z - 2, z + 2, y, y + 0.35, p.trim)
  const iron: Rgb = hex('#2d3331')
  const r = 1.45
  const top = y + 3.4
  const ring = (a: number, rr: number, yy: number): [number, number, number] => [x + Math.sin(a) * rr, yy, z + Math.cos(a) * rr]
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const b = ((i + 1) / 6) * Math.PI * 2
    strut(out, ring(a, r, y + 0.35), ring(a, r * 0.72, top), 0.09, 0.09, iron, FLAT, false)
    strut(out, ring(a, r * 0.86, y + 1.9), ring(b, r * 0.86, y + 1.9), 0.07, 0.07, iron, FLAT, false)
    strut(out, ring(a, r * 0.72, top), ring(b, r * 0.72, top), 0.07, 0.07, iron, FLAT, false)
    strut(out, ring(a, r * 0.72, top), [x, top + 0.7, z], 0.07, 0.07, iron, FLAT, false)
  }
  box(out, x, top + 0.8, z, 0.14, 0.14, 0.14, iron, FLAT)
}
