/**
 * Three things the owner found missing from the street (2026-10-30), none of them another wave's:
 *
 * - the BARRIÈRE D'ENFER: Ledoux's twin customs pavilions of the 1780s on the Place Denfert-Rochereau, the one the way down to the
 *   Catacombs, the other the Musée de la Libération de Paris. A square block of rusticated stone with a sculpted frieze;
 * - a RAILWAY TUNNEL'S MOUTH, where the track goes under: "then it goes into a tunnel irl, while in our version it just ends".
 *   tools/paris-portals.ts places one at each;
 * - the BIBLIOTHÈQUE FRANÇOIS-MITTERRAND's esplanade: "we are rendering a generic building WITH the custom towers on top of it". The
 *   survey has the deck and the sunken garden as ground, so this draws only what lies on them: the timber, and the glass cloister;
 * - the FOUNTAIN on the Place Gambetta, from the owner's street view: pale green blades fanning out of a low round stone basin,
 *   dark ribs at their feet, tall jets in the middle.
 */
import { MeshBuilder } from '../../buildings.ts'
import { box, prism, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { block, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'
import { archOn, fitted, palette, rectOn, type F } from './palaces/common.ts'
import { quadN, type V3 } from './venues/bowl.ts'
import { mairie5e } from './museums/mairie-5e.ts'

const FIXED = 0
const DARK: Rgb = [0.09, 0.09, 0.1]

export function barriereEnfer(out: MeshBuilder, fit: Fit): void {
  const H = 12
  fitted(out, fit, H, H, (q) => {
    const p = palette('#d6cdb8', '#5f6468')
    const stone = p.stone
    const pale = shade(stone, 1.07)
    block(q, -H, H, -H, H, 0, 9.4, stone)
    // the plinth, the frieze of reliefs and the cornice round all four sides
    block(q, -H - 0.3, H + 0.3, -H - 0.3, H + 0.3, 0, 1, shade(stone, 0.9))
    block(q, -H - 0.12, H + 0.12, -H - 0.12, H + 0.12, 6.9, 8.4, pale)
    block(q, -H - 0.55, H + 0.55, -H - 0.55, H + 0.55, 9.4, 10, pale)
    for (const [f, plane, along] of [['+z', H, 'x'], ['-z', -H, 'x'], ['+x', H, 'z'], ['-x', -H, 'z']] as [F, number, string][]) {
      void along
      const out0 = f === '+z' || f === '+x' ? 0.14 : 0.14
      // the courses of rustication
      for (let y = 1.4; y < 6.8; y += 0.9) rectOn(q, f, plane, -H, H, y, y + 0.07, shade(stone, 0.78), 0.03)
      // three great arched openings, the middle one the door
      for (const c of [-7, 0, 7]) {
        archOn(q, f, plane, c, 1, 4, 5.3, DARK, out0)
        rectOn(q, f, plane, c - 2.35, c + 2.35, 6.65, 6.85, pale, 0.2)
      }
      // the frieze's figures, as a rhythm of darker relief
      for (let c = -H + 1; c < H; c += 1.7) rectOn(q, f, plane, c - 0.35, c + 0.35, 7.1, 8.15, shade(pale, 0.82), 0.2)
    }
    // the attic and its low lead roof
    block(q, -H + 2.5, H - 2.5, -H + 2.5, H - 2.5, 10, 12.2, shade(stone, 0.96))
    block(q, -H + 3, H - 3, -H + 3, H - 3, 12.2, 12.9, p.slate)
  })
}

/** Local +z is the way out of the tunnel; the track comes out of the arch at the middle of the wall, at y 0. */
export function railPortal(out: MeshBuilder, fit: Fit): void {
  const ash = surfaceTag('ashlar')
  const stone: Rgb = [0.5, 0.48, 0.44]
  const hx = fit.hx, hz = fit.hz
  /*
   * On its track, not on the street over it (owner, 2026-10-30, Rue de Londres: "wall in the middle of the road"; "the hole should be
   * facing toward the tracks"). The face looks along +z down the track, so the track's level is the ground in front; the wall comes up
   * to the street behind and no higher, where there is one. In the open it stands as high as its arch.
   */
  const g = (x: number, z: number): number => fit.groundAt ? fit.groundAt(x, z) : 0
  const track = g(0, hz + 2)
  const street = Math.max(g(0, -hz - 5), g(-hx * 0.6, -hz - 5), g(hx * 0.6, -hz - 5)) - track
  const span = Math.max(4.5, hx - 3)
  const room = street > 7 ? street - 0.4 : Math.max(7, fit.height)
  const rise = Math.max(1.2, Math.min(span * 0.75, 5.5, room - 5))
  const springing = Math.min(4, room - rise - 0.5)
  const top = track + Math.max(room, springing + rise + 0.5)
  const foot = track - 2
  const mid = (top + foot) / 2, half = (top - foot) / 2
  // the wall, in stone either side of and over the opening, reaching down below the track for a slope, and a coping
  const face = hz - 0.3
  box(out, -(span + hx) / 2, mid, face, (hx - span) / 2, half, 0.3, stone, ash)
  box(out, (span + hx) / 2, mid, face, (hx - span) / 2, half, 0.3, stone, ash)
  const seg = 28
  for (let k = 0; k < seg; k++) {
    const x0 = -span + (2 * span * k) / seg, x1 = -span + (2 * span * (k + 1)) / seg
    const y = (x: number): number => track + springing + rise * Math.sqrt(Math.max(0, 1 - (x / span) ** 2))
    const low = Math.min(y(x0), y(x1))
    box(out, (x0 + x1) / 2, (low + top) / 2, face, (x1 - x0) / 2, (top - low) / 2, 0.3, stone, ash)
  }
  box(out, 0, top + 0.1, face + 0.05, hx + 0.3, 0.15, 0.45, shade(stone, 1.2), ash)
  // the dark inside, going back, lined in black and clad on its outsides in the same stone: from behind it is a culvert, not a box
  box(out, 0, mid, -hz + 0.2, span, half, 0.2, DARK, FIXED)
  box(out, 0, mid, -hz, span + 0.4, half + 0.2, 0.02, stone, ash)
  for (const s of [-1, 1]) {
    box(out, s * span, mid, 0, 0.1, half, hz - 0.5, DARK, FIXED)
    box(out, s * (span + 0.25), mid, 0, 0.12, half + 0.2, hz - 0.5, stone, ash)
  }
  box(out, 0, top - 0.1, 0, span, 0.1, hz - 0.5, DARK, FIXED)
  box(out, 0, top + 0.05, 0, span + 0.35, 0.05, hz - 0.5, stone, ash)
  // and the voussoirs round the arch, a paler ring
  for (let k = 0; k < seg; k++) {
    const a = ((k + 0.5) / seg) * Math.PI
    box(out, Math.cos(a) * (span + 0.25), track + springing + Math.sin(a) * (rise + 0.25), face + 0.32, 0.3, 0.3, 0.05, shade(stone, 1.25), ash)
  }
}

export function fontaineGambetta(out: MeshBuilder, fit: Fit): void {
  const R = Math.min(fit.hx, fit.hz)
  const stone: Rgb = [0.72, 0.6, 0.5]
  const glass: Rgb = [0.74, 0.88, 0.8]
  const rib: Rgb = [0.1, 0.17, 0.13]
  const water: Rgb = [0.2, 0.3, 0.27]
  const metal = surfaceTag('metal')
  // the two low steps and the basin's wide stone rim, the water in it
  prism(out, 0, 0, 0, 0.25, R, 40, shade(stone, 0.85), FIXED)
  prism(out, 0, 0, 0.25, 0.8, R * 0.9, 40, stone, surfaceTag('ashlar'), R * 0.88)
  prism(out, 0, 0, 0.8, 0.84, R * 0.82, 40, water, FIXED)
  const blade = (x: number, z: number, turn: number, w: number, h: number, lean: number): void => {
    const c = Math.cos(turn), s = Math.sin(turn)
    const at = (u: number, v: number, d: number): V3 => [x + c * u + s * d, 0.84 + v, z - s * u + c * d]
    const nx = s, nz = c
    // a kite: narrow at the foot, widest high up, leaning outward
    const foot = at(0, 0, 0), l = at(-w / 2, h * 0.62, lean * 0.62), r = at(w / 2, h * 0.5, lean * 0.5), tip = at(w * 0.08, h, lean)
    for (const sg of [1, -1]) {
      const q: [V3, V3, V3, V3] = sg > 0 ? [foot, r, tip, l] : [foot, l, tip, r]
      quadN(out, q, [nx * sg, 0.15, nz * sg], glass, FIXED)
    }
    // its dark rib, from the foot up the blade
    strut(out, at(0, -0.1, 0), at(w * 0.05, h * 0.72, lean * 0.72), 0.14, 0.2, rib, metal, false)
  }
  const small = R * 0.42, n = 16
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2
    const k = 0.45 + 0.3 * Math.abs(Math.sin(i * 1.7))
    const d = R * (0.28 + 0.36 * k)
    blade(Math.sin(a) * d, Math.cos(a) * d, a + (i % 2 ? 0.5 : -0.5), small * (0.8 + 0.4 * k), R * (0.3 + 0.28 * Math.abs(Math.cos(i * 2.3))), R * 0.16)
  }
  // the two great fans, either side of the jets
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) blade(s * R * (0.08 + i * 0.05), (i - 1.5) * R * 0.09, s * (Math.PI / 2 - 0.45 + i * 0.3), R * 0.5, R * (0.74 + (i % 2 ? 0.14 : 0)), R * 0.26)
  }
  // the jets: a tall plume, two thin columns of white, and arcs from the rim
  const white: Rgb = [0.93, 0.95, 0.96]
  for (const s of [-1, 1]) prism(out, s * R * 0.09, 0, 0.84, R * 1.55, R * 0.1, 8, white, FIXED, R * 0.02)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    let prev: V3 = [Math.sin(a) * R * 0.78, 0.9, Math.cos(a) * R * 0.78]
    for (let k = 1; k <= 5; k++) {
      const t = k / 5, d = R * (0.78 - 0.22 * t)
      const p: V3 = [Math.sin(a) * d, 0.9 + 4 * R * 0.1 * t * (1 - t), Math.cos(a) * d]
      strut(out, prev, p, 0.05, 0.05, white, FIXED, false)
      prev = p
    }
  }
}

