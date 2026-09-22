/**
 * Landmarks built from code, where the shape is simple enough that a model is not worth sourcing.
 *
 * Every builder writes into a MeshBuilder in its own local frame — origin at the base centre, +y up — in the
 * cartoon material's vertex format (rgb colour, alpha 0 = keep it). `landmarks.ts` places the result. Named
 * in a landmark manifest as `"procedural": "<name>"`.
 */
import { MeshBuilder } from '../buildings.ts'
import { box, disc, prism, type Rgb } from '../models.ts'
import { archedPane, beam, block, column, courtFacade, dome, fourSides, placed, rotated, hex, pane, pediment, pinnacle, pointedPane, roof, shade, turret, windows } from './kit.ts'

const FIXED = 0

/** A footprint the builder is fitted to: its long axis, its size, and which way is east. */
export interface Fit {
  /** half-length along the long axis (local x) and half-width across it (local z), metres */
  hx: number
  hz: number
  height: number
  /** the footprint itself (or the courtyard, for a `court` entry), in the model's own frame, anticlockwise */
  ring?: { x: number; z: number }[]
}

/**
 * The Colonne de Juillet in the Place de la Bastille: a marble pedestal, a fluted bronze column, a capital
 * with a gallery, and the gilded Génie de la Liberté on a globe at the top. 46.3 m. At the distance a rider
 * sees it from, the silhouette and the gold at the top are the whole of it.
 */
export function colonneDeJuillet(out: MeshBuilder): void {
  const marble: Rgb = [0.86, 0.84, 0.8]
  const bronze: Rgb = [0.25, 0.36, 0.3]
  const gold: Rgb = [0.86, 0.68, 0.24]
  box(out, 0, 0.6, 0, 6, 0.6, 6, marble, FIXED)                        // the step
  box(out, 0, 2.6, 0, 4.6, 1.4, 4.6, marble, FIXED)                    // the pedestal
  box(out, 0, 4.2, 0, 3.4, 0.2, 3.4, bronze, FIXED)
  prism(out, 0, 0, 4.4, 6.4, 2.4, 16, bronze)                          // the base drum
  // the shaft, fluted: 24 faces, every other one set back
  const y0 = 6.4
  const y1 = 40.4
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2
    const a1 = ((i + 1) / 24) * Math.PI * 2
    const am = (a0 + a1) / 2
    const r = i % 2 === 0 ? 1.2 : 1.1
    out.quad([
      [Math.sin(a0) * r, y0, Math.cos(a0) * r], [Math.sin(a1) * r, y0, Math.cos(a1) * r],
      [Math.sin(a1) * r, y1, Math.cos(a1) * r], [Math.sin(a0) * r, y1, Math.cos(a0) * r],
    ], [Math.sin(am), 0, Math.cos(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], bronze, FIXED)
  }
  for (let y = 10; y < y1; y += 8) prism(out, 0, 0, y, y + 0.35, 1.3, 16, bronze)   // the bands
  prism(out, 0, 0, y1, y1 + 1.2, 1.2, 16, bronze, FIXED, 1.8)          // the capital
  box(out, 0, y1 + 1.4, 0, 1.9, 0.2, 1.9, bronze, FIXED)                // the gallery
  prism(out, 0, 0, y1 + 1.6, y1 + 2.4, 0.9, 12, bronze, FIXED, 0.7)     // the lantern
  prism(out, 0, 0, y1 + 2.4, y1 + 3.0, 0.6, 12, gold)                   // the globe (as a drum)
  prism(out, 0, 0, y1 + 3.0, y1 + 5.2, 0.28, 8, gold, FIXED, 0.18)      // the figure
  box(out, 0, y1 + 4.6, 0, 1.2, 0.08, 0.12, gold, FIXED)                // its outstretched wings
  prism(out, 0, 0, y1 + 5.2, y1 + 5.9, 0.08, 6, gold, FIXED, 0)         // the torch
}

/**
 * The Centre Pompidou: the building turned inside out. 166 × 60 × 42 m, thirteen 12.8 m bays by six 7 m
 * floors. Behind the outer plane the glass is set back; on the long sides the white columns carry the
 * gerberettes — the cast-steel rocker arms at every floor that reach out to the thin tension ties on the
 * outer line — with the X-bracing across every bay. The piazza (west) front carries the escalator in its
 * glass tube, climbing in flights from the south end to the gallery along the top; the east (street) front
 * carries the ducts in their colour code — blue air, green water, yellow electricity, red for moving people.
 * On the piazza, the white ventilation trumpets. `fit` is the footprint measured square to the piazza
 * front, which faces local −z (landmarks.ts turns it so; manifest front 291).
 */
export function pompidou(out: MeshBuilder, fit: Fit): void {
  const { hx, hz } = fit
  const h = Math.min(fit.height, 42)
  const white: Rgb = [0.93, 0.93, 0.92]
  const cast: Rgb = [0.78, 0.79, 0.8]
  const glass: Rgb = [0.46, 0.55, 0.62]
  const tube: Rgb = [0.72, 0.8, 0.84]
  const red: Rgb = [0.78, 0.14, 0.1]
  const bays = Math.max(4, Math.round((2 * hx) / 12.8))
  const bay = (2 * hx) / bays
  const floors = 6
  const fh = h / floors
  const inner = hz - 3.2                        // the column line; the ties stand on the outer line at ±hz
  // the glass box behind it all
  box(out, 0, h / 2, 0, hx - 1.2, h / 2, inner - 1.2, glass, FIXED)
  box(out, 0, h + 0.3, 0, hx - 1.2, 0.3, inner - 1.2, cast, FIXED)
  for (const s of [-1, 1]) {
    for (let i = 0; i <= bays; i++) {
      const x = -hx + i * bay
      // the column, the thin outer tie, and a gerberette at every floor between them
      prism(out, x, s * inner, 0, h + 0.8, 0.45, 10, white)
      prism(out, x, s * hz, 0, h, 0.16, 6, white)
      for (let f = 1; f <= floors; f++) {
        const y = f * fh
        beam(out, [x, y - 0.2, s * (inner - 1.4)], [x, y - 0.35, s * (hz + 0.2)], 0.28, cast, 0.45)
        beam(out, [x, y - 1.6, s * inner], [x, y - 0.5, s * (hz - 0.6)], 0.12, cast)
      }
    }
    // the floor beams on the outer line, and the X-bracing across every bay
    for (let f = 0; f <= floors; f++) beam(out, [-hx, f * fh, s * hz], [hx, f * fh, s * hz], 0.14, white, 0.22)
    for (let i = 0; i < bays; i++) {
      const x0 = -hx + i * bay
      const x1 = x0 + bay
      for (let f = 0; f < floors; f++) {
        const y0 = f * fh
        const y1 = y0 + fh
        beam(out, [x0, y0, s * (hz + 0.1)], [x1, y1, s * (hz + 0.1)], 0.06, white)
        beam(out, [x1, y0, s * (hz + 0.1)], [x0, y1, s * (hz + 0.1)], 0.06, white)
      }
    }
  }
  // the short ends: columns and floor bands
  for (const s of [-1, 1]) {
    for (let z = -inner; z <= inner + 0.01; z += (2 * inner) / 4) prism(out, s * hx, z, 0, h, 0.35, 8, white)
    for (let f = 0; f <= floors; f++) box(out, s * hx, f * fh, 0, 0.25, 0.2, inner, white, FIXED)
  }
  // the escalator: flights up the piazza front from the south end, a landing at each floor, then the
  // gallery along the top — a glass tube on white struts, a red line under it
  const zf = -hz - 2.2
  let x = -hx + bay * 0.6
  let y = 1
  const flight = bay * 1.9
  const pts: [number, number, number][] = [[x, y, zf]]
  for (let f = 1; f < floors && x + flight < hx - 4; f++) {
    x += flight
    y = f * fh + 1
    pts.push([x, y, zf])
    x += 3.5
    pts.push([x, y, zf])
  }
  pts.push([hx - 3, y, zf])
  for (let i = 1; i < pts.length; i++) {
    beam(out, pts[i - 1], pts[i], 1.25, tube, 1.5)
    const lo = (p: [number, number, number]): [number, number, number] => [p[0], p[1] - 1.6, p[2] - 1.26]
    beam(out, lo(pts[i - 1]), lo(pts[i]), 0.08, red, 0.12)
  }
  for (const p of pts) beam(out, [p[0], p[1] - 1.5, zf], [p[0], p[1] - 1.5, -hz + 0.2], 0.15, white)
  // the east front's ducts, in their colours, standing proud of the frame, and their horizontal runs
  const ducts: Rgb[] = [[0.12, 0.32, 0.72], [0.12, 0.55, 0.3], [0.9, 0.78, 0.15], [0.12, 0.32, 0.72], [0.12, 0.55, 0.3], [0.78, 0.14, 0.1]]
  for (let i = 0; i < 20; i++) {
    const xd = -hx + 4 + (i * (2 * hx - 8)) / 19
    prism(out, xd, hz + 1.8, 0, h + 1.5, i % 3 === 0 ? 0.95 : 0.55, 10, ducts[i % ducts.length])
  }
  for (let f = 1; f < floors; f += 2) beam(out, [-hx + 2, f * fh + 2, hz + 2.8], [hx - 2, f * fh + 2, hz + 2.8], 0.4, ducts[f % 3])
  // the roof plant: blue air handlers and green pipes
  for (let i = 0; i < 6; i++) {
    const xr = -hx * 0.7 + (i * hx * 1.4) / 5
    box(out, xr, h + 1.8, -inner * 0.3, 2.8, 1.5, 3.2, [0.12, 0.32, 0.72], FIXED)
    box(out, xr, h + 1.0, inner * 0.4, 0.45, 0.45, inner * 0.3, [0.12, 0.55, 0.3], FIXED)
  }
  // the Piazza: pale paving falling gently toward the building, the length of the front and 45 m out
  // (and under the building's outer frame too, right up to the glass, or a strip of lawn showed there)
  block(out, -hx - 4, hx + 4, -hz - 1, -inner + 1, 0, 0.55, [0.62, 0.59, 0.54])
  for (let k = 0; k < 6; k++) {
    const z0 = -hz - 1 - k * 7.5
    block(out, -hx - 4, hx + 4, z0 - 7.5, z0, 0, 0.55 + k * 0.22, k % 2 ? [0.6, 0.57, 0.52] : [0.62, 0.59, 0.54])
  }
  // the white trumpets on the piazza: a pipe up, and a bell opening toward the building
  for (const t of [-0.55, -0.1, 0.35]) {
    const xt = hx * t
    const zt = -hz - 16
    prism(out, xt, zt, 0.5, 3.9, 0.55, 12, white)
    prism(out, xt, zt, 3.9, 5.3, 0.6, 12, white, FIXED, 1.5)
    prism(out, xt, zt, 5.3, 5.5, 1.5, 12, [0.25, 0.25, 0.27], FIXED, 1.4)
  }
}

/**
 * The Eiffel Tower, for the skyline — it is five kilometres away and is only ever seen from there, so this
 * is a silhouette: four legs following the tower's own taper, braced every 12 m, the first-floor arches, three
 * platforms and the spire. About three thousand triangles.
 */
