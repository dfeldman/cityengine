/**
 * THE BASINS OF THE TERRACES ROUND THE CHATEAU'S GARDEN FRONT (Versailles; OSM draws only the water, tools/versailles-fountains.py the jets):
 *  - the Parterre d'Eau's two great scalloped basins (OSM "Bassin du Midi" way/237843251 and "Bassin du Nord" way/257712056), each with a
 *    wide white-marble coping and, on it, twelve pedestals (OSM artwork nodes within 1.5 m of the water's edge) for the bronze river gods
 *    (Seine, Marne, Loire, Loiret, Garonne, Dordogne, Rhone, Saone) and the nymph-and-children groups;
 *  - the two Bassins des Couronnes in the Parterre du Nord (way/92619334, way/92619350): a stone curb round the water, three low plinths
 *    in the water for the tritons and sirens holding crowns;
 *  - the Fontaines du Point du Jour (way/1202778307; Houzeau's tiger and Tuby/Van Cleve animal combats) and du Soir (way/92619297; the
 *    lion groups): a coping and two pedestals each.
 * The bronzes are plain stand-ins (STANDIN) until the Modly models are attached; the statue positions are OSM nodes (+-1 m).
 * Frame (standalone entries, rotateDeg 0): x east, z north, origin at each ring's bounding-box centre (the entry's lat/lon); the rings are
 * embedded because OSM water ways are not buildings in the bake, so no fit ring exists. Tunables: CFG.
 */
import type { MeshBuilder } from '../../../../buildings.ts'
import { surfaceTag } from '../../../../cartoon-material.ts'
import type { Fit } from '../../../fit.ts'
import { hex, lathe, shade } from '../../../kit.ts'
import { boxAlong } from '../../../parts.ts'

type P2 = { x: number; z: number }
type Pt = [number, number, string]

const CFG = {
  /** the coping: width outside the water's edge, height over the ground, the raised inner lip's width and extra height, how far its face drops below the ground */
  coping: { w: 2.3, h: 0.28, lip: 0.3, lipH: 0.1, drop: 0.35 },
  /** a plain curb (Couronnes) in place of the coping */
  curb: { w: 0.7, h: 0.35, lip: 0.2, lipH: 0.06, drop: 0.35 },
  /** pedestals (half-length along the edge, half-depth, height, cap and plinth overhang) by kind of work */
  river: { hl: 1.45, hd: 0.7, h: 0.75 },
  group: { hl: 0.8, hd: 0.8, h: 0.8 },
  beast: { hl: 1.1, hd: 0.75, h: 0.95 },
  cap: 0.12, plinth: 0.1,
  /** gap between the water's lip and a pedestal's plinth */
  clear: 0.3,
  /** the Couronnes: groups per basin, ring radius as a share of the basin's, plinth radius and height over the ground, the stand-in's height */
  crowns: { n: 3, at: 0.5, r: 1.0, h: 0.1, up: 1.3 },
  /** show the plain bronze stand-ins (off when the Modly models are attached) */
  standin: true,
  stone: '#d9d5c9', stoneDark: '#bdb8aa', bronze: '#46503f',
  y: 0,
}

const cross2 = (a: P2, b: P2): number => a.x * b.z - a.z * b.x

/** the water's edge (OSM, centred on its bounding box), anticlockwise (interior on the left) */
function edgeRing(own: [number, number][]): P2[] {
  const r: P2[] = own.map(([x, z]) => ({ x, z }))
  let a = 0
  for (let i = 0; i < r.length; i++) a += cross2(r[i], r[(i + 1) % r.length])
  if (a < 0) r.reverse()
  return r
}

