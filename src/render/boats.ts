/**
 * The boats moored along the river, as a per-tile layer (render/city.ts `TileLayer`).
 *
 * Two sources. The OSM boats (`building=boat|houseboat|ship`), each fitted to its own footprint — its long axis,
 * length and beam — and drawn as the KIND its name or its size says (render/paris/named-boats.ts for the famous
 * ones; a péniche, a Dutch barge, a cruiser, a bar barge, a tour boat, a hotel ship, a floating home otherwise).
 * And the HAND-PLACED boats (render/paris/hand-boats.json, traced off IGN aerials with tools/boat-trace.ts): the many
 * OSM does not map, each where it lies in the photo, as the kind the tracer saw; one inside an OSM boat is left to it.
 *
 * A boat floats at the level of the water it lies in. Most have a gangway to the quay, and many houseboats a
 * shore hut beside them — a store, a letterbox, a gate (owner, 2026-11-15) — where the quay is low enough.
 * Each region brings its LIBRARY (`BoatLibrary`): Paris's (below), San Francisco's (render/sf/moored.ts — Sausalito's
 * houseboats). A region without one keeps the plain péniche.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { box, prism, type Rgb } from './models.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import type { TileLayer } from './city.ts'
import type { PackedBoat } from '../city/package.ts'
import type { TileArea } from '../city/tiles.ts'
import type { Terrain } from '../city/terrain.ts'
import { gangway, rnd, shoreHut, HUT } from './moored.ts'
import { MOORED, MOORED_SIZES, type Builder, type MooredKind } from './paris/moored.ts'
import { namedBoat } from './paris/named-boats.ts'
import { TILE } from '../city/tiles.ts'

const FIXED = 0
const HULLS: Rgb[] = [[0.08, 0.09, 0.1], [0.1, 0.16, 0.26], [0.12, 0.24, 0.17], [0.42, 0.1, 0.09], [0.08, 0.09, 0.1], [0.2, 0.2, 0.22]]
const CABINS: Rgb[] = [[0.9, 0.87, 0.8], [0.72, 0.52, 0.33], [0.85, 0.82, 0.74], [0.95, 0.94, 0.9], [0.55, 0.36, 0.22], [0.68, 0.7, 0.72]]

// ── tunables ─────────────────────────────────────────────────────────────────────────────────────────────
/** how far a hand boat may be from a bank and still take its water level (and a gangway, within 25 m) */
const HAND_BANK = 60
/** a traced beam more than this share off its kind's is a misread: the kind's is used */
const BEAM_TRUST = 0.4
/** a hand boat over the quay is pushed out up to this far, in these steps, m */
const PUSH_MAX = 12
const PUSH_STEP = 0.5
/** where a hull is tested afloat: along (share of length) and across (share of beam) */
const HULL_SAMPLES: [number, number][] = [[0, 0], [0.47, 0.5], [0.47, -0.5], [-0.47, 0.5], [-0.47, -0.5], [0, 0.5], [0, -0.5]]
/** a shore hut only where the quay is between these heights above the water (a low port, not the high quay) */
const HUT_RISE: [number, number] = [0.4, 4.8]
/** how far in from the water's edge the hut's face stands */
const HUT_SETBACK = 1.6
/** a gangway only where the quay is no higher than this above the deck */
const GANGWAY_MAX_RISE = 5.5
/** a hand-placed boat's beam keeps this far (m) off a quay wall's land side */
const HAND_WALL_CLEAR = 1.5
/** a hand-placed boat in local metres: stern (a) to bow (b), its beam, its kind, its seed */
export interface LocalHandBoat { ax: number; az: number; bx: number; bz: number; w: number; kind: string; seed: number }

/** A region's moored boats: its builders by kind, their sizes (for the ports), what an OSM boat is, and who gets a hut. */
export interface BoatLibrary {
  build: Record<string, Builder>
  sizes: Record<string, { L: [number, number]; B: number }>
  /** an OSM boat's builder and kind (null kind: a one-off), or null to leave it out (it is a landmark) */
  classify(len: number, beam: number, id: number, name?: string): { build: Builder; kind: string | null; seed?: number } | null
  /** the chance a boat of each kind has a shore hut */
  huts: Record<string, number>
}

