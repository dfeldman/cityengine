/**
 * THE ROADS TO VERSAILLES (owner, 2026-11-04): what a rider passes on the two routes out of Paris — through the Parc de
 * Saint-Cloud and Ville-d'Avray, or along the old N10 by Sèvres and Chaville (tools/regions/versailles.ts). Entries in
 * public/landmarks/paris/versailles-road.json; docs/landmarks/MODEL-VERSAILLES.md has the notes.
 *
 * No statues here: the GLB pipeline makes those (owner). Where one stands, the builder leaves its place empty.
 *
 * Frames: an entry's `rotateDeg` is the bearing of its +x plus 270, so rotateDeg 0 is +x east, +z north.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { dome, hex, placed, roof, shade, type Rgb } from '../../kit.ts'
import { civic, frontEdge, type CivicSpec } from '../kit/civic.ts'
import { edgeAt } from '../../parts.ts'
import { towerRing } from '../../tower.ts'

const ash = surfaceTag('ashlar'), metal = surfaceTag('metal'), clipped = surfaceTag('clipped'), setts = surfaceTag('setts')
const STONE = hex('#c9bfa8'), STONE_DK = shade(STONE, 0.8), IRON = hex('#1d2224'), GILT: Rgb = [0.74, 0.58, 0.22]
const YEW = hex('#2c4526'), SETT = hex('#6c675e'), SETT_WALK = hex('#827c70'), SLATE = hex('#4a5157'), DEEP = hex('#1c1d1f')
const groundOf = (fit: Fit) => (x: number, z: number): number => fit.groundAt?.(x, z) ?? fit.grade ?? 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A floor on the ground: x0..x1 by z0..z1 in cells of `cell` metres, each corner on the terrain, `lift` above it. */
function sheet(out: MeshBuilder, g: (x: number, z: number) => number, x0: number, x1: number, z0: number, z1: number, lift: number, tint: Rgb, tag: number, cell = 4): void {
  const nx = Math.max(1, Math.ceil((x1 - x0) / cell)), nz = Math.max(1, Math.ceil((z1 - z0) / cell))
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const a = x0 + ((x1 - x0) * i) / nx, b = x0 + ((x1 - x0) * (i + 1)) / nx
      const c = z0 + ((z1 - z0) * j) / nz, d = z0 + ((z1 - z0) * (j + 1)) / nz
      out.quad([[a, g(a, c) + lift, c], [b, g(b, c) + lift, c], [b, g(b, d) + lift, d], [a, g(a, d) + lift, d]], [0, 1, 0], UV, tint, tag)
    }
  }
}

/** A clipped yew: a short drum, then the cone to a point. */
function coneYew(out: MeshBuilder, x: number, z: number, y: number, h: number, r: number): void {
  prism(out, x, z, y, y + h * 0.12, r, 10, YEW, clipped)
  prism(out, x, z, y + h * 0.12, y + h, r, 10, YEW, clipped, r * 0.06)
}

// ---- THE ALLÉE DES STATUES (the château's terrace, west of the Orangerie): OSM's three walks, 10.5 m apart, from the
// Parterre des 24 Jets 140 m east-north-east (bearing 84). The whole terrace in setts (owner), the walks a paler course;
// clipped yew cones in the strips between and outside the walks. Every STATUE_EVERY-th cone is left out on the inner
// strips: the statues' places, for the GLBs.
export const ALLEE = { len: 144, half: 17, walks: [-10.5, 0, 10.5], walkW: 5.5, coneStep: 8, coneH: 3.4, coneR: 0.95, statueEvery: 3, kerb: 0.18 }

