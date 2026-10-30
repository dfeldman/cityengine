import type { MeshBuilder } from '../../../buildings.ts'
import { type Rgb } from '../../../models.ts'
import { beam, block, hex, lathe, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { figure, FIXED, UV } from './common.ts'
import { blob, G, seated, set } from './plaza-common.ts'

/*
 * The statues that stand in the middle of the places (wave 4): each is a thing a rider circles, seen first against the sky,
 * so each is its silhouette and its pedestal, with no more of the sculpture than reads at the speed of a bicycle.
 */

// ---------------------------------------------------------------------------------------------------------------
/**
 * THE STATUE DE LA LIBERTÉ of the Île aux Cygnes (Bartholdi; given to Paris in 1889), at the downstream tip of the island beside
 * the Pont de Grenelle. OSM (node 465294103) has her at 11.5 m. The green bronze from a Commons photograph (Statue of Liberty
 * Paris 2007-05-29.jpg), which also shows the gilt flame and the tablet with its two dates in gold: IV JUILLET 1776 and XIV JUILLET
 * 1789. The pedestal is by eye from wider views; no source for its height was found. Front −z, her right arm up at −x.
 */
const LIB_COPPER: Rgb = hex('#5f9c86')
const LIB_DARK: Rgb = hex('#477a68')
const LIB_STONE: Rgb = hex('#c9c4b6')
const LIB_GILT: Rgb = hex('#d9ae38')
export function statueLiberte(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 3.8, 3.8, (q) => liberty(q))
}

