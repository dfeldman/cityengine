import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, classicalColumn, hex, shade } from '../../kit.ts'
import { signText } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { figure, horseman, rustication, vault } from './common.ts'

/*
 * The triumphal gates: the Carrousel's arch between the Louvre and the Tuileries, and Louis XIV's two gates on the
 * Grands Boulevards where the old wall stood. Each is drawn in its own design metres — OSM's footprint, measured in its
 * frame with osmium (2026-10-29) — and fitted to the footprint the loader gives. The openings are real (stacked
 * slices, the Arc de Triomphe's way): the streets run through them.
 */

/** Signs (the inscriptions) are not carried through `fitted`, so they go on `out` at the fitted scale. */
function inscription(out: MeshBuilder, fit: Fit, hx: number, hz: number, text: string, x: number, y: number, z: number, h: number, c: Rgb, heading: number): void {
  const sx = fit.hx > 0 ? fit.hx / hx : 1
  const sz = fit.hz > 0 ? fit.hz / hz : 1
  signText(out, text, x * sx, y, z * sz, h, c, { heading })
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * The ARC DE TRIOMPHE DU CARROUSEL (Percier and Fontaine, 1806–08), Napoleon's arch at the gate of the Tuileries,
 * on the axis that runs from the Louvre's pyramid to the Arc de Triomphe. OSM way 227483542 and its 58 parts (in this
 * frame, local x along the arch, −z toward the Tuileries at bearing 295.7):
 *
 * - three arches through it, the middle one 4.1 m wide and 9 m to its crown, the side ones to 5 m;
 * - eight Corinthian COLUMNS of red Languedoc marble with bronze capitals, four on each face on their pedestals, the
 *   entablature breaking forward over each, and on each break a soldier of the Grande Armée;
 * - the attic with its reliefs, and on top Bosio's gilded QUADRIGA — Peace in her chariot, four horses, two gilded
 *   Victories leading them (the bronze horses of Saint Mark stood here until 1815).
 */
const CX = 9.2
const CZ = 5.15
export function carrouselArch(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, CX, CZ, (q) => carrousel(q))
}