export function cloudStatues(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit), A = ALLEE, L = A.len / 2
  // the floor, in bands across the allée
  const edges = [-A.half, ...A.walks.flatMap((w) => [w - A.walkW / 2, w + A.walkW / 2]), A.half]
  for (let k = 0; k < edges.length - 1; k++) sheet(out, g, -L, L, edges[k], edges[k + 1], 0.06, k % 2 ? SETT_WALK : SETT, setts)
  // a granite kerb round it
  for (const z of [-A.half, A.half]) strut(out, [-L, g(-L, z) + A.kerb / 2, z], [L, g(L, z) + A.kerb / 2, z], 0.3, A.kerb + 0.06, STONE_DK, ash)
  // the cones: in the middle of each strip that is not a walk
  for (let k = 0; k < edges.length - 1; k += 2) {
    const z = (edges[k] + edges[k + 1]) / 2
    const inner = k > 0 && k < edges.length - 2
    const n = Math.floor((A.len - 4) / A.coneStep)
    for (let i = 0; i <= n; i++) {
      if (inner && i % A.statueEvery === 1) continue
      const x = -((n * A.coneStep) / 2) + i * A.coneStep
      coneYew(out, x, z, g(x, z) + 0.06, A.coneH, A.coneR)
    }
  }
}

// ---- THE GRAND RÉSERVOIR: OSM's rectangle of water, 176 x 76 m (bearing 106). A dressed-stone coping round it and a
// low iron railing set back on the grass. Unverified from a photograph: the coping's width and the railing are a guess.
export const RESERVOIR = { hx: 88, hz: 38, coping: 0.9, copingH: 0.45, railSet: 1.6, railH: 1.05, postStep: 2.6 }

export function cloudReservoir(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit), R = RESERVOIR
  const corners = (o: number): [number, number][] => [[-R.hx - o, -R.hz - o], [R.hx + o, -R.hz - o], [R.hx + o, R.hz + o], [-R.hx - o, R.hz + o]]
  const c = corners(R.coping / 2), r = corners(R.coping + R.railSet)
  for (let i = 0; i < 4; i++) {
    const [a, b] = [c[i], c[(i + 1) % 4]]
    // the coping in 8 m lengths, so it follows the ground
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 8)
    for (let k = 0; k < n; k++) {
      const p = [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n], q = [a[0] + ((b[0] - a[0]) * (k + 1)) / n, a[1] + ((b[1] - a[1]) * (k + 1)) / n]
      strut(out, [p[0], g(p[0], p[1]) + R.copingH / 2 - 0.1, p[1]], [q[0], g(q[0], q[1]) + R.copingH / 2 - 0.1, q[1]], R.coping, R.copingH, STONE, ash)
    }
    const [ra, rb] = [r[i], r[(i + 1) % 4]]
    const m = Math.ceil(Math.hypot(rb[0] - ra[0], rb[1] - ra[1]) / R.postStep)
    for (let k = 0; k < m; k++) {
      const p = [ra[0] + ((rb[0] - ra[0]) * k) / m, ra[1] + ((rb[1] - ra[1]) * k) / m], q = [ra[0] + ((rb[0] - ra[0]) * (k + 1)) / m, ra[1] + ((rb[1] - ra[1]) * (k + 1)) / m]
      const y = g(p[0], p[1]), y1 = g(q[0], q[1])
      box(out, p[0], y + R.railH / 2, p[1], 0.04, R.railH / 2, 0.04, IRON, metal)
      strut(out, [p[0], y + R.railH, p[1]], [q[0], y1 + R.railH, q[1]], 0.05, 0.05, IRON, metal, false)
      strut(out, [p[0], y + 0.25, p[1]], [q[0], y1 + 0.25, q[1]], 0.04, 0.04, IRON, metal, false)
    }
  }
}

