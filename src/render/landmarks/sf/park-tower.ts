/**
 * PARK TOWER AT TRANSBAY (250 Howard; Goettsch Partners with Solomon Cordwell Buenz, 2018; 605 ft / 184 m, 43 floors),
 * across Howard from Salesforce Park and Meta's San Francisco home. The owner, 2026-10-02: *"park tower meta 43 is huge
 * and very architecturally unique with many interesting angles."* What makes it itself (SF YIMBY, the Chronicle):
 *
 * - vivid BLUE glass, a curtain wall "deconstructed" into THREE stacked floor plates, each a little different;
 * - fourteen SKY DECKS, three storeys tall, carved out of the corners: a stack cut into the corner of the lower floors
 *   FACING THE PARK, and a stack for the upper floors facing EAST;
 * - a sharp CANTILEVER edge running up a dozen floors over a terrace overlooking Beale Street;
 * - an ANGLED CROWN, a raked glass screen hiding the plant.
 *
 * Faces +z (`front: "street"`: Howard, and the park beyond it); +x is east, towards Beale (checked from above).
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Fit } from '../fit.ts'
import { faceBand, type Face } from '../tower.ts'

type P2 = { x: number; z: number }
const BLUE: Rgb = [0.20, 0.36, 0.56]
const MULL: Rgb = [0.70, 0.74, 0.78]
const SLAB: Rgb = [0.78, 0.79, 0.80]
const GREEN: Rgb = [0.30, 0.42, 0.24]
const RAIL: Rgb = [0.70, 0.80, 0.84]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')
const FLOOR = 4.25

const curtain: Face = { kind: 'curtain', wall: MULL, glass: BLUE, pitch: 1.5, floor: FLOOR, material: 'glass' }

/** a rectangle hx × hz about (cx, cz), less a `n`-metre corner notch at corner (sx, sz) if given — anticlockwise */
function plate(cx: number, cz: number, hx: number, hz: number, notch?: { sx: number; sz: number; n: number }): P2[] {
  const c = [{ x: cx - hx, z: cz - hz }, { x: cx + hx, z: cz - hz }, { x: cx + hx, z: cz + hz }, { x: cx - hx, z: cz + hz }]
  if (!notch) return c
  const out: P2[] = []
  for (const p of c) {
    const isCorner = Math.sign(p.x - cx) === notch.sx && Math.sign(p.z - cz) === notch.sz
    if (!isCorner) { out.push(p); continue }
    // replace the corner with its notch: two points along the edges, one inside
    const a = { x: p.x - notch.sx * notch.n, z: p.z }
    const b = { x: p.x - notch.sx * notch.n, z: p.z - notch.sz * notch.n }
    const d = { x: p.x, z: p.z - notch.sz * notch.n }
    // keep anticlockwise order: the edge arriving at this corner comes along x or z depending on the corner
    if (notch.sx * notch.sz > 0) out.push(d, b, a)
    else out.push(a, b, d)
  }
  return out
}

/** one volume: the curtain wall round `ring` from y0 to y1 and its cap */
function volume(out: MeshBuilder, ring: P2[], y0: number, y1: number): void {
  faceBand(out, ring, y0, y1, curtain)
  capPolygon(out, ring, y1, SLAB, METAL)
}

/** the sky decks in a corner notch: a slab every three floors, planted, behind glass rails */
function skyDecks(out: MeshBuilder, x: number, z: number, n: number, y0: number, y1: number): void {
  for (let y = y0; y < y1 - 1; y += 3 * FLOOR) {
    box(out, x, y + 0.2, z, n / 2, 0.2, n / 2, SLAB, METAL)
    box(out, x, y + 0.45, z, n / 2 - 0.6, 0.06, n / 2 - 0.6, GREEN, METAL)
    // planted: a bed round the deck's outer edges, the vegetation layer's shrubs in it (render/plants.ts bedPlanting)
    const bed = [{ x: x - n / 2 + 0.5, z: z - n / 2 + 0.5 }, { x: x + n / 2 - 0.5, z: z - n / 2 + 0.5 }, { x: x + n / 2 - 0.5, z: z + n / 2 - 0.5 }, { x: x - n / 2 + 0.5, z: z + n / 2 - 0.5 }]
    out.decks.push({ ring: bed, y: y + 0.52, keepOff: 0.4, trees: false })
    box(out, x, y + 0.95, z + n / 2 - 0.05, n / 2, 0.5, 0.04, RAIL, GLASS)
    box(out, x + n / 2 - 0.05, y + 0.95, z, 0.04, 0.5, n / 2, RAIL, GLASS)
    box(out, x - n / 2 + 0.05, y + 0.95, z, 0.04, 0.5, n / 2, RAIL, GLASS)
    box(out, x, y + 0.95, z - n / 2 + 0.05, n / 2, 0.5, 0.04, RAIL, GLASS)
  }
}