function liberty(q: MeshBuilder): void {
  // the stepped base and the pedestal, its corbelled top: half as wide again as her hem, as in the photograph
  block(q, -3.8, 3.8, -3.8, 3.8, 0, G + 0.5, shade(LIB_STONE, 0.9))
  block(q, -2.9, 2.9, -2.9, 2.9, G + 0.5, G + 1.5, shade(LIB_STONE, 0.96))
  block(q, -2.0, 2.0, -2.0, 2.0, G + 1.5, G + 8.2, LIB_STONE)
  block(q, -2.25, 2.25, -2.25, 2.25, G + 8.2, G + 8.55, LIB_STONE)
  block(q, -2.45, 2.45, -2.45, 2.45, G + 8.55, G + 8.8, shade(LIB_STONE, 1.05))
  const y0 = G + 8.8
  block(q, -1.5, 1.5, -1.5, 1.5, y0, y0 + 0.2, LIB_DARK)                      // her own plinth
  const H = 11.5 * 0.82                                                           // the crown of the head; the torch goes on to 11.5
  const b = y0 + 0.2
  // the robe, belled at the hem, and its deep folds
  lathe(q, 0, 0, [[1.25, b], [1.2, b + 0.06 * H], [1.02, b + 0.28 * H], [0.9, b + 0.5 * H], [0.98, b + 0.68 * H], [0.86, b + 0.78 * H], [0.56, b + 0.82 * H], [0.26, b + 0.85 * H]], 14, LIB_COPPER)
  for (let i = 0; i < 9; i++) {
    const a = ((i + 0.5) / 9) * Math.PI * 2
    const sx = Math.sin(a)
    const cz = Math.cos(a)
    beam(q, [sx * 1.2, b + 0.05, cz * 1.2], [sx * 0.86, b + 0.42 * H, cz * 0.86], 0.09, i % 2 ? LIB_DARK : LIB_COPPER)
  }
  // the toga across her: from the left shoulder down the right hip, a slab over the robe
  beam(q, [0.62, b + 0.74 * H, -0.62], [-0.72, b + 0.3 * H, -0.78], 0.1, LIB_DARK, 0.46)
  beam(q, [0.75, b + 0.76 * H, 0.2], [-0.85, b + 0.32 * H, 0.46], 0.1, LIB_DARK, 0.46)
  blob(q, -0.86, b + 0.6 * H, -0.1, 0.36, 1.25, 0.42, LIB_COPPER, 7, 4)                      // the fold hanging from her raised arm
  // the neck and head, her face to −z
  lathe(q, 0, 0, [[0.28, b + 0.82 * H], [0.22, b + 0.87 * H]], 8, LIB_COPPER)
  lathe(q, 0, -0.04, [[0.22, b + 0.85 * H], [0.34, b + 0.88 * H], [0.37, b + 0.92 * H], [0.38, b + 0.98 * H]], 10, LIB_COPPER)
  // the diadem and its seven rays, standing round the front of the head and leaning out from it
  lathe(q, 0, -0.02, [[0.4, b + 0.965 * H], [0.45, b + 1.0 * H], [0.3, b + 1.04 * H]], 10, LIB_DARK)
  for (let i = -3; i <= 3; i++) {
    const a = (i / 3) * 1.55
    const sx = Math.sin(a)
    const cz = -Math.cos(a)
    beam(q, [sx * 0.38, b + 1.01 * H, cz * 0.38 - 0.02], [sx * 0.98, b + 1.01 * H + 0.72, cz * 0.98 - 0.02], 0.06, LIB_DARK)
  }
  // the right arm and the torch
  const sh: [number, number, number] = [-0.74, b + 0.76 * H, 0]
  const hand: [number, number, number] = [-1.06, b + 1.08 * H, -0.08]
  beam(q, sh, [-0.95, b + 0.94 * H, -0.04], 0.26, LIB_COPPER, 0.26)
  beam(q, [-0.95, b + 0.94 * H, -0.04], hand, 0.2, LIB_COPPER, 0.2)
  beam(q, [hand[0], hand[1] - 0.45, hand[2]], [hand[0], hand[1] + 0.7, hand[2]], 0.11, LIB_DARK)
  lathe(q, hand[0], hand[2], [[0.12, hand[1] + 0.7], [0.48, hand[1] + 0.82], [0.48, hand[1] + 0.92], [0.28, hand[1] + 1.0]], 10, LIB_DARK)
  lathe(q, hand[0], hand[2], [[0.26, hand[1] + 0.98], [0.2, hand[1] + 1.22], [0.03, hand[1] + 1.5]], 7, LIB_GILT)
  // the left arm, down and forward, and the tablet held against her with its two dates in gold
  beam(q, [0.78, b + 0.72 * H, 0], [1.02, b + 0.5 * H, -0.3], 0.2, LIB_COPPER)
  const ty = b + 0.46 * H
  const tab = (z: number, n: number, c: Rgb, x0: number, x1: number, y0: number, y1: number): void =>
    q.quad([[x0, ty + y0, z], [x1, ty + y0, z], [x1, ty + y1, z + 0.12], [x0, ty + y1, z + 0.12]], [0, 0.1, n], UV, c, FIXED)
  tab(-0.72, -1, LIB_DARK, 0.68, 1.52, -0.25, 1.15)
  tab(-0.68, 1, LIB_DARK, 0.68, 1.52, -0.25, 1.15)
  for (const y of [0.15, 0.62]) tab(-0.74, -1, LIB_GILT, 0.78, 1.42, y, y + 0.16)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * THE MONUMENT DU MARÉCHAL MONCEY (Amédée Doublemard, the pedestal by Edmond Guillaume, 1869), the middle of the Place de Clichy;
 * 14 m (Wikipedia fr: cast metal and stone). The round pedestal of OSM's way 68247750 (7.3 m) in three drums — the base with the
 * eagle, the shaft with its bas-reliefs and inscription, the cornice — from a Commons photograph; and on it the bronze group: the
 * Marshal with his sabre, his arm out across the crowned City of Paris, who holds up a staff with the eagle; behind them the dying
 * student on the barrel of a cannon. Which way the group looks was not established: the −z front is set up the Avenue de
 * Clichy, by guess.
 */
const MON_STONE: Rgb = hex('#b6b1a4')
const MON_PALE: Rgb = hex('#c7c2b4')
const MON_BRONZE: Rgb = hex('#33382f')
export function monumentMoncey(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 3.65, 3.65, (q) => moncey(q))
}