function carrousel(out: MeshBuilder): void {
  const stone = hex('#e8dfcf')
  const relief = shade(stone, 0.86)
  const marble: Rgb = [0.74, 0.47, 0.45]
  const bronze: Rgb = [0.36, 0.3, 0.2]
  const gilt: Rgb = [0.84, 0.67, 0.3]
  const bz = 3.3
  // the piers: outer (6.9…8.8), inner (2.1…4.3), each through the depth
  for (const s of [-1, 1]) {
    block(out, s > 0 ? 6.9 : -8.8, s > 0 ? 8.8 : -6.9, -bz, bz, 0, 10.5, stone)
    block(out, s > 0 ? 2.1 : -4.3, s > 0 ? 4.3 : -2.1, -bz, bz, 0, 10.5, stone)
    // the side arch between them (2.6 m, to 5 m) and the wall over it, with a relief panel either face
    vault(out, s * 5.6, 1.3, -bz, bz, 3.7, 10.5, stone, 8)
    for (const f of [-1, 1]) block(out, s * 5.6 - 1.15, s * 5.6 + 1.15, f * bz - 0.06, f * bz + 0.06, 6.0, 9.6, relief)
  }
  // the middle arch (4.2 m, to 9 m) and its keystone
  vault(out, 0, 2.1, -bz, bz, 6.9, 10.5, stone, 14)
  for (const f of [-1, 1]) block(out, -0.4, 0.4, f * bz - 0.12, f * bz + 0.12, 8.6, 10.0, shade(stone, 1.05))
  // the columns, their pedestals, and the entablature breaking forward over them
  for (const x of [-7.85, -3.3, 3.3, 7.85]) {
    for (const f of [-1, 1]) {
      const z = f * 4.2
      block(out, x - 0.75, x + 0.75, z - 0.85, z + 0.85, 0, 2.0, stone)
      block(out, x - 0.85, x + 0.85, z - 0.95, z + 0.95, 1.8, 2.1, shade(stone, 1.04))
      classicalColumn(out, x, z, 2.1, 10.5, 0.42, marble, { order: 'corinthian', tier: 'mid', heading: f > 0 ? 0 : Math.PI, trim: bronze })
      block(out, x - 0.8, x + 0.8, f > 0 ? bz : z - 0.9, f > 0 ? z + 0.9 : -bz, 10.5, 12.0, stone)
      // a soldier of the Grande Armée on the break, in coloured marble
      block(out, x - 0.45, x + 0.45, z - 0.45, z + 0.45, 12.0, 12.5, stone)
      figure(out, x, 12.5, z, 2.5, shade(stone, 0.95))
    }
  }
  // the entablature, the attic and its reliefs, the plinth for the quadriga
  block(out, -9.0, 9.0, -bz - 0.3, bz + 0.3, 10.5, 11.5, stone)
  block(out, -9.2, 9.2, -bz - 0.5, bz + 0.5, 11.5, 12.0, shade(stone, 1.04))
  block(out, -8.8, 8.8, -bz, bz, 12.0, 16.0, stone)
  for (const f of [-1, 1]) for (const x of [-5.6, 0, 5.6]) block(out, x - 1.6, x + 1.6, f * bz - 0.06, f * bz + 0.06, 12.8, 15.2, relief)
  block(out, -9.0, 9.0, -bz - 0.2, bz + 0.2, 15.6, 16.0, shade(stone, 1.04))
  block(out, -4.2, 4.2, -bz, bz, 16.0, 17.5, stone)
  // the quadriga, facing the Tuileries: four gilded horses abreast, the chariot, Peace standing in it, a Victory each side
  for (const x of [-1.5, -0.5, 0.5, 1.5]) horseman(out, x, 17.5, -1.2, Math.PI, gilt, 0.95, false)
  block(out, -1.1, 1.1, 0.4, 2.2, 17.5, 19.0, gilt)
  figure(out, 0, 19.0, 1.3, 2.6, gilt)
  for (const s of [-1, 1]) figure(out, s * 3.1, 17.5, -1.0, 2.4, gilt)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * The PORTE SAINT-DENIS (François Blondel, 1672), Louis XIV's arch for his victories on the Rhine, astride the Rue
 * Saint-Denis on the boulevard: 24.65 m of warm limestone, one great arch, and on each face two flat OBELISKS in
 * relief rising from pedestals either side of it, hung with trophies of arms, a lion couchant at each foot; the small
 * doorways through the pedestals; the reliefs over the arch (the Passage of the Rhine to the south, Maastricht to the
 * north); the cornice; the attic and LUDOVICO MAGNO. OSM relation 3170072 (x ±11.9 with its end buttresses, z ±3.6),
 * −z facing south down the Rue Saint-Denis (bearing 198.2).
 */
const DX = 11.9
const DZ = 3.6
export function porteSaintDenis(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, DX, DZ, (q) => saintDenis(q))
  for (const f of [-1, 1]) inscription(out, fit, DX, DZ, 'LUDOVICO MAGNO', 0, 22.7, f * (DZ + 0.05), 1.0, [0.82, 0.66, 0.3], f < 0 ? Math.PI : 0)
}

function saintDenis(out: MeshBuilder): void {
  const stone = hex('#ddcfb3')
  const relief = shade(stone, 0.88)
  const deep = shade(stone, 0.62)
  const hz = DZ
  const aw = 4.0          // half the arch's width
  const spring = 11.6     // to a crown at 15.6
  // the two masses either side of the arch, the end buttresses, the arch's vault
  for (const s of [-1, 1]) {
    block(out, s > 0 ? aw : -10.9, s > 0 ? 10.9 : -aw, -hz, hz, 0, 20.4, stone)
    block(out, s > 0 ? 10.9 : -11.9, s > 0 ? 11.9 : -10.9, -2.0, 2.0, 0, 20.4, stone)
  }
  vault(out, 0, aw, -hz, hz, spring, 20.4, stone, 16)
  for (const f of [-1, 1]) {
    const z = f * hz
    const d = (v: number): [number, number] => (f < 0 ? [z - v, z] : [z, z + v])
    // the archivolt round the arch, and its keystone
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI
      const [za, zb] = d(0.15)
      block(out, Math.cos(a) * (aw + 0.35) - 0.3, Math.cos(a) * (aw + 0.35) + 0.3, za, zb, spring + Math.sin(a) * (aw + 0.35) - 0.3, spring + Math.sin(a) * (aw + 0.35) + 0.3, shade(stone, 1.04))
    }
    // the relief over the arch, filling the spandrel to the cornice
    {
      const [za, zb] = d(0.1)
      block(out, -5.6, 5.6, za, zb, 16.4, 19.6, relief)
    }
    for (const s of [-1, 1]) {
      const xc = s * 7.45
      // the pedestal with its doorway, then the obelisk in relief tapering up to the cornice
      const [pa, pb] = d(0.35)
      block(out, xc - 2.4, xc + 2.4, pa, pb, 0, 5.4, shade(stone, 1.03))
      const [da, db] = d(0.37)
      block(out, xc - 0.85, xc + 0.85, da, db, 0, 2.9, deep)
      for (let k = 0; k < 10; k++) {
        const y0 = 5.4 + k * 1.45
        const w = 1.75 - k * 0.12
        const [oa, ob] = d(0.28)
        block(out, xc - w, xc + w, oa, ob, y0, y0 + 1.45, relief)
      }
      // the trophies of arms piled on the obelisk, and the lion couchant at its foot
      for (const y of [7.2, 10.0, 12.8]) {
        const [ta, tb] = d(0.55)
        block(out, xc - 1.0, xc + 1.0, ta, tb, y, y + 1.6, shade(stone, 0.95))
      }
      const [la, lb] = d(0.9)
      block(out, xc - 1.6, xc + 1.6, la, lb, 5.4, 6.3, shade(stone, 0.95))
    }
  }
  // the cornice, the attic, its own cornice
  block(out, -11.4, 11.4, -hz - 0.45, hz + 0.45, 20.4, 21.4, shade(stone, 1.05))
  block(out, -10.6, 10.6, -hz + 0.1, hz - 0.1, 21.4, 24.0, stone)
  block(out, -10.9, 10.9, -hz - 0.15, hz + 0.15, 24.0, 24.65, shade(stone, 1.05))
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * The PORTE SAINT-MARTIN (Pierre Bullet, 1674), astride the Rue Saint-Martin 300 m east of Saint-Denis: 18 m square,
 * banded all over with vermiculated rustication, a tall middle arch between two lower ones, the four reliefs (the
 * taking of Besançon, the triple alliance broken, Limbourg, the Germans beaten) in the spandrels, the cornice, and the
 * attic with LUDOVICO MAGNO. OSM relation 3178897 (x ±9, z ±2.4), −z facing south (bearing 200).
 */
