/**
 * Two pieces of the de Young's garden (owner, 2026-10-27), each placed on its own OSM object
 * (public/landmarks/san-francisco/parks.json; rotateDeg 0, so local x east, z north):
 *
 * THREE GEMS (James Turrell, 2005; way/705001032) — "a tunnel leading to a hemispherical underground chamber, with a
 * hole in the top, making a 'skyspace'". A grassed mound on OSM's 11.6 m ring, a concrete passage into it, and inside a
 * domed chamber with a stone bench round the wall and the oculus open to the sky. The real chamber is sunk below the
 * garden; the city's terrain cannot be cut, so here its floor is at grade and the mound stands over it. Its own
 * observe view (game.ts, "Press O"): seated in the chamber, looking up through the oculus.
 *
 * POMODORO'S SPHERE ("Sfera con sfera", Arnaldo Pomodoro; node/9828842238, which OSM also names "Heights I") — the
 * owner's "Gazing Ball, a reflective ball with an embedded rift", from the owner's photograph: a polished bronze ball
 * on a grey stone cube, a ragged band torn out of its shell and, inside, a dark inner sphere bristling with teeth.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, strut, EMIT, FIXED, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const GRASS: Rgb = [0.32, 0.45, 0.20]
const CONCRETE: Rgb = [0.70, 0.69, 0.66]
const INTERIOR: Rgb = [0.50, 0.47, 0.43]
const FLOOR: Rgb = [0.34, 0.33, 0.32]
const BENCH: Rgb = [0.52, 0.50, 0.47]

/** the chamber: the dome's radius, its springing over the floor, the oculus; the mound's foot (OSM's ring) and top */
const RI = 3.6
const SPRING = 0.5
const OCULUS = 0.75
const RO = 5.8
const TOP = 4.9
/** the passage: its half-width and height inside, its walls' thickness, how far out its portal stands, its bearing */
const TW = 0.8
const TH = 2.3
const WALL = 0.5
const PORTAL = 7.2
/** the passage opens towards the sculpture garden's walk, east-south-east (by judgement: the photographs do not show it) */
const BEARING = 112
/** segments round: 28, so the doorway is exactly the two either side of the passage's bearing */
const N = 28

/** the mound's height over the floor at radius r */
const mound = (r: number): number => TOP * Math.max(0, 1 - (r / RO) ** 2) ** 0.7

