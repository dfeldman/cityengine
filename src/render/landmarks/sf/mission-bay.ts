/**
 * MISSION BAY'S OWN BUILDINGS (owner, 2026-10-03: "almost every building for blocks around is highly memorable and
 * unique. our generics don't do it justice … there should be at least 20 custom buildings in this area"). One builder
 * per building, from a Mapillary frame or the owner's photographs, fitted to OSM's footprint. Local frame: the
 * street front on +z (`front: "street"`).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, strut, type Rgb } from '../../models.ts'
import { tower, towerRing, type Face } from '../tower.ts'
import { boxAlong, edgeAt, edgeFacing, signText, stripRoof } from '../parts.ts'
import { roof } from '../kit.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const PANEL: Rgb = [0.8, 0.81, 0.8]
const WHITE: Rgb = [0.93, 0.93, 0.91]
const GLASS: Rgb = [0.42, 0.52, 0.55]
const TERRACOTTA: Rgb = [0.72, 0.45, 0.28]
const FIN: Rgb = [0.25, 0.24, 0.23]
const STONE: Rgb = [0.84, 0.83, 0.79]

/**
 * The real street wall: the footprint's edge facing the street (+z), and a box ON it — `u` metres along it from its
 * middle, `y` up, standing `out` metres proud of it, `w` wide, `h` tall, `d` deep. Placing by the bounding box instead
 * hung the bronze boxes in the air where the wall steps back (owner, 2026-10-03: "cubes floating in the air").
 */
function frontWall(fit: Fit): { L: number; on: (o: MeshBuilder, u: number, y: number, out: number, w: number, h: number, d: number, c: Rgb, tag: number) => void } {
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring, 0))
  return {
    L: e.L,
    on: (o, u, y, out, w, h, d, c, tag) => {
      const x = e.mid.x + e.tx * u + e.nx * out, z = e.mid.z + e.tz * u + e.nz * out
      boxAlong(o, x, y, z, w / 2, h / 2, d / 2, e.heading, c, tag)
    },
  }
}

/**
 * UCSF Nancy Friend Pritzker Psychiatry Building (2022), Third Street at 20th (way/1243657270). Mapillary frame on
 * Third: five storeys on a pale stone base; pale grey standing-seam metal panels; a band of dark vertical fins over a
 * strip of glass; at the corner a white-framed box holding a glazed bay with a warm terracotta side panel and thin
 * sunshade blades; the top storey a recessed glass band; rooftop plant frames. Was a 210 m recipe placeholder.
 */
export function ucsfPritzker(out: MeshBuilder, fit: Fit): void {
  const H = 23
  const hx = fit.hx, hz = fit.hz
  tower(out, { ...fit, height: H - 3.5 }, {
    height: H - 3.5,
    base: { height: 4.2, face: { kind: 'curtain', material: 'glass', wall: STONE, glass: GLASS, pitch: 3, floor: 4.2 } },
    tiers: [{ to: H - 3.5, face: { kind: 'fins', material: 'metal', wall: PANEL, glass: [0.55, 0.62, 0.64], pitch: 1.2, solid: 0.7, depth: 0.08, floor: 3.8 } }],
    roof: [0.5, 0.5, 0.5],
  })
  const metal = surfaceTag('metal'), glass = surfaceTag('glass')
  // the recessed top storey: a glass band set 1.2 m back, a thin white roof edge
  box(out, 0, H - 1.75, 0, hx - 1.2, 1.75, hz - 1.2, GLASS, glass)
  box(out, 0, H + 0.05, 0, hx - 1.2, 0.06, hz - 1.2, [0.5, 0.5, 0.49], 0)
  for (const sx of [-1, 1]) box(out, sx * (hx - 1.1), H + 0.15, 0, 0.12, 0.15, hz - 1.0, WHITE, metal)
  for (const sz of [-1, 1]) box(out, 0, H + 0.15, sz * (hz - 1.1), hx - 1.0, 0.15, 0.12, WHITE, metal)
  // the band of dark fins on the street face, left of the corner box
  const f = frontWall(fit)
  for (let u = -f.L / 2 + 2; u < f.L * 0.2; u += 0.45) f.on(out, u, 12, 0.12, 0.1, 12, 0.24, FIN, metal)
  // the corner box: a white frame proud of the face, the glazed bay in it, the terracotta panel, the sunshades
  const cu = f.L / 2 - 5, w = 4.6, y0 = 4.2, y1 = H - 3.5
  f.on(out, cu, (y0 + y1) / 2, 0.6, 2 * w + 0.6, y1 - y0, 1.2, WHITE, metal)
  f.on(out, cu + 1.2, (y0 + y1) / 2 - 0.2, 1.22, 2 * w - 2.8, y1 - y0 - 1, 0.08, GLASS, glass)
  f.on(out, cu - w + 1.1, (y0 + y1) / 2 - 0.2, 1.22, 1.8, y1 - y0 - 1, 0.1, TERRACOTTA, 0)
  for (const y of [y0 + 4.1, y0 + 7.9]) f.on(out, cu + 1.2, y, 1.7, 2 * w - 2.6, 0.1, 1.1, PANEL, metal)
  // the rooftop plant frames
  for (const x of [-hx * 0.3, hx * 0.1]) for (const s of [-1, 1]) box(out, x + s * 1.2, H + 1.4, 0, 0.06, 1.4, 1.2, PANEL, metal)
}

/**
 * The sawtooth block on Third south of 20th (way/1256126073), Mapillary frame on Third: four storeys of taupe stucco, a
 * white ground floor of shopfronts under red awnings, boxed bay windows framed in LIME GREEN with brown cheeks pushed
 * out of the upper floors, and along the top a row of white gabled roof monitors with clerestory glass — a sawtooth.
 */
export function dogpatchSawtooth(out: MeshBuilder, fit: Fit): void {
  const H = 15
  const hx = fit.hx, hz = fit.hz
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 4, face: { kind: 'curtain', material: 'glass', wall: WHITE, glass: [0.3, 0.32, 0.34], pitch: 3.2, floor: 4 }, canopy: { depth: 1.0, colour: [0.72, 0.15, 0.14] } },
    tiers: [{ to: H, face: { kind: 'punched', material: 'stucco', wall: [0.72, 0.62, 0.55], glass: [0.3, 0.33, 0.36], pitch: 3.0, solid: 0.55, floor: 3.6 } }],
    roof: [0.6, 0.58, 0.55],
  })
  const metal = surfaceTag('metal'), glass = surfaceTag('glass')
  // the boxed bays: every other bay on the street face, two storeys tall, lime green with brown cheeks
  const LIME: Rgb = [0.6, 0.72, 0.25], BROWN: Rgb = [0.5, 0.3, 0.2]
  const f = frontWall(fit)
  for (let u = -f.L / 2 + 4, k = 0; u < f.L / 2 - 3; u += 7, k++) {
    const y0 = k % 2 ? 4.5 : 8, y1 = y0 + 6.5
    f.on(out, u, (y0 + y1) / 2, 0.6, 4.8, y1 - y0, 1.2, LIME, metal)
    f.on(out, u, (y0 + y1) / 2, 1.22, 3.8, y1 - y0 - 0.8, 0.06, GLASS, glass)
    f.on(out, u + 2.5, (y0 + y1) / 2, 0.4, 0.6, y1 - y0, 0.8, BROWN, metal)
  }
  // the sawtooth: white gabled monitors along x, each with a strip of clerestory glass in its gable
  const n = Math.max(2, Math.round((2 * hx) / 7))
  const w = (2 * hx) / n
  for (let i = 0; i < n; i++) {
    const x0 = -hx + i * w
    roof(out, x0, x0 + w, -hz * 0.8, hz * 0.95, H, 3.2, w / 2, 0, WHITE)
    box(out, x0 + w / 2, H + 1.0, hz * 0.95 + 0.02, w * 0.25, 0.5, 0.02, GLASS, glass)
  }
}

/**
 * The bronze box building on the same corner (way/1256126075), Mapillary frame: a grid of dark bronze-framed storey-high
 * windows, BOX BALCONIES of bronze plate pushed out of it at staggered places, a ground floor of glass behind bronze
 * fins and a corner of green glazed tile.
 */
export function dogpatchBronzeBoxes(out: MeshBuilder, fit: Fit): void {
  const H = 20
  const BRONZE: Rgb = [0.24, 0.19, 0.15]
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 4.5, face: { kind: 'fins', material: 'metal', wall: BRONZE, glass: [0.25, 0.3, 0.32], pitch: 1.4, solid: 0.25, depth: 0.2, floor: 4.5 } },
    tiers: [{ to: H, face: { kind: 'curtain', material: 'metal', wall: BRONZE, glass: [0.32, 0.4, 0.45], pitch: 2.4, floor: 3.1 } }],
    roof: [0.32, 0.3, 0.28],
  })
  const metal = surfaceTag('metal'), glass = surfaceTag('glass')
  // the box balconies: staggered across the street wall, floor by floor, none higher than the roof
  const f = frontWall(fit)
  for (let fl = 0; fl < 5; fl++) {
    const y = 4.5 + fl * 3.1
    if (y + 3.1 > H) break
    for (let u = -f.L / 2 + 2 + (fl % 2) * 3.5; u < f.L / 2 - 2; u += 7) {
      f.on(out, u, y + 1.55, 0.75, 3, 3.1, 1.5, BRONZE, metal)
      f.on(out, u, y + 1.6, 1.52, 2.5, 2.5, 0.06, GLASS, glass)
    }
  }
  // the corner of green glazed tile at the foot
  f.on(out, f.L / 2 - 2, 2.25, 0.05, 4, 4.5, 0.16, [0.36, 0.5, 0.44], surfaceTag('tile'))
}

/**
 * Genentech Hall, 600 16th Street (UCSF, 2003; way/135103725), Mapillary frame on 16th: a pinkish-beige stone panel grid,
 * big teal windows set deep in it two by two, a band of square windows in deeper stone reveals under the top, a dark
 * plinth behind the planting. OSM's 47 m is wrong for five storeys of labs and a plant floor: 30 m.
 */
export function genentechHall(out: MeshBuilder, fit: Fit): void {
  const H = 30
  const STONE_PINK: Rgb = [0.78, 0.7, 0.66]
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 4.5, face: { kind: 'punched', material: 'granite', wall: [0.4, 0.38, 0.37], glass: [0.18, 0.24, 0.26], pitch: 3.2, solid: 0.5, floor: 4.5 } },
    tiers: [
      { to: H - 4.5, face: { kind: 'punched', material: 'ashlar', wall: STONE_PINK, glass: [0.2, 0.42, 0.46], pitch: 3.4, solid: 0.42, floor: 4.2, head: 'architrave' } },
      { to: H, face: { kind: 'punched', material: 'ashlar', wall: STONE_PINK, glass: [0.2, 0.42, 0.46], pitch: 3.4, solid: 0.6, floor: 4.5 }, cornice: { depth: 0.4, height: 0.5, colour: [0.7, 0.62, 0.58] } },
    ],
    roof: [0.5, 0.48, 0.46],
    penthouse: 2,
  })
}