export function parkTowerTransbay(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 120 && fit.height < 220 ? fit.height : 184
  const hx = Math.max(16, fit.hx)
  const hz = Math.max(14, fit.hz)
  // (the notches are three storeys tall and a structural bay deep: about 12 m)
  const N = Math.min(12.5, hz * 0.6)
  // the three floor plates: low (with the park-facing notch), middle (set in a little, full), high (cantilevered east,
  // with the east-facing notch)
  const yB = H * 0.42, yC = H * 0.74, yTop = H - 9
  // the lobby: double height, clear glass, set back under the first plate
  faceBand(out, plate(0, 0, hx - 1.2, hz - 1.2), 0, 9, { kind: 'curtain', wall: MULL, glass: [0.42, 0.55, 0.62], pitch: 3, floor: 9, material: 'glass' })
  box(out, 0, 9.2, 0, hx + 0.6, 0.25, hz + 0.6, SLAB, METAL)
  // the low plate, notched at the park corner (front, west: −x, +z)
  volume(out, plate(0, 0, hx, hz, { sx: -1, sz: 1, n: N }), 9.4, yB)
  skyDecks(out, -hx + N / 2, hz - N / 2, N, 9.4 + 3 * FLOOR, yB)
  // the middle plate, a metre in all round: the break reads as a reveal line up the tower
  volume(out, plate(0.8, 0, hx - 1, hz - 1), yB, yC)
  box(out, 0.8, yB, 0, hx - 0.4, 0.3, hz - 0.4, SLAB, METAL)
  // the high plate: pushed east over Beale (the cantilever edge), notched at its east corners for the upper decks
  const shift = Math.min(5, hx * 0.18)
  volume(out, plate(shift, 0, hx, hz, { sx: 1, sz: -1, n: N }), yC, yTop)
  skyDecks(out, shift + hx - N / 2, -hz + N / 2, N, yC, yTop)
  // the cantilever's sharp edge: a mullion fin running up the east face
  box(out, shift + hx + 0.3, (yC + yTop) / 2, hz - 1, 0.3, (yTop - yC) / 2, 0.3, MULL, METAL)
  // the ANGLED CROWN: a raked glass screen, high at the west, low at the east, round the plant
  const crown = plate(shift, 0, hx, hz)
  const lo = yTop, hiW = yTop + 13, hiE = yTop + 6
  const top = (x: number): number => hiW + ((x - (shift - hx)) / (2 * hx)) * (hiE - hiW)
  for (let i = 0; i < crown.length; i++) {
    const a = crown[i], b = crown[(i + 1) % crown.length]
    const n: [number, number, number] = [b.z - a.z, 0, -(b.x - a.x)]
    const l = Math.hypot(n[0], n[2]) || 1
    out.quad([[a.x, lo, a.z], [b.x, lo, b.z], [b.x, top(b.x), b.z], [a.x, top(a.x), a.z]], [n[0] / l, 0, n[2] / l], [[0, 0], [1, 0], [1, 1], [0, 1]], BLUE, GLASS)
  }
  // its raked top, set with mullions
  out.quad([[crown[0].x, top(crown[0].x), crown[0].z], [crown[1].x, top(crown[1].x), crown[1].z], [crown[2].x, top(crown[2].x), crown[2].z], [crown[3].x, top(crown[3].x), crown[3].z]],
    [0.25, 0.97, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.32, 0.44, 0.58], GLASS)
}
