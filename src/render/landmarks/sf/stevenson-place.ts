/**
 * Stevenson Place — way/149840694, 103 m, the tallest unmodelled building in the core (MODEL-A-BATCH-E12.md).
 * The owner: *"Stevenson Place has an interesting gabled roof and pediment irl."* The e12 batch's version
 * (`e12_stevensonPlace_149840694`) was `facade()` alone — a punched cream slab with a flat cap — and it lost
 * both features that make the tower recognisable from a distance: the jagged, stepped crown the photographs
 * show (`docs/shots/refs/sf-mapillary/way-149840694-01.jpg` and `-03.jpg`), and the little gabled roof standing
 * above it, with a pediment on the front.
 *
 * KIT + HAND-BUILT ROOF, not custom from scratch: the ten-corner plan is an ordinary orthogonal stepped
 * rectangle (every edge of `towerRing(fit)` runs along the local x or z axis — checked against the baked
 * footprint, not assumed), so `facade()` is exactly right for the punched shaft and the ground floor. What it
 * cannot say is the roofline, so the crown is drawn by hand on top of a `facade()` shaft with `crown: 'flat'`
 * — the mixing `tower.ts`/`facade.ts` calls out as the intended pattern, not a compromise.
 *
 * The hand-built crown, cheapest first: a stepped, crenellated parapet round the whole roofline (every wall's
 * own edge, so it follows the steps in the plan); then, centred on the two long street-facing walls, a small
 * gabled roof block with its own triangular gable ends (the "gabled roof"), and a free-standing triangular
 * pediment standing proud of the wall just under the parapet on the principal (longest) elevation (the
 * "pediment") — two distinct features because the owner named two distinct features.
 *
 * Every dimension is `fit.hx`/`fit.hz`/`fit.height` or a fraction of them; the only integers are counts.
 * Local frame: the fitted footprint's, +y up.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { facade } from '../facade.ts'
import { towerRing } from '../tower.ts'
import { longestEdge } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type P2 = { x: number; z: number }

/** buff terracotta/limestone — the cream stone the photographs show, not white and not tan-precast */
const STONE: Rgb = [0.83, 0.79, 0.68]
const STONE_DARK: Rgb = [0.62, 0.58, 0.48]
const ROOF_DARK: Rgb = [0.28, 0.27, 0.26]
const T_STONE = surfaceTag('terracotta')

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * A stepped, castellated parapet round the roofline — the jagged silhouette the photographs show instead of
 * a flat edge. One merlon standing proud every other bay, on every edge of the ring; since the plan here is
 * strictly orthogonal, a merlon is simply a `box()` sized along whichever axis that edge runs on.
 */
function crenellate(out: MeshBuilder, ring: P2[], y0: number, h: number, proud: number, colour: Rgb): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const L = Math.hypot(dx, dz)
    if (L < 2) continue
    const alongX = Math.abs(dx) >= Math.abs(dz)
    const n = Math.max(2, Math.round(L / 3.4))
    const bw = L / n
    // the outward normal, ccw ring: (dz, -dx)/L — merlons stand proud along it
    const nx = dz / L
    const nz = -dx / L
    for (let k = 0; k < n; k += 2) {
      const u = (k + 0.5) * bw
      const cx = a.x + (dx / L) * u + nx * proud * 0.5
      const cz = a.z + (dz / L) * u + nz * proud * 0.5
      if (alongX) box(out, cx, y0 + h / 2, cz, (bw * 0.62) / 2, h / 2, proud / 2, colour, T_STONE)
      else box(out, cx, y0 + h / 2, cz, proud / 2, h / 2, (bw * 0.62) / 2, colour, T_STONE)
    }
  }
}

/**
 * One triangular gable end, standing at x (facing `dirX` outward), sweeping z0..z1, ridge at (x + dirX*depth,
 * (z0+z1)/2). The mirror of `kit.ts pediment()` (which fixes z and sweeps x) — written directly rather than
 * routed through `placed()`/`rotated()`, because this building's long walls already run along z and there is
 * nothing to gain by rotating a part built for the other axis.
 */
