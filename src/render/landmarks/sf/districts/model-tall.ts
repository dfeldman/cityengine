/** The five tall buildings from the manual tier: over 100 m each, and the skyline is mostly these. */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { faceBand, towerRing, tower, type TowerSpec } from '../../tower.ts'
import { boxAlong, edgeAt, longestEdge, offsetRing } from '../../parts.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { box, type Rgb } from '../../../models.ts'

const spec = (s: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, s)

const WHITE_PANEL: Rgb = [0.88, 0.89, 0.9]
const MIRA_GLASS: Rgb = [0.45, 0.55, 0.64]

/**
 * MIRA (Studio Gang, 2020), 160 Folsom / 280 Spear: 40 storeys of triangular bay windows that turn a little on
 * every floor, so the bays' apexes run up the tower as spirals. The `bays` face of the tower grammar draws one
 * fixed plan on every floor (tower.ts faceBand, case 'bays'), so the twist is written out here: floor by floor,
 * a triangular bay per 4.3 m of perimeter whose apex slides along the bay as the floor rises, one flank white
 * metal and the other glass, swapping as the apex crosses the middle — which is what makes the spiral read.
 */
function mira(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height > 80 && fit.height < 200 ? fit.height : 129
  const y0 = 7
  const floors = Math.max(1, Math.round((H - y0) / 3.2))
  const fh = (H - y0) / floors
  const PITCH = 5.5
  const DEPTH = 2.2
  const panel = surfaceTag('metal')
  const glassTag = surfaceTag('glass')
  // the glazed lobby, and the shaft behind the bays so no gap shows between them
  faceBand(out, ring, 0, y0, { kind: 'curtain', wall: [0.5, 0.52, 0.55], glass: [0.3, 0.38, 0.44], pitch: 3, floor: 5.5 })
  faceBand(out, ring, y0, H, { kind: 'blank', wall: [0.7, 0.72, 0.74], material: 'metal' })
  let s = 0
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    const bays = Math.max(1, Math.round(e.L / PITCH))
    const bw = e.L / bays
    for (let k = 0; k < bays; k++) {
      // a perimeter coordinate, so the spiral runs on across the corners
      const su = s + (k + 0.5) * bw
      for (let f = 0; f < floors; f++) {
        // the bay's apex, sliding along the bay as it rises: a turn every ~22 floors, and a phase that walks
        // round the building, so the apexes line up on diagonals
        const t = 0.5 + 0.42 * Math.sin(Math.PI * 2 * (f / 22 + su / 70))
        const ya = y0 + f * fh
        const yb = ya + fh - 0.12
        const ua = k * bw
        const ub = (k + 1) * bw
        const up = ua + (ub - ua) * t
        const P = (u: number, o: number, y: number): [number, number, number] =>
          [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
        const flanks: [number, number, Rgb, number][] = t >= 0.5
          ? [[ua, up, MIRA_GLASS, glassTag], [up, ub, WHITE_PANEL, panel]]
          : [[ua, up, WHITE_PANEL, panel], [up, ub, MIRA_GLASS, glassTag]]
        for (const [u0, u1, c, tag] of flanks) {
          const o0 = u0 === up ? DEPTH : 0
          const o1 = u1 === up ? DEPTH : 0
          const n: [number, number, number] = [e.nx + e.tx * (o0 - o1) * 0.35, 0, e.nz + e.tz * (o0 - o1) * 0.35]
          /*
           * The uv is the ROOM, not a texture coordinate: the glass shader takes floor(vUV) as the identity of
           * the room behind the pane, so a whole pane lights at night instead of a speckle
           * (cartoon-material.ts, `vec2 room = floor(vUV + 0.001)`). A hand-written quad that passes 0..1 gives
           * every bay on the tower the same room, so they all light or none do. Counting bays along and floors
           * up is what the tower grammar does, and it is what makes a glass tower read after dark.
           */
          const bay = (s + k * bw) / PITCH
          out.quad([P(u0, o0, ya), P(u1, o1, ya), P(u1, o1, yb), P(u0, o0, yb)], n,
            [[bay, f], [bay + 0.99, f], [bay + 0.99, f + 0.99], [bay, f + 0.99]], c, tag)
        }
        // the slab edge over the bay: the band that makes it a STACK of turned bays rather than a smooth twist
        out.quad([P(ua, 0, yb), P(up, DEPTH, yb), P(ub, 0, yb), P(ua, 0, yb)], [0, 1, 0],
          [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE_PANEL, panel)
      }
    }
    s += e.L
  }
  // the top: the bays run out as a jagged white parapet, as they do on the real tower
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    const n = Math.max(1, Math.round(e.L / PITCH))
    for (let k = 0; k < n; k++) {
      const P = (t: number, y: number): [number, number, number] => [e.a.x + e.tx * t * e.L, y, e.a.z + e.tz * t * e.L]
      const t0 = k / n
      const t1 = (k + 1) / n
      const tm = (t0 + t1) / 2
      out.quad([P(t0, H), P(tm, H + 5), P(tm, H + 5), P(t0, H)], [e.nx, 0.4, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE_PANEL, panel)
      out.quad([P(tm, H + 5), P(t1, H), P(t1, H), P(tm, H + 5)], [e.nx, 0.4, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE_PANEL, panel)
    }
  }
}

/**
 * 101 Second Street (SOM, 1999): a pale green glass office volume beside a limestone service shaft that carries
 * on past the roofline under its glass veil over the plant.
 */
function oneOhOneSecond(out: MeshBuilder, fit: Fit): void {
  tower(out, fit, {
    height: 108,
    base: { height: 9, face: { kind: 'curtain', wall: [0.62, 0.6, 0.56], glass: [0.4, 0.5, 0.5], pitch: 3, floor: 6 } },
    tiers: [{ to: 1, face: { kind: 'curtain', wall: [0.7, 0.72, 0.72], glass: [0.5, 0.62, 0.6], pitch: 1.6, solid: 0.12, floor: 3.9, material: 'metal' } }],
    roof: [0.45, 0.46, 0.46],
    crown: { kind: 'parapet', height: 1 },
  })
  const ring = towerRing(fit)
  const H = fit.height > 70 && fit.height < 160 ? fit.height : 108
  // the limestone shaft across one end of the footprint, up past the roof, with the glass veil on it
  const e = edgeAt(ring, longestEdge(ring))
  const cx = e.a.x + e.tx * e.L * 0.7
  const cz = e.a.z + e.tz * e.L * 0.7
  boxAlong(out, cx + e.nx * 2.4, (H + 9) / 2, cz + e.nz * 2.4, e.L * 0.17, (H + 9) / 2, 6, e.heading, [0.84, 0.82, 0.76], surfaceTag('ashlar'))
  boxAlong(out, cx + e.nx * 2.4, H + 13, cz + e.nz * 2.4, e.L * 0.15, 4, 5.4, e.heading, [0.55, 0.62, 0.62], surfaceTag('glass'))
}

/**
 * 101 Second's ATRIUM (way/80296724): the public four-storey glass hall along Second Street in front of the tower. OSM tags this slab with the whole complex's address and a 99 m height,
 * which drew a second glass tower beside the first (2026-10-02, docs/SALESFORCE-PARK.md); the height is the hall's.
 */
function oneOhOneSecondAtrium(out: MeshBuilder, fit: Fit): void {
  // from a Mapillary panorama on Second Street beside No. 121: reflective blue glass in white horizontal mullions,
  // five storeys, under a thin white roof plate that oversails the glass
  const H = 21
  tower(out, { ...fit, height: H }, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'curtain', wall: [0.9, 0.9, 0.88], glass: [0.34, 0.48, 0.64], pitch: 3, floor: 2.6, material: 'glass' } }],
    roof: [0.9, 0.9, 0.88],
    crown: { kind: 'flat' },
  })
  const ring = towerRing(fit)
  const e = edgeAt(ring, longestEdge(ring))
  const W = Math.min(fit.hx, fit.hz) * 2
  boxAlong(out, e.a.x + e.tx * e.L / 2 - e.nx * (W / 2 - 1), H + 0.3, e.a.z + e.tz * e.L / 2 - e.nz * (W / 2 - 1),
    e.L / 2 + 1.2, 0.3, W / 2 + 1, e.heading, [0.92, 0.92, 0.9], surfaceTag('metal'))
}