/**
 * Byers Hall, 1700 4th Street (UCSF QB3, 2005; way/135103710), Mapillary frame on 4th: continuous bands of blue-green
 * glass between WHITE stone spandrels, floor after floor, a glass stair tower at the end, and a deep flat roof
 * overhanging the top like a lid. Five storeys and a plant floor: 30 m.
 */
export function byersHall(out: MeshBuilder, fit: Fit): void {
  const H = 30
  tower(out, { ...fit, height: H - 1 }, {
    height: H - 1,
    base: { height: 4.5, face: { kind: 'curtain', material: 'glass', wall: [0.3, 0.36, 0.38], glass: [0.2, 0.34, 0.38], pitch: 2, floor: 4.5 } },
    tiers: [{ to: H - 1, face: { kind: 'bands', material: 'ashlar', wall: [0.88, 0.86, 0.82], glass: [0.18, 0.36, 0.4], solid: 0.3, floor: 4.6 } }],
    roof: [0.45, 0.45, 0.45],
  })
  // the lid: a thin flat roof overhanging every side by two metres, its edge pale
  const ring = towerRing(fit)
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x / ring.length; cz += p.z / ring.length }
  const lid = ring.map((p) => { const d = Math.hypot(p.x - cx, p.z - cz) || 1; return { x: p.x + ((p.x - cx) / d) * 2, z: p.z + ((p.z - cz) / d) * 2 } })
  for (let i = 1; i < lid.length - 1; i++) {
    out.quad([[lid[0].x, H, lid[0].z], [lid[i].x, H, lid[i].z], [lid[i + 1].x, H, lid[i + 1].z], [lid[i + 1].x, H, lid[i + 1].z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.6, 0.6, 0.59], surfaceTag('concrete'))
    out.quad([[lid[i + 1].x, H - 0.6, lid[i + 1].z], [lid[i + 1].x, H - 0.6, lid[i + 1].z], [lid[i].x, H - 0.6, lid[i].z], [lid[0].x, H - 0.6, lid[0].z]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.62, 0.62, 0.6], surfaceTag('concrete'))
  }
  for (let i = 0; i < lid.length; i++) {
    const a = lid[i], b = lid[(i + 1) % lid.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    out.quad([[a.x, H - 0.6, a.z], [b.x, H - 0.6, b.z], [b.x, H, b.z], [a.x, H, a.z]], [(b.z - a.z) / L, 0, -(b.x - a.x) / L], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.9, 0.9, 0.88], surfaceTag('concrete'))
  }
}

/**
 * The Gladstone Institutes, 1650 Owens Street (2004; way/84805700), Mapillary frame: a long front of bronze-tinted glass
 * over a translucent screen, the floors showing through it as dark lines, a projecting flat cornice ledge, and rooftop
 * plant and vents above. 41 m (OSM) for six lab storeys and the plant.
 */
export function gladstoneInstitutes(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 25 && fit.height < 50 ? fit.height : 41
  const BRONZE_GLASS: Rgb = [0.48, 0.42, 0.34]
  tower(out, { ...fit, height: H - 5 }, {
    height: H - 5,
    base: { height: 4.5, face: { kind: 'curtain', material: 'glass', wall: [0.3, 0.28, 0.25], glass: [0.32, 0.3, 0.27], pitch: 3, floor: 4.5 } },
    tiers: [{ to: H - 5, face: { kind: 'curtain', material: 'glass', wall: [0.36, 0.33, 0.29], glass: BRONZE_GLASS, pitch: 3.6, floor: 4.6 }, cornice: { depth: 1.4, height: 0.5, colour: [0.55, 0.53, 0.5] } }],
    roof: [0.56, 0.55, 0.53],
  })
  // the plant floor, set back, pale
  const ring = towerRing(fit)
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x / ring.length; cz += p.z / ring.length }
  const back = ring.map((p) => ({ x: cx + (p.x - cx) * 0.8, z: cz + (p.z - cz) * 0.8 }))
  tower(out, { ...fit, ring: back, height: 5 }, { height: 5, tiers: [{ to: 5, face: { kind: 'bands', material: 'metal', wall: [0.72, 0.71, 0.68], glass: [0.4, 0.4, 0.4], solid: 0.7, floor: 1.2 } }], roof: [0.5, 0.5, 0.5] })
}

/**
 * Dropbox, 1800 Owens (The Exchange, 2021; way/574616994), Mapillary frame: a teal glass grid with white floor bands and
 * a busy pattern of mullions, slim columns at the glazed ground floor, and set back on top a darker bronze volume.
 */
export function dropboxOwens(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 30 && fit.height < 60 ? fit.height : 48
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 5, face: { kind: 'curtain', material: 'glass', wall: [0.75, 0.77, 0.78], glass: [0.3, 0.45, 0.48], pitch: 4, floor: 5 } },
    tiers: [
      { to: H * 0.72, face: { kind: 'curtain', material: 'glass', wall: [0.86, 0.88, 0.88], glass: [0.32, 0.5, 0.52], pitch: 1.5, floor: 4.0 } },
      { to: H, face: { kind: 'curtain', material: 'metal', wall: [0.32, 0.27, 0.22], glass: [0.26, 0.28, 0.28], pitch: 2.2, floor: 4.0 }, inset: 2.5 },
    ],
    roof: [0.4, 0.38, 0.36],
  })
}

/*
 * SPARK SOCIAL SF and STAGECOACH GREENS (owner, 2026-10-03, with an aerial: "2 of which have many permanent buildings that
 * are not in OSM … SPARK Social and there's a mini golf course"). Standalone, draped, local x east / z north about each
 * entry's point (front 180); positions from OSM's lots (way/437591532, 437595662, 676621358) and the owner's aerial.
 */
const UMBRELLA: Rgb = [0.78, 0.66, 0.48]
const TENT: Rgb = [0.72, 0.58, 0.42]
const SAIL: Rgb = [0.86, 0.42, 0.22]
const TABLE: Rgb = [0.55, 0.36, 0.22]

