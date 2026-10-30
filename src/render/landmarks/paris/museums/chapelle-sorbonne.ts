import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { archedPane, block, classicalColumn, dome, hex, pane, pediment, rotated, roof, shade } from '../../kit.ts'
import { MeshBuilder as Mesh } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { archOn, clockOn, fitted, palette, rectOn, slabOn, statue, type Pal } from '../palaces/common.ts'

const FIXED = 0
/** the design footprint: OSM way 95860808's box turned to the chapel's axis (local −z faces bearing 290, the Place de la Sorbonne) */
const HX = 13.9
const HZ = 27.35

/**
 * The Chapelle de la Sorbonne (Jacques Lemercier, 1635–42), Richelieu's church and his tomb: the first dome on a Paris
 * church that meant to be seen, standing up over the Place de la Sorbonne and over Nénot's university, which was built
 * round it 250 years later. What a rider sees:
 *
 * - from the PLACE DE LA SORBONNE and the Boulevard Saint-Michel beyond (local −z), up the slope and past the café
 *   tables: the two-storey Jesuit front, Corinthian columns below round the door, the narrower upper order on its
 *   scrolls, the triangular pediment with the clock; statues in the niches;
 * - over it the DOME: the tall round drum with its arched windows between paired pilasters, four small corner turrets,
 *   the dark ribbed slate dome and its lantern;
 * - from the COUR D'HONNEUR (−x, the north side): the second, grander front, the portico of ten Corinthian columns on its
 *   steps at the end of the transept, which Lemercier drew for the university's own use.
 *
 * Fitted on OSM's way 95860808 (27.8 × 54.7 m; the transept's bulge at z −8…+5 and the apse at +z are in the outline).
 * OSM has no real height; the dome's 40-odd metres are from memory, checked by eye against the Place's photograph, which
 * shows the upper storey under its triangular pediment. Not seen close: the court's portico, drawn from memory.
 */
