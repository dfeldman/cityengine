/**
 * YERBA BUENA ISLAND LIGHT STATION (1873/1875), from the owner's photograph from the water (2026-10-04): high on the
 * island's south cliff, three white buildings with red roofs.
 *
 *  - The tower (way/291189057): SQUARE, white, two storeys of small windows, a railed gallery, a white lantern with
 *    dark glazing under a red cap and a little finial. (The old builder was an octagonal frustum.)
 *  - The fog-signal house (way/291189002), below and in front of it toward the water: a small white gabled house
 *    with a red roof, standing on a long white concrete retaining wall / terrace at the cliff's lip. Front 180:
 *    the water is south, local +z.
 *  - The keeper's house (way/291188942) up the slope behind: a restyle (two storeys of white clapboard under a
 *    steep red cross-gabled roof, the porch along the front) — manifest b12.json.
 *
 * The cliff itself is ground: a `terrain: fine`, `relief: raw` zone over this shore (data/zones, `ybi-light`).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { roof } from '../kit.ts'

const WHITE: Rgb = [0.94, 0.94, 0.92]
const RED: Rgb = [0.7, 0.22, 0.18]
const DARK: Rgb = [0.16, 0.18, 0.2]

export function ybiLightTower(out: MeshBuilder, _fit: Fit): void {
  const st = surfaceTag('clapboard'), metal = surfaceTag('metal')
  const W = 1.9, H = 7.5
  box(out, 0, H / 2, 0, W, H / 2, W, WHITE, st)
  // windows, two storeys, each face
  for (let s = 0; s < 4; s++) {
    const a = (s * Math.PI) / 2, nx = Math.sin(a), nz = Math.cos(a)
    for (const y of [2.2, 5.2]) box(out, nx * (W + 0.02), y, nz * (W + 0.02), Math.abs(nz) * 0.35 + 0.02, 0.55, Math.abs(nx) * 0.35 + 0.02, DARK, 0)
  }
  // the gallery: a slab and its railing
  box(out, 0, H + 0.1, 0, W + 0.5, 0.1, W + 0.5, WHITE, st)
  for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    box(out, sx * (W + 0.45), H + 0.65, sz * (W + 0.45), sx ? 0.03 : W + 0.48, 0.03, sz ? 0.03 : W + 0.48, DARK, metal)
    box(out, sx * (W + 0.45), H + 0.4, sz * (W + 0.45), sx ? 0.02 : W + 0.48, 0.02, sz ? 0.02 : W + 0.48, DARK, metal)
  }
  // the lantern: a low white base, dark glazing, the red cap and the finial
  prism(out, 0, 0, H + 0.2, H + 0.9, 1.15, 8, WHITE, st)
  prism(out, 0, 0, H + 0.9, H + 2.3, 1.05, 8, DARK, surfaceTag('glass'))
  prism(out, 0, 0, H + 2.3, H + 3.2, 1.35, 8, RED, metal, 0.15)
  prism(out, 0, 0, H + 3.2, H + 3.7, 0.08, 6, DARK, metal, 0.02)
}

export function ybiFogSignal(out: MeshBuilder, fit: Fit): void {
  const st = surfaceTag('clapboard'), conc = surfaceTag('concrete')
  const hx = Math.max(2.6, fit.hx), hz = Math.max(3.5, fit.hz)
  // the white retaining wall / terrace it stands on, running out along the cliff lip and down its face
  box(out, 0, -1.5, hz + 1, hx + 9, 2.5, 2.2, WHITE, conc)
  box(out, 0, -0.9, 0, hx + 3, 1.9, hz + 1.5, WHITE, conc)
  // the house: white walls, a red gable roof, windows on the seaward end
  box(out, 0, 1.6, 0, hx, 1.6, hz, WHITE, st)
  roof(out, -hx - 0.3, hx + 0.3, -hz - 0.3, hz + 0.3, 3.2, 1.8, hx + 0.3, 0, RED)
  for (const u of [-0.9, 0.9]) box(out, u, 1.8, hz + 0.02, 0.35, 0.55, 0.03, DARK, 0)
}

/**
 * LIME POINT LIGHT (1883/1900; BUGS.md #262), at the foot of the cliff under the Golden Gate Bridge's north tower,
 * from Commons "Lime Point Lighthouse, SW view.jpg": on a 30 m rock spur of red-brown chert, a run of weathered grey
 * concrete — a long retaining wall with a walkway back to the cliff, a squat flat-roofed block — and the fog-signal
 * house at the seaward end: brick-red and grey render under a rusty red roof, a small steel light frame on its corner.
 * Standalone (`deckAbove: 0`); local +z is the spur's length, the sea end at +z.
 */