export function eiffelTower(out: MeshBuilder): void {
  const iron: Rgb = [0.42, 0.33, 0.24]
  const w = (y: number): number => 125 * Math.pow(Math.max(0, 1 - y / 330), 1.8) / 2   // half-width
  const leg = (y: number): number => Math.max(1.5, w(y) * 0.22)                         // leg thickness
  for (let y = 0; y < 276; y += 12) {
    const y1 = Math.min(276, y + 12)
    const h0 = w(y)
    const h1 = w(y1)
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        // a leg segment as a box between the two heights, leaning in
        const cx = sx * (h0 + h1) / 2 - sx * leg(y) / 2
        const cz = sz * (h0 + h1) / 2 - sz * leg(y) / 2
        box(out, cx, (y + y1) / 2, cz, leg(y) / 2, (y1 - y) / 2, leg(y) / 2, iron, FIXED)
      }
    }
    // cross braces on each face, above the arches
    if (y >= 57) {
      const hw = (h0 + h1) / 2
      for (const s of [-1, 1]) {
        box(out, 0, y1, s * hw, hw, 0.6, 0.4, iron, FIXED)
        box(out, s * hw, y1, 0, 0.4, 0.6, hw, iron, FIXED)
      }
    }
  }
  // the arches between the legs under the first floor
  for (let k = 0; k < 9; k++) {
    const a = (k / 8) * Math.PI
    const hw = w(40)
    for (const s of [-1, 1]) {
      box(out, Math.cos(a) * hw * 0.8, 38 + Math.sin(a) * 16, s * w(45), 3, 1, 0.8, iron, FIXED)
      box(out, s * w(45), 38 + Math.sin(a) * 16, Math.cos(a) * hw * 0.8, 0.8, 1, 3, iron, FIXED)
    }
  }
  for (const [y, s] of [[57, 1.08], [115, 1.1], [276, 1.6]] as const) {
    box(out, 0, y, 0, w(y) * s, 2.5, w(y) * s, iron, FIXED)                 // the platforms
  }
  prism(out, 0, 0, 276, 312, 3.2, 8, iron, FIXED, 1.2)                          // the top
  prism(out, 0, 0, 312, 330, 0.6, 6, [0.8, 0.8, 0.8], FIXED, 0.2)               // the antenna
}

/** Tour Montparnasse: a 210 m dark curtain-wall slab, gently convex. */
export function montparnasse(out: MeshBuilder): void {
  const dark: Rgb = [0.16, 0.17, 0.19]
  box(out, 0, 105, 0, 25, 105, 16, dark, FIXED)
  box(out, 0, 211, 0, 22, 1.5, 13, [0.3, 0.3, 0.32], FIXED)
}

/** Sacré-Cœur: a white travertine block crowned by a tall dome and its campanile, on the hill of Montmartre. */
export function sacreCoeur(out: MeshBuilder): void {
  const white: Rgb = [0.94, 0.93, 0.9]
  box(out, 0, 20, 0, 40, 20, 26, white, FIXED)
  prism(out, 0, -6, 40, 58, 12, 16, white)
  prism(out, 0, -6, 58, 80, 13, 16, white, FIXED, 3)
  prism(out, 0, -6, 80, 86, 2, 8, white, FIXED, 0.5)
  for (const [x, z] of [[-26, 12], [26, 12], [-26, -20], [26, -20]]) {
    prism(out, x, z, 40, 50, 4, 12, white)
    prism(out, x, z, 50, 58, 4.5, 12, white, FIXED, 0.8)
  }
  box(out, 0, 50, -34, 6, 50, 6, white, FIXED)                                  // the campanile
  prism(out, 0, -34, 100, 112, 5, 8, white, FIXED, 0.5)
}

/** The Panthéon: a temple front and a drum with its colonnade and dome. */
export function pantheon(out: MeshBuilder): void {
  const stone: Rgb = [0.86, 0.83, 0.76]
  box(out, 0, 14, 0, 55, 14, 42, stone, FIXED)
  prism(out, 0, 0, 28, 50, 16, 24, stone)
  prism(out, 0, 0, 50, 54, 17, 24, stone)
  prism(out, 0, 0, 54, 76, 15, 24, [0.55, 0.6, 0.62], FIXED, 3)
  prism(out, 0, 0, 76, 83, 2.5, 8, stone, FIXED, 0.5)
}

/** Notre-Dame: the nave's long roof, the two square west towers, and Viollet-le-Duc's spire (rebuilt 2024). */
export function notreDame(out: MeshBuilder): void {
  const stone: Rgb = [0.8, 0.76, 0.68]
  const lead: Rgb = [0.35, 0.38, 0.42]
  box(out, 20, 17, 0, 60, 17, 20, stone, FIXED)
  box(out, 20, 38, 0, 58, 4, 9, lead, FIXED)
  for (const z of [-11, 11]) box(out, -40, 34, z, 8, 34, 7, stone, FIXED)       // the west towers
  prism(out, 26, 0, 42, 96, 3, 8, lead, FIXED, 0.2)                              // the spire
}

/**
 * Église Saint-Paul-Saint-Louis, the Jesuit church on Rue Saint-Antoine (1627–41): a tall frontispiece of
 * three superimposed orders — paired Corinthian columns either side of a central bay, each tier narrower, the
 * top one under a pediment — and behind it the first great dome in Paris, on a drum over the crossing, with a
 * lantern. The facade stands ON the footprint's street edge (local −z), so the name plate is on it.
 */
export function saintPaul(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e6dcc8')
  const dark = hex('#2c2a28')
  const slate = hex('#565d66')
  const lead = hex('#5c636b')
  const gold = hex('#c9a646')
  const front = -fit.hz
  const back = fit.hz
  const W = Math.min(2 * fit.hx, 30)
  const naveW = Math.min(W * 0.62, 16)
  // the nave and its aisles behind the facade
  block(out, -naveW / 2, naveW / 2, front + 1.5, back, 0, 22, stone)
  roof(out, -naveW / 2 - 0.4, naveW / 2 + 0.4, front + 1.5, back, 22, 7, naveW / 2 + 0.4, 0, slate)
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -W / 2 : naveW / 2
    const x1 = s < 0 ? -naveW / 2 : W / 2
    block(out, x0, x1, front + 1.5, back - 4, 0, 13, stone)
    roof(out, x0, x1, front + 1.5, back - 4, 13, 2.5, 0, 0, slate)
    windows(out, s < 0 ? '-x' : '+x', s < 0 ? -W / 2 : W / 2, front + 6, back - 8, 5, 2.2, 5, 7, dark)
  }
  windows(out, '-x', -naveW / 2, front + 6, back - 4, 15, 2, 5, 8, dark)
  windows(out, '+x', naveW / 2, front + 6, back - 4, 15, 2, 5, 8, dark)

  // the frontispiece: three tiers, each set back a little and narrower
  const tiers: [number, number, number, number][] = [[0, 17, W, 0], [17, 31, W * 0.72, 0.4], [31, 41, W * 0.46, 0.8]]
  for (const [y0, y1, w, back0] of tiers) {
    const z = front + back0
    block(out, -w / 2, w / 2, z, z + 3, y0, y1, stone)
    // the entablature above the tier, proud of it
    block(out, -w / 2 - 0.5, w / 2 + 0.5, z - 0.5, z + 3, y1 - 1.1, y1, shade(stone, 1.04))
    // paired columns either side of the central bay, standing proud of the tier
    const cr = Math.max(0.35, (y1 - y0) * 0.035)
    for (const s of [-1, 1]) {
      for (const k of [0.16, 0.24, 0.38, 0.46]) {
        if (w < 16 && k > 0.3) continue
        column(out, s * w * k, z - 0.7, y0, y1 - 1.1, cr, stone)
      }
    }
    // the central opening: the great door on the ground tier, a tall window above
    if (y0 === 0) {
      archedPane(out, z, 0, 0.5, 4.2, 9, dark)
      for (const s of [-1, 1]) archedPane(out, z, s * w * 0.31, 0.5, 2.2, 5.5, dark)
    } else {
      archedPane(out, z, 0, y0 + 2, 3.2, (y1 - y0) * 0.6, dark)
    }
    // the scrolled consoles that step each upper tier down to the one below: low stepped blocks either side
    if (y0 > 0) {
      for (const s of [-1, 1]) {
        const x = s * (w / 2 + 1.2)
        box(out, x, y0 + 0.7, z + 1.5, 1.2, 0.7, 1.4, stone, 0)
        box(out, x - s * 0.4, y0 + 2, z + 1.5, 0.8, 0.6, 1.3, stone, 0)
        box(out, x - s * 0.8, y0 + 3, z + 1.5, 0.4, 0.4, 1.2, stone, 0)
      }
    }
  }
  pediment(out, -W * 0.25, W * 0.25, front + 0.8, 41, 4.5, 3, stone)
  prism(out, 0, front + 1.5, 45.5, 47.5, 0.12, 4, gold, 0, 0.12)                // the cross on the pediment

  // the dome over the crossing, well back from the street, rising behind the facade
  const cz = front + 1.5 + (back - front) * 0.58
  prism(out, 0, cz, 22, 32, 9, 16, stone)                                        // the drum
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    box(out, Math.sin(a) * 9.1, 27, cz + Math.cos(a) * 9.1, 0.4, 5, 0.4, shade(stone, 1.05), 0)   // its pilasters
  }
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    box(out, Math.sin(a) * 9.02, 27.5, cz + Math.cos(a) * 9.02, 0.9, 2.2, 0.9, dark, 0)            // its windows
  }
  block(out, -9.6, 9.6, cz - 9.6, cz + 9.6, 32, 32.6, shade(stone, 1.03))
  dome(out, 0, cz, 32.6, 9.2, 15, lead, 16, shade(lead, 1.25))
  prism(out, 0, cz, 47, 51.5, 1.8, 8, stone)                                     // the lantern
  dome(out, 0, cz, 51.5, 1.9, 1.6, lead, 8)
  prism(out, 0, cz, 53, 55.5, 0.1, 4, gold, 0, 0.1)
  box(out, 0, 54.6, cz, 0.6, 0.08, 0.08, gold, 0)
}

/**
 * The Hôtel de Sens (1475–1519), one of the few medieval town palaces left in Paris: grey-ochre stone, very
 * steep slate roofs, round turrets corbelled out at the street corners under pointed roofs, a square keep
 * tower with a tall pointed roof at the back, big stone dormers with pinnacles, and a pointed gateway.
 */