const inside = (r: number[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}

/** The footprint's long axis, centre, length and beam (a boat is long and narrow, so its axes are clear). */
function fit(ring: number[]): { cx: number; cz: number; len: number; beam: number; angle: number } {
  let cx = 0
  let cz = 0
  const n = ring.length / 2
  for (let i = 0; i < ring.length; i += 2) { cx += ring[i]; cz += ring[i + 1] }
  cx /= n
  cz /= n
  let best = { len: 0, beam: 0, angle: 0, area: Infinity, ox: 0, oz: 0 }
  for (let a = 0; a < Math.PI; a += Math.PI / 90) {
    const ux = Math.sin(a)
    const uz = Math.cos(a)
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
    for (let i = 0; i < ring.length; i += 2) {
      const dx = ring[i] - cx
      const dz = ring[i + 1] - cz
      const u = dx * ux + dz * uz
      const v = dx * uz - dz * ux
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v)
    }
    const area = (u1 - u0) * (v1 - v0)
    if (area < best.area) best = { len: u1 - u0, beam: v1 - v0, angle: a, area, ox: (u0 + u1) / 2, oz: (v0 + v1) / 2 }
  }
  const ux = Math.sin(best.angle)
  const uz = Math.cos(best.angle)
  const c = { cx: cx + best.ox * ux + best.oz * uz, cz: cz + best.ox * uz - best.oz * ux }
  // the long side is the length (a squarish houseboat's rectangle can come out either way round)
  return best.beam > best.len ? { ...c, len: best.beam, beam: best.len, angle: best.angle + Math.PI / 2 } : { ...c, len: best.len, beam: best.beam, angle: best.angle }
}

/** The plain péniche, for regions without a boat library. Local +z, centred, waterline at y = 0. */
function plainPeniche(out: MeshBuilder, len: number, beam: number, id: number): number {
  const h = (k: number): number => ((Math.imul(id ^ (k * 0x9e3779b1), 0x85ebca6b) >>> 0) % 1000) / 1000
  const hull = HULLS[Math.floor(h(1) * HULLS.length)]
  const cabin = CABINS[Math.floor(h(2) * CABINS.length)]
  const L = Math.max(8, Math.min(len, 60)) / 2
  const B = Math.max(3, Math.min(beam, 11)) / 2
  const dark: Rgb = [0.12, 0.14, 0.17]
  box(out, 0, 0.35, -0.8, B, 0.75, L - 0.8, hull, FIXED)
  for (let k = 0; k < 3; k++) box(out, 0, 0.35, L - 0.8 + k * 0.35 + 0.18, B * (0.85 - k * 0.22), 0.75, 0.18, hull, FIXED)
  box(out, 0, 1.08, -0.8, B + 0.04, 0.05, L - 0.8, [0.9, 0.9, 0.86], FIXED)
  box(out, 0, 1.12, 0, B - 0.1, 0.02, L - 0.3, [0.45, 0.33, 0.22], FIXED)
  const c0 = -L + 2.5
  const c1 = L - 3.5
  const ch = beam > 5 ? 2.3 : 1.9
  box(out, 0, 1.12 + ch / 2, (c0 + c1) / 2, B - 0.5, ch / 2, (c1 - c0) / 2, cabin, FIXED)
  box(out, 0, 1.12 + ch + 0.06, (c0 + c1) / 2, B - 0.35, 0.06, (c1 - c0) / 2 + 0.15, [0.32, 0.33, 0.34], FIXED)
  for (let z = c0 + 1.2; z < c1 - 0.6; z += 1.8) for (const s of [-1, 1]) box(out, s * (B - 0.48), 1.12 + ch * 0.6, z, 0.03, ch * 0.22, 0.55, dark, FIXED)
  box(out, 0, 1.12 + 1.1, -L + 1.3, B * 0.55, 1.1, 0.9, cabin, FIXED)
  if (len > 20 && h(3) > 0.35) prism(out, 0, (c0 + c1) / 2, 1.12 + ch, 1.12 + ch + 2.2, 0.04, 6, dark, FIXED)
  return 1.12
}