const MX = 9.0
const MZ = 2.4
export function porteSaintMartin(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, MX, MZ, (q) => saintMartin(q))
  for (const f of [-1, 1]) inscription(out, fit, MX, MZ, 'LUDOVICO MAGNO', 0, 16.0, f * (MZ + 0.05), 0.85, [0.78, 0.62, 0.28], f < 0 ? Math.PI : 0)
}

function saintMartin(out: MeshBuilder): void {
  const stone = hex('#d8c9ab')
  const groove = shade(stone, 0.72)
  const relief = shade(stone, 0.9)
  const hz = MZ
  // the piers between the three arches, each through the depth
  const piers: [number, number][] = [[-9.0, -5.7], [-3.5, -2.55], [2.55, 3.5], [5.7, 9.0]]
  for (const [x0, x1] of piers) block(out, x0, x1, -hz, hz, 0, 14.4, stone)
  // the middle arch, 5.1 m wide to 10.9, and the two side ones, 2.2 m to 6.2
  vault(out, 0, 2.55, -hz, hz, 8.35, 14.4, stone, 14)
  for (const s of [-1, 1]) vault(out, s * 4.6, 1.1, -hz, hz, 5.1, 14.4, stone, 8)
  for (const f of [-1, 1]) {
    const plane = f * hz
    // the vermiculated bands over every face below the cornice: on the piers, and over each arch from its crown
    for (const [x0, x1] of piers) rustication(out, x0, x1, plane, f, 0, 14.0, 0.75, groove)
    rustication(out, -2.55, 2.55, plane, f, 10.5, 14.0, 0.75, groove)
    for (const s of [-1, 1]) rustication(out, s * 4.6 - 1.1, s * 4.6 + 1.1, plane, f, 6.0, 14.0, 0.75, groove)
    // the four reliefs: over each side arch, and the two in the spandrels of the middle one
    for (const s of [-1, 1]) {
      const zz = f < 0 ? [plane - 0.12, plane] : [plane, plane + 0.12]
      block(out, s * 4.6 - 1.6, s * 4.6 + 1.6, zz[0], zz[1], 7.4, 12.6, relief)
      block(out, s * 1.6 - 0.9, s * 1.6 + 0.9, zz[0], zz[1], 11.6, 13.8, relief)
    }
  }
  // the cornice, the attic, its coping
  block(out, -9.4, 9.4, -hz - 0.4, hz + 0.4, 14.4, 15.3, shade(stone, 1.05))
  block(out, -8.6, 8.6, -hz + 0.1, hz - 0.1, 15.3, 17.4, stone)
  block(out, -8.9, 8.9, -hz - 0.15, hz + 0.15, 17.4, 18.0, shade(stone, 1.05))
}
