import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { arc, block, centroid, FIXED, fitted, hex, hipFan, hull, offsetRing, prism, pts, ribbons, shade, sign, stripSlope, stripWall, wallOn, wound, type P2, type Rgb } from './common.ts'
import { slab } from '../palaces/common.ts'

/*
 * The Ménagerie's houses. All of its sixty buildings are in the bake, dressed as Haussmann and brick, and behind its trees the owner
 * reads them as missing (2026-10-30: "some but not all zoo buildings are shown"). The four that have a character of their own are
 * here by name, the rest share `menagerieHouse`.
 */

const CONCRETE = hex('#bdb6a3')
const SLATE = hex('#555b60')
const GLASS = hex('#232b30')

// ---- the Fauverie -------------------------------------------------------------------------------------------------------------

/** the design footprint: the box round OSM's way 42332642 and its two rings of cages (95475745, 437572815), x east, z north */
const FAUVERIE_HX = 20.2
const FAUVERIE_HZ = 24.6
/** the north range: OSM's outline north of the cages */
const RANGE = pts([18.7, 14.3, 18.4, 8.3, 7.4, 8.8, -6.5, 9.4, -17.7, 9.8, -17.5, 15.8, -14.5, 15.7, -13.6, 20.4, -12.8, 21.1, -11.8, 21.5, -9.1, 21.5, -9.0, 24.6, 11.0, 23.5, 10.9, 20.6, 12.8, 20.5, 13.8, 20.2, 14.6, 19.7, 15.2, 19.0, 15.9, 17.7, 15.7, 14.4])

/**
 * The Fauverie (1937): the big cats' house. To the north a long dark-brick range with stone bands and the name over its door, in
 * Commons "Paul Jouve. Lion de l'Atlas", and to the south what everybody remembers, in Commons "Jardin des Plantes (3189983467)":
 * the half-round of cages, tall iron bars between steel posts, rockwork inside, under a roof stepping up in concentric rings. The
 * plan and its three rings are OSM's (the rings' radii measured off ways 95475745 and 437572815); the heights are not surveyed.
 */
export function fauverie(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, FAUVERIE_HX, FAUVERIE_HZ, (q) => drawFauverie(q))
}