export function hotelDeSens(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#d4c8ae')
  const slate = hex('#454b52')
  const dark = hex('#2e2b27')
  const hx = Math.min(fit.hx, 22)
  const hz = Math.min(fit.hz, 14)
  const eaves = 12
  // the main range along the street, and a wing back from one end (an L round the courtyard)
  block(out, -hx, hx, -hz, -hz + 9, 0, eaves, stone)
  roof(out, -hx - 0.3, hx + 0.3, -hz - 0.3, -hz + 9.3, eaves, 9, 0.6, 4.8, slate)
  block(out, hx - 9, hx, -hz + 9, hz, 0, eaves, stone)
  roof(out, hx - 9.3, hx + 0.3, -hz + 9, hz + 0.3, eaves, 8, 4.8, 0.6, slate)
  // a plinth and a string course: the only horizontal lines on the plain rubble wall
  block(out, -hx - 0.15, hx + 0.15, -hz - 0.15, -hz, 0, 0.9, shade(stone, 0.9))
  block(out, -hx, hx, -hz - 0.2, -hz, 7.1, 7.4, shade(stone, 1.06))
  // the gateway: a big pointed arch in a pale dressed-stone frame, and the pedestrian door beside it
  const g = -hx * 0.3
  pointedPane(out, -hz + 0.04, g, 0, 5.4, 7.6, shade(stone, 1.12))
  pointedPane(out, -hz, g, 0, 4.2, 6.6, dark)
  pointedPane(out, -hz + 0.04, g + 4, 0, 1.9, 3.5, shade(stone, 1.12))
  pointedPane(out, -hz, g + 4, 0, 1.3, 3, dark)
  // mullioned cross windows, as a late-Gothic front has — paired, with pale surrounds
  for (const t of [-hx * 0.75, -hx * 0.62, hx * 0.18, hx * 0.3, hx * 0.58, hx * 0.7]) {
    for (const y of [3.4, 8.3]) {
      pane(out, '-z', -hz + 0.02, t, y - 0.2, 1.9, 2.8, shade(stone, 1.12), 0.03)
      pane(out, '-z', -hz, t, y, 1.5, 2.4, dark)
      pane(out, '-z', -hz, t, y + 1.2, 1.5, 0.14, stone, 0.08)             // the transom
      pane(out, '-z', -hz, t, y, 0.14, 2.4, stone, 0.08)                   // the mullion
    }
  }
  // the dormers rise straight out of the street wall: stone fronts, a steep gable, a pinnacle each side
  for (const t of [-hx * 0.68, hx * 0.24, hx * 0.64]) {
    const z = -hz
    block(out, t - 1.4, t + 1.4, z, z + 3, eaves - 0.3, eaves + 3.4, stone)
    pediment(out, t - 1.5, t + 1.5, z, eaves + 3.4, 3, 3, stone)
    pane(out, '-z', z, t, eaves + 0.4, 1.3, 2.5, dark)
    pane(out, '-z', z, t, eaves + 0.4, 0.14, 2.5, stone, 0.08)
    for (const s of [-1, 1]) pinnacle(out, t + s * 1.65, z + 0.2, eaves + 2.6, 4.4, 0.4, stone)
  }
  // the corbelled turrets at the two street corners
  for (const s of [-1, 1]) turret(out, s * (hx - 0.4), -hz - 0.4, 4.5, eaves + 0.5, 1.7, 5.5, stone, slate)
  // the keep at the back corner: a square tower with a tall pointed roof
  const kx = -hx + 3.2
  const kz = hz - 3.2
  block(out, kx - 3, kx + 3, kz - 3, kz + 3, 0, 18, stone)
  roof(out, kx - 3.3, kx + 3.3, kz - 3.3, kz + 3.3, 18, 8.5, 3.3, 3.3, slate)
  for (const y of [7, 12, 15]) pane(out, '-z', kz - 3, kx, y, 0.9, 1.6, dark)
}

/**
 * The Tour Saint-Jacques: the Flamboyant belfry of a church that is gone, standing alone in its square. A
 * white 10 m tower, a stepped buttress at each corner ending in a cluster of pinnacles above the balustrade,
 * tall lancets in three stages, the stair turret at one corner rising higher and Saint James on top of it.
 * The square is part of the model: a lawn round the foot and a ring of clipped trees.
 */
export function tourSaintJacques(out: MeshBuilder): void {
  const stone = hex('#ece6d8')
  const shadow = hex('#3a3a40')
  const lawn = hex('#6f9a4e')
  const gravel = hex('#cfc4ad')
  const leaf = hex('#4f7a3a')
  const h = 46
  const w = 5
  // the square: gravel paths round a lawn, the tower on a low plinth in the middle
  block(out, -24, 24, -24, 24, 0, 0.55, gravel)
  block(out, -21, 21, -21, 21, 0.55, 0.62, lawn)
  block(out, -w - 2, w + 2, -w - 2, w + 2, 0.55, 1.1, shade(stone, 0.92))
  for (const [x, z] of [[-18, -18], [18, -18], [-18, 18], [18, 18], [0, -19], [0, 19], [-19, 0], [19, 0]]) {
    prism(out, x, z, 0.6, 2.8, 0.25, 6, hex('#5a4a3a'))
    prism(out, x, z, 2.8, 6.2, 2.3, 10, leaf, FIXED, 1.4)
  }
  const y0 = 1.1
  // the shaft
  block(out, -w, w, -w, w, y0, h, stone)
  // one face's worth of Gothic, copied round: string courses, lancets in three stages, the belfry openings
  const face = new MeshBuilder()
  for (const y of [16, 29, 38]) block(face, -w - 0.25, w + 0.25, -w - 0.25, -w, y, y + 0.45, shade(stone, 1.04))
  for (const t of [-2.3, 2.3]) {
    pointedPane(face, -w, t, 4, 1.4, 9, shadow)                 // blind lancets below
    pointedPane(face, -w, t, 18, 1.3, 8.5, shadow)
  }
  pointedPane(face, -w, 0, 30.5, 5.6, 7, shade(stone, 0.9))    // the belfry's great opening, in its frame
  for (const t of [-1.4, 1.4]) pointedPane(face, -w - 0.03, t, 30.8, 2.3, 6.4, shadow)
  // the balustrade: a pierced parapet as a rail of small dark openings
  block(face, -w - 0.4, w + 0.4, -w - 0.4, -w + 0.3, h, h + 1.3, stone)
  for (let t = -w + 0.8; t < w - 0.5; t += 1.1) pane(face, '-z', -w - 0.4, t, h + 0.25, 0.55, 0.8, shadow, 0.03)
  fourSides(out, face)
  // the corner buttresses: set diagonally, stepping in three times, each ending in a cluster of pinnacles
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const stages: [number, number, number][] = [[y0, 16, 1.5], [16, 29, 1.25], [29, h, 1.0]]
      for (const [a, b, r] of stages) {
        const cx = sx * (w + r * 0.35)
        const cz = sz * (w + r * 0.35)
        block(out, cx - r, cx + r, cz - r, cz + r, a, b, stone)
        block(out, cx - r - 0.15, cx + r + 0.15, cz - r - 0.15, cz + r + 0.15, b - 0.4, b, shade(stone, 1.04))
      }
      const cx = sx * (w + 0.35)
      const cz = sz * (w + 0.35)
      pinnacle(out, cx, cz, h, 7.5, 1.3, stone)
      for (const [dx, dz] of [[-0.9, 0], [0.9, 0], [0, -0.9], [0, 0.9]]) pinnacle(out, cx + dx, cz + dz, h + 0.8, 4.2, 0.6, stone)
    }
  }
  // the stair turret at one corner, climbing past the parapet, and Saint James standing on it
  const tx = w - 1.2
  const tz = -w + 1.2
  prism(out, tx, tz, h - 6, h + 3.4, 1.9, 8, stone)
  prism(out, tx, tz, h + 3.4, h + 3.9, 2.2, 8, shade(stone, 1.04))
  prism(out, tx, tz, h + 3.9, h + 4.6, 0.9, 8, stone, FIXED, 0.7)      // the pedestal
  prism(out, tx, tz, h + 4.6, h + 7.3, 0.45, 8, stone, FIXED, 0.3)     // the saint
  prism(out, tx, tz, h + 7.3, h + 7.9, 0.28, 8, stone)                 // his head
  prism(out, tx + 0.5, tz, h + 4.6, h + 7.8, 0.06, 4, shade(stone, 0.8)) // his pilgrim's staff
}

/**
 * The Hôtel de Ville: a long neo-Renaissance palace in cream limestone under very steep, separate slate
 * roofs — a hipped roof over each range and a tall truncated pyramid over each pavilion (the four corners, the
 * middle of the front and of the back) — with the campanile, clock and lantern over the centre of the main
 * (west) front. Bays every 4.5 m between pilasters, the first floor tallest, a balustrade on the cornice.
 */