function moncey(q: MeshBuilder): void {
  lathe(q, 0, 0, [[3.65, 0], [3.65, G + 0.3], [3.2, G + 0.5], [3.1, G + 1.05], [2.8, G + 1.25]], 24, MON_STONE)
  lathe(q, 0, 0, [[2.8, G + 1.25], [2.62, G + 1.4], [2.62, G + 2.5], [2.3, G + 2.7]], 24, MON_PALE)
  // the eagles on the lower drum and the tablets on the shaft, four of them
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4
    const sx = Math.sin(a)
    const cz = Math.cos(a)
    const tx = cz
    const tz = -sx
    // the eagle with its wings spread, flat on the lower drum
    set(q, sx * 2.64, G + 1.85, cz * 2.64, a, 1, (m) => {
      blob(m, 0, 0, 0.05, 0.17, 0.3, 0.1, MON_PALE, 6, 3)
      for (const w of [-1, 1]) m.quad([[0, -0.05, 0.03], [w * 0.8, 0.28, 0.03], [w * 0.8, 0.5, 0.03], [0, 0.2, 0.03]], [0, 0, 1], UV, MON_PALE, FIXED)
    })
    const R = 2.3
    const P = (u: number, y: number, d: number): [number, number, number] => [sx * (R + d) + tx * u, y, cz * (R + d) + tz * u]
    q.quad([P(-0.75, G + 2.95, 0.06), P(0.75, G + 2.95, 0.06), P(0.75, G + 5.0, 0.06), P(-0.75, G + 5.0, 0.06)], [sx, 0, cz], UV, shade(MON_STONE, 0.92), FIXED)
  }
  lathe(q, 0, 0, [[2.3, G + 2.7], [2.2, G + 2.8], [2.2, G + 5.25], [2.42, G + 5.55], [2.62, G + 5.75], [2.62, G + 5.98], [2.2, G + 6.2], [1.95, G + 6.75]], 24, MON_STONE)
  // the bronze, a little over 40% of the 14 m
  set(q, 0, G + 6.75, 0, 0, 1.2, monceyGroup)
}