function drawFauverie(out: MeshBuilder): void {
  const brick = hex('#4f3b34')
  const stone = hex('#c8bfa8')
  const iron = hex('#2a2e2f')
  const CENTRE: P2 = { x: 0, z: 2 }
  const A0 = Math.PI * 1.02
  const A1 = Math.PI * 1.98
  const SEGS = 16
  // ---- the rings: outer radius, the height of its eave; each lid slopes up to the next ring's wall
  const RINGS: [number, number][] = [[21.5, 5.6], [17.2, 7.5], [12.2, 9.3], [7.4, 11]]
  const line = (r: number): P2[] => arc(CENTRE.x, CENTRE.z, r, A0, A1, SEGS)
  // the cage floor, and the dark back wall the bars are read against
  block(out, -21.5, 21.5, 2, 9, 0, 5.2, shade(iron, 1.2))
  stripWall(out, line(16.8), 0, 5.6, CENTRE, hex('#544f47'))
  const cageFloor = line(21.5).map((p) => ({ ...p }))
  stripSlope(out, cageFloor, 0.08, line(16.8), 0.08, [0, -2, 2], hex('#8f8676'))
  for (let k = 0; k < RINGS.length; k++) {
    const [r, y] = RINGS[k]
    const next = RINGS[k + 1]
    const rr = next ? next[0] : 0.1
    const yy = next ? y + 0.8 : y + 1.2
    // the lid of this ring, and the riser up to the next
    stripSlope(out, line(r), y, line(rr), yy, [CENTRE.x, y - 3, CENTRE.z], k % 2 ? hex('#7d7a70') : hex('#8a867a'))
    if (next) stripWall(out, line(rr), yy, next[1], CENTRE, hex('#6d6a61'))
    // the eave's thin edge
    stripWall(out, line(r), y - 0.3, y, CENTRE, shade(stone, 0.8))
  }
  // ---- the bars: the steel posts every segment, a bar every 0.9 m between them, the rails
  const outer = line(21.3)
  for (let i = 0; i < outer.length; i++) {
    prism(out, outer[i].x, outer[i].z, 0, 5.4, 0.13, 4, iron, FIXED)
    if (i === outer.length - 1) break
    const a = outer[i], b = outer[i + 1]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const n = Math.round(L / 0.9)
    const dx = (b.x - a.x) / L, dz = (b.z - a.z) / L
    for (let j = 1; j < n; j++) {
      const u = (L * j) / n
      const px = a.x + dx * u, pz = a.z + dz * u
      out.quad([[px - dx * 0.025, 0.6, pz - dz * 0.025], [px + dx * 0.025, 0.6, pz + dz * 0.025], [px + dx * 0.025, 5.4, pz + dz * 0.025], [px - dx * 0.025, 5.4, pz - dz * 0.025]],
        [dz, 0, -dx], [[0, 0], [1, 0], [1, 1], [0, 1]], iron, FIXED)
    }
  }
  stripWall(out, outer, 0, 0.6, CENTRE, stone)
  for (const y of [2.6, 5.2]) stripWall(out, outer, y, y + 0.08, CENTRE, iron)
  // ---- the rockwork behind the bars: a few big stepped stones, seen through them
  const rocks: [number, number, number, number][] = [[-11, -9, 2.6, 1.4], [-5, -12, 3.4, 1.7], [3, -12, 2.8, 1.5], [9, -10, 3.6, 1.8], [14, -5, 2.4, 1.2], [-15, -4, 2.2, 1.3]]
  for (const [x, z, r, h] of rocks) {
    prism(out, x, z, 0, h, r, 6, hex('#8d8576'), FIXED, r * 0.7)
    prism(out, x + 0.5, z + 0.4, h, h + 0.9, r * 0.6, 5, hex('#9a9281'), FIXED, r * 0.3)
  }
  // ---- the range to the north: dark brick, a stone band over its ground floor, windows in pairs, a flat roof
  const range = wound([RANGE])[0]
  hull(out, [range], 0, 11.6, brick, hex('#6d6a61'))
  ribbons(out, [range], [[4.9, 5.25], [10.8, 11.6]], stone, 0.1, 0.1, 2)
  for (let i = 0; i < range.length; i++) {
    const w = wallOn(out, range[i], range[(i + 1) % range.length])
    if (w.L < 5) continue
    const n = Math.round(w.L / 3.4)
    for (let j = 0; j < n; j++) {
      const u = (w.L * (j + 0.5)) / n
      w.rect(u - 0.7, u + 0.7, 6.4, 9.7, shade(stone, 0.9), 0.06)
      w.rect(u - 0.56, u - 0.04, 6.55, 9.55, GLASS, 0.08)
      w.rect(u + 0.04, u + 0.56, 6.55, 9.55, GLASS, 0.08)
      if (j % 2 === 0) w.rect(u - 1.1, u + 1.1, 3.4, 4.5, stone, 0.08)
      else w.rect(u - 0.8, u + 0.8, 0.5, 3.2, GLASS, 0.08)
    }
  }
  block(out, -9, 11, 23.5, 24.9, 9.2, 11.2, stone)
  sign(out, { type: 'flat', text: 'FAUVERIE', h: 0.8, face: 'engraved', tracking: 0.2, colour: hex('#4a4338'), lit: 'none' }, { x: 1, y: 10.2, z: 24.95, heading: 0 })
}

// ---- the Singerie -------------------------------------------------------------------------------------------------------------