/** a band round a ring: top faces and outer/inner faces, mitred; d0..d1 outside the ring, y1 top, y0 bottom */
function band(out: MeshBuilder, ring: P2[], d0: number, d1: number, y0: number, y1: number, col: [number, number, number], tag = 0): void {
  const n = ring.length
  const o = ring.map((p, i) => { const q = ring[(i + 1) % n]; let ex = q.x - p.x, ez = q.z - p.z; const l = Math.hypot(ex, ez) || 1; ex /= l; ez /= l; return { x: ez, z: -ex } })
  const at = (i: number, d: number): P2 => {
    const a = o[(i + n - 1) % n], b = o[i]
    let mx = a.x + b.x, mz = a.z + b.z; const l = Math.hypot(mx, mz) || 1; mx /= l; mz /= l
    const k = Math.min(2, 1 / Math.max(0.5, mx * b.x + mz * b.z))
    return { x: ring[i].x + mx * d * k, z: ring[i].z + mz * d * k }
  }
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const a0 = at(i, d0), b0 = at(j, d0), a1 = at(i, d1), b1 = at(j, d1)
    out.quad([[a0.x, y1, a0.z], [b0.x, y1, b0.z], [b1.x, y1, b1.z], [a1.x, y1, a1.z]], [0, 1, 0], uv, col, tag)
    if (d1 > d0) {
      out.quad([[a1.x, y0, a1.z], [b1.x, y0, b1.z], [b1.x, y1, b1.z], [a1.x, y1, a1.z]], [o[i].x, 0, o[i].z], uv, shade(col, 0.88), tag)
      out.quad([[b0.x, y0, b0.z], [a0.x, y0, a0.z], [a0.x, y1, a0.z], [b0.x, y1, b0.z]], [-o[i].x, 0, -o[i].z], uv, shade(col, 0.8), tag)
    }
  }
}

function copingOf(out: MeshBuilder, ring: P2[], y: number, c: { w: number; h: number; lip: number; lipH: number; drop: number }): void {
  const STONE = hex(CFG.stone), ASH = surfaceTag('ashlar')
  band(out, ring, 0, c.w, y - c.drop, y + c.h, STONE, ASH)
  band(out, ring, 0, c.lip, y - c.drop, y + c.h + c.lipH, shade(STONE, 1.05), ASH)
}

/** the nearest point of the ring to p, with the edge's heading (for boxAlong) and its outward normal */
function snap(ring: P2[], p: P2): { x: number; z: number; hd: number; ox: number; oz: number } {
  let best = 1e9, r = { x: p.x, z: p.z, hd: 0, ox: 0, oz: 1 }
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz || 1
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L))
    const qx = a.x + t * dx, qz = a.z + t * dz, d = Math.hypot(p.x - qx, p.z - qz)
    if (d < best) { best = d; const l = Math.sqrt(L); r = { x: qx, z: qz, hd: Math.atan2(-dz, dx), ox: dz / l, oz: -dx / l } }
  }
  return r
}

type Kind = 'river' | 'group' | 'beast'
const RIVERS = /^(La Seine|La Marne|La Loire|Le Loiret|La Garonne|La Dordogne|Le Rh|La Sa)/

