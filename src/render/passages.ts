/**
 * Passages: the arches and covered ways that take a street through a building — the Place des Vosges's
 * Pavillon du Roi and Pavillon de la Reine, the portes cochères of the Marais (package edges `passage`).
 *
 * The building above is drawn whole, as the city draws every building; the passage is drawn INTO it: at each
 * wall the street crosses, a dark arched opening a hand's width proud of the facade, and between the two, a
 * dark vault — side walls and a barrel ceiling. Facades are culled from inside, so a rider going in sees the
 * arch, then the vault, then daylight at the far end: a passage, not a street running through a wall.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { unpackPoints, type CityPackage } from '../city/package.ts'
import type { Terrain } from '../city/terrain.ts'
import { style as styleOf } from '../city/facade.ts'
import type { TileLayer } from './city.ts'

type P = { x: number; z: number }
type Rgb = [number, number, number]
// the inside of the vault: the same stone, in shadow — light enough to read as an open passage, not a wall
const DARK: Rgb = [0.5, 0.47, 0.42]
const STONE: Rgb = [0.62, 0.58, 0.51]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

function inside(r: P[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
  }
  return o
}

/** A passage's half-width and arch height, shared by the vault here and the hole the building cuts. */
export function archSize(e: { width: number; foot: boolean }, buildingTop: number): { half: number; top: number } {
  return { half: Math.max(1.4, Math.min(2.4, (e.foot ? e.width : e.width + 1) / 2)), top: Math.min(4.2, Math.max(3, buildingTop - 1.5)) }
}

/**
 * Where passages cross the walls of a building ring: per wall index, the arches to cut (buildings.ts `Arch`).
 * Each passage is carried 3 m past its ends first (OSM splits a way at the building line, often inside it).
 */
export function passageArches(ring: P[], height: number, passages: { points: number[]; width: number; foot: boolean }[])
  : Map<number, { t: number; half: number; top: number }[]> {
  const out = new Map<number, { t: number; half: number; top: number }[]>()
  for (const e of passages) {
    const raw = unpackPoints(e.points)
    if (raw.length < 2) continue
    const ext = (p: P, q: P): P => {
      const l = Math.hypot(p.x - q.x, p.z - q.z) || 1
      return { x: p.x + ((p.x - q.x) / l) * 3, z: p.z + ((p.z - q.z) / l) * 3 }
    }
    const pts = [ext(raw[0], raw[1]), ...raw, ext(raw[raw.length - 1], raw[raw.length - 2])]
    const { half, top } = archSize(e, height)
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      const ex = b.x - a.x
      const ez = b.z - a.z
      const len = Math.hypot(ex, ez)
      if (len < 0.5) continue
      for (let k = 1; k < pts.length; k++) {
        const p = pts[k - 1]
        const q = pts[k]
        const dx = q.x - p.x
        const dz = q.z - p.z
        const den = ex * dz - ez * dx
        if (Math.abs(den) < 1e-9) continue
        const u = ((p.x - a.x) * dz - (p.z - a.z) * dx) / den      // along the wall, 0..1
        const v = ((p.x - a.x) * ez - (p.z - a.z) * ex) / den      // along the passage segment, 0..1
        if (u < 0 || u > 1 || v < 0 || v > 1) continue
        const list = out.get(i) ?? []
        list.push({ t: u * len, half, top })
        out.set(i, list)
      }
    }
  }
  return out
}

/**
 * Passages as a per-tile layer (render/city.ts `TileLayer`): the passages and buildings of the tile and its
 * neighbours, each half metre of vault and each portal drawn by the tile it starts in.
 */
export function passagesLayer(scene: Scene, terrain: Terrain): TileLayer {
  return {
    name: 'passages',
    build(near, rect) {
      const m = buildPassages(scene, near.around, terrain, rect, `passages:${near.key}`)
      return m ? [m] : []
    },
  }
}

