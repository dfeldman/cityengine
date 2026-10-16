/**
 * San Francisco's individually modelled buildings: market-mid (SF_PLAN.md §10; the batch list is docs/sf-batches/market-mid.md).
 * One builder per building, most of them a tower-grammar spec (render/landmarks/tower.ts) from Street View and
 * photographs; the few that need more, their own geometry here. Registered through render/landmarks/sf/index.ts;
 * placed by public/landmarks/san-francisco/market-mid.json.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { faceBand, insetRing, tower, towerRing, type TowerSpec } from '../../tower.ts'
import { box, prism, strut, type Rgb } from '../../../models.ts'
import { surfaceTag, type Surface } from '../../../cartoon-material.ts'

const spec = (s: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, s)

/** The height tower() raises a spec to: the fit's (OSM's) when it is plausible, the spec's when not. */
const specHeight = (fit: Fit, s: TowerSpec): number => fit.height > 0.6 * s.height && fit.height < 1.6 * s.height ? fit.height : s.height

/** The centre of a ring (its vertices' mean, as tower.ts takes it). */
/** A ring's bounding box: its centre and size along x and z. */
const ringBox = (ring: { x: number; z: number }[]): { cx: number; cz: number; w: number; d: number } => {
  const xs = ring.map((p) => p.x)
  const zs = ring.map((p) => p.z)
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 }
}

/** A dome of radius r and height h standing at y, in courses of 16 sides. */
function dome(out: MeshBuilder, cx: number, cz: number, y: number, r: number, h: number, c: Rgb, tag = surfaceTag('copper'), courses = 6): void {
  for (let k = 0; k < courses; k++) {
    const a0 = (k / courses) * (Math.PI / 2)
    const a1 = ((k + 1) / courses) * (Math.PI / 2)
    prism(out, cx, cz, y + h * Math.sin(a0), y + h * Math.sin(a1), r * Math.cos(a0), 16, c, tag, Math.max(0.001, r * Math.cos(a1)), false)
  }
}

/**
 * A footprint's rounded corner (a run of short edges: the Flood Building's prow, One Montgomery's portico): the
 * middle of the arc and its outward direction. With none (the city's fitted rectangle), the front corner at +x.
 */
function roundCorner(ring: { x: number; z: number }[]): { x: number; z: number; nx: number; nz: number } {
  const c = ringBox(ring)
  let best: { i: number; n: number } = { i: -1, n: 0 }
  for (let i = 0; i < ring.length; i++) {
    let n = 0
    while (n < ring.length) {
      const a = ring[(i + n) % ring.length]
      const b = ring[(i + n + 1) % ring.length]
      if (Math.hypot(b.x - a.x, b.z - a.z) > 4.5) break
      n++
    }
    if (n > best.n) best = { i, n }
  }
  let x: number
  let z: number
  if (best.n >= 3) {
    const a = ring[(best.i + Math.floor(best.n / 2)) % ring.length]
    const b = ring[(best.i + Math.ceil(best.n / 2)) % ring.length]
    x = (a.x + b.x) / 2
    z = (a.z + b.z) / 2
  } else {
    x = c.cx + c.w / 2
    z = c.cz - c.d / 2
  }
  const l = Math.hypot(x - c.cx, z - c.cz) || 1
  return { x, z, nx: (x - c.cx) / l, nz: (z - c.cz) / l }
}

/** A cornice round a ring whose top is at y: a slab `depth` out, `h` tall, with its top and soffit. */
function ledge(out: MeshBuilder, ring: { x: number; z: number }[], y: number, depth: number, h: number, c: Rgb, material: Surface = 'ashlar'): void {
  const outer = insetRing(ring, -depth)
  faceBand(out, outer, y - h, y, { kind: 'blank', wall: c, material })
  capPolygon(out, outer, y, c, surfaceTag(material))
}

/** Is (x, z) inside the ring? */
function inside(ring: { x: number; z: number }[], x: number, z: number): boolean {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) c = !c
  }
  return c
}

/**
 * Where a dome or a turret goes on a footprint: the roomiest point inside it (the centre of the largest circle it
 * holds), leaning toward the front (local −z, the street) by `lean` metres of room per metre back. Returns the
 * point and that circle's radius. Works for a rectangle (the city's fit) and a real outline alike.
 */
function crownSpot(ring: { x: number; z: number }[], lean = 0): { cx: number; cz: number; r: number } {
  const b = ringBox(ring)
  const z0 = b.cz - b.d / 2
  let best = { cx: b.cx, cz: b.cz, r: 0, score: -Infinity }
  const n = 24
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) {
      const x = b.cx - b.w / 2 + (b.w * i) / n
      const z = z0 + (b.d * j) / n
      if (!inside(ring, x, z)) continue
      const r = inRadius(ring, x, z)
      const score = r - lean * (z - z0)
      if (score > best.score) best = { cx: x, cz: z, r, score }
    }
  }
  return best
}

/** How far a point is from the nearest edge of a ring: the largest circle about it that the ring holds. */
function inRadius(ring: { x: number; z: number }[], x: number, z: number): number {
  let best = Infinity
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
    best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t))
  }
  return best
}

const TERRACOTTA: Rgb = [0.87, 0.83, 0.73]
const BRONZE: Rgb = [0.17, 0.16, 0.16]
const HEARST_WHITE: Rgb = [0.9, 0.89, 0.86]
const CHRONICLE_BRICK: Rgb = [0.63, 0.33, 0.26]
const RITZ_BEIGE: Rgb = [0.84, 0.76, 0.62]
const HUMBOLDT_GREY: Rgb = [0.74, 0.74, 0.72]
const FLOOD_GREY: Rgb = [0.52, 0.5, 0.46]
const EMPORIUM_CREAM: Rgb = [0.88, 0.86, 0.8]
const MONADNOCK_BRICK: Rgb = [0.74, 0.64, 0.5]
const CROCKER_WHITE: Rgb = [0.9, 0.89, 0.86]
const CENTRAL_WHITE: Rgb = [0.86, 0.85, 0.8]
const KEARNY_WHITE: Rgb = [0.88, 0.87, 0.84]
const MUTUAL_GREY: Rgb = [0.72, 0.72, 0.7]
const PACIFIC_GREEN: Rgb = [0.46, 0.64, 0.55]
const HUNTER_BUFF: Rgb = [0.8, 0.73, 0.58]
const PALACE_BRICK: Rgb = [0.7, 0.6, 0.48]
const PALACE_STONE: Rgb = [0.87, 0.83, 0.75]