/** a pedestal (plinth, die, cap) and, if CFG.standin, a plain bronze mass on it; centred on (x,z), long axis `hd` (boxAlong's heading) */
function pedestal(out: MeshBuilder, x: number, z: number, hd: number, y: number, kind: Kind): void {
  const s = CFG[kind], STONE = hex(CFG.stone), ASH = surfaceTag('ashlar'), B = hex(CFG.bronze)
  boxAlong(out, x, y + 0.1, z, s.hl + CFG.plinth, 0.1, s.hd + CFG.plinth, hd, shade(STONE, 0.92), ASH)
  boxAlong(out, x, y + 0.2 + (s.h - 0.32) / 2, z, s.hl, (s.h - 0.32) / 2, s.hd, hd, STONE, ASH)
  boxAlong(out, x, y + s.h - 0.06, z, s.hl + CFG.cap, 0.06, s.hd + CFG.cap, hd, shade(STONE, 1.06), ASH)
  if (!CFG.standin) return
  const top = y + s.h, c = Math.cos(hd), sn = Math.sin(hd)
  // boxAlong's local +x runs along heading `hd` (x' = x cos hd + z sin hd ... as in Neptune: heading = atan2(-dz, dx)), so an offset u along the edge is (u cos, -u sin)
  const along = (u: number): [number, number] => [x + u * c, z - u * sn]
  if (kind === 'river') {
    boxAlong(out, x, top + 0.2, z, 1.25, 0.2, 0.34, hd, B, 0)
    const [tx, tz] = along(0.6)
    boxAlong(out, tx, top + 0.55, tz, 0.4, 0.3, 0.3, hd, shade(B, 1.05), 0)
    const [hx, hz] = along(0.75)
    lathe(out, hx, hz, [[0, top + 0.82], [0.17, top + 0.9], [0.18, top + 1.05], [0.1, top + 1.22], [0, top + 1.25]], 8, shade(B, 1.1))
  } else if (kind === 'group') {
    lathe(out, x, z, [[0, top], [0.5, top], [0.4, top + 0.5], [0.25, top + 0.9], [0.18, top + 1.25], [0, top + 1.3]], 8, B)
  } else {
    boxAlong(out, x, top + 0.28, z, 0.85, 0.28, 0.4, hd, B, 0)
    const [bx, bz] = along(-0.15)
    boxAlong(out, bx, top + 0.7, bz, 0.5, 0.15, 0.32, hd, shade(B, 1.08), 0)
    const [h2x, h2z] = along(0.7)
    lathe(out, h2x, h2z, [[0, top + 0.5], [0.2, top + 0.6], [0.2, top + 0.9], [0.08, top + 1.0], [0, top + 1.0]], 7, shade(B, 1.1))
  }
}

/** a basin with a coping and pedestals at the given world points (versailles-mini metres); `own` is the water's edge relative to its bounding-box centre `bb` (world), which is the entry's lat/lon */
function parterreBasin(out: MeshBuilder, fit: Fit, own: [number, number][], bb: [number, number], pts: Pt[], beasts: boolean, c = CFG.coping): void {
  const y = (fit.grade ?? 0) + CFG.y
  const ring = edgeRing(own)
  const ox = -bb[0], oz = -bb[1]
  copingOf(out, ring, y, c)
  for (const [wx, wz, name] of pts) {
    const s = snap(ring, { x: wx + ox, z: wz + oz })
    // the pedestal stands on the coping, its long side along the edge, centred half the coping's width out
    const kind: Kind = beasts ? 'beast' : RIVERS.test(name) ? 'river' : 'group'
    const d = CFG.clear + CFG[kind].hd + CFG.plinth
    pedestal(out, s.x + s.ox * d, s.z + s.oz * d, s.hd, y + c.h, kind)
  }
}

