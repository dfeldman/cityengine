import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { block, box, hex, shade } from '../../kit.ts'
import { faceBand } from '../../tower.ts'
import { sign } from '../../parts.ts'
import { frontOr } from './front.ts'
import { platforms } from './shed.ts'
import { MONTPARNASSE_PARTS, MONTPARNASSE_SHED } from './data.ts'
import { jardinAtlantiqueTop } from '../batch2/atlantique.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const CONCRETE = surfaceTag('concrete')
const toP = (r: [number, number][]): P2[] => r.map(([x, z]) => ({ x, z }))

/** the interval of a ring crossing the line z */
function across(r: P2[], z: number): [number, number] | null {
  const xs: number[] = []
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length]
    if ((p.z - z) * (q.z - z) < 0) xs.push(p.x + ((z - p.z) * (q.x - p.x)) / (q.z - p.z))
  }
  return xs.length >= 2 ? [Math.min(...xs), Math.max(...xs)] : null
}

/**
 * The Gare Montparnasse (1969, rebuilt over the tracks; references: Wikimedia Commons "Façade de la gare de
 * Paris-Montparnasse depuis la place Raoul-Dautry", "Gare-Montparnasse-Paris-02-2018"). The gist:
 *
 * - HALL 1 on the Place Raoul-Dautry, facing the Tour Montparnasse: a long glass hall under the office slab, its two
 *   great concrete pylons, the glazed vault over the entrance between them and GARE MONTPARNASSE across it;
 * - behind, the tracks run in under the JARDIN ATLANTIQUE, the garden laid on a concrete deck 18 m up over the
 *   platforms (OSM's roof way 400154236), on rows of columns standing on the platforms.
 *
 * OSM maps Hall 1 and Hall Pasteur on layer −1 and the deck as a raised roof, none of which the bake draws, so this
 * entry replaces nothing (the office slab over Hall 1 is the city's own); it stands at its own point, every footprint
 * generated into stations/data.ts in its frame, front −z to the place (bearing 39°).
 */
export function gareMontparnasse(out: MeshBuilder): void {
  const concrete = hex('#b9b4aa')
  const dark = shade(concrete, 0.8)
  const glass: Rgb = [0.3, 0.4, 0.44]
  const hall = toP(MONTPARNASSE_PARTS.hall[0].ring)
  const deck = toP(MONTPARNASSE_PARTS.deck[0].ring)
  // ---- Hall 1: glass walls on a concrete frame, a deep concrete fascia, a flat roof
  faceBand(out, hall, 0, 13, { kind: 'curtain', wall: concrete, glass, floor: 4.4, pitch: 2.4, material: 'concrete' })
  faceBand(out, hall, 13, 15.5, { kind: 'blank', wall: concrete, material: 'concrete' })
  capPolygon(out, hall, 15.5, hex('#8b8d8c'), CONCRETE)
  const zAt = frontOr(hall, -157)
  // the two pylons, and the glazed vault between them with the name across it
  const pyl = [-42, 36]
  for (const x of pyl) {
    const z = zAt(x)
    block(out, x - 5, x + 5, z - 2, z + 8, 0, 29, concrete)
    for (const f of [-3, -1, 1, 3]) block(out, x + f - 0.2, x + f + 0.2, z - 2.15, z - 2, 1, 28, dark)
  }
  {
    const x0 = pyl[0] + 5, x1 = pyl[1] - 5, z = zAt((x0 + x1) / 2), n = 10
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI, a1 = ((k + 1) / n) * Math.PI
      const y0 = 10 + Math.sin(a0) * 5, y1 = 10 + Math.sin(a1) * 5
      const z0 = z - 3 - Math.cos(a0) * 3, z1 = z - 3 - Math.cos(a1) * 3
      out.quad([[x0, y0, z0], [x1, y0, z0], [x1, y1, z1], [x0, y1, z1]], [0, Math.sin((a0 + a1) / 2), -Math.cos((a0 + a1) / 2)], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.55, 0.64, 0.68], surfaceTag('glass'))
    }
    for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 12) {
      box(out, x, 10, z - 6, 0.12, 0.12, 0.12, dark, FIXED)
    }
    sign(out, { type: 'flat', text: 'GARE MONTPARNASSE', h: 1.1, face: 'grotesque', colour: [0.93, 0.93, 0.9], tracking: 0.3, lit: 'self', w: x1 - x0 - 6 },
      { x: (x0 + x1) / 2, y: 8.4, z: z - 0.15, heading: Math.PI })
  }
  // ---- the Jardin Atlantique's deck over the tracks, on its columns, and the platforms under it
  const top = 18
  faceBand(out, deck, top - 1.6, top + 1.1, { kind: 'blank', wall: concrete, material: 'concrete' })
  capPolygon(out, deck, top - 1.6, dark, CONCRETE)
  capPolygon(out, deck, top + 1.1, hex('#5a6f40'), CONCRETE)
  // (Batch 2, 2026-10-31: the garden on it as the aerial has it, in east/north metres about 48.8399 2.3190, which is (−23.2, −27.2) of this entry's point. It was a foliage cap and a scatter of trees anywhere: batch2/atlantique.ts.)
  {
    const th = ((39 - 180) * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th)
    const toX = (e: number, n: number): number => (e - 23.2) * c - (n - 27.2) * s, toZ = (e: number, n: number): number => (e - 23.2) * s + (n - 27.2) * c
    const g = jardinAtlantiqueTop(top + 1.1), m = g.mesh, base = out.positions.length / 3
    for (let i = 0; i < m.positions.length; i += 3) {
      out.positions.push(toX(m.positions[i], m.positions[i + 2]), m.positions[i + 1], toZ(m.positions[i], m.positions[i + 2]))
      const nx = m.normals[i], nz = m.normals[i + 2]
      out.normals.push(nx * c - nz * s, m.normals[i + 1], nx * s + nz * c)
    }
    for (const u of m.uvs) out.uvs.push(u)
    for (const col of m.colors) out.colors.push(col)
    for (const i of m.indices) out.indices.push(base + i)
    for (const w of g.woods) out.decks.push({ ring: w.map(([e, n]) => ({ x: toX(e, n), z: toZ(e, n) })), y: top + 1.1, keepOff: 1, spacing: 8, form: { form: 'pine', h: [8, 15] } })
  }
  const zs = deck.map((p) => p.z)
  const plats = MONTPARNASSE_SHED.platforms.map(toP)
  for (let z = Math.min(...zs) + 6; z < Math.max(...zs) - 4; z += 14) {
    for (const r of plats) {
      const iv = across(r, z)
      if (!iv || iv[1] - iv[0] < 3) continue
      const x = (iv[0] + iv[1]) / 2
      block(out, x - 0.45, x + 0.45, z - 0.45, z + 0.45, 0.76, top - 1.6, concrete)
    }
    // and along the deck's two sides
    const iv = across(deck, z)
    if (iv) for (const x of [iv[0] + 0.8, iv[1] - 0.8]) block(out, x - 0.5, x + 0.5, z - 0.5, z + 0.5, 0, top - 1.6, concrete)
  }
  platforms(out, MONTPARNASSE_SHED)
}
