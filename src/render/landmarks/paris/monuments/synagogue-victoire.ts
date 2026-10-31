import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { beam, block, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { FIXED, graded, type P2, ring, walls } from './common.ts'
import { church } from './churches.ts'
import { blindArcade, boxOn, entablature, faceFrame, flank, frameAt, gothicPortal, roseWindow, traceryWindow } from './gothic.ts'

/*
 * THE GRANDE SYNAGOGUE DE LA VICTOIRE (Alfred-Philibert Aldrophe, 1867–74), the great synagogue of Paris, on the Rue
 * de la Victoire: a Romanesque front with Byzantine trimmings whose CENTRAL BAY rises to 36 m (Wikipedia) and ends in
 * a great ROUND ARCH carrying the inscription from Genesis — the rose high in it, a gallery of little arches across,
 * three tall arched windows, the three portals under the porch; the side bays lower, each with its rose over twin
 * windows; behind, the nave of 28 m under its roof.
 *
 * OSM has the outline only (way 69363730, no parts; the city drew a 28 m flat block, 2026-10-29). Frame: −z the front
 * toward the Rue de la Victoire (bearing 181), its bays on x = −6.75 ± 14.65; the east range behind it from OSM's ring.
 * Batch 5 (2026-10-31): 1,528 triangles of flat arches, now the kit's portals, roses, arcades in depth.
 */
const HX = 21.4
const HZ = 30.75

const PLAN: P2[] = ring([-21.4, -30.2, 7.9, -30.7, 7.7, -15.9, 20.9, -15.7, 21.1, 5.0, 11.7, 4.8, 11.6, 26.7, 21.4, 26.8,
  21.4, 30.7, -21.4, 30.5])

export function synagogueVictoire(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => victoire(q))
}

