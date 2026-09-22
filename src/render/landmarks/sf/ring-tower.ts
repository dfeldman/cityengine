/**
 * Downtown's towers, as a family (SF_PLAN.md §4): most of them are their own footprint extruded — OSM's outline is
 * the building's — so what makes each recognisable is the treatment, not the shape. This builder raises a tower from
 * its fitted footprint (`fit.ring`) and dresses it by a preset:
 *
 * - the facade **pattern**: `vertical` fins or piers (the Embarcadero Center, 555 California's bays), `horizontal`
 *   bands a floor apart (Parc 55, the Marriott), a `grid`;
 * - the **colours** of the wall and the glass: 555 California's carnelian granite, the Embarcadero Center's white
 *   concrete, the Hilton's cream;
 * - **setbacks**: the footprint drawn in at given heights (the wedding-cake tops of the 1920s towers);
 * - the **crown**: flat, stepped, or a mast.
 *
 * Each preset is registered as its own builder (the manifest names it), from photographs and the heights OSM carries.
 * Local frame: the fitted footprint's; +y up.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'

type P2 = { x: number; z: number }

export interface TowerPreset {
  height: number
  wall: Rgb
  glass: Rgb
  pattern: 'vertical' | 'horizontal' | 'grid'
  /** metres between fins / floors */
  pitch: number
  /** the pattern's wall share, 0..1 (how much of each pitch is wall rather than glass) */
  solid: number
  /** [fraction of the height, metres drawn in] */
  setbacks?: [number, number][]
  crown?: 'flat' | 'stepped' | 'mast' | 'lantern'
  /** a base of a different colour up to this height (a podium, a lobby) */
  base?: { height: number; colour: Rgb }
}

/** The footprint drawn in by d metres (toward its centroid; enough for the setbacks of a tower). */
function inset(ring: P2[], d: number): P2[] {
  let cx = 0
  let cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= ring.length
  cz /= ring.length
  return ring.map((p) => {
    const dx = p.x - cx
    const dz = p.z - cz
    const l = Math.hypot(dx, dz) || 1
    const k = Math.max(0.2, (l - d) / l)
    return { x: cx + dx * k, z: cz + dz * k }
  })
}

/** One band of wall between y0 and y1 on the ring, the pattern applied: each edge split into fins or bands. */
function band(out: MeshBuilder, ring: P2[], y0: number, y1: number, p: TowerPreset): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.2) continue
    const nx = (b.z - a.z) / L
    const nz = -(b.x - a.x) / L
    const quad = (u0: number, u1: number, ya: number, yb: number, c: Rgb, out_: number): void => {
      const P = (u: number, y: number): [number, number, number] => [a.x + (b.x - a.x) * u + nx * out_, y, a.z + (b.z - a.z) * u + nz * out_]
      out.quad([P(u0, ya), P(u1, ya), P(u1, yb), P(u0, yb)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
    }
    if (p.pattern === 'vertical') {
      const n = Math.max(1, Math.round(L / p.pitch))
      for (let k = 0; k < n; k++) {
        const u0 = k / n
        const u1 = (k + 1) / n
        const us = u0 + (u1 - u0) * p.solid
        quad(u0, us, y0, y1, p.wall, 0.25)                 // the fin, proud of the glass
        quad(us, u1, y0, y1, p.glass, 0)
        // and the fin's two cheeks, so it has depth seen along the face
        const tx = (b.x - a.x) / L
        const tz = (b.z - a.z) / L
        for (const [u, sgn] of [[u0, -1], [us, 1]] as const) {
          const x = a.x + (b.x - a.x) * u
          const z = a.z + (b.z - a.z) * u
          out.quad([[x, y0, z], [x + nx * 0.25, y0, z + nz * 0.25], [x + nx * 0.25, y1, z + nz * 0.25], [x, y1, z]],
            [tx * sgn, 0, tz * sgn], [[0, 0], [1, 0], [1, 1], [0, 1]], p.wall, 0)
        }
      }
    } else {
      // horizontal bands (and a grid adds mullions)
      const floors = Math.max(1, Math.round((y1 - y0) / p.pitch))
      for (let f = 0; f < floors; f++) {
        const ya = y0 + ((y1 - y0) * f) / floors
        const yb = y0 + ((y1 - y0) * (f + 1)) / floors
        const ys = ya + (yb - ya) * p.solid
        quad(0, 1, ya, ys, p.wall, 0.15)
        if (p.pattern === 'grid') {
          const n = Math.max(1, Math.round(L / 3))
          for (let k = 0; k < n; k++) {
            quad(k / n, k / n + 0.12 / n * 3, ys, yb, p.wall, 0.1)
            quad(k / n + 0.12 / n * 3, (k + 1) / n, ys, yb, p.glass, 0)
          }
        } else quad(0, 1, ys, yb, p.glass, 0)
      }
    }
  }
}

