/**
 * LES OLYMPIADES's DALLE (Michel Holley, 1969–77; owner, 2026-11-04: "an entire district of similar modern buildings. include trails, parks, grass, and other distinctive features", with two street-view frames of the
 * plaza, Dec 2022). The towers and bars are their own entries (towers.ts); this is what they stand in: the raised deck over the goods yard, paved in broad bands of pale and dark-flecked stone across the walk, the Galerie
 * du Mercure's shops under their scalloped pale canopies (the "pagodes"), white planters with grass and shrubs, beds behind red parapets, ring-headed lamps, the Jardin des Olympiades and its playgrounds.
 * Frame: metres east (x) and north (z) of 48.8253 N 2.3650 E (olympiades-plan.ts holds OSM's outlines in it). Every size is a constant here to tune from shots.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { MeshBuilder as MB } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { prism } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, placed, shade, type Rgb } from '../../kit.ts'
import { faceBand } from '../../tower.ts'
import { GRASS, PAGODES, PLAY, WOOD, type R } from './olympiades-plan.ts'

type P = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }
const ring = (r: R): P[] => r.map(([x, z]) => ({ x, z }))
const ccw = (r: P[]): P[] => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z } return a >= 0 ? r : [...r].reverse() }
const inside = (r: P[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
  return o
}
const area = (r: P[]): number => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z } return Math.abs(a / 2) }
/** a mitred offset of an anticlockwise ring, outward by d (the canopy's overhang): same vertex count, so edge i of each matches */
function offset(r: P[], d: number): P[] {
  const n = r.length
  return r.map((p, i) => {
    const a = r[(i + n - 1) % n], b = r[(i + 1) % n]
    const e1 = norm(p.x - a.x, p.z - a.z), e2 = norm(b.x - p.x, b.z - p.z)
    const n1 = { x: e1.z, z: -e1.x }, n2 = { x: e2.z, z: -e2.x } // outward on an anticlockwise ring
    const m = norm(n1.x + n2.x, n1.z + n2.z), k = Math.min(3, 1 / Math.max(0.3, m.x * n1.x + m.z * n1.z))
    return { x: p.x + m.x * d * k, z: p.z + m.z * d * k }
  })
}
const norm = (x: number, z: number): P => { const l = Math.hypot(x, z) || 1; return { x: x / l, z: z / l } }

/* --------------------------------------------------------------------------------------------------------- tunables */

/** the deck's outline, traced off OSM's plan around the towers, the bars and the Galerie Oslo (x east, z north) */
export const DALLE: R = [[-112, 107], [-64, 141], [0, 149], [88, 155], [88, 5], [157, 5], [157, -80], [101, -155], [59, -160], [-64, -85], [-112, -32], [-117, 64]]
/** the deck's top over the ground at the frame's middle; and the stone wall the deck shows the streets */
const DECK_H = 5.5, DECK_WALL = hex('#8e897e')
/** the walk's bands: a pale field with dark-flecked and tan bands laid across the plaza's axis (bearing AXIS) at these widths, repeating */
const AXIS = 160
const PALE = hex('#8e8576'), BANDS: [number, Rgb][] = [[2.6, PALE], [1.8, hex('#4e4843')], [1.1, PALE], [1.2, hex('#9a8064')], [2.2, hex('#575049')], [0.9, PALE], [1.4, hex('#857c70')]]
/** the shops: glass under a pale concrete canopy whose rim waves (WAVE metres a crest, AMP up and down) EAVE over the deck, OVERHANG past the glass */
const SHOP_H = 3.4, EAVE = 4.3, RISE = 0.9, OVERHANG = 2.6, WAVE = 7, AMP = 0.75, RIM = 0.45
const CANOPY = hex('#a29c90'), SOFFIT = hex('#857f74'), SHOPGLASS = hex('#4a5560'), SIGN = hex('#6e2420')
/** the beds: grass behind a red parapet BED_H high; trees in the big ones, one per TREE_AREA m² */
const BED_H = 0.75, PARAPET = hex('#a3342c'), LAWN = hex('#6f8f4a'), TREE_AREA = 90, LEAF = hex('#4f6e3a'), TRUNK = hex('#5a4a3a')
/** the white planters and the lamps, along the shops' fronts: SPACING metres apart, ROW out from the shops' axis */
const PLANTER = hex('#e8e6df'), SHRUB = hex('#5d7a44'), LAMP = hex('#2b2d2f'), SPACING = 9, ROW = 21
const RUBBER = hex('#4f7d8a')

