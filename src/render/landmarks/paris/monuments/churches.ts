import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, rectOn, type Pal } from '../palaces/common.ts'
import { domeOf, drumArches, FIXED, quarter } from './common.ts'
import { blindArcade, boxFaces, boxOn, buttress, chevet, classicalDoor, edgeFrame, engaged, entablature, faceFrame, flank, flyers, flyingButtress, frameAt, gable, gothicBalustrade, gothicPortal, louvred, niche, pedimentFront, pilaster, pinnacle as stackedPinnacle, rect, roseWindow, spire, traceryWindow, turned, volute, statue } from './gothic.ts'

/*
 * The churches a rider passes whose silhouette OSM does not give the city: La Trinité, Saint-Roch and
 * Saint-Germain-l'Auxerrois with its belfry (flat blocks at one height). Each in its own design metres off OSM's
 * footprint, measured in its frame with osmium (2026-10-29), and fitted.
 */

export const pal = (stone: string, slate = '#4b5357'): Pal => {
  const s = hex(stone)
  return {
    stone: s, trim: shade(s, 1.05), deep: shade(s, 0.82), glass: [0.2, 0.21, 0.24], slate: hex(slate),
    lead: [0.33, 0.36, 0.37], gold: [0.8, 0.65, 0.3], dark: [0.15, 0.15, 0.15], bronze: [0.3, 0.33, 0.29],
  }
}

/**
 * Batch 5's palette (2026-10-31; lesson of the Sacré-Cœur: colours are linear, and go darker than you think): the same stone and slate names, with a limestone that doesn't blow out in the sun and glass that reads as stained, dark blue from outside. `hex` here is raw linear, so a Paris limestone is about '#a39a88'.
 */
export const STAINED: Rgb = [0.035, 0.05, 0.1]
export const church = (stone = '#a39a88', slate = '#3d4549'): Pal => ({ ...pal(stone, slate), glass: STAINED, dark: [0.055, 0.05, 0.05], lead: [0.25, 0.28, 0.29] })

