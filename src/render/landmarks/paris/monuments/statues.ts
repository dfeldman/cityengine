import { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block, classicalColumn, hex, lathe, shade } from '../../kit.ts'
import { signText } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { figure, FIXED } from './common.ts'

/*
 * The statues and columns of the outer places: the Nation's — Dalou's bronze Republic in the middle and Ledoux's two
 * columns at the Barrière du Trône — and Bartholdi's lion at Denfert-Rochereau.
 */

const BRONZE: Rgb = [0.28, 0.34, 0.29]

// ---------------------------------------------------------------------------------------------------------------
/**
 * LE TRIOMPHE DE LA RÉPUBLIQUE (Jules Dalou, 1879–99), the bronze group in the middle of the Place de la Nation:
 * Marianne standing on a globe in a chariot drawn by two lions, the Genius of Liberty with his torch leading them,
 * Labour (a smith with his hammer) and Justice pushing the wheels, Peace scattering flowers behind; on its stone
 * pedestal in a round basin. OSM way 114877477 (the pedestal, 5.8 m square; 15 m) marks it; the basin and the group
 * are drawn round it. Local −z faces west, down the Faubourg Saint-Antoine toward the Bastille, where the procession
 * goes.
 */
export function triompheRepublique(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 10, 10, (q) => republique(q))
}

function republique(out: MeshBuilder): void {
  const stone = hex('#d6cdbb')
  const water: Rgb = [0.3, 0.42, 0.46]
  // the basin: its kerb and water, and the stepped pedestal in it
  const n = 32
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    box(out, Math.sin(a) * 9.6, 0.35, Math.cos(a) * 9.6, 1.0, 0.35, 0.3, stone, FIXED)
  }
  prism(out, 0, 0, 0.0, 0.25, 9.4, 32, water, FIXED)
  block(out, -3.6, 3.6, -3.6, 3.6, 0, 0.9, shade(stone, 0.95))
  block(out, -2.9, 2.9, -2.9, 2.9, 0.9, 4.6, stone)
  block(out, -3.15, 3.15, -3.15, 3.15, 4.3, 4.9, shade(stone, 1.05))
  // the bronze mascarons spouting into the basin, one on each face
  for (const [x, z] of [[0, -3.0], [0, 3.0], [-3.0, 0], [3.0, 0]]) box(out, x, 1.6, z, 0.45, 0.45, 0.45, BRONZE, FIXED)
  // the group, on its rock: the chariot, the globe, Marianne
  const y = 4.9
  block(out, -2.6, 2.6, -2.8, 2.8, y, y + 0.8, BRONZE)
  block(out, -1.3, 1.3, -1.2, 1.6, y + 0.8, y + 2.4, BRONZE)                       // the chariot's body
  for (const s of [-1, 1]) prism(out, s * 1.45, 0.6, y + 0.8, y + 2.6, 0.95, 10, BRONZE, FIXED)   // its wheels, edge-on
  lathe(out, 0, 0.2, [[0.05, y + 2.4], [1.0, y + 2.75], [1.25, y + 3.4], [1.0, y + 4.05], [0.05, y + 4.4]], 12, BRONZE)   // the globe
  figure(out, 0, y + 4.3, 0.2, 4.2, BRONZE)                                         // Marianne
  beam(out, [0.3, y + 7.4, 0.2], [0.7, y + 8.2, -0.2], 0.09, BRONZE)                // her arm stretched over the crowd
  // the two lions drawing it, ahead (−z)
  for (const s of [-1, 1]) lion(out, s * 0.85, y + 0.8, -2.0, Math.PI, 0.2, BRONZE)
  // Liberty with the torch leading them, Labour and Justice at the wheels, Peace behind
  figure(out, 0, y + 0.8, -3.2, 2.6, BRONZE)
  beam(out, [0.2, y + 2.9, -3.2], [0.3, y + 3.9, -3.5], 0.07, BRONZE)
  for (const s of [-1, 1]) figure(out, s * 2.3, y + 0.8, 0.5, 2.5, BRONZE)
  figure(out, 0, y + 0.8, 2.4, 2.4, BRONZE)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * A COLUMN OF THE BARRIÈRE DU TRÔNE (Claude-Nicolas Ledoux, 1787; the statues 1845): on the Nation's east side the two
 * Doric columns of the old customs gate stand either side of the Cours de Vincennes, each on its cross-shaped base with
 * a little pedimented porch on every side (OSM's parts 285276897…900), the cubic die, the great banded shaft, the
 * abacus and the drum on top, and the king in bronze — Saint Louis on the north column (Antoine Étex), Philippe
 * Auguste on the south one (Auguste Dumont). OSM ways 63638975 and 77385192 (10.7 m square; 28 m).
 */
export function troneColumnSaintLouis(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 5.35, 5.35, (q) => troneColumn(q))
}
export function troneColumnPhilippeAuguste(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 5.8, 5.8, (q) => troneColumn(q))
}