function umbrella(out: MeshBuilder, x: number, z: number, r: number): void {
  prism(out, x, z, 0, 2.6, 0.06, 6, [0.3, 0.28, 0.26])
  prism(out, x, z, 2.4, 3.2, r, 8, UMBRELLA, 0, 0.15)
}
function picnicTable(out: MeshBuilder, x: number, z: number): void {
  box(out, x, 0.75, z, 0.9, 0.04, 0.4, TABLE, 0)
  for (const s of [-1, 1]) box(out, x, 0.45, z + s * 0.65, 0.9, 0.03, 0.15, TABLE, 0)
  for (const s of [-1, 1]) box(out, x + s * 0.7, 0.37, z, 0.05, 0.37, 0.6, TABLE, 0)
}
function shadeSail(out: MeshBuilder, pts: [number, number, number][], c: Rgb): void {
  for (const p of pts) prism(out, p[0], p[2], 0, p[1], 0.07, 6, [0.4, 0.4, 0.42])
  out.quad([pts[0], pts[1], pts[2], pts[2]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
  out.quad([pts[2], pts[1], pts[0], pts[0]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
}
function roundTent(out: MeshBuilder, x: number, z: number, r: number): void {
  prism(out, x, z, 0, 2.4, r, 16, [0.82, 0.75, 0.62], surfaceTag('stucco'))
  prism(out, x, z, 2.4, 6.5, r + 0.6, 16, TENT, 0, 0.4)
  prism(out, x, z, 6.5, 7.4, 0.06, 6, [0.4, 0.4, 0.4])
}

/** a round tent pavilion fitted to OSM's 12-sided structure (way/1210909963, 1210909964) */
export function sparkTent(out: MeshBuilder, fit: Fit): void { roundTent(out, 0, 0, Math.max(3, Math.min(fit.hx, fit.hz) - 0.3)) }
/** a big tan umbrella over its tables, fitted to OSM's octagon */
export function sparkUmbrella(out: MeshBuilder, fit: Fit): void {
  const r = Math.max(2, Math.min(fit.hx, fit.hz))
  umbrella(out, 0, 0, r)
  for (const [dx, dz] of [[-0.45, -0.35], [0.45, -0.35], [-0.45, 0.35], [0.45, 0.35]]) picnicTable(out, dx * r, dz * r)
}
/** a food truck or trailer standing on OSM's little rectangle, long side along x */
export function sparkTruck(out: MeshBuilder, fit: Fit): void {
  const c: Rgb = ([[0.92, 0.92, 0.9], [0.85, 0.3, 0.2], [0.25, 0.45, 0.7], [0.95, 0.8, 0.2], [0.3, 0.6, 0.35]] as Rgb[])[Math.floor(Math.abs(fit.hx * 7.3 + fit.hz * 3.1)) % 5]
  const metal = surfaceTag('metal')
  const L = Math.max(1.6, Math.min(3.6, fit.hx)), W = Math.max(1, Math.min(1.3, fit.hz))
  box(out, 0, 1.7, 0, L, 1.2, W, c, metal)
  box(out, 0, 1.9, W + 0.01, L * 0.5, 0.45, 0.02, [0.15, 0.15, 0.17], 0)
  box(out, 0, 2.5, W + 0.5, L * 0.55, 0.04, 0.5, c, metal)
  for (const a of [-L * 0.6, L * 0.6]) prism(out, a, W * 0.7, 0, 0.5, 0.35, 8, [0.1, 0.1, 0.1])
}

/**
 * SPARK Social (west of 4th Street, OSM way/437591532) and Parklab Gardens (east of it, way/437595662) between the
 * structures OSM maps there (sparkTent, sparkUmbrella, sparkTruck): picnic tables on the lawns and the orange shade
 * sails. Centre (1838, −2472) city metres; 4th Street runs x 1818…1841 between the lots and is left clear.
 */
export function sparkSocial(out: MeshBuilder, _fit: Fit): void {
  const C = { x: 1838, z: -2472 }
  const L = (x: number, z: number): [number, number] => [x - C.x, z - C.z]
  for (const [ux, uz] of [[1776, -2470], [1784, -2470], [1776, -2480], [1784, -2483], [1850, -2468], [1862, -2466], [1886, -2466], [1894, -2478], [1864, -2486]]) {
    const [x, z] = L(ux, uz); picnicTable(out, x, z)
  }
  for (const tri of [[[1792, -2466], [1802, -2462], [1804, -2474]], [[1800, -2478], [1812, -2470], [1812, -2484]], [[1846, -2470], [1856, -2464], [1858, -2474]], [[1876, -2472], [1888, -2462], [1890, -2474]]] as [number, number][][]) {
    const p = tri.map(([ux, uz], k) => { const [x, z] = L(ux, uz); return [x, k === 1 ? 4.4 : 3.2, z] as [number, number, number] })
    shadeSail(out, p, SAIL)
  }
}

/** Stagecoach Greens: centre (1932, −2465); the course x 1898…1963, z −2485…−2446 */
export function stagecoachGreens(out: MeshBuilder, _fit: Fit): void {
  const C = { x: 1932, z: -2465 }
  const L = (x: number, z: number): [number, number] => [x - C.x, z - C.z]
  const GREEN: Rgb = [0.3, 0.6, 0.28]
  const PATH: Rgb = [0.78, 0.74, 0.66]
  // the paved paths, then the holes: little artificial-turf greens, each kerbed, with a hole and a flag
  const [px0, pz0] = L(1900, -2483), [px1, pz1] = L(1961, -2448)
  box(out, (px0 + px1) / 2, 0.03, (pz0 + pz1) / 2, (px1 - px0) / 2, 0.03, (pz1 - pz0) / 2, PATH, surfaceTag('concrete'))
  const holes: [number, number, number, number, number][] = [
    [1906, -2478, 6, 1.6, 0.3], [1914, -2470, 5, 1.8, -0.6], [1924, -2478, 7, 1.5, 0.1], [1934, -2471, 5, 1.6, 0.8],
    [1944, -2478, 6, 1.7, -0.2], [1954, -2470, 5, 1.6, 0.5], [1910, -2455, 6, 1.6, -0.4], [1922, -2452, 6, 1.5, 0.2],
    [1936, -2456, 5, 1.8, -0.7], [1948, -2453, 6, 1.6, 0.3], [1956, -2460, 4, 1.5, 1.2],
  ]
  holes.forEach(([ux, uz, len, w, a], i) => {
    const [x, z] = L(ux, uz)
    const piece = (u: number, v: number): [number, number] => [x + Math.cos(a) * u - Math.sin(a) * v, z + Math.sin(a) * u + Math.cos(a) * v]
    const q = [piece(-len / 2, -w / 2), piece(len / 2, -w / 2), piece(len / 2, w / 2), piece(-len / 2, w / 2)].map(([qx, qz]) => [qx, 0.12, qz] as [number, number, number])
    out.quad([q[3], q[2], q[1], q[0]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], GREEN, 0)
    for (let k = 0; k < 4; k++) strut(out, [q[k][0], 0.1, q[k][2]], [q[(k + 1) % 4][0], 0.1, q[(k + 1) % 4][2]], 0.1, 0.12, [0.55, 0.42, 0.3])
    const [fx, fz] = piece(len / 2 - 0.6, 0)
    prism(out, fx, fz, 0.1, 1.3, 0.02, 4, [0.9, 0.9, 0.9])
    box(out, fx + 0.15, 1.15, fz, 0.15, 0.1, 0.01, i % 2 ? [0.85, 0.15, 0.12] : [0.95, 0.8, 0.15], 0)
    // a themed prop on every other hole: a little gold-rush shack, a wagon, a mine head-frame
    if (i % 3 === 0) { const [sx, sz] = piece(-len / 2 - 1, w); box(out, sx, 0.9, sz, 0.8, 0.9, 0.7, [0.58, 0.42, 0.28], surfaceTag('clapboard')) }
    if (i % 3 === 1) { const [sx, sz] = piece(0, w + 0.6); strut(out, [sx - 0.8, 0, sz], [sx, 2.2, sz], 0.1, 0.1, [0.4, 0.3, 0.2]); strut(out, [sx + 0.8, 0, sz], [sx, 2.2, sz], 0.1, 0.1, [0.4, 0.3, 0.2]) }
  })
  // the blue water feature, and the small shade sails in pink, teal and tan over the seats
  const [wx, wz] = L(1943, -2482)
  box(out, wx, 0.08, wz, 4, 0.08, 1.2, [0.2, 0.4, 0.75], 0)
  for (const [ux, uz, c] of [[1916, -2462, [0.9, 0.5, 0.6]], [1930, -2462, [0.2, 0.6, 0.6]], [1946, -2464, [0.8, 0.7, 0.5]], [1958, -2478, [0.9, 0.5, 0.6]]] as [number, number, Rgb][]) {
    const [x, z] = L(ux, uz)
    shadeSail(out, [[x - 2, 2.8, z - 1.6], [x + 2, 3.4, z - 1.2], [x, 2.6, z + 2]], c)
  }
}

/** a thin flat roof overhanging every side by `over` metres, its edge pale, louvres under it if asked */
function lid(out: MeshBuilder, fit: Fit, H: number, over: number, edge: Rgb, louvres = false): void {
  const ring = towerRing(fit)
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x / ring.length; cz += p.z / ring.length }
  const L = ring.map((p) => { const d = Math.hypot(p.x - cx, p.z - cz) || 1; return { x: p.x + ((p.x - cx) / d) * over, z: p.z + ((p.z - cz) / d) * over } })
  for (let i = 1; i < L.length - 1; i++) {
    out.quad([[L[0].x, H, L[0].z], [L[i].x, H, L[i].z], [L[i + 1].x, H, L[i + 1].z], [L[i + 1].x, H, L[i + 1].z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.5, 0.5, 0.49], 0)
  }
  for (let i = 0; i < L.length; i++) {
    const a = L[i], b = L[(i + 1) % L.length]
    const len = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const n: [number, number, number] = [(b.z - a.z) / len, 0, -(b.x - a.x) / len]
    out.quad([[a.x, H - 0.7, a.z], [b.x, H - 0.7, b.z], [b.x, H, b.z], [a.x, H, a.z]], n, [[0, 0], [1, 0], [1, 1], [0, 1]], edge, surfaceTag('metal'))
    if (louvres) for (let k = 1; k <= 4; k++) {
      const y = H - 0.7 - k * 0.35
      out.quad([[a.x, y, a.z], [b.x, y, b.z], [b.x, y + 0.12, b.z], [a.x, y + 0.12, a.z]], n, [[0, 0], [1, 0], [1, 1], [0, 1]], edge, surfaceTag('metal'))
    }
  }
}

/**
 * Smith Cardiovascular Research Building (UCSF, Rafael Viñoly, 2014; way/135103721), Mapillary frame: walls of TAN
 * horizontal boards (terracotta planks) with ribbon windows, dark louvre bands at every floor, and a deep flat roof
 * overhanging with louvres under its edge.
 */
export function smithCardiovascular(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 15 && fit.height < 45 ? fit.height : 31
  tower(out, { ...fit, height: H - 1 }, {
    height: H - 1,
    base: { height: 5, face: { kind: 'curtain', material: 'glass', wall: [0.25, 0.24, 0.22], glass: [0.2, 0.24, 0.25], pitch: 3, floor: 5 } },
    tiers: [{ to: H - 1, face: { kind: 'bands', material: 'terracotta', wall: [0.74, 0.6, 0.44], glass: [0.16, 0.18, 0.18], solid: 0.62, floor: 4.3 } }],
    roof: [0.45, 0.45, 0.44],
  })
  lid(out, fit, H, 2.4, [0.84, 0.82, 0.78], true)
}

/**
 * Helen Diller Family Cancer Research Building (UCSF, 2009; way/142845120), Mapillary frame: ribbons of glass between pale
 * metal panels and horizontal louvre bands, over a recessed glass ground floor behind a colonnade of round concrete
 * columns.
 */
export function helenDiller(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 15 && fit.height < 45 ? fit.height : 28
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 5.5, face: { kind: 'curtain', material: 'glass', wall: [0.22, 0.22, 0.22], glass: [0.16, 0.18, 0.2], pitch: 3, floor: 5.5 } },
    tiers: [{ to: H, face: { kind: 'bands', material: 'metal', wall: [0.74, 0.75, 0.75], glass: [0.34, 0.42, 0.46], solid: 0.5, floor: 4.2 }, cornice: { depth: 0.6, height: 0.4, colour: [0.8, 0.8, 0.8] } }],
    roof: [0.5, 0.5, 0.5],
  })
  const f = frontWall(fit)
  for (let u = -f.L / 2 + 3; u < f.L / 2 - 2; u += 8) f.on(out, u, 2.75, 1.2, 0.8, 5.5, 0.8, [0.78, 0.77, 0.74], surfaceTag('concrete'))
  // the louvre band over the colonnade
  f.on(out, 0, 5.9, 1.4, f.L - 1, 0.6, 1.4, [0.6, 0.61, 0.62], surfaceTag('metal'))
}

/**
 * Mission Hall (UCSF Global Health and Clinical Sciences, 2014; way/255652151), Mapillary frame from 16th Street: a long
 * pale grey grid of narrow storey-high windows set in staggered pairs, a dark band under a set-back top floor, and at the
 * corner a deep glazed recess framed in RED.
 */
export function missionHall(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 15 && fit.height < 45 ? fit.height : 26
  tower(out, { ...fit, height: H - 3 }, {
    height: H - 3,
    base: { height: 5, face: { kind: 'curtain', material: 'glass', wall: [0.3, 0.3, 0.3], glass: [0.2, 0.22, 0.24], pitch: 3, floor: 5 } },
    tiers: [{ to: H - 3, face: { kind: 'punched', material: 'metal', wall: [0.8, 0.8, 0.79], glass: [0.18, 0.2, 0.22], pitch: 1.7, solid: 0.6, floor: 3.9 } }],
    roof: [0.5, 0.5, 0.5],
  })
  const ring = towerRing(fit)
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x / ring.length; cz += p.z / ring.length }
  tower(out, { ...fit, ring: ring.map((p) => ({ x: cx + (p.x - cx) * 0.94, z: cz + (p.z - cz) * 0.94 })), height: 3 }, {
    height: 3, tiers: [{ to: 3, face: { kind: 'bands', material: 'glass', wall: [0.32, 0.33, 0.34], glass: [0.22, 0.26, 0.28], solid: 0.3, floor: 3 } }], roof: [0.45, 0.45, 0.45],
  })
  // the red-framed glazed corner recess, two-thirds the height, at the street front's east end
  const f = frontWall(fit)
  const u = f.L / 2 - 5, y0 = 5, y1 = H - 6
  f.on(out, u, (y0 + y1) / 2, 0.3, 8, y1 - y0, 0.6, [0.18, 0.2, 0.23], surfaceTag('glass'))
  for (const du of [-4, 4]) f.on(out, u + du, (y0 + y1) / 2, 0.5, 0.4, y1 - y0, 1.0, [0.62, 0.16, 0.12], surfaceTag('metal'))
  for (const y of [y0, y1]) f.on(out, u, y, 0.5, 8.4, 0.4, 1.0, [0.62, 0.16, 0.12], surfaceTag('metal'))
}