/** A pointed (Gothic) opening on a face: a rectangle under a steep triangle meeting at a point, `h` to the point. */
export function pointedOn(out: MeshBuilder, f: '-z' | '+z' | '-x' | '+x', plane: number, t: number, y0: number, w: number, h: number, c: Rgb, d = 0.08): void {
  const r = w / 2
  const spring = y0 + Math.max(0.3, h - w * 0.86)
  rectOn(out, f, plane, t - r, t + r, y0, spring, c, d)
  const n: [number, number, number] = f === '-z' ? [0, 0, -1] : f === '+z' ? [0, 0, 1] : f === '-x' ? [-1, 0, 0] : [1, 0, 0]
  const off = f === '-z' || f === '-x' ? -d : d
  const P = (u: number, y: number): [number, number, number] => (f === '-z' || f === '+z' ? [t + u, y, plane + off] : [plane + off, y, t + u])
  out.quad([P(-r, spring), P(r, spring), P(0, y0 + h), P(0, y0 + h)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
}

/** A rose window: a round disc of glass flat on a face, `r` across, with a lighter ring round it. */
export function roseOn(out: MeshBuilder, f: '-z' | '+z' | '-x' | '+x', plane: number, t: number, y: number, r: number, c: Rgb, ring: Rgb): void {
  const n: [number, number, number] = f === '-z' ? [0, 0, -1] : f === '+z' ? [0, 0, 1] : f === '-x' ? [-1, 0, 0] : [1, 0, 0]
  const P = (u: number, v: number, d: number): [number, number, number] => {
    const off = f === '-z' || f === '-x' ? -d : d
    return f === '-z' || f === '+z' ? [t + u, y + v, plane + off] : [plane + off, y + v, t + u]
  }
  const k = 16
  for (let i = 0; i < k; i++) {
    const a0 = (i / k) * Math.PI * 2
    const a1 = ((i + 1) / k) * Math.PI * 2
    out.quad([P(0, 0, 0.1), P(Math.cos(a0) * r, Math.sin(a0) * r, 0.1), P(Math.cos(a1) * r, Math.sin(a1) * r, 0.1), P(0, 0, 0.1)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
    out.quad([P(Math.cos(a0) * r, Math.sin(a0) * r, 0.08), P(Math.cos(a0) * (r + 0.5), Math.sin(a0) * (r + 0.5), 0.08),
      P(Math.cos(a1) * (r + 0.5), Math.sin(a1) * (r + 0.5), 0.08), P(Math.cos(a1) * r, Math.sin(a1) * r, 0.08)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], ring, FIXED)
  }
}

/** A pinnacle: a slim square shaft and a pointed cap. */
export function pinnacle(out: MeshBuilder, x: number, z: number, y0: number, h: number, w: number, c: Rgb): void {
  block(out, x - w / 2, x + w / 2, z - w / 2, z + w / 2, y0, y0 + h * 0.55, c)
  prism(out, x, z, y0 + h * 0.55, y0 + h, w * 0.7, 4, c, FIXED, 0.03)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * LA TRINITÉ (Théodore Ballu, 1861–67), the Second Empire church at the head of the Rue de la Chaussée-d'Antin over its
 * square garden: a tall many-storeyed front of arches and columns, and over it the TOWER rising 65 m in stages to its
 * domed lantern — what closes the view up the street from the Opéra. OSM way 49872150 (92 × 34.7 m, no parts): −z
 * south toward the square (bearing 163.9), the apse to the north.
 */
const TX = 17.35
const TZ = 46.0
export function laTrinite(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, TX, TZ, (q) => trinite(q))
}

function trinite(out: MeshBuilder): void {
  const p = church('#a89f8c', '#3e464b')
  const door: Rgb = [0.12, 0.08, 0.055]
  // the body: aisles, nave, its roof, the apse (Batch 5, 2026-10-31: a body of flat arches becomes the Gothic kit's, in Ballu's French Renaissance)
  block(out, -17.3, 17.3, -30, 34, 0, 14, p.stone)
  roof(out, -17.6, 17.6, -30.2, 34.2, 14, 2.5, 4, 1, p.slate)
  block(out, -9.5, 9.5, -30, 34, 14, 25, p.stone)
  roof(out, -9.9, 9.9, -30, 34, 25, 7, 9.9, 0.01, p.slate)
  block(out, -0.08, 0.08, -30, 34, 31.95, 32.3, p.lead)
  chevet(out, 0, 33.5, 12, 0, 14, 16.5, p.stone, p.slate, p.glass, { n: 9, win: { y0: 4, h: 7, head: 'round', lights: 2 }, lean: true, butt: 0.9 })
  chevet(out, 0, 34, 9.5, 14, 25, 32, p.stone, p.slate, p.glass, { n: 7, win: { y0: 16, h: 6.5, head: 'round', lights: 2 } })
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    const aisle = faceFrame(out, f, s * 17.3)
    const nave = faceFrame(out, f, s * 9.5)
    flank(nave, -29, 33, 11, { stone: p.stone, glass: p.glass, y0: 16, h: 6.8, head: 'round', lights: 2, share: 0.52, cornice: 25 })
    flank(aisle, -29, 33, 11, { stone: p.stone, glass: p.glass, y0: 4, h: 7, head: 'round', lights: 2, share: 0.56, far: false, plinth: 1.2, string: true, cornice: 14 })
    for (let i = 0; i <= 11; i++) {
      const u = -29 + (62 * i) / 11
      pilaster(aisle, u, 1.2, 12.8, 0.72, 0.36, p.stone)
      // the scroll over the aisle's roof that takes the place of a flyer, at every other pier, with its urn
      if (i % 2 === 0 && i > 0 && i < 11) {
        volute(faceFrame(out, '-z', u), s * 16.6, 14.6, s * 9.8, 21.5, 0.3, p.trim)
        prism(out, s * 16.8, u, 14, 15.5, 0.42, 8, p.trim, FIXED, 0.16, false)
      }
    }
    gothicBalustrade(aisle, -29, 33, 14, 0.75, { stone: p.trim, d: 0.26, pitch: 1.2 })
    gothicBalustrade(nave, -29, 33, 25, 0.8, { stone: p.trim, d: 0.3, pitch: 1.3 })
  }
  // the front: the porch of three arches, the storey of the rose, the gable, the corner turrets
  const zf = -46
  block(out, -14, 14, zf + 4, -30, 0, 30, p.stone)
  block(out, -13.9, 13.9, zf + 4.1, -30, 30, 30.06, p.lead)
  block(out, -11, 11, zf, zf + 4, 0, 11, p.stone)
  block(out, -10.9, 10.9, zf + 0.1, zf + 4, 11, 11.06, p.lead)
  const porch = faceFrame(out, '-z', zf)
  const wall = faceFrame(out, '-z', zf + 4)
  for (let k = 0; k < 3; k++) block(out, -11.6 + k * 0.2, 11.6 - k * 0.2, zf - 1.2 + k * 0.4, zf, 0, 0.17 * (k + 1), p.trim)
  for (const x of [-7, 0, 7]) gothicPortal(porch, x, 0.5, 6, 9.2, { stone: p.trim, dark: p.dark, door, depth: 0.8, orders: 3 })
  for (const x of [-10.5, -3.5, 3.5, 10.5]) pilaster(porch, x, 0.5, 9.8, 0.85, 0.4, p.trim)
  entablature(porch, -11, 11, 9.8, 1.2, 0.5, p.trim)
  gothicBalustrade(porch, -11, 11, 11, 1, { stone: p.trim, d: 0.4, pitch: 0.72 })
  // the four Virtues on the porch's terrace
  for (const x of [-10.5, -3.5, 3.5, 10.5]) { block(out, x - 0.4, x + 0.4, zf + 0.1, zf + 0.9, 11, 12.4, p.trim); statue(out, x, 12.4, zf + 0.5, 2.5, shade(p.stone, 1.12)) }
  // the rose in its panel between the pairs of tall windows, the order that frames it
  roseWindow(wall, 0, 17.6, 3.5, { stone: p.trim, glass: p.glass, spokes: 12, d: 0.34, panel: 4.2 })
  for (const x of [-8.6, 8.6]) traceryWindow(wall, x, 13, 3, 8.6, { stone: p.trim, glass: p.glass, head: 'round', lights: 2 })
  for (const x of [-12.6, -4.5, 4.5, 12.6]) engaged(wall, x, 12, 23, 0.5, p.trim, 'corinthian')
  entablature(wall, -14, 14, 23, 1.5, 0.6, p.trim)
  pedimentFront(wall, -9.2, 9.2, 24.5, 4.4, 0.75, p.trim, { relief: 7 })
  for (const s of [-1, 1]) {
    // the corner turrets, square and pilastered, under their little ribbed domes
    block(out, s * 12.5 - 1.6, s * 12.5 + 1.6, zf + 3, zf + 6.2, 24.5, 33, p.stone)
    for (const { fr, m } of boxFaces(out, s * 12.5 - 1.6, s * 12.5 + 1.6, zf + 3, zf + 6.2, ['-z', s < 0 ? '-x' : '+x'])) {
      traceryWindow(fr, m, 26, 1.3, 4.6, { stone: p.trim, glass: p.dark, head: 'round', lights: 1, far: true })
    }
    block(out, s * 12.5 - 1.85, s * 12.5 + 1.85, zf + 2.75, zf + 6.45, 32.6, 33.2, p.trim)
    domeOf(out, s * 12.5, zf + 4.6, 33.2, 1.7, 3.2, p.lead, quarter, { sides: 12, steps: 5, ribs: 6 })
    prism(out, s * 12.5, zf + 4.6, 36.2, 37.6, 0.2, 6, p.gold, FIXED, 0.03, false)
  }
  // the tower over the front, in stages: the square belfry, the open lantern, the dome, the cross at 65 m
  const tz = -35
  block(out, -6.5, 6.5, tz - 6.5, tz + 6.5, 24, 40, p.stone)
  for (const { fr, m, u0, u1 } of boxFaces(out, -6.5, 6.5, tz - 6.5, tz + 6.5, ['-z', '+z', '-x', '+x'])) {
    for (const d of [-2.5, 2.5]) louvred(fr, m + d, 30.4, 2.3, 7.8, p.trim, p.dark, { head: 'round', lights: 1, slats: 6 })
    for (const u of [u0 + 0.3, m, u1 - 0.3]) pilaster(fr, u, 29.6, 39, 0.7, 0.3, p.trim)
    pedimentFront(fr, u0, u1, 40, 2.8, 0.42, p.trim, { relief: 3 })
  }
  block(out, -6.9, 6.9, tz - 6.9, tz + 6.9, 39.4, 40.4, p.trim)
  for (const [x, z] of [[-6, tz - 6], [6, tz - 6], [-6, tz + 6], [6, tz + 6]]) stackedPinnacle(out, x, z, 40.4, 4.5, 0.62, p.trim, 2)
  block(out, -4.5, 4.5, tz - 4.5, tz + 4.5, 40.4, 49, p.stone)
  for (const { fr, m, u0, u1 } of boxFaces(out, -4.5, 4.5, tz - 4.5, tz + 4.5)) {
    louvred(fr, m, 41.2, 3, 6.8, p.trim, p.dark, { head: 'round', lights: 2, slats: 5 })
    for (const u of [u0 + 0.28, u1 - 0.28]) pilaster(fr, u, 40.6, 48.4, 0.5, 0.22, p.trim)
    boxOn(fr, u0 - 0.15, u1 + 0.15, 48.4, 49.05, 0, 0.42, p.trim, true)
  }
  prism(out, 0, tz, 49, 54, 3.4, 12, p.stone, FIXED)
  drumArches(out, 0, tz, 3.4, 49.6, 8, 1.2, 3.8, p.dark, p.trim)
  prism(out, 0, tz, 53.8, 54.6, 3.8, 12, p.trim, FIXED)
  domeOf(out, 0, tz, 54.6, 3.4, 5.2, p.lead, quarter, { sides: 12, steps: 6, ribs: 8 })
  prism(out, 0, tz, 59.8, 62.2, 0.8, 8, p.lead, FIXED)
  domeOf(out, 0, tz, 62.2, 0.9, 1.2, p.lead, quarter, { sides: 8, steps: 4 })
  box(out, 0, 64.2, tz, 0.08, 0.8, 0.08, p.gold, FIXED)
  box(out, 0, 64.5, tz, 0.4, 0.07, 0.08, p.gold, FIXED)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * SAINT-ROCH (Lemercier, 1653; the front Robert de Cotte's, 1736), on the Rue Saint-Honoré: its long body runs north
 * behind the street, and what the street sees is the Baroque FRONT on its flight of steps — two storeys of paired
 * Doric and Corinthian columns, the pediment, the scrolls joining the upper storey to the lower — with the dome of the
 * Lady Chapel and the Calvary chapel behind. OSM way 42722202 (126.8 × 39.1, no parts) in this frame: the long axis
 * along x, the front at −x on the Rue Saint-Honoré (bearing 216).
 */
const RX = 63.4
const RZ = 19.55
export function saintRoch(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, RX, RZ, (q) => roch(q))
}

function roch(out: MeshBuilder): void {
  // (Batch 5, 2026-10-31: drawn long along z with its front at −z, and turned to the first attempt's frame)
  turned(out, (q) => rochFrontZ(q))
}

function rochFrontZ(out: MeshBuilder): void {
  const p = church('#a89f8c', '#3f464b')
  const door: Rgb = [0.12, 0.08, 0.055]
  // the body: aisles and chapels, the nave and its roof, the domed Lady Chapel and the Calvary chapel beyond
  block(out, -19.5, 19.5, -53, 40, 0, 14, p.stone)
  roof(out, -19.8, 19.8, -53, 40, 14, 2.5, 4, 1, p.slate)
  block(out, -8, 8, -53, 20, 14, 26, p.stone)
  roof(out, -8.4, 8.4, -53, 20, 26, 7, 8.4, 0.01, p.slate)
  block(out, -0.08, 0.08, -53, 20, 32.95, 33.3, p.lead)
  // the short transept
  block(out, -15, 15, -14, 0, 14, 26, p.stone)
  roof(out, -15.2, 15.2, -14.2, 0.2, 26, 6, 0.01, 7, p.slate)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    const nave = faceFrame(out, f, s * 8)
    flank(nave, -52.5, -14, 7, { stone: p.stone, glass: p.glass, y0: 16.4, h: 7, head: 'round', lights: 2, share: 0.5, cornice: 26 })
    flank(nave, 0, 20, 4, { stone: p.stone, glass: p.glass, y0: 16.4, h: 7, head: 'round', lights: 2, share: 0.5, cornice: 26 })
    const aisle = faceFrame(out, f, s * 19.5)
    flank(aisle, -52.5, 40, 16, { stone: p.stone, glass: p.glass, y0: 3.5, h: 8, head: 'round', lights: 2, share: 0.54, plinth: 1, cornice: 14, buttress: { y1: 13, d: 0.55, w: 0.85, stages: 1 } })
    const tr = faceFrame(out, f, s * 15)
    traceryWindow(tr, -7, 15.5, 5, 9, { stone: p.trim, glass: p.glass, head: 'round', lights: 3, far: true })
    pedimentFront(tr, -14, 0, 26, 5.6, 0.45, p.trim)
    gable(tr, -7, 26, 13.4, 5.4, p.stone, { d: 0.02, finial: 0 })
    // the scroll on each bay between the transept and the front, over the aisle's roof
    for (let z = -46; z < -18; z += 11) volute(faceFrame(out, '-z', z), s * 18.8, 14.5, s * 8.3, 21.5, 0.3, p.trim)
  }
  // the Lady Chapel's drum and dome, its lantern
  prism(out, 0, 28, 14, 24, 7.5, 20, p.stone, FIXED)
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2
    const a1 = ((i + 1) / 8) * Math.PI * 2
    const e = edgeFrame(out, { x: Math.sin(a0) * 7.5, z: 28 + Math.cos(a0) * 7.5 }, { x: Math.sin(a1) * 7.5, z: 28 + Math.cos(a1) * 7.5 }, { x: 0, z: 28 })
    traceryWindow(e, e.L / 2, 16, e.L * 0.5, 6, { stone: p.trim, glass: p.glass, head: 'round', lights: 1, far: true })
  }
  prism(out, 0, 28, 23.6, 24.4, 7.9, 20, p.trim, FIXED)
  domeOf(out, 0, 28, 24.4, 7.3, 6.5, p.lead, quarter, { sides: 20, steps: 7, ribs: 10 })
  prism(out, 0, 28, 30.8, 33, 1, 8, p.trim, FIXED)
  domeOf(out, 0, 28, 33, 1.1, 1.1, p.lead, quarter, { sides: 8, steps: 3 })
  block(out, -12, 12, 40, 63.4, 0, 15, p.stone)
  roof(out, -12.2, 12.2, 40, 63.4, 15, 3, 6, 3, p.slate)
  for (const s of [-1, 1]) flank(faceFrame(out, s < 0 ? '-x' : '+x', s * 12), 40, 63, 4, { stone: p.stone, glass: p.glass, y0: 5, h: 8, head: 'round', lights: 2, cornice: 15 })
  // THE FRONT on the Rue Saint-Honoré: the steps, two storeys of paired columns, the scrolls, the pediment
  const zf = -63.4
  for (let k = 0; k < 6; k++) block(out, -10 - (5 - k) * 0.15, 10 + (5 - k) * 0.15, zf + k * 0.55, -53, 0, 0.3 * (k + 1), k % 2 ? p.stone : p.trim)
  block(out, -12, 12, -57.5, -53, 0, 17, p.stone)
  block(out, -7.5, 7.5, -57.5, -53, 17, 29, p.stone)
  block(out, -11.9, 11.9, -56.5, -53, 17, 17.06, p.lead)
  block(out, -7.4, 7.4, -56.5, -53, 29, 29.06, p.lead)
  const w = faceFrame(out, '-z', -57.5)
  // the lower storey: its Doric pairs, the three portals; the entablature broken forward over the pairs
  for (const x of [-9.6, -8.2, -2.4, -1.0, 1.0, 2.4, 8.2, 9.6]) engaged(w, x, 1.8, 14.8, 0.56, p.trim, 'doric')
  entablature(w, -12.3, 12.3, 14.8, 2.2, 0.72, p.trim)
  classicalDoor(w, 0, 1.8, 2.9, 7.4, p.trim, door, { head: 'flat', pediment: true })
  for (const s of [-1, 1]) {
    classicalDoor(w, s * 5.3, 1.8, 2.2, 5.4, p.trim, door, { head: 'flat' })
    traceryWindow(w, s * 5.3, 9.1, 2.2, 4.4, { stone: p.trim, glass: p.glass, head: 'round', lights: 1, far: true })
    block(out, s * 11.6 - 0.45, s * 11.6 + 0.45, -57.9, -57, 17, 17.5, p.trim)
    prism(out, s * 11.6, -57.45, 17.5, 19, 0.46, 8, p.trim, FIXED, 0.22)
  }
  traceryWindow(w, 0, 10.4, 3.2, 3.6, { stone: p.trim, glass: p.glass, head: 'round', lights: 2, far: true })
  // the upper storey: its Corinthian pairs, the window, a niche either side, and the scrolls joining it to the lower
  for (const x of [-6.9, -5.6, -1.9, 1.9, 5.6, 6.9]) engaged(w, x, 17, 26.5, 0.44, p.trim, 'corinthian')
  entablature(w, -7.8, 7.8, 26.5, 1.7, 0.62, p.trim)
  traceryWindow(w, 0, 18, 2.9, 7, { stone: p.trim, glass: p.glass, head: 'round', lights: 2, screen: { u0: -1.4, u1: 1.4, base: 17.2, top: 26.3, d: 0.2 } })
  for (const s of [-1, 1]) {
    niche(w, s * 3.75, 18.4, 1.2, 4, 0.05, p.stone, p.dark)
    volute(w, s * 11.4, 17, s * 7.6, 23, 0.42, p.trim)
  }
  pedimentFront(w, -8, 8, 28.2, 3.7, 0.85, p.trim, { relief: 5 })
  prism(out, 0, -57, 31.8, 33.4, 0.1, 4, p.gold, FIXED, 0.1)
  box(out, 0, 32.9, -57, 0.45, 0.06, 0.06, p.gold, FIXED)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * SAINT-GERMAIN-L'AUXERROIS (13th–16th c.), the parish of the Louvre, facing the colonnade across the Place du Louvre:
 * the flamboyant PORCH of five bays across the front with its pinnacles and balustrade, the rose and gable of the
 * front over it, the tall slate roof and the Romanesque tower by the south transept; and beside it on the place,
 * Ballu's neo-Gothic BELFRY (1858–60, OSM way 200452261, 50 m) between the church and the town hall of the 1st. OSM way
 * 53770908 (78.3 × 40.6, no parts) in this frame: the long axis along x, the front at −x toward the Louvre (bearing
 * 282.4). The belfry is drawn at OSM's place, local (−34, +29) and 9.5 × 11.5 m.
 */
const GX = 39.15
const GZ = 20.3
export function saintGermainAuxerrois(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, GX, GZ, (q) => auxerrois(q))
}

function auxerrois(out: MeshBuilder): void {
  const p = church('#a59c89', '#3f4649')
  // the body: chapels, aisles, the high nave and choir, the apse
  block(out, -33, 30, -20.3, 20.3, 0, 11, p.stone)
  roof(out, -33, 30, -20.6, 20.6, 11, 2.5, 1, 4, p.slate)
  block(out, -33, 30, -7.5, 7.5, 11, 21, p.stone)
  roof(out, -33.2, 30, -7.9, 7.9, 21, 9, 0.01, 7.9, p.slate)
  // the windows, one to a bay, and at each division a flyer from a pier on the aisles to the nave's wall (gothic.ts)
  for (const [sd, f] of [[-1, '-z'], [1, '+z']] as const) {
    const nave = faceFrame(out, f, sd * 7.5)
    const aisle = faceFrame(out, f, sd * 20.3)
    for (let x = -28; x < 28; x += 5.6) {
      traceryWindow(nave, x, 12.8, 3, 7.2, { stone: p.stone, glass: p.glass, head: 'pointed', lights: 2, far: true })
      traceryWindow(aisle, x, 2.2, 3.4, 7.6, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 3 })
      const xd = x + 2.8
      if (xd > 27) continue
      const py = sd * 13.5
      block(out, xd - 0.5, xd + 0.5, py - 0.6, py + 0.6, 11, 17.5, p.stone)
      stackedPinnacle(out, xd, py, 17.5, 5, 0.75, p.trim)
      flyingButtress(out, [xd, 17.2, py - sd * 0.6], [xd, 20.4, sd * 7.55], 0.55, shade(p.stone, 0.97), { drop: 2.8 })
    }
    gothicBalustrade(aisle, -33, 30, 11, 0.9, { stone: p.trim, d: 0.3, pitch: 1.2 })
  }
  // the apse at +x (Batch 5, 2026-10-31: flat walls until now), its chapels' ring and the high choir, drawn long along z and turned to the frame
  turned(out, (q) => {
    chevet(q, 0, 30, 20.3, 0, 11, 13.6, p.stone, p.slate, p.glass, { n: 11, win: { y0: 2.2, h: 7.6, lights: 3 }, lean: true, butt: 0.9 })
    chevet(q, 0, 30, 7.5, 11, 21, 30, p.stone, p.slate, p.glass, { n: 7, win: { y0: 12.8, h: 7.2, lights: 2 }, rad: { out: 6, y0: 11, y1: 17.5, to: 20.4 } })
  })
  // the Romanesque tower by the south transept, its pyramid roof; twin round-headed openings in its belfry stage
  block(out, 4, 10, 7.5, 13.5, 11, 32, p.stone)
  for (const { fr, m, u0, u1 } of boxFaces(out, 4, 10, 7.5, 13.5, ['+z', '-x', '+x'])) {
    for (const d of [-1.25, 1.25]) louvred(fr, m + d, 24.6, 1.6, 5.4, p.trim, p.dark, { head: 'round', lights: 1, slats: 5 })
    blindArcade(fr, u0 + 0.3, u1 - 0.3, 20, 3.4, 4, p.trim, shade(p.stone, 0.62))
    boxOn(fr, u0 - 0.1, u1 + 0.1, 31.6, 32.05, 0, 0.36, p.trim, true)
  }
  roof(out, 3.8, 10.2, 7.3, 13.7, 32, 6, 3.2, 3.2, p.slate)
  // the front: the gable with its rose, and the porch across it
  const xf = -33
  const fw = faceFrame(out, '-x', xf)
  gable(fw, 0, 21, 15, 9, p.stone, { d: 0.02, crockets: 4, finial: 1.8 })
  roseWindow(fw, 0, 16.2, 3.4, { stone: p.trim, glass: p.glass, spokes: 12, d: 0.3 })
  gothicBalustrade(fw, -7.5, 7.5, 21, 0.85, { stone: p.trim, d: 0.34, pitch: 0.9 })
  traceryWindow(fw, 0, 24.2, 2.3, 3.2, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 2, far: true })
  for (const s of [-1, 1]) {
    block(out, xf - 0.9, xf + 0.2, s * 7.8 - 0.6, s * 7.8 + 0.6, 0, 22, p.stone)
    stackedPinnacle(out, xf - 0.4, s * 7.8, 22, 6, 0.6, p.trim, 2)
    traceryWindow(fw, s * 13.5, 10.8, 4.2, 8.4, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 3, far: true })
  }
  block(out, -39.15, xf, -13, 13, 0, 9.5, p.stone)
  block(out, -39.1, xf, -12.9, 12.9, 9.5, 9.56, p.lead)
  const porch = faceFrame(out, '-x', -39.15)
  for (let i = 0; i < 5; i++) {
    const z = -10.4 + i * 5.2
    gothicPortal(porch, z, 0, 4.2, 7.9, { stone: p.stone, dark: p.dark, door: [0.22, 0.16, 0.12], depth: 0.75, orders: 2, head: 'pointed' })
    stackedPinnacle(out, -39.3, z - 2.6, 9.5, 4.5, 0.8, p.trim)
  }
  stackedPinnacle(out, -39.3, 13, 9.5, 4.5, 0.8, p.trim)
  gothicBalustrade(porch, -13, 13, 9.5, 0.95, { stone: p.trim, d: 0.3, pitch: 0.8 })
  // the belfry on the place (Ballu, 1860): four storeys of Gothic openings in depth, the corner pinnacles, the spire
  const bx = -34
  const bz = 29
  block(out, bx - 4.75, bx + 4.75, bz - 5.75, bz + 5.75, 0, 36, p.stone)
  for (const { fr, f, m, u0, u1 } of boxFaces(out, bx - 4.75, bx + 4.75, bz - 5.75, bz + 5.75)) {
    gothicPortal(fr, m, 0, 3.8, 7, { stone: p.trim, dark: p.dark, door: [0.12, 0.08, 0.055], depth: 0.65, orders: 2, head: 'pointed' })
    traceryWindow(fr, m, 10, 2.2, 6.4, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 2, far: true })
    traceryWindow(fr, m, 19, 2.8, 6.8, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 2, far: true })
    louvred(fr, m, 27.4, 4, 7.8, p.trim, p.dark, { lights: 2, slats: 6 })
    for (const y of [8.6, 17.4, 26]) boxOn(fr, u0 - 0.1, u1 + 0.1, y, y + 0.34, 0, 0.3, p.trim, true)
    for (const u of [u0 + 0.05, u1 - 0.05]) buttress(fr, u, 0, 34, 0.95, 0.95, p.stone, 4)
    gothicBalustrade(fr, u0, u1, 36, 0.9, { stone: p.trim, d: 0.34, pitch: 1 })
    gable(fr, m, 35.6, 5, 3, p.stone, { d: 0.1, finial: 0.8 })
    void f
  }
  for (const [x, z] of [[-4.75, -5.75], [4.75, -5.75], [-4.75, 5.75], [4.75, 5.75]]) stackedPinnacle(out, bx + x, bz + z, 36, 6, 0.7, p.trim, 2)
  spire(out, bx, bz, 36, 14, 4.6, p.slate, { rib: p.lead, lucarnes: 4, lucarneAt: 0.1, lucarneW: 0.7, cross: p.gold, dark: p.dark })
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * SAINT-GERMAIN-DES-PRÉS (the tower c. 1000, the nave 11th c., the choir 1145–63), the oldest church in Paris, on its
 * corner of the boulevard: the square ROMANESQUE TOWER over the west porch, its belfry storey of twin arches and the
 * slate spire to 60 m (OSM's parts 1461285707/14/15); the long low nave under its slate roof; the Gothic choir at the
 * east end with its early flying buttresses and the ring of chapels round the apse, and the two stumps of the choir's
 * towers (cut down in 1821) capped in slate. OSM way 62287173 in this frame (turned to the church's own axis, 6.5° off
 * the footprint's box): −z west, the tower at (−2, −41.6). Saint-Symphorien (the chapel against the tower's south side,
 * way 495635817) is OSM's and stays.
 *
 * In the city OSM's parts drew the tower as a windowed block and its corner pinnacles as pillars floating over the
 * roofs; the model replaces them. Batch 5 (2026-10-31): it was 1,660 triangles of flat dark arches, and is the Gothic kit's
 * now: Romanesque round heads in depth, the 1607 door, blind arcades, louvred belfry, a ribbed spire with its lucarnes.
 */
const SGX = 19.05
const SGZ = 52.1
export function saintGermainDesPres(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, SGX, SGZ, (q) => sgdp(q))
}