/** What an unnamed OSM boat is, from its size (and its id, for the share of each). */
function kindOf(len: number, beam: number, id: number): MooredKind {
  const r = rnd(id)()
  if (len > 75) return beam > 13 ? 'venue' : 'hotel'
  if (beam > 8.5) return len > 45 && r > 0.5 ? 'venue' : 'floatHome'
  if (len < 13) return r > 0.85 ? 'police' : 'cruiser'
  if (len < 28) return r < 0.55 ? 'dutch' : r < 0.7 ? 'cruiser' : 'peniche'
  if (len < 46) return r < 0.8 ? 'peniche' : 'venue'
  return r < 0.6 ? 'venue' : 'tourBoat'
}

/** Paris: the péniches, bars and homes of render/paris/moored.ts, the famous boats by name */
export const PARIS_BOATS: BoatLibrary = {
  build: MOORED, sizes: MOORED_SIZES,
  huts: { peniche: 0.55, dutch: 0.45, floatHome: 0.4, venue: 0.25, cruiser: 0.15 },
  classify(len, beam, id, name) {
    const named = namedBoat(name)
    if (named?.skip) return null
    if (named?.build) return { build: named.build, kind: null, seed: named.seed }
    const kind = named?.kind ?? kindOf(len, beam, id)
    return { build: MOORED[kind], kind, seed: named?.seed }
  },
}

/** Copy a boat built in its own frame into the tile's builder: rotated by `angle` about y (local +z → (sin, cos)), lifted to `y`. */
function place(out: MeshBuilder, part: MeshBuilder, cx: number, y: number, cz: number, angle: number): void {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const base = out.positions.length / 3
  for (let i = 0; i < part.positions.length; i += 3) {
    const x = part.positions[i]
    const z = part.positions[i + 2]
    out.positions.push(cx + x * c + z * s, y + part.positions[i + 1], cz - x * s + z * c)
    const nx = part.normals[i]
    const nz = part.normals[i + 2]
    out.normals.push(nx * c + nz * s, part.normals[i + 1], -nx * s + nz * c)
  }
  for (const v of part.uvs) out.uvs.push(v)
  for (const v of part.colors) out.colors.push(v)
  for (const idx of part.indices) out.indices.push(base + idx)
}

interface Edge { ax: number; az: number; bx: number; bz: number; level: number }
interface Bank { px: number; pz: number; tx: number; tz: number; nx: number; nz: number; level: number; d: number }

/** an edge along a tile's border is where the water was cut, not a bank */
const onGrid = (a: number, b: number): boolean => Math.abs(a - Math.round(a / TILE) * TILE) < 0.05 && Math.abs(b - Math.round(b / TILE) * TILE) < 0.05

function banksOf(water: TileArea[]): Edge[] {
  const out: Edge[] = []
  for (const w of water) {
    for (const r of [w.ring, ...((w as { holes?: number[][] }).holes ?? [])]) {
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        const ax = r[j], az = r[j + 1], bx = r[i], bz = r[i + 1]
        if ((ax === bx && onGrid(ax, bx)) || (az === bz && onGrid(az, bz)) || (onGrid(ax, bx) && Math.abs(ax - bx) < 0.05) || (onGrid(az, bz) && Math.abs(az - bz) < 0.05)) continue
        out.push({ ax, az, bx, bz, level: w.level! })
      }
    }
  }
  return out
}

