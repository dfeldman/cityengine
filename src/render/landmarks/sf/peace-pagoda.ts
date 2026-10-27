/**
 * Peace Pagoda, Japantown, way/1458363734 (Yoshiro Taniguchi, 1968) — rebuilt from photographs, the third attempt
 * (docs/sf-batches/MODEL-PEACE-PAGODA.md has the photographs, the heights and the recognisability test). Five thin
 * white roofs on a slender core, each roof's underside a wheel of deep brackets forking three to a fin column with a
 * white lug on the rim at every bracket's end, the tops dark bronze; a ground storey of twelve fins on a dark stepped
 * plinth; a sorin of nine rings and a gilt crown to 30 m. Round, so the plan is not read from a ring (the way's
 * height tag is 0.01 and nothing is baked); centred on the fit's origin.
 *
 * Registered through ./scratch-1.ts (its manifest, scratch-1.json, places it).
 */
import type { MeshBuilder } from '../../buildings.ts'
import { prism, type Rgb } from '../../models.ts'
import { lathe } from '../column.ts'
import { boxAlong } from '../parts.ts'
import type { Fit } from '../fit.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const WHITE: Rgb = [0.9, 0.89, 0.86]
const CORE: Rgb = [0.74, 0.73, 0.7]
const ROOF: Rgb = [0.33, 0.27, 0.22]
const PLINTH: Rgb = [0.27, 0.27, 0.28]
const SORIN: Rgb = [0.36, 0.42, 0.38]
const SORIN_EDGE: Rgb = [0.5, 0.56, 0.5]
const GILT: Rgb = [0.82, 0.66, 0.24]

const SIDES = 48

/**
 * A roof: `ys` is the rim's foot (its lowest point), `R` the rim's radius, `rc` the core it springs from, `dish` how far
 * the underside rises from the rim to the core, `slope` the extra rise of the dark top over the underside's curve.
 */
type Tier = { ys: number; R: number; rc: number; dish: number; slope: number }
const R_CORE = 1.35, R_FIN = 2.1, R_CORE_0 = 2.0, R_FIN_0 = 2.85
/** The five roofs (MODEL-PEACE-PAGODA.md). */
const TIERS: Tier[] = [
  { ys: 4.3, R: 6.6, rc: R_CORE_0, dish: 1.0, slope: 0.16 },
  { ys: 8.3, R: 6.2, rc: R_CORE, dish: 0.8, slope: 0.1 },
  { ys: 12.2, R: 5.8, rc: R_CORE, dish: 0.8, slope: 0.1 },
  { ys: 15.9, R: 5.4, rc: R_CORE, dish: 0.8, slope: 0.1 },
  { ys: 19.3, R: 5.0, rc: R_CORE, dish: 0.8, slope: 0.1 },
]
const FASCIA = 0.4

/**
 * The underside at radius r: concave seen from below, like the inside of an umbrella — level where it leaves the core
 * and curving down ever more steeply to the rim. Its slope there is `under'`.
 */
const under = (t: Tier, r: number): number => {
  const u = Math.min(1, Math.max(0, (r - t.rc) / (t.R - t.rc)))
  return t.ys + t.dish * (1 - u * u)
}
const underSlope = (t: Tier, r: number): number => -2 * t.dish * Math.min(1, Math.max(0, (r - t.rc) / (t.R - t.rc))) / (t.R - t.rc)
/** The dark top at radius r: the same curve a fascia's depth higher, rising a little more towards the core. */
const over = (t: Tier, r: number): number => under(t, r) + FASCIA + Math.max(0, t.R - 0.2 - r) * t.slope

/** Radii at which the curved surfaces are sampled, rim to core. */
const STEPS = 6
const radii = (r0: number, r1: number): number[] => Array.from({ length: STEPS + 1 }, (_, k) => r0 + (r1 - r0) * (k / STEPS))

/** A point at radius r on bearing a, the lathe's own convention (x = sin, z = cos). */
const at = (r: number, a: number): [number, number] => [Math.sin(a) * r, Math.cos(a) * r]

/**
 * One rafter under a roof: a radial beam on bearing `a` from r0 to r1, its top following the curved underside, `d0`
 * deep at the root tapering to `d1` at the rim, `w` wide — so it sweeps down to the rim with the soffit it carries.
 */
