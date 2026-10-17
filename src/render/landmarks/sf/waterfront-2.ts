/**
 * Two owner-picked landmarks with no model at all before this pass, registered through ../index.ts, placed by
 * public/landmarks/san-francisco/waterfront-2.json.
 *
 * - **Aquarium of the Bay**, way/288396169, at the foot of Pier 39. No Mapillary frame (its one frame is
 *   marked `junk`), so this is built from Wikimedia Commons: `Aquarium of the Bay 2025a.jpg` (Commons category
 *   "Aquarium of the Bay - Building"), a clear daylight exterior taken from the plaza side. It shows a long,
 *   gently curved two-tier building following the pier's edge: a dark navy-blue lower wall carrying big painted
 *   marine-life murals, a cream/white upper band with a perimeter walkway behind a railing and a run of
 *   flagpoles, and a small square lantern/cupola near the ridge. `AQUARIUM OF THE BAY` is painted large across
 *   the lower wall facing the plaza — the one legible thing a rider on the Embarcadero promenade actually
 *   reads, so it is built as a real `sign()`, not a hand-blocked font.
 *
 * (The Art Gallery of the Macang Monastery moved to sf/macang.ts with the monastery, from the owner's photograph,
 *  2026-10-04.)
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, type TowerSpec } from '../tower.ts'
import { edgeAt, cupola } from '../parts.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { sign } from '../signage.ts'
import { crab, ellipse, lozenge, tube } from './wharf-carnival.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const NAVY: Rgb = [0.12, 0.3, 0.72]      // (royal blue, as painted: Mapillary 516497869459045; was navy)
const CREAM: Rgb = [0.92, 0.91, 0.86]
const DECK: Rgb = [0.82, 0.8, 0.74]
const DARK_GLASS: Rgb = [0.14, 0.18, 0.24]

/**
 * Aquarium of the Bay, way/288396169 — a low two-tier hall following the curved pier-head footprint, per
 * `Aquarium of the Bay 2025a.jpg` (Wikimedia Commons). Height 15 m (OSM tag, plausible against the photo's
 * two-storey-plus-deck massing) is used unmodified.
 */
