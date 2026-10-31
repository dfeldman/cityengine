/**
 * Batch 2's small fronts (2026-10-31): a restyle changes little from the road (Batch 1's lesson), so a hospital gets the gate it's known by. SAINT-JOSEPH-DES-CARMES (1625, the Institut Catholique's church, Paris's first dome after the Val-de-Grâce's plan) is the one model here with a roof of its own. Each is named by an entry in
 * public/landmarks/paris/batch2.json. Gates read from OSM's `entrance=main` and the aerial; their dress from their period, not a photograph: street view could say more (see the batch report).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { dome, hex, prism, roof, shade, type Rgb } from '../../kit.ts'
import { block } from './tag.ts'
import { archOn, clockOn, palette, pedimentOn, rectOn, slabOn } from '../palaces/common.ts'
import { sign } from '../../parts.ts'

const IRON = hex('#23272a')

/**
 * A HOSPITAL'S GATE, as an Assistance Publique site has one: two stone or brick piers and a lodge either side, an arch or lintel with the name across it, the railings running off. `wall`/`stone` for its dress; `clock` for the old ones. −z to the street.
 */
function gate(name: string, wall: string, stone: string, o: { clock?: boolean; modern?: boolean } = {}): (out: MeshBuilder, fit: Fit) => void {
  return (out, fit) => {
    const y = fit.grade ?? 0, W: Rgb = hex(wall), S: Rgb = hex(stone), p = palette(stone), tag = surfaceTag(o.modern ? 'concrete' : 'brick'), st = surfaceTag(o.modern ? 'concrete' : 'ashlar')
    const HW = 4.2, LODGE = 4.4, H = o.modern ? 4.2 : 5.6
    for (const s of [-1, 1]) {
      const x0 = s * HW, x1 = s * (HW + LODGE), xa = Math.min(x0, x1), xb = Math.max(x0, x1)
      block(out, xa, xb, -2, 2, y, y + H, W, tag)
      block(out, xa - 0.15, xb + 0.15, -2.15, 2.15, y + H, y + H + 0.3, S, st)
      if (!o.modern) {
        roof(out, xa - 0.1, xb + 0.1, -2.1, 2.1, y + H + 0.3, 2, 2.1, 2.1, hex('#4b5359'))
        rectOn(out, '-z', -2, xa + 1.2, xb - 1.2, y + 1.4, y + 4, p.glass, 0.05)
        rectOn(out, '-z', -2, xa + 0.9, xb - 0.9, y + 1.2, y + 1.35, S, 0.06)
        for (const x of [xa, xb]) block(out, x - 0.2, x + 0.2, -2.2, -1.8, y, y + H, S, st)
      } else rectOn(out, '-z', -2, xa + 0.7, xb - 0.7, y + 0.5, y + H - 0.8, hex('#8fa9b3'), 0.05)
      // the railing out from the lodge
      const a = s * (HW + LODGE), b = s * (HW + LODGE + 4), lo = Math.min(a, b), hi = Math.max(a, b)
      block(out, lo, hi, -0.25, 0.25, y, y + 0.7, S, st)
      for (let i = 0; i <= 9; i++) { const x = lo + (i * (hi - lo)) / 9; block(out, x - 0.025, x + 0.025, -0.025, 0.025, y + 0.7, y + 2.7, IRON) }
      block(out, lo, hi, -0.04, 0.04, y + 2.45, y + 2.55, IRON)
    }
    // the lintel over the way in, its name
    const top = y + H + 1
    block(out, -HW, HW, -1.2, 1.2, y + H - 0.5, top, o.modern ? W : S, st)
    if (o.clock) {
      block(out, -1.8, 1.8, -1, 1, top, top + 2.2, S, st)
      pedimentOn(out, '-z', -1, -2.1, 2.1, top + 2.2, 1.1, 0.25, shade(S, 1.05))
      clockOn(out, '-z', -1, 0, top + 1.1, 0.75, p)
    }
    sign(out, { type: 'flat', text: name, h: 0.62, face: 'grotesque', colour: o.modern ? [0.15, 0.3, 0.55] : [0.13, 0.14, 0.17], tracking: 0.12, lit: 'none', w: 2 * HW - 0.8 }, { x: 0, y: y + H + 0.1, z: -1.26, heading: Math.PI })
  }
}

export const tenonGate = gate('HÔPITAL TENON', '#a5694a', '#ddd3bd', { clock: true })
export const trousseauGate = gate('HÔPITAL TROUSSEAU', '#a5694a', '#d8cdb8', { clock: true })
export const rothschildGate = gate('HÔPITAL ROTHSCHILD', '#c9b89a', '#ddd3bd')
export const debreGate = gate('HÔPITAL ROBERT-DEBRÉ', '#e8e5de', '#f0eee8', { modern: true })
export const fochGate = gate('HÔPITAL FOCH', '#d8cfbc', '#e5decd', { modern: true })

/**
 * SAINT-JOSEPH-DES-CARMES (1613–20, the Carmelites' convent, now the Institut Catholique; OSM way/63370983, 51 × 28 m, front to the Rue de Vaugirard): the Italian front in two orders, the upper one drawn in by volutes under a pediment; a nave with its chapels; the DOME at the crossing, lead-grey on a drum, a lantern, the first in Paris after the Roman fashion.
 * −z the front.
 */
