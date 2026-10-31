import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block, hex, shade } from '../../kit.ts'
import { boxAlong, clockFace } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { archOn, fitted, rectOn } from '../palaces/common.ts'
import { archAlong, domeOf, drumArches, FIXED, onion, orthodoxCross, quarter } from './common.ts'

/*
 * THE CATHÉDRALE SAINT-ALEXANDRE-NEVSKY (Kouzmine and Strohm, 1859–61), Rue Daru, the mother church of the Russians in
 * Paris, cream stone among the Haussmann fronts at the end of the Rue Pierre-le-Grand: FIVE TENTS. The great one in the
 * middle, 48 m to the cross (OSM's part, Wikipedia), rises off a tall drum of paired round-headed windows under a crown of
 * kokoshnik arches — a steep eight-sided pyramid of the same pale stone, its faces pricked with three rows of little
 * dormers, a neck, a gold ONION and the three-barred cross. Four small ones stand in the angles of the cross: round
 * shafts, a clock stage, an open belfry, a tent, a gold onion. Down the front, over the main cornice, the great round
 * LUNETTE of gold mosaic with Christ in it; below that the front apse under a low dome of old copper, its gold cupola,
 * and the carved stone porch with its copper hood and dark glazed doors at the top of the steps.
 *
 * In the city the outline (way 70192893, height 6) came out as a low mansard lump with five pyramids. The model replaces the
 * outline and its parts (450615183–7). Frame: OSM's plan turned square to the arms, −z the porch toward the Rue Daru at
 * bearing 319; the design metres are OSM's rings (osmium, 2026-10-30). The tent's colour is the photographs' (OSM says
 * `#C2A15C`); the side apses' roofs are read from one corner of one photograph.
 */
const HX = 13.65
const HZ = 16.35

const STONE: Rgb = hex('#e8dcbd')
const TRIM: Rgb = hex('#f2e9d0')
const DEEP: Rgb = hex('#c4b591')
const TENT: Rgb = hex('#e2d7bc')
const GOLD: Rgb = hex('#e8b53f')
/** The apses' domes, the porch's hood: "doesn't actually have blue roofing, more copper" (owner, 2026-10-30, and Commons's "Paris Cathédrale Saint-Alexandre-Nevsky 1": a dull grey-green with pale ribs). */
const COPPER: Rgb = hex('#62756c')
const GLASS: Rgb = hex('#23262c')
const DOOR: Rgb = hex('#3c2a20')
const RED: Rgb = hex('#6c3f33')

/** The crossing's tower, from OSM's part. */
const CX = -0.4
const CZ = 1.0
/** The steps' height: the floor of the church over the street. */
const F = 1.6
const CORNICE = 15.5

export function saintAlexandreNevsky(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => nevsky(q))
}

