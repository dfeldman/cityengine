/**
 * HOSPITALS (audit, 2026-10-04). Modelled from Mapillary frames and the architects' descriptions; fitted to OSM's outline.
 *
 * `cpmcVanNess` — Sutter CPMC Van Ness Campus, 1101 Van Ness at Geary (SmithGroup, 2019; owner, 2026-10-03: "rendering as
 * a two-story partially underground building. reality is it's a huge metal structure with a tower"). The whole block,
 * Van Ness to Franklin, Geary to Post: a base of dark Virginia Mist granite, a four-storey podium of pale rain-screen
 * metal panels in long horizontal courses broken by tall glass bays and dark louvre strips, and the 12-storey patient
 * tower on the GEARY side (moved there after community review so its shadow falls on its own site) — glass corners,
 * metal-panel faces with window ribbons, a mechanical crown. Local frame: Geary (the front, `front: 171`) at +z.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { tower, towerRing, insetRing, faceBand } from '../tower.ts'
import { capPolygon } from '../../buildings.ts'
import { edgeAt, edgeFacing, boxAlong } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type P2 = { x: number; z: number }

/** the part of `ring` with z ≥ z0 (Sutherland–Hodgman against one line) */
export function clipZ(ring: P2[], z0: number): P2[] {
  const out: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const ain = a.z >= z0, bin = b.z >= z0
    if (ain) out.push(a)
    if (ain !== bin) { const t = (z0 - a.z) / (b.z - a.z); out.push({ x: a.x + (b.x - a.x) * t, z: z0 }) }
  }
  return out
}

const PANEL: Rgb = [0.64, 0.65, 0.66]
const GRANITE: Rgb = [0.24, 0.24, 0.25]
const GLASS: Rgb = [0.24, 0.31, 0.37]

export function cpmcVanNess(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const PODIUM = 22
  tower(out, { ...fit, height: PODIUM }, {
    height: PODIUM,
    base: { height: 6, face: { kind: 'curtain', material: 'granite', wall: GRANITE, glass: [0.18, 0.2, 0.22], pitch: 3, floor: 6 } },
    tiers: [{ to: PODIUM, face: { kind: 'bands', material: 'metal', wall: PANEL, glass: GLASS, solid: 0.72, floor: 4.0 } }],
    roof: [0.5, 0.5, 0.5],
  })
  // the tower: the Geary third of the block, 12 storeys, its faces panel and window ribbon, its corners glass
  let z1 = -Infinity, z0 = Infinity
  for (const p of ring) { z1 = Math.max(z1, p.z); z0 = Math.min(z0, p.z) }
  // (the Geary end is local −z: measured, the +z end stood on Post)
  const flip = ring.map((p) => ({ x: p.x, z: -p.z }))
  const tw = clipZ(flip, -z0 - Math.min(34, (z1 - z0) * 0.4)).map((p) => ({ x: p.x, z: -p.z })).reverse()
  if (tw.length >= 3) {
    const H = 64
    const inset = tw.map((p) => p)
    tower(out, { ...fit, ring: inset, height: H }, {
      height: H,
      base: { height: PODIUM, face: { kind: 'bands', material: 'metal', wall: PANEL, glass: GLASS, solid: 0.6, floor: 4.0 } },
      tiers: [
        { to: H - 6, face: { kind: 'bands', material: 'metal', wall: PANEL, glass: GLASS, solid: 0.5, floor: 3.8 } },
        { to: H, face: { kind: 'fins', material: 'metal', wall: [0.62, 0.63, 0.64], glass: [0.3, 0.32, 0.34], pitch: 0.8, solid: 0.5, depth: 0.15, floor: 6 } },
      ],
      roof: [0.45, 0.45, 0.45],
    })
    // the glass corner bays, full height, on the Geary face's two ends
    let xmin = Infinity, xmax = -Infinity, zmin = Infinity
    for (const p of tw) { xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x); zmin = Math.min(zmin, p.z) }
    for (const x of [xmin + 4, xmax - 4]) box(out, x, (PODIUM + H - 6) / 2 + 2, zmin - 0.3, 4.2, (H - 6 - PODIUM) / 2 + 2, 0.35, GLASS, surfaceTag('glass'))
  }
  // dark louvre strips up the podium, every 30 m along its long faces
  let xa = Infinity, xb = -Infinity
  for (const p of ring) { xa = Math.min(xa, p.x); xb = Math.max(xb, p.x) }
  for (let x = xa + 20; x < xb - 10; x += 30) box(out, x, 14, z0 - 0.25, 2, 8, 0.3, [0.32, 0.33, 0.34], surfaceTag('metal'))
}