/** The roof of a ring at height y (a fan from its centroid: tower footprints are near-convex). */
function cap(out: MeshBuilder, ring: P2[], y: number, c: Rgb): void {
  let cx = 0
  let cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= ring.length
  cz /= ring.length
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    out.quad([[a.x, y, a.z], [b.x, y, b.z], [cx, y, cz], [cx, y, cz]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
  }
}

export function ringTower(out: MeshBuilder, fit: Fit, p: TowerPreset): void {
  const given = fit.ring && fit.ring.length >= 3
    ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  // counter-clockwise in (x, z), so each edge's (dz, −dx) is its outward normal whatever order the ring came in
  let area = 0
  for (let i = 0; i < given.length; i++) { const a = given[i]; const b = given[(i + 1) % given.length]; area += a.x * b.z - b.x * a.z }
  const ring = area >= 0 ? given : [...given].reverse()
  // the building's own height from the manifest (OSM's), the preset's where there is none
  const H = fit.height >= 40 ? fit.height : p.height
  const cuts = [0, ...(p.setbacks ?? []).map(([f]) => f * H), H]
  let r = ring
  let drawn = 0
  const base = p.base?.height ?? 0
  if (p.base) {
    band(out, r, 0, base, { ...p, wall: p.base.colour, glass: p.base.colour, pattern: 'horizontal', pitch: base, solid: 0.3 })
  }
  for (let i = 0; i < cuts.length - 1; i++) {
    const y0 = Math.max(cuts[i], base)
    const y1 = cuts[i + 1]
    if (i > 0) {
      drawn += p.setbacks![i - 1][1]
      const next = inset(ring, drawn)
      cap(out, r, cuts[i], p.wall)           // the ledge left by the setback
      r = next
    }
    if (y1 > y0) band(out, r, y0, y1, p)
  }
  cap(out, r, H, p.wall)
  // the crown
  let cx = 0
  let cz = 0
  for (const q of r) { cx += q.x; cz += q.z }
  cx /= r.length
  cz /= r.length
  if (p.crown === 'stepped') {
    const r2 = inset(r, 3)
    band(out, r2, H, H + 5, { ...p, pattern: 'vertical', solid: 0.7 })
    cap(out, r2, H + 5, p.wall)
    const r3 = inset(r2, 3)
    band(out, r3, H + 5, H + 9, { ...p, pattern: 'vertical', solid: 0.8 })
    cap(out, r3, H + 9, p.wall)
  } else if (p.crown === 'mast') {
    box(out, cx, H + 12, cz, 0.6, 12, 0.6, [0.6, 0.6, 0.62], 0)
  } else if (p.crown === 'lantern') {
    const r2 = inset(r, Math.min(6, Math.max(2, Math.sqrt(fit.hx * fit.hz) * 0.35)))
    band(out, r2, H, H + 6, { ...p, pattern: 'vertical', solid: 0.5 })
    cap(out, r2, H + 6, p.wall)
  }
}

// ---- the presets, one per building (heights from OSM; treatments from photographs) --------------------

const preset = (p: TowerPreset) => (out: MeshBuilder, fit: Fit): void => ringTower(out, fit, p)

export const TOWER_PRESETS = {
  /** 555 California (the Bank of America Center, 1969): carnelian granite in sawtooth bays up every face */
  fiveFiveFiveCalifornia: preset({ height: 237, wall: [0.36, 0.2, 0.18], glass: [0.16, 0.14, 0.15], pattern: 'vertical', pitch: 3, solid: 0.55, crown: 'flat' }),
  /** Embarcadero Center 1–4 (1971–82): slabs of white precast concrete, deep vertical fins, windows between */
  embarcaderoCenter: preset({ height: 170, wall: [0.86, 0.85, 0.82], glass: [0.3, 0.33, 0.37], pattern: 'vertical', pitch: 3.2, solid: 0.45, crown: 'flat' }),
  /** Hilton San Francisco Union Square, Tower 2 (1971): cream concrete, piers up the faces, a stepped top */
  hiltonUnionSquare: preset({ height: 150, wall: [0.87, 0.84, 0.76], glass: [0.26, 0.28, 0.31], pattern: 'vertical', pitch: 2.4, solid: 0.5, crown: 'stepped', setbacks: [[0.9, 2]] }),
  /** Parc 55 (1984): a bent slab banded floor by floor in pale concrete and dark glass */
  parc55: preset({ height: 125, wall: [0.84, 0.82, 0.78], glass: [0.2, 0.23, 0.27], pattern: 'horizontal', pitch: 3.1, solid: 0.5, crown: 'flat' }),
  /** Millennium Tower (2009): blue-grey glass in a fine grid, stepping in at the top */
  millenniumTower: preset({ height: 197, wall: [0.62, 0.66, 0.7], glass: [0.38, 0.47, 0.56], pattern: 'grid', pitch: 3.2, solid: 0.18, setbacks: [[0.85, 3], [0.93, 3]], crown: 'flat' }),
  /** 181 Fremont (2018): glass with its diagonal-braced frame, a sloped crown and mast */
  fremont181: preset({ height: 244, wall: [0.7, 0.73, 0.76], glass: [0.4, 0.5, 0.6], pattern: 'grid', pitch: 3.6, solid: 0.15, crown: 'mast' }),
  /** One Rincon Hill (2008): pale glass and white bands, the flat crown */
  oneRinconHill: preset({ height: 195, wall: [0.84, 0.86, 0.88], glass: [0.44, 0.55, 0.64], pattern: 'horizontal', pitch: 3, solid: 0.2, crown: 'lantern' }),
  /** the Russ Building (1927): buff terracotta Gothic, stepping in to its tower */
  russBuilding: preset({ height: 133, wall: [0.86, 0.8, 0.68], glass: [0.3, 0.3, 0.3], pattern: 'vertical', pitch: 2.2, solid: 0.55, setbacks: [[0.72, 4], [0.86, 4]], crown: 'stepped' }),
  /** the Shell Building (1929): Art Deco terracotta, setbacks to a crowned top */
  shellBuilding: preset({ height: 116, wall: [0.86, 0.8, 0.66], glass: [0.3, 0.3, 0.31], pattern: 'vertical', pitch: 2.2, solid: 0.6, setbacks: [[0.75, 3], [0.88, 3]], crown: 'lantern' }),
  /** the Marriott Marquis (1989), "the jukebox": mirrored blue glass stepping back in tiers */
  marriottMarquis: preset({ height: 133, wall: [0.7, 0.72, 0.74], glass: [0.3, 0.42, 0.56], pattern: 'horizontal', pitch: 3.2, solid: 0.25, setbacks: [[0.55, 4], [0.72, 4], [0.86, 4]], crown: 'stepped' }),
  /** Westin St. Francis tower (1972): white, banded, beside the old hotel */
  westinTower: preset({ height: 120, wall: [0.86, 0.86, 0.84], glass: [0.26, 0.3, 0.34], pattern: 'horizontal', pitch: 3, solid: 0.5, crown: 'flat' }),
  /** 101 California (1982): a faceted cylinder of glass bands and granite */
  oneOhOneCalifornia: preset({ height: 183, wall: [0.62, 0.56, 0.52], glass: [0.3, 0.34, 0.4], pattern: 'horizontal', pitch: 3.6, solid: 0.35, crown: 'flat' }),
  /** One Maritime Plaza (1967): dark steel with its exterior X-bracing, white panels */
  oneMaritimePlaza: preset({ height: 121, wall: [0.3, 0.3, 0.32], glass: [0.5, 0.52, 0.55], pattern: 'grid', pitch: 3.6, solid: 0.3, crown: 'flat' }),
}