export function hotelDeVille(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e4d8bf')
  const trim = shade(stone, 1.06)
  const slate = hex('#4e555d')
  const glass = hex('#2c3036')
  const gold = hex('#c9a646')
  const hx = fit.hx
  const hz = fit.hz
  const cornice = 22
  const range = 14                      // depth of each range round the courtyards
  // the body: ranges round four courtyards — the outer four, and a cross of two through the middle —
  // each under a hipped slate roof with its ridge along the range
  const ranges: [number, number, number, number][] = [
    [-hx, hx, -hz, -hz + range], [-hx, hx, hz - range, hz], [-hx, -hx + range, -hz, hz], [hx - range, hx, -hz, hz],
    [-hx + range, hx - range, -range / 2, range / 2], [-range / 2, range / 2, -hz + range, hz - range],
  ]
  block(out, -hx, hx, -hz, hz, 0, 0.6, hex('#b9b2a4'))                 // the courtyards' paving
  for (const [x0, x1, z0, z1] of ranges) {
    block(out, x0, x1, z0, z1, 0, cornice, stone)
    block(out, x0 - 0.4, x1 + 0.4, z0 - 0.4, z1 + 0.4, cornice - 0.8, cornice, trim)
    roof(out, x0, x1, z0, z1, cornice, 8, range / 2, range / 2, slate)
  }
  // the courtyard walls: plain rows of windows, seen only from above
  for (const [x0, x1] of [[-hx + range, -range / 2], [range / 2, hx - range]]) {
    for (const [z0, z1] of [[-hz + range, -range / 2], [range / 2, hz - range]]) {
      for (const y of [2, 7.5, 13.5]) {
        windows(out, '+z', z0, x0 + 1, x1 - 1, y, 1.3, 3, 4.5, glass)
        windows(out, '-z', z1, x0 + 1, x1 - 1, y, 1.3, 3, 4.5, glass)
        windows(out, '+x', x0, z0 + 1, z1 - 1, y, 1.3, 3, 4.5, glass)
        windows(out, '-x', x1, z0 + 1, z1 - 1, y, 1.3, 3, 4.5, glass)
      }
    }
  }

  /** A run of bays on one face: windows in four storeys and a pilaster between each pair. */
  const bays = (face: '-z' | '+z' | '-x' | '+x', plane: number, t0: number, t1: number, top: number): void => {
    const n = Math.max(1, Math.round((t1 - t0) / 4.5))
    const step = (t1 - t0) / n
    const out1 = face === '-z' || face === '-x' ? -1 : 1
    for (let i = 0; i < n; i++) {
      const t = t0 + step * (i + 0.5)
      for (const [y, hh] of [[1.6, 3.6], [7, 5], [13.4, 3.8], [18.4, 2.2]] as const) {
        if (y + hh > top - 0.5) continue
        pane(out, face, plane, t, y - 0.3, 1.9, hh + 0.5, trim, 0.03)    // the surround
        pane(out, face, plane, t, y, 1.4, hh, glass)
      }
      // the pilaster at the bay's left edge
      const a = t - step / 2
      if (face === '-z' || face === '+z') block(out, a - 0.3, a + 0.3, Math.min(plane, plane + out1 * 0.3), Math.max(plane, plane + out1 * 0.3), 0, top - 1, trim)
      else block(out, Math.min(plane, plane + out1 * 0.3), Math.max(plane, plane + out1 * 0.3), a - 0.3, a + 0.3, 0, top - 1, trim)
    }
    // the string course over the ground floor and the cornice with its balustrade
    for (const [y0, y1, d] of [[5.8, 6.3, 0.35], [top - 1, top, 0.6], [top, top + 1.1, 0.15]] as const) {
      if (face === '-z' || face === '+z') block(out, t0, t1, Math.min(plane, plane + out1 * d), Math.max(plane, plane + out1 * d), y0, y1, trim)
      else block(out, Math.min(plane, plane + out1 * d), Math.max(plane, plane + out1 * d), t0, t1, y0, y1, trim)
    }
  }
  bays('-z', -hz, -hx, hx, cornice)
  bays('+z', hz, -hx, hx, cornice)
  bays('-x', -hx, -hz, hz, cornice)
  bays('+x', hx, -hz, hz, cornice)

  // the pavilions: standing 2 m forward and 3 m up, each under its own tall truncated pyramid with a gilt crest
  const pav = (x0: number, x1: number, z0: number, z1: number, top: number, roofTop: number): void => {
    block(out, x0, x1, z0, z1, 0, top, stone)
    bays('-z', z0, x0, x1, top)
    bays('+z', z1, x0, x1, top)
    bays('-x', x0, z0, z1, top)
    bays('+x', x1, z0, z1, top)
    const inset = Math.min(x1 - x0, z1 - z0) * 0.32
    roof(out, x0 - 0.4, x1 + 0.4, z0 - 0.4, z1 + 0.4, top + 1.1, roofTop - top - 1.1, inset, inset, slate)
    // the crest: a gilt railing round the flat top, not a slab
    const [a0, a1, b0, b1] = [x0 + inset, x1 - inset, z0 + inset, z1 - inset]
    block(out, a0, a1, b0 - 0.08, b0 + 0.08, roofTop, roofTop + 0.7, gold)
    block(out, a0, a1, b1 - 0.08, b1 + 0.08, roofTop, roofTop + 0.7, gold)
    block(out, a0 - 0.08, a0 + 0.08, b0, b1, roofTop, roofTop + 0.7, gold)
    block(out, a1 - 0.08, a1 + 0.08, b0, b1, roofTop, roofTop + 0.7, gold)
    // a tall chimney stack at each end of the crest
    for (const s of [-1, 1]) block(out, (x0 + x1) / 2 + s * ((x1 - x0) / 2 - inset) - 0.6, (x0 + x1) / 2 + s * ((x1 - x0) / 2 - inset) + 0.6,
      (z0 + z1) / 2 - 1.5, (z0 + z1) / 2 + 1.5, roofTop - 3, roofTop + 2.5, stone)
  }
  const p = 20
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x0 = sx < 0 ? -hx - 2 : hx - p
    const z0 = sz < 0 ? -hz - 2 : hz - p
    pav(x0, x0 + p + 2, z0, z0 + p + 2, 25, 36)
  }
  pav(-13, 13, hz - 16, hz + 2, 25, 35)                       // the back's centre pavilion
  pav(-14, 14, -hz - 2.5, -hz + 18, 26, 37)                   // the front's, carrying the campanile

  // the campanile: a square clock stage out of the roof, the lantern on columns, a dome, a spire
  const cz = -hz + 6
  block(out, -4.2, 4.2, cz - 4.2, cz + 4.2, 30, 42, stone)
  block(out, -4.6, 4.6, cz - 4.6, cz + 4.6, 41.4, 42.2, trim)
  disc(out, 0, 38, cz - 4.25, 1.9, hex('#f4f0e6'), FIXED, 16)
  box(out, 0, 38.6, cz - 4.3, 0.08, 1.2, 0.02, hex('#222222'), FIXED)                 // the hands at noon
  box(out, 0.5, 38, cz - 4.3, 0.9, 0.08, 0.02, hex('#222222'), FIXED)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    column(out, Math.sin(a) * 2.8, cz + Math.cos(a) * 2.8, 42.2, 47, 0.28, stone)
  }
  prism(out, 0, cz, 42.2, 47, 2.1, 8, glass)
  prism(out, 0, cz, 47, 47.6, 3.4, 8, trim)
  dome(out, 0, cz, 47.6, 3, 3.2, slate, 12)
  prism(out, 0, cz, 50.6, 55, 0.5, 8, slate, FIXED, 0.05)
  prism(out, 0, cz, 55, 55.6, 0.25, 6, gold)
  // the dormers along the ranges, between the pavilions, front and back
  for (const sz of [-1, 1]) {
    for (let x = -hx + p + 6; x < hx - p - 4; x += 9) {
      if (Math.abs(x) < 18) continue
      const z = sz < 0 ? -hz + 1.8 : hz - 4.3
      block(out, x - 1.2, x + 1.2, z, z + 2.5, cornice, cornice + 3.5, stone)
      pediment(out, x - 1.4, x + 1.4, sz < 0 ? z : z + 2.5, cornice + 3.5, 1.3, sz < 0 ? 2.5 : -2.5, trim)
      pane(out, sz < 0 ? '-z' : '+z', sz < 0 ? z : z + 2.5, x, cornice + 0.6, 1.1, 2.3, glass)
    }
  }
}

/**
 * The Opéra Bastille's great arch: the square frame standing proud of the front over the entrance stairs,
 * the one piece of the building everyone recognises. Dark charcoal, ~20 m square, 2 m deep, with dark glazing
 * in a grid inside it and the broad flight of steps below. The rest of the Opéra is its own OSM
 * massing, restyled (landmark manifest "opera").
 */
export function operaArch(out: MeshBuilder): void {
  const stone = hex('#3d4044')          // charcoal: the one dark thing on a pale building
  const glass = hex('#23282d')
  const steps = hex('#c9c9c4')
  const w = 10
  const h = 19
  const t = 2.2
  // the steps: a broad flight up to the doors
  for (let k = 0; k < 8; k++) block(out, -w - 6 + k * 0.5, w + 6 - k * 0.5, -6 + k * 0.45, 4, 0, 0.18 * (k + 1), steps)
  // the posts and lintel of the frame, and a thinner inner frame
  block(out, -w, -w + t, -1, 1, 0, h, stone)
  block(out, w - t, w, -1, 1, 0, h, stone)
  block(out, -w, w, -1, 1, h - t, h, stone)
  block(out, -w + t, w - t, -0.6, 0.6, h - t - 0.8, h - t, shade(stone, 1.05))
  // the glazing inside it, set back, in the facade's square grid
  block(out, -w + t, w - t, 1.2, 1.6, 1.44, h - t, glass)
  for (let x = -w + t; x <= w - t + 0.01; x += (2 * w - 2 * t) / 6) block(out, x - 0.15, x + 0.15, 1, 1.3, 1.44, h - t, stone)
  for (let y = 1.44; y <= h - t + 0.01; y += (h - t - 1.44) / 7) block(out, -w + t, w - t, 1, 1.3, y - 0.15, y + 0.15, stone)
}

/**
 * The synagogue of the rue Pavée (Agoudas Hakehilos), Hector Guimard, 1913 — the métro-entrance architect's
 * only religious building. A tall, narrow front of pale limestone, gently CONCAVE like an opened book, with
 * two ribs running the full height either side of a central bay of tall windows, rounded doorways below and
 * a soft curved crown above. What is recognised is the curve and the verticality, so that is what is drawn:
 * the front in narrow strips set back along a curve, the ribs standing proud, the crown rising in the middle.
 */
export function synagogueGuimard(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e9e1cf')
  const dark = hex('#2b2a28')
  const hx = Math.min(fit.hx, 7)
  const hz = Math.max(4, fit.hz)
  const H = 21
  const sag = 1.3                                   // how far the middle of the front is set back
  const zf = (x: number): number => -hz + sag * (1 - (x / hx) ** 2)
  // the house behind, and the curved front in strips
  block(out, -hx, hx, -hz + sag, hz, 0, H, stone)
  roof(out, -hx, hx, -hz + sag, hz, H, 2.5, 1.5, 1.5, hex('#5b6066'))
  // the curved front as one smooth surface, and the two little returns that close its ends
  const N = 16
  for (let i = 0; i < N; i++) {
    const x0 = -hx + (2 * hx * i) / N
    const x1 = x0 + (2 * hx) / N
    const z0 = zf(x0)
    const z1 = zf(x1)
    const tx = x1 - x0
    const tz = z1 - z0
    const l = Math.hypot(tx, tz)
    out.quad([[x1, 0, z1], [x0, 0, z0], [x0, H, z0], [x1, H, z1]], [tz / l, 0, -tx / l],
      [[0, 0], [1, 0], [1, 1], [0, 1]], stone, FIXED)
  }
  // and a flat cornice band following it at the top
  for (let i = 0; i < N; i++) {
    const x0 = -hx + (2 * hx * i) / N
    const x1 = x0 + (2 * hx) / N
    block(out, x0, x1, zf((x0 + x1) / 2) - 0.25, zf((x0 + x1) / 2) + 0.3, H - 0.5, H, shade(stone, 1.05))
  }
  // the ribs, full height and proud of the curve, ending in rounded caps above the crown line
  for (const s of [-1, 1]) {
    const x = s * hx * 0.42
    block(out, x - 0.7, x + 0.7, zf(x) - 0.9, zf(x) + 0.2, 0, H + 1.2, shade(stone, 1.06))
    prism(out, x, zf(x) - 0.35, H + 1.2, H + 2.4, 0.75, 12, shade(stone, 1.06), FIXED, 0.2)
  }
  // the crown: a soft arch over the central bay, and the tablet under its peak
  for (let i = -6; i <= 6; i++) {
    const x = (i / 6) * hx * 0.4
    const top = H + 2.4 * Math.sqrt(Math.max(0, 1 - (i / 6.5) ** 2))
    block(out, x - hx * 0.034, x + hx * 0.034, zf(x) - 0.05, zf(x) + 0.6, H, top, stone)
  }
  // the central bay: tall windows up four floors, the top one tallest, rounded
  for (let f = 1; f <= 4; f++) {
    const y = 4.6 + (f - 1) * 3.9
    const hgt = f === 4 ? 3.6 : 2.7
    pane(out, '-z', zf(0) - 0.02, 0, y, 2.2, hgt, dark)
    pane(out, '-z', zf(0) - 0.04, 0, y, 0.12, hgt, stone, 0.03)
    // the side bays: narrow slots, following the curve
    for (const s of [-1, 1]) {
      const x = s * hx * 0.72
      pane(out, '-z', zf(x) - 0.02, x, y + 0.3, 0.9, 2.2, dark)
    }
  }
  archedPane(out, zf(0) - 0.02, 0, 1.6, 2.4, 2.4, dark)
  // the ground floor: three rounded doorways
  for (const x of [-hx * 0.62, 0, hx * 0.62]) archedPane(out, zf(x) - 0.03, x, 0, 1.5, 3.1, dark)
  // a Star of David in the tablet under the crown: two small triangles
  const yc = H + 1.1
  const zc = zf(0) - 0.08
  const r = 0.55
  const tri = (up: number): [number, number, number][] => [0, 1, 2].map((k) => {
    const a = up * Math.PI / 2 + (k * 2 * Math.PI) / 3
    return [Math.cos(a) * r, yc + Math.sin(a) * r, zc] as [number, number, number]
  })
  const t1 = tri(1)
  const t2 = tri(-1)
  out.quad([t1[0], t1[1], t1[2], t1[2]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], hex('#3a4f78'), FIXED)
  out.quad([t2[0], t2[1], t2[2], t2[2]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], hex('#3a4f78'), FIXED)
}