/** Local x along the long side, +z toward the Seine. The towers are their own entries, on their own OSM ways. */
export function bnfEsplanade(out: MeshBuilder, fit: Fit): void {
  const hx = fit.hx, hz = fit.hz
  const gx = hx * 0.72, gz = hz * 0.42
  // the deck's level, from the survey, over the garden's: the entry's middle stands in the garden
  const deck = Math.max(fit.groundAt?.(hx * 0.85, hz * 0.8) ?? 20, fit.groundAt?.(-hx * 0.85, -hz * 0.8) ?? 20, fit.groundAt?.(0, gz + 12) ?? 20) + 0.08
  const wood: Rgb = [0.52, 0.4, 0.28]
  const planks = surfaceTag('planks')
  const slab = (x0: number, x1: number, z0: number, z1: number): void => box(out, (x0 + x1) / 2, deck - 0.15, (z0 + z1) / 2, (x1 - x0) / 2, 0.15, (z1 - z0) / 2, wood, planks)
  slab(-hx, hx, gz, hz)
  slab(-hx, hx, -hz, -gz)
  slab(-hx, -gx, -gz, gz)
  slab(gx, hx, -gz, gz)
  // the cloister: glass down from the deck's edge to the garden, the steel mesh of its frames, and a rail along the top
  const glass: Rgb = [0.22, 0.3, 0.34]
  const steel: Rgb = [0.5, 0.53, 0.55]
  const metal = surfaceTag('metal')
  const floor = (fit.groundAt?.(0, 0) ?? 0) - 1
  const mid = (deck + floor) / 2, half = (deck - floor) / 2
  for (const s of [-1, 1]) {
    box(out, 0, mid, s * gz, gx, half, 0.08, glass, surfaceTag('glass'))
    box(out, s * gx, mid, 0, 0.08, half, gz, glass, surfaceTag('glass'))
    box(out, 0, deck + 0.55, s * gz, gx, 0.04, 0.05, steel, metal)
    box(out, s * gx, deck + 0.55, 0, 0.05, 0.04, gz, steel, metal)
    for (let x = -gx; x <= gx; x += 7) {
      box(out, x, mid, s * (gz - 0.15), 0.1, half, 0.1, steel, metal)
      box(out, x, deck + 0.28, s * gz, 0.04, 0.28, 0.04, steel, metal)
    }
    for (let z = -gz; z <= gz; z += 7) {
      box(out, s * (gx - 0.15), mid, z, 0.1, half, 0.1, steel, metal)
      box(out, s * gx, deck + 0.28, z, 0.04, 0.28, 0.04, steel, metal)
    }
    for (let y = floor + 3; y < deck; y += 3.4) {
      box(out, 0, y, s * (gz - 0.15), gx, 0.06, 0.08, steel, metal)
      box(out, s * (gx - 0.15), y, 0, 0.08, 0.06, gz, steel, metal)
    }
  }
}

/**
 * The École de Droit (Soufflot, from 1771; today Université Paris 1), the Mairie du 5e's twin across the Rue Soufflot: the mairie was
 * built to its elevation, so its model, mirrored. The owner, 2026-10-30, of the Panthéon: "of the two buildings flanking it, only
 * one is modeled".
 */
export function ecoleDeDroit(out: MeshBuilder, fit: Fit): void {
  const q = new MeshBuilder()
  mairie5e(q, fit)
  const base = out.positions.length / 3
  for (let i = 0; i < q.positions.length; i += 3) out.positions.push(-q.positions[i], q.positions[i + 1], q.positions[i + 2])
  for (let i = 0; i < q.normals.length; i += 3) out.normals.push(-q.normals[i], q.normals[i + 1], q.normals[i + 2])
  out.uvs.push(...q.uvs)
  out.colors.push(...q.colors)
  // (a mirror turns every triangle over)
  for (let i = 0; i < q.indices.length; i += 3) out.indices.push(base + q.indices[i], base + q.indices[i + 2], base + q.indices[i + 1])
}