function nevsky(out: MeshBuilder): void {
  // the plinth under the whole, the crossing and its four arms up to the main cornice
  block(out, -5.9, 5.1, -4.7, 7.0, 0, CORNICE + 0.2, STONE)
  block(out, -5.1, 4.3, -6.0, 12.0, 0, CORNICE, STONE)
  block(out, -9.6, 9.0, -2.2, 7.4, 0, CORNICE, STONE)
  // three apses to the sides and the back, one to the front under the blue dome, on a band of plinth
  for (const [x, z, r, a] of [[-9.3, 2.65, 4.4, 'side'], [9.1, 2.45, 4.6, 'side'], [0.45, 11.7, 4.6, 'back'], [-0.4, -6.0, 4.7, 'front']] as const) {
    prism(out, x, z, 0, F + 0.3, r + 0.1, 18, DEEP, FIXED, r + 0.1, false)
    const eaves = a === 'front' ? 10.2 : 11.6
    prism(out, x, z, F + 0.3, eaves, r, 18, STONE, FIXED, r, false)
    prism(out, x, z, eaves - 0.1, eaves + 0.45, r + 0.3, 18, TRIM, FIXED, r + 0.3, true)
    domeOf(out, x, z, eaves + 0.45, r + 0.1, a === 'front' ? 3.1 : 2.8, COPPER, quarter, { sides: 18, steps: 6 })
    if (a !== 'front') drumArches(out, x, z, r, 5.0, 8, 1.1, 4.4, GLASS)
    else {
      // the front apse carries the gold cupola, on a slim blue drum
      prism(out, x, z, eaves + 3.2, eaves + 4.1, 0.75, 10, COPPER, FIXED, 0.62, false)
      domeOf(out, x, z, eaves + 4.0, 1.15, 2.6, GOLD, onion, { sides: 14, steps: 12 })
      orthodoxCross(out, x, z, eaves + 6.5, 1.5, GOLD)
    }
  }
  // the main cornice round the crossing and the arms
  block(out, -6.2, 5.4, -5.0, 7.3, CORNICE, CORNICE + 0.5, TRIM)
  block(out, -5.4, 4.6, -6.3, 11.9, CORNICE - 0.5, CORNICE, TRIM)
  block(out, -9.6, 9.0, -2.5, 7.7, CORNICE - 0.5, CORNICE, TRIM)

  // the four round gables over the cornice: on the front the LUNETTE of gold mosaic with Christ in it
  gable(out, -0.4, -6.0, 0, 5.2, true)
  gable(out, 0.45, 11.9, Math.PI, 5.0, false)
  gable(out, -9.6, 2.65, -Math.PI / 2, 4.8, false)
  gable(out, 9.0, 2.45, Math.PI / 2, 4.8, false)

  // THE CENTRAL TOWER: the drum on its square, the windows in pairs, the crown of arches, the tent, the neck and the onion
  const R = 5.7
  prism(out, CX, CZ, CORNICE, 28.6, R, 16, STONE, FIXED, R, false)
  prism(out, CX, CZ, 19.0, 19.4, R + 0.25, 16, TRIM, FIXED, R + 0.25, false)
  prism(out, CX, CZ, 28.3, 28.8, R + 0.35, 16, TRIM, FIXED, R + 0.35, false)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    const nx = Math.sin(a)
    const nz = Math.cos(a)
    // the pair of tall windows, and the arch over them
    const px = CX + nx * (R + 0.02)
    const pz = CZ + nz * (R + 0.02)
    archAlong(out, px + nx * 0.04, pz + nz * 0.04, nz, -nx, nx, nz, 20.1, 3.5, 7.3, DEEP)
    for (const u of [-0.72, 0.72]) archAlong(out, px + nx * 0.08 + nz * u, pz + nz * 0.08 - nx * u, nz, -nx, nx, nz, 20.5, 1.15, 6.2, GLASS)
    // the kokoshnik: a pale round gable over the cornice, standing clear against the tent
    const qx = CX + nx * (R + 0.2)
    const qz = CZ + nz * (R + 0.2)
    archAlong(out, qx, qz, nz, -nx, nx, nz, 28.8, 3.9, 2.0, TRIM)
    archAlong(out, qx + nx * 0.05, qz + nz * 0.05, nz, -nx, nx, nz, 28.95, 2.6, 1.3, COPPER)
    prism(out, qx + nx * 0.1, qz + nz * 0.1, 29.05, 29.75, 0.28, 8, GOLD, FIXED, 0.28, true)
  }
  tent(out, CX, CZ, 28.8, 5.45, 42.6, 0.95, 3)
  prism(out, CX, CZ, 42.5, 43.2, 0.72, 10, TRIM, FIXED, 0.6, false)
  prism(out, CX, CZ, 43.2, 43.45, 0.86, 10, GOLD, FIXED, 0.86, false)
  domeOf(out, CX, CZ, 43.4, 1.25, 2.7, GOLD, onion, { sides: 16, steps: 12 })
  orthodoxCross(out, CX, CZ, 45.9, 2.1, GOLD)

  // THE FOUR SMALL TOWERS in the angles of the cross, from OSM's parts
  small(out, -7.9, -4.65, 2.45, [-1, -1])
  small(out, 6.85, -4.9, 2.45, [1, -1])
  small(out, -6.8, 10.1, 2.45, [-1, 1])
  small(out, 7.5, 9.5, 2.45, [1, 1])

  porch(out)
}

/** A steep eight-sided TENT over (x, z), from radius r0 at y0 to r1 at y1, its arrises ribbed, `rows` of little dormers up it. */
function tent(out: MeshBuilder, x: number, z: number, y0: number, r0: number, y1: number, r1: number, rows: number): void {
  // (the prism's corners sit at the eighths: the faces look along the sixteenths)
  prism(out, x, z, y0, y1, r0, 8, TENT, FIXED, r1, true)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    beam(out, [x + Math.sin(a) * r0, y0, z + Math.cos(a) * r0], [x + Math.sin(a) * r1, y1, z + Math.cos(a) * r1], 0.06 + r0 * 0.012, TRIM)
  }
  const rise = y1 - y0
  const apothem = Math.cos(Math.PI / 8)
  for (let k = 0; k < rows; k++) {
    const t = rows === 1 ? 0.42 : 0.2 + (k / rows) * 0.72
    const y = y0 + rise * t
    const r = (r0 + (r1 - r0) * t) * apothem
    const n = k === rows - 1 && rows > 1 ? 4 : 8
    const w = 0.32 + r0 * 0.055
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) / 8) * Math.PI * 2 * (8 / n)
      const nx = Math.sin(a)
      const nz = Math.cos(a)
      const cx = x + nx * r
      const cz = z + nz * r
      boxAlong(out, cx + nx * 0.1, y + w * 0.75, cz + nz * 0.1, w * 0.75, w * 0.8, w * 0.42, Math.atan2(nz, -nx) * -1 + Math.PI / 2 + Math.PI / 2, TRIM)
      archAlong(out, cx + nx * (0.1 + w * 0.46), cz + nz * (0.1 + w * 0.46), nz, -nx, nx, nz, y + 0.08, w * 0.85, w * 1.2, GLASS)
    }
  }
}

