import type { MeshBuilder } from '../../../buildings.ts'
import { type Rgb } from '../../../models.ts'
import { beam, block, hex, lathe, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { G } from './plaza-common.ts'

/*
 * LA FONTAINE DE JOYEUSE (also Fontaine Saint-Louis; 41 rue de Turenne, 3e; 1847 on the site of a 1687 fountain; Boitel's
 * zinc child; Wikidata Q3076142): a stone edicule set against the street front between two houses, about 3.3 m wide: two
 * fluted pilasters on tall pedestals with Ionic-ish capitals, an entablature whose frieze carries the arms of Paris, and a
 * round-arched archivolt over a semi-domed niche (a relief of foliage in the dome); inside, behind an iron grille, a lobed
 * tazza on a stem over a low basin, and on the tazza the child pouring a jar (Modly `joyeuse-enfant`, statues manifest).
 * The real niche is recessed into the house; here the host house's face is NOT claimed or cut: the model's back is HOUSE_Z
 * (its face, local z) minus CLEAR, so the niche back stays 0.55 m or more in front of it (clears shop boards) and the whole
 * edicule stands about 1 m proud of the house. Frame: −z the front (towards the street), x across, y up, pavement at G.
 * Dimensions scaled off Commons photos (Fontaine de Joyeuse, Paris - General View from Rue de Turenne.jpg; ...détail
 * statue.jpg) against the stated width (~3 m, frwiki) and a scooter (~1 m): not surveyed. Dome relief and arms are shallow
 * relief and stay procedural.
 */
export const HX = 1.7
export const HZ = 1.0

// tunables
export const HOUSE_Z = 1.0           // the host houses' face (local z), not claimed
const BACK_Z = 0.45           // the slab's back, 0.55 in front of the house face
const WALL_FRONT = -0.35      // the slab's front plane (pilasters stand proud of it)
const NICHE_BACK = 0.30       // niche back plane
const PIL_PROUD = 0.2
const PIL_X = 1.2             // pilaster centre offset
const PIL_W = 0.55            // pilaster width (shaft)
const PED_H = 1.1
const PED_W = 0.9
const SHAFT_TOP = 3.7
const CAP_H = 0.3
const ENT_Y = 4.0             // entablature base
const ARCH_H = 0.2
const FRIEZE_H = 0.35
const CORN_H = 0.3
const CORN_OUT = 0.14
const NICHE_A = 0.78          // half-width of the niche opening
const SPRING = 2.9            // arch springing
const ARCHIVOLT = 0.16
const GRILLE_H = 1.1
const BAR_PITCH = 0.1
const TAZZA_Y = 1.85          // top of the tazza (the child stands here)
const TAZZA_R = 0.4

const STONE: Rgb = hex('#cbbb98')
const PALE: Rgb = hex('#d8caa8')
const DARK: Rgb = hex('#a39878')
const NICHE: Rgb = hex('#b69f84')   // the warm, darker niche back
const DOME: Rgb = hex('#c4b494')
const WATER: Rgb = hex('#6d93a0')
const FALL: Rgb = hex('#c4d8dc')
const IRON: Rgb = hex('#2e2f2d')

/** Attach point of the child on the tazza (landmark frame, y includes G) */
export const CHILD_AT: [number, number, number] = [0, G + TAZZA_Y, -0.02]

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const fz = WALL_FRONT - PIL_PROUD    // pilaster front
  // threshold slab and the plinth under the whole front
  block(q, -HX, HX, fz - 0.12, BACK_Z, y(-0.2), y(0.1), DARK)
  // wall slab: piers either side of the niche, and the head above the arch up to the entablature
  const A = NICHE_A
  block(q, -1.5, -A, WALL_FRONT, BACK_Z, y(0.1), y(ENT_Y), STONE)
  block(q, A, 1.5, WALL_FRONT, BACK_Z, y(0.1), y(ENT_Y), STONE)
  // arch head: stepped voussoir slices over the opening, from the springing to the entablature
  const N = 14
  for (let i = 0; i < N; i++) {
    const x0 = -A + (i / N) * 2 * A, x1 = x0 + (2 * A) / N, xc = (x0 + x1) / 2
    const h = SPRING + Math.sqrt(Math.max(0, A * A - xc * xc)) * 0.82
    block(q, x0, x1, WALL_FRONT, BACK_Z, y(h), y(ENT_Y), STONE)
  }
  // niche back, floor
  block(q, -A, A, NICHE_BACK, BACK_Z, y(0.1), y(SPRING), NICHE)
  for (let i = 0; i < N; i++) {
    const x0 = -A + (i / N) * 2 * A, x1 = x0 + (2 * A) / N, xc = (x0 + x1) / 2
    const h = SPRING + Math.sqrt(Math.max(0, A * A - xc * xc)) * 0.82
    block(q, x0, x1, NICHE_BACK, BACK_Z, y(SPRING), y(h), DOME)
  }
  // the semi-dome: stepped half-discs receding into the head, a foliage relief suggested by ribs
  const R = 8
  for (let k = 0; k < R; k++) {
    const f = 1 - k / R
    const a = A * f
    const z1 = WALL_FRONT + 0.02 + k * ((NICHE_BACK - WALL_FRONT - 0.04) / R)
    const z0 = z1 + (NICHE_BACK - WALL_FRONT - 0.04) / R
    for (let i = 0; i < 10; i++) {
      const x0 = -a + (i / 10) * 2 * a, x1 = x0 + (2 * a) / 10, xc = (x0 + x1) / 2
      const h = SPRING - 0.02 + Math.sqrt(Math.max(0, a * a - xc * xc)) * 0.82
      block(q, x0, x1, z1, z0, y(SPRING - 0.05), y(h), shade(DOME, 0.95 + 0.05 * f))
    }
  }
  // archivolt: a moulded band round the opening
  const M = 20
  const rr = A + ARCHIVOLT / 2
  for (let i = 0; i < M; i++) {
    const a0 = (i / M) * Math.PI, a1 = ((i + 1) / M) * Math.PI
    const p = (a: number): [number, number, number] => [Math.cos(a) * rr, y(SPRING + Math.sin(a) * rr * 0.82), WALL_FRONT - 0.05]
    beam(q, p(a0), p(a1), ARCHIVOLT / 2, PALE)
  }
  // jamb mouldings (impost blocks) at the springing
  for (const s of [-1, 1]) block(q, Math.min(s * A, s * (A + 0.2)), Math.max(s * A, s * (A + 0.2)), WALL_FRONT - 0.07, WALL_FRONT, y(SPRING - 0.12), y(SPRING + 0.08), PALE)

  // pilasters: pedestal, base, fluted shaft, capital
  for (const s of [-1, 1]) {
    const cx = s * PIL_X
    block(q, cx - PED_W / 2, cx + PED_W / 2, fz - 0.07, BACK_Z, y(0.1), y(PED_H), shade(STONE, 0.97))
    block(q, cx - PED_W / 2 - 0.05, cx + PED_W / 2 + 0.05, fz - 0.1, BACK_Z, y(PED_H - 0.12), y(PED_H), PALE)
    block(q, cx - PIL_W / 2 - 0.04, cx + PIL_W / 2 + 0.04, fz, WALL_FRONT, y(PED_H), y(PED_H + 0.12), PALE)
    block(q, cx - PIL_W / 2, cx + PIL_W / 2, fz, WALL_FRONT, y(PED_H + 0.12), y(SHAFT_TOP), shade(STONE, 1.02))
    // flutes: five dark grooves
    for (let i = 0; i < 5; i++) {
      const fx = cx - PIL_W / 2 + PIL_W * (i + 0.5) / 5
      block(q, fx - 0.012, fx + 0.012, fz - 0.015, fz + 0.02, y(PED_H + 0.4), y(SHAFT_TOP - 0.3), shade(DARK, 0.9))
    }
    // capital: a flared block with a little volute at each side
    block(q, cx - PIL_W / 2 - 0.08, cx + PIL_W / 2 + 0.08, fz - 0.06, WALL_FRONT, y(SHAFT_TOP), y(SHAFT_TOP + CAP_H), PALE)
    for (const v of [-1, 1]) lathe(q, cx + v * (PIL_W / 2 + 0.02), fz - 0.04, [[0.05, y(SHAFT_TOP + 0.06)], [0.05, y(SHAFT_TOP + CAP_H - 0.04)]], 8, DARK)
  }
  // entablature: architrave, frieze (arms of Paris), cornice
  const eo = fz - 0.04
  block(q, -1.62, 1.62, eo, BACK_Z, y(ENT_Y), y(ENT_Y + ARCH_H), PALE)
  block(q, -1.62, 1.62, eo + 0.03, BACK_Z, y(ENT_Y + ARCH_H), y(ENT_Y + ARCH_H + FRIEZE_H), shade(STONE, 1.0))
  block(q, -1.62 - CORN_OUT, 1.62 + CORN_OUT, eo - CORN_OUT, BACK_Z, y(ENT_Y + ARCH_H + FRIEZE_H), y(ENT_Y + ARCH_H + FRIEZE_H + CORN_H), PALE)
  block(q, -1.62 - CORN_OUT - 0.04, 1.62 + CORN_OUT + 0.04, eo - CORN_OUT - 0.05, BACK_Z, y(ENT_Y + ARCH_H + FRIEZE_H + CORN_H), y(ENT_Y + ARCH_H + FRIEZE_H + CORN_H + 0.07), shade(PALE, 0.96))
  // the arms: a shield on the frieze with scrolls either side (shallow relief)
  const ay = ENT_Y + ARCH_H
  block(q, -0.22, 0.22, eo - 0.02, eo + 0.05, y(ay + 0.03), y(ay + FRIEZE_H + 0.12), shade(PALE, 1.04))
  block(q, -0.14, 0.14, eo - 0.045, eo - 0.02, y(ay + 0.08), y(ay + FRIEZE_H + 0.07), shade(DARK, 0.85))
  for (const s of [-1, 1]) beam(q, [s * 0.28, y(ay + 0.12), eo - 0.03], [s * 0.6, y(ay + 0.24), eo - 0.03], 0.03, PALE)

  // grille across the niche mouth: top and bottom rails, a bar every BAR_PITCH, and a return along each side
  const gz = WALL_FRONT + 0.06
  block(q, -A, A, gz - 0.02, gz + 0.02, y(GRILLE_H - 0.04), y(GRILLE_H), IRON)
  block(q, -A, A, gz - 0.02, gz + 0.02, y(0.14), y(0.2), IRON)
  for (let x = -A + BAR_PITCH / 2; x < A; x += BAR_PITCH) block(q, x - 0.01, x + 0.01, gz - 0.01, gz + 0.01, y(0.14), y(GRILLE_H), IRON)

  // lower basin: a half-round against the niche back, water in it, a lobed lip
  const bz = NICHE_BACK, br = 0.6
  const sides = 16
  for (let i = 0; i < sides; i++) {
    const a0 = Math.PI + (i / sides) * Math.PI, a1 = Math.PI + ((i + 1) / sides) * Math.PI
    const p0 = [Math.cos(a0) * br, bz + Math.sin(a0) * br], p1 = [Math.cos(a1) * br, bz + Math.sin(a1) * br]
    beam(q, [p0[0], y(0.5), p0[1]], [p1[0], y(0.5), p1[1]], 0.07, shade(STONE, 1.03))
    beam(q, [p0[0] * 0.98, y(0.25), p0[1]], [p1[0] * 0.98, y(0.25), p1[1]], 0.1, shade(STONE, 0.95))
  }
  block(q, -br + 0.07, br - 0.07, bz - br + 0.07, bz, y(0.12), y(0.42), WATER)
  // stem and the tazza: a lathe about (0, -0.02), a ribbed scalloped bowl
  lathe(q, 0, -0.02, [[0.08, y(0.3)], [0.1, y(0.7)], [0.09, y(1.05)], [0.16, y(1.25)], [0.3, y(1.5)], [TAZZA_R * 0.95, y(1.75)], [TAZZA_R, y(TAZZA_Y - 0.06)], [TAZZA_R * 0.9, y(TAZZA_Y)]], 18, shade(STONE, 1.04))
  // the pour from the jar to the tazza and the fall over its lip
  beam(q, [0.03, y(TAZZA_Y + 0.45), -0.12], [0.1, y(TAZZA_Y), -0.14], 0.012, FALL)
  for (let i = 0; i < 8; i++) {
    const a = Math.PI + 0.3 + (i / 7) * (Math.PI - 0.6)
    beam(q, [Math.cos(a) * TAZZA_R, y(TAZZA_Y - 0.08), -0.02 + Math.sin(a) * TAZZA_R], [Math.cos(a) * (TAZZA_R + 0.04), y(0.6), -0.02 + Math.sin(a) * (TAZZA_R + 0.06)], 0.01, FALL)
  }
}

export function fontaineJoyeuse(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
