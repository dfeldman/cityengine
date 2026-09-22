import { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam, block, hex, pane, placed, pointedPane, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/** A disc on a wall facing −z (the kit's `disc` faces +z, and lit from behind a rose glowed white). */
function disc(out: MeshBuilder, cx: number, cy: number, cz: number, r: number, colour: Rgb, _tag = FIXED, n = 16): void {
  void _tag
  for (let i = 0; i < n; i += 2) {
    const p = (k: number): [number, number, number] => {
      const a = (k / n) * Math.PI * 2
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz]
    }
    out.quad([p(i), p(i + 1), p(i + 2), [cx, cy, cz]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
  }
}

/**
 * Notre-Dame de Paris up close (BUGS.md #21, from photographs of the west front and of the south-east flank
 * from the Seine, Wikimedia Commons "Paris, Notre Dame -- 2014 -- 1445" and "Notre-Dame de Paris, 4 October
 * 2017"). The west front reads in horizontal bands between four vertical buttresses:
 *
 *   0–15 m   three deep pointed PORTALS, the middle widest, jamb statues and stepped archivolts;
 *   15–21 m  the GALLERY OF KINGS, twenty-eight statues in a row of niches;
 *   21–32 m  the ROSE storey: the great rose in the middle, paired lancets under an arch in each tower bay,
 *            the Virgin and two angels on the balustrade in front of the rose;
 *   32–44 m  the OPEN GALLERY, a screen of slender columns and pointed arches with the sky behind in the middle;
 *   44–69 m  the two TOWERS, each face with two very tall belfry lancets, corner buttresses, flat tops.
 *
 * Behind it: the long nave under a steep blue-grey lead roof, clerestory lancets, lower aisles; the transept,
 * each end a gabled front with a huge rose, a small rose in the gable and pinnacle turrets; the choir and
 * the polygonal chevet ringed by long, slender, ARCHED flying buttresses on pinnacled piers; the lead spire
 * at the crossing (96 m) with green copper apostles round its foot.
 *
 * Local frame: the west front faces −z; x across. Fitted to OSM's footprint (~128 × 48 m).
 */
export function notreDameFull(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e3dac6')
  const shadowStone = shade(stone, 0.84)
  const deepStone = shade(stone, 0.7)
  const lead = hex('#7a838a')
  const leadDark = shade(lead, 0.85)
  const glass = hex('#2c3448')
  const dark = hex('#262523')
  const copper: Rgb = [0.35, 0.55, 0.47]
  const gold: Rgb = [0.84, 0.66, 0.26]
  const L = Math.min(Math.max(fit.hz, 56), 66)
  const W = Math.min(Math.max(fit.hx, 20), 25)
  const zf = -L
  // a stone plinth down into the ground: the manifest lifts the cathedral 2.5 m so the parvis meets its doors,
  // and the island falls away towards the chevet
  block(out, -W - 2, W + 2, zf - 0.5, L + 14, -4, 0.02, shade(stone, 0.8))
  const fw = Math.min(W, 20.5)          // half the west front
  const tIn = 5.5                        // the towers' inner edge (half the middle bay)
  const front = 12                       // the west block's depth
  const nave = 6.5                       // half the nave
  const eaves = 33
  const zb = zf + front                  // back of the west block

  // ---------- the west block: solid to the gallery, set back behind the gallery's screen, then the towers
  block(out, -fw, fw, zf, zb, 0, 32.4, stone)
  block(out, -fw - 0.3, fw + 0.3, zf - 0.5, zb, 32.4, 33, shadowStone)                      // the gallery floor
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? tIn : -fw
    const x1 = sx > 0 ? fw : -tIn
    block(out, x0, x1, zf + 2.2, zb, 33, 44, stone)                                        // behind the screen
    block(out, x0, x1, zf, zb, 44, 45.2, shadowStone)                                       // the gallery's top
    block(out, x0 - 0.3, x1 + 0.3, zf - 0.4, zb + 0.3, 45.2, 46, stone)                      // chimeras' balustrade
    block(out, x0, x1, zf, zb, 46, 68.4, stone)                                             // the tower
    block(out, x0 - 0.35, x1 + 0.35, zf - 0.35, zb + 0.35, 68.4, 69.5, shadowStone)          // its balustrade
    for (const [cx, cz] of [[x0, zf], [x1, zf], [x0, zb], [x1, zb]]) prism(out, cx, cz, 69.5, 70.6, 0.35, 6, shadowStone, FIXED, 0.1)
    // corner buttresses up the tower
    for (const bx of [x0, x1]) {
      block(out, bx - 0.8, bx + 0.8, zf - 0.7, zf + 0.9, 46, 64, shade(stone, 0.95))
      block(out, bx - 0.8, bx + 0.8, zb - 0.9, zb + 0.7, 46, 64, shade(stone, 0.95))
    }
    // the belfry lancets: two per face, very tall, on the front, back and outer side
    const belfry = (part: MeshBuilder, t: number): void => {
      pointedPane(part, -0.03, t, 47, 3.3, 17.3, deepStone)
      pointedPane(part, -0.06, t, 47.4, 2.5, 16.4, dark)
      pane(part, '-z', -0.08, t, 47.4, 0.18, 13.6, shadowStone, 0.02)                        // its mullion
    }
    const tw = x1 - x0
    const faceF = new MeshBuilder()
    for (const u of [0.28, 0.72]) belfry(faceF, x0 + tw * u)
    placed(out, faceF, 0, 0, zf)
    const faceB = new MeshBuilder()
    for (const u of [0.28, 0.72]) belfry(faceB, -(x0 + tw * u))
    placed(out, faceB, Math.PI, 0, zb)
    // on the outer side: a part at the origin, turned to face out along x, local x running along world z
    const side = new MeshBuilder()
    for (const u of [0.28, 0.72]) belfry(side, front * (u - 0.5))
    placed(out, side, sx > 0 ? -Math.PI / 2 : Math.PI / 2, sx > 0 ? x1 : x0, zf + front / 2)
  }
  // the middle bay above the gallery: open to the sky; the nave's gable stands behind it
  block(out, -tIn, tIn, zb - 1.2, zb, 33, 44, stone)

  // the front's decoration, drawn on a wall at z = 0 facing −z, then placed on the front
  const f = new MeshBuilder()
  // four buttresses, dividing the front into three bays
  for (const bx of [-fw + 1.2, -tIn, tIn, fw - 1.2]) {
    block(f, bx - 1.3, bx + 1.3, -1.6, 0, 0, 15.5, stone)
    block(f, bx - 1.2, bx + 1.2, -1.1, 0, 15.5, 32.4, stone)
    prism(f, bx, -1.75, 5.2, 8.4, 0.45, 6, shadowStone, FIXED, 0.35)                           // a statue on it
  }
  /*
   * The portals, as real recesses (BUGS.md #21): each a porch standing 1.6 m out from the wall between the
   * buttresses, its face framing the outermost arch, and inside it five archivolts stepping back, each joined
   * to the next by its reveal, down to the tympanum, the doors and the trumeau. The front wall hides anything
   * behind z = 0, so the depth is built outward from it.
   */
  const archOutline = (w: number, h: number): [number, number][] => {
    const spring = Math.max(0.5, h - w * 0.866)
    const k = (h - spring) / (w * 0.866)
    const pts: [number, number][] = [[-w / 2, 0], [-w / 2, spring]]
    for (let i = 1; i <= 8; i++) {
      const th = Math.PI - (i / 8) * (Math.PI / 3)
      pts.push([w / 2 + w * Math.cos(th), spring + k * w * Math.sin(th)])
    }
    for (let i = 7; i >= 0; i--) {
      const th = Math.PI - (i / 8) * (Math.PI / 3)
      pts.push([-(w / 2 + w * Math.cos(th)), spring + k * w * Math.sin(th)])
    }
    pts.push([w / 2, 0])
    return pts
  }
  // a band between two outlines of the same count at one depth (facing −z), or the same outline at two
  // depths (a reveal, facing in towards the opening)
  const band = (x: number, a: [number, number][], b: [number, number][], za: number, zb: number, c: Rgb): void => {
    for (let i = 1; i < a.length; i++) {
      const q: [number, number, number][] = [[x + a[i - 1][0], a[i - 1][1], za], [x + a[i][0], a[i][1], za], [x + b[i][0], b[i][1], zb], [x + b[i - 1][0], b[i - 1][1], zb]]
      let n: [number, number, number]
      if (za === zb) n = [0, 0, -1]
      else {
        // inward: towards the outline's middle
        const mx = (a[i - 1][0] + a[i][0]) / 2
        const my = (a[i - 1][1] + a[i][1]) / 2
        const dx = -(a[i][1] - a[i - 1][1])
        const dy = a[i][0] - a[i - 1][0]
        const l = Math.hypot(dx, dy) || 1
        const toward = dx * (0 - mx) + dy * ((a[0][1] + a[Math.floor(a.length / 2)][1]) / 2 - my) > 0 ? 1 : -1
        n = [(dx / l) * toward, (dy / l) * toward, 0]
      }
      f.quad(q, n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
    }
  }
  const portal = (x: number, w: number, h: number): void => {
    const steps = 5
    const depth = 1.55
    const outline = (k: number): [number, number][] => archOutline(w + (steps - k) * 0.6, h + (steps - k) * 0.6)
    // the porch: its face round the outermost arch, as a rectangle-to-arch band, and its sides and top
    const W0 = w + steps * 0.6 + 2.2
    // under the Gallery of Kings, which starts at 15 m
    const H0 = Math.min(14.6, h + steps * 0.6 + 0.8)
    const o0 = outline(0)
    const cy = H0 * 0.45
    const rect = o0.map(([px, py]): [number, number] => {
      const dx = px
      const dy = py - cy
      const t = Math.min(dx === 0 ? Infinity : (W0 / 2) / Math.abs(dx), dy === 0 ? Infinity : dy > 0 ? (H0 - cy) / dy : cy / -dy)
      return [dx * t, cy + dy * t]
    })
    band(x, rect, o0, -depth, -depth, stone)
    block(f, x - W0 / 2, x + W0 / 2, -depth, -0.02, H0, H0 + 0.35, shade(stone, 1.03))
    // the archivolts stepping back: each face, then its reveal to the next
    for (let k = 0; k < steps; k++) {
      const z0 = -depth + (k * depth) / steps
      const z1 = -depth + ((k + 1) * depth) / steps
      const a = outline(k)
      const b = outline(k + 1)
      band(x, a, a, z0, z1, k % 2 ? shade(stone, 0.72) : shadowStone)
      band(x, a, b, z1, z1, k % 2 ? shadowStone : shade(stone, 0.86 - k * 0.03))
    }
    pointedPane(f, -0.06, x, 0, w, h, shade(stone, 0.93))                                      // the tympanum
    pane(f, '-z', -0.07, x, 0, w, h * 0.42, dark, 0.01)                                        // the doors
    pane(f, '-z', -0.08, x, h * 0.42, w, 0.5, shadowStone, 0.01)                                // the lintel
    pane(f, '-z', -0.09, x, 0, 0.5, h * 0.42, stone, 0.01)                                      // the trumeau
    // the jamb statues, standing in the reveals either side of the doorway
    for (const sd of [-1, 1]) {
      for (let j = 0; j < 4; j++) prism(f, x + sd * (w / 2 + 0.3 + j * 0.6), -0.3 - j * 0.3, 1.4, 4.3, 0.24, 6, shadowStone, FIXED, 0.2)
    }
  }
  portal(0, 7.2, 12.5)
  portal(-13, 5.8, 10.8)
  portal(13, 5.8, 10.8)
  // the Gallery of Kings: a moulding, 28 niches with a king in each, a moulding
  pane(f, '-z', -0.3, 0, 15.6, 2 * fw, 0.7, shadowStone, 0.02)
  for (let i = 0; i < 28; i++) {
    const x = -fw + 0.75 + ((2 * fw - 1.5) * (i + 0.5)) / 28
    pointedPane(f, -0.04, x, 16.4, 1.05, 3.7, deepStone)
    prism(f, x, -0.25, 16.4, 19.3, 0.3, 6, stone, FIXED, 0.24)
    box(f, x, 19.45, -0.25, 0.2, 0.15, 0.2, stone, FIXED)
  }
  pane(f, '-z', -0.3, 0, 20.3, 2 * fw, 0.8, shadowStone, 0.02)
  // a rose, with its tracery: spokes, two rings, an inner rose
  const rose = (part: MeshBuilder, x: number, y: number, r: number): void => {
    disc(part, x, y, -0.02, r + 0.9, shadowStone, FIXED, 32)
    disc(part, x, y, -0.04, r, glass, FIXED, 32)
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2
      beam(part, [x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, -0.07], [x + Math.cos(a) * r, y + Math.sin(a) * r, -0.07], r * 0.014 + 0.02, stone)
    }
    for (const rr of [r * 0.62, r * 0.98]) {
      for (let i = 0; i < 32; i++) {
        const a0 = (i / 32) * Math.PI * 2
        const a1 = ((i + 1) / 32) * Math.PI * 2
        beam(part, [x + Math.cos(a0) * rr, y + Math.sin(a0) * rr, -0.07], [x + Math.cos(a1) * rr, y + Math.sin(a1) * rr, -0.07], r * 0.016 + 0.02, stone)
      }
    }
    disc(part, x, y, -0.08, r * 0.3, shadowStone, FIXED, 16)
    disc(part, x, y, -0.09, r * 0.22, glass, FIXED, 16)
  }
  rose(f, 0, 26.6, 4.8)
  // the tower bays' paired lancets under a relieving arch, with an oculus between their heads
  for (const s of [-1, 1]) {
    const x = s * (tIn + fw) / 2
    pointedPane(f, -0.02, x, 21.8, 7.2, 10, deepStone)
    for (const d of [-1.7, 1.7]) {
      pointedPane(f, -0.04, x + d, 22, 2.4, 7.6, glass)
      pane(f, '-z', -0.05, x + d, 22, 0.14, 6, stone, 0.01)
    }
    disc(f, x, 30.1, -0.05, 0.9, glass, FIXED, 12)
  }
  // the Virgin between two angels, on the balustrade before the rose
  for (const [x, h] of [[0, 2.8], [-3.2, 2.4], [3.2, 2.4]] as const) prism(f, x, -0.8, 21.1, 21.1 + h, 0.42, 8, stone, FIXED, 0.28)
  // the open gallery: slender columns and pointed arches across the whole front, the sky behind in the middle
  const cols = 30
  for (let i = 0; i <= cols; i++) {
    const x = -fw + (2 * fw * i) / cols
    box(f, x, 38.2, -0.3, 0.13, 5.2, 0.13, stone, FIXED)
    if (i < cols) {
      const x1 = -fw + (2 * fw * (i + 1)) / cols
      const mx = (x + x1) / 2
      beam(f, [x, 43.4, -0.3], [mx, 44.2, -0.3], 0.1, stone)
      beam(f, [mx, 44.2, -0.3], [x1, 43.4, -0.3], 0.1, stone)
    }
  }
  pane(f, '-z', -0.3, 0, 44.2, 2 * fw, 1.0, shadowStone, 0.08)
  placed(out, f, 0, 0, zf)

  // ---------- the nave, the aisles, the transept, the choir and the chevet
  const apseR = nave + 1.8
  const zApse = L - apseR - 2
  const zT = zb + (zApse - zb) * 0.52
  const tr = 7                                                                              // half the transept
  // the nave's gable against the west block
  const gab = new MeshBuilder()
  gab.quad([[-nave - 0.4, eaves, 0], [nave + 0.4, eaves, 0], [0, eaves + 13, 0], [0, eaves + 13, 0]], [0, 0, -1],
    [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], stone, FIXED)
  placed(out, gab, 0, 0, zb - 0.2)
  block(out, -nave, nave, zb, zApse, 0, eaves, stone)
  roof(out, -nave - 0.5, nave + 0.5, zb, zApse, eaves, 13, nave + 0.5, 0, lead)
  block(out, -0.25, 0.25, zb, zApse, eaves + 12.9, eaves + 13.6, leadDark)                    // the ridge crest
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? nave : -W
    const x1 = sx > 0 ? W : -nave
    block(out, x0, x1, zb, zApse, 0, 19, stone)
    roof(out, x0 - 0.3, x1 + 0.3, zb, zApse, 19, 4, (x1 - x0) / 2 + 0.3, 0, lead)
    // clerestory lancets on the nave wall, and the aisle windows, drawn along each flank. A part turned by
    // −π/2 faces +x, and its local x runs along world −z (π/2: faces −x, local x along +z)
    const cl = new MeshBuilder()
    const ai = new MeshBuilder()
    for (let z = zb + 4; z < zApse - 2; z += 6.6) {
      if (Math.abs(z - zT) < tr + 1) continue
      const t = sx > 0 ? -z : z
      pointedPane(cl, -0.03, t, 23.5, 2.6, 8.8, shadowStone)
      pointedPane(cl, -0.05, t, 23.9, 2, 8, glass)
      pane(cl, '-z', -0.06, t, 23.9, 0.12, 5.6, stone, 0.01)
      pointedPane(ai, -0.03, t, 5, 2.4, 9, shadowStone)
      pointedPane(ai, -0.05, t, 5.4, 1.8, 8.2, glass)
    }
    placed(out, cl, sx > 0 ? -Math.PI / 2 : Math.PI / 2, sx * nave, 0)
    placed(out, ai, sx > 0 ? -Math.PI / 2 : Math.PI / 2, sx * W, 0)
  }
  // the transept across the whole width, as tall as the nave, and its two fronts
  const te = W + 1.5
  block(out, -te, te, zT - tr, zT + tr, 0, eaves, stone)
  roof(out, -te - 0.3, te + 0.3, zT - tr, zT + tr, eaves, 13, 0, tr, lead)
  for (const sx of [-1, 1]) {
    const t = new MeshBuilder()
    // the gable, the great rose with a band of lancets under it, the small rose in the gable, the portal
    t.quad([[-tr, eaves, 0], [tr, eaves, 0], [0, eaves + 12.5, 0], [0, eaves + 12.5, 0]], [0, 0, -1],
      [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], stone, FIXED)
    rose(t, 0, 24.5, 5.8)
    for (let i = 0; i < 9; i++) pointedPane(t, -0.04, -4.8 + i * 1.2, 16.2, 0.8, 1.9, glass)
    rose(t, 0, eaves + 5, 1.6)
    for (let k = 0; k < 4; k++) pointedPane(t, -0.02 - k * 0.01, 0, 0, 5.2 + (3 - k) * 0.6, 10 + (3 - k) * 0.6, k % 2 ? shadowStone : shade(stone, 0.9))
    pointedPane(t, -0.08, 0, 0, 5.2, 10, shade(stone, 0.93))
    pane(t, '-z', -0.09, 0, 0, 5.2, 4.2, dark, 0.01)
    // its gable over the portal, and the pinnacle turrets at the corners of the front
    t.quad([[-3.6, 10.6, -0.4], [3.6, 10.6, -0.4], [0, 15.5, -0.4], [0, 15.5, -0.4]], [0, 0, -1],
      [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], shadowStone, FIXED)
    for (const px of [-tr, tr]) {
      prism(t, px, -0.6, 0, 34, 1.3, 8, stone, FIXED)
      prism(t, px, -0.6, 34, 42, 1.3, 8, stone, FIXED, 0.9)
      prism(t, px, -0.6, 42, 50, 0.9, 8, stone, FIXED, 0.06)
    }
    placed(out, t, sx > 0 ? -Math.PI / 2 : Math.PI / 2, sx * te, zT)
  }
  // the chevet: the choir's end, polygonal, its lancets, over the lower ambulatory
  prism(out, 0, zApse, 0, eaves, apseR, 10, stone, FIXED)
  prism(out, 0, zApse, eaves, eaves + 11, apseR + 0.5, 10, lead, FIXED, 0.4)
  prism(out, 0, zApse, 0, 19, W - 1.5, 14, stone, FIXED)
  prism(out, 0, zApse, 19, 22.5, W - 1.2, 14, lead, FIXED, apseR)
  // the radiating chapels' lancets round the ambulatory, one a facet (the choir side has none)
  for (let i = 0; i < 14; i++) {
    const a = ((i + 0.5) / 14) * Math.PI * 2
    if (Math.cos(a) < -0.3) continue
    const w = new MeshBuilder()
    pointedPane(w, -0.03, 0, 6, 2.2, 9, shadowStone)
    pointedPane(w, -0.05, 0, 6.4, 1.6, 8.2, glass)
    const r = (W - 1.5) * Math.cos(Math.PI / 14)
    placed(out, w, a + Math.PI, Math.sin(a) * r, zApse + Math.cos(a) * r)
  }
  for (let i = 0; i < 10; i++) {
    const a = ((i + 0.5) / 10) * Math.PI * 2
    if (Math.cos(a) < -0.2) continue                                                            // not into the choir
    const w = new MeshBuilder()
    pointedPane(w, -0.03, 0, 23.5, 2.4, 8.8, shadowStone)
    pointedPane(w, -0.05, 0, 23.9, 1.8, 8, glass)
    const r = apseR * Math.cos(Math.PI / 10)
    // a facet facing out along (sin a, cos a): a −z part turned by a + π faces (sin a, cos a)
    placed(out, w, a + Math.PI, Math.sin(a) * r, zApse + Math.cos(a) * r)
  }

  // ---------- the flying buttresses: slender piers with pinnacles, and flyers ARCHED up to the high wall
  /*
   * A pier and its flyer. The piers are slender and many-sided, stepping in with their pinnacles, and the
   * flyer leaps from the pier's head up to the wall as a thin arched rib with a lighter strut above it: square
   * blocks with a heavy flyer read as a ring of fins round the chevet, end-on (BUGS.md #21).
   */
  const flyer = (px: number, pz: number, tx: number, tz: number, head = 21): void => {
    prism(out, px, pz, 0, head - 4, 0.95, 8, stone, FIXED, 0.8)
    prism(out, px, pz, head - 4, head, 0.8, 8, stone, FIXED, 0.62)
    prism(out, px, pz, head, head + 2.2, 0.62, 8, stone, FIXED, 0.5)
    prism(out, px, pz, head + 2.2, head + 8, 0.5, 4, stone, FIXED, 0.02)
    const n = 10
    let prev: [number, number, number] | null = null
    let prevTop: [number, number, number] | null = null
    for (let i = 0; i <= n; i++) {
      const t = i / n
      // the rib: from the pier's head up to the wall at 29 m, arched underneath
      const y = head - 0.5 + (29 - head + 0.5) * t + Math.sin(t * Math.PI) * 2.2
      const p: [number, number, number] = [px + (tx - px) * t, y, pz + (tz - pz) * t]
      // the coping strut above it, straight from the pinnacle's foot to the wall's head
      const q: [number, number, number] = [p[0], head + 1.5 + (30.5 - head - 1.5) * t, p[2]]
      if (prev) beam(out, prev, p, 0.22, stone)
      if (prevTop) beam(out, prevTop, q, 0.14, stone)
      if (i > 0 && i < n && i % 2 === 0) beam(out, p, q, 0.07, stone)
      prev = p
      prevTop = q
    }
  }
  for (const sx of [-1, 1]) {
    for (let z = zb + 7.5; z < zApse - 1; z += 6.6) {
      if (Math.abs(z - zT) < tr + 3) continue
      flyer(sx * (W + 3), z, sx * nave, z)
    }
  }
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI
    // the chevet's flyers are the long ones: a single leap of about fifteen metres from piers well out
    // on the rim of the ambulatory, their heads clear of its lead roof (22.5 m)
    const R = W - 1.0
    flyer(Math.sin(a) * R, zApse + Math.cos(a) * R, Math.sin(a) * apseR, zApse + Math.cos(a) * apseR, 24)
  }

  // ---------- the spire over the crossing, with the green copper apostles round its foot
  prism(out, 0, zT, eaves + 9, eaves + 18, 3.6, 8, lead, FIXED, 3.1)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    prism(out, Math.sin(a) * 2.9, zT + Math.cos(a) * 2.9, eaves + 18, eaves + 22, 0.6, 6, lead, FIXED, 0.05)
  }
  prism(out, 0, zT, eaves + 18, 93, 3, 8, lead, FIXED, 0.1)
  for (let y = eaves + 22; y < 90; y += 3.2) {
    // the crockets up its eight edges
    const r = 3 * (1 - (y - eaves - 18) / (93 - eaves - 18)) + 0.1
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      box(out, Math.sin(a) * r, y, zT + Math.cos(a) * r, 0.18, 0.18, 0.18, leadDark, FIXED)
    }
  }
  box(out, 0, 94.2, zT, 0.08, 1.2, 0.08, gold, FIXED)
  box(out, 0, 95.4, zT, 0.3, 0.2, 0.12, gold, FIXED)                                          // the rooster
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    // four copper groups stepping down the roof ridges from the spire's foot
    for (let k = 0; k < 3; k++) prism(out, dx * (5 + k * 2.2), zT + dz * (5 + k * 2.2), eaves + 11 - k * 1.7, eaves + 13.2 - k * 1.7, 0.4, 6, copper, FIXED, 0.28)
  }
}