/**
 * The synagogue of the rue des Tournelles (Marcellin Varcollier, 1876; iron frame from Eiffel's workshops).
 * A symmetrical Romano-Byzantine front of pale stone: a tall central bay under a gable, a great rose window
 * in a round arch over the triple doorway, lower side bays with arched windows, the Tablets of the Law on
 * the gable's peak, and the long hall behind under a pitched roof.
 */
export function synagogueTournelles(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#ddd3bf')
  const trim = shade(stone, 1.06)
  const dark = hex('#2c2b2a')
  const slate = hex('#56606a')
  const hx = Math.min(fit.hx, 12)
  const hz = Math.max(8, fit.hz)
  const cw = hx * 0.42                     // half-width of the central bay
  // the hall behind, and its pitched roof
  block(out, -hx * 0.9, hx * 0.9, -hz + 2, hz, 0, 17, stone)
  roof(out, -hx * 0.9, hx * 0.9, -hz + 2, hz, 17, 6, hx * 0.9, 0, slate)
  // the side bays of the front
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -hx : cw
    const x1 = s < 0 ? -cw : hx
    block(out, x0, x1, -hz, -hz + 2.5, 0, 14, stone)
    block(out, x0 - 0.2, x1 + 0.2, -hz - 0.25, -hz + 2.6, 13.4, 14.2, trim)
    const xm = (x0 + x1) / 2
    archedPane(out, -hz, xm, 1.5, 1.8, 4.2, dark)
    archedPane(out, -hz, xm, 8, 1.6, 3.8, dark)
  }
  // the central bay: taller, under a gable, with the rose window in its round arch
  block(out, -cw, cw, -hz - 0.6, -hz + 2.5, 0, 21, stone)
  pediment(out, -cw - 0.4, cw + 0.4, -hz - 0.6, 21, 4.2, 3, trim)
  block(out, -cw - 0.4, cw + 0.4, -hz - 0.9, -hz + 2.5, 20.4, 21.2, trim)
  // pilasters either side of the central bay
  for (const s of [-1, 1]) block(out, s * cw - 0.5, s * cw + 0.5, -hz - 1, -hz - 0.5, 0, 21, trim)
  // the great arch and the rose inside it: a disc of glass in a ring of stone, with its tracery spokes
  archedPane(out, -hz - 0.6, 0, 9.5, cw * 1.5, 10, shade(stone, 0.92))
  disc(out, 0, 14.6, -hz - 0.68, cw * 0.62, dark, FIXED, 24)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    beam(out, [0, 14.6, -hz - 0.72], [Math.cos(a) * cw * 0.6, 14.6 + Math.sin(a) * cw * 0.6, -hz - 0.72], 0.08, trim)
  }
  // the triple doorway under it
  for (const x of [-cw * 0.55, 0, cw * 0.55]) archedPane(out, -hz - 0.62, x, 0, x === 0 ? 2.2 : 1.6, x === 0 ? 5.2 : 4.4, dark)
  // the Tablets of the Law on the gable's peak: two round-topped slabs
  for (const s of [-1, 1]) {
    block(out, s * 0.55 - 0.45, s * 0.55 + 0.45, -hz - 0.3, -hz + 0.1, 25.2, 26.6, trim)
    prism(out, s * 0.55, -hz - 0.1, 26.6, 27, 0.45, 10, trim, FIXED, 0.3)
  }
}

/**
 * The Square Louis-XIII, the garden in the middle of the Place des Vosges: a 113 m square inside a black
 * iron railing with gilded tips; gravel paths round it and crossing it; four lawns edged with clipped box;
 * a tiered fountain in the middle of each lawn; and at the centre the white marble Louis XIII on horseback.
 * The lime trees are OSM's own mapped trees, drawn by the city. Symbolic throughout — plants as clipped
 * shapes, never modelled leaves. Model ground level is y = 0.5 (the loader sinks every base half a metre).
 */
export function vosgesGarden(out: MeshBuilder): void {
  const g = 0.5
  const half = 55
  const iron = hex('#1d1f21')
  const gilt = hex('#c9a646')
  const gravel = hex('#bdb095')
  const box_ = hex('#3f6433')
  const stoneC = hex('#e3ddd0')
  const marble = hex('#eeeae2')
  const water = hex('#6f8a96')
  // the railing: posts every 2.5 m with gilded tips, a top and bottom rail, a gate in the middle of each side
  const side = new MeshBuilder()
  for (let x = -half; x <= half + 0.01; x += 2.5) {
    if (Math.abs(x) < 3) continue
    block(side, x - 0.04, x + 0.04, -half - 0.04, -half + 0.04, g, g + 2.1, iron)
    prism(side, x, -half, g + 2.1, g + 2.35, 0.07, 4, gilt, FIXED, 0.01)
  }
  for (const y of [g + 0.25, g + 1.9]) {
    block(side, -half, -3, -half - 0.03, -half + 0.03, y, y + 0.06, iron)
    block(side, 3, half, -half - 0.03, -half + 0.03, y, y + 0.06, iron)
  }
  for (const s of [-1, 1]) block(side, s * 3 - 0.18, s * 3 + 0.18, -half - 0.18, -half + 0.18, g, g + 2.8, stoneC)
  fourSides(out, side)
  // the gravel: a path round inside the railing and the cross through the middle
  block(out, -half, half, -half, -half + 5, g, g + 0.06, gravel)
  block(out, -half, half, half - 5, half, g, g + 0.06, gravel)
  block(out, -half, -half + 5, -half + 5, half - 5, g, g + 0.06, gravel)
  block(out, half - 5, half, -half + 5, half - 5, g, g + 0.06, gravel)
  block(out, -3, 3, -half + 5, half - 5, g, g + 0.06, gravel)
  block(out, -half + 5, half - 5, -3, 3, g, g + 0.06, gravel)
  block(out, -12, 12, -12, 12, g, g + 0.06, gravel)
  // four lawns, each edged with clipped box and holding a fountain
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x0 = sx < 0 ? -half + 5 : 3
      const x1 = sx < 0 ? -3 : half - 5
      const z0 = sz < 0 ? -half + 5 : 3
      const z1 = sz < 0 ? -3 : half - 5
      block(out, x0, x1, z0, z1, g, g + 0.08, hex('#4f7539'))
      for (const [a0, a1, b0, b1] of [[x0, x1, z0, z0 + 0.6], [x0, x1, z1 - 0.6, z1], [x0, x0 + 0.6, z0, z1], [x1 - 0.6, x1, z0, z1]]) {
        block(out, a0, a1, b0, b1, g, g + 0.55, box_)
      }
      // the fountain: a round stone basin with water in it, a pedestal, two bowls and the jet
      const fx = (x0 + x1) / 2
      const fz = (z0 + z1) / 2
      prism(out, fx, fz, g, g + 0.6, 3.4, 20, stoneC)
      prism(out, fx, fz, g + 0.5, g + 0.62, 3.1, 20, water)
      prism(out, fx, fz, g + 0.6, g + 1.8, 0.35, 10, stoneC, FIXED, 0.25)
      prism(out, fx, fz, g + 1.8, g + 2.1, 0.3, 14, stoneC, FIXED, 1.4)
      prism(out, fx, fz, g + 2.1, g + 2.9, 0.2, 10, stoneC, FIXED, 0.15)
      prism(out, fx, fz, g + 2.9, g + 3.1, 0.15, 12, stoneC, FIXED, 0.8)
      prism(out, fx, fz, g + 3.1, g + 4.2, 0.08, 6, hex('#dfe8ec'), FIXED, 0.02)
    }
  }
  // Louis XIII: a white marble horse and rider on a tall plinth in the middle, behind a little railing
  block(out, -3.4, 3.4, -2, 2, g, g + 0.5, stoneC)
  block(out, -2.6, 2.6, -1.3, 1.3, g + 0.5, g + 4.2, marble)
  block(out, -2.8, 2.8, -1.5, 1.5, g + 4.2, g + 4.5, marble)
  const y = g + 4.5
  block(out, -1.4, 1.2, -0.45, 0.45, y + 1.3, y + 2.3, marble)                 // the horse's body
  for (const [lx, lz] of [[-1.15, -0.3], [-1.15, 0.3], [0.95, -0.3], [0.95, 0.3]]) block(out, lx - 0.12, lx + 0.12, lz - 0.12, lz + 0.12, y, y + 1.4, marble)
  beam(out, [1.1, y + 2.1, 0], [1.7, y + 3.0, 0], 0.22, marble, 0.28)           // the neck
  beam(out, [1.6, y + 3.0, 0], [2.1, y + 2.7, 0], 0.18, marble, 0.22)           // the head
  beam(out, [-1.4, y + 2.1, 0], [-1.9, y + 1.1, 0], 0.08, marble)               // the tail
  prism(out, -0.1, 0, y + 2.3, y + 3.3, 0.32, 8, marble, FIXED, 0.26)            // the king
  prism(out, -0.1, 0, y + 3.3, y + 3.75, 0.2, 8, marble)                          // his head
  box(out, -0.1, y + 3.8, 0, 0.32, 0.06, 0.32, marble, FIXED)                     // the hat's brim
  beam(out, [0, y + 3.0, 0], [0.8, y + 3.4, 0.3], 0.07, marble)                   // the arm, holding the reins
}

/**
 * The Temple du Marais (Temple Sainte-Marie, François Mansart, 1632): a round church — a drum under a tall
 * slate dome and lantern — entered through a pedimented porch on the Rue Saint-Antoine. The dome is what is
 * seen down the street.
 */
export function templeMarais(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#dcd2bd')
  const trim = shade(stone, 1.06)
  const slate = hex('#4c535b')
  const dark = hex('#2c2b29')
  const r = Math.min(fit.hx, fit.hz) * 0.78
  const cz = Math.min(fit.hz * 0.25, fit.hz - r)
  // the drum, with pilasters and a cornice, and round-headed windows high up
  prism(out, 0, cz, 0, 15, r, 24, stone)
  prism(out, 0, cz, 14.4, 15.4, r + 0.5, 24, trim)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    box(out, Math.sin(a) * r, 7, cz + Math.cos(a) * r, 0.45, 7, 0.45, trim, FIXED)
  }
  // the dome: a tall, slightly pointed profile, ribbed, and the lantern on top
  prism(out, 0, cz, 15.4, 17.5, r * 0.94, 24, stone)
  dome(out, 0, cz, 17.5, r * 0.9, r * 0.95, slate, 24, shade(slate, 1.2))
  const top = 17.5 + r * 0.95
  prism(out, 0, cz, top - 0.3, top + 3.2, 1.6, 12, stone)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    column(out, Math.sin(a) * 1.8, cz + Math.cos(a) * 1.8, top, top + 3, 0.18, trim)
  }
  prism(out, 0, cz, top + 3.2, top + 5, 1.9, 12, slate, FIXED, 0.3)
  prism(out, 0, cz, top + 5, top + 6.5, 0.12, 6, hex('#c9a646'), FIXED, 0.05)
  // the porch on the street: a block with a pediment, paired columns and the arched door
  const zf = -fit.hz
  block(out, -5.5, 5.5, zf, cz - r * 0.6, 0, 13, stone)
  roof(out, -5.8, 5.8, zf, cz - r * 0.6, 13, 2.5, 5.8, 0, slate)
  pediment(out, -6, 6, zf - 0.3, 12.2, 3, 1.5, trim)
  block(out, -6, 6, zf - 0.5, zf, 11.4, 12.2, trim)
  for (const x of [-4.4, -3.4, 3.4, 4.4]) column(out, x, zf - 0.6, 0.4, 11.4, 0.36, trim)
  archedPane(out, zf - 0.02, 0, 0.4, 3, 6.2, dark)
  block(out, -6.5, 6.5, zf - 2.5, zf, 0, 0.4, shade(stone, 0.95))
}