// the water's edges, from OSM (way/237843251, 257712056, 1202778307, 92619297, 92619334, 92619350), metres from each one's bounding-box centre
const MIDI_RING: [number, number][] = [[-19.4, 27.4], [-3.6, 21.1], [-1.2, 20.1], [14.7, 13.8], [17.1, 12.9], [33.1, 6.5], [32.2, 3.7], [34.1, 3.1], [36.3, 1.6], [37.9, -0.2], [38.8, -1.9], [39.3, -3.6], [39.3, -4.8], [42.1, -6.0], [41.5, -7.2], [35.0, -23.3], [34.5, -24.5], [31.8, -23.5], [30.4, -24.5], [28.4, -25.5], [26.9, -25.8], [24.8, -25.9], [22.7, -25.6], [20.4, -24.8], [19.5, -27.4], [3.4, -20.9], [1.0, -20.0], [-14.9, -13.6], [-17.2, -12.7], [-33.1, -6.3], [-32.1, -3.6], [-33.6, -3.1], [-35.5, -2.1], [-37.0, -0.9], [-38.3, 0.9], [-39.1, 2.9], [-39.5, 5.0], [-42.1, 5.9], [-41.5, 7.2], [-35.0, 23.4], [-34.6, 24.6], [-31.9, 23.5], [-31.0, 24.2], [-29.1, 25.1], [-27.2, 25.7], [-24.8, 26.0], [-22.8, 25.6], [-20.4, 24.7]]
const NORD_RING: [number, number][] = [[-20.0, 27.4], [-21.2, 24.6], [-23.5, 25.5], [-25.5, 26.0], [-27.6, 25.8], [-29.5, 25.4], [-30.5, 24.7], [-32.0, 23.4], [-34.8, 24.6], [-42.5, 5.3], [-40.0, 4.5], [-39.5, 2.4], [-38.8, 0.7], [-37.6, -0.8], [-36.1, -2.1], [-34.5, -3.1], [-32.5, -3.8], [-33.5, -6.6], [19.6, -27.4], [20.8, -25.2], [22.4, -25.9], [23.9, -26.4], [25.6, -26.4], [27.5, -26.3], [28.9, -25.9], [30.5, -25.0], [32.0, -23.9], [34.5, -25.2], [42.4, -6.2], [39.8, -5.3], [39.2, -3.5], [38.6, -1.6], [37.1, 0.3], [36.0, 1.4], [34.2, 2.6], [32.1, 3.4], [33.1, 6.0]]
const PDJ_RING: [number, number][] = [[-4.6, 8.2], [7.0, 3.3], [5.6, -0.1], [6.5, -0.5], [7.1, 1.3], [9.5, 0.3], [6.2, -7.5], [4.2, -6.7], [5.0, -4.9], [4.0, -4.5], [2.5, -8.2], [-9.5, -3.3]]
const SOIR_RING: [number, number][] = [[-4.8, 8.2], [6.9, 3.3], [5.5, -0.1], [6.4, -0.5], [7.1, 1.2], [9.4, 0.3], [6.1, -7.5], [4.1, -6.7], [4.9, -4.9], [4.0, -4.5], [2.4, -8.2], [-9.5, -3.3]]
const CROWN_E_RING: [number, number][] = [[-6.4, 4.7], [-4.6, 6.5], [-2.4, 7.6], [0.1, 7.9], [2.6, 7.5], [4.9, 6.3], [6.6, 4.4], [7.6, 2.1], [7.9, -0.4], [7.4, -2.9], [6.1, -5.0], [4.2, -6.6], [2.1, -7.6], [-0.4, -7.9], [-2.8, -7.4], [-4.9, -6.2], [-6.6, -4.4], [-7.6, -2.2], [-7.9, 0.2], [-7.6, 2.6]]
const CROWN_W_RING: [number, number][] = [[-2.8, 7.1], [-0.1, 7.6], [2.6, 7.2], [4.9, 5.9], [6.5, 4.0], [7.4, 2.0], [7.7, -0.4], [7.0, -3.3], [5.7, -5.3], [3.8, -6.8], [1.4, -7.6], [-1.3, -7.6], [-3.2, -7.0], [-5.8, -5.1], [-7.1, -2.9], [-7.7, -0.5], [-7.3, 2.4], [-6.3, 4.3], [-4.4, 6.2]]

// the entries (world bounding-box centre of the OSM ring, then the OSM artwork nodes on its edge)
const MIDI: Pt[] = [[-561.9, 64.2, 'Nymphe et jeune triton'], [-620.9, 55.7, 'Nymphe et enfant au trident'], [-544.0, 57.0, 'Deux Amours et une fillette tenant un miroir'], [-613.0, 75.5, 'La Loire'], [-558.0, 21.8, 'Deux Amours, un enfant et deux dauphins'], [-594.4, 36.3, 'Nymphe et Zéphyr'], [-576.0, 29.0, 'Nymphe et Amour'], [-611.7, 43.3, 'Un Amour tenant un oiseau et deux enfants, dont un assis'], [-535.2, 44.8, 'Le Rhône'], [-543.1, 24.7, 'La Saône'], [-597.6, 78.6, 'Trois enfants tenant une guirlande'], [-579.9, 71.5, 'Nymphe et Amour tenant un carquois']]
const NORD: Pt[] = [[-511.5, 101.3, 'La Garonne'], [-519.3, 82.4, 'La Dordogne'], [-597.1, 114.0, 'La Marne'], [-589.7, 132.6, 'La Seine'], [-534.7, 79.3, 'Un Amour tenant un oiseau et deux enfants'], [-552.2, 86.4, 'Nymphe et enfant tenant des oiseaux'], [-588.7, 101.0, 'Un Amour tenant un flambeau et deux enfants'], [-520.6, 114.3, 'Deux Amours et un enfant soufflant dans une conque'], [-538.4, 121.4, 'Nymphe et enfant à la conque'], [-574.2, 135.7, 'Un Amour, deux enfants et un cygne'], [-557.6, 129.0, 'Le Loiret'], [-570.6, 93.5, 'Nymphe et Amour tenant une guirlande de fleurs']]
const POINT_DU_JOUR: Pt[] = [[-635.1, 23.8, 'Tigre terrassant un ours'], [-633.0, 29.7, 'Limier terrassant un cerf']]
const SOIR: Pt[] = [[-580.5, 160.8, 'Lion terrassant un sanglier'], [-578.3, 166.4, 'Lion terrassant un loup']]

