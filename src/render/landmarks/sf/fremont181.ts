/**
 * 181 FREMONT (Heller Manus, 2018; way/445566153): the braced glass tower by Salesforce Park. From the owner's photograph
 * (2026-10-02, "a super cool building … we need to do a custom for it"): dark blue-green glass in a fine grid, held
 * in a WHITE FRAME — white columns down every corner — and crossed by the white MEGA-BRACES that are the building:
 * on each face a long diagonal from the top corner down to the far side of a white band two-thirds up, a shallow V
 * hung from that band, and a second diagonal from the band's middle down to the near corner low on the shaft. The
 * top is RAKED: the roof slopes down across the tower to a white lattice screen at its low corner, the spire on the
 * high one.
 *
 * Was `ring-tower.ts`'s generic grid preset with a mast — none of that — until the owner sent the photograph.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower } from '../tower.ts'
import { beam } from './golden-gate.ts'

const GLASS: Rgb = [0.22, 0.30, 0.36]
const MULLION: Rgb = [0.55, 0.60, 0.64]
const WHITE: Rgb = [0.95, 0.95, 0.94]
/** to the low side of the raked roof, the high side, and the spire's top */
const LOW = 222
const HIGH = 240
const SPIRE = 268

type V3 = [number, number, number]

export function fremont181(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(14, Math.min(fit.hx, 24))
  const hz = Math.max(14, Math.min(fit.hz, 24))
  const metal = surfaceTag('metal')
  tower(out, { ...fit, ring: undefined, hx, hz, height: LOW }, {
    height: LOW,
    tiers: [{ to: 1, face: { kind: 'curtain', wall: MULLION, glass: GLASS, pitch: 1.6, floor: 4.0, solid: 0.1, material: 'glass' } }],
    crown: { kind: 'flat' },
  })

  // the raked top: from LOW along −x to HIGH along +x, glass on its two sloping sides, the roof between
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const glass = surfaceTag('glass')
  const k = (HIGH - LOW) / (2 * hx)
  out.quad([[-hx, LOW, -hz], [hx, HIGH, -hz], [hx, HIGH, hz], [-hx, LOW, hz]], [-k, 1, 0], uv, [0.70, 0.72, 0.74], metal)
  for (const s of [-1, 1]) {
    out.quad([[-hx, LOW, s * hz], [hx, LOW, s * hz], [hx, HIGH, s * hz], [-hx, LOW, s * hz]], [0, 0, s], uv, GLASS, glass)
  }
  out.quad([[hx, LOW, -hz], [hx, LOW, hz], [hx, HIGH, hz], [hx, HIGH, -hz]], [1, 0, 0], uv, GLASS, glass)
  // the lattice screen at the low corner, a frame of white bars
  for (let i = 0; i <= 6; i++) {
    const z = -hz + 1 + (i * (hz - 1)) / 6
    box(out, -hx + 4, LOW + 6, z, 0.12, 6, 0.12, WHITE, metal)
  }
  box(out, -hx + 4, LOW + 12, -hz / 2, 0.3, 0.2, hz / 2, WHITE, metal)
  // the spire on the high corner
  box(out, hx - 3, (HIGH + SPIRE) / 2, hz - 3, 0.6, (SPIRE - HIGH) / 2, 0.6, WHITE, metal)

  // the white corner frame, standing proud of the glass
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    const top = sx > 0 ? HIGH : LOW
    box(out, sx * (hx + 0.3), top / 2, sz * (hz + 0.3), 1.5, top / 2, 1.5, WHITE, metal)
  }

  // the braces, face by face: (u along the face, 0..1; y up)
  const BAND = 0.64 * LOW
  const faces: { at: (u: number, y: number) => V3 }[] = [
    { at: (u, y) => [-hx + 2 * hx * u, y, hz + 0.7] },
    { at: (u, y) => [hx - 2 * hx * u, y, -hz - 0.7] },
    { at: (u, y) => [hx + 0.7, y, hz - 2 * hz * u] },
    { at: (u, y) => [-hx - 0.7, y, -hz + 2 * hz * u] },
  ]
  for (const f of faces) {
    const B = (a: V3, b: V3, w = 2.2): void => beam(out, a, b, w, 1.2, WHITE)
    // the band two-thirds up, and the one just above it the V hangs from
    B(f.at(0, BAND), f.at(1, BAND), 2.6)
    B(f.at(0, BAND + 9), f.at(1, BAND + 9), 1.8)
    // the shallow V between them
    B(f.at(0, BAND + 9), f.at(0.5, BAND))
    B(f.at(1, BAND + 9), f.at(0.5, BAND))
    // the long diagonal from the top corner down to the far end of the upper band
    B(f.at(0.03, LOW - 2), f.at(0.97, BAND + 9), 2.6)
    // and the lower one, from the band's middle down to the near corner
    B(f.at(0.5, BAND), f.at(0.03, 0.18 * LOW), 2.6)
    // the floor bands the frame carries every third of the way up
    B(f.at(0, 0.3 * LOW), f.at(1, 0.3 * LOW), 1.2)
  }
}