export function chapelleSorbonne(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

const wallRows = (out: MeshBuilder, p: Pal, face: '-x' | '+x', x: number, z0: number, z1: number, n: number): void => {
  const bay = (z1 - z0) / n
  for (let i = 0; i <= n; i++) {
    const z = z0 + i * bay
    block(out, Math.min(x, x + (face === '-x' ? -0.35 : 0.35)), Math.max(x, x + (face === '-x' ? -0.35 : 0.35)), z - 0.45, z + 0.45, 0.6, 17.6, p.trim)
  }
  for (let i = 0; i < n; i++) {
    const z = z0 + (i + 0.5) * bay
    rectOn(out, face, x, z - 1.5, z + 1.5, 1.8, 7.2, shade(p.stone, 0.9), 0.04)
    archOn(out, face, x, z, 9.4, 2.4, 6.4, p.glass, 0.09)
  }
}

function draw(out: MeshBuilder): void {
  const p = palette('#dfd2b6', '#4a5157')
  const ribs = hex('#6b7277')
  const dark = shade(p.slate, 0.82)
  const E = 18                // the walls' cornice

  // ---- the nave, the transept and the apse, under the cornice
  block(out, -13, 11.6, -25.2, 21, 0, E, p.stone)
  block(out, -14, 14, -8, 5, 0, E, p.stone)
  block(out, -13.6, 12.2, -25.2 - 0.4, 21.3, E - 0.9, E, p.trim)
  block(out, -14.5, 14.5, -8.4, 5.4, E - 0.9, E, p.trim)
  wallRows(out, p, '+x', 11.6, -25, -8.2, 3)
  wallRows(out, p, '-x', -13, -25, -8.2, 3)
  wallRows(out, p, '+x', 11.6, 5.2, 21, 2)
  wallRows(out, p, '-x', -13, 5.2, 21, 2)
  // the apse on the outline's rounded +z end
  prism(out, -0.6, 21, 0, 14, 6.3, 16, p.stone, FIXED, 6.3, true)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    if (Math.cos(a) < -0.1) continue
    if (i % 2) box(out, -0.6 + Math.sin(a) * 6.4, 7, 21 + Math.cos(a) * 6.4, 0.4, 7, 0.4, p.trim, FIXED)
  }
  dome(out, -0.6, 21, 14, 6.3, 5.5, p.slate, 16)

  // ---- the roofs: the nave's and the transept's slate ridges meeting at the crossing, the lead along the ridge
  const ridge = 24
  roof(out, -13, 11.6, -25, 21, E, ridge - E, 12.3, 0.01, p.slate)
  roof(out, -14.5, 14.5, -8, 5, E, ridge - E, 0.01, 6.5, p.slate)

  // ---- the west front: two orders, the upper narrower, on the Place
  const z = -27.3
  const y0 = 1.0
  const top1 = 12.2
  block(out, -13, 11.6, z, -25, 0, top1 + 1.8, p.stone)
  for (let i = 0; i < 3; i++) block(out, -8.5 + i * 0.25, 7.5 - i * 0.25, z - 2.1 + i * 0.6, z, 0, 0.32 * (i + 1), shade(p.stone, 0.9 + (i % 2) * 0.05))
  // the lower order: columns round the door, projecting; pilasters to the edges; niches between
  const ctr = -0.7
  for (const dx of [-11.2, -7.2, 7.2, 11.2]) block(out, ctr + dx - 0.5, ctr + dx + 0.5, z - 0.3, z, y0, top1, p.trim)
  for (const dx of [-4.1, -2.1, 2.1, 4.1]) classicalColumn(out, ctr + dx, z - 0.75, y0, top1, 0.48, p.stone, { order: 'corinthian', tier: 'mid', tag: FIXED, trim: p.trim })
  for (const dx of [-9.2, 9.2]) {
    archedPane(out, z - 0.05, ctr + dx, 3.2, 2.0, 5.8, shade(p.stone, 0.72))
    statue(out, ctr + dx, z - 0.25, 3.3, 3.8, p.trim)
    rectOn(out, '-z', z, ctr + dx - 1, ctr + dx + 1, 10, 11.6, shade(p.stone, 0.92), 0.04)
  }
  for (const dx of [-5.6, 5.6]) rectOn(out, '-z', z, ctr + dx - 0.55, ctr + dx + 0.55, 3, 10.6, shade(p.stone, 0.86), 0.04)
  // the door under its segment
  rectOn(out, '-z', z, ctr - 1.5, ctr + 1.5, y0, 6.6, p.dark, 0.05)
  rectOn(out, '-z', z, ctr - 1.9, ctr + 1.9, 6.6, 7.1, p.trim, 0.06)
  archOn(out, '-z', z, ctr, 7.2, 3.7, 1.3, p.trim, 0.1)
  archOn(out, '-z', z, ctr, 8.8, 1.5, 2.4, shade(p.stone, 0.7), 0.05)
  // the entablature, broken forward over the columns
  block(out, ctr - 12.7, ctr + 12.7, z - 0.45, z, top1, top1 + 1.5, p.trim)
  block(out, ctr - 5, ctr + 5, z - 1.15, z, top1, top1 + 1.5, p.trim)
  block(out, ctr - 13, ctr + 13, z - 0.75, z, top1 + 1.5, top1 + 1.9, shade(p.trim, 1.03))
  block(out, ctr - 5.3, ctr + 5.3, z - 1.4, z, top1 + 1.5, top1 + 1.9, shade(p.trim, 1.03))
  // the upper order: pilasters, the great arched window, niches, the scrolls down to the outer bays
  const u0 = top1 + 1.9
  const u1 = u0 + 7.4
  const w = 7.8
  block(out, ctr - w, ctr + w, z + 0.5, -21, u0, u1 + 1.2, p.stone)
  for (const dx of [-7.2, -3.4, 3.4, 7.2]) block(out, ctr + dx - 0.42, ctr + dx + 0.42, z + 0.2, z + 0.5, u0, u1, p.trim)
  archedPane(out, z + 0.45, ctr, u0 + 0.8, 3.0, 5.4, p.glass)
  for (const dx of [-5.3, 5.3]) {
    archedPane(out, z + 0.45, ctr + dx, u0 + 1.2, 1.5, 4.2, shade(p.stone, 0.72))
    statue(out, ctr + dx, z + 0.3, u0 + 1.3, 2.6, p.trim)
  }
  for (const s of [-1, 1]) {
    // the scroll: a quarter-round buttress from the upper pilaster down to the lower cornice
    for (let k = 0; k < 6; k++) {
      const a0 = (k / 6) * (Math.PI / 2)
      const a1 = ((k + 1) / 6) * (Math.PI / 2)
      const R = 4.4
      const X = (a: number): number => ctr + s * (w + R - Math.sin(a) * R)
      const Y = (a: number): number => u0 + (1 - Math.cos(a)) * R
      const xa = X(a0)
      const xb = X(a1)
      const yb = Y(a1)
      block(out, Math.min(xa, xb) , Math.max(xa, xb), z + 0.5, z + 1.5, u0, yb, p.trim)
    }
    prism(out, ctr + s * (w + 4), z + 1, u0 + 0.05, u0 + 1.0, 0.5, 8, shade(p.trim, 0.95), FIXED, 0.5, true)
    // obelisk-urns over the outer bays
    prism(out, ctr + s * (w + 4.4), z + 1, u0, u0 + 1.9, 0.34, 6, p.trim, FIXED, 0.08)
  }
  block(out, ctr - w - 0.35, ctr + w + 0.35, z + 0.1, z + 1.5, u1, u1 + 1.1, p.trim)
  pediment(out, ctr - w - 0.5, ctr + w + 0.5, z + 0.05, u1 + 1.1, 2.9, 1.6, p.stone)
  clockOn(out, '-z', z + 0.02, ctr, u1 + 2.0, 0.65, p)
  roof(out, ctr - w, ctr + w, z + 1.5, -21, u1 + 1.1, 2.6, w - 0.01, 0.01, p.slate)

  // ---- the court's portico, at the transept's north end: ten Corinthian columns on the steps, under a pediment
  const q = new Mesh()
  {
    const n = -14   // this part is drawn on a −z face and turned to −x
    for (let i = 0; i < 4; i++) block(q, -10.4 + i * 0.2, 8.8 - i * 0.2, n - 4.6 + i * 0.5, n - 2.4, 0, 0.28 * (i + 1), shade(p.stone, 0.9 + (i % 2) * 0.05))
    const m = -0.8
    for (let i = 0; i < 10; i++) {
      const x = m + (i - 4.5) * 2.05
      classicalColumn(q, x, n - 3.0, 1.1, 13.4, 0.52, p.stone, { order: 'corinthian', tier: i % 3 === 0 ? 'mid' : 'mid', tag: FIXED, trim: p.trim })
    }
    block(q, m - 10, m + 10, n - 3.7, n + 0.5, 13.4, 15, p.trim)
    block(q, m - 10.3, m + 10.3, n - 4, n + 0.5, 15, 15.4, shade(p.trim, 1.03))
    pediment(q, m - 10.4, m + 10.4, n - 4.02, 15.4, 3.9, 4.4, p.stone)
    roof(q, m - 10.2, m + 10.2, n - 3.8, n + 1.2, 15.4, 3.8, 10.1, 0.01, p.slate)
    block(q, m - 10, m + 10, n - 3.7, n + 0.5, 13.35, 13.4, shade(p.stone, 0.7))
    for (const s of [-1, 1]) {
      rectOn(q, '-z', n, m + s * 5.4 - 1.1, m + s * 5.4 + 1.1, 2, 10, shade(p.stone, 0.75), 0.03)
      rectOn(q, '-z', n, m + s * 1.5 - 0.9, m + s * 1.5 + 0.9, 1.1, 6.5, p.dark, 0.03)
    }
  }
  rotated(out, q, Math.PI / 2)  // (turned so the part's −z looks along the model's −x)

  // ---- the DOME: the drum on the crossing, the corner turrets, the ribbed dome, the lantern
  const cx = -0.3
  const cz = -1.5
  const R = 7.3
  const dy = 18
  block(out, cx - 8.8, cx + 8.8, cz - 8.8, cz + 8.8, dy + 2, dy + 5, p.stone)
  block(out, cx - 9.1, cx + 9.1, cz - 9.1, cz + 9.1, dy + 4.6, dy + 5, p.trim)
  const dt = 14.4
  prism(out, cx, cz, dy + 5, dy + dt, R, 20, p.stone, FIXED, R)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const nx = Math.sin(a)
    const nz = Math.cos(a)
    // a tall arched window on the drum, as a flat dark pane on the wall's chord
    const ca = (u: number, y: number): [number, number, number] => [cx + nx * (R + 0.04) + nz * u, y, cz + nz * (R + 0.04) - nx * u]
    const n: [number, number, number] = [nx, 0, nz]
    const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    out.quad([ca(-0.7, dy + 7), ca(0.7, dy + 7), ca(0.7, dy + 11.1), ca(-0.7, dy + 11.1)], n, uv, p.glass, FIXED)
    for (let k = 0; k < 4; k++) {
      const b0 = (k / 4) * Math.PI
      const b1 = ((k + 1) / 4) * Math.PI
      out.quad([ca(0, dy + 11.1), ca(Math.cos(b0) * 0.7, dy + 11.1 + Math.sin(b0) * 0.7), ca(Math.cos(b1) * 0.7, dy + 11.1 + Math.sin(b1) * 0.7), ca(0, dy + 11.1)], n, uv, p.glass, FIXED)
    }
    // the paired pilasters between them
    const b = a + Math.PI / 12
    box(out, cx + Math.sin(b) * (R + 0.15), dy + 9.6, cz + Math.cos(b) * (R + 0.15), 0.42, 4.6, 0.42, p.trim, FIXED)
  }
  prism(out, cx, cz, dy + 5, dy + 5.8, R + 0.25, 20, p.trim, FIXED, R + 0.25)
  prism(out, cx, cz, dy + dt - 0.9, dy + dt, R + 0.45, 20, p.trim, FIXED, R + 0.45)
  prism(out, cx, cz, dy + dt, dy + dt + 0.5, R + 0.1, 20, shade(p.stone, 0.95), FIXED, R - 0.2)
  dome(out, cx, cz, dy + dt + 0.5, R - 0.2, 9.4, p.slate, 20, ribs)
  // the lantern
  const l = dy + dt + 9.5
  prism(out, cx, cz, l - 0.3, l + 3.2, 1.45, 8, p.stone, FIXED, 1.35)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    box(out, cx + Math.sin(a) * 1.42, l + 1.5, cz + Math.cos(a) * 1.42, 0.3, 1.1, 0.3, dark, FIXED)
  }
  prism(out, cx, cz, l + 3.2, l + 4.3, 1.6, 8, p.slate, FIXED, 0.42)
  prism(out, cx, cz, l + 4.3, l + 5.6, 0.2, 6, p.gold, FIXED, 0.03)
  // the four corner turrets at the drum's foot
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const tx = cx + sx * 7.8
      const tz = cz + sz * 7.8
      block(out, tx - 1.1, tx + 1.1, tz - 1.1, tz + 1.1, dy + 5, dy + 8.5, p.stone)
      pane(out, '-z', tz - 1.1, tx, dy + 5.8, 0.9, 2, p.glass)
      pane(out, '+z', tz + 1.1, tx, dy + 5.8, 0.9, 2, p.glass)
      block(out, tx - 1.25, tx + 1.25, tz - 1.25, tz + 1.25, dy + 8.5, dy + 8.85, p.trim)
      roof(out, tx - 1.2, tx + 1.2, tz - 1.2, tz + 1.2, dy + 8.85, 2.1, 1.19, 1.19, p.slate)
    }
  }
  slabOn(out, '-z', -25.2, -13, 11.6, E - 0.9, E, 0.3, p.trim)
}