export function aquariumOfTheBay(out: MeshBuilder, fit: Fit): void {
  const spec: TowerSpec = {
    height: 15,
    tiers: [
      // the navy lower wall the murals sit on — plain, since the murals themselves are painted panels below
      { to: 0.62, face: { kind: 'blank', wall: NAVY, material: 'concrete' } },
      // the cream upper band, set in slightly so the lower wall reads as the taller of the two
      { to: 1.0, inset: 0.3, face: { kind: 'blank', wall: CREAM, material: 'stucco' },
        cornice: { depth: 0.35, height: 0.3, colour: CREAM } },
    ],
    // the perimeter walkway rail the flags stand along
    crown: { kind: 'balustrade', height: 1.1, colour: DECK, material: 'concrete' },
    roof: DECK,
  }
  tower(out, fit, spec)

  const ring = towerRing(fit)
  const H = fit.height > 0.6 * spec.height && fit.height < 1.6 * spec.height ? fit.height : spec.height
  const lowerTop = H * 0.62

  /*
   * The PORTHOLES (owner, 2026-10-16: "the aquarium should have a big aquarium sign like it does irl"; Mapillary
   * 516497869459045): round murals low on the blue wall, each in a heavy dark ring like a ship's port — a sea lion's
   * face, a fish, a crab — up to three to a long wall. And on every long wall the name, big, in white serif:
   * AQUARIUM of the BAY, the small words between, as the building is lettered.
   */
  const front = (() => { let f = 0, bestL = 0; for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); if (e.L > bestL) { bestL = e.L; f = i } } return f })()
  const scenes: Rgb[] = [[0.16, 0.5, 0.6], [0.95, 0.55, 0.2], [0.2, 0.62, 0.45]]
  const lettered = ring.map((_, i) => i).filter((i) => edgeAt(ring, i).L >= 9).sort((a, b) => edgeAt(ring, b).L - edgeAt(ring, a).L).slice(0, 3)
  let n = 0
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 9) continue
    const u: [number, number, number] = [e.tx, 0, e.tz], up: [number, number, number] = [0, 1, 0], nn: [number, number, number] = [e.nx, 0, e.nz]
    const count = Math.min(3, Math.floor(e.L / 9))
    for (let k = 0; k < count; k++) {
      const t = (k + 0.5) / count, r = Math.min(1.4, lowerTop * 0.15)
      const px = e.a.x + e.tx * e.L * t + e.nx * 0.05, pz = e.a.z + e.tz * e.L * t + e.nz * 0.05
      // (stood on the ground in front, which can be a metre and more over the model's base: it is sunk to the lowest)
      const c: [number, number, number] = [px, (fit.groundAt?.(px + e.nx, pz + e.nz) ?? 0) + r + 0.35, pz]
      lozenge(out, c, u, up, nn, r, r, 0.3, [0.12, 0.12, 0.13], surfaceTag('metal'), 24)
      ellipse(out, [c[0] + e.nx * 0.16, c[1], c[2] + e.nz * 0.16], u, up, nn, r * 0.8, r * 0.8, 24, scenes[n % 3], 0)
      const at: [number, number, number] = [c[0] + e.nx * 0.18, c[1] - r * 0.1, c[2] + e.nz * 0.18]
      if (n % 3 === 2) crab(out, at, u, up, nn, r * 1.1, [0.9, 0.35, 0.15], [0.7, 0.22, 0.1], 0)
      else if (n % 3 === 1) {
        // a fish: an oval body and a tail
        lozenge(out, at, u, up, nn, r * 0.45, r * 0.22, 0.06, [0.98, 0.85, 0.3], 0, 16)
        tube(out, [at[0] - e.tx * r * 0.4, at[1], at[2] - e.tz * r * 0.4], [at[0] - e.tx * r * 0.7, at[1], at[2] - e.tz * r * 0.7], r * 0.03, 4, [0.98, 0.85, 0.3], 0, r * 0.22)
      } else {
        // a sea lion's face: brown, two dark eyes
        lozenge(out, at, u, up, nn, r * 0.42, r * 0.38, 0.06, [0.45, 0.32, 0.22], 0, 18)
        for (const s2 of [-1, 1]) lozenge(out, [at[0] + e.tx * s2 * r * 0.16 + e.nx * 0.05, at[1] + r * 0.1, at[2] + e.tz * s2 * r * 0.16 + e.nz * 0.05], u, up, nn, r * 0.06, r * 0.07, 0.02, [0.05, 0.05, 0.06], 0, 10)
      }
      n++
    }
    // (sized to the wall it is on — `w` sets the width and the letters follow — on the long walls only)
    if (lettered.includes(i)) sign(out, { type: 'flat', text: 'AQUARIUM of the BAY', h: 1.6, w: Math.min(e.L * 0.78, 20), face: 'roman', colour: [0.97, 0.97, 0.95], lit: 'front' },
      { ring, edge: i, y: Math.min(lowerTop - 1.2, (fit.groundAt?.(e.mid.x + e.nx, e.mid.z + e.nz) ?? 0) + 5.0) })
  }

  // the small square lantern near the ridge, and a line of flagpoles along the deck
  const e = edgeAt(ring, front)
  cupola(out, { x: e.mid.x - e.nx * fit.hz * 0.3, z: e.mid.z - e.nz * fit.hz * 0.3 }, H, 0.9,
    { colour: CREAM, domeColour: [0.3, 0.3, 0.32], domeMaterial: 'metal', drum: 1.4, dome: 0.8 })
  for (let i = 1; i <= 4; i++) {
    const u = (i / 5) * e.L
    const px = e.a.x + e.tx * u + e.nx * 0.2
    const pz = e.a.z + e.tz * u + e.nz * 0.2
    prism(out, px, pz, H, H + 2.4, 0.05, 6, [0.75, 0.75, 0.72], 0)
    box(out, px + e.tx * 0.35, H + 2.1, pz + e.tz * 0.35, 0.4, 0.22, 0.02, [0.7, 0.15, 0.15], 0)
  }
  // the dark window band under the deck, a hint of the mesh-grated openings in the photograph
  box(out, e.mid.x, lowerTop + 0.2, e.mid.z, e.L * 0.32, 0.5, 0.08, DARK_GLASS, 0)
}

export const WATERFRONT_2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  aquariumOfTheBay,
}
