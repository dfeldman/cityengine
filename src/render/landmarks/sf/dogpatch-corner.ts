/**
 * THE THIRD & 20TH CORNER, the rest (owner, #241: "there are 4 very unique apartment buildings on this corner"; #241
 * and #242 did the Pritzker building, the sawtooth and the bronze boxes). From Mapillary (2026-10-07): the newer
 * Dogpatch apartment blocks — grey fibre-cement panel walls with dark window frames, and on two of them projecting
 * BOXES clad in copper-orange metal, stacked up the front; one stands on tall round columns over a recessed glass
 * ground floor.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing, type Face } from '../tower.ts'

const GREY: Rgb = [0.7, 0.71, 0.7]
const COPPER: Rgb = [0.72, 0.38, 0.22]
const DARK: Rgb = [0.15, 0.16, 0.17]

interface Spec { height: number; pilotis: boolean; boxes: boolean }

function dogpatch(out: MeshBuilder, fit: Fit, sp: Spec): void {
  const WALL: Face = { kind: 'punched', wall: GREY, glass: [0.2, 0.24, 0.27], floor: 3.1, pitch: 2.6, solid: 0.42, material: 'concrete' }
  tower(out, { ...fit, height: sp.height }, {
    height: sp.height,
    base: sp.pilotis
      ? { height: 4.5, face: { kind: 'fins', wall: [0.78, 0.78, 0.76], glass: [0.18, 0.2, 0.22], pitch: 5, solid: 0.18, depth: 0.9, material: 'concrete' } }
      : { height: 4, face: { kind: 'curtain', wall: DARK, glass: [0.18, 0.2, 0.22], pitch: 2.4 } },
    tiers: [{ to: 1, face: WALL }],
    crown: { kind: 'parapet', height: 1, colour: GREY },
  })
  if (!sp.boxes) return
  // the copper boxes: on every edge long enough, a column of boxes up the storeys, every other bay
  const ring = towerRing(fit), metal = surfaceTag('metal')
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 12) continue
    const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L, nx = uz, nz = -ux
    const n = Math.floor(L / 7)
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n
      const cx = a.x + (b.x - a.x) * t + nx * 0.6, cz = a.z + (b.z - a.z) * t + nz * 0.6
      for (let y = (sp.pilotis ? 4.5 : 4) + 0.2; y + 2.9 < sp.height - 1; y += 3.1 * (k % 2 ? 2 : 1)) {
        const hw = 1.6
        // the box: copper cheeks and top, a dark window in its face
        box(out, cx, y + 1.45, cz, Math.abs(ux) * hw + Math.abs(nx) * 0.6 + 0.02, 1.45, Math.abs(uz) * hw + Math.abs(nz) * 0.6 + 0.02, COPPER, metal)
        box(out, cx + nx * 0.62, y + 1.5, cz + nz * 0.62, Math.abs(ux) * (hw - 0.35) + 0.02, 1.0, Math.abs(uz) * (hw - 0.35) + 0.02, DARK, surfaceTag('glass'))
      }
    }
  }
}

export const DOGPATCH_CORNER: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  dogpatchCopperColumns: (out, fit) => dogpatch(out, fit, { height: 20, pilotis: true, boxes: true }),
  dogpatchCopperBoxes: (out, fit) => dogpatch(out, fit, { height: 17, pilotis: false, boxes: true }),
  dogpatchGrey: (out, fit) => dogpatch(out, fit, { height: 14, pilotis: false, boxes: false }),
}
