/**
 * HYDE STREET PIER (OSM way/456528981, `man_made=pier`), the timber pier the historic ships lie along: a planked deck on
 * wooden piles, a low timber rail along its edges and the old lamp standards down it. Rebuilt 2026-10-18 (owner: "we
 * should improve that pier as well. it was working better previously"; "those lines with lights on them … really don't
 * look like it"): the earlier model was placed by a point and a 154 x 150 m size with no outline, so its railings and
 * lamp row were long beams across the cove and it had no deck.
 *
 * Built from the OSM ring itself, in the manifest frame (x east, z north from the anchor, the ring's first point). The
 * ground under it is laid flat at the deck's level by the `hyde-street-pier-deck` zone (ZoneProps `deck`), which is
 * where its paths are; the planks sit a few centimetres over that.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import { box, prism, strut, FIXED, EMIT, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const ANCHOR = { lat: 37.8087873, lon: -122.4209278 }
const KX = 111320 * Math.cos((ANCHOR.lat * Math.PI) / 180)
const KZ = 110540

/** OSM way/456528981's outline (Overpass, 2026-10-18), unclosed */
const RING_LL: [number, number][] = [
  [37.8087873, -122.4209278], [37.8087758, -122.4210114], [37.8088124, -122.4211318], [37.8091682, -122.4215645],
  [37.8091988, -122.4215261], [37.809426, -122.4218252], [37.8096324, -122.4221024], [37.8100939, -122.4227275],
  [37.8100766, -122.422748], [37.8101468, -122.4228429], [37.8101653, -122.4228211], [37.8102105, -122.4228811],
  [37.8102497, -122.4228337], [37.8100836, -122.4226105], [37.8099581, -122.422442], [37.8097723, -122.4221923],
  [37.8096663, -122.4220434], [37.8092384, -122.4214653], [37.8091775, -122.4213682], [37.8092411, -122.4212412],
  [37.8090073, -122.4210732], [37.8090092, -122.4210562], [37.8089941, -122.4210535], [37.8089658, -122.4210485],
  [37.8089771, -122.4209684],
]
/** south of this the pier meets the land (Jefferson Street): no rail across its foot */
const SHORE_LAT = 37.80895

const PLANK: Rgb = [0.44, 0.38, 0.31]
const FASCIA: Rgb = [0.36, 0.29, 0.22]
const PILE: Rgb = [0.27, 0.22, 0.17]
const RAIL: Rgb = [0.42, 0.34, 0.26]
const IRON: Rgb = [0.13, 0.14, 0.13]

export function hydeStreetPier(out: MeshBuilder): void {
  let ring = RING_LL.map(([lat, lon]) => ({ x: (lon - ANCHOR.lon) * KX, z: (lat - ANCHOR.lat) * KZ, lat }))
  // anticlockwise (the OSM way runs clockwise), so each edge's outward normal is to its right
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring = [...ring].reverse()
  const TOP = 0.08, SLAB = 1.6, DOWN = -6
  capPolygon(out, ring, TOP, PLANK, surfaceTag('planks'))
  let run = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.05) continue
    const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
    const nx = uz, nz = -ux
    const shore = (a.lat + b.lat) / 2 < SHORE_LAT
    // the deck's timber edge, down toward the water
    out.quad([[a.x, TOP, a.z], [b.x, TOP, b.z], [b.x, TOP - SLAB, b.z], [a.x, TOP - SLAB, a.z]], [nx, 0, nz],
      [[0, 0], [L, 0], [L, SLAB], [0, SLAB]], FASCIA, FIXED)
    if (shore) { run += L; continue }
    // a low timber rail: posts every 2.4 m, a cap rail and a mid rail, set in from the edge
    const ix = -nx * 0.2, iz = -nz * 0.2
    for (const h of [0.5, 0.95]) strut(out, [a.x + ix, TOP + h, a.z + iz], [b.x + ix, TOP + h, b.z + iz], 0.12, 0.08, RAIL, FIXED, false)
    for (let s = (2.4 - (run % 2.4)) % 2.4; s < L; s += 2.4) {
      const x = a.x + ux * s + ix, z = a.z + uz * s + iz
      box(out, x, TOP + 0.5, z, 0.08, 0.5, 0.08, RAIL, FIXED)
    }
    // pile clusters under the edge every 5 m; a lamp standard every 25 m
    for (let s = (5 - (run % 5)) % 5; s < L; s += 5) {
      const x = a.x + ux * s - nx * 0.5, z = a.z + uz * s - nz * 0.5
      prism(out, x, z, DOWN, TOP - SLAB + 0.2, 0.22, 7, PILE, FIXED)
      if (Math.round((run + s) / 5) % 5 === 0 && L > 8) {
        const lx = a.x + ux * s - nx * 0.6, lz = a.z + uz * s - nz * 0.6
        prism(out, lx, lz, TOP, TOP + 0.4, 0.16, 8, IRON, FIXED)
        prism(out, lx, lz, TOP + 0.4, TOP + 3.6, 0.07, 8, IRON, FIXED)
        prism(out, lx, lz, TOP + 3.6, TOP + 4.1, 0.2, 8, [1.0, 0.92, 0.7], EMIT, 0.14)
        prism(out, lx, lz, TOP + 4.1, TOP + 4.25, 0.24, 8, IRON, FIXED, 0.05)
      }
    }
    run += L
  }
}