/** A small corner tower: a round shaft to the main cornice, the clock stage, the open belfry, the tent, the gold onion. */
function small(out: MeshBuilder, x: number, z: number, r: number, face: [number, number]): void {
  prism(out, x, z, 0, F + 0.3, r + 0.14, 14, DEEP, FIXED, r + 0.14, false)
  prism(out, x, z, F + 0.3, CORNICE, r, 14, STONE, FIXED, r, false)
  prism(out, x, z, CORNICE - 0.25, CORNICE + 0.35, r + 0.28, 14, TRIM, FIXED, r + 0.28, false)
  const r2 = r - 0.18
  prism(out, x, z, CORNICE + 0.3, 18.4, r2, 14, STONE, FIXED, r2, false)
  prism(out, x, z, 18.3, 18.65, r2 + 0.22, 14, TRIM, FIXED, r2 + 0.22, false)
  // the clock, looking out of the corner
  const L = Math.hypot(face[0], face[1])
  const nx = face[0] / L
  const nz = face[1] / L
  clockFace(out, x + nx * r2, 17.0, z + nz * r2, nx, nz, 0.72, { dial: TRIM, rim: GOLD, marks: DEEP, hands: GLASS, out: 0.06 })
  clockFace(out, x + nz * r2, 17.0, z - nx * r2, nz, -nx, 0.72, { dial: TRIM, rim: GOLD, marks: DEEP, hands: GLASS, out: 0.06 })
  clockFace(out, x - nz * r2, 17.0, z + nx * r2, -nz, nx, 0.72, { dial: TRIM, rim: GOLD, marks: DEEP, hands: GLASS, out: 0.06 })
  // the belfry: open round-headed lights round a drum
  prism(out, x, z, 18.6, 23.0, r2 - 0.1, 14, STONE, FIXED, r2 - 0.1, false)
  drumArches(out, x, z, r2 - 0.1, 19.2, 4, 1.65, 3.2, shade(GLASS, 1.1), TRIM)
  prism(out, x, z, 22.9, 23.3, r2 + 0.2, 14, TRIM, FIXED, r2 + 0.2, false)
  tent(out, x, z, 23.2, r2 + 0.05, 29.5, 0.42, 1)
  prism(out, x, z, 29.4, 29.8, 0.34, 8, TRIM, FIXED, 0.3, false)
  domeOf(out, x, z, 29.75, 0.72, 1.7, GOLD, onion, { sides: 12, steps: 10 })
  orthodoxCross(out, x, z, 31.35, 1.45, GOLD)
}