export function limePointLight(out: MeshBuilder, _fit: Fit): void {
  const conc = surfaceTag('concrete'), rock = surfaceTag('concrete'), metal = surfaceTag('metal')
  const CHERT: Rgb = [0.48, 0.27, 0.2], GREY: Rgb = [0.66, 0.65, 0.61], RUST: Rgb = [0.5, 0.24, 0.18]
  // the rock spur
  prism(out, 0, 4, -2, 3, 9, 7, CHERT, rock, 7)
  prism(out, 0, -8, -2, 4, 8, 6, CHERT, rock, 6)
  prism(out, 1, 14, -2, 2.5, 6, 6, CHERT, rock, 5)
  // the retaining wall and walkway back toward the cliff
  box(out, -3, 4, -10, 1.5, 2, 8, GREY, conc)
  box(out, -3, 6.1, -10, 1.6, 0.1, 8, [0.5, 0.49, 0.46], conc)
  // the squat block, then the fog-signal house
  box(out, 0, 5.5, 2, 3.2, 3, 3, GREY, conc)
  box(out, 0, 5.2, 9, 3.4, 2.7, 4, RUST, surfaceTag('brick'))
  box(out, 0, 2.6, 9, 3.6, 1.2, 4.2, GREY, conc)
  roof(out, -3.6, 3.6, 4.8, 13.2, 7.9, 1.4, 3.6, 0, [0.48, 0.22, 0.17])
  for (const u of [-1.6, 0, 1.6]) box(out, u, 5.6, 13.02, 0.35, 0.6, 0.03, DARK, 0)
  // the light's steel frame and lamp on the corner, and a little railing
  for (const [dx, dz] of [[2.6, 11.6], [3.2, 11.6], [2.6, 12.2], [3.2, 12.2]]) box(out, dx, 9.6, dz, 0.04, 1.7, 0.04, [0.75, 0.75, 0.73], metal)
  box(out, 2.9, 11.4, 11.9, 0.35, 0.2, 0.35, WHITE, metal)
  box(out, 3.6, 6.4, 13.4, 0.04, 0.5, 1.5, [0.7, 0.7, 0.7], metal)
}

/**
 * POINT DIABLO LIGHT (BUGS.md #262), halfway between Point Bonita and Lime Point, from Commons "Point Diablo Light,
 * California.jpg": a small white shed on the top of a steep rock knob over the water, a light mast beside it, and a
 * long steel ladder-stair straight up the knob's face from a little landing at the waterline. Standalone
 * (`deckAbove: 0`); the stair faces +z, the sea.
 */
export function pointDiabloLight(out: MeshBuilder, _fit: Fit): void {
  const rock = surfaceTag('concrete'), metal = surfaceTag('metal'), st = surfaceTag('clapboard')
  const ROCK: Rgb = [0.34, 0.29, 0.24]
  const H = 16
  // a craggy knob: a broad base and offset crags, darker in their clefts
  prism(out, 0, 0, -2, H * 0.45, 12, 7, ROCK, rock, 10)
  prism(out, -3, 2, H * 0.3, H * 0.8, 6.5, 6, [0.3, 0.26, 0.22], rock, 5)
  prism(out, 3, -2, H * 0.3, H * 0.85, 6, 5, [0.38, 0.32, 0.26], rock, 4.5)
  prism(out, 0, -1, H * 0.6, H, 4.5, 6, ROCK, rock, 3.2)
  prism(out, 4, 5, -2, 5, 4, 5, [0.3, 0.26, 0.22], rock, 2.5)
  // the shed and its flat roof, the railing round the top
  box(out, 0, H + 1.3, 0, 2, 1.3, 1.6, WHITE, st)
  box(out, 0, H + 2.7, 0, 2.3, 0.12, 1.9, [0.55, 0.55, 0.55], metal)
  box(out, 0, H + 0.6, 3.2, 3, 0.04, 0.04, [0.7, 0.7, 0.7], metal)
  // the mast with its lamp and antenna
  box(out, 3.2, H + 3, -0.5, 0.08, 3, 0.08, [0.8, 0.8, 0.78], metal)
  box(out, 3.2, H + 6.1, -0.5, 0.35, 0.3, 0.35, WHITE, metal)
  box(out, 3.2, H + 7.3, -0.5, 0.03, 1, 0.03, DARK, metal)
  // the ladder-stair down the seaward face to the landing
  for (let k = 0; k <= 22; k++) {
    const t = k / 22, y = H * (1 - t) + 0.5 * t, zz = 4 + t * 9.5
    box(out, -0.6, y, zz, 0.6, 0.04, 0.12, [0.75, 0.75, 0.73], metal)
  }
  for (const sx of [-1.25, 0.05]) for (let k = 0; k < 11; k++) {
    const t0 = k / 11, t1 = (k + 1) / 11
    box(out, -0.6 + sx + 0.6, (H * (1 - t0) + H * (1 - t1)) / 2 + 0.5, 4 + (t0 + t1) / 2 * 9.5, 0.04, H / 22 + 0.2, 0.45, [0.7, 0.7, 0.68], metal)
  }
  box(out, -0.6, 0.6, 14.5, 1.6, 0.6, 1.2, [0.2, 0.2, 0.2], metal)
}

export const YBI_LIGHT: Record<string, (out: MeshBuilder, fit: Fit) => void> = { ybiLightTower, ybiFogSignal, limePointLight, pointDiabloLight }
