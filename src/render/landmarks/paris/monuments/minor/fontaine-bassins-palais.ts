import { capPolygonWithHoles, type MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { ccw, FIXED, walls } from '../common.ts'
import { G, basin, blob, spout } from '../plaza-common.ts'
import { fountainBowl, jetRing } from './monument-kit.ts'

/*
 * LES BASSINS DU PETIT ET GRAND PALAIS (Wikidata Q2887588; fr.wikipedia "Bassins du Petit et Grand Palais"): SIX small
 * white-stone basins (plus Larche's Miroir d'eau beside them, already modelled as fontaineMiroirEau; six here) of the 1900 Exposition layout round the two palaces. Four are small round ones at the ends of the
 * avenue Winston-Churchill (a cast-iron cluster of reeds in the middle throwing one tall jet; OSM ways 66755254, 66768636,
 * 66755262, 66768651, ~8 m across, rim height 0.2); two are larger oval ones on the Champs-Elysees promenade either side
 * (OSM 66768634 west 11.5 x 7.8 m, 66768655 east 11.7 x 8 m, long axes ~26 deg off x) with a moulded rim and a vase-like bowl
 * and bronze dolphins (the 2010s ones from the place de la Republique) at the centre. The palaces' own builders draw none.
 * Measured: outlines (OSM), rim height. By eye off Commons (Fontaine du Grand Palais, Bassin du Grand Palais 1, 5):
 * rim width, reed cluster, bowl, dolphins (procedural stand-ins, each under 0.6 m: Modly not attempted: procedural stand-ins).
 * Frame: x across, y up from the paving (G); the entries' size gives the half axes.
 */
export const HX = 4.0
export const HZ = 4.0

const RIM_W = 0.42, RIM_H = 0.34, LIP = 0.05
const REEDS = 22, REED_R = 0.32, REED_H = 0.62
const JET_H = 3.2
const STONE: Rgb = hex('#cfc9b9')
const WATER: Rgb = hex('#7e9fa6')
const IRON: Rgb = hex('#3d4540')
const BRONZE: Rgb = hex('#4d5a44')
const JET: Rgb = hex('#e3eeef')

function ring(hx: number, hz: number, n: number, pow: number): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a)
    out.push({ x: hx * Math.sign(c) * Math.abs(c) ** (2 / pow), z: hz * Math.sign(s) * Math.abs(s) ** (2 / pow) })
  }
  return out
}
function inset(p: { x: number; z: number }[], d: number): { x: number; z: number }[] {
  return p.map((q) => { const l = Math.hypot(q.x, q.z) || 1; return { x: q.x * (1 - d / l), z: q.z * (1 - d / l) } })
}

/** A stone basin on any plan: rim RIM_W wide, RIM_H above the paving, water just under it, a moulded lip ring on top (no disc over the water). */
function stoneBasin(q: MeshBuilder, plan: { x: number; z: number }[], rim: number): void {
  const y0 = G, inner = inset(plan, rim)
  basin(q, plan, inner, y0, y0 + RIM_H, STONE, WATER)
  const lc = shade(STONE, 1.06), outer = inset(plan, -0.06)
  walls(q, outer, y0 + RIM_H, y0 + RIM_H + LIP, lc)
  capPolygonWithHoles(q, [ccw(outer), [...ccw(inner)].reverse()], y0 + RIM_H + LIP, lc, FIXED)
}

function drawRound(q: MeshBuilder): void {
  const r = HX
  stoneBasin(q, ring(r, r, 40, 2), RIM_W)
  const y = G + RIM_H - 0.05
  // the cast-iron reed cluster: tapered dark spikes in a ring, a boss at the middle
  for (let i = 0; i < REEDS; i++) {
    const a = (i / REEDS) * Math.PI * 2 * 2.7, rr = REED_R * (0.25 + 0.75 * ((i * 0.618) % 1))
    prism(q, Math.sin(a) * rr, Math.cos(a) * rr, y, y + REED_H * (0.7 + 0.3 * ((i * 0.37) % 1)), 0.07, 5, IRON, FIXED, 0.012)
  }
  prism(q, 0, 0, y, y + REED_H * 0.55, 0.2, 10, shade(IRON, 1.1), FIXED, 0.14)
  // the great jet: a pale tapering column and a ring of spray falling back
  prism(q, 0, 0, y + REED_H * 0.5, y + JET_H, 0.09, 8, JET, FIXED, 0.015)
  jetRing(q, 0, 0, 14, 0.06, y + JET_H * 0.8, 0.9, y + 0.1, { rise: 0.5, r: 0.014, c: JET })
}

function drawOval(q: MeshBuilder, hx: number, hz: number): void {
  stoneBasin(q, ring(hx, hz, 48, 2.6), RIM_W)
  const y = G + RIM_H - 0.05
  // a stone plinth with a vase-like bowl, dolphins about its foot, one jet from the bowl
  prism(q, 0, 0, y, y + 0.35, 0.8, 12, shade(STONE, 0.95), FIXED, 0.7)
  const top = fountainBowl(q, 0, 0, y + 0.35, 0.78, { depth: 0.8, stem: 0.35, drop: 0.1, sides: 24, body: shade(STONE, 0.7), water: WATER })
  prism(q, 0, 0, top, top + 1.4, 0.07, 8, JET, FIXED, 0.015)
  jetRing(q, 0, 0, 12, 0.05, top + 1.1, 0.7, top, { rise: 0.35, r: 0.012, c: JET })
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4, x = Math.sin(a) * 0.62, z = Math.cos(a) * 0.62
    blob(q, x, y + 0.5, z, 0.14, 0.22, 0.14, BRONZE, 8, 5)
    spout(q, [x, y + 0.7, z], [x * 1.9, y + 0.1, z * 1.9], 0.25, 0.012, JET)
  }
}

/** The four round basins of the avenue Winston-Churchill ends (size 8 x 8). */
export function bassinRondPalais(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, drawRound)
}
/** The two oval basins on the Champs-Elysees promenade either side of the avenue (size from OSM). */
export function bassinOvalePalais(out: MeshBuilder, fit: Fit): void {
  const hx = fit.hx > 0 ? fit.hx : 5.5, hz = fit.hz > 0 ? fit.hz : 4
  fitted(out, fit, hx, hz, (q) => drawOval(q, hx, hz))
}