export function carmesChurch(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, p = palette('#d4c8ae', '#50575c'), S = p.stone, T = p.trim, tag = surfaceTag('ashlar')
  const HZ = Math.min(25, fit.hz), NW = 7, CH = Math.min(13, fit.hx), Y1 = y + 11, Y2 = y + 20
  // the chapels, the nave, its roof
  block(out, -CH, CH, -HZ + 3, HZ, y, Y1, S, tag)
  block(out, -NW, NW, -HZ + 1, HZ, y, Y2, S, tag)
  roof(out, -NW - 0.3, NW + 0.3, -HZ + 1, HZ + 0.2, Y2, 5, 0, 7.3, p.slate)
  roof(out, -CH - 0.2, CH + 0.2, -HZ + 3, HZ + 0.2, Y1, 2.2, 0, 3, shade(p.slate, 0.94))
  for (const s of [-1, 1]) for (let z = -HZ + 8; z < HZ - 5; z += 7) { archOn(out, s < 0 ? '-x' : '+x', s * CH, z, y + 3.4, 2, 5, p.glass); archOn(out, s < 0 ? '-x' : '+x', s * NW, z, Y1 + 2.4, 1.6, 4, p.glass) }
  // the front: lower order, four pilasters and a door; entablature; upper order with its volutes and pediment
  const Z = -HZ, H = Y1 + 1.5
  block(out, -CH, CH, Z, Z + 3, y, H, S, tag)
  for (const x of [-11.5, -6, 6, 11.5]) { slabOn(out, '-z', Z, x - 0.55, x + 0.55, y + 1.2, H - 1.2, 0.35, T); slabOn(out, '-z', Z, x - 0.75, x + 0.75, y, y + 1.2, 0.5, T); slabOn(out, '-z', Z, x - 0.75, x + 0.75, H - 1.2, H - 0.8, 0.5, T) }
  slabOn(out, '-z', Z, -CH - 0.3, CH + 0.3, H - 0.8, H, 0.6, T)
  archOn(out, '-z', Z, 0, y, 3.2, 5.6, hex('#2b2622'), 0.1)
  rectOn(out, '-z', Z, -2.2, 2.2, y, y + 0.06, T, 0.1)
  pedimentOn(out, '-z', Z, -2.8, 2.8, y + 6.3, 1.5, 0.4, T)
  for (const x of [-8.7, 8.7]) { archOn(out, '-z', Z, x, y + 2.2, 2, 4.2, p.glass); rectOn(out, '-z', Z, x - 1.3, x + 1.3, y + 7.4, y + 7.55, T, 0.06) }
  const Z2 = Z + 1.5, H2 = H + 7.4
  block(out, -NW, NW, Z2, Z2 + 3, H, H2, S, tag)
  for (const x of [-6.3, -3, 3, 6.3]) slabOn(out, '-z', Z2, x - 0.4, x + 0.4, H + 0.3, H2 - 0.7, 0.3, T)
  slabOn(out, '-z', Z2, -NW - 0.2, NW + 0.2, H2 - 0.7, H2, 0.5, T)
  archOn(out, '-z', Z2, 0, H + 1.6, 2.6, 4.2, p.glass)
  pedimentOn(out, '-z', Z2, -NW - 0.4, NW + 0.4, H2, 2.5, 0.6, T)
  // volutes, each a stepped wedge
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
    const a = s * (NW + (k * 4.8) / 5), b = s * (NW + ((k + 1) * 4.8) / 5), h = H + 5 * Math.pow(1 - k / 5, 1.6)
    block(out, Math.min(a, b), Math.max(a, b), Z2 + 0.2, Z2 + 1, H, h, T, tag)
  }
  // the dome at the crossing
  const cz = HZ * 0.3, RD = 6.3, yd = Y2 + 1.2
  block(out, -NW - 1, NW + 1, cz - NW - 1, cz + NW + 1, Y2, yd, S, tag)
  prism(out, 0, cz, yd, yd + 6, RD + 0.4, 16, S, tag)
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) / 8) * Math.PI * 2, x = Math.cos(a) * (RD + 0.45), z = cz + Math.sin(a) * (RD + 0.45)
    block(out, x - 0.45, x + 0.45, z - 0.45, z + 0.45, yd + 1.2, yd + 4.2, p.glass)
  }
  prism(out, 0, cz, yd + 6, yd + 6.5, RD + 0.8, 16, T, tag)
  dome(out, 0, cz, yd + 6.5, RD, 7.5, hex('#5a6266'), 12, hex('#474e52'))
  prism(out, 0, cz, yd + 13.8, yd + 16.2, 1.25, 10, S, tag)
  prism(out, 0, cz, yd + 16.2, yd + 18.2, 1.35, 10, hex('#5a6266'), surfaceTag('metal'), 0.12)
  prism(out, 0, cz, yd + 18.2, yd + 19.5, 0.1, 5, p.gold, surfaceTag('metal'), 0.03)
}
