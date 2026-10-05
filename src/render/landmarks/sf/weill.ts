/**
 * THE JOAN AND SANFORD I. WEILL NEUROSCIENCES BUILDING, UCSF Mission Bay, 1651 4th Street (Mark Cavagnero with
 * SmithGroup, 2021; way/976652370). University census 2026-10-05, from the architect's published photograph of the
 * 4th Street front: six storeys, a four-storey research block lifted over a two-storey glass clinic. The upper block
 * is a glass curtain wall wrapped all round in a fine screen of pale silver aluminium fins; the glass base is set
 * back under it on slender white columns, so the block hovers over a lit, transparent ground floor. Was a 12 m beige
 * `bauhaus` box (OSM gives no height).
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { faceBand, insetRing, towerRing } from '../tower.ts'
import { edgeAt } from '../parts.ts'

const SILVER: Rgb = [0.84, 0.85, 0.86]
const GLASS: Rgb = [0.42, 0.48, 0.54]
const LOBBY: Rgb = [0.5, 0.47, 0.4]
const WHITE: Rgb = [0.9, 0.9, 0.88]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export function weillNeurosciences(out: MeshBuilder, fit: Fit): void {
  const G = Math.max(0, fit.grade ?? 0)
  const BASE = G + 9.5, H = G + 30
  const ring = towerRing(fit)
  const metal = surfaceTag('metal')
  // the glass clinic, set back under the block
  const inner = insetRing(ring, 2.4)
  faceBand(out, inner, 0, BASE, { kind: 'curtain', wall: [0.7, 0.71, 0.72], glass: LOBBY, pitch: 3, floor: 4.75, material: 'glass' })
  // the slender columns along the block's edge
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 6) continue
    const n = Math.max(1, Math.round(e.L / 9))
    for (let k = 0; k <= n; k++) {
      const u = -e.L / 2 + 0.6 + (k / n) * (e.L - 1.2)
      box(out, e.mid.x + e.tx * u - e.nx * 0.8, BASE / 2, e.mid.z + e.tz * u - e.nz * 0.8, 0.28, BASE / 2, 0.28, WHITE, surfaceTag('concrete'))
    }
  }
  // the soffit under the block, between its edge and the glass
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], A = inner[i], B = inner[(i + 1) % ring.length]
    out.quad([[a.x, BASE, a.z], [A.x, BASE, A.z], [B.x, BASE, B.z], [b.x, BASE, b.z]], [0, -1, 0], UV, WHITE, 0)
    out.quad([[b.x, BASE, b.z], [B.x, BASE, B.z], [A.x, BASE, A.z], [a.x, BASE, a.z]], [0, -1, 0], UV, WHITE, 0)
  }
  // the research block: the fin screen over its glass, running on up as a parapet round the roof
  faceBand(out, insetRing(ring, -0.45), BASE, H + 1.6, { kind: 'fins', wall: SILVER, glass: GLASS, pitch: 0.9, solid: 0.18, depth: 0.25, floor: 4.1, material: 'metal' })
  capPolygon(out, insetRing(ring, -0.45), H, [0.62, 0.63, 0.64], metal)
}

export const WEILL: Record<string, (out: MeshBuilder, fit: Fit) => void> = { weillNeurosciences }
