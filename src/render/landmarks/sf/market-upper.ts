/**
 * UPPER MARKET, 8th to Castro — the distinctive building at each intersection, where the middles of the blocks are
 * small ordinary buildings (owner, 2026-10-25: "primarily focus on the intersections ... most intersections have a
 * distinctive landmark. this is a lower priority area and we don't have to get every one"). Each builder replaces a
 * generic building or a reface; its manifest entry is in public/landmarks/san-francisco/market-upper.json, and its
 * notes say which photographs it was drawn from. Brief: docs/sf-batches/BRIEF-MARKET-UPPER.md.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, type Face } from '../tower.ts'
import { boxAlong, colonnade, edgeAt, edgeFacing, signText } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { box, prism, type Rgb } from '../../models.ts'

void tower; void towerRing; void boxAlong; void colonnade; void edgeAt; void edgeFacing; void signText; void surfaceTag; void box; void prism
export type { Face, Rgb }


/** the edge whose outward normal points most nearly to local -z (the front), longer edges winning ties */
function frontEdge(ring: { x: number; z: number }[]): number {
  let best = 0, score = -Infinity
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i), s = -e.nz * (0.6 + e.L * 0.02)
    if (s > score) { score = s; best = i }
  }
  return best
}
/** the n longest edges, longest first */
function longEdges(ring: { x: number; z: number }[], n: number): number[] {
  return ring.map((_, i) => i).sort((i, j) => edgeAt(ring, j).L - edgeAt(ring, i).L).slice(0, n)
}

/** 2020 Market Street: the Safeway at Church, a cream-painted windowless box with a trellis on its flank and the red logo. */
export function mu_219072560(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.9, 0.85, 0.74]
  tower(out, fit, {
    height: 6.5,
    tiers: [{ to: 1, face: { kind: 'blank', wall: CREAM, material: 'stucco' }, cornice: { depth: 0.25, height: 0.4, colour: [0.86, 0.8, 0.68] } }],
    crown: { kind: 'parapet', height: 0.7, colour: CREAM, material: 'stucco' },
  })
  const ring = towerRing(fit)
  for (const i of longEdges(ring, 2)) {
    const e = edgeAt(ring, i)
    // the brown trellis grid, two panels along the wall
    for (const t of [0.4, 0.78]) {
      const u = e.L * t
      boxAlong(out, e.a.x + e.tx * u + e.nx * 0.08, 2.3, e.a.z + e.tz * u + e.nz * 0.08, Math.min(3.2, e.L * 0.14), 1.5, 0.04, e.heading, [0.42, 0.37, 0.3], 0)
    }
  }
  const f = edgeAt(ring, frontEdge(ring))
  const cx = f.a.x + f.tx * f.L * 0.2 + f.nx * 0.15, cz = f.a.z + f.tz * f.L * 0.2 + f.nz * 0.15
  signText(out, 'SAFEWAY', cx, 5.0, cz, 1.0, [0.78, 0.1, 0.12], { heading: f.heading })
}

/** Venn on Market, 1844 Market: eight storeys of grey and pale-grey panels, deep balcony recesses, a pergola on the roof. */
export function mu_208345091(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.5, 0.5, 0.53], PALE: Rgb = [0.78, 0.78, 0.79]
  tower(out, fit, {
    height: 25,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.28, 0.29, 0.31], glass: [0.2, 0.25, 0.3], pitch: 3, floor: 4.5, material: 'metal' } },
    tiers: [
      { to: 0.7, face: { kind: 'punched', wall: GREY, glass: [0.22, 0.28, 0.33], pitch: 2.6, floor: 3.0, solid: 0.55, material: 'metal' } },
      { to: 1, inset: 1.6, face: { kind: 'punched', wall: PALE, glass: [0.22, 0.28, 0.33], pitch: 2.6, floor: 3.0, solid: 0.5, material: 'metal' } },
    ],
    crown: { kind: 'parapet', height: 0.9, colour: GREY, material: 'metal' },
    penthouse: 1,
  })
  // the rooftop pergola: slats over a rail
  const ring = towerRing(fit), e = edgeAt(ring, frontEdge(ring))
  for (let k = 0; k < 8; k++) {
    const u = e.L * (0.2 + 0.08 * k)
    boxAlong(out, e.a.x + e.tx * u - e.nx * 3, fit.height + 1.7, e.a.z + e.tz * u - e.nz * 3, 0.07, 0.07, 1.6, e.heading, [0.85, 0.85, 0.85], 0)
  }
}

/** 1 Mint Plaza / "Linea", 8 Buchanan-ish corner: a seven-storey blue-glass office, floors stepped out of line, silver frames, a dark base. */
export function mu_208345267(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, {
    height: 30,
    base: { height: 4.8, face: { kind: 'curtain', wall: [0.16, 0.17, 0.2], glass: [0.14, 0.2, 0.26], pitch: 2.8, floor: 4.8, material: 'metal' } },
    tiers: [
      { to: 0.55, face: { kind: 'curtain', wall: [0.62, 0.66, 0.7], glass: [0.26, 0.38, 0.5], pitch: 2.2, floor: 3.8, material: 'glass' } },
      { to: 0.8, inset: 1.2, face: { kind: 'curtain', wall: [0.62, 0.66, 0.7], glass: [0.3, 0.42, 0.54], pitch: 2.2, floor: 3.8, material: 'glass' } },
      { to: 1, inset: 2.4, face: { kind: 'curtain', wall: [0.62, 0.66, 0.7], glass: [0.26, 0.38, 0.5], pitch: 2.2, floor: 3.8, material: 'glass' } },
    ],
    crown: { kind: 'parapet', height: 0.8, colour: [0.58, 0.62, 0.66], material: 'metal' },
    penthouse: 1,
  })
}

