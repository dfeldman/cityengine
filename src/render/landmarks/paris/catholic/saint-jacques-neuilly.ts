/**
 * ÉGLISE SAINT-JACQUES DE NEUILLY-SUR-SEINE (167 boulevard Bineau; OSM relation/1221234, wikidata Q20962772). A small
 * inter-war church of dark red-brown brick in banded courses: a pointed-arched portal under two tall lancets, a
 * belfry with two arched louvres and stepped corner turrets, a gable lettered IHS with a cross, between lower wings
 * with round windows; a slate nave behind and a flat-roofed annex on the south-east side. Measured from the IGN LiDAR HD
 * surface model (docs/landmarks/MODEL-SAINT-JACQUES-NEUILLY.md): nave ridge 12 m, wings ~7 m, front gable ~13 m.
 * Photos: docs/landmarks/refs/saint-jacques-neuilly/. Drawn in the church's (u, v) frame — u along the nave away from the
 * front, v across — turned AXIS_DEG from east, registered onto the footprint by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 213.9        // the nave's direction (front toward the apse), degrees anticlockwise from east
const U_FRONT = -9.2, U_END = 13.8
const NAVE_V0 = -7.6, NAVE_V1 = 1.6   // the nave's walls (centre v = VC)
const NAVE_EAVE = 8.6, RIDGE_H = 12.2
const WING_H = 7.0            // flat-roofed wings either side of the nave and the south-east annex
const WING_V0 = -13.2, ANNEX_V1 = 16.3, ANNEX_U1 = 12.0
const TOWER_U1 = -4.4         // the front block's depth
const SHOULDER_H = 10.4       // the full-width front mass
const BELFRY_H = 11.5, BELFRY_V = 2.6   // the central belfry's half-width and wall top
const APEX_H = 13.0           // gable apex
const TURRET_W = 1.9, TURRET_H = 11.3
const BRICK = '#6b3a2c', BAND = '#7c4634', TRIM = '#b39b74', ROOF = '#4d5058', GLASS = '#2e3548', DOOR = '#2a2018', DARK = '#1f1c1c', LETTER = '#b8ad92'
const VC = (NAVE_V0 + NAVE_V1) / 2

export const RING: P2[] = [[-19.0, 3.2], [-16.9, 0.3], [-12.5, -6.1], [-5.1, -16.6], [-2.2, -20.8], [-0.0, -19.4], [6.0, -15.4], [8.8, -13.6], [16.6, -8.6], [8.8, 3.0], [8.6, 5.1], [8.1, 4.8], [6.3, 7.4], [5.1, 9.2], [5.6, 9.6], [4.5, 11.2], [3.7, 10.7], [0.2, 15.8], [-3.2, 13.6], [-2.6, 12.7], [-13.9, 5.0], [-14.7, 6.0]]

export function saintJacquesNeuilly(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const brick: Rgb = hex(BRICK), band: Rgb = hex(BAND), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), door: Rgb = hex(DOOR), dark: Rgb = hex(DARK), letter: Rgb = hex(LETTER)
  const { en, P, solid, decal, round, pointed, disc, cornice, ridge } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone: brick, trim: shade(roofC, 0.9), discN: 12, corniceH: 0.35, corniceOut: 0.12 })
  const rectP = (t: number, y0: number, w: number, h: number): [number, number][] => [[t - w / 2, y0], [t + w / 2, y0], [t + w / 2, y0 + h], [t - w / 2, y0 + h]]
  const lancet = (u: number, v: number, nu: number, nv: number, t: number, y0: number, w: number, h: number): void => {
    decal(u, v, nu, nv, 0.04, pointed(t, y0 - 0.15, w + 0.45, h + 0.3), band)
    decal(u, v, nu, nv, 0.09, pointed(t, y0, w, h), glass)
  }

  // ── walls: nave, flanking wings, annex ──
  solid(U_FRONT, U_END, NAVE_V0, NAVE_V1, 0, NAVE_EAVE, brick, null, 1.6)
  cornice(U_FRONT, U_END, NAVE_V0, NAVE_V1, NAVE_EAVE, 0.4, 0.15)
  ridge('u', U_FRONT, U_END, VC, (NAVE_V1 - NAVE_V0) / 2 + 0.2, NAVE_EAVE, RIDGE_H)
  solid(U_FRONT, U_END - 1, WING_V0, NAVE_V0, 0, WING_H, brick, null, 1.6)
  solid(U_FRONT, ANNEX_U1, NAVE_V1, ANNEX_V1, 0, WING_H, brick, null, 1.6)
  cornice(U_FRONT, U_END - 1, WING_V0, NAVE_V0, WING_H, 0.3, 0.1)
  cornice(U_FRONT, ANNEX_U1, NAVE_V1, ANNEX_V1, WING_H, 0.3, 0.1)
  T.cap(RING, WING_H, shade(roofC, 0.85))      // flat tar roof over the whole footprint; nave and front rise from it
  // back wall of the nave: a brick gable
  T.poly([P(U_END, NAVE_V0, NAVE_EAVE), P(U_END, NAVE_V1, NAVE_EAVE), P(U_END, VC, RIDGE_H)], brick, [...en(1, 0), 0] as V3)

  // flank windows: tall lancets in the nave's clerestory, round-headed ones in the wing walls
  const nb = 4, bl = (U_END - U_FRONT - 5) / nb
  for (let i = 0; i < nb; i++) {
    const u = U_FRONT + 5 + (i + 0.5) * bl
    for (const [v, nv] of [[NAVE_V0, -1], [NAVE_V1, 1]] as [number, number][]) if (v === NAVE_V0 || u < ANNEX_U1 - 4) lancet(u, v, 0, nv, 0, 5.0, 0.8, 3.2)
    decal(u, WING_V0, 0, -1, 0.05, round(0, 2.4, 1.1, 2.4), glass)
    if (u < ANNEX_U1 - 1) decal(u, ANNEX_V1, 0, 1, 0.05, round(0, 2.4, 1.1, 2.4), glass)
  }

  // ── the front: block, belfry, gable, turrets, portal ──
  const FU = U_FRONT
  solid(FU, TOWER_U1, NAVE_V0, NAVE_V1, 0, SHOULDER_H, brick, null, 1.4)          // full-width mass
  solid(FU + 0.2, TOWER_U1, VC - BELFRY_V, VC + BELFRY_V, SHOULDER_H, BELFRY_H, brick, null, 1.4)   // belfry stage
  T.poly([P(FU + 0.2, VC - BELFRY_V, BELFRY_H), P(FU + 0.2, VC + BELFRY_V, BELFRY_H), P(FU + 0.2, VC, APEX_H)], brick, [...en(-1, 0), 0] as V3)
  T.poly([P(TOWER_U1, VC - BELFRY_V, BELFRY_H), P(TOWER_U1, VC + BELFRY_V, BELFRY_H), P(TOWER_U1, VC, APEX_H)], brick, [...en(1, 0), 0] as V3)
  for (const s of [-1, 1]) {      // stepped turrets at both corners, each with a small gable cap
    const v0 = s < 0 ? NAVE_V0 : NAVE_V1 - TURRET_W, v1 = v0 + TURRET_W
    solid(FU - 0.15, FU + 2.0, v0, v1, SHOULDER_H, TURRET_H, band, null, 1.4)
    ridge('v', v0, v1, FU + 0.9, 1.1, TURRET_H, TURRET_H + 1.1, 0.05)
    T.poly([P(FU - 0.15, v0 + 0.05, TURRET_H), P(FU - 0.15, v1 - 0.05, TURRET_H), P(FU - 0.15, (v0 + v1) / 2, TURRET_H + 1.1)], band, [...en(-1, 0), 0] as V3)
  }
  // coping line over the front gable
  for (const s of [-1, 1]) T.poly([P(FU - 0.05, VC + s * (BELFRY_V + 0.15), BELFRY_H - 0.05), P(FU - 0.05, VC + s * (BELFRY_V + 0.15), BELFRY_H + 0.15), P(FU - 0.05, VC, APEX_H + 0.2), P(FU - 0.05, VC, APEX_H)], trim, [...en(-1, 0), 0] as V3)
  const f = (off: number, pts: [number, number][], col: Rgb): void => decal(FU, VC, -1, 0, off, pts, col)
  // pointed portal: a stepped brick surround, the dark door set in it
  f(0.05, pointed(0, 0, 6.2, 5.8), band); f(0.1, pointed(0, 0, 5.0, 5.0), brick); f(0.14, pointed(0, 0, 3.3, 4.1), band); f(0.18, pointed(0, 0, 2.5, 3.6), door)
  // two tall lancets over it, each in its own recessed arch
  for (const t of [-1.15, 1.15]) {
    f(0.05, pointed(t, 6.0, 1.45, 4.3), band); f(0.1, pointed(t, 6.15, 0.95, 3.9), glass)
    f(0.06, pointed(t, 10.3, 1.25, 1.7), band); f(0.1, pointed(t, 10.35, 0.85, 1.55), dark)   // belfry louvres
  }
  // four small arched openings in the gable and the IHS lettering, the cross above
  for (const t of [-1.0, -0.35, 0.35, 1.0]) f(0.06, round(t, 12.0, 0.4, 0.55), dark)
  for (const t of [-0.55, 0, 0.5]) f(0.12, rectP(t, 12.45, 0.12, 0.45), letter)
  f(0.12, rectP(0, 12.55, 0.9, 0.08), letter)
  decal(FU, VC, -1, 0, 0.1, rectP(0, APEX_H, 0.14, 1.9), letter); decal(FU, VC, -1, 0, 0.1, rectP(0, APEX_H + 1.1, 0.9, 0.14), letter)
  // wings: a round window high up and a plain doorway each side of the portal
  decal(FU, WING_V0 + 1.2, -1, 0, 0.05, disc(0, 5.3, 0.55), dark)
  decal(FU, NAVE_V1 + 1.7, -1, 0, 0.05, rectP(0, 2.2, 1.2, 1.3), glass); decal(FU, NAVE_V1 + 5.5, -1, 0, 0.05, round(0, 0, 1.4, 2.6), door)
  decal(FU, WING_V0 + 5.0, -1, 0, 0.05, round(0, 0, 1.4, 2.6), door)
  // a pale band of corbelled brick under each stage, and steps at the portal
  cornice(FU, TOWER_U1, NAVE_V0, NAVE_V1, SHOULDER_H, 0.3, 0.12)
  for (let k = 0; k < 3; k++) solid(FU - 0.8 - k * 0.4, FU + 0.2, VC - 2.4 + k * 0.25, VC + 2.4 - k * 0.25, 0, 0.45 - k * 0.12, shade(roofC, 1.4), shade(roofC, 1.5), 0)
}