/**
 * The William J. Rutter Center (UCSF Community Center, Ricardo Legorreta, 2005; way/84812339, 1675 Owens): per the Chronicle
 * and UCSF — "a red stucco cube enlivened by an oversized purple-walled courtyard and, at one corner, a steep sculptural
 * tower", "the orange block's mock bell tower". Legorreta's way: deep-set square windows, few of them, saturated colour.
 * Four storeys; the tower stands to OSM's 48 m.
 */
export function rutterCenter(out: MeshBuilder, fit: Fit): void {
  const H = 20
  const RED: Rgb = [0.8, 0.36, 0.2]
  tower(out, { ...fit, height: H }, {
    height: H,
    tiers: [{ to: H, face: { kind: 'punched', material: 'stucco', wall: RED, glass: [0.12, 0.12, 0.14], pitch: 6, solid: 0.78, floor: 5 } }],
    roof: [0.55, 0.42, 0.36],
  })
  const st = surfaceTag('stucco')
  const f = frontWall(fit)
  // the purple-walled courtyard, cut into the street front: its back wall, two side walls, a purple frame
  const PURPLE: Rgb = [0.42, 0.22, 0.52]
  const cu = -f.L * 0.15, cw = Math.min(16, f.L * 0.3)
  f.on(out, cu, H * 0.45, 0.1, cw, H * 0.9, 0.2, PURPLE, st)
  for (const s2 of [-1, 1]) f.on(out, cu + s2 * cw / 2, H * 0.45, 2, 0.6, H * 0.9, 4, PURPLE, st)
  f.on(out, cu, H * 0.92, 2, cw + 0.6, 0.6, 4, [0.95, 0.75, 0.2], st)
  // the tower at the front's east end: a tall orange-red shaft with slit windows and an open lantern top
  const T = Math.max(36, Math.min(fit.height > 30 ? fit.height : 48, 50))
  const tu = f.L / 2 - 4
  f.on(out, tu, T / 2, -3, 7, T, 7, [0.86, 0.45, 0.18], st)
  for (let y = H + 3; y < T - 6; y += 6) f.on(out, tu, y, 0.55, 0.6, 3.4, 0.2, [0.12, 0.12, 0.14], 0)
  f.on(out, tu, T - 3, 0.6, 3.6, 3, 0.2, [0.95, 0.75, 0.2], st)
}

/**
 * The 450 South Street garage (Chase Center; way/84808580): per the Chronicle, "a seven-level parking structure" whose
 * "thickly chiseled stucco" forms "angles and voids", "anchored by a concrete staircase". Drawn: off-white stucco skin
 * with deep angled voids in a shifting pattern across every long face, and a grey concrete stair tower at the corner.
 * (No usable photograph found: a reference would sharpen the void pattern.)
 */
export function garage450South(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 12 && fit.height < 30 ? fit.height : 20
  const WHITE2: Rgb = [0.9, 0.89, 0.85]
  tower(out, { ...fit, height: H }, {
    height: H,
    tiers: [{ to: H, face: { kind: 'blank', material: 'stucco', wall: WHITE2 } }],
    roof: [0.45, 0.45, 0.45],
  })
  const ring = towerRing(fit)
  const dark: Rgb = [0.16, 0.16, 0.17]
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 12) continue
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = tz, nz = -tx
    const P = (u: number, y: number, o: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
    // the voids: parallelograms leaning left or right by turns, a level apart, shifted each level
    for (let lv = 0; lv < Math.floor(H / 2.9); lv++) {
      const y0 = 1 + lv * 2.9, y1 = y0 + 1.9
      for (let u = 1.5 + (lv % 3) * 1.4; u < L - 4; u += 4.6) {
        const lean = ((lv + Math.round(u)) % 2 ? 1 : -1) * 0.9
        out.quad([P(u, y0, 0.06), P(u + 2.6, y0, 0.06), P(u + 2.6 + lean, y1, 0.06), P(u + lean, y1, 0.06)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], dark, 0)
      }
    }
  }
  // the concrete stair tower, standing out at the first corner
  const f = frontWall(fit)
  f.on(out, -f.L / 2 + 3, (H + 4) / 2, 2.5, 6, H + 4, 5, [0.6, 0.6, 0.58], surfaceTag('concrete'))
  for (let y = 3; y < H + 2; y += 3) f.on(out, -f.L / 2 + 3, y, 5.06, 3.6, 0.3, 0.1, dark, 0)
}

/**
 * A WORKING PIER SHED (waterfront audit, 2026-10-04): Pier 54's (way/288651155; Commons "Building on Pier 54 (2), October
 * 2020"): cream corrugated metal, roll-up doors and a few man doors along the long side, small windows, a low-pitched
 * roof. Was a two-storey brick block. Reusable for the other industrial pier sheds.
 */
export function pierShed(out: MeshBuilder, fit: Fit): void {
  shed(out, fit, [0.84, 0.79, 0.62])
}

/**
 * 184 Hooper Street (way/1493533717, operator CCA in OSM): the grey corrugated-metal shed across the campus path from
 * the main building's glass side (Mapillary 2019, off Hooper): tall plain walls, a low-pitched roof. Its 2025 state is
 * unverified (student housing was once proposed for the site). Until 2026-10-17 it wore the Simpson Makers Building.
 */
export function hooperShed(out: MeshBuilder, fit: Fit): void {
  shed(out, { ...fit, height: 9 }, [0.66, 0.67, 0.68])
  stripRoof(out, towerRing(fit), 9, 1.4, [0.55, 0.56, 0.57], 'metal')
}

function shed(out: MeshBuilder, fit: Fit, CREAM: Rgb): void {
  const H = fit.height > 4 && fit.height < 14 ? fit.height : 8
  tower(out, { ...fit, height: H }, {
    height: H,
    tiers: [{ to: H, face: { kind: 'fins', material: 'metal', wall: CREAM, glass: [0.74, 0.7, 0.55], pitch: 0.35, solid: 0.6, depth: 0.04, floor: H } }],
    roof: [0.42, 0.42, 0.4],
  })
  const f = frontWall(fit)
  const metal = surfaceTag('metal')
  for (let u = -f.L / 2 + 6, k = 0; u < f.L / 2 - 4; u += 14, k++) {
    if (k % 3 === 2) { f.on(out, u, 1.1, 0.06, 1.0, 2.2, 0.06, [0.68, 0.14, 0.12], metal); f.on(out, u + 2.5, 2.4, 0.06, 1.0, 0.8, 0.06, [0.15, 0.17, 0.2], 0) }
    else f.on(out, u, 2.2, 0.06, 4, 4.4, 0.08, [0.62, 0.62, 0.6], metal)
  }
}

/**
 * UCSF MEDICAL CENTER AT MISSION BAY (2015; Benioff Children's, Betty Irene Moore Women's, Bakar Cancer), way/24451951
 * on 4th Street — a 250 m generic beige block. From Commons ("UCSF Mission Bay Entrance", the Bakar entrance at
 * 1855 4th Street): a glazed ground storey, above it storeys of WHITE metal panel in deep horizontal bands with
 * ribbon windows between, a recessed glass top storey, and on 4th Street the entrance canopy on bright green columns
 * (`ucsfMbCanopy`, its own entry over the drop-off loop: the 4th Street face steps in and out too often for one edge).
 * OSM gives 24 m; it stands seven storeys. (Not yet: the warm cream panels of some blocks.)
 */
function ucsfMissionBayHospital(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.9, 0.9, 0.88], GLASS: Rgb = [0.3, 0.44, 0.5]
  const H = 31
  tower(out, fit, {
    height: H,
    base: { height: 5, face: { kind: 'curtain', wall: [0.75, 0.77, 0.77], glass: GLASS, pitch: 2.4, floor: 5, solid: 0.08, material: 'glass' } },
    tiers: [
      { to: H - 4, face: { kind: 'bands', wall: WHITE, glass: GLASS, floor: 4.4, solid: 0.5, material: 'metal' } },
      { to: H, inset: 1.5, face: { kind: 'curtain', wall: [0.7, 0.72, 0.72], glass: GLASS, pitch: 1.8, floor: 4, solid: 0.06, material: 'glass' } },
    ],
    roof: [0.62, 0.62, 0.6],
    crown: { kind: 'flat' },
  })
}

/** the hospital's entrance canopy on its green columns, over the drop-off loop on 4th Street (x east, z north) */
function ucsfMbCanopy(out: MeshBuilder, _fit: Fit): void {
  const GREEN: Rgb = [0.38, 0.62, 0.22]
  box(out, 0, 5.3, 0, 4, 0.25, 11, [0.72, 0.73, 0.72], surfaceTag('metal'))
  for (const z of [-9, -3, 3, 9]) box(out, -3.4, 2.6, z, 0.45, 2.6, 0.45, GREEN, surfaceTag('metal'))
}


/**
 * FIVE 88 (2016, David Baker Architects; affordable housing, 588 Mission Bay Blvd North), way/16085213 — a generic block.
 * From the architect's and AIA/HUD award descriptions: five storeys of pale cement plaster with cedar accents; the
 * SOUTH-WEST corner, the neighbourhood's gateway, clad in perforated weathering steel over a row of tilting textured
 * concrete "dancing columns"; at the NORTH-WEST corner a five-storey tower in white standing-seam aluminium. Front
 * 180, so the model's frame is the world's (x east, z north).
 */
