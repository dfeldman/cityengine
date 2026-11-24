import type { MeshBuilder } from '../../../../buildings.ts'
import { EMIT, FIXED, prism, type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'

/*
 * LA DÉFENSE WEST, memorials and small installations (group "memorials-west"): Karavan's Perspective, Castelbajac's Totem,
 * the Grande chaise rouge, the two Puteaux memorials, de Gaulle at Courbevoie, Jaurès at Puteaux, Perronet, Lechevallier,
 * the Oiseau de Jaz. Every entry sits at its work's centre with rotateDeg 0, so the local frame is the city's (x east,
 * z north). Each stands on the street or the dalle: its ground is sampled at the spot (fit.groundAt), above the model's base.
 * Figures (busts, statues) are plain STAND-INS until the Modly pieces queued in monu/defense/guided-queue.md exist: switch
 * one off in STAND_IN once its paris-statues.json attach is in. Sizes the sources do not give are GUESSES (see each entry).
 */
export const STAND_IN: Record<string, boolean> = {
  totem: true, gaullePuteaux: true, martyrs: true, jauresPuteaux: true, perronet: true, lechevallier: true, jaz: true,
}
const STONE: Rgb = hex('#b6b1a4')
const DARKSTONE: Rgb = hex('#7d7a74')
const BRONZE: Rgb = hex('#4a3a28')
const WHITE: Rgb = hex('#e6e8e4')
const GLASSGREEN: Rgb = hex('#8fb8a4')

function groundAtSpot(fit: Fit, x: number, z: number): number {
  const g = fit.groundAt
  if (!g) return fit.grade ?? 0
  const v = g(x, z)
  return Number.isFinite(v) ? v : (fit.grade ?? 0)
}
/** run a drawing, then lift what it drew by dy (the ground under it) */
function lifted(out: MeshBuilder, dy: number, draw: () => void): void {
  const from = out.positions.length
  draw()
  for (let i = from; i < out.positions.length; i += 3) out.positions[i + 1] += dy
}
/** a body of revolution (profile of [height, radius]) */
function lathe(out: MeshBuilder, cx: number, cz: number, y0: number, prof: [number, number][], c: Rgb, sides = 12): void {
  for (let i = 0; i + 1 < prof.length; i++) {
    const [h0, r0] = prof[i], [h1, r1] = prof[i + 1]
    prism(out, cx, cz, y0 + h0, y0 + h1, Math.max(0.01, r0), sides, c, FIXED, Math.max(0.01, r1), i === 0 || i + 2 === prof.length)
  }
}
/** a two-step plinth (half-sizes, height): returns its top */
function plinth(out: MeshBuilder, hx: number, hz: number, h: number, c: Rgb = STONE): number {
  block(out, -hx, hx, -hz, hz, 0, h * 0.35, shade(c, 0.88))
  block(out, -hx * 0.82, hx * 0.82, -hz * 0.82, hz * 0.82, h * 0.35, h, c)
  return h
}
type Draw = (out: MeshBuilder, fit: Fit) => void
const atGround = (d: Draw): Draw => (out, fit) => lifted(out, groundAtSpot(fit, 0, 0), () => d(out, fit))

// ---------------------------------------------------------------- Karavan, Perspective (Esplanade Charles-de-Gaulle, 1989-2000)
/*
 * Dani Karavan's environmental work, 8 x 175 x 286 m by his site (materials: soil, grass, cedar, wood, railway tracks, iron,
 * granite, concrete, coloured asphalt, glass, light, text). Its lit elements are in OSM: six white 10 m lighting columns, 1.6 m
 * across, in a row (a Karavan photo shows six tall cylinders banded white and pale green glass), and twelve 3.1 m glass
 * blocks 2 m high (barrier=wall, luminous). Positions are the OSM ways' centres in the city frame, relative to the entry
 * centre KARAVAN_C. Band pattern and glass colour are read off two of Karavan's photographs; the rest of the work (tracks,
 * cedar, granite, text) is not drawn.
 */
const KARAVAN_C: [number, number] = [-8047.8, 3761.7]
const KARAVAN_COLS: [number, number][] = [[-8091, 3644], [-8096, 3646], [-8099, 3648], [-8103, 3650], [-8107, 3652], [-8112, 3654]]
const KARAVAN_BLOCKS: [number, number][] = [[-8036.5, 3802], [-8023, 3795], [-8057.5, 3759], [-8043, 3753], [-8077, 3682], [-8088, 3660],
  [-8080, 3712], [-8065.5, 3705.5], [-8101.5, 3666.5], [-8091, 3689], [-8047.5, 3780.5], [-8033.5, 3774]]
const KARAVAN_COL_H = 10, KARAVAN_COL_R = 0.8, KARAVAN_BANDS = 9, KARAVAN_BLOCK = 3.1, KARAVAN_BLOCK_H = 2
export function perspectiveKaravan(out: MeshBuilder, fit: Fit): void {
  for (const [wx, wz] of KARAVAN_COLS) {
    const x = wx - KARAVAN_C[0], z = wz - KARAVAN_C[1]
    lifted(out, groundAtSpot(fit, x, z), () => {
      const bh = KARAVAN_COL_H / KARAVAN_BANDS
      for (let b = 0; b < KARAVAN_BANDS; b++) {
        const glass = b % 2 === 1
        prism(out, x, z, b * bh, (b + 1) * bh, KARAVAN_COL_R, 12, glass ? GLASSGREEN : WHITE, glass ? EMIT : FIXED, KARAVAN_COL_R, b === 0 || b === KARAVAN_BANDS - 1)
      }
    })
  }
  for (const [wx, wz] of KARAVAN_BLOCKS) {
    const x = wx - KARAVAN_C[0], z = wz - KARAVAN_C[1], h = KARAVAN_BLOCK / 2
    lifted(out, groundAtSpot(fit, x, z), () => block(out, x - h, x + h, z - h, z + h, 0, KARAVAN_BLOCK_H, GLASSGREEN))
  }
}

// ---------------------------------------------------------------- Castelbajac, Totem (Giga la vie)
const TOTEM_H = 4.5
const TOTEM_SEG: Rgb[] = [hex('#c0392b'), hex('#e8b830'), hex('#2f6fb3'), hex('#4a3a28')]
/** OSM n2958486146: sculpture_type=bronze, "Giga la vie, premier monument aux vivants" (1994). No photo found: a stack of four coloured blocks, GUESSED. */
export const totemCastelbajac: Draw = atGround((out) => {
  const y = plinth(out, 0.8, 0.8, 0.3)
  if (!STAND_IN.totem) return
  const seg = TOTEM_H / TOTEM_SEG.length, w = 0.55
  TOTEM_SEG.forEach((c, i) => block(out, -w + i * 0.03, w + i * 0.03, -w, w, y + i * seg, y + (i + 1) * seg - 0.04, c))
})

// ---------------------------------------------------------------- Grande chaise rouge
const CHAISE_SEAT = 1.6, CHAISE_BACK = 3.2, CHAISE_W = 1.4, CHAISE_LEG = 0.12
const RED: Rgb = hex('#c4252a')
/** OSM n13115292324: a giant red chair (installation, surveyed 2025). Size GUESSED (seat 1.6 m high, back 3.2 m); no photo found. */
export const chaiseRouge: Draw = atGround((out) => {
  const h = CHAISE_W / 2, d = h * 0.9
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) block(out, sx * (h - CHAISE_LEG) - CHAISE_LEG, sx * (h - CHAISE_LEG) + CHAISE_LEG, sz * (d - CHAISE_LEG) - CHAISE_LEG, sz * (d - CHAISE_LEG) + CHAISE_LEG, 0, CHAISE_SEAT, RED)
  block(out, -h, h, -d, d, CHAISE_SEAT, CHAISE_SEAT + 0.12, RED)
  block(out, -h, h, d - 0.1, d, CHAISE_SEAT + 0.12, CHAISE_BACK, RED)
})