/** 2299 Market, "Icon" at Castro: a charcoal-panelled five-storey with orange boxed bays standing out, a silver-glass corner tower, a bank at the base. */
export function mu_208795260(out: MeshBuilder, fit: Fit): void {
  const CHAR: Rgb = [0.2, 0.2, 0.23], ORANGE: Rgb = [0.82, 0.36, 0.14], SILVER: Rgb = [0.72, 0.76, 0.8]
  tower(out, fit, {
    height: 16,
    base: { height: 4.2, face: { kind: 'curtain', wall: [0.6, 0.62, 0.64], glass: [0.3, 0.38, 0.46], pitch: 2.6, floor: 4.2, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: CHAR, glass: [0.5, 0.6, 0.68], pitch: 2.8, floor: 3.0, solid: 0.6, material: 'metal' } }],
    crown: { kind: 'parapet', height: 0.5, colour: [0.28, 0.28, 0.3], material: 'metal' },
  })
  const ring = towerRing(fit)
  for (const i of longEdges(ring, 2)) {
    const e = edgeAt(ring, i)
    for (const t of [0.12, 0.35, 0.62, 0.86]) for (const y of [7.4, 10.4, 13.4]) {
      if ((Math.round(t * 10) + Math.round(y)) % 2) continue
      const u = e.L * t
      boxAlong(out, e.a.x + e.tx * u + e.nx * 0.35, y, e.a.z + e.tz * u + e.nz * 0.35, 1.0, 1.15, 0.38, e.heading, ORANGE, 0)
    }
  }
  // the silver corner: the vertex the two long edges share, pulled up as a glazed shaft
  const [i, j] = longEdges(ring, 2), a = edgeAt(ring, i), b = edgeAt(ring, j)
  const corner = (ring.length + j - i) % ring.length === 1 ? ring[j] : (ring.length + i - j) % ring.length === 1 ? ring[i] : a.mid
  const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length, cz = ring.reduce((s, p) => s + p.z, 0) / ring.length
  const dx = cx - corner.x, dz = cz - corner.z, dl = Math.hypot(dx, dz) || 1
  boxAlong(out, corner.x + dx / dl * 1.8, 9, corner.z + dz / dl * 1.8, 1.9, 9.2, 1.9, a.heading, SILVER, surfaceTag('glass'))
  void b
}

/** 1930 Market, the cream Art Deco apartment block: arched arcade below, white piers rising to a crown of pointed fins. */
export function mu_252220171(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.92, 0.9, 0.84]
  tower(out, fit, {
    height: 25,
    base: { height: 4.5, face: { kind: 'punched', wall: CREAM, glass: [0.12, 0.13, 0.15], pitch: 3.6, floor: 4.5, solid: 0.35, arched: true, material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'fins', wall: CREAM, glass: [0.3, 0.33, 0.36], pitch: 2.4, floor: 2.8, solid: 0.55, depth: 0.4, material: 'stucco' }, cornice: { depth: 0.4, height: 0.5, colour: [0.86, 0.82, 0.72] } }],
    crown: { kind: 'sawtooth', height: 1.6, pitch: 2.4, colour: [0.86, 0.8, 0.68], material: 'stucco' },
  })
}

/** 2027 Market: four storeys of pale-grey stucco over a glazed ground floor, a row of metal-clad dormers along the roof. */
export function mu_240219341(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.74, 0.75, 0.76]
  tower(out, fit, {
    height: 15,
    base: { height: 4, face: { kind: 'curtain', wall: [0.6, 0.62, 0.64], glass: [0.3, 0.36, 0.42], pitch: 3, floor: 4, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: GREY, glass: [0.24, 0.3, 0.36], pitch: 3.4, floor: 3.2, solid: 0.6, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 0.5, colour: [0.6, 0.62, 0.64], material: 'concrete' },
  })
  const ring = towerRing(fit), e = edgeAt(ring, frontEdge(ring))
  for (let k = 0; k < 6; k++) {
    const u = e.L * (0.14 + 0.14 * k)
    boxAlong(out, e.a.x + e.tx * u - e.nx * 2.2, fit.height + 1.0, e.a.z + e.tz * u - e.nz * 2.2, 1.0, 1.0, 1.1, e.heading, [0.78, 0.82, 0.85], surfaceTag('metal'))
  }
}

/** 2222 Market (Beck's Motor Lodge's site): five storeys of grey panel with glass-sided bay boxes, a dark glazed restaurant base. */
export function mu_115433821(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, {
    height: 17,
    base: { height: 4.2, face: { kind: 'curtain', wall: [0.17, 0.18, 0.21], glass: [0.13, 0.16, 0.2], pitch: 2.8, floor: 4.2, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: [0.66, 0.67, 0.7], glass: [0.2, 0.26, 0.32], pitch: 3.6, floor: 3.2, bay: { depth: 0.6 }, material: 'metal' } }],
    crown: { kind: 'parapet', height: 0.8, colour: [0.55, 0.56, 0.6], material: 'metal' },
    penthouse: 1,
  })
}

export const MARKET_UPPER: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  mu_219072560, mu_208345091, mu_208345267, mu_208795260, mu_252220171, mu_240219341, mu_115433821,
}