function bracket(out: MeshBuilder, t: Tier, a: number, r0: number, r1: number, d0: number, d1: number, w: number, tag: number): void {
  const s = Math.sin(a), c = Math.cos(a)
  const P = (r: number, q: number, y: number): [number, number, number] => [s * r + c * q, y, c * r - s * q]
  const h = w / 2
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const rs = radii(r0, r1)
  const depth = (r: number): number => d0 + (d1 - d0) * (r - r0) / (r1 - r0)
  for (let k = 0; k < STEPS; k++) {
    const ra = rs[k], rb = rs[k + 1]
    const ta = under(t, ra) + 0.02, tb = under(t, rb) + 0.02
    const ba = ta - depth(ra), bb = tb - depth(rb)
    const fall = (ba - bb) / (rb - ra)
    const nl = Math.hypot(fall, 1)
    // the underside, facing down and a little inward or outward with its run
    out.quad([P(ra, -h, ba), P(ra, h, ba), P(rb, h, bb), P(rb, -h, bb)], [-s * fall / nl, -1 / nl, -c * fall / nl], uv, WHITE, tag)
    // the two flanks
    out.quad([P(ra, h, ba), P(ra, h, ta), P(rb, h, tb), P(rb, h, bb)], [c, 0, -s], uv, WHITE, tag)
    out.quad([P(ra, -h, ba), P(rb, -h, bb), P(rb, -h, tb), P(ra, -h, ta)], [-c, 0, s], uv, WHITE, tag)
  }
  // the outer end (the root end is buried in the capital)
  const te = under(t, r1) + 0.02, be = te - d1
  out.quad([P(r1, -h, be), P(r1, h, be), P(r1, h, te), P(r1, -h, te)], [s, 0, c], uv, WHITE, tag)
}

/**
 * One roof: the curved white soffit, fascia and raised rim, the dark top rising to the core, and the rafter wheel under
 * it — three rafters forking from each of `fins` columns at radius `rf` — with a white lug on the rim at each rafter's
 * end. Returns the height of the top where it meets the core.
 */
function roof(out: MeshBuilder, t: Tier, fins: number, rf: number): number {
  const CN = surfaceTag('concrete'), MT = surfaceTag('metal')
  const { ys, R, rc } = t
  const yRim = ys + FASCIA
  soffit(out, t, CN)
  // fascia, the raised rim's top and inner face
  lathe(out, 0, 0, [[R, ys], [R + 0.06, yRim], [R - 0.12, yRim + 0.04], [R - 0.2, over(t, R - 0.2) - 0.04]], SIDES, WHITE, CN)
  // the dark top, from inside the rim up to the core, on the same curve
  lathe(out, 0, 0, radii(R - 0.2, rc).map((r): [number, number] => [r, over(t, r) - 0.04]), SIDES, ROOF, MT)
  // the rafters: three from every fin, the middle one radial and the outer two fanned to share the wheel evenly
  const n = fins * 3
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const middle = i % 3 === 0
    bracket(out, t, a, rf - 0.2, R - 0.08, middle ? 1.05 : 0.8, 0.28, middle ? 0.22 : 0.17, CN)
    // a short hanger on the side rafters half way out, the hook seen under each disc
    if (!middle) {
      const [hx, hz] = at(R * 0.6, a)
      const d = 0.8 + (0.28 - 0.8) * (R * 0.6 - rf + 0.2) / (R - 0.08 - rf + 0.2)
      boxAlong(out, hx, under(t, R * 0.6) - d - 0.15, hz, 0.085, 0.2, 0.09, a, WHITE, CN)
    }
    // the lug on the rim at its end, standing proud of the fascia
    const [lx, lz] = at(R + 0.02, a)
    boxAlong(out, lx, ys + 0.24, lz, middle ? 0.13 : 0.1, 0.34, 0.18, a, WHITE, CN)
  }
  // the fin capitals the rafters fork from: wide across, shallow, under the soffit
  for (let k = 0; k < fins; k++) {
    const a = (k / fins) * Math.PI * 2
    const [cx, cz] = at(rf, a)
    boxAlong(out, cx, under(t, rf) - 0.33, cz, rf * Math.sin(Math.PI * 2 / n) + 0.15, 0.35, 0.5, a, WHITE, CN)
  }
  return over(t, rc) - 0.04
}

/**
 * The soffit on its curve. Its normals lean outward well past the true ones: a face turned down takes only the ground
 * colour and drew the undersides near black, where in every daylight photograph the white concrete is lit pale grey by
 * the plaza. The true slope is kept in the lean, so the dish still shades darker towards the rim.
 */
function soffit(out: MeshBuilder, t: Tier, tag: number): void {
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const rs = radii(t.rc, t.R)
  for (let k = 0; k < STEPS; k++) {
    const r0 = rs[k], r1 = rs[k + 1], y0 = under(t, r0), y1 = under(t, r1)
    const lean = 0.92 + 1.5 * underSlope(t, (r0 + r1) / 2)
    for (let i = 0; i < SIDES; i++) {
      const a0 = (i / SIDES) * Math.PI * 2, a1 = ((i + 1) / SIDES) * Math.PI * 2, am = (a0 + a1) / 2
      out.quad([[Math.sin(a0) * r0, y0, Math.cos(a0) * r0], [Math.sin(a1) * r0, y0, Math.cos(a1) * r0],
        [Math.sin(a1) * r1, y1, Math.cos(a1) * r1], [Math.sin(a0) * r1, y1, Math.cos(a0) * r1]],
        [Math.sin(am) * lean, -0.4, Math.cos(am) * lean], uv, WHITE, tag)
    }
  }
}