function monceyGroup(q: MeshBuilder): void {
  const y = 0
  // the bronze: the mound of cannon and rubble and the green dish it lies on
  lathe(q, 0, 0, [[1.95, y], [1.75, y + 0.25], [1.5, y + 0.34]], 16, hex('#5f7767'))
  blob(q, 0, y + 0.55, 0.1, 1.45, 0.42, 1.3, MON_BRONZE, 8, 3)
  beam(q, [-1.15, y + 1.05, 1.35], [1.45, y + 1.2, 0.85], 0.2, MON_BRONZE)     // the cannon's barrel
  // the student, sprawled on it
  figure(q, 0.75, y + 1.05, 1.15, 1.25, MON_BRONZE)
  // the City of Paris, crowned, and the staff with its eagle
  lathe(q, 0, 0.32, [[0.72, y + 0.65], [0.58, y + 2.0], [0.5, y + 3.0], [0.36, y + 3.45], [0.13, y + 3.55]], 10, MON_BRONZE)
  blob(q, 0, y + 3.72, 0.3, 0.21, 0.26, 0.22, MON_BRONZE, 6, 4)
  lathe(q, 0, 0.3, [[0.17, y + 3.85], [0.23, y + 4.05]], 8, MON_BRONZE)
  beam(q, [0.38, y + 3.4, 0.25], [0.55, y + 4.25, 0.24], 0.1, MON_BRONZE)
  beam(q, [0.55, y + 3.3, 0.24], [0.55, y + 5.05, 0.24], 0.05, MON_BRONZE)
  blob(q, 0.55, y + 5.2, 0.24, 0.2, 0.14, 0.09, MON_BRONZE, 6, 3)
  beam(q, [0.56, y + 5.3, 0.24], [0.9, y + 5.5, 0.24], 0.08, MON_BRONZE, 0.03)
  beam(q, [0.54, y + 5.3, 0.24], [0.2, y + 5.5, 0.24], 0.08, MON_BRONZE, 0.03)
  // the banner folded down from the staff
  q.quad([[0.55, y + 4.85, 0.24], [0.15, y + 4.2, 0.33], [0.2, y + 3.0, 0.42], [0.55, y + 3.2, 0.3]], [0, 0, -1], UV, MON_BRONZE, FIXED)
  q.quad([[0.55, y + 4.85, 0.24], [0.15, y + 4.2, 0.33], [0.2, y + 3.0, 0.42], [0.55, y + 3.2, 0.3]], [0, 0, 1], UV, MON_BRONZE, FIXED)
  // the Marshal: legs, greatcoat, head, the arm across her, the sabre down at his side
  const mx = -0.55
  const mz = -0.48
  for (const s of [-1, 1]) beam(q, [mx + s * 0.2, y + 0.75, mz + (s < 0 ? -0.2 : 0.1)], [mx + s * 0.16, y + 1.85, mz], 0.17, MON_BRONZE)
  lathe(q, mx, mz, [[0.42, y + 1.6], [0.36, y + 2.5], [0.42, y + 2.95], [0.14, y + 3.08]], 9, MON_BRONZE)
  blob(q, mx, y + 3.23, mz, 0.17, 0.2, 0.19, MON_BRONZE, 6, 4)
  beam(q, [mx + 0.34, y + 2.85, mz], [mx + 1.45, y + 2.72, mz + 0.05], 0.09, MON_BRONZE)
  beam(q, [mx - 0.36, y + 2.75, mz], [mx - 0.58, y + 1.85, mz - 0.1], 0.1, MON_BRONZE)
  beam(q, [mx - 0.58, y + 1.85, mz - 0.1], [mx - 0.72, y + 0.85, mz - 0.5], 0.035, MON_BRONZE, 0.06)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * THE MONUMENT À PASTEUR (Alexandre Falguière, finished after his death in 1900 by Victor Peter and Louis Dubois; the Orsay's
 * database says marble and 1904), on the planted island of the Place de Breteuil where the water tower stood. From two Commons
 * photographs: the wide stepped plinth (OSM way 238841686 is its upper square, 8 m), the high pedestal, and the white seated figure on it;
 * round the pedestal's foot the marble groups, an ox and a sheep and a kneeling shepherd at one side, a mother and child and a robed
 * figure at another. How those are placed is from the photographs and only roughly. Pasteur's −z front at bearing 184 is read
 * off one photograph (he shows his front, turned left, in a view from the south-east to the Eiffel Tower).
 */
const PAS_MARBLE: Rgb = hex('#dcd9d0')
const PAS_PALE: Rgb = hex('#ece9e0')
const PAS_STONE: Rgb = hex('#b9b3a4')
const PAS_GRASS: Rgb = hex('#3d5f2e')
export function monumentPasteur(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 29, 29, (q) => pasteur(q))
}