export function five88(out: MeshBuilder, fit: Fit): void {
  const PLASTER: Rgb = [0.84, 0.84, 0.82], CEDAR: Rgb = [0.6, 0.4, 0.24], CORTEN: Rgb = [0.36, 0.19, 0.11]
  const ALU: Rgb = [0.92, 0.93, 0.93], CONC: Rgb = [0.62, 0.61, 0.58]
  const H = 16
  tower(out, fit, {
    height: H,
    base: { height: 4.2, face: { kind: 'punched', wall: [0.7, 0.7, 0.68], glass: [0.2, 0.26, 0.3], pitch: 4, floor: 4.2, solid: 0.35, material: 'concrete' } },
    tiers: [{ to: H, face: { kind: 'punched', wall: PLASTER, glass: [0.22, 0.26, 0.3], pitch: 2.6, floor: 2.95, solid: 0.55, material: 'stucco' }, cornice: { depth: 0.2, height: 0.3 } }],
    roof: [0.5, 0.5, 0.5],
    crown: { kind: 'flat' },
  })
  const ring = towerRing(fit)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
  const metal = surfaceTag('metal')
  // the weathering-steel corner, south-west, standing a little proud, over the open ground floor
  const C = 20
  box(out, x0 + C / 2 - 0.3, 4.2 + (H - 4.2) / 2 + 0.6, z0 + C / 2 - 0.3, C / 2, (H - 4.2) / 2 + 0.6, C / 2, CORTEN, metal)
  // the dancing columns along both street faces of the corner, each tipped a different way
  for (let k = 0; k < 6; k++) {
    const t = 1.5 + k * 3.3, lean = [0.9, -0.7, 1.1, -0.5, 0.6, -1.0][k]
    strut(out, [x0 + t, 0, z0 - 0.8], [x0 + t + lean, 4.2, z0 - 0.8], 0.4, 0.4, CONC, surfaceTag('concrete'))
    strut(out, [x0 - 0.8, 0, z0 + t], [x0 - 0.8, 4.2, z0 + t + lean], 0.4, 0.4, CONC, surfaceTag('concrete'))
  }
  // the white aluminium tower at the north-west corner, a storey above the rest
  box(out, x0 + 5.5, (H + 3) / 2, z1 - 5.5, 5.8, (H + 3) / 2, 5.8, ALU, metal)
  for (let y = 4; y < H + 2; y += 2.95) box(out, x0 + 5.5, y + 1.3, z1 - 5.5, 5.85, 0.7, 2.2, [0.24, 0.28, 0.32], surfaceTag('glass'))
  // cedar: tall slatted panels between the windows along the north and east faces
  for (let u = x0 + 16; u < x1 - 4; u += 9) box(out, u, 9.5, z1 + 0.12, 0.9, 5.2, 0.12, CEDAR, 0)
  for (let v = z0 + 6; v < z1 - 12; v += 9) box(out, x1 + 0.12, 9.5, v, 0.12, 5.2, 0.9, CEDAR, 0)
}

/**
 * MB360 (2015, MVE + Ignition Architecture), 1200 4th Street, way/18852525 — a generic block. From Ignition's project
 * text: "the Barcode", pale vertical cement-plaster fins against a pattern of blue and violet glass, and on the 4th
 * Street front "the Blue Slice", vertical bands of blue-glazed balconies between tiled recesses. Front 90 (4th
 * Street, east).
 */
export function mb360(out: MeshBuilder, fit: Fit): void {
  const H = 20
  tower(out, fit, {
    height: H,
    base: { height: 4.5, face: { kind: 'curtain', wall: [0.5, 0.52, 0.55], glass: [0.3, 0.38, 0.46], pitch: 3, floor: 4.5 } },
    tiers: [{ to: H, face: { kind: 'fins', wall: [0.9, 0.89, 0.86], glass: [0.34, 0.36, 0.62], pitch: 1.9, floor: 3.1, solid: 0.42, depth: 0.45, material: 'stucco' } }],
    roof: [0.5, 0.5, 0.5],
    crown: { kind: 'parapet', height: 1, colour: [0.9, 0.89, 0.86] },
  })
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring))
  const at = (u: number, o: number): [number, number] => [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
  // the Blue Slice: vertical bands of blue-glazed balconies standing out of the 4th Street front
  for (let u = -e.L / 2 + 6; u < e.L / 2 - 4; u += 8) {
    for (let y = 4.5; y < H - 1; y += 3.1) {
      const [x, z] = at(u, 0.8)
      boxAlong(out, x, y + 0.55, z, 2.4, 0.55, 0.8, e.heading, [0.22, 0.42, 0.72], surfaceTag('glass'))
      boxAlong(out, x, y + 0.08, z, 2.5, 0.08, 0.85, e.heading, [0.85, 0.85, 0.83], surfaceTag('concrete'))
    }
  }
}

/**
 * The THIRD STREET GARAGE (UCSF Mission Bay), way/27369503: a parking structure wrapped in white perforated-metal fins
 * set in a zigzag, over a ground storey painted with a mural (Mapillary on Third Street, 2026-10-04) — was a generic
 * office block.
 */
export function thirdStreetGarage(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, {
    height: 25,
    base: { height: 4, face: { kind: 'punched', wall: [0.3, 0.42, 0.5], glass: [0.85, 0.6, 0.3], pitch: 2.2, floor: 4, solid: 0.5, material: 'stucco' } },
    tiers: [{ to: 25, face: { kind: 'fins', wall: [0.93, 0.93, 0.92], glass: [0.18, 0.18, 0.2], pitch: 1.2, floor: 3.5, solid: 0.55, depth: 0.6, material: 'metal' } }],
    roof: [0.45, 0.45, 0.45],
    crown: { kind: 'flat' },
  })
}

/**
 * Owens Street Garage (UCSF, way/142843006), Mapillary frame on Owens (2026-10-04): nine open decks wrapped in a
 * patchwork of perforated bronze panels, light and dark, hung a little proud of the slab edges with slots between;
 * a mural-painted screen wall along the pavement at the foot.
 */
export function owensGarage(out: MeshBuilder, fit: Fit): void {
  const H = 29
  const DARK: Rgb = [0.27, 0.22, 0.16]
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 3, face: { kind: 'blank', wall: [0.42, 0.4, 0.37], material: 'stucco' } },
    tiers: [{ to: H, face: { kind: 'fins', material: 'metal', wall: DARK, glass: [0.1, 0.1, 0.1], pitch: 1.6, solid: 0.5, depth: 0.3, floor: 2.9 } }],
    roof: [0.4, 0.4, 0.4],
    crown: { kind: 'flat' },
  })
  const metal = surfaceTag('metal')
  // the patchwork, on every wall: panels of three bronzes, staggered floor by floor (a fixed hash, so every load lays
  // them the same)
  const TONES: Rgb[] = [[0.47, 0.38, 0.26], [0.33, 0.27, 0.19], [0.56, 0.47, 0.33]]
  const ring = towerRing(fit)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 4) continue
    for (let fl = 0; fl < 9; fl++) {
      const y = 3 + fl * 2.9
      if (y + 2.6 > H) break
      let k = fl * 7 + i * 31
      for (let u = -e.L / 2 + 0.6 + (fl % 3) * 0.9; u < e.L / 2 - 1.2; ) {
        k = (k * 1103515245 + 12345) & 0x7fffffff
        const w = 2.2 + (k % 5) * 0.6
        const w2 = Math.min(w, e.L / 2 - 0.4 - u)
        if (k % 7 !== 0) boxAlong(out, e.mid.x + e.tx * (u + w2 / 2) + e.nx * 0.4, y + 1.3, e.mid.z + e.tz * (u + w2 / 2) + e.nz * 0.4, (w2 - 0.15) / 2, 1.3, 0.04, e.heading, TONES[k % 3], metal)
        u += w
      }
    }
  }
  const f = frontWall(fit)
  // the mural screen along the pavement
  const MURAL: Rgb[] = [[0.42, 0.44, 0.48], [0.5, 0.42, 0.36], [0.36, 0.4, 0.38]]
  for (let u = -f.L / 2 + 2, i = 0; u < f.L / 2 - 2; u += 4, i++) f.on(out, u, 1.4, 0.2, 3.9, 2.8, 0.1, MURAL[i % 3], surfaceTag('stucco'))
}

/**
 * 1670 Owens Street garage (way/46263441), Mapillary frame on Owens (2026-10-04): a low parking structure screened in
 * dark perforated metal mesh between a steel frame of posts and rails, over a concrete kerb wall; rooftop plant behind.
 */
export function owens1670Garage(out: MeshBuilder, fit: Fit): void {
  const H = 16
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 1.2, face: { kind: 'blank', wall: [0.62, 0.6, 0.56], material: 'concrete' } },
    tiers: [{ to: H, face: { kind: 'fins', material: 'metal', wall: [0.36, 0.32, 0.27], glass: [0.3, 0.27, 0.23], pitch: 4.5, solid: 0.12, depth: 0.25, floor: 3.6 } }],
    roof: [0.45, 0.45, 0.45],
    crown: { kind: 'parapet', height: 1.1, colour: [0.3, 0.29, 0.27], material: 'metal' },
  })
  // the steel frame on every wall: posts every 4.5 m and a rail at each deck, a hair proud of the mesh
  const STEEL: Rgb = [0.46, 0.44, 0.4], metal = surfaceTag('metal')
  const ring = towerRing(fit)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 3) continue
    const at = (u: number, y: number, w: number, h: number): void =>
      boxAlong(out, e.mid.x + e.tx * u + e.nx * 0.3, y, e.mid.z + e.tz * u + e.nz * 0.3, w / 2, h / 2, 0.08, e.heading, STEEL, metal)
    const n = Math.max(1, Math.round(e.L / 4.5))
    for (let k = 0; k <= n; k++) at(-e.L / 2 + (k * e.L) / n, (1.2 + H) / 2, 0.22, H - 1.2)
    for (let y = 1.2 + 3.6; y < H - 1; y += 3.6) at(0, y, e.L, 0.2)
  }
}

/**
 * California College of the Arts, the Simpson Family Makers Building (Studio Gang, 2024; 145 Hooper Street, the lot
 * between the main building's NE end, Hooper and 7th). OSM maps the lot only as `amenity=university` (way/1427026192),
 * not as a building, so the bake has nothing there and this stands on its own (lat/lon/size in the manifest).
 * Until 2026-10-17 it was drawn on way/1493533717 (184 Hooper), the grey metal shed across the path from the main
 * building's campus side — the Commons photograph's own geotag (37.768267, -122.398958) is on the 145 Hooper lot.
 *
 * Commons "CCA Dec 21 2024 1.jpg" (the Hooper front) and Mapillary panoramas on 7th Street (Aug 2025): the "double
 * ground" — a board-formed concrete lower storey over the site with tall dark-framed windows and the college's name
 * cut into it, its roof a planted terrace (the upper ground); and rising from it on the Hooper front a timber
 * pavilion, three storeys of warm boards crossed by a dark steel frame — a beam at every floor and V braces between,
 * windows in alternate triangles. Local +z is the Hooper front (NW), +x runs NE towards 7th Street.
 * GUESSED: the building's extent on the lot (the 7th Street end is still a fenced car park in 2025), the pavilion's
 * depth, and the second timber pavilion Studio Gang describe, which no photograph here shows (left out).
 */
