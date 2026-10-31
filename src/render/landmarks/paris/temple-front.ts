import type { MeshBuilder } from '../../buildings.ts'
import { prism, type Rgb } from '../../models.ts'
import { block, classicalColumn, hex, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'
import { boxOn, classicalDoor, faceFrame, niche, pedimentFront, statue } from './monuments/gothic.ts'

const FIXED = 0

/**
 * The classical temple fronts of Paris (PARIS_EXPAND §5 B, a family): a stepped podium, a row of Corinthian
 * columns, the entablature with its frieze, and the PEDIMENT with its sculpted tympanum.
 *
 * `peripteral`: columns all the way round (the Madeleine, 52 of them); else a portico on the front only, set
 * against the building behind (the Assemblée nationale's twelve columns to the Seine).
 *
 * Local frame: the front faces −z; the long axis along z for a peripteral temple, x for a portico.
 */
interface TempleSpec {
  peripteral: boolean
  /** columns across the front */
  front: number
  /** column height, and the podium's */
  col: number
  podium: number
  /** the portico's own width (a portico on a wider building); the whole front when absent */
  width?: number
}

function temple(out: MeshBuilder, fit: Fit, t: TempleSpec): void {
  // (Batch 5, 2026-10-31: '#e3d9c4' in linear is white in the sun; the Madeleine's soot-grey Corinthian is not)
  const stone = hex('#a39a87')
  const deep = shade(stone, 0.8)
  const shadow: Rgb = [0.34, 0.33, 0.31]
  const hx = t.peripteral ? Math.min(Math.max(fit.hx, 18), 24) : Math.min(fit.hx, (t.width ?? 60) / 2)
  const hz = t.peripteral ? Math.min(Math.max(fit.hz, 45), 56) : Math.min(fit.hz, 30)
  const r = t.col / 20
  const cap = t.col
  const ent = cap + t.col * 0.2
  const front = -hz
  // the podium and its steps across the front
  const steps = 8
  for (let i = 0; i < steps; i++) {
    const out0 = (steps - i) * (t.podium / steps) * 1.2
    block(out, -hx - (t.peripteral ? 1.5 : 0) - (t.peripteral ? 0 : 0), hx + (t.peripteral ? 1.5 : 0), front - out0, t.peripteral ? hz + 1.5 : front + 12, (i * t.podium) / steps, ((i + 1) * t.podium) / steps, shade(stone, 0.9 + (i % 2) * 0.04))
  }
  const y0 = t.podium
  if (t.peripteral) {
    // the cella: the solid wall inside the colonnade, in shadow
    block(out, -hx + 4, hx - 4, front + 5, hz - 4, y0, y0 + ent - 1, deep)
    // the cella's dress (Batch 5): the bronze doors of Triqueti behind the front's columns, and down each flank the saints in their niches, 34 of them, with a cornice over
    const fr = faceFrame(out, '-z', front + 5)
    classicalDoor(fr, 0, y0, 5.6, 10.8, stone, hex('#2f3a33'), { head: 'flat', pediment: true })
    for (const s of [-1, 1]) {
      const side = faceFrame(out, s < 0 ? '-x' : '+x', s * (hx - 4))
      const n = 17
      for (let i = 0; i < n; i++) {
        const z = front + 8 + ((2 * hz - 16) * i) / (n - 1)
        niche(side, z, y0 + 5, 1.5, 7, 0.02, deep, hex('#3d3a34'))
        statue(out, s * (hx - 3.92), y0 + 5.1, z, 4.2, shade(stone, 1.08))
      }
      boxOn(side, front + 5, hz - 4, y0 + 13.6, y0 + 14.1, 0, 0.3, stone)
    }
    for (const s of [-1, 1]) for (const f of [-1, 1]) niche(fr, s * (hx - 8) * 0.72 + f * 2, y0 + 3, 1.2, 5, 0.02, deep, hex('#3d3a34'))
  }
  /*
   * The columns. This file used to carry the best column in the project as a private helper; it is now the
   * SHARED primitive (render/landmarks/column.ts), so everything else that wanted a Corinthian column got it
   * at the same time. The front row is the subject of the building, so it is modelled at the near tier with
   * real flutes; the back row and a peripteral temple's flanks are mid, which is the whole point of the tiers
   * — the Madeleine has 42 of them.
   */
  const colAt = (x: number, z: number, tier: 'near' | 'mid' = 'near'): void => {
    classicalColumn(out, x, z, y0, y0 + cap, r, stone,
      { order: 'corinthian', tier, tag: FIXED, flutes: tier === 'near', trim: shade(stone, 1.03) })
  }
  const across = (i: number): number => -hx + 1 + ((2 * hx - 2) * i) / (t.front - 1)
  for (let i = 0; i < t.front; i++) colAt(across(i), front + 1)
  if (t.peripteral) {
    for (let i = 0; i < t.front; i++) colAt(across(i), hz - 1, 'mid')
    const side = Math.round((t.front * hz) / hx)
    for (let j = 1; j < side - 1; j++) {
      const z = front + 1 + ((2 * hz - 2) * j) / (side - 1)
      colAt(-hx + 1, z, 'mid')
      colAt(hx - 1, z, 'mid')
    }
  } else {
    // a second row behind the first, and the wall of the building behind the portico, in shadow
    for (let i = 0; i < t.front; i++) colAt(across(i), front + 5, 'mid')
    block(out, -hx, hx, front + 9, front + 10, y0, y0 + ent, shadow)
  }
  // the entablature: architrave, frieze, cornice
  const z1 = t.peripteral ? hz : front + 10
  block(out, -hx, hx, front, z1, y0 + cap, y0 + cap + t.col * 0.07, shade(stone, 1.02))
  block(out, -hx, hx, front, z1, y0 + cap + t.col * 0.07, y0 + cap + t.col * 0.14, stone)
  block(out, -hx - 0.4, hx + 0.4, front - 0.4, z1 + (t.peripteral ? 0.4 : 0), y0 + cap + t.col * 0.14, y0 + ent, shade(stone, 1.05))
  // the pediment over the front (and the back of a temple), its tympanum with a sculpted relief in shadow
  const rise = hx * 0.36
  const ped = (z: number, face: -1 | 1): void => {
    const b = y0 + ent
    const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    // the tympanum's two faces as triangles, and the two raking cornices over them
    for (const zz of [z - 1.2, z + 1.2]) {
      const n: [number, number, number] = [0, 0, zz < z ? -1 : 1]
      out.quad([[-hx, b, zz], [hx, b, zz], [0, b + rise, zz], [0, b + rise, zz]], n, UVQ, stone, FIXED)
    }
    const len = Math.hypot(hx, rise)
    for (const sx of [-1, 1]) {
      const nx = (sx * rise) / len
      const ny = hx / len
      out.quad([[sx * (hx + 0.5), b - 0.2, z - 1.6], [0, b + rise + 0.5, z - 1.6], [0, b + rise + 0.5, z + 1.6], [sx * (hx + 0.5), b - 0.2, z + 1.6]],
        [nx, ny, 0], UVQ, shade(stone, 1.06), FIXED)
      out.quad([[sx * (hx + 0.5), b - 0.2, z - 1.6], [sx * (hx + 0.5), b - 0.75, z - 1.6], [0, b + rise - 0.05, z - 1.6], [0, b + rise + 0.5, z - 1.6]],
        [0, 0, -1], UVQ, shade(stone, 0.95), FIXED)
    }
    // the relief: the Last Judgement's crowd, Christ tall in the middle (Lemaire), lying down to the corners (Batch 5: the kit's figures)
    pedimentFront(faceFrame(out, face < 0 ? '-z' : '+z', z + face * 1.2), -hx * 0.96, hx * 0.96, b + 0.02, rise * 0.94, 0.34, shade(stone, 0.96), { relief: 19, reliefC: shade(stone, 1.08) })
  }
  ped(front + 0.8, -1)
  if (t.peripteral) {
    ped(hz - 0.8, 1)
    // the roof between the pediments, low-pitched
    for (const sx of [-1, 1]) {
      out.quad([[sx * hx, y0 + ent, front + 2], [sx * hx, y0 + ent, hz - 2], [0, y0 + ent + rise, hz - 2], [0, y0 + ent + rise, front + 2]],
        [sx * 0.5, 0.87, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], hex('#4a5155'), FIXED)
    }
    // the three shallow lead domes that light the nave, and the ridge's crest
    for (const z of [front + 18, 0, hz - 18]) prism(out, 0, z, y0 + ent + rise - 0.2, y0 + ent + rise + 1.1, 4.4, 12, hex('#3f464a'), FIXED, 1.4)
  }
}

/** The Madeleine: a Corinthian temple, 52 columns on a 7 m podium, the Last Judgement in its pediment. */
export function madeleine(out: MeshBuilder, fit: Fit): void {
  temple(out, fit, { peripteral: true, front: 8, col: 20, podium: 6.5 })
}

/** The Palais Bourbon's portico to the Seine: twelve columns and a pediment, across the Pont de la Concorde. */
export function assembleePortico(out: MeshBuilder, fit: Fit): void {
  temple(out, fit, { peripteral: false, front: 12, col: 16, podium: 5, width: 48 })
}

/** The École Militaire's frontispiece to the Champ de Mars: ten Corinthian columns and the pediment. */
export function ecoleMilitairePortico(out: MeshBuilder, fit: Fit): void {
  temple(out, fit, { peripteral: false, front: 10, col: 13, podium: 1.2, width: 34 })
}