const SINGERIE_HX = 14.4
const SINGERIE_HZ = 14.5
const SINGERIE = pts([14.4, -2.3, 13.9, -0.2, 13.3, 0.8, 11.7, 2.5, 10.4, 3.2, 11.7, 6.0, 13.0, 8.8, 6.7, 11.6, 0.3, 14.5, -1.1, 11.5, -2.4, 9.3, -3.7, 9.8, -6.3, 10.0, -10.5, 7.7, -14.4, -0.9, -14.4, -2.9, -12.1, -7.2, 4.0, -14.4, 6.1, -14.5, 8.3, -14.0, 9.3, -13.4, 10.8, -12.1, 11.4, -11.3, 14.2, -4.9, 14.4, -3.6])

/**
 * The Singerie: a pale rendered house on OSM's rounded plan under a flat roof with a roof light, tall glazed bays with their mesh
 * on the sunny sides. Commons shows only the older iron cages, long gone; the present building is drawn from OSM's plan and
 * from memory of a plain 1930s concrete hall, which a photograph should check.
 */
export function singerie(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, SINGERIE_HX, SINGERIE_HZ, (q) => {
    const r = wound([SINGERIE])[0]
    const wall = hex('#d9cfb6')
    hull(q, [r], 0, 9.6, wall, hex('#8e8a7d'))
    ribbons(q, [r], [[0, 0.7], [8.7, 9.6]], CONCRETE, 0.08, 0.1, 2)
    for (let i = 0; i < r.length; i++) {
      const w = wallOn(q, r[i], r[(i + 1) % r.length])
      if (w.L < 3.5) continue
      const n = Math.max(1, Math.round(w.L / 3.8))
      for (let j = 0; j < n; j++) {
        const u = (w.L * (j + 0.5)) / n
        w.rect(u - 1.2, u + 1.2, 1.2, 7.8, GLASS, 0.06)
        for (let k = 1; k < 4; k++) w.rect(u - 1.2, u + 1.2, 1.2 + k * 1.65 - 0.04, 1.2 + k * 1.65 + 0.04, hex('#6c6f6c'), 0.09)
        w.rect(u - 0.04, u + 0.04, 1.2, 7.8, hex('#6c6f6c'), 0.09)
      }
    }
    const m = centroid(r)
    block(q, m.x - 5.5, m.x + 5.5, m.z - 2.2, m.z + 2.2, 9.6, 10.6, hex('#8d989c'))
    block(q, m.x - 5.7, m.x + 5.7, m.z - 2.4, m.z + 2.4, 10.6, 10.8, CONCRETE)
  })
}

// ---- the Reptiles -------------------------------------------------------------------------------------------------------------

const REPTILES_HX = 21.85
const REPTILES_HZ = 18.9
/** OSM's plan: the long block, its round-ended front on the south-east */
const REPTILES = pts([21.8, 7.0, 16.1, 2.7, 16.8, -1.0, 15.3, -4.4, -1.0, -16.1, -1.8, -16.4, -4.3, -16.7, -7.5, -14.9, -9.6, -16.5, -12.7, -18.9, -21.8, -7.3, 13.2, 18.9])
/** the plain upper range along the north-west half */
const REPTILES_UP = pts([11.5, 11.8, 6.2, 3.4, -13.6, -11.4, -21.8, -7.3, 13.2, 18.9, 19, 11])

/**
 * The Reptiles (Jules André, 1870s by memory): from Commons "Pavillon des reptiles du Jardin des plantes de Paris" and "Batiment des
 * reptiles": along the garden a low pale stone front with rounded ends, tall dark glazed bays between pilasters, a cornice and a
 * balustrade on pedestals; behind and over it a plain two-storey range with square windows under a low slate hip. An iron and
 * glass marquise over the door on the short side. The plan is OSM's; the upper range's depth is read off the photographs.
 */