/**
 * ZUCKERBERG SAN FRANCISCO GENERAL, Building 25 (Fong & Chang / Fong + Chang, 2016), found on the hospitals audit,
 * 2026-10-04 — a generic beige drum. From Commons ("San Francisco General Hospital 2016"): a rounded glass drum of
 * seven storeys wrapped in WHITE — slender vertical fins and a deep horizontal sunshade at every floor, an open louvred
 * ring round the top — standing on a glass podium whose parapet is a broad band of brick-red panels, the hospital's
 * name on it facing Potrero Avenue. OSM maps it as two parts inside the outline; the entry claims both (the 12 m part
 * lies inside the drum's footprint, its walls on the drum's) and the model is fitted to their union.
 */
export function zuckerbergSFGH(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const WHITE: Rgb = [0.93, 0.94, 0.94], BRICK: Rgb = [0.42, 0.2, 0.17], GLASS: Rgb = [0.3, 0.42, 0.44]
  const P = 11, TOP = 34, FL = 3.3
  // the podium: glass between white mullions, the brick band over it
  tower(out, fit, {
    height: P,
    tiers: [{ to: 1, face: { kind: 'curtain', wall: WHITE, glass: GLASS, pitch: 2.4, floor: 4, solid: 0.1, material: 'metal' } }],
    roof: [0.62, 0.62, 0.6],
    crown: { kind: 'flat' },
  })
  faceBand(out, insetRing(ring, -0.06), P - 3, P + 0.6, { kind: 'blank', wall: BRICK, material: 'brick' })
  // the drum, stepped back off the podium's edge
  const d = insetRing(ring, 3)
  faceBand(out, d, P, TOP, { kind: 'curtain', wall: [0.75, 0.8, 0.8], glass: GLASS, pitch: 1.6, floor: FL, solid: 0.06, material: 'glass' })
  capPolygon(out, d, TOP, [0.6, 0.6, 0.6], surfaceTag('concrete'))
  const metal = surfaceTag('metal')
  const band = (r0: { x: number; z: number }[], r1: { x: number; z: number }[], y: number): void => {
    if (r0.length !== r1.length) return
    for (let i = 0; i < r0.length; i++) {
      const j = (i + 1) % r0.length
      out.quad([[r0[i].x, y, r0[i].z], [r1[i].x, y, r1[i].z], [r1[j].x, y, r1[j].z], [r0[j].x, y, r0[j].z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE, metal)
    }
  }
  // the sunshades: a white shelf round the drum at every floor (top and underside, 12 cm apart)
  const shelf = insetRing(d, -1.1)
  for (let y = P + FL; y < TOP - 0.5; y += FL) { band(d, shelf, y + 0.12); band(d, shelf, y) }
  // the fins, standing out from the glass every couple of metres, floor to roof
  for (let i = 0; i < d.length; i++) {
    const e = edgeAt(d, i)
    const n = Math.max(1, Math.round(e.L / 2.2))
    for (let k = 0; k <= n - 1; k++) {
      const u = -e.L / 2 + (k + 0.5) * (e.L / n)
      boxAlong(out, e.mid.x + e.tx * u + e.nx * 0.55, (P + TOP) / 2, e.mid.z + e.tz * u + e.nz * 0.55, 0.07, (TOP - P) / 2, 0.55, e.heading, WHITE, metal)
    }
  }
  // the louvred crown: an open ring of white slats on a white frame
  const crown = insetRing(d, -1.1)
  for (const y of [TOP + 0.1, TOP + 3.2]) band(d, crown, y)
  for (let i = 0; i < crown.length; i++) {
    const e = edgeAt(crown, i)
    const n = Math.max(1, Math.round(e.L / 0.9))
    for (let k = 0; k < n; k++) {
      const u = -e.L / 2 + (k + 0.5) * (e.L / n)
      boxAlong(out, e.mid.x + e.tx * u, TOP + 1.65, e.mid.z + e.tz * u, 0.05, 1.55, 0.5, e.heading, WHITE, metal)
    }
  }
}

/**
 * SF GENERAL'S 1915 BRICK WARDS (Newton J. Tharp's campus, Romanesque Revival): red brick over a stone base, a
 * corbelled cornice, the top storey an ARCADE of round-headed openings, low red tile hipped roofs (Commons, "San
 * Francisco General Hospital 2016", the ward beside Building 25). OSM maps them as 12 m parts; they are four and five
 * storeys. One name per building so the audits can tell them apart.
 */
const sfghBrick = (H: number) => (out: MeshBuilder, fit: Fit): void => {
  const BRICK: Rgb = [0.5, 0.25, 0.19], STONE: Rgb = [0.72, 0.66, 0.56], TILE: Rgb = [0.45, 0.22, 0.16]
  tower(out, fit, {
    height: H,
    base: { height: 1.4, face: { kind: 'blank', wall: STONE, material: 'ashlar' } },
    tiers: [
      { to: H - 3.6, face: { kind: 'punched', wall: BRICK, glass: [0.2, 0.22, 0.24], pitch: 3.2, floor: 3.8, solid: 0.55, material: 'brick' }, cornice: { depth: 0.25, height: 0.3, colour: STONE } },
      { to: H, face: { kind: 'punched', wall: BRICK, glass: [0.16, 0.17, 0.18], pitch: 1.8, floor: 3.6, solid: 0.38, arched: true, material: 'brick' }, cornice: { depth: 0.55, height: 0.5, colour: BRICK } },
    ],
    roof: TILE,
    crown: { kind: 'hip', height: 3, inset: 0.4, colour: TILE, material: 'tile' },
  })
}

/**
 * CPMC DAVIES CAMPUS (owner's Street View frames, 2026-10-04: "the windowless tower is on Duboce side. most of it
 * genuinely is hidden"): the whole campus is 1970s board-formed grey concrete. The ward blocks stand behind trees with
 * deep vertical concrete fins between slot windows; on Duboce Avenue the north end of the Noe Street wing
 * (way/288543156) rises as a pair of windowless shafts, stepped at the top, the taller one forward. Front 0: Duboce
 * is north.
 */
const DAVIES: Rgb = [0.62, 0.62, 0.59]
function daviesConcrete(out: MeshBuilder, fit: Fit, H: number): void {
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 3.5, face: { kind: 'blank', wall: [0.55, 0.55, 0.52], material: 'concrete' } },
    tiers: [{ to: H, face: { kind: 'fins', wall: DAVIES, glass: [0.2, 0.22, 0.24], pitch: 1.8, solid: 0.55, depth: 0.7, floor: 3.8, material: 'concrete' } }],
    roof: [0.5, 0.5, 0.48],
    crown: { kind: 'parapet', height: 1, colour: DAVIES, material: 'concrete' },
  })
}
function daviesWard(out: MeshBuilder, fit: Fit): void { daviesConcrete(out, fit, fit.height > 8 && fit.height < 24 ? fit.height : 14) }
function daviesDuboceTower(out: MeshBuilder, fit: Fit): void {
  const H = 15
  daviesConcrete(out, fit, H)
  const ring = towerRing(fit)
  // Duboce's end (bearing 0 here: the first render, at 180, put them on the 14th Street end)
  const e = edgeAt(ring, edgeFacing(ring, 0))
  const conc = surfaceTag('concrete')
  // the two windowless shafts on the Duboce end: the taller forward, the second set back and lower
  // (they stand proud of the wing's end, in the paler fresh-looking concrete of the frames, over the wing's roof)
  const SHAFT: Rgb = [0.68, 0.68, 0.65]
  const shafts: [number, number, number, number][] = [[-e.L * 0.2, 4, 22, 8], [e.L * 0.22, 2.5, 19, 9]]
  for (const [u, o, h, w] of shafts) {
    const x = e.mid.x + e.tx * u + e.nx * (o - 3), z = e.mid.z + e.tz * u + e.nz * (o - 3)
    boxAlong(out, x, h / 2, z, w / 2, h / 2, 3.5, e.heading, SHAFT, conc)
    // the stepped top and a board-mark panel line or two
    boxAlong(out, x - e.nx * 0.6, h + 0.6, z - e.nz * 0.6, w / 2 - 0.8, 0.6, 2.9, e.heading, SHAFT, conc)
    for (const y of [h * 0.35, h * 0.7]) boxAlong(out, x + e.nx * 3.52, y, z + e.nz * 3.52, w / 2 - 0.3, 0.06, 0.04, e.heading, [0.55, 0.55, 0.52], conc)
  }
}

export const HOSPITALS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  daviesWard, daviesDuboceTower,
  cpmcVanNess, zuckerbergSFGH,
  sfghWard10: sfghBrick(18), sfghWard20: sfghBrick(18), sfghWard30: sfghBrick(18), sfghWard40: sfghBrick(18), sfghWard50: sfghBrick(18),
  sfghBuilding1: sfghBrick(15), sfghBuilding80: sfghBrick(22),
}