// ---------------------------------------------------------------- Puteaux, Général de Gaulle memorial (wall, cross, relief bust)
const GP_WALL = { w: 6, d: 0.7, h: 4 }   // the stone wall, GUESSED from a waymarking photo (cross 8 m is sourced)
const GP_CROSS_H = 8, GP_CROSS_W = 0.3
/**
 * OSM n2155909509 (memorial=bust). Waymarking + photo: a pale stone wall engraved with the battles and de Gaulle's London
 * appeal, a bronze bust in relief on its left of the front face (not a bust on a pedestal), an 8 m steel Cross of Lorraine
 * rising from it (1991, Luthringer and Staebler), two low steps in front. Faces south here (the facing is a guess).
 */
export const gaullePuteaux: Draw = atGround((out) => {
  const { w, d, h } = GP_WALL, hw = w / 2, hd = d / 2
  block(out, -hw - 0.6, hw + 0.6, -hd - 1.6, hd, 0, 0.15, shade(STONE, 0.85))
  block(out, -hw - 0.3, hw + 0.3, -hd - 0.8, hd, 0.15, 0.3, shade(STONE, 0.9))
  block(out, -hw, hw, -hd, hd, 0.3, h, shade(STONE, 1.06))
  block(out, -hw * 0.2, hw * 0.62, -hd - 0.02, -hd, 1.2, h - 0.8, DARKSTONE)   // the engraved text panel
  const c = GP_CROSS_W / 2, y0 = h - 0.2
  block(out, -c, c, -c, c, y0, GP_CROSS_H, DARKSTONE)
  for (const [yb, half] of [[GP_CROSS_H - 1.0, 0.7], [GP_CROSS_H - 2.3, 1.15]] as const) block(out, -half, half, -c, c, yb, yb + 0.22, DARKSTONE)
  if (!STAND_IN.gaullePuteaux) return
  block(out, -hw * 0.8, -hw * 0.45, -hd - 0.14, -hd, 0.8, 2.3, BRONZE)   // the relief bust (a bronze plaque-like mass)
})