/**
 * Saint-Gervais-Saint-Protais, behind the Hôtel de Ville: a tall Flamboyant Gothic church with, in front of
 * it, the first classical facade in Paris (Salomon de Brosse, 1616) — three orders of columns stacked one on
 * another, Doric, Ionic, Corinthian, narrowing to a pediment at the top — and the Gothic bell tower beside.
 */
export function saintGervais(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#c9bfa8')
  const trim = shade(stone, 1.06)
  const slate = hex('#4f565e')
  const dark = hex('#2d2c2a')
  const zf = -fit.hz
  const back = fit.hz - 4
  // the nave, high and narrow, under a steep roof; the aisles either side; a polygonal apse at the east end
  block(out, -7, 7, zf + 5, back - 8, 0, 25, stone)
  roof(out, -7.3, 7.3, zf + 5, back - 8, 25, 10, 7.3, 0, slate)
  for (const sx of [-1, 1]) {
    block(out, sx < 0 ? -14 : 7, sx < 0 ? -7 : 14, zf + 7, back - 10, 0, 13, stone)
    roof(out, sx < 0 ? -14.3 : 7, sx < 0 ? -7 : 14.3, zf + 7, back - 10, 13, 3, sx < 0 ? 0 : 7.3, 0, slate)
    // flying buttresses: a slab leaning from the aisle wall to the nave
    for (let z = zf + 11; z < back - 10; z += 7) block(out, sx < 0 ? -14.4 : 13.4, sx < 0 ? -13.4 : 14.4, z - 0.5, z + 0.5, 0, 17, stone)
  }
  prism(out, 0, back - 8, 0, 25, 7, 8, stone)
  prism(out, 0, back - 8, 25, 31, 7.2, 8, slate, FIXED, 0.5)
  // the tall Gothic windows of the nave clerestory, down both sides: drawn on a −z face, turned onto ±x
  // (rotated() by +90° sends a −z face at 7 m to the −x side with t → −z; by −90° to +x with t → z)
  for (const sx of [-1, 1]) {
    const side = new MeshBuilder()
    for (let z = zf + 10; z < back - 10; z += 7) pointedPane(side, -7.06, sx < 0 ? -z : z, 15, 2.6, 8, dark)
    rotated(out, side, sx < 0 ? Math.PI / 2 : -Math.PI / 2)
  }
  // the bell tower on the south side, square, with a balustrade and a small pyramid
  block(out, 8, 16, zf + 12, zf + 20, 0, 38, stone)
  block(out, 7.6, 16.4, zf + 11.6, zf + 20.4, 37, 38.2, trim)
  roof(out, 8, 16, zf + 12, zf + 20, 38.2, 5, 4, 4, slate)
  pointedPane(out, zf + 12, 12, 26, 2, 7, dark)
  // the classical front: three orders stacked, each narrower, and the pediment
  const orders: [number, number, number, number, number][] = [
    // [half width, y0, y1, column radius, columns per side]
    [11, 0, 13, 0.55, 2],
    [8, 13.8, 22.5, 0.45, 2],
    [5.5, 23.3, 30.5, 0.38, 1],
  ]
  for (const [w, y0, y1, cr, per] of orders) {
    block(out, -w, w, zf - 0.6, zf + 5, y0, y1, stone)
    block(out, -w - 0.4, w + 0.4, zf - 1.3, zf + 5, y1, y1 + 0.8, trim)          // the entablature
    for (const sx of [-1, 1]) {
      for (let k = 0; k < per; k++) {
        const x = sx * (w - 0.9 - k * 1.5)
        column(out, x, zf - 1.1, y0, y1, cr, trim)
        column(out, sx * (w * 0.42 + k * 1.3), zf - 1.1, y0, y1, cr, trim)
      }
    }
  }
  pediment(out, -6, 6, zf - 1.3, 31.3, 3.5, 2, trim)
  archedPane(out, zf - 0.62, 0, 0, 3.6, 8, dark)
  archedPane(out, zf - 0.62, 0, 15, 2.6, 5.8, dark)
  archedPane(out, zf - 0.62, 0, 24.5, 2, 4.4, dark)
  block(out, -12, 12, zf - 4, zf - 0.6, 0, 0.5, shade(stone, 0.95))                  // the steps
}

/**
 * The Cirque d'Hiver (Hittorff, 1852): a twenty-sided drum of pale stone with pilasters and a painted frieze,
 * under a shallow conical roof, entered through a pedimented porch between two bronze horsemen.
 */
export function cirqueHiver(out: MeshBuilder): void {
  const stone = hex('#e3dccb')
  const trim = shade(stone, 1.06)
  const frieze = hex('#8a6b4a')
  const roofC = hex('#6b6e70')
  const bronze = hex('#4f5a4e')
  const r = 20.5
  prism(out, 0, 0, 0, 15, r, 20, stone)
  prism(out, 0, 0, 11, 13.4, r + 0.12, 20, frieze)                       // the frieze band
  prism(out, 0, 0, 15, 16, r + 0.6, 20, trim)                            // the cornice
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2
    box(out, Math.sin(a) * (r + 0.1), 5.5, Math.cos(a) * (r + 0.1), 0.5, 5.5, 0.5, trim, FIXED)
    // an arched window between each pair of pilasters, turned to face out
    const b = a + Math.PI / 20
    box(out, Math.sin(b) * (r + 0.05), 6, Math.cos(b) * (r + 0.05), 0.8, 2.2, 0.8, hex('#2c2b29'), FIXED)
  }
  prism(out, 0, 0, 16, 21.5, r + 0.4, 20, roofC, FIXED, 3)
  prism(out, 0, 0, 21.5, 23, 3, 12, trim, FIXED, 2.2)
  // the porch, to the front (−z), with its pediment, and a horseman each side
  block(out, -7, 7, -r - 3, -r + 3, 0, 13, stone)
  pediment(out, -7.4, 7.4, -r - 3.3, 13, 3, 3, trim)
  for (const x of [-5, -2, 2, 5]) column(out, x, -r - 3.4, 0.5, 12.2, 0.42, trim)
  archedPane(out, -r - 3.02, 0, 0.5, 3, 6, hex('#2c2b29'))
  for (const sx of [-1, 1]) {
    const x = sx * 11
    const z = -r - 5
    block(out, x - 1.4, x + 1.4, z - 1, z + 1, 0, 2.6, trim)
    block(out, x - 1.1, x + 1.1, z - 0.35, z + 0.35, 3.8, 4.8, bronze)                   // the horse
    for (const [lx, lz] of [[-0.9, -0.2], [-0.9, 0.2], [0.9, -0.2], [0.9, 0.2]]) block(out, x + lx - 0.1, x + lx + 0.1, z + lz - 0.1, z + lz + 0.1, 2.6, 3.9, bronze)
    beam(out, [x + 1, 4.6, z], [x + 1.5, 5.6, z], 0.18, bronze)
    prism(out, x - 0.1, z, 4.8, 6, 0.25, 8, bronze, FIXED, 0.2)                          // the rider
  }
}

/**
 * Saint-Denys-du-Saint-Sacrement (Godde, 1835), on the Rue de Turenne: a Greek temple front — four Ionic
 * columns, an entablature and a pediment over a flight of steps — before a plain basilica hall.
 */
export function saintDenysPortico(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e0d8c6')
  const trim = shade(stone, 1.06)
  const slate = hex('#555b61')
  const hx = Math.min(fit.hx, 13)
  const zf = -fit.hz
  block(out, -hx, hx, zf + 5, fit.hz, 0, 17, stone)
  roof(out, -hx - 0.3, hx + 0.3, zf + 5, fit.hz, 17, 5, hx + 0.3, 0, slate)
  // the portico: steps, four columns, entablature, pediment
  for (let k = 0; k < 4; k++) block(out, -9 + k * 0.3, 9 - k * 0.3, zf - 1 + k * 0.5, zf + 5, 0, 0.3 * (k + 1), shade(stone, 0.95))
  for (const x of [-6.3, -2.1, 2.1, 6.3]) column(out, x, zf + 1, 1.2, 12.5, 0.7, trim)
  block(out, -8, 8, zf, zf + 5, 12.5, 14.3, trim)
  pediment(out, -8.4, 8.4, zf - 0.2, 14.3, 3.8, 5.2, trim)
  archedPane(out, zf + 4.98, 0, 1.2, 3, 6.5, hex('#2c2b29'))
}

/**
 * Saint-Louis-en-l'Île's two signatures: the slender openwork iron spire (1765), an obelisk pierced right
 * through so the sky shows in it, rising from the church's roof; and the great clock on its iron bracket
 * hanging out over the Rue Saint-Louis-en-l'Île. The church itself is OSM's own massing. Model origin is on
 * the roof (the manifest lifts it); the street is to −z.
 */
export function saintLouisSpire(out: MeshBuilder): void {
  const iron = hex('#55595c')
  const stone = hex('#d8cfbc')
  const gold = hex('#c9a646')
  // a square stone base on the roof
  block(out, -1.6, 1.6, -1.6, 1.6, 0, 3, stone)
  block(out, -1.8, 1.8, -1.8, 1.8, 3, 3.4, shade(stone, 1.05))
  // the pierced obelisk: four slim tapering corner posts and rings every 3 m, the sky through the middle
  const H = 17
  const w = (y: number): number => 1.1 * (1 - y / (H + 1.5))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    beam(out, [sx * w(0), 3.4, sz * w(0)], [sx * w(H), 3.4 + H, sz * w(H)], 0.08, iron)
  }
  for (let y = 2.4; y < H; y += 2.4) {
    const r = w(y)
    for (const [a, b] of [[[-r, -r], [r, -r]], [[r, -r], [r, r]], [[r, r], [-r, r]], [[-r, r], [-r, -r]]] as const) {
      beam(out, [a[0], 3.4 + y, a[1]], [b[0], 3.4 + y, b[1]], 0.04, iron)
    }
    // the X in each panel, which is what makes it read as openwork at a distance
    beam(out, [-r, 3.4 + y - 2.4, -r], [r, 3.4 + y, -r], 0.03, iron)
    beam(out, [r, 3.4 + y - 2.4, -r], [-r, 3.4 + y, -r], 0.03, iron)
  }
  prism(out, 0, 0, 3.4 + H, 3.4 + H + 2, 0.12, 6, iron, FIXED, 0.03)
  prism(out, 0, 0, 3.4 + H + 2, 3.4 + H + 2.4, 0.18, 8, gold)
  // the clock: a big round face on an iron bracket out over the street, both faces, 14 m below the roofline — about 10 m up
  const y = -14
  const zc = -9
  beam(out, [0, y + 1.4, -1], [0, y + 1.4, zc + 0.3], 0.12, iron)
  beam(out, [0, y - 1.2, -1], [0, y + 1.1, zc + 0.6], 0.08, iron)
  prism(out, 0, zc, y - 1.1, y + 1.1, 0.05, 4, iron)
  for (const s of [-1, 1]) {
    // the face, one each way: the clock hangs out across the pavement, so it is read from up and down the street (±x)
    for (let i = 0; i < 20; i += 2) {
      const at = (k: number): [number, number, number] => [s * 0.16, y + Math.sin((k / 20) * Math.PI * 2) * 1.05, zc + Math.cos((k / 20) * Math.PI * 2) * 1.05]
      out.quad([[s * 0.16, y, zc], at(i), at(i + 1), at(i + 2)], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], hex('#f2eee4'), FIXED)
    }
    box(out, s * 0.18, y + 0.4, zc, 0.01, 0.45, 0.04, iron, FIXED)
    box(out, s * 0.18, y, zc + 0.3, 0.01, 0.04, 0.32, iron, FIXED)
  }
  // the case: a dark ring round both faces
  for (let i = 0; i < 20; i++) {
    const a0 = (i / 20) * Math.PI * 2
    const a1 = ((i + 1) / 20) * Math.PI * 2
    beam(out, [0, y + Math.sin(a0) * 1.12, zc + Math.cos(a0) * 1.12], [0, y + Math.sin(a1) * 1.12, zc + Math.cos(a1) * 1.12], 0.1, iron, 0.2)
  }
}