export function threeGems(out: MeshBuilder, fit: Fit): void {
  const g = fit.groundAt ? fit.groundAt(0, 0) : 0.5
  const concrete = surfaceTag('concrete'), plaster = surfaceTag('stucco')
  const b0 = (BEARING * Math.PI) / 180
  const az = (i: number): number => b0 + (i * 2 * Math.PI) / N
  /** is segment i (from az(i) to az(i+1)) one of the doorway's two? */
  const door = (i: number): boolean => i === 0 || i === N - 1
  const at = (a: number, r: number, y: number): V3 => [Math.sin(a) * r, g + y, Math.cos(a) * r]
  /** an inside face's normal: straight up, so the chamber is lit evenly all round, as the real one's plaster is */
  const LIT = (_a: number): V3 => [0, 1, 0]
  /**
   * an inside face, wound to face its TRUE normal `n` and then lit as `LIT` (the true normal faces in and down, and took
   * only the ground's light: a near-black dome; leant up it takes the sky's, which is what lights the real one's pale
   * plaster through the oculus). Wound by the leant normal instead, the top band faced away and was culled.
   */
  const inside = (p: V3[], n: V3, a: number, c: Rgb, tag: number): void => {
    out.quad(p, n, UV, c, tag)
    const l = LIT(a)
    for (let v = out.normals.length - 12; v < out.normals.length; v += 3) { out.normals[v] = l[0]; out.normals[v + 1] = l[1]; out.normals[v + 2] = l[2] }
  }

  // THE CHAMBER, seen from inside: a short drum to the springing, then the dome in bands up to the oculus. The bands
  // break at 30 degrees, which is the doorway's head (SPRING + RI sin 30 = TH).
  const EL = [0, 15, 30, 45, 58, 68, 78.0].map((d) => (d * Math.PI) / 180)
  EL[EL.length - 1] = Math.acos(OCULUS / RI)
  for (let i = 0; i < N; i++) {
    const a0 = az(i), a1 = az(i + 1), am = (a0 + a1) / 2
    if (!door(i)) {
      inside([at(a0, RI, 0), at(a1, RI, 0), at(a1, RI, SPRING), at(a0, RI, SPRING)], [-Math.sin(am), 0, -Math.cos(am)], am, INTERIOR, plaster)
      // the cove at the dome's springing, the light Turrell's sequences play at sunset: a pale band that glows after dark
      inside([at(a0, RI - 0.01, SPRING - 0.08), at(a1, RI - 0.01, SPRING - 0.08), at(a1, RI - 0.01, SPRING), at(a0, RI - 0.01, SPRING)], [-Math.sin(am), 0, -Math.cos(am)], am, [0.95, 0.85, 0.70], EMIT)
      // the bench: its seat and its front, all round but the doorway
      const rb = RI - 0.45
      out.quad([at(a0, rb, 0.45), at(a1, rb, 0.45), at(a1, RI, 0.45), at(a0, RI, 0.45)], [0, 1, 0], UV, BENCH, concrete)
      out.quad([at(a0, rb, 0), at(a1, rb, 0), at(a1, rb, 0.45), at(a0, rb, 0.45)], [-Math.sin(am), 0, -Math.cos(am)], UV, BENCH, concrete)
    }
    for (let k = 0; k + 1 < EL.length; k++) {
      if (door(i) && EL[k + 1] <= (30 * Math.PI) / 180 + 1e-6) continue
      const P = (a: number, e: number): V3 => at(a, RI * Math.cos(e), SPRING + RI * Math.sin(e))
      const em = (EL[k] + EL[k + 1]) / 2
      inside([P(a0, EL[k]), P(a1, EL[k]), P(a1, EL[k + 1]), P(a0, EL[k + 1])], [-Math.sin(am) * Math.cos(em), -Math.sin(em), -Math.cos(am) * Math.cos(em)], am, INTERIOR, plaster)
    }
    // the oculus's throat, from the dome up through the mound, and its rim of concrete round the hole on top
    const yi = SPRING + RI * Math.sin(EL[EL.length - 1]), yo = mound(OCULUS)
    inside([at(a0, OCULUS, yi), at(a1, OCULUS, yi), at(a1, OCULUS, yo), at(a0, OCULUS, yo)], [-Math.sin(am), 0, -Math.cos(am)], am, INTERIOR, plaster)
    // the floor, a fan of dark stone
    out.quad([at(a0, RI, 0.02), at(a1, RI, 0.02), at(am, 0, 0.02), at(am, 0, 0.02)], [0, 1, 0], UV, FLOOR, concrete)
  }

  // THE MOUND, outside: grass on the profile, concrete round the oculus, the doorway's two segments left open below
  // the passage's roof (which the passage's own walls close)
  const RS = [OCULUS, 1.7, 2.5, 3.2, 3.9, 4.5, 5.0, 5.4, RO]
  for (let i = 0; i < N; i++) {
    const a0 = az(i), a1 = az(i + 1), am = (a0 + a1) / 2
    for (let k = 0; k + 1 < RS.length; k++) {
      const r0 = RS[k], r1 = RS[k + 1], y0 = mound(r0), y1 = mound(r1)
      if (door(i) && y1 < TH + WALL + 0.1) continue
      const slope = (y0 - y1) / (r1 - r0)
      const len = Math.hypot(1, slope)
      const n: V3 = [Math.sin(am) * slope / len, 1 / len, Math.cos(am) * slope / len]
      out.quad([at(a0, r0, y0), at(a1, r0, y0), at(a1, r1, y1), at(a0, r1, y1)], n, UV, k === 0 ? CONCRETE : GRASS, k === 0 ? concrete : surfaceTag('foliage'))
    }
  }

  // THE PASSAGE: from inside the chamber's wall out past the mound's foot to its portal
  const dx = Math.sin(b0), dz = Math.cos(b0), sx = dz, sz = -dx
  const T = (along: number, side: number, y: number): V3 => [dx * along + sx * side, g + y, dz * along + sz * side]
  // (from inside the dome's springing: where the passage meets the chamber its walls stand proud as the doorway's reveals,
  //  and its ceiling closes the gap up to the dome's 30-degree band)
  const r0 = RI * Math.cos(Math.PI / 6) - 0.05
  const inQ = (a: V3, b: V3, c: V3, d: V3, n: V3, col: Rgb): void => out.quad([a, b, c, d], n, UV, col, concrete)
  // inside: the two walls, the ceiling, the floor
  inQ(T(r0, -TW, 0), T(PORTAL, -TW, 0), T(PORTAL, -TW, TH), T(r0, -TW, TH), [sx, 0, sz], INTERIOR)
  inQ(T(PORTAL, TW, 0), T(r0, TW, 0), T(r0, TW, TH), T(PORTAL, TW, TH), [-sx, 0, -sz], INTERIOR)
  inQ(T(r0, -TW, TH), T(PORTAL, -TW, TH), T(PORTAL, TW, TH), T(r0, TW, TH), [0, -1, 0], INTERIOR)
  inQ(T(r0, -TW, 0.02), T(PORTAL, -TW, 0.02), T(PORTAL, TW, 0.02), T(r0, TW, 0.02), [0, 1, 0], FLOOR)
  // outside: its walls and grassed roof where they stand out of the mound, and the portal's face
  const W = TW + WALL, Y = TH + WALL, from = 3.6
  inQ(T(from, -W, 0), T(PORTAL, -W, 0), T(PORTAL, -W, Y), T(from, -W, Y), [-sx, 0, -sz], CONCRETE)
  inQ(T(PORTAL, W, 0), T(from, W, 0), T(from, W, Y), T(PORTAL, W, Y), [sx, 0, sz], CONCRETE)
  out.quad([T(from, -W, Y), T(PORTAL, -W, Y), T(PORTAL, W, Y), T(from, W, Y)], [0, 1, 0], UV, GRASS, surfaceTag('foliage'))
  const f: V3 = [dx, 0, dz]
  // the headwall where the passage's roof goes into the mound, up to the grass (the band over it is left open)
  const rh = RS.find((r) => mound(r) < TH + WALL + 0.1)! - 0.6
  inQ(T(rh, -W, Y), T(rh, W, Y), T(rh, W, mound(rh) + 0.1), T(rh, -W, mound(rh) + 0.1), f, GRASS)
  inQ(T(PORTAL, -W, 0), T(PORTAL, -TW, 0), T(PORTAL, -TW, Y), T(PORTAL, -W, Y), f, CONCRETE)
  inQ(T(PORTAL, TW, 0), T(PORTAL, W, 0), T(PORTAL, W, Y), T(PORTAL, TW, Y), f, CONCRETE)
  inQ(T(PORTAL, -TW, TH), T(PORTAL, TW, TH), T(PORTAL, TW, Y), T(PORTAL, -TW, Y), f, CONCRETE)
}