function sgdp(out: MeshBuilder): void {
  const p = church('#a39a88', '#3b4347')
  const ax = -0.5
  const N = { x: 5.6, eaves: 18.5, ridge: 26 }
  const A = { x: 13.4, eaves: 10 }
  // the nave: aisles and chapels under their lean-to, the high walls, the long roof with its lead crest
  block(out, ax - A.x, ax + A.x, -35, 0, 0, A.eaves, p.stone)
  block(out, ax - N.x, ax + N.x, -35, 0, A.eaves, N.eaves, p.stone)
  roof(out, ax - N.x - 0.4, ax + N.x + 0.4, -35, 0.2, N.eaves, N.ridge - N.eaves, N.x + 0.4, 0.01, p.slate)
  block(out, ax - 0.08, ax + 0.08, -35, 0, N.ridge - 0.05, N.ridge + 0.25, p.lead)
  // the choir: a metre and a half taller
  const C = { x: 5.8, eaves: 20, ridge: 27.5 }
  block(out, ax - A.x, ax + A.x, 0, 37, 0, 11, p.stone)
  block(out, ax - C.x, ax + C.x, 0, 37, 11, C.eaves, p.stone)
  roof(out, ax - C.x - 0.4, ax + C.x + 0.4, -0.2, 37, C.eaves, C.ridge - C.eaves, C.x + 0.4, 0.01, p.slate)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    // the lean-tos, up to the high wall
    const sl = (z0: number, z1: number, e0: number, e1: number, up: number, xn: number): void => out.quad([[ax + s * (A.x + 0.35), e0, z0], [ax + s * (A.x + 0.35), e0, z1], [ax + s * xn, up, z1], [ax + s * xn, up, z0]], [s * 0.34, 0.94, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
    sl(-35, 0, A.eaves, A.eaves, A.eaves + 3.6, N.x)
    sl(0, 37, 11, 11, 15, C.x)
    const nave = faceFrame(out, f, ax + s * N.x)
    const aisle = faceFrame(out, f, ax + s * A.x)
    const choir = faceFrame(out, f, ax + s * C.x)
    // the nave's round-headed clerestory, and the aisle windows between their shallow buttresses, in depth where the rider goes by
    flank(nave, -34.5, -0.5, 7, { stone: p.stone, glass: p.glass, y0: 12.4, h: 4.6, head: 'round', lights: 1, share: 0.42, cornice: N.eaves })
    flank(aisle, -34.5, -0.5, 7, { stone: p.trim, glass: p.glass, y0: 2.9, h: 5.4, head: 'round', lights: 1, share: 0.46, far: false, plinth: 1.1, string: true, cornice: A.eaves, buttress: { y1: 8.8, d: 0.85, w: 1, stages: 2 } })
    // the choir's lancets over its aisles, and its flyers: the earliest in Paris, plain and steep
    flank(choir, 1, 36.5, 6, { stone: p.stone, glass: p.glass, y0: 14.6, h: 4.6, head: 'pointed', lights: 1, share: 0.42, cornice: C.eaves })
    flank(aisle, 8, 36.5, 5, { stone: p.trim, glass: p.glass, y0: 3, h: 5.8, head: 'round', lights: 2, far: false, plinth: 1.1, string: true, cornice: 11, buttress: { y1: 9.8, d: 0.9, w: 1, stages: 2 } })
    flyers(out, [3.8, 9.7, 15.6, 21.5, 27.4, 33.3], ax + s * 11.8, 11, 17, ax + s * C.x, 19.4, p.stone, { w: 1, pin: 2.6 })
    // the transept's arm, its gable and a big round head
    const tr = faceFrame(out, f, ax + s * A.x)
    rect(tr, -1.2, 7.4, 0, 19, 0.5, p.stone)
    boxOn(tr, -1.2, 7.4, 0, 1.2, 0.5, 0.75, shade(p.stone, 0.92))
    traceryWindow(frameAt(tr, 0.5), 3.1, 7.2, 3.6, 8.2, { stone: p.trim, glass: p.glass, head: 'round', lights: 2 })
    gable(frameAt(tr, 0.5), 3.1, 19, 8.6, 5.5, p.stone, { finial: 1.2 })
    block(out, Math.min(ax + s * A.x, ax + s * 5), Math.max(ax + s * A.x, ax + s * 5), -1.2, 7.4, 11, 19, p.stone)
    roof(out, Math.min(ax + s * (A.x + 0.5), ax + s * 5.4), Math.max(ax + s * (A.x + 0.5), ax + s * 5.4), -1.5, 7.7, 19, 5.5, 0.01, 4.6, p.slate)
    // the stump of the choir's tower, by the transept, under its slate cap
    block(out, ax + s * 8.9 - 2.6, ax + s * 8.9 + 2.6, 8.4, 13.6, 11, 25, p.stone)
    roof(out, ax + s * 8.9 - 2.9, ax + s * 8.9 + 2.9, 8.1, 13.9, 25, 3.8, 2.9, 2.9, p.slate)
    for (const { fr, m, f: ff } of boxFaces(out, ax + s * 8.9 - 2.6, ax + s * 8.9 + 2.6, 8.4, 13.6, [s < 0 ? '-x' : '+x', '+z'])) {
      void ff
      louvred(fr, m, 19, 2, 4.6, p.stone, p.dark, { head: 'round', lights: 1 })
      blindArcade(fr, m - 2.2, m + 2.2, 14.2, 3.2, 4, p.trim, shade(p.stone, 0.62))
      boxOn(fr, m - 2.65, m + 2.65, 24.7, 25.05, 0, 0.3, p.trim)
    }
  }
  // the chevet: the ambulatory's radiating chapels, each with its window, under their lean-to; the apse over them
  chevet(out, ax, 37, 13.4, 0, 11, 14.4, p.stone, p.slate, p.glass, { n: 9, win: { y0: 3, h: 5.8, head: 'round', lights: 1 }, lean: true, butt: 1 })
  chevet(out, ax, 37, C.x, 11, C.eaves, C.ridge, p.stone, p.slate, p.glass, { n: 7, win: { y0: 13.4, h: 5.4, head: 'pointed', lights: 1 }, rad: { out: 6, y0: 11, y1: 17, to: 19.4 } })

  // THE WEST TOWER: the porch and lower storeys to 34.7, the corner pinnacles, the belfry to 42.8, the spire to 60
  const tx = -2.0
  const tz = -41.6
  block(out, -7.0, 4.8, -46.3, -35.5, 0, 34.7, p.stone)
  block(out, -7.05, 4.85, -46.35, -35.45, 0, 1.4, shade(p.stone, 0.88))
  for (const { fr, f, u0, u1, m } of boxFaces(out, -7.0, 4.8, -46.3, -35.5, ['-z', '-x', '+x'])) {
    for (const y of [10.5, 20.5, 28.0]) boxOn(fr, u0 - 0.05, u1 + 0.05, y, y + 0.42, 0, 0.3, p.trim, true)
    for (const u of [u0 + 0.5, u1 - 0.5]) buttress(fr, u, 0, 28, 1.2, 1.1, p.stone, 3)
    const mm = f === '-z' ? tx + 0.1 : m
    if (f !== '-z') traceryWindow(fr, mm, 5, 1.9, 4.2, { stone: p.trim, glass: p.dark, head: 'round', lights: 1 })
    traceryWindow(fr, mm, 13, 1.9, 5.8, { stone: p.trim, glass: p.glass, head: 'round', lights: 1, far: true })
    for (const d of [-1.7, 1.7]) louvred(fr, mm + d, 21.6, 1.5, 5.2, p.trim, p.dark, { head: 'round', lights: 1 })
    blindArcade(fr, u0 + 1.2, u1 - 1.2, 29.2, 4.6, 6, p.trim, shade(p.stone, 0.6))
    boxOn(fr, u0 - 0.15, u1 + 0.15, 34.3, 34.85, 0, 0.42, p.trim, true)
  }
  // the door of 1607: a Doric porch of a pair of columns, a pediment; the Romanesque portal's jambs behind it
  const west = faceFrame(out, '-z', -46.3)
  rect(west, -6, 2, 0, 9.5, 0.14, shade(p.stone, 0.96))
  classicalDoor(west, tx + 0.1, 0, 2.7, 5.3, p.trim, [0.11, 0.08, 0.06], { head: 'round' })
  for (const s of [-1, 1]) {
    engaged(west, tx + 0.1 + s * 2.35, 0.2, 7, 0.34, p.trim, 'doric')
    engaged(west, tx + 0.1 + s * 3.25, 0.2, 7, 0.34, p.trim, 'doric')
  }
  entablature(west, tx + 0.1 - 3.8, tx + 0.1 + 3.8, 7, 1.2, 0.5, p.trim)
  pedimentFront(west, tx + 0.1 - 3.9, tx + 0.1 + 3.9, 8.2, 1.7, 0.75, p.trim, { relief: 3 })
  for (let k = 0; k < 2; k++) block(out, tx - 3.6 + k * 0.3, tx + 3.8 - k * 0.3, -47.6 + k * 0.5, -46.3, 0, 0.17 * (k + 1), p.trim)
  // the stones the corners end in: small pyramids, on the wide stage
  for (const [x, z] of [[-6.4, -45.7], [4.2, -45.7], [-6.4, -36.1], [4.2, -36.1]]) stackedPinnacle(out, x, z, 34.7, 3.4, 0.62, p.stone)
  // the belfry's twin arches on each face, its corbel table, and the ribbed spire with its lucarnes
  block(out, tx - 4.25, tx + 4.25, tz - 4.05, tz + 4.05, 34.7, 42.8, p.stone)
  for (const { fr, m, u0, u1 } of boxFaces(out, tx - 4.25, tx + 4.25, tz - 4.05, tz + 4.05)) {
    for (const d of [-1.85, 1.85]) louvred(fr, m + d, 36, 2.3, 5.6, p.trim, p.dark, { head: 'round', lights: 2, slats: 5 })
    for (const u of [u0 + 0.15, u1 - 0.15]) rect(fr, u - 0.14, u + 0.14, 34.8, 42, 0.14, p.trim)
    for (let u = u0 + 0.35; u < u1 - 0.1; u += 0.9) boxOn(fr, u - 0.14, u + 0.14, 41.9, 42.3, 0, 0.28, p.trim)
    boxOn(fr, u0 - 0.2, u1 + 0.2, 42.3, 42.82, 0, 0.42, p.trim, true)
  }
  spire(out, tx, tz, 42.8, 17.2, 4.4, p.slate, { rib: p.lead, lucarnes: 4, lucarneAt: 0.16, lucarneW: 0.5, cross: p.gold, dark: p.dark })
  for (const s of [-1, 1]) {
    for (const t of [-1, 1]) {
      prism(out, tx + s * 4.15, tz + t * 3.95, 42.8, 43.9, 0.62, 8, p.stone, FIXED, 0.62, false)
      prism(out, tx + s * 4.15, tz + t * 3.95, 43.9, 45.3, 0.68, 8, p.slate, FIXED, 0.03, false)
    }
  }
}