/**
 * A court's four facades, set on the court's walls facing in. `fit` is the court (hx across, hz deep, the
 * street end at −z); each wall gets `facade` drawn in its own frame (see kit `courtFacade`).
 */
function courtWalls(out: MeshBuilder, fit: Fit, facade: (q: MeshBuilder, len: number, which: 'far' | 'near' | 'side') => void): void {
  const { hx, hz } = fit
  /*
   * On the court's real walls when the loader passed its outline: every edge of 4 m or more gets a facade,
   * facing into the court. A court is rarely square, and a box's walls cut across the real ones.
   */
  if (fit.ring && fit.ring.length >= 3) {
    // runs of nearly collinear short segments (OSM draws a curved or ragged wall as many) made into one wall
    const src = fit.ring
    const r: { x: number; z: number }[] = []
    for (let i = 0; i < src.length; i++) {
      const p = src[(i - 1 + src.length) % src.length]
      const c = src[i]
      const n = src[(i + 1) % src.length]
      const a1 = Math.atan2(c.x - p.x, c.z - p.z)
      const a2 = Math.atan2(n.x - c.x, n.z - c.z)
      let d = Math.abs(a2 - a1)
      if (d > Math.PI) d = 2 * Math.PI - d
      if (d > 0.35) r.push(c)
    }
    for (let i = 0; i < r.length; i++) {
      const a = r[i]
      const b = r[(i + 1) % r.length]
      const len = Math.hypot(b.x - a.x, b.z - a.z)
      if (len < 4) continue
      // anticlockwise court outline: its inward normal is (−ez, ex); the facade is drawn facing −z, so it is
      // turned until −z points along that normal
      const ex = (b.x - a.x) / len
      const ez = (b.z - a.z) / len
      const nx = -ez
      const nz = ex
      const angle = Math.atan2(-nx, -nz)
      const mz = (a.z + b.z) / 2
      const which = nz < -0.7 && mz < 0 ? 'near' : nz > 0.7 && mz > 0 ? 'far' : 'side'
      const q = new MeshBuilder()
      facade(q, len, which === 'near' ? 'near' : which === 'far' ? 'far' : 'side')
      placed(out, q, angle, (a.x + b.x) / 2, (a.z + b.z) / 2)
    }
    return
  }
  const walls: [number, number, number, number, 'far' | 'near' | 'side'][] = [
    [2 * hx, 0, 0, hz, 'far'], [2 * hx, Math.PI, 0, -hz, 'near'],
    [2 * hz, -Math.PI / 2, -hx, 0, 'side'], [2 * hz, Math.PI / 2, hx, 0, 'side'],
  ]
  for (const [len, a, tx, tz, which] of walls) {
    const q = new MeshBuilder()
    facade(q, len, which)
    placed(out, q, a, tx, tz)
  }
}

/**
 * The Hôtel de Sully's court (Jean Androuet du Cerceau, 1625): the most richly carved courtyard in the Marais
 * — pale stone, pilasters, windows under alternating pediments, and on the piers the reliefs of the Seasons
 * and the Elements, with tall stone lucarnes on the cornice; the carriage passage through the street wing.
 * Drawn on the building's own courtyard (manifest `court: true`); the building is OSM's.
 */
export function sullyCourt(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#cdbfa4')
  const trim = hex('#d9ccb2')
  const dark = hex('#2e2d2b')
  // the city's own wall height for this building (its OSM 12 m) plus the half metre the model is sunk
  const eaves = fit.height + 0.5
  block(out, -fit.hx, fit.hx, -fit.hz, fit.hz, 0, 0.56, hex('#c9bfae'))            // the paved court
  courtWalls(out, fit, (q, len, which) => courtFacade(q, len, eaves, {
    stone, trim, dark, reliefs: which !== 'near', lucarnes: true, passage: which === 'near',
  }))
}

/**
 * The Hôtel de Soubise's cour d'honneur (Delamair, 1705): a vast court ringed on three sides by a colonnade
 * of paired columns under a balustraded terrace, rounded at the corners toward the gate — the horseshoe —
 * and at its head the palace front: a two-storey frontispiece of paired columns, Composite over Corinthian,
 * under a pediment, with statues on the pediment and along the balustrade. Drawn in the building's courtyard
 * (`court: true`); the gate end is −z (Rue des Francs-Bourgeois).
 */
export function soubiseCourt(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#cfc2a8')
  const trim = hex('#dacdb3')
  const dark = hex('#2e2d2b')
  const { hx, hz } = fit
  const g = 0.5
  block(out, -hx, hx, -hz, hz, 0, 0.56, hex('#d2c7b0'))                           // the gravel court
  // the palace front at the head of the court
  const q = new MeshBuilder()
  courtFacade(q, 2 * hx, 15, { stone, trim, dark, lucarnes: false })
  // the frontispiece: four pairs of columns in two orders, the pediment, statues on it
  const fw = Math.min(9, hx * 0.4)
  block(q, -fw, fw, -1.6, -0.18, g, 15, stone)
  for (const x of [-fw + 0.8, -fw + 2.0, fw - 2.0, fw - 0.8]) {
    column(q, x, -1.9, g, g + 7, 0.36, trim)
    column(q, x, -1.9, g + 7.4, g + 13.4, 0.32, trim)
  }
  block(q, -fw - 0.3, fw + 0.3, -2.4, -0.18, g + 7, g + 7.4, trim)
  block(q, -fw - 0.3, fw + 0.3, -2.4, -0.18, g + 13.4, g + 14.4, trim)
  pediment(q, -fw - 0.3, fw + 0.3, -2.4, g + 14.4, 3.2, 2.2, trim)
  archedPane(q, -1.62, 0, g, 2.6, 4.6, dark)
  archedPane(q, -1.62, 0, g + 8, 2.2, 4.2, dark)
  for (const x of [-fw, -fw * 0.5, 0, fw * 0.5, fw]) prism(q, x, -1.2, g + 14.4 + (x === 0 ? 3.2 : 1.2 - Math.abs(x) / fw), g + 16.4 + (x === 0 ? 3.2 : 1.2 - Math.abs(x) / fw), 0.3, 8, trim, 0, 0.2)
  // statues along the balustrade of the whole front
  block(q, -hx, hx, -0.8, 0, 15, 15.9, trim)
  for (let x = -hx + 3; x < hx - 2; x += 6) if (Math.abs(x) > fw + 1) prism(q, x, -0.4, 15.9, 17.7, 0.28, 8, trim, 0, 0.18)
  placed(out, q, 0, 0, hz)
  // the colonnade: paired columns 3.5 m in from the walls on both sides and across the gate end, rounded
  // at the gate-end corners, carrying an entablature and a balustraded terrace
  const inset = 3.6
  const path: { x: number; z: number }[] = []
  const r = Math.min(10, hx * 0.35)
  const xs = hx - inset
  const zs = hz - inset
  path.push({ x: -xs, z: zs })
  path.push({ x: -xs, z: -zs + r })
  for (let k = 1; k <= 6; k++) { const a = (k / 6) * (Math.PI / 2); path.push({ x: -xs + r - Math.cos(a) * r, z: -zs + r - Math.sin(a) * r }) }
  path.push({ x: xs - r, z: -zs })
  for (let k = 1; k <= 6; k++) { const a = (k / 6) * (Math.PI / 2); path.push({ x: xs - r + Math.sin(a) * r, z: -zs + r - Math.cos(a) * r }) }
  path.push({ x: xs, z: zs })
  const lengths = [0]
  for (let i = 1; i < path.length; i++) lengths.push(lengths[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z))
  const total = lengths[lengths.length - 1]
  const at = (d: number): { x: number; z: number } => {
    let i = 1
    while (i < lengths.length - 1 && lengths[i] < d) i++
    const t = (d - lengths[i - 1]) / Math.max(1e-6, lengths[i] - lengths[i - 1])
    return { x: path[i - 1].x + (path[i].x - path[i - 1].x) * t, z: path[i - 1].z + (path[i].z - path[i - 1].z) * t }
  }
  const colH = 6.2
  for (let d = 0; d <= total; d += 3.2) {
    const p = at(d)
    // leave the gate open in the middle of the gate end
    if (Math.abs(p.x) < 5 && p.z < -zs + 1) continue
    const p2 = at(Math.min(total, d + 0.8))
    column(out, p.x, p.z, g, g + colH, 0.3, trim)
    column(out, p2.x, p2.z, g, g + colH, 0.3, trim)
  }
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    // the entablature and the terrace's balustrade, straight between the path's points
    beam(out, [a.x, g + colH + 0.45, a.z], [b.x, g + colH + 0.45, b.z], 0.55, stone, 0.45)
    beam(out, [a.x, g + colH + 1.35, a.z], [b.x, g + colH + 1.35, b.z], 0.2, trim, 0.45)
  }
  // and the gate in the middle of the gate end: a rusticated arch under a pediment
  block(out, -5, 5, -zs - 1.2, -zs + 0.6, 0, 10.5, stone)
  archedPane(out, -zs - 1.22, 0, g, 4.4, 7, dark)
  pediment(out, -5.3, 5.3, -zs - 1.4, 10.5, 2.4, 2, trim)
}

/**
 * The Musée Carnavalet's court (Hôtel Carnavalet, 1548 and Mansart 1660): the street wing on the Rue de
 * Sévigné with its portal — a round arch between two reclining lions under a relief of Abundance — and
 * behind it the cour d'honneur: Coysevox's bronze Louis XIV standing in the middle, Jean Goujon's Four
 * Seasons in relief on the corps de logis at the head of the court. Standalone at the court; local −z is the
 * street end (Rue de Sévigné).
 */
