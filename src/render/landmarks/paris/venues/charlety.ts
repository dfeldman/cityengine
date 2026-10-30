/**
 * The STADE SÉBASTIEN-CHARLÉTY (Henri and Bruno Gaudin, 1991–94; Équerre d'argent 1994; 19,151 seats; the blue track of
 * 2019–20, the only permanent IAAF track in Paris: Wikipedia fr), at the Porte de Gentilly.
 *
 * OSM maps no building for the bowl: only the grounds (`leisure=stadium`, way/663183242), the pitch and the track's parts,
 * so this is a point entry, centred on the middle of the track's two curves and turned to the pitch's long edges (bearing
 * 10.5°). Its 220 × 184 m is measured from the room the grounds leave for it. The rest is from the Commons photographs
 * "Paris Stade Sébastien Charléty" (the aerial) and "Stade Charléty 145/230/700":
 *
 * - from above and from the Boulevard Kellermann: a pale ring of concrete fins round a bowl of grey seats, the long sides
 *   much the higher, each under a thin long roof, the two curved ends low and open;
 * - the blue track and the green pitch inside;
 * - four tall white LIGHTING MASTS at the corners, seen for a long way, and the white SAILS stretched from them over the
 *   ends of the roofs;
 * - a dark band of glass at the foot, and the scoreboard at the end.
 *
 * Local frame: x along the pitch, +x south; −z west, to the Avenue de la Porte de Gentilly side and the main entrance (OSM's
 * entrance node stands west of the bowl). The heights (long sides 31 m, ends 15 m, roofs to 41 m, masts 60 m) are estimated
 * from the photographs: no source gives them.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, EMIT, prism, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { band, evenly, fin, footballPitch, groundMid, supAt, type Sup, type V3 } from './bowl.ts'
import { clamp, sail } from './shell.ts'

const CONC: Rgb = [0.8, 0.8, 0.77]
const CONC_DK: Rgb = [0.7, 0.7, 0.67]
const GLASS: Rgb = [0.15, 0.19, 0.22]
const SEAT: Rgb = [0.56, 0.57, 0.59]
const SEAT2: Rgb = [0.49, 0.5, 0.52]
const ROOF: Rgb = [0.78, 0.79, 0.78]
const SOFFIT: Rgb = [0.24, 0.25, 0.27]
const STEEL: Rgb = [0.3, 0.32, 0.34]
const WHITE: Rgb = [0.93, 0.93, 0.92]
const TRACK: Rgb = [0.13, 0.33, 0.6]
const APRON: Rgb = [0.17, 0.33, 0.24]

const smooth = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const lerpS = (a: Sup, b: Sup, f: number): Sup => ({ a: a.a + (b.a - a.a) * f, b: a.b + (b.b - a.b) * f, n: a.n + (b.n - a.n) * f })

export function stadeCharlety(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const metal = surfaceTag('metal')
  const glass = surfaceTag('glass')
  const A = clamp(fit.hx, 60, 115)
  const B = clamp(fit.hz, 45, 95)
  const kx = A / 110
  const kz = B / 92
  const S = (a: number, b: number, n: number): Sup => ({ a: a * kx, b: b * kz, n })
  const g = groundMid(fit)
  // the height of the rim round the bowl: 31 m on the long sides (θ near ±90°), 15 at the curved ends
  const rise = (th: number): number => smooth(0.38, 0.86, Math.abs(Math.sin(th)))
  const rimY = (th: number): number => g + 15 + 16 * rise(th)

  // ---- the floor: the pitch, the blue track, its dark green apron out to the stand's foot
  const trackIn = S(80, 38.5, 3.6)
  const trackOut = S(90, 48.5, 3.4)
  const foot = S(93, 52, 3.2)
  const y = g + 0.4
  footballPitch(out, y, 105 * Math.min(kx, 1), 68 * Math.min(kz, 1), null, { track: { inner: trackIn, outer: trackOut, colour: TRACK, lanes: 8 } })
  band(out, trackOut, y - 0.01, foot, y - 0.01, 'up', () => APRON, { segs: 72 })

  // ---- the seats: the front wall, a lower tier, the cross-aisle with its boxes, an upper tier that climbs with the rim
  band(out, foot, y, foot, g + 2.2, 'in', () => CONC_DK, { segs: 96, tag: conc })
  const lowTop = S(101, 62, 2.9)
  const rows = 6
  for (let r = 0; r < rows; r++) {
    band(out, lerpS(foot, lowTop, r / rows), g + 2.2 + (8.6 * r) / rows, lerpS(foot, lowTop, (r + 1) / rows), g + 2.2 + (8.6 * (r + 1)) / rows, 'in', () => (r % 2 ? SEAT : SEAT2), { segs: 96 })
  }
  const upFoot = S(102.5, 64, 2.85)
  band(out, lowTop, g + 10.8, upFoot, g + 10.8, 'up', () => CONC, { segs: 96, tag: conc })
  band(out, upFoot, g + 10.8, upFoot, g + 13, 'in', () => GLASS, { segs: 96, tag: glass })
  const rim = S(107.5, 86, 2.5)
  for (let r = 0; r < rows; r++) {
    const f0 = r / rows
    const f1 = (r + 1) / rows
    band(out, lerpS(upFoot, rim, f0), (th) => g + 13 + (rimY(th) - g - 13) * f0, lerpS(upFoot, rim, f1), (th) => g + 13 + (rimY(th) - g - 13) * f1, 'in', () => (r % 2 ? SEAT : SEAT2), { segs: 96 })
  }

  // ---- the outer wall: the glass at the foot, the pale wall to the rim, its top, the fins standing out from it
  const wall = S(110, 92, 2.5)
  band(out, rim, rimY, wall, rimY, 'up', () => CONC, { segs: 96, tag: conc })
  band(out, wall, g - 0.5, wall, g + 4.6, 'out', () => GLASS, { segs: 96, tag: glass })
  band(out, wall, g + 4.6, wall, rimY, 'out', () => CONC_DK, { segs: 96, tag: conc })
  const fins = 92
  for (const th of evenly(wall, fins)) {
    const p = supAt(wall, th, 0)
    const l = Math.hypot(p[0], p[2]) || 1
    const dx = p[0] / l
    const dz = p[2] / l
    const r = l
    const top = rimY(th) + 0.5
    fin(out, [[[r - 0.1, g + 4.2], [r + 1.5, g + 4.2]], [[r - 0.1, top], [r + 1.5, top]]], dx, dz, 0.9, CONC, conc)
  }
  // the pale concourse deck round the fins' feet
  const deck = S(112.5, 94.5, 2.5)
  band(out, wall, g + 4.5, deck, g + 4.5, 'up', () => CONC, { segs: 96, tag: conc })
  band(out, wall, g + 4.5, deck, g + 4.5, 'down', () => CONC_DK, { segs: 96, tag: conc })
  band(out, deck, g + 3.9, deck, g + 4.5, 'out', () => WHITE, { segs: 96, tag: conc })

  // ---- the two long roofs: thin, pale on top, dark beneath, rising a little to their front edge on slim posts
  const span = 0.98
  const back = S(108.5, 88, 2.5)
  const lip = S(103, 67, 2.75)
  for (const c of [-Math.PI / 2, Math.PI / 2]) {
    const o = { segs: 28, th0: c - span, th1: c + span }
    const yB = (th: number): number => rimY(th) + 6.5 - 5 * (1 - rise(th))
    const yL = (th: number): number => rimY(th) + 9.5 - 5 * (1 - rise(th))
    band(out, back, yB, lip, yL, 'up', () => ROOF, { ...o, tag: metal })
    band(out, back, (th) => yB(th) - 0.25, lip, (th) => yL(th) - 0.25, 'down', () => SOFFIT, { ...o, tag: metal })
    band(out, lip, (th) => yL(th) - 0.7, lip, yL, 'out', () => WHITE, { ...o, tag: metal })
    band(out, back, (th) => yB(th) - 0.7, back, yB, 'out', () => ROOF, { ...o, tag: metal })
    for (let i = 0; i <= 14; i++) {
      const th = c - span + (2 * span * i) / 14
      const pb = supAt(back, th, yB(th) - 0.2)
      const pr = supAt(rim, th, rimY(th))
      // the post from the rim, and the rib out to the lip along the roof
      strut(out, pr, pb, 0.5, 0.5, STEEL, metal, false)
      strut(out, pb, supAt(lip, th, yL(th) + 0.25), 0.3, 0.4, STEEL, metal, false)
    }
  }

  // ---- the four masts, standing in the fins at the corners, their lamp banks turned in; the sails from them to the roofs' ends
  const mastTop = g + 60
  for (const th of [0.6, Math.PI - 0.6, Math.PI + 0.6, -0.6]) {
    const m = supAt(S(113, 90, 2.5), th, g)
    prism(out, m[0], m[2], g - 0.5, mastTop, 1.15, 10, WHITE, metal, 0.42)
    const l = Math.hypot(m[0], m[2]) || 1
    const ix = -m[0] / l
    const iz = -m[2] / l
    box(out, m[0] + ix * 0.9, mastTop + 0.8, m[2] + iz * 0.9, 2.5, 1.5, 2.5, WHITE, metal)
    box(out, m[0] + ix * 2.2, mastTop + 0.8, m[2] + iz * 2.2, 2.2, 1.25, 2.2, [1, 0.98, 0.9], EMIT)
    const apex: V3 = [m[0], g + 42, m[2]]
    const sign = Math.sin(th) > 0 ? 1 : -1
    const c = sign * Math.PI / 2
    const end = c + (th > -Math.PI / 2 && th < Math.PI / 2 ? -sign : sign) * span
    const onRoof = supAt(back, end, rimY(end) + 2)
    const onRim = supAt(rim, th + (end - th) * 0.15, rimY(th))
    const low = supAt(lip, end, rimY(end) + 4.6)
    sail(out, apex, onRoof, onRim, WHITE, metal)
    sail(out, apex, low, onRoof, [0.88, 0.88, 0.87], metal)
    strut(out, apex, onRoof, 0.14, 0.14, STEEL, metal, false)
  }

  // ---- the scoreboard over the north end, facing the pitch
  const sb = supAt(rim, Math.PI, rimY(Math.PI))
  box(out, sb[0], rimY(Math.PI) + 3.6, 0, 0.5, 3.8, 9, [0.05, 0.05, 0.06], glass)
  box(out, sb[0] + 0.3, rimY(Math.PI) + 0.8, 0, 0.8, 1.1, 2, CONC_DK, conc)
}