export const MARKET_MID: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * The Phelan Building (1908), Market at O'Farrell and Grant: an eleven-storey flatiron of cream glazed terracotta
   * with a rounded prow. Dark bronze shopfronts two storeys high; a moulded band over the third floor; fine piers
   * up the shaft with the windows paired between them; an arched attic storey under a deep bracketed cornice; the
   * flag on the prow. (Commons: "Phelan Building 2017.jpg".)
   */
  phelanBuilding: spec({
    height: 42,
    base: { height: 8, face: { kind: 'curtain', wall: BRONZE, material: 'metal', glass: [0.2, 0.24, 0.27], pitch: 3, floor: 4 } },
    tiers: [
      { to: 12, face: { kind: 'punched', wall: TERRACOTTA, material: 'terracotta', pitch: 2, solid: 0.42, floor: 4 }, cornice: { depth: 0.5, height: 0.6 } },
      { to: 0.9, face: { kind: 'fins', wall: TERRACOTTA, material: 'terracotta', glass: [0.26, 0.28, 0.3], pitch: 1.9, solid: 0.45, depth: 0.18, floor: 3.6 } },
      { to: 1, face: { kind: 'punched', wall: TERRACOTTA, material: 'terracotta', pitch: 1.9, solid: 0.5, arched: true, floor: 4 }, cornice: { depth: 1.2, height: 1.3 } },
    ],
    roof: [0.5, 0.48, 0.45],
    crown: { kind: 'mast', height: 8, width: 0.15, colour: [0.8, 0.8, 0.8] },
  }),

  /**
   * One Montgomery Tower (1982, Welton Becket), 120 Kearny over the Crocker Galleria: a 38-storey slab of pink
   * granite with square windows punched evenly into it, floor after floor, no setbacks, a plain flat top. The two
   * storeys at the foot are a darker red granite with tall arched openings. (Commons: "One Montgomery Tower
   * 2021.jpg", "One Montgomery Tower - San Francisco - April 2017 (6896).jpg".)
   */
  oneMontgomeryTower: spec({
    height: 152,
    base: { height: 9, face: { kind: 'punched', wall: [0.5, 0.36, 0.33], material: 'granite', glass: [0.16, 0.18, 0.2], pitch: 6, solid: 0.35, arched: true, floor: 9 } },
    tiers: [
      { to: 1, face: { kind: 'punched', wall: [0.8, 0.64, 0.58], material: 'granite', glass: [0.34, 0.45, 0.6], pitch: 3, solid: 0.36, floor: 3.9 } },
    ],
    roof: [0.62, 0.52, 0.48],
    crown: { kind: 'parapet', height: 1.2, colour: [0.8, 0.64, 0.58] },
    penthouse: 1,
  }),

  /**
   * The Palace Hotel (1909, Trowbridge & Livingston, rebuilt after the fire), Market at New Montgomery: eight
   * storeys of buff brick on a two-storey base of cream stone with tall dark shopfronts. Windows in even pairs with
   * little iron balconies; a cream band of panelled stone two floors from the top, the top floor's windows arched
   * under keystones, and a deep cornice of cream terracotta with a cresting of shells along it. (Commons: "Facade of
   * the Palace Hotel, San Francisco.jpg", "Palace Hotel SF Market & New Montgomery corner.JPG".)
   */
  palaceHotel: spec({
    height: 37,
    base: { height: 8, face: { kind: 'punched', wall: PALACE_STONE, material: 'terracotta', glass: [0.12, 0.13, 0.14], pitch: 5.5, solid: 0.42, floor: 8 } },
    tiers: [
      { to: 9, face: { kind: 'blank', wall: PALACE_STONE , material: 'ashlar'}, cornice: { depth: 0.35, height: 0.5 } },
      { to: 26, face: { kind: 'punched', wall: PALACE_BRICK, material: 'brick', glass: [0.37, 0.36, 0.31], pitch: 2.6, solid: 0.5, floor: 3.4 } },
      { to: 29.6, face: { kind: 'punched', wall: PALACE_STONE, material: 'terracotta', glass: [0.37, 0.36, 0.31], pitch: 2.6, solid: 0.55, floor: 3.6 }, cornice: { depth: 0.3, height: 0.4 } },
      { to: 33.5, face: { kind: 'punched', wall: PALACE_BRICK, material: 'brick', glass: [0.37, 0.36, 0.31], pitch: 2.6, solid: 0.55, arched: true, floor: 3.9 } },
      { to: 1, face: { kind: 'blank', wall: PALACE_STONE , material: 'terracotta'}, cornice: { depth: 1.1, height: 1.2 } },
    ],
    roof: [0.45, 0.43, 0.41],
    crown: { kind: 'parapet', height: 0.9, colour: PALACE_STONE },
  }),

  /**
   * The Hearst Building (1909, remodelled 1937 by Julia Morgan), Market at Third: thirteen storeys of white glazed
   * terracotta. The shaft is wide white piers with the windows gathered between them in tall dark-grey bays, their
   * spandrels grey too; the third floor is a band of polychrome ornament (green and gold garlands) under a moulded
   * cornice, and the two storeys below it are big dark shop windows; a green-and-cream cresting runs round the top.
   * (Commons: "Hearst Building, San Francisco (2013) - 3.JPG", "Hearst Building.jpg".)
   */
  hearstBuilding: spec({
    height: 49,
    base: { height: 8, face: { kind: 'punched', wall: HEARST_WHITE, material: 'terracotta', glass: [0.2, 0.22, 0.25], pitch: 4.5, solid: 0.3, floor: 8 } },
    tiers: [
      { to: 12, face: { kind: 'punched', wall: [0.84, 0.82, 0.66], material: 'terracotta', glass: [0.3, 0.33, 0.37], pitch: 2.4, solid: 0.45, floor: 4 }, cornice: { depth: 0.45, height: 0.7, colour: [0.72, 0.68, 0.45] } },
      { to: 0.95, face: { kind: 'fins', wall: HEARST_WHITE, material: 'terracotta', glass: [0.33, 0.35, 0.39], pitch: 4.6, solid: 0.42, depth: 0.25, floor: 3.4 } },
      { to: 1, face: { kind: 'blank', wall: HEARST_WHITE , material: 'terracotta'}, cornice: { depth: 0.9, height: 0.9 } },
    ],
    roof: [0.5, 0.5, 0.5],
    crown: { kind: 'parapet', height: 0.8, colour: [0.55, 0.65, 0.5] },
  }),

  /**
   * The de Young (old Chronicle) Building (1890, Burnham & Root), Market at Kearny and Geary, and the Ritz-Carlton
   * Club tower raised on it in 2007. The old building is ten storeys of red brick on a two-storey base of brown
   * sandstone, its seventh floor a row of round arches, a thin green copper cornice on top. The new tower rises
   * from it in beige render, stepping in three times, each step under a dark projecting cornice. (Its 1890 clock
   * tower went in 1962; the model is the building as it stands.) (Commons: "Ritz-Carlton Club and Residences, San
   * Francisco 2021.jpg", "Market Street at Kearny Street, San Francisco (January 2015)(Unsplash).jpg".)
   */
  deYoungBuilding: spec({
    height: 66,
    base: { height: 7.5, face: { kind: 'punched', wall: [0.5, 0.36, 0.31], material: 'ashlar', glass: [0.16, 0.16, 0.17], pitch: 4, solid: 0.35, floor: 7.5 } },
    tiers: [
      { to: 22, face: { kind: 'punched', wall: CHRONICLE_BRICK, material: 'brick', glass: [0.3, 0.33, 0.35], pitch: 2.1, solid: 0.45, floor: 3.6 } },
      { to: 26.5, face: { kind: 'punched', wall: CHRONICLE_BRICK, material: 'brick', glass: [0.3, 0.33, 0.35], pitch: 3.4, solid: 0.35, arched: true, floor: 4.5 } },
      { to: 38, face: { kind: 'punched', wall: CHRONICLE_BRICK, material: 'brick', glass: [0.3, 0.33, 0.35], pitch: 2.1, solid: 0.5, floor: 3.6 }, cornice: { depth: 0.8, height: 0.9, colour: [0.33, 0.45, 0.4] } },
      { to: 49, inset: 1.5, face: { kind: 'punched', wall: RITZ_BEIGE, material: 'stucco', glass: [0.38, 0.45, 0.52], pitch: 2.4, solid: 0.4, floor: 3.2 }, cornice: { depth: 0.9, height: 0.4, colour: [0.25, 0.25, 0.27] } },
      { to: 57.5, inset: 1.5, face: { kind: 'punched', wall: RITZ_BEIGE, material: 'stucco', glass: [0.38, 0.45, 0.52], pitch: 2.4, solid: 0.4, floor: 3.2 }, cornice: { depth: 0.9, height: 0.4, colour: [0.25, 0.25, 0.27] } },
      { to: 1, inset: 1.5, face: { kind: 'punched', wall: RITZ_BEIGE, material: 'stucco', glass: [0.38, 0.45, 0.52], pitch: 2.4, solid: 0.4, floor: 3.2 }, cornice: { depth: 1.3, height: 0.5, colour: [0.25, 0.25, 0.27] } },
    ],
    roof: [0.4, 0.4, 0.42],
    penthouse: 1,
  }),

  /**
   * The Humboldt Bank Building (1908, Meyer & O'Brien), 785 Market: a narrow nineteen-storey tower of grey granite
   * and terracotta. A tall granite base of arched bank windows; a plain shaft of paired windows; a richer top of
   * cartouches under a deep cornice; then a crown two storeys high drawn in from the walls, and on it the dome: a
   * red-brown copper dome with oculus dormers, and a flagpole. The dome is the building. (Commons: "The Humboldt
   * Building, San Francisco, May 2013.jpg", "Humboldt Bank Building 785 Market Street top.jpg".)
   */
  humboldtBankBuilding: (out, fit) => {
    const s: TowerSpec = {
      height: 58,
      base: { height: 9, face: { kind: 'punched', wall: HUMBOLDT_GREY, material: 'granite', glass: [0.18, 0.2, 0.22], pitch: 4.2, solid: 0.3, arched: true, floor: 9 } },
      tiers: [
        { to: 10, face: { kind: 'blank', wall: HUMBOLDT_GREY , material: 'granite'}, cornice: { depth: 0.4, height: 0.6 } },
        { to: 0.86, face: { kind: 'punched', wall: HUMBOLDT_GREY, material: 'ashlar', glass: [0.28, 0.3, 0.33], pitch: 2.2, solid: 0.45, floor: 3.2 } },
        { to: 1, face: { kind: 'punched', wall: [0.82, 0.82, 0.8], material: 'ashlar', glass: [0.28, 0.3, 0.33], pitch: 3.2, solid: 0.5, floor: 3.9 }, cornice: { depth: 1.1, height: 1 } },
      ],
      roof: [0.55, 0.55, 0.55],
      crown: {
        kind: 'lantern', height: 7, inset: 2.2, face: { kind: 'punched', wall: [0.84, 0.84, 0.82], material: 'ashlar', glass: [0.26, 0.28, 0.3], pitch: 2.8, solid: 0.5, floor: 3.5 },
      },
    }
    tower(out, fit, s)
    const H = specHeight(fit, s) + 7
    const ring = towerRing(fit)
    const b = crownSpot(insetRing(ring, 2.2), 0.3)
    const r = Math.min(7, b.r * 1.0)
    prism(out, b.cx, b.cz, H - 0.2, H + 1.4, r, 16, HUMBOLDT_GREY, surfaceTag('ashlar'))
    dome(out, b.cx, b.cz, H + 1.4, r, r * 1.05, [0.52, 0.27, 0.22])
    // the four oculus dormers round its foot, and the lantern and flagpole on top
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4
      box(out, b.cx + Math.cos(a) * r * 0.92, H + 2.6, b.cz + Math.sin(a) * r * 0.92, 0.9, 1.3, 0.9, HUMBOLDT_GREY, surfaceTag('ashlar'))
    }
    prism(out, b.cx, b.cz, H + 1.4 + r * 1.05 - 0.3, H + 2.4 + r * 1.05, r * 0.18, 8, HUMBOLDT_GREY, surfaceTag('ashlar'))
    strut(out, [b.cx, H + 2.4 + r * 1.05, b.cz], [b.cx, H + 10 + r * 1.05, b.cz], 0.14, 0.14, [0.85, 0.85, 0.85], surfaceTag('metal'))
  },

  /**
   * The Flood Building (1904, Albert Pissis), Market at Powell over Hallidie Plaza: twelve storeys of grey
   * sandstone round a rounded prow at the Powell corner, heavy and dark, in horizontal bands like a stack of
   * palazzos. A rusticated two-storey base of wide arches; two floors over it ending in a balustraded balcony
   * ledge; four floors behind giant columns; three more; an arcaded top floor under a deep modillioned cornice.
   * (Commons: "San Francisco - Flood Building from Hallidie Plaza.jpg", "Flood Building San Francisco 01.jpg".)
   */
  floodBuilding: spec({
    height: 49,
    base: { height: 8.5, face: { kind: 'punched', wall: [0.45, 0.44, 0.41], material: 'ashlar', glass: [0.2, 0.22, 0.24], pitch: 5.5, solid: 0.3, arched: true, floor: 8.5 } },
    tiers: [
      { to: 15.5, face: { kind: 'punched', wall: FLOOD_GREY, material: 'ashlar', glass: [0.27, 0.29, 0.31], pitch: 2.6, solid: 0.5, floor: 3.5 }, cornice: { depth: 0.6, height: 0.6 } },
      { to: 30, face: { kind: 'punched', wall: FLOOD_GREY, material: 'ashlar', glass: [0.27, 0.29, 0.31], pitch: 2.6, solid: 0.5, floor: 3.6 }, cornice: { depth: 0.6, height: 0.7 } },
      { to: 41.5, face: { kind: 'punched', wall: FLOOD_GREY, material: 'ashlar', glass: [0.27, 0.29, 0.31], pitch: 2.6, solid: 0.5, floor: 3.8 }, cornice: { depth: 0.4, height: 0.5 } },
      { to: 0.97, face: { kind: 'punched', wall: FLOOD_GREY, material: 'ashlar', glass: [0.27, 0.29, 0.31], pitch: 2.6, solid: 0.45, arched: true, floor: 5.5 } },
      { to: 1, face: { kind: 'blank', wall: FLOOD_GREY , material: 'ashlar'}, cornice: { depth: 1.4, height: 1.4 } },
    ],
    roof: [0.45, 0.44, 0.42],
    crown: { kind: 'parapet', height: 0.6, colour: FLOOD_GREY },
  }),

  /**
   * The Emporium (1896, rebuilt 1908, Albert Pissis), now Westfield San Francisco Centre, 835–865 Market: the old
   * department store's cream facade kept along Market — two storeys of big dark shop windows and arched doorways,
   * two plain floors, then giant white columns two storeys high with arched windows between, an attic storey, a
   * deep cornice and balustrade — and behind it the mall's plain pale bulk rising to 62 m, with the Emporium's
   * glass dome, re-hung on the new roof, standing up out of it under a scalloped rim. (Commons: "Westfield San
   * Francisco Centre 845 Market Street.jpg", "Emporium Dome.jpg".)
   */
  emporiumWestfield: (out, fit) => {
    const s: TowerSpec = {
      height: 62,
      base: { height: 9, face: { kind: 'punched', wall: EMPORIUM_CREAM, material: 'terracotta', glass: [0.2, 0.22, 0.25], pitch: 6.4, solid: 0.22, arched: true, floor: 9 } },
      tiers: [
        { to: 16.5, face: { kind: 'punched', wall: EMPORIUM_CREAM, material: 'terracotta', glass: [0.3, 0.32, 0.35], pitch: 3.2, solid: 0.5, floor: 3.7 }, cornice: { depth: 0.7, height: 0.7 } },
        { to: 27, face: { kind: 'fins', wall: [0.94, 0.93, 0.9], material: 'terracotta', glass: [0.3, 0.32, 0.35], pitch: 6.4, solid: 0.3, depth: 0.6, floor: 5.2 }, cornice: { depth: 0.5, height: 0.6 } },
        { to: 31, face: { kind: 'punched', wall: EMPORIUM_CREAM, material: 'terracotta', glass: [0.3, 0.32, 0.35], pitch: 3.2, solid: 0.55, floor: 4 }, cornice: { depth: 1.3, height: 1.2 } },
        { to: 32.4, face: { kind: 'punched', wall: EMPORIUM_CREAM, material: 'terracotta', glass: [0.55, 0.55, 0.53], pitch: 1.2, solid: 0.5, floor: 1.4 } },
        { to: 1, inset: 9, face: { kind: 'blank', wall: [0.8, 0.78, 0.73], material: 'concrete' }, cornice: { depth: 0.3, height: 0.5 } },
      ],
      roof: [0.52, 0.52, 0.52],
    }
    tower(out, fit, s)
    const H = specHeight(fit, s)
    const ring = insetRing(towerRing(fit), 9)
    const c = crownSpot(ring, 0.25)
    const r = Math.min(15, c.r * 0.8)
    prism(out, c.cx, c.cz, H - 0.3, H + 3, r, 20, [0.9, 0.9, 0.88], surfaceTag('terracotta'))
    // the scalloped rim: a ring of little gables round the drum
    for (let k = 0; k < 20; k++) {
      const a = ((k + 0.5) / 20) * Math.PI * 2
      box(out, c.cx + Math.sin(a) * r, H + 3.4, c.cz + Math.cos(a) * r, 0.9, 0.5, 0.9, [0.9, 0.9, 0.88], surfaceTag('terracotta'))
    }
    dome(out, c.cx, c.cz, H + 3, r * 0.96, r * 0.42, [0.62, 0.7, 0.74], surfaceTag('glass'))
  },

  /**
   * The Monadnock Building (1907, Meyer & O'Brien), 685 Market next to the Palace: ten storeys of buff brick, the
   * windows in threes across each bay; a two-storey base of pale granite round dark shopfronts and the round-arched
   * doorway; a deep bracketed cornice under the top floor, with an attic storey of small windows above it.
   * (Commons: "Monadnock Building Facade - Dec. 2025.jpg", "Monadnock Building (1).jpg".)
   */
  monadnockBuilding: spec({
    height: 36,
    base: { height: 8, face: { kind: 'punched', wall: [0.82, 0.79, 0.72], material: 'granite', glass: [0.16, 0.17, 0.18], pitch: 4.4, solid: 0.3, floor: 8 } },
    tiers: [
      { to: 9, face: { kind: 'blank', wall: [0.82, 0.79, 0.72], material: 'granite' }, cornice: { depth: 0.35, height: 0.5 } },
      { to: 31.5, face: { kind: 'punched', wall: MONADNOCK_BRICK, material: 'brick', glass: [0.26, 0.29, 0.31], pitch: 1.55, solid: 0.33, floor: 3.2 } },
      { to: 32.3, face: { kind: 'blank', wall: MONADNOCK_BRICK , material: 'brick'}, cornice: { depth: 1.3, height: 1.1, colour: [0.72, 0.66, 0.55] } },
      { to: 1, face: { kind: 'punched', wall: MONADNOCK_BRICK, material: 'brick', glass: [0.26, 0.29, 0.31], pitch: 1.55, solid: 0.4, floor: 3.5 } },
    ],
    roof: [0.45, 0.44, 0.42],
    crown: { kind: 'parapet', height: 0.8, colour: [0.72, 0.66, 0.55] },
  }),

  /**
   * 595 Market Street (1979, Skidmore, Owings & Merrill), at Second: a thirty-storey octagon wrapped in ribbon
   * windows — alternating bands of pale grey aluminium spandrel and dark blue glass, every face alike — standing on
   * a recessed glass ground floor, and topped by a tall plain white band of louvres round the plant floors. (Commons:
   * "595 Market Street.jpg".)
   */
  fiveNinetyFiveMarket: spec({
    height: 125,
    base: { height: 6, face: { kind: 'curtain', wall: [0.3, 0.31, 0.33], material: 'metal', glass: [0.16, 0.19, 0.24], pitch: 3, floor: 6 } },
    tiers: [
      { to: 0.93, face: { kind: 'bands', wall: [0.86, 0.86, 0.84], material: 'metal', glass: [0.2, 0.26, 0.38], solid: 0.46, floor: 3.9 } },
      { to: 1, face: { kind: 'bands', wall: [0.9, 0.9, 0.88], material: 'metal', glass: [0.72, 0.72, 0.7], solid: 0.7, floor: 0.9 } },
    ],
    roof: [0.6, 0.6, 0.6],
  }),

  /**
   * One Montgomery Street (1908, Willis Polk; the old First National / Crocker bank, now Wells Fargo), Market at
   * Post and Montgomery: a white granite banking hall, two tall storeys of round-arched windows between pilasters
   * under a frieze, an attic of little square windows and a cornice, and on the rounded corner the portico — four
   * giant columns — with a drum rising over it and a curved pergola on the roof garden above (the office floors
   * that stood on it were taken off in 1982). (Commons: "2017 1 Montgomery Street.jpg".)
   */
  oneMontgomeryStreet: (out, fit) => {
    const s: TowerSpec = {
      height: 15,
      base: { height: 1.4, face: { kind: 'blank', wall: [0.78, 0.78, 0.76], material: 'granite' } },
      tiers: [
        { to: 10.5, face: { kind: 'punched', wall: CROCKER_WHITE, material: 'granite', glass: [0.22, 0.24, 0.26], pitch: 4.4, solid: 0.5, arched: true, floor: 9.1 }, cornice: { depth: 0.4, height: 0.7 } },
        { to: 13.6, face: { kind: 'punched', wall: CROCKER_WHITE, material: 'granite', glass: [0.3, 0.32, 0.34], pitch: 4.4, solid: 0.72, floor: 3.1 }, cornice: { depth: 0.9, height: 0.8 } },
      ],
      roof: [0.4, 0.47, 0.36],
      crown: { kind: 'parapet', height: 1.1, colour: CROCKER_WHITE },
    }
    tower(out, fit, s)
    const H = specHeight(fit, s)
    const k = roundCorner(towerRing(fit))
    // the portico's four columns across the rounded corner, and the drum and pergola over it
    const r = 7
    const cx = k.x - k.nx * r
    const cz = k.z - k.nz * r
    for (let i = 0; i < 4; i++) {
      const a = Math.atan2(k.nx, k.nz) + ((i - 1.5) / 1.5) * 0.62
      prism(out, cx + Math.sin(a) * (r + 1.2), cz + Math.cos(a) * (r + 1.2), 1.4, 10.4, 0.55, 8, CROCKER_WHITE, surfaceTag('granite'))
    }
    prism(out, cx, cz, H - 0.5, H + 3.2, r, 18, CROCKER_WHITE, surfaceTag('granite'))
    prism(out, cx, cz, H + 3.2, H + 3.8, r + 0.4, 18, CROCKER_WHITE, surfaceTag('granite'))
    for (let i = 0; i <= 8; i++) {
      const a = Math.atan2(k.nx, k.nz) + ((i - 4) / 4) * 1.3
      const x = cx + Math.sin(a) * (r - 1)
      const z = cz + Math.cos(a) * (r - 1)
      strut(out, [x, H + 3.8, z], [x, H + 7.5, z], 0.3, 0.3, [0.85, 0.85, 0.83], surfaceTag('concrete'))
      if (i < 8) {
        const b = Math.atan2(k.nx, k.nz) + ((i - 3) / 4) * 1.3
        strut(out, [x, H + 7.5, z], [cx + Math.sin(b) * (r - 1), H + 7.5, cz + Math.cos(b) * (r - 1)], 0.3, 0.3, [0.85, 0.85, 0.83], surfaceTag('concrete'))
      }
    }
  },

  /**
   * Central Tower (1898 as Spreckels' Call Building; stripped to Art Moderne in 1938), Market at Third: a
   * twenty-one-storey tower of pale stucco drawn up in continuous white piers with the windows and their grey-green
   * spandrels recessed between, on a two-storey base of pink granite and a plain storey of square windows; the top
   * five floors step in, the piers running on up them to a squared parapet, and a mast on top. (Commons: "Central
   * Tower San Francisco.jpg".)
   */
  centralTower: spec({
    height: 91,
    base: { height: 8, face: { kind: 'punched', wall: [0.62, 0.52, 0.48], material: 'granite', glass: [0.18, 0.2, 0.22], pitch: 3.2, solid: 0.35, floor: 8 } },
    tiers: [
      { to: 12, face: { kind: 'punched', wall: CENTRAL_WHITE, material: 'stucco', glass: [0.3, 0.32, 0.33], pitch: 3.2, solid: 0.55, floor: 4 } },
      { to: 0.78, face: { kind: 'fins', wall: CENTRAL_WHITE, material: 'stucco', glass: [0.46, 0.47, 0.43], pitch: 2.6, solid: 0.42, depth: 0.35, floor: 3.6 } },
      { to: 1, inset: 3, face: { kind: 'fins', wall: CENTRAL_WHITE, material: 'stucco', glass: [0.46, 0.47, 0.43], pitch: 2.6, solid: 0.42, depth: 0.35, floor: 3.6 } },
    ],
    roof: [0.55, 0.55, 0.53],
    crown: { kind: 'lantern', height: 2.5, inset: 1.5, face: { kind: 'blank', wall: CENTRAL_WHITE , material: 'stucco'}, cap: { kind: 'mast', height: 9, width: 0.3, colour: [0.85, 0.85, 0.85] } },
  }),

  /**
   * One Post Street (McKesson Plaza, 1969, Bechtel), Market at Post and Montgomery: thirty-eight storeys of dark
   * brown-grey granite piers with the glass dark between them, the corners cut off, over a two-storey glass
   * lobby; a dark, sober column. (Commons: "McKesson Plaza 2021.jpg".)
   */
  onePostStreet: spec({
    height: 161,
    base: { height: 8, face: { kind: 'curtain', wall: [0.25, 0.23, 0.22], material: 'granite', glass: [0.3, 0.35, 0.36], pitch: 3, floor: 8 } },
    tiers: [
      { to: 1, face: { kind: 'fins', wall: [0.32, 0.29, 0.27], material: 'granite', glass: [0.2, 0.24, 0.3], pitch: 3, solid: 0.34, depth: 0.35, floor: 3.9 } },
    ],
    roof: [0.3, 0.29, 0.28],
    crown: { kind: 'parapet', height: 1.5, colour: [0.32, 0.29, 0.27] },
  }),

  /**
   * 88 Kearny Street (1986, Skidmore, Owings & Merrill), Kearny at Post: a twenty-two-storey block of white precast
   * panels punched with square windows in an even grid, over a grey granite base; on the Post corner a round bay of
   * ribbon glass, banded in white, runs the full height and rises a storey clear of the roof under an open ring.
   * (Commons: "88 Kearny Street, San Francisco.jpg".) OSM leaves it unnamed.
   */
  eightyEightKearny: (out, fit) => {
    const s: TowerSpec = {
      height: 94,
      base: { height: 8, face: { kind: 'punched', wall: [0.55, 0.55, 0.55], material: 'granite', glass: [0.2, 0.22, 0.25], pitch: 4, solid: 0.35, floor: 8 } },
      tiers: [
        { to: 0.96, face: { kind: 'punched', wall: KEARNY_WHITE, material: 'concrete', glass: [0.36, 0.43, 0.5], pitch: 3, solid: 0.42, floor: 3.9 } },
        { to: 1, face: { kind: 'blank', wall: KEARNY_WHITE , material: 'concrete'} },
      ],
      roof: [0.55, 0.55, 0.55],
    }
    tower(out, fit, s)
    const H = specHeight(fit, s)
    const k = roundCorner(towerRing(fit))
    const r = 5.5
    const cx = k.x - k.nx * (r - 0.6)
    const cz = k.z - k.nz * (r - 0.6)
    const round = Array.from({ length: 16 }, (_, i) => ({ x: cx + Math.cos((i / 16) * Math.PI * 2) * r, z: cz + Math.sin((i / 16) * Math.PI * 2) * r }))
    faceBand(out, round, 8, H + 4, { kind: 'bands', wall: KEARNY_WHITE, material: 'concrete', glass: [0.3, 0.37, 0.45], solid: 0.35, floor: 3.9 })
    capPolygon(out, round, H + 4, KEARNY_WHITE, surfaceTag('concrete'))
    ledge(out, round, 8.4, 0.9, 0.5, [0.55, 0.55, 0.55], 'granite')
    // the open ring over it, on four posts
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      strut(out, [cx + Math.cos(a) * (r - 0.3), H + 4, cz + Math.sin(a) * (r - 0.3)], [cx + Math.cos(a) * (r - 0.3), H + 7, cz + Math.sin(a) * (r - 0.3)], 0.25, 0.25, KEARNY_WHITE, surfaceTag('concrete'))
    }
    for (let i = 0; i < 16; i++) {
      const a0 = (i / 16) * Math.PI * 2
      const a1 = ((i + 1) / 16) * Math.PI * 2
      strut(out, [cx + Math.cos(a0) * (r + 0.4), H + 7, cz + Math.sin(a0) * (r + 0.4)], [cx + Math.cos(a1) * (r + 0.4), H + 7, cz + Math.sin(a1) * (r + 0.4)], 0.5, 0.35, KEARNY_WHITE, surfaceTag('concrete'))
    }
  },
  /**
   * The Mutual Savings Bank Building (1902, William Curlett), 700 Market at Kearny and Geary: a narrow twelve-storey
   * tower of grey granite, three bays wide. Rusticated arches at the foot; a shaft of paired windows between plain
   * piers; three round arches under a deep modillioned cornice; an attic storey; and over it a steep red-tiled
   * mansard with a big stone dormer and an oculus, a green iron cresting along its ridge. (Commons: "Mutual Savings
   * Bank Building 700 Market Street.jpg".)
   */
  mutualSavingsBank: spec({
    height: 47,
    base: { height: 8, face: { kind: 'punched', wall: MUTUAL_GREY, material: 'ashlar', glass: [0.2, 0.22, 0.24], pitch: 4.5, solid: 0.35, arched: true, floor: 8 } },
    tiers: [
      { to: 11.5, face: { kind: 'punched', wall: MUTUAL_GREY, material: 'ashlar', glass: [0.28, 0.3, 0.33], pitch: 2.4, solid: 0.45, floor: 3.5 }, cornice: { depth: 0.3, height: 0.4 } },
      { to: 26.5, face: { kind: 'punched', wall: MUTUAL_GREY, material: 'ashlar', glass: [0.28, 0.3, 0.33], pitch: 2.2, solid: 0.4, floor: 3.4 } },
      { to: 31, face: { kind: 'punched', wall: MUTUAL_GREY, material: 'ashlar', glass: [0.28, 0.3, 0.33], pitch: 4.4, solid: 0.35, arched: true, floor: 4.5 }, cornice: { depth: 1.1, height: 1 } },
      { to: 34.5, face: { kind: 'punched', wall: MUTUAL_GREY, material: 'ashlar', glass: [0.28, 0.3, 0.33], pitch: 2.2, solid: 0.45, floor: 3.5 }, cornice: { depth: 0.4, height: 0.5 } },
    ],
    roof: [0.45, 0.47, 0.42],
    crown: { kind: 'mansard', height: 9.5, inset: 4, colour: [0.62, 0.32, 0.26] },
  }),

  /**
   * The Pacific Building (1907, Charles Whittlesey), Market at Fourth: nine storeys faced in sea-green glazed
   * terracotta — the city's only green one — over a two-storey base of red brick with round-arched windows, a clock
   * in one of them; the green floors are pale-framed windows in even rows, arched on the top floor, under a
   * cream cornice. A round bay turns the corner. (Commons: "Pacific Building 801 Market Street.jpg".)
   */
  pacificBuilding: spec({
    height: 42,
    base: { height: 8.5, face: { kind: 'punched', wall: [0.55, 0.26, 0.2], material: 'brick', glass: [0.2, 0.22, 0.24], pitch: 5, solid: 0.3, arched: true, floor: 8.5 } },
    tiers: [
      { to: 9.2, face: { kind: 'blank', wall: [0.86, 0.83, 0.74], material: 'terracotta' }, cornice: { depth: 0.4, height: 0.6, colour: [0.86, 0.83, 0.74] } },
      { to: 35, face: { kind: 'punched', wall: PACIFIC_GREEN, material: 'terracotta', glass: [0.3, 0.34, 0.35], pitch: 2.5, solid: 0.45, floor: 3.7 } },
      { to: 39, face: { kind: 'punched', wall: PACIFIC_GREEN, material: 'terracotta', glass: [0.3, 0.34, 0.35], pitch: 2.5, solid: 0.45, arched: true, floor: 4 } },
      { to: 1, face: { kind: 'blank', wall: [0.9, 0.88, 0.8], material: 'terracotta' }, cornice: { depth: 1.1, height: 1 } },
    ],
    roof: [0.45, 0.45, 0.43],
  }),

  /**
   * The Hunter-Dulin Building (1926, Schultze & Weaver), 111 Sutter at Montgomery: twenty-two storeys of buff
   * terracotta in a French-Romanesque dress — a granite base, a shaft of narrow piers with arched heads at the
   * setback storeys — and over it the thing you see from Market: steep copper-green and red-tile roofs with
   * pinnacles at the corners. (Commons: "Hunter-Dulin Building.jpg".)
   */
  hunterDulinBuilding: spec({
    height: 94,
    base: { height: 9, face: { kind: 'punched', wall: [0.62, 0.6, 0.55], material: 'granite', glass: [0.2, 0.22, 0.24], pitch: 3.6, solid: 0.35, arched: true, floor: 9 } },
    tiers: [
      { to: 0.72, face: { kind: 'fins', wall: HUNTER_BUFF, material: 'terracotta', glass: [0.3, 0.32, 0.34], pitch: 2.6, solid: 0.45, depth: 0.25, floor: 3.5 }, cornice: { depth: 0.6, height: 0.6 } },
      { to: 0.87, inset: 2.5, face: { kind: 'punched', wall: HUNTER_BUFF, material: 'terracotta', glass: [0.3, 0.32, 0.34], pitch: 2.6, solid: 0.5, floor: 3.5 } },
      { to: 1, inset: 1.5, face: { kind: 'punched', wall: HUNTER_BUFF, material: 'terracotta', glass: [0.3, 0.32, 0.34], pitch: 2.6, solid: 0.45, arched: true, floor: 4.2 }, cornice: { depth: 0.8, height: 0.8 } },
    ],
    roof: [0.5, 0.48, 0.45],
    crown: { kind: 'mansard', height: 12, inset: 4, colour: [0.55, 0.3, 0.26] },
  }),
  /**
   * 100 Montgomery Street (1955, the Equitable Life building), at Sutter: twenty-five storeys of white aluminium
   * and glass — the first curtain wall on the street — a fine grid of pale mullions with grey-green glass behind,
   * over a plain two-storey base of the same, and a flat roof with no crown at all. (Commons: "100 Montgomery
   * Street.jpg".)
   */
  hundredMontgomery: spec({
    height: 108,
    base: { height: 8, face: { kind: 'curtain', wall: [0.82, 0.82, 0.8], material: 'metal', glass: [0.26, 0.3, 0.32], pitch: 3.3, floor: 4 } },
    tiers: [
      { to: 1, face: { kind: 'curtain', wall: [0.9, 0.9, 0.88], material: 'metal', glass: [0.42, 0.48, 0.5], pitch: 1.65, floor: 3.9 } },
    ],
    roof: [0.5, 0.5, 0.5],
    crown: { kind: 'parapet', height: 1.2, colour: [0.9, 0.9, 0.88] },
  }),

  /**
   * Lotta's Fountain (1875, Wyneken & Townsend), on the island where Market, Geary, Kearny and Third meet: a
   * bronze column the colour of a new penny, about eight metres tall — an ornate square pedestal with lions'
   * heads and a little basin, a fluted shaft between two banded drums, and on top a glass lantern with a spiked
   * finial. The meeting place after the 1906 earthquake, and the smallest landmark on Market Street.
   * (Commons: "Lotta's Fountain (San Francisco) July 2022.jpg".) Placed by lat/lon, not on a building.
   */
  lottasFountain: (out) => {
    // a penny bronze, coded muted: the frame's grade (BUGS #280) turned [0.66, 0.42, 0.16] traffic-cone orange
    const bronze: Rgb = [0.5, 0.36, 0.2]
    const tag = surfaceTag('copper')
    const stone = surfaceTag('granite')
    box(out, 0, 0.1, 0, 1.5, 0.1, 1.5, [0.55, 0.54, 0.52], stone)                 // the granite step
    box(out, 0, 0.45, 0, 1.15, 0.35, 1.15, bronze, tag)                           // the plinth
    box(out, 0, 1.6, 0, 0.95, 1.0, 0.95, bronze, tag)                             // the pedestal
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      box(out, dx * 0.98, 1.9, dz * 0.98, dx ? 0.1 : 0.3, 0.22, dz ? 0.1 : 0.3, bronze, tag)   // the lions' heads
      box(out, dx * 0.9, 2.75, dz * 0.9, dx ? 0.12 : 0.75, 0.45, dz ? 0.12 : 0.75, bronze, tag) // the gables over them
    }
    box(out, 0, 2.7, 0, 0.8, 0.7, 0.8, bronze, tag)
    prism(out, 0, 0, 3.4, 3.9, 0.62, 12, bronze, tag)                             // the first banded drum
    prism(out, 0, 0, 3.9, 4.9, 0.48, 12, bronze, tag)                             // the fluted shaft
    prism(out, 0, 0, 4.9, 5.4, 0.62, 12, bronze, tag)                             // the second drum
    prism(out, 0, 0, 5.4, 5.75, 0.75, 12, bronze, tag)                            // the capital
    prism(out, 0, 0, 5.75, 6.05, 0.4, 8, bronze, tag)
    dome(out, 0, 0, 6.35, 0.42, 0.42, [0.85, 0.87, 0.85], surfaceTag('glass'))    // the lantern's glass globe
    dome(out, 0, 0, 6.35, 0.42, -0.42, [0.85, 0.87, 0.85], surfaceTag('glass'))
    prism(out, 0, 0, 6.8, 7.1, 0.5, 8, bronze, tag)                               // its little roof
    prism(out, 0, 0, 7.1, 7.6, 0.3, 8, bronze, tag, 0.05)                         // and the finial
    strut(out, [0, 7.5, 0], [0, 8.1, 0], 0.07, 0.07, bronze, tag)
  },
  /**
   * The Powell Street cable car turntable, at Market and Powell: a flat timber turntable about eight metres
   * across, set in the roadway inside a steel ring, with the two rails crossing it and the stub of track running
   * off it up Powell. The cars are pushed round on it by hand, and the queue for them is the busiest corner in
   * the city. Placed by lat/lon.
   */
  powellTurntable: (out) => {
    const steel: Rgb = [0.4, 0.41, 0.43]
    const timber: Rgb = [0.38, 0.32, 0.27]
    const metal = surfaceTag('metal')
    prism(out, 0, 0, 0.02, 0.1, 4.6, 24, steel, metal)                            // the ring set in the road
    prism(out, 0, 0, 0.04, 0.12, 4.2, 24, timber, surfaceTag('clapboard'))        // the deck
    for (const s of [-1, 1]) {
      box(out, s * 0.75, 0.16, 0, 0.05, 0.05, 4.1, [0.6, 0.6, 0.62], metal)       // the rails across it
      box(out, s * 0.75, 0.16, -6, 0.05, 0.05, 2, [0.6, 0.6, 0.62], metal)        // and the stub of track off it
    }
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      box(out, Math.sin(a) * 4.45, 0.2, Math.cos(a) * 4.45, 0.1, 0.1, 0.1, steel, metal)
    }
  },

  /**
   * The Contemporary Jewish Museum (2008, Daniel Libeskind), 736 Mission: the old Jessie Street power substation
   * in red brick, and driven into it two tilted boxes of blue steel panels — a big cube standing on one corner,
   * with a few small windows cut at angles in it. Nothing else in the city looks like it. (Commons: "Contemporary
   * Jewish Museum, San Francisco 2023-07-14.jpg".)
   */
  contemporaryJewishMuseum: (out, fit) => {
    const s: TowerSpec = {
      height: 14,
      tiers: [
        { to: 1, face: { kind: 'punched', wall: [0.6, 0.35, 0.28], material: 'brick', glass: [0.2, 0.2, 0.22], pitch: 4.2, solid: 0.45, arched: true, floor: 7 }, cornice: { depth: 0.5, height: 0.6, colour: [0.55, 0.32, 0.26] } },
      ],
      roof: [0.4, 0.38, 0.36],
    }
    tower(out, fit, s)
    const b = ringBox(towerRing(fit))
    const blue: Rgb = [0.16, 0.24, 0.4]
    const steel = surfaceTag('metal')
    // the cube on its corner, and the smaller wedge beside it
    strut(out, [b.cx + 3, 0, b.cz - b.d * 0.05], [b.cx - 3, 23, b.cz + b.d * 0.05], 13, 13, blue, steel)
    strut(out, [b.cx - b.w * 0.16, 0, b.cz - b.d * 0.05], [b.cx - b.w * 0.2, 12, b.cz + b.d * 0.05], 8, 8, blue, steel)
  },

  /**
   * The Four Seasons Hotel tower (2001, Gary Edward Handel), 757 Market: forty storeys of pale grey-green glass in
   * a white frame, the windows in tall two-storey bays, the corners notched, a plain parapet at the top and
   * nothing above it. (Commons: "San Francisco skyscrapers seen from Yerba Buena gardens.jpg".)
   */
  fourSeasonsTower: spec({
    height: 121,
    tiers: [
      { to: 0.97, face: { kind: 'curtain', wall: [0.88, 0.88, 0.86], material: 'metal', glass: [0.44, 0.52, 0.5], pitch: 3.1, floor: 3.2 } },
      { to: 1, face: { kind: 'blank', wall: [0.88, 0.88, 0.86], material: 'concrete' } },
    ],
    roof: [0.55, 0.55, 0.54],
    crown: { kind: 'parapet', height: 1.4, colour: [0.88, 0.88, 0.86] },
    penthouse: 1,
  }),
  /**
   * The Four Seasons' Market Street podium (2001): eight storeys of pale limestone with deep window bays and a
   * two-storey glazed front to the street, holding the line of the old Market Street frontage under the tower.
   */
  fourSeasonsPodium: spec({
    height: 29,
    base: { height: 8, face: { kind: 'curtain', wall: [0.75, 0.74, 0.7], material: 'metal', glass: [0.26, 0.3, 0.32], pitch: 3.4, floor: 4 } },
    tiers: [
      { to: 1, face: { kind: 'punched', wall: [0.84, 0.82, 0.78], material: 'ashlar', glass: [0.4, 0.46, 0.46], pitch: 3.2, solid: 0.42, floor: 3.4 }, cornice: { depth: 0.6, height: 0.6 } },
    ],
    roof: [0.5, 0.5, 0.48],
  }),
  /**
   * The Hyatt Regency Downtown SOMA (1984, formerly the Park Central), 50 Third Street: a thirty-six-storey hotel
   * slab of white precast concrete with small punched windows in an even grid, stepping in twice near the top,
   * over a darker four-storey base. (Commons: "San Francisco skyscrapers seen from Yerba Buena gardens.jpg".)
   */
  hyattSomaTower: spec({
    height: 129,
    base: { height: 14, face: { kind: 'punched', wall: [0.62, 0.61, 0.58], material: 'concrete', glass: [0.24, 0.27, 0.3], pitch: 3.4, solid: 0.4, floor: 3.5 } },
    tiers: [
      { to: 0.9, face: { kind: 'punched', wall: [0.9, 0.89, 0.86], material: 'concrete', glass: [0.3, 0.35, 0.4], pitch: 3.2, solid: 0.5, floor: 3.2 } },
      { to: 0.96, inset: 2.5, face: { kind: 'punched', wall: [0.9, 0.89, 0.86], material: 'concrete', glass: [0.3, 0.35, 0.4], pitch: 3.2, solid: 0.5, floor: 3.2 } },
      { to: 1, inset: 2.5, face: { kind: 'punched', wall: [0.9, 0.89, 0.86], material: 'concrete', glass: [0.3, 0.35, 0.4], pitch: 3.2, solid: 0.5, floor: 3.2 } },
    ],
    roof: [0.55, 0.55, 0.54],
    crown: { kind: 'parapet', height: 1.2, colour: [0.9, 0.89, 0.86] },
  }),
  /**
   * 55 Second Street (2002, Heller Manus): twenty-five storeys of warm grey granite piers with sea-green glass
   * between them, a ten-storey block along the street under a cornice and a slimmer tower above it, its corners
   * notched and stepped as it rises. (Commons: "KPMG Building from the street level.jpg".)
   */
  fiftyFiveSecond: spec({
    height: 100,
    base: { height: 8, face: { kind: 'punched', wall: [0.58, 0.55, 0.5], material: 'granite', glass: [0.3, 0.42, 0.42], pitch: 3.4, solid: 0.4, floor: 8 } },
    tiers: [
      { to: 40, face: { kind: 'fins', wall: [0.78, 0.75, 0.68], material: 'granite', glass: [0.42, 0.56, 0.54], pitch: 3.2, solid: 0.4, depth: 0.3, floor: 3.6 }, cornice: { depth: 0.7, height: 0.7 } },
      { to: 0.92, inset: 2, face: { kind: 'fins', wall: [0.8, 0.77, 0.7], material: 'granite', glass: [0.42, 0.56, 0.54], pitch: 3.2, solid: 0.38, depth: 0.3, floor: 3.6 } },
      { to: 1, inset: 2, face: { kind: 'fins', wall: [0.8, 0.77, 0.7], material: 'granite', glass: [0.42, 0.56, 0.54], pitch: 3.2, solid: 0.38, depth: 0.3, floor: 3.6 } },
    ],
    roof: [0.5, 0.49, 0.46],
    crown: { kind: 'stepped', steps: 2, height: 4, inset: 1.6, face: { kind: 'blank', wall: [0.8, 0.77, 0.7], material: 'granite' } },
  }),
}