/* ----------------------------------------------------------------------------------------------------------- builder */

export function olympiadesDalle(out: MeshBuilder, fit: Fit): void {
  const g = (x: number, z: number): number => fit.groundAt?.(x, z) ?? fit.grade ?? 0
  const deck = g(0, 0) + DECK_H
  const D = ccw(ring(DALLE))
  // the deck: its wall to the streets, its paving
  faceBand(out, D, -1, deck, { kind: 'blank', wall: DECK_WALL, material: 'concrete' })
  capPolygon(out, D, deck, PALE, surfaceTag('concrete'))
  stripes(out, D, deck + 0.02)
  // the parapet round the deck's edge
  faceBand(out, D, deck, deck + 1.05, { kind: 'blank', wall: shade(DECK_WALL, 1.12), material: 'concrete' })
  const y = deck + 0.03
  for (const p of PAGODES) shop(out, ccw(ring(p.r)), y)
  for (const b of GRASS) bed(out, ccw(ring(b.r)), y, b.id)
  for (const w of WOOD) bed(out, ccw(ring(w.r)), y, w.id, 0.5)
  for (const p of PLAY) playground(out, ccw(ring(p.r)), y, p.id)
  furniture(out, D, y)
}

/** the bands across the walk: scanned along the axis, each band cut to the deck where it crosses it */
function stripes(out: MeshBuilder, D: P[], y: number): void {
  const a = (AXIS * Math.PI) / 180, ax = { x: Math.sin(a), z: Math.cos(a) }, nx = { x: ax.z, z: -ax.x }
  const u = (p: P): number => p.x * ax.x + p.z * ax.z, v = (p: P): number => p.x * nx.x + p.z * nx.z
  const us = D.map(u), u0 = Math.min(...us), u1 = Math.max(...us)
  const at = (uu: number, vv: number): [number, number, number] => [ax.x * uu + nx.x * vv, y, ax.z * uu + nx.z * vv]
  let k = 0
  for (let s = u0; s < u1; k++) {
    const [w, c] = BANDS[k % BANDS.length]
    const s1 = s + w, mid = s + w / 2
    if (c !== PALE) {
      // where the band's middle line crosses the deck's edges
      const xs: number[] = []
      for (let i = 0; i < D.length; i++) {
        const p = D[i], q = D[(i + 1) % D.length], up = u(p), uq = u(q)
        if ((up > mid) !== (uq > mid)) xs.push(v(p) + ((v(q) - v(p)) * (mid - up)) / (uq - up))
      }
      xs.sort((m, n) => m - n)
      for (let j = 0; j + 1 < xs.length; j += 2) out.quad([at(s, xs[j]), at(s1, xs[j]), at(s1, xs[j + 1]), at(s, xs[j + 1])], [0, 1, 0], UV, c, surfaceTag('granite'))
    }
    s = s1
  }
}

