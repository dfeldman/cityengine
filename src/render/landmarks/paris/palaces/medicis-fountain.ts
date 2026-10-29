import { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { block } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, fitted, palette, pedimentOn, rectOn, slabOn } from './common.ts'

const FIXED = 0
const HX = 7
const HZ = 30

/**
 * The Fontaine Médicis in the Luxembourg garden (c. 1630 for Marie de Médicis; moved and given its basin by Gisors,
 * 1864; Ottin's Polyphemus surprising Acis and Galatea, 1866) — OSM node 782601793, its basin way 62848427.
 *
 * - the GROTTO FRONT: a rusticated front of four Tuscan columns banded with stalactite rustication, a deep round-headed
 *   niche in the middle where the dark bronze Polyphemus crouches on the rock over the white marble lovers, smaller
 *   niches either side with their statues; the entablature, the attic with the Medici arms between two reclining
 *   figures, urns on its ends;
 * - the long narrow BASIN in front of it, edged in stone, with urns on pedestals down both sides (the plane trees and
 *   their garlands are the garden's).
 *
 * Local frame: the fountain faces −z, down its basin (west, toward the palace); the fountain stands at the +z end.
 * The water is the city's (OSM's basin); this draws its kerb.
 */
export function medicisFountain(out: MeshBuilder, fit: Fit): void {
  // the alley falls toward the palace: each piece stands on the ground under it, not on the footprint's lowest point
  const sx = fit.hx / HX
  const sz = fit.hz / HZ
  const g = (x: number, z: number): number => fit.groundAt?.(x * sx, z * sz) ?? 0
  fitted(out, fit, HX, HZ, (q) => draw(q, g))
}

