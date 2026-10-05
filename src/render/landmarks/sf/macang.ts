/**
 * MACANG MONASTERY, 1822 Eddy Street (the old St Patrick's / Holy Cross church; way/261273676) and its ART GALLERY
 * next door (the old parish hall; way/261273687) — from the owner's photograph, 2026-10-04 (the church() kit had
 * drawn a generic twin-towered church).
 *
 * The monastery: grey-buff sandstone. A six-column Ionic portico across the front, three arched doors behind it, an
 * entablature lettered MACANG MONASTERY under a broad pediment; above, a plain attic carrying the Latin inscription
 * band and a lattice balustrade between the towers. The TWIN TOWERS stand at the front corners, each a square shaft
 * with a round window, then a belfry stage of paired arched openings between pilasters under a cornice, then an
 * octagonal arcaded lantern with a small dome and finial.
 *
 * The gallery (to the east): one tall storey of cream clapboard, a broad pedimented gable front with corner
 * pilasters and an entablature lettered ART GALLERY OF THE MACANG MONASTERY, a red door in a moulded frame, tall
 * lattice windows either side.
 *
 * Front 180: Eddy Street is south.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing } from '../tower.ts'
import { boxAlong, edgeAt, edgeFacing, signText } from '../parts.ts'

const STONE: Rgb = [0.76, 0.74, 0.68]
const SHADE: Rgb = [0.66, 0.64, 0.58]
const DARK: Rgb = [0.16, 0.17, 0.19]
const DOOR: Rgb = [0.45, 0.17, 0.13]
const CREAM: Rgb = [0.9, 0.87, 0.76]

export type Frame = { on: (u: number, y: number, o: number, w: number, h: number, d: number, c: Rgb, tag?: number) => void; at: (u: number, o: number) => [number, number]; L: number; heading: number; tri: (u0: number, u1: number, y0: number, rise: number, o: number, c: Rgb, tag: number) => void }

export function frontFrame(out: MeshBuilder, fit: Fit, G: number): Frame {
  const ring = towerRing(fit)
  const e0 = edgeAt(ring, edgeFacing(ring, 180))
  // the front is the WHOLE footprint's width along that edge, not the one segment: Macang's south side is a 14 m
  // segment between the projecting tower fronts, and six columns came out squeezed into 0.6 m (owner, 2026-10-04)
  let u0 = Infinity, u1 = -Infinity, o1 = -Infinity
  for (const p of ring) {
    const u = (p.x - e0.mid.x) * e0.tx + (p.z - e0.mid.z) * e0.tz, o = (p.x - e0.mid.x) * e0.nx + (p.z - e0.mid.z) * e0.nz
    u0 = Math.min(u0, u); u1 = Math.max(u1, u); o1 = Math.max(o1, o)
  }
  const um = (u0 + u1) / 2
  const e = { ...e0, L: u1 - u0, mid: { x: e0.mid.x + e0.tx * um + e0.nx * o1, z: e0.mid.z + e0.tz * um + e0.nz * o1 } }
  const at = (u: number, o: number): [number, number] => [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
  const on = (u: number, y: number, o: number, w: number, h: number, d: number, c: Rgb, tag = surfaceTag('ashlar')): void => {
    const [x, z] = at(u, o)
    boxAlong(out, x, G + y, z, w / 2, h / 2, d / 2, e.heading, c, tag)
  }
  // a pediment's face: a triangle on the wall plane, both sides
  const tri = (u0: number, u1: number, y0: number, rise: number, o: number, c: Rgb, tag: number): void => {
    const [ax, az] = at(u0, o), [bx, bz] = at(u1, o), [tx, tz] = at((u0 + u1) / 2, o)
    const A: [number, number, number] = [ax, G + y0, az], B: [number, number, number] = [bx, G + y0, bz], T: [number, number, number] = [tx, G + y0 + rise, tz]
    out.quad([A, B, T, T], [e.nx, 0, e.nz], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], c, tag)
    out.quad([T, B, A, A], [-e.nx, 0, -e.nz], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], c, tag)
  }
  return { on, at, L: e.L, heading: e.heading, tri }
}

export function macangMonasteryFront(out: MeshBuilder, fit: Fit): void {
  const G = Math.max(0, fit.grade ?? 0)
  const H = G + 16
  const st = surfaceTag('ashlar')
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'punched', wall: STONE, glass: DARK, pitch: 4.5, solid: 0.7, floor: 8, arched: true, material: 'ashlar' }, cornice: { depth: 0.5, height: 0.8, colour: SHADE } }],
    roof: [0.45, 0.45, 0.46],
    crown: { kind: 'flat' },
  })
  const f = frontFrame(out, fit, G)
  const L = f.L, T = 6.2
  // the portico: six Ionic columns proud of the front between the towers, three arched doors behind
  const pw = L - 2 * T - 1
  for (let k = 0; k < 6; k++) {
    const u = -pw / 2 + (k * pw) / 5
    const [x, z] = f.at(u, 3)
    prism(out, x, z, G + 0.6, G + 1.1, 0.75, 12, SHADE, st)
    prism(out, x, z, G + 1.1, G + 8.2, 0.5, 12, STONE, st, 0.44)
    prism(out, x, z, G + 8.2, G + 8.8, 0.8, 12, SHADE, st)
  }
  f.on(0, 0.3, 3.2, pw + 3, 0.6, 4.6, SHADE)                    // the steps
  for (const u of [-pw * 0.3, 0, pw * 0.3]) {
    f.on(u, 2.6, 0.06, 2.4, 4.6, 0.08, DOOR, 0)
    f.on(u, 5.3, 0.06, 2.4, 0.8, 0.08, DARK, 0)
  }
  // the entablature, its lettering, and the pediment over it
  f.on(0, 9.6, 2.9, pw + 2.4, 1.6, 4.6, STONE)
  const [lx, lz] = f.at(0, 5.25)
  signText(out, 'MACANG MONASTERY', lx, G + 9.6, lz, 0.55, [0.2, 0.35, 0.55], { heading: f.heading })
  f.tri(-pw / 2 - 1.2, pw / 2 + 1.2, 10.4, 3, 5.2, STONE, st)
  f.tri(-pw / 2 - 0.6, pw / 2 + 0.6, 10.6, 2.6, 5.25, SHADE, st)
  for (const s of [-1, 1]) {
    // the pediment's roof slopes back to the wall
    const [ax, az] = f.at(s * (pw / 2 + 1.2), 5.2), [tx, tz] = f.at(0, 5.2), [bx, bz] = f.at(s * (pw / 2 + 1.2), 0), [cx, cz] = f.at(0, 0)
    const q: [number, number, number][] = [[ax, G + 10.4, az], [tx, G + 13.4, tz], [cx, G + 13.4, cz], [bx, G + 10.4, bz]]
    out.quad(s > 0 ? q : [q[1], q[0], q[3], q[2]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.5, 0.5, 0.5], surfaceTag('metal'))
  }
  // the attic: its inscription band and the lattice balustrade between the towers
  f.on(0, 14.6, 0.08, pw, 0.6, 0.06, SHADE)
  f.on(0, H - G + 0.5, 0.2, pw, 1, 0.3, STONE)
  for (let u = -pw / 2 + 1; u < pw / 2; u += 2) f.on(u, H - G + 0.5, 0.36, 1.5, 0.6, 0.04, DARK, 0)
  // the twin towers at the front corners
  for (const s of [-1, 1]) {
    const u = s * (L / 2 - T / 2)
    const [x, z] = f.at(u, 0.4 - T / 2)
    const sq = (y0: number, y1: number, half: number, c: Rgb): void => boxAlong(out, x, G + (y0 + y1) / 2, z, half, (y1 - y0) / 2, half, f.heading, c, st)
    sq(0, 17, T / 2, STONE)
    sq(17, 17.6, T / 2 + 0.3, SHADE)
    // the oculus on the front of each
    const [ox, oz] = f.at(u, 0.42)
    boxAlong(out, ox, G + 12, oz, 0.75, 0.75, 0.05, f.heading, DARK, 0)
    // the belfry: paired arched openings on every face between corner pilasters
    sq(17.6, 22.6, T / 2 - 0.4, STONE)
    for (let side = 0; side < 4; side++) {
      const hd = f.heading + (side * Math.PI) / 2
      const nx = Math.sin(hd), nz = Math.cos(hd), ax = Math.cos(hd), az = -Math.sin(hd)
      for (const v of [-0.9, 0.9]) {
        const px = x + ax * v + nx * (T / 2 - 0.35), pz = z + az * v + nz * (T / 2 - 0.35)
        boxAlong(out, px, G + 19.8, pz, 0.5, 1.5, 0.05, hd, DARK, 0)
        boxAlong(out, px, G + 21.45, pz, 0.32, 0.18, 0.05, hd, DARK, 0)
      }
      for (const v of [-(T / 2 - 0.6), T / 2 - 0.6]) boxAlong(out, x + ax * v + nx * (T / 2 - 0.25), G + 20.1, z + az * v + nz * (T / 2 - 0.25), 0.3, 2.5, 0.15, hd, SHADE, st)
    }
    sq(22.6, 23.4, T / 2, SHADE)
    // the octagonal lantern, dome and finial
    const [cx, cz] = f.at(u, 0.4 - T / 2)
    prism(out, cx, cz, G + 23.4, G + 26.6, 1.9, 8, STONE, st)
    for (let k = 0; k < 8; k++) {
      const a = ((k + 0.5) / 8) * Math.PI * 2
      boxAlong(out, cx + Math.sin(a) * 1.92, G + 25, cz + Math.cos(a) * 1.92, 0.35, 1, 0.04, a, DARK, 0)
    }
    prism(out, cx, cz, G + 26.6, G + 27, 2.15, 8, SHADE, st)
    prism(out, cx, cz, G + 27, G + 28.8, 1.9, 12, STONE, st, 0.6)
    prism(out, cx, cz, G + 28.8, G + 29.8, 0.18, 6, SHADE, st, 0.05)
  }
}

export function macangArtGallery(out: MeshBuilder, fit: Fit): void {
  const G = Math.max(0, fit.grade ?? 0)
  const H = G + 8
  const cl = surfaceTag('clapboard')
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'blank', wall: CREAM, material: 'clapboard' } }],
    roof: [0.45, 0.45, 0.46],
    crown: { kind: 'flat' },
  })
  const f = frontFrame(out, fit, G)
  const L = f.L
  // the corner pilasters, the entablature and its lettering, the pediment
  for (const s of [-1, 1]) f.on(s * (L / 2 - 0.4), (H - G) / 2, 0.15, 0.8, H - G, 0.3, [0.95, 0.93, 0.86], cl)
  f.on(0, H - G - 0.6, 0.2, L, 1.2, 0.4, [0.95, 0.93, 0.86], cl)
  const [lx, lz] = f.at(0, 0.42)
  signText(out, 'ART GALLERY OF THE MACANG MONASTERY', lx, H - 0.6, lz, 0.32, [0.25, 0.22, 0.18], { heading: f.heading })
  f.tri(-L / 2 - 0.2, L / 2 + 0.2, H - G, 3.6, 0.2, CREAM, cl)
  f.tri(-L / 2 + 0.3, L / 2 - 0.3, H - G + 0.25, 3.1, 0.24, [0.95, 0.93, 0.86], cl)
  // the red door in its frame, the lattice windows
  f.on(0, 1.5, 0.12, 2.2, 3, 0.08, DOOR, 0)
  f.on(0, 3.3, 0.16, 2.8, 0.4, 0.2, [0.95, 0.93, 0.86], cl)
  for (const s of [-1, 1]) {
    f.on(s * L * 0.3, 3.6, 0.08, 1.1, 3.4, 0.06, DARK, 0)
    for (const y of [2.6, 3.6, 4.6]) f.on(s * L * 0.3, y, 0.12, 1.1, 0.06, 0.04, CREAM, 0)
    f.on(s * L * 0.3, 3.6, 0.12, 0.06, 3.4, 0.04, CREAM, 0)
  }
}

export const MACANG: Record<string, (out: MeshBuilder, fit: Fit) => void> = { macangMonasteryFront, macangArtGallery }