export function ccaExpanded(out: MeshBuilder, fit: Fit): void {
  const H = 17, BASE = 5.5
  const CONC: Rgb = [0.7, 0.69, 0.66], WOOD: Rgb = [0.68, 0.5, 0.33], STEEL: Rgb = [0.13, 0.13, 0.14]
  const hx = fit.hx, hz = fit.hz
  // the pavilion: the Hooper front, from 7 m in from the SW end to the NE end, 18 m deep; the lower storey all round it
  const PX = -hx + 7, PZ = hz - 18
  const pav = [{ x: PX, z: PZ }, { x: hx, z: PZ }, { x: hx, z: hz }, { x: PX, z: hz }]
  const low = [{ x: -hx, z: -hz }, { x: hx, z: -hz }, { x: hx, z: PZ }, { x: PX, z: PZ }, { x: PX, z: hz }, { x: -hx, z: hz }]
  const lowFace: Face = { kind: 'punched', wall: CONC, glass: [0.22, 0.27, 0.27], pitch: 7, solid: 0.6, floor: BASE, material: 'concrete' }
  tower(out, { ...fit, ring: low, height: BASE }, { height: BASE, tiers: [{ to: BASE, face: lowFace }], roof: [0.42, 0.5, 0.33], crown: { kind: 'parapet', height: 1.1, colour: CONC, material: 'concrete' } })
  tower(out, { ...fit, ring: pav, hx: (hx - PX) / 2, hz: 9, height: H }, {
    height: H,
    base: { height: BASE, face: lowFace },
    tiers: [{ to: H, face: { kind: 'blank', wall: WOOD, material: 'clapboard' } }],
    roof: [0.5, 0.5, 0.5],
    crown: { kind: 'parapet', height: 0.5, colour: WOOD, material: 'clapboard' },
  })
  // the upper ground: planted beds and a few young trees on the terrace
  const GREEN: Rgb = [0.36, 0.48, 0.27]
  for (let x = -hx + 4; x < hx - 6; x += 9) {
    for (let z = -hz + 4; z < PZ - 4; z += 10) {
      box(out, x + 2, BASE + 0.35, z + 2.5, 3, 0.35, 2.5, GREEN, 0)
      if ((Math.round(x) + Math.round(z)) % 3 === 0) prism(out, x + 2, z + 2.5, BASE + 0.7, BASE + 4, 1.4, 6, [0.3, 0.42, 0.25], 0, 0.2)
    }
  }
  const ring = pav, metal = surfaceTag('metal'), glass = surfaceTag('glass')
  const FL = (H - BASE) / 3
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 10) continue
    const P = (u: number, y: number, o: number): [number, number, number] => [e.mid.x + e.tx * u + e.nx * o, y, e.mid.z + e.tz * u + e.nz * o]
    const n = Math.max(2, Math.round(e.L / 6.5)), b = e.L / n
    for (let f = 0; f < 3; f++) {
      const y0 = BASE + f * FL, y1 = y0 + FL
      boxAlong(out, P(0, 0, 0.45)[0], y0 + 0.2, P(0, 0, 0.45)[2], e.L / 2 + 0.3, 0.2, 0.2, e.heading, STEEL, metal)
      for (let k = 0; k < n; k++) {
        const u0 = -e.L / 2 + k * b
        // V braces: down to the middle of the bay, the next floor up the other way
        const mid = f % 2 === 0 ? y0 : y1, ends = f % 2 === 0 ? y1 : y0
        strut(out, P(u0, ends, 0.45), P(u0 + b / 2, mid, 0.45), 0.25, 0.25, STEEL, metal)
        strut(out, P(u0 + b / 2, mid, 0.45), P(u0 + b, ends, 0.45), 0.25, 0.25, STEEL, metal)
        // the window in the triangle that opens upward
        const wy = f % 2 === 0 ? y0 + FL * 0.62 : y0 + FL * 0.38
        boxAlong(out, P(u0 + b / 2, 0, 0.06)[0], wy, P(u0 + b / 2, 0, 0.06)[2], b * 0.2, FL * 0.22, 0.04, e.heading, [0.3, 0.38, 0.42], glass)
      }
    }
    const top = P(0, 0, 0.45)
    boxAlong(out, top[0], H - 0.2, top[2], e.L / 2 + 0.3, 0.2, 0.2, e.heading, STEEL, metal)
  }
  // the name cut into the concrete at the street end
  const f = frontWall(fit)
  const at = edgeAt(ring, edgeFacing(ring, 0))
  const sx = at.mid.x + at.tx * (f.L / 2 - 8) + at.nx * 0.05, sz = at.mid.z + at.tz * (f.L / 2 - 8) + at.nz * 0.05
  signText(out, 'CALIFORNIA COLLEGE OF THE ARTS', sx, 3.2, sz, 0.4, [0.35, 0.34, 0.32], { heading: at.heading })
}

/**
 * California College of the Arts, 1111 Eighth Street (way/39997517): the 1950s Pacific Greyhound bus maintenance
 * garage, CCA's since 1997 (the "Montgomery Campus"). Rebuilt 2026-10-17 from the owner's Street View (Feb 2025),
 * Mapillary 2016 (8th St, Irwin St) and 2019 (the campus side off Hooper), Commons "Montgomery Building, California
 * College of the Arts.jpg" and "California College of the Arts, San Francisco campus (2019) -1/-2.jpg":
 *  - one tall storey, eaves at ~8.5 m, under a shallow gable whose ends are the 8th Street front and the NE end;
 *    a plain white fascia along the eaves and up the rakes;
 *  - the walls a grid of pale glass in ORANGE-RED steel sash (two panes wide and three high to each 3 m bay, a
 *    heavier red mullion between bays) over a 1.6 m grey concrete base — the whole campus side (NW), most of
 *    8th Street and the NE end;
 *  - the Irwin Street side (SE), and the SE ends of 8th Street and of the NE end, cream stucco with two rows of
 *    red-framed windows (Mapillary 2016, Commons 2019);
 *  - on 8th Street the recessed glazed entrance under a canopy carrying CALIFORNIA COLLEGE OF THE ARTS and
 *    MONTGOMERY CAMPUS; on the NE end "CCA" in big teal letters on the glass (2019; not seen since);
 *  - rows of tilted solar panels across the roof (2019 aerial), which read from the street as a row of small
 *    gable ends along the eave; bike hoops and a bike-share dock on the 8th Street pavement.
 * Model frame (manifest front 45): +z is the 8th Street front (SW), −z the NE end, +x the campus side (NW), −x Irwin.
 */