function draw(base: MeshBuilder, g: (x: number, z: number) => number): void {
  // the fountain itself, drawn at its own ground and lifted there
  const out = new MeshBuilder()
  const p = palette('#cfc5ad')
  const rock = [0.55, 0.52, 0.46] as [number, number, number]
  const marble = [0.93, 0.92, 0.88] as [number, number, number]
  const bronze = [0.2, 0.24, 0.2] as [number, number, number]
  const z0 = 26.4
  const z1 = 29.8
  const w = 5.6
  // ---- the body and its vermiculated rustication
  block(out, -w, w, z0, z1, 0, 8.6, p.stone)
  for (let y = 0.6; y < 8; y += 0.62) rectOn(out, '-z', z0, -w, w, y - 0.08, y + 0.08, p.deep, 0.03)
  // the four banded columns, standing proud on their pedestals
  for (const x of [-4.6, -2.0, 2.0, 4.6]) {
    box(out, x, 0.7, z0 - 0.55, 0.7, 0.7, 0.55, p.trim, FIXED)
    prism(out, x, z0 - 0.55, 1.4, 6.9, 0.48, 10, p.stone, FIXED)
    for (let y = 1.8; y < 6.8; y += 0.7) prism(out, x, z0 - 0.55, y, y + 0.32, 0.6, 10, p.deep, FIXED, 0.56)       // the stalactite bands
    box(out, x, 7.05, z0 - 0.55, 0.62, 0.15, 0.62, p.trim, FIXED)
  }
  // the central niche: the dark grotto, the rock heaped in it, Polyphemus above, Acis and Galatea below
  archOn(out, '-z', z0, 0, 1.0, 3.0, 5.6, p.dark, 0.04)
  block(out, -1.4, 1.4, z0 - 0.4, z0 + 0.2, 0.6, 2.2, rock)
  block(out, -1.0, 1.0, z0 - 0.2, z0 + 0.2, 2.2, 3.4, rock)
  prism(out, 0.2, z0 - 0.15, 3.4, 5.2, 0.75, 8, bronze, FIXED, 0.55)                         // Polyphemus, crouching
  box(out, 0.55, 5.35, z0 - 0.35, 0.42, 0.38, 0.38, bronze, FIXED)
  box(out, -0.5, 4.6, z0 - 0.5, 0.7, 0.18, 0.18, bronze, FIXED)                                // his arm along the rock
  box(out, 0, 2.55, z0 - 0.65, 0.9, 0.22, 0.32, marble, FIXED)                                 // the lovers, lying
  box(out, -0.45, 2.85, z0 - 0.6, 0.26, 0.26, 0.26, marble, FIXED)
  // the two side niches and their statues (a faun, a huntress)
  for (const x of [-3.3, 3.3]) {
    archOn(out, '-z', z0, x, 2.0, 1.2, 3.4, p.dark, 0.04)
    prism(out, x, z0 - 0.25, 2.0, 4.9, 0.32, 8, marble, FIXED, 0.22)
    prism(out, x, z0 - 0.25, 4.9, 5.3, 0.17, 8, marble, FIXED, 0.13)
  }
  // a small upper basin where the water first falls, and the cascade's sheet into the long basin
  block(out, -1.6, 1.6, z0 - 1.6, z0, 0.9, 1.2, p.trim)
  rectOn(out, '-z', z0 - 1.6, -1.2, 1.2, 0.3, 0.9, [0.55, 0.68, 0.72], 0.02)
  // ---- the entablature and attic: the Medici arms between two reclining figures, urns at the ends
  slabOn(out, '-z', z0, -w - 0.4, w + 0.4, 7.2, 8.0, 1.0, p.trim)
  block(out, -w - 0.5, w + 0.5, z0 - 1.25, z1 + 0.3, 8.0, 8.4, p.trim)
  block(out, -3.0, 3.0, z0 - 0.2, z1, 8.4, 9.8, p.stone)
  pedimentOn(out, '-z', z0 - 0.2, -3.4, 3.4, 9.8, 1.5, 0.5, p.trim)
  block(out, -0.9, 0.9, z0 - 0.45, z0 - 0.2, 8.6, 10.4, p.trim)                                // the arms
  box(out, 0, 9.7, z0 - 0.5, 0.45, 0.45, 0.05, [0.78, 0.66, 0.36], FIXED)
  for (const s of [-1, 1]) {
    // the reclining figures on the attic's slopes
    box(out, s * 2.0, 9.0, z0 - 0.5, 1.2, 0.3, 0.35, marble, FIXED)
    box(out, s * 1.3, 9.45, z0 - 0.5, 0.3, 0.35, 0.3, marble, FIXED)
    // urns on the ends of the entablature
    prism(out, s * (w - 0.2), z0 - 0.3, 8.4, 8.7, 0.25, 8, p.trim, FIXED, 0.42)
    prism(out, s * (w - 0.2), z0 - 0.3, 8.7, 9.4, 0.42, 8, p.trim, FIXED, 0.28)
    prism(out, s * (w - 0.2), z0 - 0.3, 9.4, 9.8, 0.12, 6, p.trim, FIXED, 0.02)
  }
  lifted(base, out, g(0, 28))
  // ---- the basin's kerb in lengths that each stand on their own ground, and the urns down its sides
  const bz0 = -29.8
  const bz1 = z0 - 1.6
  const bw = 6.0
  const kerb = p.trim
  const n = 14
  for (let i = 0; i < n; i++) {
    const za = bz0 - 0.5 + ((bz1 - bz0 + 0.5) * i) / n
    const zb = bz0 - 0.5 + ((bz1 - bz0 + 0.5) * (i + 1)) / n
    for (const s of [-1, 1]) {
      const y = g(s * (bw + 0.25), (za + zb) / 2)
      block(base, s < 0 ? -bw - 0.5 : bw, s < 0 ? -bw : bw + 0.5, za, zb, y - 0.4, y + 0.55, kerb)
    }
  }
  for (const [z, y] of [[bz0, g(0, bz0)], [bz1, g(0, bz1)]]) block(base, -bw, bw, z - 0.5, z, y - 0.4, y + 0.55, kerb)
  for (let z = bz0 + 3; z < bz1 - 2; z += 7.2) {
    for (const s of [-1, 1]) {
      const x = s * (bw + 0.25)
      const y = g(x, z)
      box(base, x, y + 0.95, z, 0.3, 0.4, 0.3, kerb, FIXED)
      prism(base, x, z, y + 1.35, y + 1.55, 0.18, 8, kerb, FIXED, 0.38)
      prism(base, x, z, y + 1.55, y + 2.15, 0.38, 8, kerb, FIXED, 0.24)
    }
  }
}

/** `part` appended to `out`, raised `y`. */
function lifted(out: MeshBuilder, part: MeshBuilder, y: number): void {
  const b = out.positions.length / 3
  for (let i = 0; i < part.positions.length; i += 3) out.positions.push(part.positions[i], part.positions[i + 1] + y, part.positions[i + 2])
  for (const v of part.normals) out.normals.push(v)
  for (const v of part.uvs) out.uvs.push(v)
  for (const v of part.colors) out.colors.push(v)
  for (const i of part.indices) out.indices.push(b + i)
}