function pasteur(q: MeshBuilder): void {
  // the island's lawn rising a little round the monument, its kerb, and the bed at its foot
  lathe(q, 0, 0, [[29, 0], [29, G + 0.2], [28.5, G + 0.2]], 40, PAS_STONE)
  lathe(q, 0, 0, [[28.5, G + 0.14], [14, G + 0.3], [9.5, G + 0.6], [7.8, G + 0.72], [0.01, G + 0.72]], 40, PAS_GRASS)
  lathe(q, 0, 0, [[9.6, G + 0.62], [8.0, G + 0.75]], 32, hex('#7c4f60'))
  // the two broad steps, and on them the mound the groups stand on
  const b = G + 0.7
  block(q, -7, 7, -7, 7, b, b + 0.4, PAS_STONE)
  block(q, -6.1, 6.1, -6.1, 6.1, b + 0.4, b + 1.0, shade(PAS_STONE, 1.1))
  block(q, -4.4, 4.4, -4.4, 4.4, b + 1.0, b + 1.6, PAS_MARBLE)
  // the pedestal, its cornice carried out
  const py = b + 1.6
  block(q, -2.4, 2.4, -2.4, 2.4, py, py + 5.2, PAS_MARBLE)
  block(q, -2.7, 2.7, -2.7, 2.7, py + 5.2, py + 5.5, PAS_PALE)
  block(q, -2.95, 2.95, -2.95, 2.95, py + 5.5, py + 5.8, PAS_MARBLE)
  block(q, -2.05, 2.05, -2.05, 2.05, py + 5.8, py + 6.25, PAS_PALE)
  // Pasteur himself, seated and robed, in white
  const y = py + 6.25
  set(q, 0, y, 0.15, Math.PI, 3.3, (m) => seated(m, PAS_PALE, PAS_MARBLE))
  // the groups against the pedestal: on the left of the front, the ox with the sheep and the kneeling shepherd
  const g = py
  const ox = -3.0
  beam(q, [ox, g + 1.25, -3.95], [ox, g + 1.45, -1.2], 0.72, PAS_PALE, 0.72)
  blob(q, ox, g + 1.75, -4.3, 0.5, 0.62, 0.8, PAS_PALE, 6, 4)
  beam(q, [ox + 0.35, g + 2.25, -4.4], [ox + 0.72, g + 2.7, -4.35], 0.06, PAS_PALE)
  beam(q, [ox - 0.35, g + 2.25, -4.4], [ox - 0.72, g + 2.7, -4.35], 0.06, PAS_PALE)
  for (const [lx, lz] of [[0.42, -3.6], [-0.42, -3.6], [0.42, -1.5], [-0.42, -1.5]]) beam(q, [ox + lx, g + 0.8, lz], [ox + lx, g, lz], 0.16, PAS_PALE)
  blob(q, -0.95, g + 0.55, -3.65, 0.8, 0.55, 0.5, PAS_PALE, 6, 3)
  blob(q, -1.0, g + 1.25, -3.3, 0.5, 0.85, 0.45, PAS_MARBLE, 6, 3)
  blob(q, -1.0, g + 2.25, -3.25, 0.22, 0.27, 0.22, PAS_MARBLE, 6, 3)
  // on the right of the front, the mother with her child, and the robed figure rising over them against the pedestal
  blob(q, 1.75, g + 1.2, -3.1, 0.75, 1.3, 0.62, PAS_PALE, 7, 4)
  blob(q, 1.75, g + 2.8, -3.0, 0.28, 0.33, 0.28, PAS_PALE, 6, 3)
  blob(q, 2.25, g + 1.7, -3.55, 0.36, 0.48, 0.32, PAS_MARBLE, 6, 3)
  blob(q, 0.55, g + 2.25, -2.75, 0.55, 2.0, 0.34, PAS_MARBLE, 7, 4)
  blob(q, 0.55, g + 4.45, -2.7, 0.24, 0.3, 0.24, PAS_MARBLE, 6, 3)
  // and on the sides and the back, what the rider circling the island sees: a seated group to each
  set(q, 3.1, g, 0.3, Math.PI / 2, 2.6, (m) => seated(m, PAS_PALE, PAS_MARBLE))
  set(q, -3.1, g, 0.3, -Math.PI / 2, 2.6, (m) => seated(m, PAS_PALE, PAS_MARBLE))
  set(q, 0, g, 3.1, 0, 2.6, (m) => seated(m, PAS_PALE, PAS_MARBLE))
  // the inscribed panels
  q.quad([[1.3, py + 2.8, -2.42], [-1.3, py + 2.8, -2.42], [-1.3, py + 4.6, -2.42], [1.3, py + 4.6, -2.42]], [0, 0, -1], UV, shade(PAS_MARBLE, 0.9), FIXED)
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * WASHINGTON ON THE PLACE D'IÉNA (Daniel Chester French the rider, Edward Potter the horse; dedicated 3 July 1900, the gift of the
 * women of the United States): bronze, his sword thrown up over his head, his hat in the other hand, on a high square stone
 * pedestal with a cornice in a shallow round bowl, from a 1913 autochrome on Commons (Statue équestre de George Washington
 * place d'Iéna - A13856S.jpg, with WASHINGTON on the pedestal). The autochrome looks at his face with domes beyond, which fits the
 * Musée Guimet at the south-west; so his −z front looks up the Avenue d'Iéna at bearing 23. Not otherwise checked. OSM has only a
 * node (570349020), at the centre of the ring.
 */
const WA_STONE: Rgb = hex('#c9c3b3')
const WA_BRONZE: Rgb = hex('#3f4a3f')
export function washingtonIena(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 12, 12, (q) => washington(q))
}