function buildPassages(scene: Scene, pkg: Pick<CityPackage, 'edges' | 'buildings'>, terrain: Terrain,
  rect: { x0: number; z0: number; x1: number; z1: number }, name: string): Mesh | null {
  const passages = pkg.edges.filter((e) => e.passage)
  if (passages.length === 0) return null
  const mine = (q: P): boolean => q.x >= rect.x0 && q.x < rect.x1 && q.z >= rect.z0 && q.z < rect.z1
  const CELL = 50
  const grid = new Map<string, { ring: P[]; x0: number; x1: number; z0: number; z1: number; top: number; wall: Rgb }[]>()
  for (const b of pkg.buildings) {
    // on the ground, or a part bridging the passage low enough to be its ceiling
    if ((b.minHeight ?? 0) > 7) continue
    const ring = unpackPoints(b.ring)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    const hex = styleOf(b.style).palettes[0].wall
    const wall: Rgb = [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255]
    const item = { ring, x0, x1, z0, z1, top: b.height ?? 10, wall }
    for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++) {
      for (let gz = Math.floor(z0 / CELL); gz <= Math.floor(z1 / CELL); gz++) {
        const k = `${gx},${gz}`
        ;(grid.get(k) ?? grid.set(k, []).get(k)!).push(item)
      }
    }
  }
  const hitAt = (x: number, z: number): { top: number; wall: Rgb } | null => {
    let best: { top: number; wall: Rgb } | null = null
    for (const q of grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) ?? []) {
      if (x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1 && inside(q.ring, x, z) && (!best || q.top > best.top)) best = q
    }
    return best
  }
  const covered = (x: number, z: number): number | null => hitAt(x, z)?.top ?? null
  // every passage segment, to find where two cross
  const segs = passages.flatMap((e) => {
    const r = unpackPoints(e.points)
    return r.slice(1).map((q, i) => ({ e, a: r[i], b: q }))
  })
  const otherNear = (e: typeof passages[number], p: P, d: number): boolean => segs.some((sg) => {
    if (sg.e === e) return false
    const dx = sg.b.x - sg.a.x
    const dz = sg.b.z - sg.a.z
    const t = Math.max(0, Math.min(1, ((p.x - sg.a.x) * dx + (p.z - sg.a.z) * dz) / (dx * dx + dz * dz || 1)))
    return Math.hypot(sg.a.x + dx * t - p.x, sg.a.z + dz * t - p.z) < d
  })
  const out = new MeshBuilder()
  let arches = 0
  for (const e of passages) {
    const raw = unpackPoints(e.points)
    if (raw.length < 2) continue
    // carried 3 m past both ends: OSM splits a way where it meets the building line, often a metre inside,
    // and a passage that starts inside the wall has no crossing to put the arch on
    const ext = (p: P, q: P): P => {
      const l = Math.hypot(p.x - q.x, p.z - q.z) || 1
      return { x: p.x + ((p.x - q.x) / l) * 3, z: p.z + ((p.z - q.z) / l) * 3 }
    }
    const pts = [ext(raw[0], raw[1]), ...raw, ext(raw[raw.length - 1], raw[raw.length - 2])]
    const half = archSize(e, 10).half
    // samples every half metre along the way, each marked inside or outside a building
    const samples: { p: P; ux: number; uz: number; top: number | null }[] = []
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const len = Math.hypot(b.x - a.x, b.z - a.z)
      if (len < 0.01) continue
      const ux = (b.x - a.x) / len
      const uz = (b.z - a.z) / len
      for (let t = 0; t < len; t += 0.5) {
        const p = { x: a.x + ux * t, z: a.z + uz * t }
        samples.push({ p, ux, uz, top: covered(p.x, p.z) })
      }
    }
    for (let k = 1; k < samples.length; k++) {
      const s0 = samples[k - 1]
      const s1 = samples[k]
      if (!mine(s0.p)) continue
      const top = s0.top ?? s1.top
      if (top === null) continue
      // the vault over this half metre: two side walls and a barrel ceiling, facing in
      const h = archSize(e, top).top
      const nx = -s0.uz
      const nz = s0.ux
      const g0 = terrain.heightAt(s0.p.x, s0.p.z)
      const g1 = terrain.heightAt(s1.p.x, s1.p.z)
      const at = (s: typeof s0, g: number, o: number, y: number): [number, number, number] =>
        [s.p.x + nx * o, g + y, s.p.z + nz * o]
      if (s0.top !== null && s1.top !== null) {
        // side walls for a carriage passage only, and not where another passage crosses it: the Vosges
        // arcades are covered footways, open on one side, and their walls closed off every arch they met
        const crossing = otherNear(e, s0.p, half + 1)
        if (!e.foot && !crossing) for (const side of [-1, 1]) {
          out.quad([at(s0, g0, side * half, 0), at(s1, g1, side * half, 0), at(s1, g1, side * half, h * 0.7), at(s0, g0, side * half, h * 0.7)],
            [-nx * side, 0, -nz * side], UV, DARK, 0)
        }
        /*
         * The barrel stops at the building's outline on each side. A covered way along a facade — the arcade
         * of edge 40125 by the Passage Walter-Benjamin — has its centreline inside the building but half its
         * width out in the street, and its vault stood there as a grey curve over the road (BUGS.md #16).
         */
        const reach = (side: number): number => {
          for (let o = half; o > 0.05; o -= 0.15) {
            if (covered(s0.p.x + nx * side * o, s0.p.z + nz * side * o) !== null
              && covered(s1.p.x + nx * side * o, s1.p.z + nz * side * o) !== null) return o
          }
          return 0
        }
        const lo = reach(-1)
        const hi = reach(1)
        const seg = 6
        for (let i = 0; i < seg; i++) {
          const a0 = Math.PI * (i / seg)
          const a1 = Math.PI * ((i + 1) / seg)
          const o0 = Math.max(-lo, Math.min(hi, -Math.cos(a0) * half))
          const o1 = Math.max(-lo, Math.min(hi, -Math.cos(a1) * half))
          if (Math.abs(o1 - o0) < 0.01) continue
          const y0 = h * 0.7 + Math.sin(a0) * h * 0.3
          const y1 = h * 0.7 + Math.sin(a1) * h * 0.3
          out.quad([at(s0, g0, o0, y0), at(s0, g0, o1, y1), at(s1, g1, o1, y1), at(s1, g1, o0, y0)], [0, -1, 0], UV, DARK, 0)
        }
      }
      // a wall crossed: an arched opening on its face, a stone surround round it, facing out
      if ((s0.top === null) !== (s1.top === null)) {
        const outward = s0.top === null ? -1 : 1      // entering: the face looks back along the way
        const c = s0.top === null ? s1 : s0
        // the exact wall crossing, by bisection between the two samples: the portal must stand just IN FRONT
        // of the facade, or the wall hides all of it but its outline
        let lo = 0
        let hi = 1
        const inAt = (t: number): boolean => covered(s0.p.x + (s1.p.x - s0.p.x) * t, s0.p.z + (s1.p.z - s0.p.z) * t) !== null
        const startIn = s0.top !== null
        for (let it = 0; it < 12; it++) {
          const mid = (lo + hi) / 2
          if (inAt(mid) === startIn) lo = mid
          else hi = mid
        }
        const cross = { x: s0.p.x + (s1.p.x - s0.p.x) * hi, z: s0.p.z + (s1.p.z - s0.p.z) * hi }
        const g = terrain.heightAt(cross.x, cross.z)
        const fx = c.ux * outward
        const fz = c.uz * outward
        const face = { x: cross.x + fx * 0.08, z: cross.z + fz * 0.08 }
        const w = (o: number, y: number, d = 0): [number, number, number] => [face.x + nx * o + fx * d, g + y, face.z + nz * o + fz * d]
        // only where the wall stands behind both feet: an arcade along a facade crosses the building line at
        // a glancing angle, and its "portal" stood alone in the street (BUGS.md #16)
        const backed = (side: number): boolean =>
          covered(cross.x - fx * 0.4 + nx * side * (half + 0.2), cross.z - fz * 0.4 + nz * side * (half + 0.2)) !== null
        if (!backed(-1) || !backed(1)) continue
        const spring = h * 0.7
        const n: [number, number, number] = [fx, 0, fz]
        // the stone ring round the opening — only the ring: the opening itself is open (the building cuts the
        // hole, buildings.ts), so the rider sees daylight through it and rides straight in
        const seg = 10
        const band = 0.4
        for (let i = 0; i < seg; i++) {
          const a0 = Math.PI * (i / seg)
          const a1 = Math.PI * ((i + 1) / seg)
          const pt = (a: number, r: number, rise: number): [number, number, number] => w(-Math.cos(a) * r, spring + Math.sin(a) * rise)
          out.quad([pt(a0, half, h * 0.3), pt(a1, half, h * 0.3), pt(a1, half + band, h * 0.3 + band), pt(a0, half + band, h * 0.3 + band)], n, UV, STONE, 0)
        }
        for (const sx of [-1, 1]) out.quad([w(sx * half, 0), w(sx * (half + band), 0), w(sx * (half + band), spring), w(sx * half, spring)], n, UV, STONE, 0)
        arches++
      }
    }
  }
  if (out.triangles === 0) return null
  const m = new Mesh(name, scene)
  out.toVertexData().applyToMesh(m)
  const mat = cartoonMaterial(scene, 'cartoonPassage', false)
  mat.backFaceCulling = false
  m.material = mat
  m.renderingGroupId = 3
  m.isPickable = false
  m.freezeWorldMatrix()
  void arches
  return m
}