export function carnavaletCourt(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#cfc2a8')
  const trim = hex('#dacdb3')
  const dark = hex('#2d2c2a')
  const bronze = hex('#3d4a40')
  const slate = hex('#6a7076')
  const { hx, hz } = fit
  const g = 0.5
  block(out, -hx, hx, -hz, hz, 0, 0.56, hex('#cfc6b3'))
  // the corps de logis at the head of the court: its own building, OSM has none here
  block(out, -hx - 2, hx + 2, hz, hz + 10, 0, 12, stone)
  roof(out, -hx - 2.3, hx + 2.3, hz - 0.3, hz + 10.3, 12, 6.5, 2.4, 5.3, slate)
  const q = new MeshBuilder()
  courtFacade(q, 2 * hx + 4, 12, { stone, trim, dark, reliefs: true, lucarnes: true })
  placed(out, q, 0, 0, hz)
  // the Four Seasons: four large pale relief panels between the first-floor windows, the Goujon figures
  for (let k = 0; k < 4; k++) {
    const x = -hx * 0.75 + k * hx * 0.5
    pane(out, '-z', hz - 0.36, x, g + 6.8, 0.9, 2.9, hex('#e6dbc6'), 0.03)
    pane(out, '-z', hz - 0.38, x, g + 7.4, 0.42, 1.8, hex('#c9bfae'), 0.03)
  }
  // Louis XIV: a bronze standing figure on a tall stone plinth, a low railing round it
  block(out, -1.4, 1.4, -1.4, 1.4, g, g + 2.8, trim)
  block(out, -1.6, 1.6, -1.6, 1.6, g + 2.8, g + 3.1, stone)
  prism(out, 0, 0, g + 3.1, g + 4.9, 0.45, 8, bronze, 0, 0.5)                      // the robe, larger than life
  prism(out, 0, 0, g + 4.9, g + 5.9, 0.42, 8, bronze, 0, 0.32)
  prism(out, 0, 0, g + 5.9, g + 6.4, 0.24, 8, bronze)                              // the head and wig
  beam(out, [0.3, g + 5.5, 0], [1.05, g + 4.8, -0.35], 0.09, bronze)              // the arm with the baton
  for (let a = 0; a < 16; a++) {
    const t = (a / 16) * Math.PI * 2
    prism(out, Math.sin(t) * 2.6, Math.cos(t) * 2.6, g, g + 0.9, 0.04, 4, dark)
  }
  // the portal on the street face of the entrance wing, 9 m beyond the court's end
  const zs = -hz - 9
  block(out, -4.5, 4.5, zs, zs + 1.2, 0, 9, stone)
  for (let y = g + 0.6; y < 6; y += 0.7) block(out, -4.6, 4.6, zs - 0.05, zs + 0.1, y, y + 0.08, shade(stone, 0.86))
  archedPane(out, zs - 0.06, 0, g, 3.4, 5.4, dark)
  pane(out, '-z', zs - 0.1, 0, 6.3, 3.2, 1.5, hex('#f4eee0'), 0.03)                // Abundance
  pane(out, '-z', zs - 0.12, 0, 6.5, 1.2, 1.0, hex('#cfc4b1'), 0.03)
  pediment(out, -4.8, 4.8, zs - 0.3, 9, 1.8, 1.5, trim)
  // the lions, reclining on their plinths either side of the arch
  for (const s of [-1, 1]) {
    const x = s * 3.2
    block(out, x - 0.7, x + 0.7, zs - 1.6, zs - 0.1, 0, 1.4, trim)
    block(out, x - 0.55, x + 0.55, zs - 1.5, zs - 0.3, 1.4, 1.95, hex('#d9cdb4'))
    block(out, x - 0.3, x + 0.3, zs - 1.75, zs - 1.2, 1.7, 2.35, hex('#d9cdb4'))
  }
}

/**
 * Saint-Merri (1500–1550), the parish church of the Pompidou's quarter: Flamboyant Gothic throughout — a tall
 * nave under a steep roof between aisles, the west front on the Rue Saint-Martin with its three pointed
 * portals under gables and pinnacles, the rose-mullioned window above, and the square bell tower at the
 * north-west corner with its little turret. Replaces its building in the outer ring.
 */
export function saintMerri(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#b9ad95')
  const trim = shade(stone, 1.05)
  const slate = hex('#4b525a')
  const dark = hex('#2d2c2a')
  const hx = Math.min(fit.hx, 16)
  const zf = -fit.hz
  const zb = fit.hz
  // the aisles and the nave, the nave's steep roof, the polygonal apse at the east
  block(out, -hx, hx, zf + 2, zb - 8, 0, 13, stone)
  roof(out, -hx - 0.2, hx + 0.2, zf + 2, zb - 8, 13, 3, hx * 0.5, 0, slate)
  block(out, -6.5, 6.5, zf, zb - 8, 0, 25, stone)
  roof(out, -6.8, 6.8, zf, zb - 8, 25, 9, 6.8, 0, slate)
  prism(out, 0, zb - 8, 0, 25, 6.5, 7, stone)
  prism(out, 0, zb - 8, 25, 31, 6.8, 7, slate, 0, 0.3)
  // flying buttresses: slabs from the aisle wall up to the nave, and pinnacles on their piers
  for (let z = zf + 7; z < zb - 10; z += 6) {
    for (const sx of [-1, 1]) {
      block(out, sx * hx - 0.5, sx * hx + 0.5, z - 0.5, z + 0.5, 0, 16, stone)
      pinnacle(out, sx * hx, z, 16, 4, 0.7, trim)
      beam(out, [sx * hx, 15, z], [sx * 6.6, 21.5, z], 0.3, stone, 0.5)
    }
  }
  // the aisles' tall windows between the buttresses, both sides
  for (const sx of [-1, 1]) {
    const side = new MeshBuilder()
    for (let z = zf + 7; z < zb - 12; z += 6) pointedPane(side, -hx - 0.02, sx < 0 ? -(z + 3) : z + 3, 3, 2.4, 7.5, dark)
    rotated(out, side, sx < 0 ? Math.PI / 2 : -Math.PI / 2)
  }
  // clerestory lancets down the nave, both sides
  for (const sx of [-1, 1]) {
    const side = new MeshBuilder()
    for (let z = zf + 7; z < zb - 12; z += 6) pointedPane(side, -6.56, sx < 0 ? -(z + 3) : z + 3, 15, 2.2, 7.5, dark)
    rotated(out, side, sx < 0 ? Math.PI / 2 : -Math.PI / 2)
  }
  // the west front: three portals under crocketed gables, the great window, the gable, pinnacles
  for (const [x, w, h] of [[-4.2, 2.4, 6.5], [0, 3.4, 8], [4.2, 2.4, 6.5]] as const) {
    pointedPane(out, zf - 0.02, x, 0.5, w + 0.8, h + 0.8, trim)
    pointedPane(out, zf - 0.04, x, 0.5, w, h, dark)
    pediment(out, x - w / 2 - 0.5, x + w / 2 + 0.5, zf - 0.3, h + 1.1, 2.8, 0.4, trim)
  }
  pointedPane(out, zf - 0.02, 0, 11, 5.4, 10, dark)
  for (let k = -2; k <= 2; k++) pane(out, '-z', zf - 0.05, k * 0.9, 11, 0.12, 7, trim, 0.04)
  pediment(out, -6.5, 6.5, zf - 0.1, 25, 8, 1, stone)
  for (const x of [-6.5, 6.5]) pinnacle(out, x, zf + 0.3, 23, 7, 0.9, trim)
  // the bell tower at the north-west corner (local −x is north) and its stair turret
  const tx = -hx + 3.5
  const tz = zf + 3.5
  block(out, tx - 3.5, tx + 3.5, tz - 3.5, tz + 3.5, 0, 34, stone)
  block(out, tx - 3.8, tx + 3.8, tz - 3.8, tz + 3.8, 33, 34.6, trim)
  for (const y of [18, 26]) pointedPane(out, tz - 3.52, tx, y, 1.6, 5.2, dark)
  prism(out, tx + 3, tz - 3, 20, 38, 1.1, 8, stone)
  prism(out, tx + 3, tz - 3, 38, 41, 1.3, 8, slate, 0, 0.1)
}

/**
 * The Maison de Nicolas Flamel (1407), 51 rue de Montmorency — among the oldest houses in Paris: a narrow
 * front of rough stone, three storeys and an attic under a steep roof, the ground floor opened in shop bays
 * between carved stone piers (the figures of the charitable founders), and the long carved inscription running
 * in a band above them. Replaces its building.
 */
export function flamelHouse(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#a3967d')
  const pier = hex('#968870')
  const dark = hex('#2c2a27')
  const wood = hex('#4a3526')
  const slate = hex('#4f555c')
  const hx = fit.hx
  const hz = fit.hz
  const eaves = 13
  block(out, -hx, hx, -hz, hz, 0, eaves, stone)
  roof(out, -hx - 0.3, hx + 0.3, -hz - 0.3, hz + 0.3, eaves, 6, hx * 0.3, hz + 0.3, slate)
  // the ground floor: five carved piers, shop fronts of dark wood and glass between
  const n = 4
  for (let i = 0; i <= n; i++) {
    const x = -hx + 0.6 + (i * (2 * hx - 1.2)) / n
    block(out, x - 0.35, x + 0.35, -hz - 0.3, -hz, 0.5, 4, pier)
    // the carved figure on each pier: a small niche with a standing shape
    pane(out, '-z', -hz - 0.3, x, 1.6, 0.4, 1.5, shade(pier, 0.8), 0.02)
    pane(out, '-z', -hz - 0.32, x, 1.8, 0.16, 1.0, shade(pier, 1.15), 0.02)
  }
  for (let i = 0; i < n; i++) {
    const x = -hx + 0.6 + ((i + 0.5) * (2 * hx - 1.2)) / n
    pane(out, '-z', -hz, x, 0.5, (2 * hx - 1.2) / n - 0.9, 3.4, wood, 0.03)
    pane(out, '-z', -hz, x, 1.3, (2 * hx - 1.2) / n - 1.4, 2.4, dark, 0.05)
  }
  // the inscription band: a dark stone course with pale lettering in a row of small marks
  block(out, -hx, hx, -hz - 0.25, -hz, 4, 4.6, shade(stone, 0.8))
  for (let x = -hx + 0.4; x < hx - 0.3; x += 0.28) pane(out, '-z', -hz - 0.26, x, 4.14, 0.12, 0.3, hex('#e9e1cf'), 0.01)
  // three storeys of small windows in rough stone surrounds
  for (const y of [5.6, 8.4, 11]) {
    for (const x of [-hx * 0.55, 0, hx * 0.55]) {
      pane(out, '-z', -hz, x, y - 0.12, 1.3, 1.9, shade(stone, 1.08), 0.02)
      pane(out, '-z', -hz, x, y, 1.0, 1.6, dark)
    }
  }
  // two dormers in the steep roof
  for (const x of [-hx * 0.4, hx * 0.4]) {
    block(out, x - 0.8, x + 0.8, -hz + 0.4, -hz + 2.2, eaves - 0.2, eaves + 2.2, stone)
    pediment(out, x - 0.9, x + 0.9, -hz + 0.4, eaves + 2.2, 1.1, 1.8, stone)
    pane(out, '-z', -hz + 0.4, x, eaves + 0.3, 0.8, 1.4, dark)
  }
}

export const PROCEDURAL: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  colonneDeJuillet, pompidou, eiffelTower, montparnasse, sacreCoeur, pantheon, notreDame, saintPaul, hotelDeSens,
  tourSaintJacques, hotelDeVille, operaArch, synagogueGuimard, synagogueTournelles,
  vosgesGarden, templeMarais, saintGervais, cirqueHiver, saintDenysPortico,
  saintLouisSpire, sullyCourt, soubiseCourt, carnavaletCourt, saintMerri, flamelHouse,
}