export function boatsLayer(scene: Scene, terrain?: Terrain, lib: BoatLibrary | null = null, hand: LocalHandBoat[] = []): TileLayer {
  return {
    name: 'boats',
    build(near, rect) {
      const boats = (near.tile.boats ?? []) as PackedBoat[]
      // a hand boat is this tile's when its centre is in the tile
      const myHand = lib ? hand.filter((h) => { const x = (h.ax + h.bx) / 2, z = (h.az + h.bz) / 2; return x >= rect.x0 && x < rect.x1 && z >= rect.z0 && z < rect.z1 }) : []
      if (boats.length === 0 && myHand.length === 0) return []
      const water = near.around.areas.filter((a): a is TileArea => a.kind === 'water' && (a as TileArea).level !== undefined)
      if (water.length === 0) return []
      const wet = (x: number, z: number): boolean => water.some((w) => inside(w.ring, x, z) && !((w as { holes?: number[][] }).holes ?? []).some((h) => inside(h, x, z)))
      let edges: Edge[] | null = null
      const bankNear = (x: number, z: number, max: number, want?: { ux: number; uz: number; side: number }): Bank | null => {
        edges ??= banksOf(water)
        let best: Bank | null = null
        for (const e of edges) {
          const dx = e.bx - e.ax, dz = e.bz - e.az
          const L2 = dx * dx + dz * dz
          if (L2 < 1e-6) continue
          const t = Math.max(0, Math.min(1, ((x - e.ax) * dx + (z - e.az) * dz) / L2))
          const px = e.ax + dx * t, pz = e.az + dz * t
          const d = Math.hypot(x - px, z - pz)
          if (d > max || (best && d >= best.d)) continue
          const L = Math.sqrt(L2)
          const c: Bank = { px, pz, tx: dx / L, tz: dz / L, nx: -dz / L, nz: dx / L, level: e.level, d }
          // the normal points INTO the water
          if (!wet(px + c.nx * 1.5, pz + c.nz * 1.5)) { c.nx = -c.nx; c.nz = -c.nz }
          // a bank on the LEFT looking upstream has its water to the right: n · left < 0 (and the other way for the right bank)
          if (want && (c.nx * -want.uz + c.nz * want.ux) * want.side > 0) continue
          best = c
        }
        return best
      }
      const out = new MeshBuilder()
      const ground = (x: number, z: number): number | null => terrain ? terrain.heightAt(x, z) : null

      /** the gangway and maybe the hut, from a boat's bank side to the quay */
      const ashore = (bank: Bank, cx: number, cz: number, B: number, L: number, deck: number, level: number, kind: string | null, seed: number): void => {
        const r = rnd(seed * 13 + 5)
        // the bank point abreast of the boat, and the quay's height a step in from it
        const along = (cx - bank.px) * bank.tx + (cz - bank.pz) * bank.tz
        const ox = (r() - 0.5) * L * 0.4
        const bx = bank.px + bank.tx * (along + ox), bz = bank.pz + bank.tz * (along + ox)
        const qx = bx - bank.nx * 0.8, qz = bz - bank.nz * 0.8
        const g = ground(qx, qz)
        if (g === null || wet(qx, qz)) return
        const rise = g - level
        const side = (cx - bx) * bank.nx + (cz - bz) * bank.nz - B / 2
        if (rise - deck < GANGWAY_MAX_RISE && side < 4) {
          gangway(out, [bx + bank.nx * (side + 0.2), level + deck, bz + bank.nz * (side + 0.2)], [qx, g, qz])
        }
        if (!kind || r() > (lib?.huts[kind] ?? 0) || rise < HUT_RISE[0] || rise > HUT_RISE[1]) return
        const d = HUT.d[1]
        const hx = bx - bank.nx * (HUT_SETBACK + d / 2) + bank.tx * (r() > 0.5 ? 3 : -3)
        const hz = bz - bank.nz * (HUT_SETBACK + d / 2) + bank.tz * (r() > 0.5 ? 3 : -3)
        const hg = ground(hx, hz)
        if (hg === null || wet(hx, hz) || Math.abs(hg - g) > 0.8) return
        if (near.around.buildings.some((b) => Math.abs(b.ring[0] - hx) < 80 && Math.abs(b.ring[1] - hz) < 80 && inside(b.ring, hx, hz))) return
        const part = new MeshBuilder()
        shoreHut(part, seed)
        // local +x towards the water: the frame whose +z is (−nz, nx)
        place(out, part, hx, hg, hz, Math.atan2(-bank.nz, bank.nx))
      }

      // ── the OSM boats ──
      const fits = boats.map((b) => ({ b, f: fit(b.ring) }))
      const osmAround = ((near.around.boats ?? []) as PackedBoat[]).map((b) => b.ring)
      for (const { b, f } of fits) {
        // a boat that is a landmark (the Taj Mahal houseboat, the Piscine Joséphine Baker) is the landmark's to draw
        if (lib && near.around.landmarks.some((lm) => Math.abs(lm.x - f.cx) < 60 && Math.abs(lm.z - f.cz) < 60 && inside(b.ring, lm.x, lm.z))) continue
        const bank = bankNear(f.cx, f.cz, 60)
        const w = water.find((a) => inside(a.ring, f.cx, f.cz))
        const level = w?.level ?? bank?.level
        if (level === undefined) continue
        const part = new MeshBuilder()
        let deck = 1.1
        let kind: string | null = null
        if (!lib) deck = plainPeniche(part, f.len, f.beam, b.id)
        else {
          const c = lib.classify(f.len, f.beam, b.id, b.name)
          if (!c) continue
          kind = c.kind
          deck = c.build(part, Math.max(6, Math.min(f.len, 140)), Math.max(2.5, Math.min(f.beam, 24)), c.seed ?? b.id)
        }
        // bow upstream where the bank says which way that is: the port stretches carry it; else keep the fit's
        place(out, part, f.cx, level + 0.05, f.cz, f.angle)
        if (lib && bank && bank.d < 25) ashore(bank, f.cx, f.cz, f.beam, f.len, deck, level, kind, b.id)
      }

      // ── the hand-placed boats: the ones OSM does not map, traced off IGN aerials (render/paris/hand-boats.json) ──
      for (const h of myHand) {
        const cx0 = (h.ax + h.bx) / 2, cz0 = (h.az + h.bz) / 2
        const L0 = Math.hypot(h.bx - h.ax, h.bz - h.az)
        if (L0 < 3) continue
        const ux = (h.bx - h.ax) / L0, uz = (h.bz - h.az) / L0
        // the OSM boat there is drawn already, with its name
        if (osmAround.some((r) => Math.abs(r[0] - cx0) < 150 && Math.abs(r[1] - cz0) < 150 && inside(r, cx0, cz0))) continue
        // and a modelled boat (the Piscine Joséphine Baker) is its landmark's
        if (near.around.landmarks.some((lm) => Math.abs((lm.x - cx0) * ux + (lm.z - cz0) * uz) < L0 / 2 && Math.abs((lm.x - cx0) * uz - (lm.z - cz0) * ux) < h.w / 2 + 2)) continue
        // afloat, or it was a misread roof on the quay
        if (!wet(cx0, cz0)) continue
        const bank = bankNear(cx0, cz0, HAND_BANK)
        const size = lib!.sizes[h.kind]
        const B = size && Math.abs(h.w / size.B - 1) > BEAM_TRUST ? size.B : h.w
        // OSM's water edge is not the photo's: a hull over the quay is pushed out from the bank, the least that floats it
        // (…and clear of the quay walls: in the Seine band the river's outline runs on under the stone, and boats pushed only until they
        //  were inside it lay through the walls — owner, 2026-11-16, Port Debilly. A hull sample HAND_WALL_CLEAR m out to either beam
        //  must not be on a wall's land side, city/wall-ground.ts `side`)
        const W = terrain?.walls
        const clear = (x: number, z: number): boolean => !W || W.side(x, z, terrain!.stepAt(x, z)) !== 1
        const afloat = (x: number, z: number): boolean => HULL_SAMPLES.every(([u, v]) => {
          const px = x + ux * u * L0 + uz * v * B, pz = z + uz * u * L0 - ux * v * B
          if (!wet(px, pz)) return false
          const m = v === 0 ? 0 : Math.sign(v) * HAND_WALL_CLEAR
          return clear(px + uz * m, pz - ux * m)
        })
        let cx = cx0, cz = cz0
        if (bank && !afloat(cx, cz)) {
          for (let d = PUSH_STEP; d <= PUSH_MAX; d += PUSH_STEP) {
            if (afloat(cx0 + bank.nx * d, cz0 + bank.nz * d)) { cx = cx0 + bank.nx * d; cz = cz0 + bank.nz * d; break }
          }
        }
        const w = water.find((a) => inside(a.ring, cx, cz))
        const level = w?.level ?? bank?.level
        if (level === undefined) continue
        const L = Math.max(6, Math.min(L0, 140))
        const part = new MeshBuilder()
        const deck = lib!.build[h.kind](part, L, Math.max(2.2, Math.min(B, 24)), h.seed)
        place(out, part, cx, level + 0.05, cz, Math.atan2(ux, uz))
        if (bank && bank.d < 25) ashore(bank, cx, cz, B, L, deck, level, h.kind, h.seed)
      }
      if (out.triangles === 0) return []
      const m = new Mesh(`boats:${near.key}`, scene)
      out.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(scene, 'cartoonBoat', false)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}