// ---- THE LANTERNE DE DÉMOSTHÈNE'S FOUNDATIONS, on the lawn of the Rond de la Balustrade (OSM's junction node 48.83148
// 2.21735 is the frame's origin, +x east, +z north). The Lanterne (a terracotta copy of the Lysicrates monument on Fontaine's
// stone obelisk, about 18 m) was blown up on 12-13 October 1870; only its foundations are left on the round's lawn
// (fr.wikipedia, Domaine national de Saint-Cloud). Measured off IGN's 0.2 m orthophoto (refs/versailles/lanterne): a gravel
// band round a rectangle of lawn west of the node, and in it the foundation stones, a rectangle with a cross through it.
// The lidar has nothing over 1.5 m there: the stones are low. Their height is not measured.
export const LANTERNE = {
  frame: { cx: -10, cz: 0, hx: 12, hz: 10.5, band: 2 },
  stones: { cx: -7.3, cz: -2.7, hx: 6, hz: 4.75, w: 0.7, h: 0.35 },
}

export function cloudRond(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit), F = LANTERNE.frame, T = LANTERNE.stones, GRAVEL = hex('#b8ad97')
  // the gravel band: four strips
  const x0 = F.cx - F.hx, x1 = F.cx + F.hx, z0 = F.cz - F.hz, z1 = F.cz + F.hz, b = F.band
  sheet(out, g, x0, x1, z0, z0 + b, 0.05, GRAVEL, 0, 3)
  sheet(out, g, x0, x1, z1 - b, z1, 0.05, GRAVEL, 0, 3)
  sheet(out, g, x0, x0 + b, z0 + b, z1 - b, 0.05, GRAVEL, 0, 3)
  sheet(out, g, x1 - b, x1, z0 + b, z1 - b, 0.05, GRAVEL, 0, 3)
  // the foundation stones: the rectangle's four sides and the cross, in 1.5 m blocks so they follow the ground
  const run = (ax: number, az: number, bx: number, bz: number): void => {
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 1.5))
    for (let k = 0; k < n; k++) {
      const px = ax + ((bx - ax) * (k + 0.5)) / n, pz = az + ((bz - az) * (k + 0.5)) / n
      const hx = ax === bx ? T.w / 2 : Math.abs(bx - ax) / n / 2 - 0.04, hz = ax === bx ? Math.abs(bz - az) / n / 2 - 0.04 : T.w / 2
      box(out, px, g(px, pz) + T.h / 2 - 0.05, pz, hx, T.h / 2, hz, STONE_DK, ash)
    }
  }
  const sx0 = T.cx - T.hx, sx1 = T.cx + T.hx, sz0 = T.cz - T.hz, sz1 = T.cz + T.hz
  run(sx0, sz0, sx1, sz0); run(sx0, sz1, sx1, sz1); run(sx0, sz0, sx0, sz1); run(sx1, sz0, sx1, sz1)
  run(sx0, T.cz, sx1, T.cz); run(T.cx, sz0, T.cx, sz1)
}

// ---- THE PAVILLON DE BRETEUIL (BIPM; Thomas Gobert's Trianon de Saint-Cloud, 1672, given its present look under Napoleon
// I): OSM's outline (way/170038102). IGN lidar (refs/versailles/breteuil): the ranges 10-11 m, flat across, the middle
// raised to 13-14 m over 10 x 8 m at the outline's centre; the ground falls away east, to the old Grand Parterre. The
// photograph (en.wikipedia's infobox): pale render, two storeys of tall windows, a cornice, a low slate hip.
export const BRETEUIL = { attic: [5, 4] as [number, number], atticTop: 12.4, atticRoof: 1.6 }

export function breteuil(out: MeshBuilder, fit: Fit): void {
  civic(out, fit, { wall: 'render', windows: 'dressed', roof: 'slate', centre: 'frontispiece', storey: 3.9, seed: 11 })
  const ring = fit.ring ?? [], n = Math.max(1, ring.length)
  const cx = ring.reduce((a, p) => a + p.x, 0) / n, cz = ring.reduce((a, p) => a + p.z, 0) / n
  const [ax, az] = BRETEUIL.attic, y0 = (fit.grade ?? 0) + fit.height, y1 = (fit.grade ?? 0) + BRETEUIL.atticTop
  box(out, cx, (y0 + y1) / 2, cz, ax, (y1 - y0) / 2, az, hex('#d9d2c2'), surfaceTag('stucco'))
  box(out, cx, y1 + 0.15, cz, ax + 0.25, 0.15, az + 0.25, hex('#c9c0ad'), ash)
  // its low hip to a short ridge
  const e = 0.25, X = ax + e, Z = az + e
  roof(out, cx - X, cx + X, cz - Z, cz + Z, y1 + 0.3, BRETEUIL.atticRoof, Math.min(X, Z) - 0.1, Math.min(X, Z) - 0.1, SLATE)
}