function troneColumn(out: MeshBuilder): void {
  const stone = hex('#ddd3bf')
  const trim = shade(stone, 1.05)
  const deep = shade(stone, 0.82)
  // the cross-shaped base: the square core, a porch on each side with its little pediment
  block(out, -2.6, 2.6, -2.6, 2.6, 0, 4.5, stone)
  for (let k = 0; k < 4; k++) {
    const q = new MeshBuilder()
    block(q, -1.9, 1.9, -5.3, -2.6, 0, 3.0, stone)
    q.quad([[-2.1, 3.0, -5.35], [2.1, 3.0, -5.35], [0, 4.0, -5.35], [0, 4.0, -5.35]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], trim, FIXED)
    for (const s of [-1, 1]) q.quad([[s * 2.1, 3.0, -5.35], [s * 2.1, 3.0, -2.6], [0, 4.0, -2.6], [0, 4.0, -5.35]], [s * 0.6, 0.8, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], deep, FIXED)
    block(q, -0.7, 0.7, -5.36, -5.3, 0, 2.2, [0.2, 0.2, 0.2])
    rotate(out, q, (k * Math.PI) / 2)
  }
  block(out, -2.9, 2.9, -2.9, 2.9, 4.5, 5.0, trim)
  // the die and the shaft, banded: Ledoux's square drums ringing the round column
  block(out, -2.2, 2.2, -2.2, 2.2, 5.0, 8.0, stone)
  block(out, -2.4, 2.4, -2.4, 2.4, 7.8, 8.3, trim)
  classicalColumn(out, 0, 0, 8.3, 24.6, 1.55, stone, { order: 'doric', tier: 'mid' })
  for (let y = 9.6; y < 23; y += 2.4) block(out, -1.75, 1.75, -1.75, 1.75, y, y + 0.9, trim)
  // the drum on the abacus, and the king standing on it
  prism(out, 0, 0, 24.6, 26.2, 1.4, 16, stone, FIXED)
  prism(out, 0, 0, 26.2, 26.6, 1.6, 16, trim, FIXED)
  figure(out, 0, 26.6, 0, 3.6, BRONZE)
  beam(out, [0.25, 29.0, 0], [0.35, 30.4, -0.3], 0.06, BRONZE)                       // the sceptre
}