export function ccaMain(out: MeshBuilder, fit: Fit): void {
  const H = 8.5, BASE = 1.6, RISE = 1.8
  const RED: Rgb = [0.8, 0.27, 0.16], PANE: Rgb = [0.82, 0.87, 0.9], CONC: Rgb = [0.58, 0.58, 0.56]
  const CREAM: Rgb = [0.87, 0.85, 0.79], WHITE: Rgb = [0.95, 0.95, 0.93], ROOFC: Rgb = [0.58, 0.58, 0.57]
  const metal = surfaceTag('metal'), glass = surfaceTag('glass')
  const ring = towerRing(fit)
  type Side = 'eighth' | 'ne' | 'nw' | 'se'
  const sideOf = (i: number): Side => {
    const e = edgeAt(ring, i)
    return Math.abs(e.nz) >= Math.abs(e.nx) ? (e.nz > 0 ? 'eighth' : 'ne') : (e.nx > 0 ? 'nw' : 'se')
  }
  const edges = (s: Side): number[] => ring.map((_, i) => i).filter((i) => sideOf(i) === s)
  const glazed: Face = { kind: 'curtain', wall: RED, glass: PANE, pitch: 1.5, floor: (H - BASE) / 3, material: 'glass' }
  const stucco: Face = { kind: 'blank', wall: CREAM, material: 'stucco' }
  tower(out, { ...fit, height: H }, {
    height: H,
    tiers: [
      { to: BASE, face: { kind: 'blank', wall: CONC, material: 'concrete' }, faceOverrides: [{ edges: edges('se'), face: stucco }] },
      { to: H, face: glazed, faceOverrides: [{ edges: edges('se'), face: stucco }] },
    ],
    roof: ROOFC,
    crown: { kind: 'flat' },
  })
  const xs = ring.map((p) => p.x), zs = ring.map((p) => p.z)
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs)
  const xm = (x0 + x1) / 2, hw = (x1 - x0) / 2
  const roofY = (x: number): number => H + RISE * Math.max(0, 1 - Math.abs(x - xm) / hw)

  /** A wall segment from a to b (outward normal on the right of a→b), as a little frame for parts. */
  const wall = (a: { x: number; z: number }, b: { x: number; z: number }) => {
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = tz, nz = -tx
    const heading = Math.atan2(tz, -tx)
    const at = (u: number, y: number, o: number, w: number, h: number, d: number, c: Rgb, tag: number): void =>
      boxAlong(out, a.x + tx * u + nx * o, y, a.z + tz * u + nz * o, w / 2, h / 2, d / 2, heading, c, tag)
    return { a, b, L, tx, tz, nx, nz, heading, at }
  }
  type Wall = ReturnType<typeof wall>
  /** the red bay mullions and rails on a glazed stretch [u0, u1] of a wall */
  const sash = (w: Wall, u0: number, u1: number): void => {
    const n = Math.max(1, Math.round((u1 - u0) / 3))
    for (let k = 0; k <= n; k++) w.at(u0 + ((u1 - u0) * k) / n, (BASE + H) / 2, 0.06, 0.24, H - BASE, 0.14, RED, metal)
    w.at((u0 + u1) / 2, BASE + 0.08, 0.07, u1 - u0, 0.16, 0.16, RED, metal)
    w.at((u0 + u1) / 2, H - 0.1, 0.07, u1 - u0, 0.2, 0.16, RED, metal)
  }
  /** cream stucco with two rows of red-framed windows over a stretch [u0, u1] of a wall */
  const twoRows = (w: Wall, u0: number, u1: number, overlay: boolean): void => {
    if (overlay) w.at((u0 + u1) / 2, H / 2, 0.05, u1 - u0, H, 0.06, CREAM, surfaceTag('stucco'))
    for (const [ya, yb] of [[2.3, 4.3], [5.3, 7.5]]) {
      const n = Math.max(1, Math.round((u1 - u0 - 2) / 2.6))
      const s = (u1 - u0 - 2) / n
      w.at((u0 + u1) / 2, (ya + yb) / 2, 0.1, u1 - u0 - 2, yb - ya, 0.04, PANE, glass)
      w.at((u0 + u1) / 2, ya - 0.06, 0.13, u1 - u0 - 1.8, 0.14, 0.08, RED, metal)
      w.at((u0 + u1) / 2, yb + 0.06, 0.13, u1 - u0 - 1.8, 0.14, 0.08, RED, metal)
      for (let k = 0; k <= n; k++) w.at(u0 + 1 + k * s, (ya + yb) / 2, 0.13, k % 2 ? 0.08 : 0.16, yb - ya, 0.08, RED, metal)
    }
  }

  // the two long sides: the campus side all glass, Irwin Street stucco and windows (edges as the ring has them)
  for (const i of edges('nw')) { const e = edgeAt(ring, i); if (e.L > 4) sash(wall(e.a, e.b), 0, e.L) }
  for (const i of edges('se')) { const e = edgeAt(ring, i); if (e.L > 6) twoRows(wall(e.a, e.b), 0, e.L, false) }
  // the gable ends as straight walls across the box: 8th Street (+z) runs from the campus corner (+x) to Irwin (−x)
  const zF = Math.max(...edges('eighth').map((i) => (ring[i].z + ring[(i + 1) % ring.length].z) / 2), z1 - 1)
  const zB = Math.min(...edges('ne').map((i) => (ring[i].z + ring[(i + 1) % ring.length].z) / 2), z0 + 1)
  const front = wall({ x: x1, z: zF }, { x: x0, z: zF })
  const back = wall({ x: x0, z: zB }, { x: x1, z: zB })
  const SOLID = 0.38      // the share of each end, at its Irwin corner, that is stucco rather than glass
  sash(front, 0, front.L * (1 - SOLID))
  twoRows(front, front.L * (1 - SOLID), front.L, true)
  twoRows(back, 0, back.L * SOLID, true)
  sash(back, back.L * SOLID, back.L)

  // the shallow gable roof, ridge along the building, white fascia on the eaves and up both rakes
  roof(out, x0, x1, z0, z1, H, RISE, hw, 0, ROOFC)
  for (const x of [x0, x1]) box(out, x, H + 0.25, (z0 + z1) / 2, 0.12, 0.35, (z1 - z0) / 2 + 0.1, WHITE, metal)
  for (const [z, s] of [[z1 + 0.08, 1], [z0 - 0.08, -1]] as const) {
    strut(out, [x0 - 0.1, H + 0.25, z], [xm, H + RISE + 0.25, z], 0.7, 0.24, WHITE, metal)
    strut(out, [xm, H + RISE + 0.25, z], [x1 + 0.1, H + RISE * 0 + 0.25, z], 0.7, 0.24, WHITE, metal)
    // the gable triangle, glazed in the same red sash where the wall below is glass
    const glassFrom = s > 0 ? x0 + (x1 - x0) * SOLID : x0 + (x1 - x0) * SOLID
    const tri = (xa: number, xb: number, c: Rgb, tag: number): void => {
      const ya = roofY(xa), yb = roofY(xb)
      const q: [number, number, number][] = [[xa, H, z], [xb, H, z], [xb, yb, z], [xa, ya, z]]
      out.quad(s > 0 ? q : [q[1], q[0], q[3], q[2]], [0, 0, s], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
    }
    tri(x0, glassFrom, CREAM, surfaceTag('stucco'))
    tri(glassFrom, xm, PANE, glass)
    tri(xm, x1, PANE, glass)
    for (let x = glassFrom + 1.5; x < x1 - 0.5; x += 1.5) {
      const top = roofY(x)
      if (top - H > 0.3) box(out, x, (H + top) / 2, z + s * 0.04, 0.06, (top - H) / 2, 0.04, RED, metal)
    }
  }

  // solar arrays: rows along the ridge, tilted to the south-east, in blocks; seen end-on from the street they are the
  // row of little gables along the eave
  const inside = (x: number, z: number): boolean => {
    let c = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j]
      if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) c = !c
    }
    return c
  }
  const PV: Rgb = [0.12, 0.15, 0.24]
  for (let xr = x0 + 5; xr < x1 - 5; xr += 3.4) {
    if (Math.abs(xr - xm) < 3) continue
    const yb = roofY(xr) + 0.15
    for (let za = z0 + 6; za < z1 - 10; za += 27) {
      const zb = Math.min(za + 19, z1 - 6)
      if (!inside(xr - 2, za) || !inside(xr + 2, zb)) continue
      const lo: [number, number, number][] = [[xr - 0.8, yb, zb], [xr - 0.8, yb, za], [xr + 0.8, yb + 0.75, za], [xr + 0.8, yb + 0.75, zb]]
      out.quad(lo, [-0.42, 0.9, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], PV, metal)
      for (const z of [za, zb]) {
        const d = z === za ? -1 : 1
        const t: [number, number, number][] = [[xr - 0.8, yb, z], [xr + 0.8, yb, z], [xr + 0.8, yb + 0.75, z], [xr + 0.8, yb + 0.75, z]]
        out.quad(d > 0 ? t : [t[1], t[0], t[3], t[2]], [0, 0, d], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.55, 0.55, 0.55], metal)
      }
      box(out, xr - 0.8, yb + 0.04, (za + zb) / 2, 0.05, 0.05, (zb - za) / 2, RED, metal)
    }
  }
  // rooftop plant along the ridge
  for (let k = 0; k < 5; k++) {
    const z = z0 + 12 + ((z1 - z0 - 24) * k) / 4
    if (inside(xm, z)) box(out, xm + (k % 2 ? 3 : -3), roofY(xm + 3) + 0.7, z, 1.4, 0.7, 2.2, [0.7, 0.7, 0.68], metal)
  }

  // 8th Street: the recessed glazed entrance under its canopy, the name on top and the campus name on its fascia
  const ue = front.L * 0.32                   // from the campus corner
  front.at(ue, 1.7, 0.12, 12, 3.4, 0.05, [0.3, 0.36, 0.4], glass)
  for (let k = -3; k <= 3; k++) front.at(ue + k * 2, 1.7, 0.16, 0.12, 3.4, 0.06, [0.25, 0.25, 0.27], metal)
  front.at(ue, 3.75, 1.3, 15, 0.4, 2.6, [0.7, 0.71, 0.72], metal)
  {
    const p = (o: number): [number, number] => [front.a.x + front.tx * ue + front.nx * o, front.a.z + front.tz * ue + front.nz * o]
    const [sx, sz] = p(2.62)
    signText(out, 'MONTGOMERY CAMPUS', sx, 3.75, sz, 0.26, [0.95, 0.95, 0.93], { heading: front.heading })
    const [tx, tz] = p(2.2)
    signText(out, 'CALIFORNIA COLLEGE OF THE ARTS', tx, 4.3, tz, 0.55, [0.93, 0.93, 0.92], { heading: front.heading })
  }
  // the NE end: "cca" in teal on the glass, and the name across its top
  {
    const p = (u: number, o: number): [number, number] => [back.a.x + back.tx * u + back.nx * o, back.a.z + back.tz * u + back.nz * o]
    const [cx, cz] = p(back.L * 0.58, 0.12)
    signText(out, 'cca', cx, 4.2, cz, 3.6, [0.22, 0.66, 0.66], { heading: back.heading })
    const [nx, nz] = p(back.L * 0.78, 0.12)
    signText(out, 'California College of the Arts', nx, 7.1, nz, 0.8, [0.95, 0.95, 0.93], { heading: back.heading })
  }
  // on the 8th Street pavement: a row of bike hoops by the entrance, a bike-share dock towards Irwin
  const g = (u: number, o: number): number => fit.groundAt?.(front.a.x + front.tx * u + front.nx * o, front.a.z + front.tz * u + front.nz * o) ?? 0
  const STEEL: Rgb = [0.5, 0.5, 0.52]
  for (let k = 0; k < 6; k++) {
    const u = ue - 9.5 - k * 1.1, y = g(u, 1.6)
    const P = (du: number, h: number): [number, number, number] => [front.a.x + front.tx * (u + du) + front.nx * 1.6, y + h, front.a.z + front.tz * (u + du) + front.nz * 1.6]
    strut(out, P(-0.35, 0), P(-0.35, 0.85), 0.06, 0.06, STEEL, metal)
    strut(out, P(0.35, 0), P(0.35, 0.85), 0.06, 0.06, STEEL, metal)
    strut(out, P(-0.35, 0.85), P(0.35, 0.85), 0.06, 0.06, STEEL, metal)
  }
  const ud = front.L * 0.72
  front.at(ud, g(ud, 2.2) + 1.1, 2.2, 0.5, 2.2, 0.35, [0.16, 0.38, 0.62], metal)
  for (let k = 1; k <= 9; k++) front.at(ud + k * 0.9, g(ud + k * 0.9, 2.2) + 0.5, 2.2, 0.16, 1.0, 0.22, [0.82, 0.83, 0.84], metal)
}

/**
 * 100 HOOPER (Kilroy Realty, 2018–19, Pfau Long; Adobe's offices among its tenants): two long four-storey office bars
 * between Hooper Street and the Caltrain cut, 7th Street at their NE ends, a bridge between them over the campus path
 * (way/1416816164). From Mapillary (2024 from a Caltrain window, 2025 panoramas at Hooper & 7th, 2020 on 7th):
 *  - a tall glazed ground storey, dark glass set behind pale concrete piers;
 *  - above it three storeys of bronze-brown metal panel alternating with dark glass, in a pale concrete frame — a
 *    slab-edge band at each floor and heavy verticals every few bays — under a pale parapet band;
 *  - the Hooper bar's corner at Hooper & 7th swept round in a curve (its OSM corner is square);
 *  - the rear bar's 7th Street end a plain board-formed concrete wall carrying the red Adobe logo at the top.
 * Model frame (manifest front 225): +z is the 7th Street end (NE), +x the Hooper side (SE).
 * GUESSED: the frame's exact rhythm, the far (SW) ends (no photograph; drawn like the rest), the rooftop.
 */
/** The edge whose outward normal is most nearly +z (edgeFacing favours long edges, and the 7th Street ends are short). */
function endZ(ring: { x: number; z: number }[]): number {
  let best = 0
  for (let i = 0; i < ring.length; i++) if (edgeAt(ring, i).L > 5 && edgeAt(ring, i).nz > edgeAt(ring, best).nz) best = i
  return best
}