// ---- THE FRONTON DU PALAIS DE L'INDUSTRIE: Élias Robert's "La France couronnant l'Art et l'Industrie" (1855, limestone,
// 6.50 m; Diebolt's putti groups at its sides), brought from the Palais de l'Industrie in 1900 (en/fr.wikipedia). The
// figures are the GLB pipeline's; this is their pedestal. From the photograph (en.wikipedia): a plinth, five ashlar courses,
// a moulded cornice, an inscribed panel on the front; scaled by the 6.5 m group, 2.8 m high and ~10.7 m wide. IGN lidar
// (refs/versailles/fronton): the mass 12-13 m east-west by ~8 m, centred 1 m west and 5.5 m south of OSM's node. The front
// is taken to face south (+z north): the photograph does not say.
export const FRONTON = { w: 11.4, d: 7, plinth: 0.45, dado: 2.3, cornice: 0.5, panel: [3.4, 1.0] as [number, number] }

export function cloudFronton(out: MeshBuilder, fit: Fit): void {
  const F = FRONTON, y = fit.grade ?? 0, W = F.w / 2, D = F.d / 2
  box(out, 0, y + F.plinth / 2, 0, W + 0.3, F.plinth / 2, D + 0.3, STONE_DK, ash)
  box(out, 0, y + (F.plinth + F.dado) / 2, 0, W, (F.dado - F.plinth) / 2, D, STONE, ash)
  box(out, 0, y + F.dado + F.cornice * 0.3, 0, W + 0.15, F.cornice * 0.3, D + 0.15, STONE, ash)
  box(out, 0, y + F.dado + F.cornice * 0.8, 0, W + 0.4, F.cornice * 0.2, D + 0.4, STONE, ash)
  // the inscribed panel on the front
  const [pw, ph] = F.panel
  box(out, 0, y + F.plinth + (F.dado - F.plinth) * 0.55, -D - 0.03, pw / 2, ph / 2, 0.04, shade(STONE, 0.9), ash)
  box(out, 0, y + F.plinth + (F.dado - F.plinth) * 0.55, -D - 0.075, pw / 2 - 0.15, ph / 2 - 0.15, 0.01, shade(STONE, 0.72), 0)
}

// ---- A PARK GATE: the iron grille between two stone piers, with a run of railing and a smaller pier at each side.
// Along local x. Placed for the Île Monsieur gate, on the park's east wall by the Parc nautique (OSM has only barrier
// nodes there: the place is the owner's, off Google; its look is the Saint-Cloud gates' kind, unverified).
export const GATE = { w: 8, pierW: 1.25, pierH: 3.8, gateH: 3.2, bar: 0.16, wing: 9, wingH: 2.2, smallPier: 0.7 }