function rotate(out: MeshBuilder, part: MeshBuilder, angle: number): void {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const base = out.positions.length / 3
  for (let i = 0; i < part.positions.length; i += 3) {
    const px = part.positions[i]
    const pz = part.positions[i + 2]
    out.positions.push(px * c + pz * s, part.positions[i + 1], -px * s + pz * c)
    const nx = part.normals[i]
    const nz = part.normals[i + 2]
    out.normals.push(nx * c + nz * s, part.normals[i + 1], -nx * s + nz * c)
  }
  for (const u of part.uvs) out.uvs.push(u)
  for (const col of part.colors) out.colors.push(col)
  for (const i of part.indices) out.indices.push(base + i)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * A reclining LION at (x, y, z), its head toward `heading` (0 = +z), `s` its scale (1 = a 16 m lion): the body, the
 * raised chest and head with its mane, the forepaws out in front, the hind quarters and the tail along its side.
 */
function lion(out: MeshBuilder, x: number, y: number, z: number, heading: number, s: number, c: Rgb): void {
  const q = new MeshBuilder()
  const L = (a: [number, number, number], b: [number, number, number], r: number): void => beam(q, a, b, r, c)
  L([0, 2.2, -4.5], [0, 2.9, 2.0], 2.0)                    // the body, lying
  L([0, 3.6, 1.6], [0, 5.6, 3.6], 2.0)                     // the chest and shoulders, raised
  prism(q, 0, 4.2, 5.0, 8.4, 2.5, 10, c, FIXED, 1.6)      // the mane
  L([0, 7.0, 4.6], [0, 6.6, 6.6], 1.25)                    // the head and muzzle
  for (const sx of [-1.2, 1.2]) {
    L([sx, 1.0, 3.6], [sx, 0.7, 7.6], 0.7)                 // the forepaws
    L([sx * 1.1, 1.3, -3.6], [sx * 1.3, 0.7, -0.6], 1.0)   // the haunches
  }
  L([1.7, 0.8, -5.6], [2.2, 0.6, -1.0], 0.35)              // the tail
  const co = Math.cos(heading)
  const si = Math.sin(heading)
  const base = out.positions.length / 3
  for (let i = 0; i < q.positions.length; i += 3) {
    const px = q.positions[i] * s
    const pz = q.positions[i + 2] * s
    out.positions.push(x + px * co + pz * si, y + q.positions[i + 1] * s, z - px * si + pz * co)
    const nx = q.normals[i]
    const nz = q.normals[i + 2]
    out.normals.push(nx * co + nz * si, q.normals[i + 1], -nx * si + nz * co)
  }
  for (const u of q.uvs) out.uvs.push(u)
  for (const col of q.colors) out.colors.push(col)
  for (const i of q.indices) out.indices.push(base + i)
}

/**
 * LE LION DE BELFORT (Auguste Bartholdi, 1880), the hammered-copper lion in the middle of the Place Denfert-Rochereau,
 * a third the size of his lion carved in the rock under Belfort's citadel, for the town's resistance in the siege of
 * 1870–71: reclining, head up, a paw on an arrow, on a stone pedestal with À LA DÉFENSE NATIONALE on it. OSM way
 * 79629168 (the pedestal, 11.2 × 6.4 m), its long axis along local x; the lion looks toward +x (bearing 209.5, down the
 * Avenue du Général-Leclerc).
 */
export function lionDeBelfort(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 5.6, 3.2, (q) => belfort(q))
  const sz = fit.hz > 0 ? fit.hz / 3.2 : 1
  for (const f of [-1, 1]) signText(out, 'À LA DÉFENSE NATIONALE 1870-1871', 0, 2.3, f * (2.8 + 0.04) * sz, 0.32, [0.25, 0.24, 0.22], { heading: f < 0 ? Math.PI : 0 })
}

function belfort(out: MeshBuilder): void {
  const stone = hex('#cfc6b3')
  const copper: Rgb = [0.3, 0.33, 0.28]
  block(out, -5.6, 5.6, -3.2, 3.2, 0, 0.6, shade(stone, 0.95))
  block(out, -5.2, 5.2, -2.8, 2.8, 0.6, 3.4, stone)
  block(out, -5.5, 5.5, -3.1, 3.1, 3.2, 3.8, shade(stone, 1.05))
  // the lion, 7 m long, along +x
  lion(out, -0.4, 3.8, 0, Math.PI / 2, 0.52, copper)
  // the arrow under its paw
  beam(out, [2.0, 4.0, 0.9], [4.6, 4.0, -0.4], 0.06, copper)
}