function washington(q: MeshBuilder): void {
  // the paved island of the ring (its radius is the ring's, less the road), and the shallow bowl on it
  lathe(q, 0, 0, [[12, 0], [12, G + 0.18], [4.3, G + 0.2]], 32, hex('#8c897e'))
  lathe(q, 0, 0, [[4.2, G + 0.18], [4.2, G + 0.35], [3.6, G + 0.5], [2.9, G + 0.55], [2.9, G + 0.42], [0.01, G + 0.42]], 28, WA_STONE)
  block(q, -1.5, 1.5, -2.8, 2.8, G + 0.42, G + 4.4, WA_STONE)
  block(q, -1.75, 1.75, -3.05, 3.05, G + 4.4, G + 4.75, shade(WA_STONE, 1.06))
  block(q, -1.9, 1.9, -3.2, 3.2, G + 4.75, G + 5.0, WA_STONE)
  block(q, -1.2, 1.2, -2.5, 2.5, G + 5.0, G + 5.15, WA_BRONZE)
  const y = G + 5.15
  const c = WA_BRONZE
  // the horse, its head toward −z, one foreleg lifted: barrel, chest, quarters, the arched neck and the head
  blob(q, 0, y + 2.45, 0, 0.72, 0.82, 1.5, c, 8, 5)
  blob(q, 0, y + 2.6, -1.05, 0.68, 0.88, 0.72, c, 8, 4)
  blob(q, 0, y + 2.55, 1.1, 0.74, 0.85, 0.78, c, 8, 4)
  blob(q, 0, y + 3.45, -1.55, 0.3, 0.72, 0.5, c, 7, 4)
  blob(q, 0, y + 4.1, -1.85, 0.23, 0.55, 0.36, c, 7, 4)
  blob(q, 0, y + 4.35, -2.3, 0.19, 0.24, 0.55, c, 6, 4)
  for (const s of [-1, 1]) {
    beam(q, [s * 0.38, y + 1.95, 1.35], [s * 0.42, y + 1.05, 1.65], 0.2, c)     // the hind legs
    beam(q, [s * 0.42, y + 1.05, 1.65], [s * 0.38, y, 1.45], 0.13, c)
  }
  beam(q, [0.42, y + 2.0, -1.2], [0.42, y, -1.25], 0.17, c)                      // the standing foreleg
  beam(q, [-0.42, y + 2.1, -1.25], [-0.45, y + 1.5, -1.95], 0.17, c)             // and the lifted one
  beam(q, [-0.45, y + 1.5, -1.95], [-0.42, y + 0.95, -1.65], 0.12, c)
  beam(q, [0, y + 2.9, 1.8], [0, y + 1.0, 2.25], 0.12, c, 0.2)                   // the tail
  // the rider: thighs down the flanks, the coat, the head and his hat in the left hand, the sword up over him in the right
  for (const s of [-1, 1]) {
    beam(q, [s * 0.5, y + 3.3, -0.05], [s * 0.82, y + 2.25, -0.3], 0.2, c)
    beam(q, [s * 0.82, y + 2.25, -0.3], [s * 0.78, y + 1.45, 0.05], 0.13, c)
  }
  lathe(q, 0, 0.05, [[0.68, y + 3.1], [0.52, y + 3.7], [0.5, y + 4.35], [0.2, y + 4.6]], 9, c)
  blob(q, 0, y + 4.82, 0.02, 0.21, 0.26, 0.23, c, 6, 4)
  beam(q, [-0.5, y + 4.3, 0.05], [-0.78, y + 5.0, -0.1], 0.13, c)
  beam(q, [-0.78, y + 5.0, -0.1], [-0.82, y + 5.75, -0.25], 0.1, c)
  beam(q, [-0.82, y + 5.75, -0.25], [-0.84, y + 7.1, -0.35], 0.035, c, 0.06)     // the sword
  beam(q, [0.5, y + 4.25, 0.05], [0.8, y + 3.75, -0.35], 0.12, c)
  blob(q, 0.92, y + 3.78, -0.5, 0.38, 0.1, 0.25, c, 6, 3)                        // the hat
}