export function cloudGate(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit), G = GATE, y = g(0, 0)
  const pier = (x: number, w: number, h: number): void => {
    box(out, x, y + h / 2, 0, w / 2, h / 2, w / 2, STONE, ash)
    box(out, x, y + h + 0.12, 0, w / 2 + 0.1, 0.12, w / 2 + 0.1, STONE_DK, ash)
    // the vase on top
    prism(out, x, 0, y + h + 0.24, y + h + 0.5, w * 0.18, 10, STONE, ash, w * 0.28)
    prism(out, x, 0, y + h + 0.5, y + h + 0.95, w * 0.28, 10, STONE, ash, w * 0.16)
    dome(out, x, 0, y + h + 0.95, w * 0.16, 0.25, STONE, 10)
  }
  const ex = G.w / 2 + G.pierW / 2
  pier(-ex, G.pierW, G.pierH)
  pier(ex, G.pierW, G.pierH)
  // the two leaves: bars with spear tips, two rails, the top swept up to the middle
  const n = Math.round(G.w / G.bar)
  for (let k = 0; k <= n; k++) {
    const x = -G.w / 2 + (k * G.w) / n, top = G.gateH + 0.6 * (1 - Math.abs(x) / (G.w / 2))
    box(out, x, y + top / 2, 0, 0.022, top / 2, 0.022, IRON, metal)
    prism(out, x, 0, y + top, y + top + 0.18, 0.04, 4, GILT, metal, 0.005)
  }
  for (const h of [0.35, 1.2, G.gateH - 0.3]) strut(out, [-G.w / 2, y + h, 0], [G.w / 2, y + h, 0], 0.05, 0.07, IRON, metal, false)
  box(out, 0, y + (G.gateH + 0.6) / 2, 0, 0.05, (G.gateH + 0.6) / 2, 0.05, IRON, metal)
  // the wings of railing on a low wall, and the small piers that end them
  for (const s of [-1, 1]) {
    const x0 = s * (ex + G.pierW / 2), x1 = s * (ex + G.pierW / 2 + G.wing)
    strut(out, [x0, y + 0.3, 0], [x1, g(x1, 0) + 0.3, 0], 0.5, 0.6, STONE, ash)
    const m = Math.round(G.wing / G.bar)
    for (let k = 0; k <= m; k++) {
      const x = x0 + ((x1 - x0) * k) / m, yy = g(x, 0)
      box(out, x, yy + 0.6 + G.wingH / 2, 0, 0.018, G.wingH / 2, 0.018, IRON, metal)
    }
    strut(out, [x0, y + 0.6 + G.wingH - 0.15, 0], [x1, g(x1, 0) + 0.6 + G.wingH - 0.15, 0], 0.04, 0.05, IRON, metal, false)
    pier(x1 + s * G.smallPier / 2, G.smallPier, 3.0)
  }
}

// ---- THE TOWN HALLS AND THE MUSEUM: the civic kit on OSM's outline, and what each has that the kit does not.
/** A belfry with a clock on the roof behind the middle of the front: a square stage, the clock on all four faces, a dome. */
function belfry(out: MeshBuilder, fit: Fit, roofKind: CivicSpec['roof'], w: number, h0: number, set: number): void {
  const ring = towerRing(fit), e = edgeAt(ring, frontEdge(ring)), H = fit.height > 3 ? fit.height : 12
  // (the stage rises through the kit's roof — civic.ts's crown heights — so that h0 of it stands clear)
  const h = h0 + (roofKind === 'mansard' ? 3.2 : roofKind === 'slate' ? Math.min(4.5, 2 + fit.hz * 0.2) : 0)
  const q = new MeshBuilder()
  box(q, 0, H + h / 2, -set, w / 2, h / 2, w / 2, STONE, ash)
  box(q, 0, H + h + 0.15, -set, w / 2 + 0.2, 0.15, w / 2 + 0.2, STONE_DK, ash)
  for (const [dx, dz, nx, nz] of [[0, w / 2, 0, 1], [0, -w / 2, 0, -1], [w / 2, 0, 1, 0], [-w / 2, 0, -1, 0]]) {
    const cx = dx + nx * 0.03, cz = -set + dz + nz * 0.03, cy = H + h - h0 * 0.45, r = w * 0.32
    box(q, cx, cy, cz, nz ? r : 0.03, r, nx ? r : 0.03, hex('#ece6d6'), 0)
    box(q, cx + nx * 0.02, cy + r * 0.3, cz + nz * 0.02, nz ? 0.04 : 0.03, r * 0.45, nx ? 0.04 : 0.03, DEEP, 0)
  }
  dome(q, 0, -set, H + h + 0.3, w * 0.48, w * 0.6, SLATE, 12)
  prism(q, 0, -set, H + h + 0.3 + w * 0.6, H + h + 0.3 + w * 0.6 + 1.2, 0.05, 4, IRON, metal)
  placed(out, q, e.heading, e.mid.x, e.mid.z)
}