function hooperBar(out: MeshBuilder, fit: Fit, rear: boolean): void {
  const G = 6, FL = 4.5, TOP = G + 3 * FL, H = TOP + 1.2
  const PALE: Rgb = [0.82, 0.81, 0.78], BRONZE: Rgb = [0.29, 0.21, 0.16], DARK: Rgb = [0.12, 0.14, 0.17]
  const conc = surfaceTag('concrete')
  let ring = towerRing(fit)
  if (!rear) {
    // the curved corner at Hooper & 7th: the 7th Street end's corner on the Hooper (+x) side, rounded
    const nearEnd = endZ(ring)
    const e = edgeAt(ring, nearEnd)
    const ci = e.a.x > e.b.x ? nearEnd : (nearEnd + 1) % ring.length
    const p = ring[ci], prev = ring[(ci - 1 + ring.length) % ring.length], next = ring[(ci + 1) % ring.length]
    const d0 = Math.hypot(p.x - prev.x, p.z - prev.z) || 1, d1 = Math.hypot(next.x - p.x, next.z - p.z) || 1
    const r = Math.min(11, d0 / 2, d1 / 2)
    const a = { x: p.x + ((prev.x - p.x) / d0) * r, z: p.z + ((prev.z - p.z) / d0) * r }
    const b = { x: p.x + ((next.x - p.x) / d1) * r, z: p.z + ((next.z - p.z) / d1) * r }
    const arc: { x: number; z: number }[] = []
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, u = 1 - t
      arc.push({ x: u * u * a.x + 2 * u * t * p.x + t * t * b.x, z: u * u * a.z + 2 * u * t * p.z + t * t * b.z })
    }
    ring = [...ring.slice(0, ci), ...arc, ...ring.slice(ci + 1)]
  }
  // the rear bar's 7th Street end: the short wall facing +z
  const nearIdx = rear ? [endZ(ring)] : []
  const blank: Face = { kind: 'blank', wall: [0.66, 0.65, 0.62], material: 'concrete' }
  tower(out, { ...fit, ring, height: H }, {
    height: H,
    base: { height: G, face: { kind: 'fins', wall: PALE, glass: DARK, pitch: 9, solid: 0.12, depth: 0.5, floor: G, material: 'concrete' } },
    tiers: [{
      to: TOP,
      face: { kind: 'punched', wall: BRONZE, glass: DARK, pitch: 3.2, solid: 0.4, floor: FL, material: 'metal' },
      faceOverrides: nearIdx.length ? [{ edges: nearIdx, face: blank }] : undefined,
    }],
    roof: [0.5, 0.5, 0.5],
    crown: { kind: 'parapet', height: 1.2, colour: PALE, material: 'concrete' },
  })
  // the pale frame: slab edges at every floor and heavy verticals, on the long walls and the curve alike
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (nearIdx.includes(i)) continue
    const at = (u: number, y: number, w: number, h: number, d: number): void =>
      boxAlong(out, e.mid.x + e.tx * u + e.nx * (d / 2), y, e.mid.z + e.tz * u + e.nz * (d / 2), w / 2, h / 2, d / 2, e.heading, PALE, conc)
    for (let k = 0; k < 3; k++) at(0, G + k * FL + 0.2, e.L + 0.3, 0.45, 0.4)
    if (e.L < 12) continue
    const n = Math.max(1, Math.round(e.L / 22))
    for (let k = 0; k <= n; k++) at(-e.L / 2 + (k * e.L) / n, (G + TOP) / 2, 1.1, TOP - G, 0.45)
  }
  for (const i of nearIdx) {
    const e = edgeAt(ring, i)
    // a strip of glass down the concrete end at its Hooper side, and the logo at the top of the other
    const P = (u: number, o: number): [number, number] => [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
    const [gx, gz] = P(e.L / 2 - 4, 0.05)
    boxAlong(out, gx, (G + TOP) / 2, gz, 3, (TOP - G) / 2, 0.05, e.heading, DARK, surfaceTag('glass'))
    const [sx, sz] = P(-e.L / 2 + 6, 0.12)
    signText(out, 'Adobe', sx, TOP - 1.3, sz, 1.3, [0.86, 0.12, 0.1], { heading: e.heading })
  }
}
export const hooperOffices = (out: MeshBuilder, fit: Fit): void => hooperBar(out, fit, false)
export const hooperOfficesRear = (out: MeshBuilder, fit: Fit): void => hooperBar(out, fit, true)

/** 100 Hooper's bridge between its two bars (way/1416816164, levels 1–3): glass and bronze, clear of the path below. */
export function hooperBridge(out: MeshBuilder, fit: Fit): void {
  const G = 6, TOP = G + 3 * 4.5
  box(out, 0, (G + TOP) / 2, 0, fit.hx, (TOP - G) / 2, fit.hz, [0.12, 0.14, 0.17], surfaceTag('glass'))
  for (let k = 0; k < 3; k++) box(out, 0, G + k * 4.5 + 0.3, 0, fit.hx + 0.02, 0.3, fit.hz + 0.05, [0.82, 0.81, 0.78], surfaceTag('concrete'))
  box(out, 0, TOP + 0.4, 0, fit.hx + 0.02, 0.4, fit.hz + 0.05, [0.38, 0.29, 0.22], surfaceTag('metal'))
}

/**
 * The Union Iron Works machine shops at Pier 70 (Building 113, 1886, and its neighbour; Commons "Union Iron Works
 * Historic District Machine Shop Building 113 (northwest corner at 20th Street).jpg", "Union Iron Works building on
 * Pier 70, September 2018.JPG" — Building 113's window rhythm was on the owner's reference list): two storeys of red
 * brick, a pier between every pair of tall round-arched windows, the ground storey's arches taller; over the middle a
 * raised NAVE clad in rust-brown, its gable ends the building's face — a fan of arched windows stepping up under the
 * rake — and low aisle roofs either side. The ridge runs the long way.
 */
export function uiwShop(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.44, 0.22, 0.17], RUST: Rgb = [0.42, 0.3, 0.23], ROOFC: Rgb = [0.3, 0.28, 0.26], DARKG: Rgb = [0.14, 0.15, 0.16]
  const WALL = 10
  tower(out, { ...fit, height: WALL }, {
    height: WALL,
    base: { height: 5, face: { kind: 'punched', wall: BRICK, glass: DARKG, pitch: 3, solid: 0.5, floor: 5, arched: true, material: 'brick' } },
    tiers: [{ to: WALL, face: { kind: 'punched', wall: BRICK, glass: DARKG, pitch: 3, solid: 0.55, floor: 5, arched: true, material: 'brick' }, cornice: { depth: 0.3, height: 0.5, colour: [0.4, 0.2, 0.15] } }],
    roof: ROOFC,
    crown: { kind: 'flat' },
  })
  const brick = surfaceTag('brick'), metal = surfaceTag('metal'), glass = surfaceTag('glass')
  // the piers, every two bays, on every wall
  const ring = towerRing(fit)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 8) continue
    const n = Math.round(e.L / 6)
    for (let k = 0; k <= n; k++) {
      const u = -e.L / 2 + (k * e.L) / n
      boxAlong(out, e.mid.x + e.tx * u + e.nx * 0.2, WALL / 2, e.mid.z + e.tz * u + e.nz * 0.2, 0.45, WALL / 2, 0.25, e.heading, BRICK, brick)
    }
  }
  // the nave: along the long axis, half the width, clerestory walls and a gable roof, rust-brown
  const along = fit.hx >= fit.hz
  const L = (along ? fit.hx : fit.hz) - 0.4, Wn = (along ? fit.hz : fit.hx) * 0.55
  const P = (u: number, y: number, v: number): [number, number, number] => (along ? [u, y, v] : [v, y, u])
  const C = WALL + 3.5, R = C + Wn * 0.55
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (const s of [-1, 1]) {
    // a clerestory wall, and the roof slope over it
    const [x, , z] = P(0, 0, s * Wn)
    box(out, x, (WALL + C) / 2, z, along ? L : 0.15, (C - WALL) / 2, along ? 0.15 : L, RUST, metal)
    const n: [number, number, number] = along ? [0, 1, s * 0.6] : [s * 0.6, 1, 0]
    const q: [number, number, number][] = [P(-L, C, s * (Wn + 0.4)), P(L, C, s * (Wn + 0.4)), P(L, R, 0), P(-L, R, 0)]
    out.quad(s > 0 ? q : [q[1], q[0], q[3], q[2]], n, uv, ROOFC, metal)
    // the clerestory's arched windows, every bay
    for (let u = -L + 3; u < L - 2; u += 6) {
      const [wx, , wz] = P(u, 0, s * (Wn + 0.1))
      box(out, wx, WALL + 1.75, wz, along ? 1 : 0.05, 1.2, along ? 0.05 : 1, DARKG, glass)
    }
  }
  // the gable ends: the rust-clad triangle over the clerestory, a fan of tall arched windows stepping up under the rake
  for (const e of [-1, 1]) {
    const face: [number, number, number][] = [P(e * L, WALL, -Wn), P(e * L, WALL, Wn), P(e * L, R, 0), P(e * L, R, 0)]
    const fn: [number, number, number] = along ? [e, 0, 0] : [0, 0, e]
    out.quad(e > 0 ? face : [face[1], face[0], face[3], face[2]], fn, uv, RUST, metal)
    const fan = 5
    for (let k = 0; k < fan; k++) {
      const v = (-1 + (2 * (k + 0.5)) / fan) * Wn * 0.8
      const top = R - Math.abs(v) * ((R - WALL) / Wn) - 1.2
      const h = Math.max(1.5, top - (WALL + 0.8))
      const [wx, , wz] = P(e * (L + 0.06), 0, v)
      box(out, wx, WALL + 0.8 + h / 2, wz, along ? 0.05 : Wn * 0.11, h / 2, along ? Wn * 0.11 : 0.05, DARKG, glass)
      const [ax, , az] = P(e * (L + 0.06), 0, v)
      box(out, ax, WALL + 0.8 + h + 0.25, az, along ? 0.05 : Wn * 0.07, 0.25, along ? Wn * 0.07 : 0.05, DARKG, glass)
    }
  }
}

export const MISSION_BAY: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  five88, mb360, thirdStreetGarage, owensGarage, owens1670Garage, ccaExpanded, ccaMain, hooperShed, hooperOffices, hooperOfficesRear, hooperBridge, uiwShop,
  pierShed, ucsfMissionBayHospital, ucsfMbCanopy,
  rutterCenter, garage450South,
  smithCardiovascular, helenDiller, missionHall,
  sparkSocial, sparkTent, sparkUmbrella, sparkTruck, stagecoachGreens, ucsfPritzker, dogpatchSawtooth, dogpatchBronzeBoxes, genentechHall, byersHall, gladstoneInstitutes, dropboxOwens,
}