function gableEnd(out: MeshBuilder, x: number, z0: number, z1: number, y0: number, h: number, depth: number,
                  dirX: 1 | -1, colour: Rgb): void {
  const zm = (z0 + z1) / 2
  out.quad([[x, y0, z1], [x, y0, z0], [x, y0 + h, zm], [x, y0 + h, zm]], [dirX, 0, 0], UV, colour, T_STONE)
  out.quad([[x, y0, z0], [x + dirX * depth, y0, z0], [x + dirX * depth, y0 + h, zm], [x, y0 + h, zm]], [0, 0.75, -dirX * 0.5], UV, colour, T_STONE)
  out.quad([[x, y0 + h, zm], [x + dirX * depth, y0 + h, zm], [x + dirX * depth, y0, z1], [x, y0, z1]], [0, 0.75, dirX * 0.5], UV, colour, T_STONE)
}

/**
 * A gabled roof over the tower's own footprint (its bounding box in the fit's frame is close enough — a
 * roof's ridge does not need to trace every step of the plan the way the walls do): a ridge along the long
 * (x) axis, two slopes down to the parapet, and a gable-end wall at each end.
 */
function gabledRoof(out: MeshBuilder, fit: Fit, y0: number): void {
  const rx = fit.hx * 0.86
  const hz = fit.hz * 0.9
  const rise = hz * 0.62
  const ridgeY = y0 + rise
  const slope = (z0: number, nz: number): void => {
    out.quad([[-rx, y0, z0], [rx, y0, z0], [rx, ridgeY, 0], [-rx, ridgeY, 0]], [0, 0.7, nz * 0.7], UV, ROOF_DARK, T_STONE)
  }
  slope(-hz, -1)
  slope(hz, 1)
  gableEnd(out, -rx, -hz, hz, y0, rise, rx * 0.22, -1, STONE_DARK)
  gableEnd(out, rx, -hz, hz, y0, rise, rx * 0.22, 1, STONE_DARK)
  // a squat ridge cap, so the two slopes read as met rather than as a knife edge
  box(out, 0, ridgeY, 0, rx, 0.35, 0.35, STONE_DARK, T_STONE)
}

/**
 * The pediment: a free-standing triangular gable standing PROUD of the wall, centred on the principal
 * (longest) elevation, just under the parapet — the classical feature, independent of the roof above it.
 * Written against the edge's own tangent and normal (not assumed axis-aligned): `towerRing(fit)` runs
 * `simplifyRing` first, which merges the plan's shallow OSM wobble on the back wall into one 43 m run — the
 * true longest edge — and that edge turned out to run along LOCAL X (z roughly constant), the other way
 * round from the two 30 m side walls an unsimplified reading of the ring would suggest.
 */
function frontPediment(out: MeshBuilder, ring: P2[], y0: number): void {
  const i = longestEdge(ring)
  const a = ring[i]
  const b = ring[(i + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const w = L * 0.11
  const depth = w * 0.55
  const rise = w * 0.55
  const um = L / 2
  const P = (u: number, y: number, o: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
  out.quad([P(um - w, y0, depth), P(um + w, y0, depth), P(um, y0 + rise, depth), P(um, y0 + rise, depth)], [nx, 0, nz], UV, STONE, T_STONE)
  out.quad([P(um - w, y0, 0), P(um - w, y0, depth), P(um, y0 + rise, depth), P(um, y0 + rise, 0)], [nx * 0.5, 0.85, nz * 0.5], UV, STONE, T_STONE)
  out.quad([P(um, y0 + rise, 0), P(um, y0 + rise, depth), P(um + w, y0, depth), P(um + w, y0, 0)], [nx * 0.5, 0.85, nz * 0.5], UV, STONE, T_STONE)
}

export function e12_stevensonPlace_149840694(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 60 && fit.height < 150 ? fit.height : 103
  facade(out, fit, {
    ground: { kind: 'plain', storeys: 1, material: 'limestone' },
    shaft: { storeys: 24, windows: 'small', material: 'limestone' },
    top: { kind: 'attic', storeys: 2, material: 'limestone' },
    bands: { aboveGround: 'string', belowTop: 'cornice', top: null },
    crown: { kind: 'flat' },
    frame: null,
    entrance: { at: 'centre', kind: 'door', steps: 1 },
    material: 'limestone',
  })
  const ring = towerRing(fit)
  crenellate(out, ring, H, fit.hx * 0.09, fit.hx * 0.045, STONE_DARK)
  // the pediment sits a storey below the parapet, on the plain wall, so the crenellation above it does not
  // swallow it into the same silhouette
  frontPediment(out, ring, H - fit.hx * 0.16)
  gabledRoof(out, fit, H + fit.hx * 0.09)
}