/** where the observe view puts the eye: over the chamber's floor, metres (game.ts) */
export const THREE_GEMS_EYE = 1.3

/** Pomodoro's sphere: the stone cube, the ball on it, the rift facing `RIFT` (a bearing; by judgement) */
const RIFT = 150
const R = 0.62
const BRONZE: Rgb = [0.66, 0.45, 0.24]
const DARK: Rgb = [0.20, 0.15, 0.10]
const STONE: Rgb = [0.48, 0.49, 0.50]

export function pomodoroSphere(out: MeshBuilder, fit: Fit): void {
  const g = fit.groundAt ? fit.groundAt(0, 0) : 0.5
  // the paving square and the cube (the photograph: a pale grey block about as wide as it is tall, on paving)
  box(out, 0, g + 0.04, 0, 1.15, 0.06, 1.15, [0.62, 0.60, 0.56], surfaceTag('concrete'))
  box(out, 0, g + 0.1 + 0.55, 0, 0.72, 0.55, 0.72, STONE, FIXED)
  const cy = g + 1.2 + R - 0.06
  const b = (RIFT * Math.PI) / 180
  // the rift's axis: out of the ball's face, a little above its equator
  const ax: V3 = norm([Math.sin(b), 0.25, Math.cos(b)])
  // a second axis across it, to measure round the rift's edge
  const ux: V3 = norm(cross(ax, [0, 1, 0])), vx = cross(ux, ax)
  /** how far the tear reaches from the axis, round its edge: ragged, wider across than up and down */
  const reach = (d: V3): number => {
    const psi = Math.atan2(dot(d, vx), dot(d, ux))
    return 0.72 + 0.16 * Math.cos(2 * psi) + 0.07 * Math.sin(5 * psi + 1.3) + 0.05 * Math.sin(11 * psi + 0.4)
  }
  const torn = (d: V3): boolean => Math.acos(Math.max(-1, Math.min(1, dot(d, ax)))) < reach(d)
  const LAT = 18, LON = 32
  const dir = (i: number, j: number): V3 => {
    const th = (i / LAT) * Math.PI, ph = (j / LON) * Math.PI * 2
    return [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)]
  }
  const pt = (d: V3, r: number): V3 => [d[0] * r, cy + d[1] * r, d[2] * r]
  const metal = surfaceTag('metal')
  /** the last quad's normals set to its corners' own directions: the polished ball shaded round, not in facets */
  const smooth = (c: V3[]): void => {
    const v0 = out.normals.length - 12
    c.forEach((d, k) => { out.normals[v0 + k * 3] = d[0]; out.normals[v0 + k * 3 + 1] = d[1]; out.normals[v0 + k * 3 + 2] = d[2] })
  }
  let seed = 7
  const rnd = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < LAT; i++) {
    for (let j = 0; j < LON; j++) {
      const c = [dir(i, j), dir(i, j + 1), dir(i + 1, j + 1), dir(i + 1, j)]
      const m = norm([c[0][0] + c[2][0], c[0][1] + c[2][1], c[0][2] + c[2][2]])
      if (!torn(m)) {
        out.quad(c.map((d) => pt(d, R)), m, UV, BRONZE, metal)
        smooth(c)
        // the dark core all the way round: only behind the tear, a line of sight past the lip missed it and found the
        // sky through the back of the shell
        out.quad(c.map((d) => pt(d, R * 0.74)), m, UV, DARK, FIXED)
        // and the shell's own inside, dark: through the tear a grazing line of sight reaches the far side of the shell
        // from within, where its outward faces are culled
        out.quad(c.map((d) => pt(d, R * 0.985)), [-m[0], -m[1], -m[2]], UV, DARK, FIXED)
        continue
      }
      // inside the tear: the dark inner sphere, and its machinery of teeth
      const ri = R * 0.74
      out.quad(c.map((d) => pt(d, ri)), m, UV, DARK, metal)
      smooth(c)
      // on the tear's edge (a neighbour still whole): long teeth reaching nearly to the shell, the ragged lip
      const edge = [dir(i, j - 1), dir(i, j + 2), dir(Math.max(0, i - 1), j), dir(Math.min(LAT, i + 2), j)].some((d) => !torn(d))
      const teeth = edge ? 2 : 1
      for (let t = 0; t < teeth; t++) {
        const d = norm([m[0] + (rnd() - 0.5) * 0.12, m[1] + (rnd() - 0.5) * 0.12, m[2] + (rnd() - 0.5) * 0.12])
        const len = edge ? R * (0.18 + 0.06 * rnd()) : R * (0.05 + 0.1 * rnd())
        strut(out, pt(d, ri), pt(d, ri + len), 0.028, 0.04, edge ? BRONZE : DARK, metal)
      }
    }
  }
}

const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