/** one of the Galerie du Mercure's shops: glass in OSM's outline, the canopy's flat crown over it and its waving rim out past it */
function shop(out: MeshBuilder, r: P[], y: number): void {
  faceBand(out, r, y, y + SHOP_H, { kind: 'curtain', wall: SIGN, glass: SHOPGLASS, pitch: 3, floor: SHOP_H })
  faceBand(out, r, y + SHOP_H, y + EAVE, { kind: 'blank', wall: SIGN })
  const top = y + EAVE + RISE
  capPolygon(out, r, top, CANOPY, surfaceTag('concrete'))
  capPolygon(out, r, y + EAVE - 0.05, SOFFIT, surfaceTag('concrete')) // (drawn facing up; the rim's soffit below is what's seen)
  const o = offset(r, OVERHANG)
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], A = o[i], B = o[(i + 1) % r.length]
    const L = Math.hypot(B.x - A.x, B.z - A.z), n = Math.max(1, Math.round(L / WAVE)), m = n * 4
    for (let j = 0; j < m; j++) {
      const t0 = j / m, t1 = (j + 1) / m
      const h = (t: number): number => y + EAVE + AMP * Math.cos(2 * Math.PI * n * t) // crests at every corner
      const lerp = (p: P, q: P, t: number): P => ({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t })
      const i0 = lerp(a, b, t0), i1 = lerp(a, b, t1), e0 = lerp(A, B, t0), e1 = lerp(A, B, t1)
      const P4: [number, number, number][] = [[i0.x, top, i0.z], [i1.x, top, i1.z], [e1.x, h(t1), e1.z], [e0.x, h(t0), e0.z]]
      const ux = P4[1][0] - P4[0][0], uy = P4[1][1] - P4[0][1], uz = P4[1][2] - P4[0][2], vx = P4[3][0] - P4[0][0], vy = P4[3][1] - P4[0][1], vz = P4[3][2] - P4[0][2]
      let nn: [number, number, number] = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
      const l = Math.hypot(...nn) || 1
      nn = [nn[0] / l, nn[1] / l, nn[2] / l]
      if (nn[1] < 0) nn = [-nn[0], -nn[1], -nn[2]]
      out.quad(P4, nn, UV, CANOPY, surfaceTag('concrete'))
      // its underside, a rim's thickness down
      const D4 = P4.map(([px, py, pz]) => [px, py - RIM, pz] as [number, number, number])
      out.quad(D4, [-nn[0], -nn[1], -nn[2]], UV, SOFFIT, surfaceTag('concrete'))
      // the rim's edge
      const en = norm(B.z - A.z, -(B.x - A.x))
      out.quad([P4[3], P4[2], D4[2], D4[3]], [en.x, 0, en.z], UV, shade(CANOPY, 0.93), surfaceTag('concrete'))
    }
  }
}

/** a bed behind its red parapet, its grass and (in the big ones) its trees; `trees` scales how many */
function bed(out: MeshBuilder, r: P[], y: number, id: number, trees = 1): void {
  faceBand(out, r, y, y + BED_H, { kind: 'blank', wall: PARAPET, material: 'concrete' })
  capPolygon(out, r, y + BED_H, LAWN, surfaceTag('clipped'))
  const A = area(r), n = Math.floor((A / TREE_AREA) * trees)
  const xs = r.map((p) => p.x), zs = r.map((p) => p.z)
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs)
  for (let k = 0, tries = 0; k < n && tries < n * 8; tries++) {
    const x = x0 + hash(id, tries) * (x1 - x0), z = z0 + hash(tries, id) * (z1 - z0)
    if (!inside(r, x, z)) continue
    k++
    const h = 5 + hash(x, z) * 4
    prism(out, x, z, y + BED_H, y + BED_H + h * 0.45, 0.22, 5, TRUNK)
    blob(out, x, y + BED_H + h * 0.68, z, 1.8 + hash(z, x) * 1.2, h * 0.32, LEAF)
  }
  // shrubs in every bed, small ones included
  const m = Math.max(1, Math.floor(A / 25))
  for (let k = 0, tries = 0; k < m && tries < m * 8; tries++) {
    const x = x0 + hash(id + 7, tries) * (x1 - x0), z = z0 + hash(tries, id + 7) * (z1 - z0)
    if (!inside(r, x, z)) continue
    k++
    blob(out, x, y + BED_H + 0.4, z, 0.9, 0.55, SHRUB)
  }
}