/** A ring of radial fins (wider into the building than across) round a core, y0 to y1. */
function fins(out: MeshBuilder, n: number, r: number, y0: number, y1: number, across: number, depth: number, phase = 0): void {
  const CN = surfaceTag('concrete')
  for (let k = 0; k < n; k++) {
    const a = ((k + phase) / n) * Math.PI * 2
    const [x, z] = at(r, a)
    boxAlong(out, x, (y0 + y1) / 2, z, across / 2, (y1 - y0) / 2, depth / 2, a, WHITE, CN)
  }
}

export function peacePagoda(out: MeshBuilder, fit: Fit): void {
  const CN = surfaceTag('concrete'), ST = surfaceTag('granite')
  // ---- the plinth: three dark octagonal steps, the last one's tread running in under the core
  lathe(out, 0, 0, [[7.4, 0], [7.4, 0.25], [6.9, 0.25], [6.9, 0.5], [6.4, 0.5], [6.4, 0.75], [0.01, 0.75]], 8, PLINTH, ST)

  // ---- the ground storey: twelve fins round the dark core, up into the first roof's dish
  const g = TIERS[0]
  prism(out, 0, 0, 0.75, under(g, g.rc) + 0.05, g.rc, 24, CORE, CN, g.rc, false)
  fins(out, 12, R_FIN_0, 0.75, under(g, R_FIN_0) - 0.3, 0.42, 0.9)
  // a door in the core on four sides, dark
  for (let k = 0; k < 4; k++) {
    const a = (k + 0.5) * Math.PI / 2 // half way between two fins
    const [x, z] = at(g.rc, a)
    boxAlong(out, x, 0.75 + 1.2, z, 0.55, 1.2, 0.04, a, [0.2, 0.19, 0.18], CN)
  }

  // ---- five roofs, with the four upper storeys between them
  let yTop = roof(out, g, 12, R_FIN_0)
  for (let t = 1; t < TIERS.length; t++) {
    const tier = TIERS[t]
    prism(out, 0, 0, yTop - 0.3, under(tier, tier.rc) + 0.05, R_CORE, 24, CORE, CN, R_CORE, false)
    // the fins stand on the roof below where its top passes their radius, and rise into the dish above
    fins(out, 8, R_FIN, over(TIERS[t - 1], R_FIN) - 0.15, under(tier, R_FIN) - 0.3, 0.36, 1.0)
    yTop = roof(out, tier, 8, R_FIN)
  }

  // ---- the sorin: a bowl off the top roof, nine rings on the mast, a gilt crown and ball
  const MT = surfaceTag('metal')
  const y0 = yTop
  lathe(out, 0, 0, [[1.0, y0 - 0.1], [1.05, y0 + 0.35], [0.95, y0 + 0.5], [0.55, y0 + 0.55]], 24, SORIN, MT)
  lathe(out, 0, 0, [[0.55, y0 + 0.55], [0.9, y0 + 0.75], [0.95, y0 + 1.05], [0.7, y0 + 1.25], [0.3, y0 + 1.3]], 24, SORIN, MT)
  const yr0 = y0 + 1.3, yr1 = 27.4
  prism(out, 0, 0, yr0, yr1, 0.3, 12, SORIN, MT, 0.26, false)
  for (let k = 0; k < 9; k++) {
    const y = yr0 + 0.35 + k * ((yr1 - yr0 - 0.6) / 8)
    const r = 0.9 - k * 0.025
    lathe(out, 0, 0, [[0.25, y - 0.2], [r - 0.1, y - 0.12], [r, y - 0.04], [r, y + 0.06]], 16, SORIN, MT)
    lathe(out, 0, 0, [[r, y + 0.06], [r - 0.08, y + 0.14], [0.25, y + 0.18]], 16, SORIN_EDGE, MT)
  }
  // the crown: a gilt cup with eight upturned flames round it, a jewel ball above
  const yc = yr1
  lathe(out, 0, 0, [[0.2, yc], [0.42, yc + 0.25], [0.5, yc + 0.9], [0.36, yc + 1.3], [0.12, yc + 1.5]], 12, GILT, 0)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    const [x, z] = at(0.55, a)
    boxAlong(out, x, yc + 1.05, z, 0.12, 0.55, 0.04, a, GILT, 0)
  }
  lathe(out, 0, 0, [[0.12, yc + 1.5], [0.07, yc + 1.75], [0.24, yc + 1.95], [0.26, yc + 2.15], [0.18, yc + 2.38], [0.01, yc + 2.6]], 12, GILT, 0)
  void fit
}