// ---------------------------------------------------------------- Puteaux, Monument des Martyrs de la Résistance
const MR_H = 1.2
/** OSM n2155909506 (memorial=sculpture, survey 2018): a sculpture on a low stone base; GUESSED, no photo found. */
export const martyrsResistance: Draw = atGround((out) => {
  const y = plinth(out, 1.2, 0.8, MR_H, DARKSTONE)
  if (!STAND_IN.martyrs) return
  lathe(out, 0, 0, y, [[0, 0.6], [0.8, 0.45], [1.6, 0.35], [2.0, 0.01]], BRONZE, 8)
})

// ---------------------------------------------------------------- Courbevoie, Général de Gaulle stele
const GC_H = 2.2
/** OSM n1491925145 (memorial=stele, inscription "Face aux grands périls, le salut n'est que dans la grandeur"): a stone stele with a cut-in inscription band; size GUESSED. */
export const gaulleCourbevoie: Draw = atGround((out) => {
  block(out, -0.8, 0.8, -0.5, 0.5, 0, 0.2, shade(STONE, 0.85))
  block(out, -0.55, 0.55, -0.15, 0.15, 0.2, GC_H, STONE)
  block(out, -0.4, 0.4, 0.15, 0.17, 1.2, 1.7, DARKSTONE)
})

// ---------------------------------------------------------------- Puteaux, Jean Jaurès
const JP_H = 1.6, JP_FIG = 1.9
/** OSM n13022876349 (artwork statue, stone): Jaurès on a stone pedestal; sizes GUESSED, no photo found. Figure is a Modly stand-in. */
export const jauresPuteaux: Draw = atGround((out) => {
  const y = plinth(out, 0.7, 0.7, JP_H)
  if (!STAND_IN.jauresPuteaux) return
  lathe(out, 0, 0, y, [[0, 0.28], [0.5 * JP_FIG, 0.3], [0.82 * JP_FIG, 0.28], [0.9 * JP_FIG, 0.12], [JP_FIG, 0.1]], DARKSTONE, 10)
})

// ---------------------------------------------------------------- Courbevoie, Jean-Rodolphe Perronet
const PE_H = 1.9, PE_FIG = 1.8, PE_PIL_H = 2.3, PE_SPAN = 3.4
/**
 * OSM n8640934930 (artwork statue). Commons photos (Statue Perronnet.jpg, CC BY-SA, TCY; and a Flickr CC BY one): a pale
 * stone figure on a narrow inscribed pedestal in a low U of two end pilasters (about 3.4 m apart, 2.3 m tall) behind a stone
 * slab. Facing south here (a guess). Heights read off the photo against the hedge, so approximate.
 */
export const perronetStatue: Draw = atGround((out) => {
  const hs = PE_SPAN / 2
  block(out, -hs - 0.6, hs + 0.6, -1.0, 0.5, 0, 0.12, shade(STONE, 0.85))
  for (const sx of [-1, 1]) block(out, sx * hs - 0.25, sx * hs + 0.25, -0.25, 0.25, 0.12, PE_PIL_H, STONE)
  block(out, -hs, hs, 0.1, 0.35, 0.12, 1.1, shade(STONE, 0.95))
  block(out, -0.45, 0.45, -0.3, 0.3, 0.12, PE_H, STONE)
  const y = PE_H
  if (!STAND_IN.perronet) return
  lathe(out, 0, 0, y, [[0, 0.3], [0.5 * PE_FIG, 0.32], [0.82 * PE_FIG, 0.28], [0.9 * PE_FIG, 0.12], [PE_FIG, 0.1]], STONE, 10)   // stone (Neuilly bought it in 1981; not bronze)
})

// ---------------------------------------------------------------- Puteaux, Lucien Lechevallier bust
const LE_H = 1.3
/** OSM n12163125514 (bust, "directeur des parcs et jardins de Puteaux"): a small bust on a low pedestal in a park; GUESSED. */
export const lechevallierBust: Draw = atGround((out) => {
  const y = plinth(out, 0.4, 0.4, LE_H)
  if (!STAND_IN.lechevallier) return
  lathe(out, 0, 0, y, [[0, 0.2], [0.2, 0.23], [0.42, 0.17], [0.55, 0.1], [0.62, 0.01]], BRONZE, 10)
})

// ---------------------------------------------------------------- Oiseau de Jaz (two nodes, 25 m apart; one entry at their middle)
const JAZ_NODES: [number, number][] = [[-8.5, -6], [8.5, 6]]  // the two OSM nodes (17 m east, 12 m north apart) about the entry's centre
/** OSM n12946032150 and n12946032151 (installation): two birds; their form is unknown (GUESSED: a bird on a post each). */
export const oiseauJaz: Draw = atGround((out) => {
  if (!STAND_IN.jaz) return
  for (const [x, z] of JAZ_NODES) {
    prism(out, x, z, 0, 1.4, 0.06, 6, DARKSTONE)
    lathe(out, x, z, 1.4, [[0, 0.22], [0.2, 0.2], [0.4, 0.1], [0.5, 0.01]], hex('#d9a521'), 8)
  }
})