export const MODEL_TALL: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  oneOhOneSecondAtrium,
  mira,
  oneOhOneSecond,

  /** MIRA's mid-rise wing on Folsom (2020): six storeys of cream and dark-red panels with deep dark windows. */
  miraPodium: spec({
    height: 22,
    base: { height: 5, face: { kind: 'curtain', wall: [0.35, 0.22, 0.2], glass: [0.24, 0.28, 0.28], pitch: 3.4, floor: 5 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.78, 0.74, 0.66], glass: [0.22, 0.29, 0.29], pitch: 3.2, solid: 0.42, floor: 3.2, material: 'metal' } }],
    roof: [0.4, 0.38, 0.37],
    crown: { kind: 'parapet', height: 0.8 },
  }),

  /**
   * Hilton San Francisco Financial District, 750 Kearny (Clement Chen with John Carl Warnecke & Associates,
   * opened 1970/71).
   *
   * REBUILT TWICE on 2026-09-24 (owner verdict 5, docs/LADDER.md tier 5).
   *
   * Pass 1 killed the 2026-09-22 three-winged-Y-in-PLAN (invented with no reference frame — none exists for
   * this way in docs/shots/refs/{sf-fetch/done.csv,sf-mapillary,sf-commons}) but replaced it with a plain
   * rectangular slab, reading "rectangular" out of the web sources (Wikipedia; SF YIMBY; Docomomo NorCal) as a
   * PLAN shape. The owner corrected this: the sources' "rectangular" was the footprint, and the ELEVATION is
   * anything but. Their words: "It is a single wing, no multiple wings. BUT it is a Y with the two legs going
   * to the ground, narrowing into a tower. Think of turning a Y upside down, then extruding it. The two Y
   * shaped faces are plain concrete, while the windows are on the extruded sides... Think Fermilab" (Wilson
   * Hall: two converging concrete towers, blank structural faces on one axis, glazing on the other).
   *
   * So: an inverted-Y PROFILE (two legs splayed apart at the ground, leaning together, merging into one shaft
   * partway up) drawn in the (z, y) plane, EXTRUDED along x. Concretely, at any height y the cross-section is
   * either two separate bands in z (below the merge) or one centred band (above it) — the extrusion length in
   * x never changes, only the z-footprint does, so this is built as a stack of z-shifted rectangular tiers,
   * not `setbackTiers` (which insets a whole ring symmetrically and was the wrong tool for a shape that leans
   * to one side and back).
   *
   * WHICH AXIS AND WHICH FACE: `edgeAt()`/longest-edge logic on the REAL Overpass ring for way/260922316 (not
   * the cleaned-up rectangle below) gives a "front" bearing of ~172° and a long axis (fit.hx, 38.8 m) versus a
   * short one (fit.hz, 19.0 m) — so the building is more than twice as long as it is deep. Portsmouth Square's
   * centre sits at bearing ~250° from this building, only ~12° off the LOCAL -x AXIS's world bearing (~262°,
   * i.e. `front ± 90°`), and nowhere near +z/-z (172°/352°). So the square looks at one of the building's
   * SHORT ENDS, not a long flank — and the short ends (hz-wide, hx apart) are exactly where the extrusion
   * profile is legible end-on. Extruding along LOCAL X (the long axis) therefore puts the blank Y-profile
   * faces at x=±hx, facing along the square's sightline — which is what "extremely prominent... adjoins
   * Portsmouth Square" requires: the square sees the blank concrete Y, not a glazed flank. The glazed extruded
   * sides run along z=const for the tiers' current z-span for the full 2×hx length.
   *
   * The rectangle-not-the-raw-ring fix from pass 1 is kept: the real OSM way is a noisy, many-notched polygon
   * (porte-cochère steps, survey jitter) that self-intersected under an offset (BUGS.md #160 is the winding
   * trap, this was a different, reflex-corner one) — but it is now only the EXTRUSION FOOTPRINT, sized from
   * `fit.hx`/`fit.hz`, not the building's massing, which the tiers below fully override.
   */
  hiltonFinancialDistrict: (out: MeshBuilder, fit: Fit): void => {
    /*
     * Reworked 2026-10-02 from the owner's aerial ("the Hilton hotel there looks all wrong"): the legs leaned together
     * over half the tower in ten stair-steps and the square-facing ends were a dark blank — a dark stepped pyramid
     * with a hole in it. The real one is a slender PALE concrete slab, ribbed top to bottom with its windows between
     * the ribs on every face, that FLARES only over its bottom few storeys into two splayed legs — the skybridge from
     * the square landing in the gap between them.
     */
    const H = 91
    const wall: [number, number, number] = [0.74, 0.73, 0.70]
    const rib: [number, number, number] = [0.80, 0.79, 0.76]
    const glass: [number, number, number] = [0.22, 0.23, 0.25]
    const face = { kind: 'punched' as const, wall, glass, pitch: 2.6, floor: 3.15, solid: 0.5, material: 'concrete' as const }
    const concrete = surfaceTag('concrete')
    const hx = Math.min(fit.hx, 34)
    const T = Math.max(7, Math.min(fit.hz * 0.45, 11))   // the slab's half-thickness
    const HZ = Math.max(T + 4, fit.hz)                    // where the legs reach the ground
    const FLARE = 16                                      // the top of the splay
    const GAP = 4.5                                       // half the opening between the legs
    const ARCH = 9                                        // its height

    // the slab, from the top of the flare to the roof
    const slab = [{ x: -hx, z: -T }, { x: hx, z: -T }, { x: hx, z: T }, { x: -hx, z: T }]
    faceBand(out, slab, FLARE, H - 4, face)
    // its ribs: a pale fin every 3 m down every face, standing out of the windows
    for (let i = 0; i < slab.length; i++) {
      const e = edgeAt(slab, i)
      const n = Math.round(e.L / 3)
      for (let k = 1; k < n; k++) {
        const t = k / n
        boxAlong(out, e.a.x + e.tx * e.L * t + e.nx * 0.35, (FLARE + H - 4) / 2, e.a.z + e.tz * e.L * t + e.nz * 0.35, 0.25, (H - 4 - FLARE) / 2, 0.35, e.heading, rib, concrete)
      }
    }
    // the crown: a deeper band, flared a little, the plant boxes on top
    const crown = offsetRing(slab, 1.2)
    faceBand(out, crown, H - 4, H, { kind: 'blank', wall: rib, material: 'concrete' })
    capPolygon(out, crown, H, [0.62, 0.61, 0.58], concrete)
    box(out, -hx * 0.45, H + 2, 0, 5, 2, T * 0.6, wall, concrete)
    box(out, hx * 0.45, H + 2, 0, 5, 2, T * 0.6, wall, concrete)

    // THE LEGS: on each side, a solid splay from the slab's face out to the footprint at the ground, its outer face a
    // slope, its inner face vertical beside the gap; the gap open to ARCH, closed above it
    const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    for (const s of [-1, 1] as const) {
      const zIn = s * GAP
      const zOut0 = s * HZ
      const zOut1 = s * T
      const k = (HZ - T) / FLARE
      // the sloping outer face, with its windows as dark bands
      out.quad([[-hx, 0, zOut0], [hx, 0, zOut0], [hx, FLARE, zOut1], [-hx, FLARE, zOut1]], [0, k, s], uv, wall, concrete)
      for (let f = 1; f < 4; f++) {
        const y = (f / 4) * FLARE
        const z = zOut0 + (zOut1 - zOut0) * (y / FLARE)
        out.quad([[-hx + 1, y - 1.1, z + s * 0.05], [hx - 1, y - 1.1, z + s * 0.05], [hx - 1, y + 0.4, z + s * 0.05 - s * 0.15], [-hx + 1, y + 0.4, z + s * 0.05 - s * 0.15]], [0, k, s], uv, glass, surfaceTag('glass'))
      }
      // the inner face beside the gap, to the arch's head
      out.quad([[-hx, 0, zIn], [hx, 0, zIn], [hx, ARCH, zIn], [-hx, ARCH, zIn]], [0, 0, -s], uv, rib, concrete)
      // the ends: the trapezoid of the splay, at x = ±hx
      for (const ex of [-1, 1] as const) {
        const x = ex * hx
        out.quad([[x, 0, zIn], [x, 0, zOut0], [x, FLARE, zOut1], [x, FLARE, zIn]], [ex, 0, 0], uv, wall, concrete)
      }
    }
    // over the gap: the arch's soffit and the wall above it, up to the slab
    out.quad([[-hx, ARCH, -GAP], [hx, ARCH, -GAP], [hx, ARCH, GAP], [-hx, ARCH, GAP]], [0, -1, 0], uv, rib, concrete)
    for (const ex of [-1, 1] as const) {
      const x = ex * hx
      out.quad([[x, ARCH, -GAP], [x, ARCH, GAP], [x, FLARE, GAP], [x, FLARE, -GAP]], [ex, 0, 0], uv, wall, concrete)
    }
  },


  /**
   * 655 Montgomery, the Montgomery-Washington Tower (1984): buff precast postmodern, dark teal glass, the top
   * storeys stepping back to their terraces.
   */
  montgomeryWashingtonTower: fromRecipe('granite-eighties', {
    height: 103, wall: [0.8, 0.74, 0.62], glass: [0.22, 0.3, 0.31], material: 'concrete', pitch: 3.1, solid: 0.42, floor: 3.6,
    base: 9, baseWall: [0.26, 0.25, 0.25], crown: { kind: 'stepped', steps: 2, height: 6, inset: 2.5 }, penthouse: 1,
  }),
}