/** A round GABLE standing on the main cornice over an arm: `heading` turns its face from −z, `r` the arch's radius. */
function gable(out: MeshBuilder, x: number, z: number, heading: number, r: number, gold: boolean): void {
  const nx = -Math.sin(heading)
  const nz = -Math.cos(heading)
  const tx = -nz
  const tz = nx
  const y = CORNICE
  // the wall of the gable, its depth back to the crossing, the arch's moulded outer ring
  const seg = 14
  const P = (a: number, rr: number, d: number): [number, number, number] =>
    [x + tx * Math.cos(a) * rr + nx * d, y + Math.sin(a) * rr, z + tz * Math.cos(a) * rr + nz * d]
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI
    const a1 = ((i + 1) / seg) * Math.PI
    const am = (a0 + a1) / 2
    const up: [number, number, number] = [tx * Math.cos(am), Math.sin(am), tz * Math.cos(am)]
    // the extrados, from the face back 4 m
    out.quad([P(a0, r, 0), P(a0, r, -4), P(a1, r, -4), P(a1, r, 0)], up, [[0, 0], [1, 0], [1, 1], [0, 1]], COPPER, FIXED)
    // the moulded ring
    out.quad([P(a0, r - 0.55, 0.12), P(a0, r + 0.1, 0.12), P(a1, r + 0.1, 0.12), P(a1, r - 0.55, 0.12)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], TRIM, FIXED)
    // the tympanum
    out.quad([P(a0, 0, 0.06), P(a0, r - 0.5, 0.06), P(a1, r - 0.5, 0.06), P(a1, 0, 0.06)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], gold ? GOLD : STONE, FIXED)
  }
  if (gold) {
    // Christ in the mosaic, seated, the book on his knee: a figure of three colours, read from the street
    const fx = x + nx * 0.1
    const fz = z + nz * 0.1
    const Q = (u0: number, u1: number, y0: number, y1: number, c: Rgb): void => {
      const a: [number, number, number] = [fx + tx * u0, y0, fz + tz * u0]
      const b: [number, number, number] = [fx + tx * u1, y0, fz + tz * u1]
      const d: [number, number, number] = [fx + tx * u1, y1, fz + tz * u1]
      const e: [number, number, number] = [fx + tx * u0, y1, fz + tz * u0]
      out.quad([a, b, d, e], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
    }
    Q(-0.8, 0.8, y + 0.2, y + 2.6, hex('#39506f'))
    Q(-0.55, 0.3, y + 0.2, y + 2.2, RED)
    Q(-0.28, 0.28, y + 2.6, y + 3.2, hex('#d4a988'))
    Q(-0.5, 0.5, y + 3.1, y + 3.55, hex('#fbe9a9'))
  }
}

/** The porch: the steps up from the street, the carved stone frame, the dark glazed doors, its blue hood. */
function porch(out: MeshBuilder): void {
  const x0 = -2.8
  const x1 = 1.7
  const xm = (x0 + x1) / 2
  const z0 = -13.0
  // the steps, from z −16.3 up to the floor
  for (let k = 0; k < 8; k++) block(out, xm - 3.0 + k * 0.05, xm + 3.0 - k * 0.05, -16.3 + k * 0.42, -10.0, 0, (F * (k + 1)) / 8, k % 2 ? DEEP : shade(DEEP, 1.08))
  // the two carved piers at the corners, the side walls back to the apse, the arch in front and its frame
  for (const x of [x0, x1 - 0.8]) {
    block(out, x, x + 0.8, z0, -9.8, F, 6.0, TRIM)
    block(out, x - 0.08, x + 0.88, z0 - 0.08, z0 + 0.72, 5.9, 6.3, STONE)
  }
  block(out, x0, x1, z0, -9.8, 6.2, 7.4, TRIM)
  rectOn(out, '-z', z0, x0 + 0.8, x1 - 0.8, F, 6.3, DOOR, -0.25)
  for (let i = 0; i < 3; i++) {
    const x = x0 + 0.8 + ((x1 - x0 - 1.6) * (i + 0.5)) / 3
    rectOn(out, '-z', z0, x - 0.35, x + 0.35, F + 2.6, 6.0, GLASS, -0.18)
  }
  archOn(out, '-z', z0, xm, 5.3, 3.0, 2.0, GLASS, 0.03)
  archOn(out, '-z', z0, xm, 5.2, 3.6, 2.5, DEEP, 0.015)
  // the round head of the frame
  const r = (x1 - x0) / 2 + 0.05
  for (let i = 0; i < 10; i++) {
    const a0 = (i / 10) * Math.PI
    const a1 = ((i + 1) / 10) * Math.PI
    const X = (a: number, rr: number): number => xm + Math.cos(a) * rr
    const Y = (a: number, rr: number): number => 7.4 + Math.sin(a) * rr * 0.55
    out.quad([[X(a0, r), Y(a0, r), z0 - 0.02], [X(a1, r), Y(a1, r), z0 - 0.02], [xm, 7.4, z0 - 0.02], [xm, 7.4, z0 - 0.02]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], TRIM, FIXED)
    // the hood, from the arch's crown back to the apse
    out.quad([[X(a0, r + 0.1), Y(a0, r + 0.1), z0 - 0.12], [X(a0, r + 0.1), Y(a0, r + 0.1), -9.6], [X(a1, r + 0.1), Y(a1, r + 0.1), -9.6], [X(a1, r + 0.1), Y(a1, r + 0.1), z0 - 0.12]],
      [Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0], [[0, 0], [1, 0], [1, 1], [0, 1]], COPPER, FIXED)
  }
  box(out, xm, 8.75, z0 + 0.1, 0.1, 0.1, 0.1, GOLD, FIXED)
}