function playground(out: MeshBuilder, r: P[], y: number, id: number): void {
  capPolygon(out, r, y + 0.05, RUBBER, surfaceTag('concrete'))
  let cx = 0, cz = 0
  for (const p of r) { cx += p.x / r.length; cz += p.z / r.length }
  // a climbing frame and a slide's tower
  block(out, cx - 1.5, cx + 1.5, cz - 1, cz + 1, y, y + 2.4, hex('#c9473a'))
  prism(out, cx + 3, cz + hash(id, 1) * 2, y, y + 3, 0.7, 6, hex('#e0b53a'))
}

/** the white planters and the ring-headed lamps, in rows along each side of the shops */
function furniture(out: MeshBuilder, D: P[], y: number): void {
  const a = (AXIS * Math.PI) / 180, ax = { x: Math.sin(a), z: Math.cos(a) }, nx = { x: ax.z, z: -ax.x }
  const shops = PAGODES.map((p) => ring(p.r))
  let cx = 0, cz = 0
  for (const s of shops) for (const p of s) { cx += p.x; cz += p.z }
  const nPts = shops.reduce((t, s) => t + s.length, 0)
  cx /= nPts
  cz /= nPts
  const clear = (x: number, z: number, d: number): boolean => inside(D, x, z) && shops.every((s) => s.every((p) => Math.hypot(p.x - x, p.z - z) > d) && !inside(s, x, z))
  for (const side of [-1, 1]) for (let k = -6; k <= 6; k++) {
    const x = cx + ax.x * k * SPACING + nx.x * side * ROW, z = cz + ax.z * k * SPACING + nx.z * side * ROW
    if (!clear(x, z, OVERHANG + 0.5)) continue
    if ((k & 1) === 0) {
      // a round white planter and its shrub
      prism(out, x, z, y, y + 0.85, 1.5, 14, PLANTER, surfaceTag('concrete'))
      blob(out, x, y + 1.3, z, 1.3, 0.7, SHRUB)
    } else lamp(out, x, z, y)
    // a long rectangular planter between, a little further out
    const px = x + nx.x * side * 3.5, pz = z + nx.z * side * 3.5
    if (clear(px, pz, OVERHANG + 0.5) && hash(k, side) > 0.4) {
      const q = new MB()
      block(q, -2.4, 2.4, -0.9, 0.9, y, y + 0.8, PLANTER)
      blob(q, -1, y + 1.15, 0, 1.2, 0.6, SHRUB)
      blob(q, 1.1, y + 1.2, 0, 1.1, 0.7, SHRUB)
      placed(out, q, a + Math.PI / 2, px, pz)
    }
  }
}

/** a dark pole with its saucer and the wire ring hung round it */
function lamp(out: MeshBuilder, x: number, z: number, y: number): void {
  prism(out, x, z, y, y + 0.5, 0.35, 6, shade(PLANTER, 0.8))
  prism(out, x, z, y, y + 5.2, 0.09, 6, LAMP)
  prism(out, x, z, y + 5.2, y + 5.5, 0.75, 10, LAMP, 0, 0.3)
  for (const h of [4.0, 4.9]) prism(out, x, z, h + y, h + y + 0.06, 1.25, 14, hex('#9a9c9e'), 0, 1.25, false)
}

/** a rounded mass: rows of prisms */
function blob(out: MeshBuilder, x: number, y: number, z: number, r: number, h: number, c: Rgb): void {
  const rows = 4
  for (let i = 0; i < rows; i++) {
    const a0 = -Math.PI / 2 + (i / rows) * Math.PI, a1 = -Math.PI / 2 + ((i + 1) / rows) * Math.PI
    prism(out, x, z, y + Math.sin(a0) * h, y + Math.sin(a1) * h, Math.cos(a0) * r, 7, c, surfaceTag('foliage'), Math.cos(a1) * r + 0.01)
  }
}