export function reptiles(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, REPTILES_HX, REPTILES_HZ, (q) => {
    const stone = hex('#e2d9c4')
    const trim = shade(stone, 1.04)
    const r = wound([REPTILES])[0]
    const EAVE = 6.2
    hull(q, [r], 0, EAVE, stone, hex('#8f8a7d'))
    for (let i = 0; i < r.length; i++) {
      const w = wallOn(q, r[i], r[(i + 1) % r.length])
      if (w.L < 3) continue
      const n = Math.max(1, Math.round(w.L / 3.4))
      for (let j = 0; j < n; j++) {
        const u = (w.L * (j + 0.5)) / n
        const half = (w.L / n) / 2 - 0.42
        w.rect(u - half, u + half, 0.8, 5.1, GLASS, 0.06)
        for (const k of [-0.33, 0.33]) w.rect(u + half * k - 0.04, u + half * k + 0.04, 0.8, 5.1, hex('#4b5350'), 0.08)
        w.rect(u - half, u + half, 3.5, 3.58, hex('#4b5350'), 0.08)
        w.slab(u + w.L / n / 2 - 0.3, u + w.L / n / 2 + 0.3, 0, EAVE - 0.5, 0.24, trim)
      }
    }
    slab(q, offsetRing(r, 0.45), EAVE - 0.5, EAVE, trim, shade(stone, 0.7))
    // the balustrade: a low wall of rail and posts, a pedestal every 7 m
    const rail = offsetRing(r, 0.2)
    for (let i = 0; i < rail.length; i++) {
      const a = rail[i], b = rail[(i + 1) % rail.length]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (L < 2) continue
      const w = wallOn(q, a, b)
      w.slab(0, L, EAVE + 0.75, EAVE + 0.95, 0.12, trim, 0.12)
      const n = Math.round(L / 0.6)
      for (let j = 0; j <= n; j += 1) w.rect((L * j) / n - 0.05, (L * j) / n + 0.05, EAVE, EAVE + 0.75, shade(stone, 0.86), 0.02)
      for (let j = 0; j <= Math.round(L / 7); j++) {
        const u = (L * j) / Math.max(1, Math.round(L / 7))
        w.slab(Math.max(0, u - 0.3), Math.min(L, u + 0.3), EAVE, EAVE + 1.25, 0.2, trim, 0.2)
      }
    }
    // the plain range above and behind
    const up = wound([REPTILES_UP])[0]
    const TOP = 11.6
    hull(q, [up], 0, TOP, stone, hex('#6c7277'))
    for (let i = 0; i < up.length; i++) {
      const w = wallOn(q, up[i], up[(i + 1) % up.length])
      if (w.L < 5) continue
      const n = Math.round(w.L / 3.2)
      for (let j = 0; j < n; j++) {
        const u = (w.L * (j + 0.5)) / n
        w.rect(u - 0.72, u + 0.72, 8, 10.4, trim, 0.05)
        w.rect(u - 0.58, u + 0.58, 8.1, 10.3, GLASS, 0.07)
      }
    }
    hipFan(q, up, TOP, 1.6, SLATE, 0.55)
  })
}

// ---- the Vivarium -------------------------------------------------------------------------------------------------------------

const VIVARIUM_HX = 13.8
const VIVARIUM_HZ = 13.3
const VIVARIUM = pts([13.8, 7.9, 12.4, 6.5, 13.7, 5.1, 11.4, 3.0, 8.9, 0.8, 8.3, 1.4, -2.1, -8.6, -1.5, -9.4, -5.3, -13.0, -7.5, -10.6, -10.4, -13.3, -13.8, -9.9, -10.8, -7.0, -13.0, -4.7, -9.2, -1.1, -8.5, -1.8, 5.9, 13.3, 7.2, 12.0, 8.6, 13.3])

/**
 * The Vivarium: a long low pale concrete hall on OSM's plan, its short wings at each end, a strip of clerestory glass under a flat
 * roof, a raised roof light along its spine. From memory of a 1920s building and OSM's plan: Commons gave nothing usable.
 */