/** what a building is: its kit spec and, if it has one, its belfry (width, height, set back from the front) */
export const CIVIC: Record<string, { spec: CivicSpec; belfry?: [number, number, number] }> = {
  // Laudin, 1876: three levels, a pedimented middle pavilion (Monumentum). Brick and stone is a guess.
  sevresMusee: { spec: { wall: 'brickStone', windows: 'arched', roof: 'slate', centre: 'pediment', word: 'MANUFACTURE NATIONALE DE SÈVRES', storey: 5.2, seed: 3 } },
  // 54 Grande Rue: not identified in a photograph; the kit's grand mairie, with a lantern clock
  sevresMairie: { spec: { wall: 'stone', windows: 'dressed', roof: 'mansard', centre: 'pavilions', word: 'HÔTEL DE VILLE', flag: 2, storey: 4.8, seed: 5 }, belfry: [2.6, 3.4, 4] },
  // inaugurated 4 July 1909, in its park
  chavilleMairie: { spec: { wall: 'brickStone', windows: 'segmental', roof: 'slate', centre: 'frontispiece', word: 'MAIRIE', flag: 2, storey: 4.6, seed: 7 }, belfry: [3, 4.4, 2] },
  avrayMairie: { spec: { wall: 'stone', windows: 'dressed', roof: 'slate', centre: 'frontispiece', word: 'MAIRIE', flag: 2, storey: 4.4, seed: 9 } },
}
const civicOf = (k: string) => (out: MeshBuilder, fit: Fit): void => {
  const c = CIVIC[k]
  civic(out, fit, c.spec)
  if (c.belfry) belfry(out, fit, c.spec.roof, ...c.belfry)
}

// ---- THE FONTAINE DU ROI (Ville-d'Avray; OSM's 4 x 3 m building): the spring the king's water was drawn from, a
// stone pavilion with a niche and its trough on the front (+z), under a low stone pediment.
export const FONTAINE = { hx: 2, hz: 1.5, h: 2.8, niche: 0.75 }

export function avrayFontaine(out: MeshBuilder, fit: Fit): void {
  const F = FONTAINE, y = fit.grade ?? 0
  box(out, 0, y + F.h / 2, 0, F.hx, F.h / 2, F.hz, STONE, ash)
  box(out, 0, y + F.h + 0.12, 0, F.hx + 0.12, 0.12, F.hz + 0.12, STONE_DK, ash)
  // the pediment, stepped
  for (let k = 0; k < 4; k++) box(out, 0, y + F.h + 0.3 + k * 0.16, F.hz - 0.1, F.hx * (1 - k * 0.24), 0.08, 0.12, STONE, ash)
  box(out, 0, y + 1.2, F.hz + 0.01, F.niche, 0.8, 0.02, DEEP, 0)
  dome(out, 0, F.hz + 0.02, y + 2.0, F.niche, 0.4, DEEP, 10)
  box(out, 0, y + 0.3, F.hz + 0.45, F.niche + 0.3, 0.3, 0.42, STONE_DK, ash)
  box(out, 0, y + 0.56, F.hz + 0.45, F.niche + 0.15, 0.03, 0.3, hex('#304a4c'), 0)
}

export const VERSAILLES_ROAD: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  cloudStatues, cloudReservoir, cloudRond, cloudGate, avrayFontaine, breteuil, cloudFronton,
  sevresMusee: civicOf('sevresMusee'), sevresMairie: civicOf('sevresMairie'), chavilleMairie: civicOf('chavilleMairie'), avrayMairie: civicOf('avrayMairie'),
}