function victoire(out: MeshBuilder): void {
  const p = church('#a89f8c', '#3f474d')
  const door: [number, number, number] = [0.12, 0.08, 0.055]
  const cx = -6.75
  const zf = -30.8
  // the ranges round the plan to 18 (the offices and the east wing), lidded
  walls(out, PLAN, 0, 18, p.stone, p.lead)
  const east = faceFrame(out, '+x', 7.8)
  flank(east, -30, -16.5, 3, { stone: p.stone, glass: p.glass, y0: 4, h: 9, head: 'round', lights: 2, cornice: 18 })
  // the nave behind the front: walls to 26, the roof to 33, a row of arched windows down each side
  block(out, cx - 12.5, cx + 12.5, -27, 28, 18, 26, p.stone)
  roof(out, cx - 12.9, cx + 12.9, -27, 28.2, 26, 7.0, 12.9, 0.01, p.slate)
  for (const s of [-1, 1]) flank(faceFrame(out, s < 0 ? '-x' : '+x', cx + s * 12.5), -26, 27.5, 11, { stone: p.stone, glass: p.glass, y0: 19.0, h: 5.2, head: 'round', lights: 2, share: 0.5, cornice: 26 })
  // THE FRONT. The side bays to 26: the portal, the twin windows, the rose over them, the cornice of little arches
  block(out, cx - 14.65, cx + 14.65, zf, -27, 0, 26.0, p.stone)
  const fr = faceFrame(out, '-z', zf)
  boxOn(fr, cx - 14.65, cx + 14.65, 0, 0.6, 0, 0.26, shade(p.stone, 0.9))
  for (const s of [-1, 1]) {
    const bx = cx + s * 10.8
    gothicPortal(fr, bx, 0.5, 3.4, 5.6, { stone: p.trim, dark: p.dark, door, depth: 0.55, orders: 2 })
    roseWindow(fr, bx, 9.1, 1.1, { stone: p.trim, glass: p.glass, spokes: 8, d: 0.2, far: true })
    // the tall window in its blind arch, its pair of lights and the rose over them
    gothicPortal(fr, bx, 11.2, 5.4, 11.8, { stone: p.stone, dark: p.stone, door: p.stone, depth: 0.42, orders: 2 })
    const inset = frameAt(fr, 0.12)
    for (const d of [-0.85, 0.85]) traceryWindow(inset, bx + d, 12.6, 1.35, 4.8, { stone: p.trim, glass: p.glass, head: 'round', lights: 1, far: true })
    roseWindow(inset, bx, 19.6, 1.55, { stone: p.trim, glass: p.glass, spokes: 10, d: 0.22 })
    blindArcade(fr, bx - 3.4, bx + 3.4, 24.2, 1.4, 7, p.trim, p.dark)
  }
  boxOn(fr, cx - 14.9, cx + 14.9, 25.6, 26.05, 0, 0.42, p.trim, true)
  boxOn(fr, cx - 14.9, cx + 14.9, 8, 8.3, 0, 0.26, p.trim)
  // the central bay: a frontispiece 14 m wide, a little proud, to the springing of the great arch at 29
  const z0 = zf - 0.8
  block(out, cx - 7.0, cx + 7.0, z0, zf, 0, 29.0, p.stone)
  const c = faceFrame(out, '-z', z0)
  // the porch's three portals, a cornice over them
  for (const d of [-4.1, 0, 4.1]) gothicPortal(c, cx + d, 0.6, 3.8, 7.6, { stone: p.trim, dark: p.dark, door, depth: 0.75, orders: 3 })
  for (let i = 0; i < 4; i++) boxOn(c, cx - 6.6 + i * 0.3, cx + 6.6 - i * 0.3, 0.15 * i, 0.15 * (i + 1), 0, 2.2 - i * 0.5, shade(p.stone, 0.92 + i * 0.03))
  entablature(c, cx - 7.2, cx + 7.2, 8.4, 1.1, 0.5, p.trim)
  // three tall arched windows with their roses, the gallery of little arches across
  for (const d of [-3.8, 0, 3.8]) {
    traceryWindow(c, cx + d, 10.6, 2.8, 6.4, { stone: p.trim, glass: p.glass, head: 'round', lights: 2, screen: { u0: cx + d - 1.9, u1: cx + d + 1.9, base: 9.6, top: 17.4, d: 0.28 } })
  }
  boxOn(c, cx - 7.2, cx + 7.2, 17.4, 17.9, 0, 0.45, p.trim, true)
  blindArcade(c, cx - 6.6, cx + 6.6, 18.1, 2, 11, p.trim, p.dark)
  boxOn(c, cx - 7.2, cx + 7.2, 20.2, 20.7, 0, 0.42, p.trim, true)
  // the great arch: the half-round over the bay from 29 to 36, the inscription band round it, the rose in it
  const n = 12
  const r = 7.0
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI
    const a1 = ((i + 1) / n) * Math.PI
    const P = (a: number, rr: number, d: number): [number, number, number] => [cx + Math.cos(a) * rr, 29.0 + Math.sin(a) * rr, z0 - d]
    out.quad([P(a0, 0, 0), P(a0, r, 0), P(a1, r, 0), P(a1, 0, 0)], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
    // the top of the arch, running back to the roof, and its moulding
    out.quad([P(a0, r, 0), P(a0, r, -2.5), P(a1, r, -2.5), P(a1, r, 0)], [Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.lead, FIXED)
    beam(out, [cx + Math.cos(a0) * (r - 0.3), 29.0 + Math.sin(a0) * (r - 0.3), z0 - 0.12], [cx + Math.cos(a1) * (r - 0.3), 29.0 + Math.sin(a1) * (r - 0.3), z0 - 0.12], 0.34, p.trim)
    beam(out, [cx + Math.cos(a0) * (r - 1.45), 29.0 + Math.sin(a0) * (r - 1.45), z0 - 0.08], [cx + Math.cos(a1) * (r - 1.45), 29.0 + Math.sin(a1) * (r - 1.45), z0 - 0.08], 0.14, p.trim)
    // the inscription: dark marks round the band
    const am = (a0 + a1) / 2
    for (const t of [-0.04, 0.04]) {
      const a = am + t
      out.quad([P(a, r - 1.1, 0.06), P(a + 0.02, r - 1.1, 0.06), P(a + 0.02, r - 0.65, 0.06), P(a, r - 0.65, 0.06)], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.dark, FIXED)
    }
  }
  // the tall rose in the arch, in its panel, and the Tablets of the Law over the key
  roseWindow(c, cx, 27.2, 3.3, { stone: p.trim, glass: p.glass, spokes: 12, d: 0.3 })
  boxOn(c, cx - 0.65, cx + 0.65, 35.9, 37.5, 0, 0.3, p.trim)
  // the slim turrets flanking the bay, their caps
  for (const s of [-1, 1]) {
    const x = cx + s * 7.25
    block(out, x - 0.6, x + 0.6, z0 - 0.4, z0 + 0.8, 0, 31.5, p.stone)
    for (const y of [9, 17.6, 25]) block(out, x - 0.7, x + 0.7, z0 - 0.5, z0 + 0.8, y, y + 0.3, p.trim)
    prism(out, x, z0 + 0.2, 31.5, 33.2, 0.72, 8, p.lead, FIXED, 0.05)
  }
}
