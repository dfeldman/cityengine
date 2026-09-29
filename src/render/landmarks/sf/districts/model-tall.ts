/** The five tall buildings from the manual tier: over 100 m each, and the skyline is mostly these. */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { faceBand, towerRing, tower, type TowerSpec } from '../../tower.ts'
import { boxAlong, edgeAt, longestEdge, offsetRing } from '../../parts.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Rgb } from '../../../models.ts'

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

export const MODEL_TALL: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
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
    const H = 91
    const wall: [number, number, number] = [0.79, 0.74, 0.66]
    const dark: [number, number, number] = [0.66, 0.62, 0.56]
    const glass: [number, number, number] = [0.24, 0.24, 0.26]
    const blankFace = { kind: 'blank' as const, wall: dark, material: 'concrete' as const }
    const glazedFace = { kind: 'punched' as const, wall, glass, pitch: 3.0, floor: 3.15, solid: 0.55, material: 'concrete' as const }

    const hx = fit.hx
    const T = fit.hz * 0.28 // leg/shaft half-thickness, held constant so the two legs become the shaft exactly
    const outerZ0 = fit.hz - T // each leg's centre at the ground: its outer face sits on the real footprint edge
    const convergeY = H * 0.52 // height at which the two legs' centrelines both reach z=0 and fully coincide

    // a rectangle of the extrusion's full length (x) and the tier's own z-span, centred on `c`
    const tierRing = (c: number): { x: number; z: number }[] => [
      { x: -hx, z: c - T }, { x: hx, z: c - T }, { x: hx, z: c + T }, { x: -hx, z: c + T },
    ]
    // edges 1 and 3 (x = +hx and x = -hx) are the profile ends; edges 0 and 2 (z = const) are the swept sides
    const drawTier = (c: number, y0: number, y1: number): void => {
      const ring = tierRing(c)
      faceBand(out, ring, y0, y1, blankFace, [1, 3])
      faceBand(out, ring, y0, y1, glazedFace, [0, 2])
    }

    // the two legs, splayed apart at the ground and leaning together — staircased into LEG_TIERS steps so the
    // gap between them (the "inverted V of open air") closes gradually rather than in one jump. Each tier
    // keeps the WIDER (lower) footprint for its whole height, like `setbackTiers`, so a step always faces up.
    const LEG_TIERS = 10
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < LEG_TIERS; i++) {
        const t0 = i / LEG_TIERS
        const y0 = t0 * convergeY
        const y1 = ((i + 1) / LEG_TIERS) * convergeY
        const c = side * outerZ0 * (1 - t0) // lerp from the leg's ground position to 0, taken at the tier's base
        drawTier(c, y0, y1)
      }
    }

    // above the merge the two legs have become one shaft, centred, T half-thick, up to a small crown
    const crownStart = H - 6
    drawTier(0, convergeY, crownStart)

    // a small parapet, per Wikipedia's "flares out in pagoda style" at the old roof-pool level — modest here
    // since the shaft itself is already narrow (T, not the full footprint)
    const crownRing = tierRing(0)
    const flareRing = offsetRing(crownRing, 1.1)
    faceBand(out, flareRing, crownStart, H, blankFace, [1, 3])
    faceBand(out, flareRing, crownStart, H, glazedFace, [0, 2])
    capPolygon(out, flareRing, H, [0.7, 0.66, 0.6], 0)
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