export function vivarium(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, VIVARIUM_HX, VIVARIUM_HZ, (q) => {
    const r = wound([VIVARIUM])[0]
    const wall = hex('#d3c9af')
    hull(q, [r], 0, 6.4, wall, hex('#807c71'))
    ribbons(q, [r], [[3.6, 5.3]], GLASS, 0.06, 0.25, 2.5)
    ribbons(q, [r], [[5.5, 6.4], [0, 0.5]], CONCRETE, 0.1, 0, 1)
    // the roof light along the spine, from one wing to the other
    const A = { x: -7.5, z: -8 }, B = { x: 6.5, z: 7 }
    const L = Math.hypot(B.x - A.x, B.z - A.z)
    const nx = -(B.z - A.z) / L * 1.6, nz = (B.x - A.x) / L * 1.6
    const light: P2[] = [{ x: A.x - nx, z: A.z - nz }, { x: B.x - nx, z: B.z - nz }, { x: B.x + nx, z: B.z + nz }, { x: A.x + nx, z: A.z + nz }]
    hull(q, [light], 6.4, 7.5, hex('#8d989c'), hex('#a3adb1'))
  })
}

// ---- every other house --------------------------------------------------------------------------------------------------------

const colourOf = (a: number): Rgb => [hex('#c9b48c'), hex('#b8987a'), hex('#a58a6a'), hex('#cdbf9e')][Math.abs(Math.round(a)) % 4]

/**
 * The Ménagerie's other houses, raised from their own OSM outline (`fit.ring`, a box where there is none): the small ones the zoo's
 * rustic FABRIQUES, timber and rough render under a dark steep hip with deep eaves, a low dark opening on the longest wall; the
 * larger ones plain ochre-rendered sheds and stables with a row of small windows and a grey roof, what the Haussmann dress stood in
 * for. By kind and not by survey: nobody has looked at these one at a time.
 */
export function menagerieHouse(out: MeshBuilder, fit: Fit): void {
  const ring = wound([fit.ring && fit.ring.length >= 3 ? fit.ring : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]])[0]
  const footprint = 4 * fit.hx * fit.hz
  const small = footprint < 120
  const wall = colourOf(footprint)
  const eaves = small ? Math.min(2.8, fit.height * 0.6) : Math.min(fit.height - 1.2, Math.max(3.4, fit.height * 0.72))
  const rise = small ? Math.max(1.1, Math.min(fit.hx, fit.hz) * 0.75) : Math.max(1, Math.min(fit.hx, fit.hz) * 0.35)
  hull(out, [ring], 0, eaves, small ? hex('#8c6f4f') : wall, shade(wall, 0.7))
  let longest = 0
  ring.forEach((p, i) => { const q = ring[(i + 1) % ring.length]; if (Math.hypot(q.x - p.x, q.z - p.z) > Math.hypot(ring[(longest + 1) % ring.length].x - ring[longest].x, ring[(longest + 1) % ring.length].z - ring[longest].z)) longest = i })
  for (let i = 0; i < ring.length; i++) {
    const w = wallOn(out, ring[i], ring[(i + 1) % ring.length])
    if (w.L < 2.4) continue
    w.rect(0, w.L, 0, 0.35, small ? hex('#5e5245') : hex('#857a68'), 0.04)
    if (small) {
      if (i === longest) w.rect(w.L / 2 - 0.65, w.L / 2 + 0.65, 0, Math.min(2.1, eaves - 0.3), hex('#2e2a26'), 0.05)
      continue
    }
    const n = Math.max(1, Math.round(w.L / 3.4))
    for (let j = 0; j < n; j++) {
      const u = (w.L * (j + 0.5)) / n
      w.rect(u - 0.55, u + 0.55, eaves * 0.42, eaves * 0.42 + Math.min(1.5, eaves * 0.38), GLASS, 0.05)
    }
  }
  hipFan(out, ring, eaves, rise, small ? hex('#4d4238') : SLATE, small ? 0.6 : 0.35)
}