/** Parterre d'Eau, south basin (Bassin du Midi) */
export function versaillesParterreMidi(out: MeshBuilder, fit: Fit): void { parterreBasin(out, fit, MIDI_RING, [-577.9, 50.2], MIDI, false) }
/** Parterre d'Eau, north basin (Bassin du Nord) */
export function versaillesParterreNord(out: MeshBuilder, fit: Fit): void { parterreBasin(out, fit, NORD_RING, [-554.2, 107.5], NORD, false) }
/** Fontaine du Point du Jour: coping and the tiger and hound groups */
export function versaillesPointDuJour(out: MeshBuilder, fit: Fit): void { parterreBasin(out, fit, PDJ_RING, [-639.2, 29.7], POINT_DU_JOUR, true) }
/** Fontaine du Soir: coping and the two lion groups */
export function versaillesFontaineDuSoir(out: MeshBuilder, fit: Fit): void { parterreBasin(out, fit, SOIR_RING, [-584.5, 166.3], SOIR, true) }

/** the east Bassin des Couronnes (Parterre du Nord): a curb round the water, plinths in it for the tritons and sirens with crowns */
function crowns(out: MeshBuilder, fit: Fit, own: [number, number][]): void {
  const y = (fit.grade ?? 0) + CFG.y, ring = edgeRing(own), K = CFG.crowns
  copingOf(out, ring, y, CFG.curb)
  const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length, cz = ring.reduce((s, p) => s + p.z, 0) / ring.length
  const R = ring.reduce((s, p) => s + Math.hypot(p.x - cx, p.z - cz), 0) / ring.length
  const STONE = hex(CFG.stone), B = hex(CFG.bronze)
  for (let i = 0; i < K.n; i++) {
    const a = (i / K.n) * Math.PI * 2 + 0.5, x = cx + Math.sin(a) * R * K.at, z = cz + Math.cos(a) * R * K.at
    lathe(out, x, z, [[0, y - 0.6], [K.r, y - 0.6], [K.r, y + K.h], [K.r * 0.8, y + K.h + 0.05], [0, y + K.h + 0.05]], 10, shade(STONE, 0.9))
    if (CFG.standin) lathe(out, x, z, [[0, y + K.h], [0.55, y + K.h], [0.4, y + K.h + K.up * 0.4], [0.28, y + K.h + K.up * 0.8], [0.18, y + K.h + K.up], [0, y + K.h + K.up + 0.05]], 8, B)
  }
}

export function versaillesCouronnes(out: MeshBuilder, fit: Fit): void { crowns(out, fit, CROWN_E_RING) }
/** the west Bassin des Couronnes */
export function versaillesCouronnesOuest(out: MeshBuilder, fit: Fit): void { crowns(out, fit, CROWN_W_RING) }

export const VERSAILLES_PARTERRES = { versaillesParterreMidi, versaillesParterreNord, versaillesPointDuJour, versaillesFontaineDuSoir, versaillesCouronnes, versaillesCouronnesOuest }
