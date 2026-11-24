import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { sweptTube } from '../../monuments/minor/monument-kit.ts'

/*
 * LA DÉFENSE, figurative works of the west dalle: ten sculptures, each a procedural plinth under a plain STAND-IN of the
 * sculpture (a lathe or a few blocks of the right height and colour) until the Modly figure exists. The figures are
 * queued in scratchpad monu/defense/guided-queue.md; when one is published, add its paris-statues.json attach at
 * FIGURE_AT[work] and switch its stand-in off in STAND_IN.
 *
 * Every piece stands on the dalle, which is above the model's base (the base is the LOWEST ground under the footprint,
 * which here can be the street under the slab): the whole drawing is lifted by the highest ground sampled round the
 * plinth, as defense-famous/parvis.ts does. Heights and plinth sizes are estimates off photographs of the same casts
 * (Mitoraj's Tindaro and Ikaria from Frankfurt), not surveyed.
 */
/** the stand-ins, per work: false leaves the bare plinth for the Modly figure */
export const STAND_IN: Record<string, boolean> = {
  tindaro: true, ikaria: true, colosse: true, quatreTetes: true, telephone: true, connaissance: true,
  bronze: true, beauTemps: true, envol: true, poire: true, serpent: true,
}
const FIXED = 0
const BRONZE: Rgb = hex('#4a3a28')
const PLINTH_STONE: Rgb = hex('#a9a69d')

/** the highest ground sampled across a small box round the model's origin (the dalle), metres above the model's base */
const SAMPLE_R = 2.5
function dalle(fit: Fit): number {
  const g = fit.groundAt
  if (!g) return fit.grade ?? 0
  let m = fit.grade ?? 0
  for (const [x, z] of [[0, 0], [SAMPLE_R, 0], [-SAMPLE_R, 0], [0, SAMPLE_R], [0, -SAMPLE_R]]) {
    const v = g(x, z)
    if (Number.isFinite(v)) m = Math.max(m, v)
  }
  return m
}
function lifted(out: MeshBuilder, dy: number, draw: () => void): void {
  const from = out.positions.length
  draw()
  for (let i = from; i < out.positions.length; i += 3) out.positions[i + 1] += dy
}

/** a body of revolution: profile [height above y0, radius] pairs, joined by prisms */
function lathe(out: MeshBuilder, cx: number, cz: number, y0: number, prof: [number, number][], c: Rgb, sides = 14): void {
  for (let i = 0; i + 1 < prof.length; i++) {
    const [h0, r0] = prof[i], [h1, r1] = prof[i + 1]
    prism(out, cx, cz, y0 + h0, y0 + h1, Math.max(0.01, r0), sides, c, FIXED, Math.max(0.01, r1), i === 0 || i + 2 === prof.length)
  }
}
/** a plinth of one or two stone steps: half-sizes, height; returns its top */
function plinth(out: MeshBuilder, cx: number, cz: number, hx: number, hz: number, h: number, c: Rgb = PLINTH_STONE): number {
  block(out, cx - hx, cx + hx, cz - hz, cz + hz, 0, h * 0.4, shade(c, 0.9))
  block(out, cx - hx * 0.85, cx + hx * 0.85, cz - hz * 0.85, cz + hz * 0.85, h * 0.4, h, c)
  return h
}

// --- the works -----------------------------------------------------------------------------------------------------
// each: plinth half-sizes (m), plinth height, and the stand-in drawn on top by a function of its base y

/** where each Modly figure's origin sits in the entry's own frame (x, y up from the model base ... add dalle at load), for the attach */
export const FIGURE_AT: Record<string, [number, number]> = {
  ikaria: [0, 2.2], colosse: [0, 2.2],
}

// Photo-checked 2026-11 (Panoramax street photos + parisladefense.com): Ikaria and Colosse stand on tall tapered pale-stone
// plinths (~2.2 m), bronze patinated grey-green; each is ~6 m in all. The telephone booth and Connaissance are not bronze figures.
const PATINA: Rgb = hex('#6a6f62')
const PALE_BLOCK: Rgb = hex('#cdc3b2')
/** a tall tapered plinth: three stacked blocks, narrowing upward; returns its top */
const PLINTH_TAPER = 0.78
function tallPlinth(out: MeshBuilder, cx: number, cz: number, hx: number, hz: number, h: number, c: Rgb = PALE_BLOCK): number {
  const n = 3
  for (let i = 0; i < n; i++) {
    const k = 1 - (1 - PLINTH_TAPER) * (i / (n - 1))
    block(out, cx - hx * k, cx + hx * k, cz - hz * k, cz + hz * k, h * i / n, h * (i + 1) / n, shade(c, 1 - 0.03 * i))
  }
  return h
}
/** a standing figure from stacked prisms: legs, torso, shoulders, optional head; h total, width scale w */
function standing(out: MeshBuilder, cx: number, cz: number, y: number, h: number, w: number, head: boolean, c: Rgb): void {
  for (const s of [-1, 1]) lathe(out, cx + s * 0.12 * w, cz, y, [[0, 0.1 * w], [0.2 * h, 0.075 * w], [0.5 * h, 0.12 * w], [0.52 * h, 0.1 * w]], c, 8)
  lathe(out, cx, cz, y + 0.5 * h, [[0, 0.22 * w], [0.15 * h, 0.2 * w], [0.38 * h, 0.27 * w], [0.44 * h, 0.14 * w]], c, 10)
  if (head) lathe(out, cx, cz, y + 0.9 * h, [[0, 0.07 * w], [0.04 * h, 0.1 * w], [0.1 * h, 0.07 * w], [0.1 * h, 0.001]], c, 8)
}

// Tindaro (Mitoraj, 1997, KPMG tower): a 4.07 m, 3.6 t bronze head. Sold at auction in 2025 and moved to Warsaw (Plac Defilad);
// the La Défense site is empty in 2020 street photos. Set TINDARO_PRESENT true to draw it again.
const TINDARO_PRESENT = false
const TINDARO_H = 4.07, TINDARO_R = 1.3
function tindaro(out: MeshBuilder): void {
  if (!TINDARO_PRESENT) return
  const y = plinth(out, 0, 0, 1.3, 1.1, 0.5)
  if (!STAND_IN.tindaro) return
  lathe(out, 0, 0, y, [[0, 0.8], [0.3 * TINDARO_H, TINDARO_R * 0.9], [0.62 * TINDARO_H, TINDARO_R], [0.9 * TINDARO_H, TINDARO_R * 0.65], [TINDARO_H, 0.2]], BRONZE)
}
// Mitoraj's Ikaria (1987/2000): headless winged woman nailed down by a hand, patinated bronze, wings spread up and out; with
// the plinth ~6 m. Figure ~3.6 m on a ~2.2 m tapered pale-stone plinth.
const IKARIA_H = 3.6, IKARIA_PLINTH = 2.2, WING_SPAN = 1.7
function ikaria(out: MeshBuilder): void {
  const y = tallPlinth(out, 0, 0, 0.75, 0.7, IKARIA_PLINTH)
  if (!STAND_IN.ikaria) return
  standing(out, 0, 0, y, IKARIA_H, 1.05, false, PATINA)
  // the wings: stepped slabs sweeping up and outward from the shoulders
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const x0 = s * (0.3 + 0.38 * i), t = i / 3
    block(out, Math.min(x0, x0 + s * 0.38), Math.max(x0, x0 + s * 0.38), -0.16, 0.16, y + IKARIA_H * (0.5 + 0.1 * t * 2.2 - 0.04 * i), y + IKARIA_H * (0.78 + 0.2 * t), shade(PATINA, 0.9))
  }
  void WING_SPAN
}
// Mitoraj's Colosse / Icare (1999): nude male with truncated arms, head intact, patinated bronze; ~6 m in all: figure ~3.8 m
// on a ~2.2 m tapered pale-stone plinth.
const COLOSSE_H = 3.8, COLOSSE_PLINTH = 2.2
function colosse(out: MeshBuilder): void {
  const y = tallPlinth(out, 0, 0, 0.8, 0.75, COLOSSE_PLINTH)
  if (!STAND_IN.colosse) return
  standing(out, 0, 0, y, COLOSSE_H, 1.15, true, PATINA)
}
// Emily Young's Les Quatre Têtes (2002): four marble heads, but only ONE stands outdoors (at the entrance of the Triangle de
// l'Arche); the other three are in the lobbies. A head with a smooth pale face between rough rock "hair" blocks, ~1.2 m, on a low base.
const HEAD_H = 1.3
const HEAD_ROCK: Rgb = hex('#a89a8a')
const HEAD_FACE: Rgb = hex('#e8e4da')
function quatreTetes(out: MeshBuilder): void {
  block(out, -0.6, 0.6, -0.5, 0.5, 0, 0.3, shade(PLINTH_STONE, 0.9))
  if (!STAND_IN.quatreTetes) return
  const y = 0.3
  for (const s of [-1, 1]) block(out, s * 0.28 - 0.2, s * 0.28 + 0.2, -0.22, 0.22, y + 0.15 * HEAD_H, y + 0.95 * HEAD_H, HEAD_ROCK)
  lathe(out, 0, 0, y, [[0, 0.3], [0.25 * HEAD_H, 0.34], [0.6 * HEAD_H, 0.3], [0.92 * HEAD_H, 0.22], [HEAD_H, 0.05]], HEAD_FACE, 12)
}
// Barelier's Le Téléphone (1999), also OSM node 9723755716 "Bronze" / "voyageur pressé": verdigris bronze, a man with a bundle
// telephoning, seated/striding inside a cubist telephone-booth frame, on a low dark-stone plinth. ~3 m in all.
const VERDIGRIS: Rgb = hex('#5a7766')
const TEL_FRAME_H = 3.0, TEL_FRAME_HX = 0.75, TEL_FRAME_HZ = 0.6, TEL_POST = 0.1
function telephone(out: MeshBuilder): void {
  block(out, -1.5, 1.5, -1.2, 1.2, 0, 0.45, hex('#4e4a46'))
  const y = 0.45
  block(out, -1.25, 1.25, -1.0, 1.0, y, y + 0.25, hex('#5d6a63'))
  if (!STAND_IN.telephone) return
  const y0 = y + 0.25
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * TEL_FRAME_HX, z = sz * TEL_FRAME_HZ
    block(out, x - TEL_POST, x + TEL_POST, z - TEL_POST, z + TEL_POST, y0, y0 + TEL_FRAME_H - 0.55, VERDIGRIS)
  }
  block(out, -TEL_FRAME_HX - 0.15, TEL_FRAME_HX + 0.15, -TEL_FRAME_HZ - 0.15, TEL_FRAME_HZ + 0.15, y0 + TEL_FRAME_H - 0.55, y0 + TEL_FRAME_H, shade(VERDIGRIS, 0.9))
  standing(out, 0, 0, y0 + 0.1, 1.8, 1.4, true, VERDIGRIS)
  block(out, -0.45, 0.45, -0.25, 0.25, y0 + 0.5, y0 + 1.0, shade(VERDIGRIS, 1.1)) // the bundle
}
// Paul Flury's La Connaissance (2003, painted cast iron): two slabs 5.5 m high, bright blue and red (mottled), their tops
// shaped as hands that meet; ~0.5 m wide, ~0.25 m thick; one stands at the Léonard de Vinci pole entrance.
const CONN_H = 5.5, CONN_W = 0.5, CONN_T = 0.25, CONN_BANDS = 9
const CONN_RED: Rgb = hex('#c4402e'), CONN_BLUE: Rgb = hex('#3f7db8')
function connaissance(out: MeshBuilder): void {
  block(out, -0.9, 0.9, -0.5, 0.5, 0, 0.12, shade(PLINTH_STONE, 0.9))
  if (!STAND_IN.connaissance) return
  for (const [i, sx] of ([-1, 1] as number[]).entries()) {
    for (let b = 0; b < CONN_BANDS; b++) {
      const lean = sx * 0.08 * (b / CONN_BANDS) // the tops lean toward each other
      const x = sx * 0.45 - sx * lean * 2.2
      block(out, x - CONN_W / 2, x + CONN_W / 2, -CONN_T / 2, CONN_T / 2, 0.12 + CONN_H * b / CONN_BANDS, 0.12 + CONN_H * (b + 1) / CONN_BANDS, (b + i) % 2 ? CONN_RED : CONN_BLUE)
    }
  }
}
// OSM node "Bronze" is the Téléphone itself (same spot, same figure): no separate work; kept as an alias that draws it.
function bronze(out: MeshBuilder): void { telephone(out) }

// Fenosa's Le Beau Temps Pourchassant la Tempête (1978-79): bronze 226 x 250 x 90 cm (Museu Apel·les Fenosa), a flowing group
// wider than deep, on a low stone block.
const BEAU_H = 2.26, BEAU_W = 2.5, BEAU_D = 0.9
function beauTemps(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(fit.hx, BEAU_W / 2 + 0.3), hz = Math.max(fit.hz, BEAU_D / 2 + 0.4)
  const y = plinth(out, 0, 0, hx, hz, 0.6)
  if (!STAND_IN.beauTemps) return
  // a wave of five leaning masses, tallest at the left
  const hs = [1.0, 0.8, 0.5, 0.65, 0.35]
  for (let i = 0; i < hs.length; i++) {
    const x0 = -BEAU_W / 2 + (BEAU_W / hs.length) * i
    block(out, x0, x0 + BEAU_W / hs.length * 1.1, -BEAU_D / 2 * (0.6 + 0.4 * hs[i]), BEAU_D / 2 * (0.6 + 0.4 * hs[i]), y, y + BEAU_H * hs[i], BRONZE)
  }
}
// Étienne Pirot's L'Envol: an upward-sweeping bronze, ~3 m (estimate).
const ENVOL_H = 3.2
function envol(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(fit.hx, 0.9), hz = Math.max(fit.hz, 0.9)
  const y = plinth(out, 0, 0, hx, hz, 0.5)
  if (!STAND_IN.envol) return
  lathe(out, 0, 0, y, [[0, 0.5], [0.4 * ENVOL_H, 0.3], [ENVOL_H, 0.12]], BRONZE, 8)
}

// Laurence Rieti's mosaic Poire (OSM: "sculpture recouverte de mozaïques"): a pear, drawn procedurally in patches of mosaic.
const POIRE_H = 2.6
const MOSAIC: Rgb[] = [hex('#c9b23a'), hex('#8fb04a'), hex('#d8c85a'), hex('#6f9a3e'), hex('#e0a63a')]
function poire(out: MeshBuilder): void {
  const y = plinth(out, 0, 0, 1.0, 1.0, 0.25)
  // pear profile: wide round belly low, narrow neck, the stalk
  const prof: [number, number][] = [[0, 0.45], [0.12, 0.8], [0.3, 0.98], [0.45, 0.9], [0.6, 0.62], [0.78, 0.4], [0.92, 0.3], [1, 0.12]]
  for (let i = 0; i + 1 < prof.length; i++) {
    lathe(out, 0, 0, y, [[prof[i][0] * POIRE_H, prof[i][1]], [prof[i + 1][0] * POIRE_H, prof[i + 1][1]]], MOSAIC[i % MOSAIC.length], 14)
  }
  block(out, -0.04, 0.04, -0.04, 0.04, y + POIRE_H, y + POIRE_H + 0.3, hex('#4b3a22'))
}
// Rieti's mosaic Serpent: a coiled tube along the ground, ~6 m of S-curve (estimate), mosaic-banded.
const SERPENT_R = 0.28, SERPENT_L = 6.0, SERPENT_BANDS = 8
function serpent(out: MeshBuilder): void {
  for (let b = 0; b < SERPENT_BANDS; b++) {
    const pts: [number, number, number][] = []
    for (let i = 0; i <= 6; i++) {
      const t = (b + i / 6) / SERPENT_BANDS
      pts.push([(t - 0.5) * SERPENT_L, SERPENT_R * (1 + 0.15 * Math.sin(t * 20)), 1.0 * Math.sin(t * Math.PI * 2.4)])
    }
    sweptTube(out, pts, { r: SERPENT_R, sides: 8, c: MOSAIC[b % MOSAIC.length], caps: true })
  }
}

type Draw = (out: MeshBuilder, fit: Fit) => void
const wrap = (d: Draw): Draw => (out, fit) => lifted(out, dalle(fit), () => d(out, fit))
export const defenseTindaro = wrap(tindaro)
export const defenseIkaria = wrap(ikaria)
export const defenseColosse = wrap(colosse)
export const defenseQuatreTetes = wrap(quatreTetes)
export const defenseTelephone = wrap(telephone)
export const defenseConnaissance = wrap(connaissance)
export const defenseBronzeVoyageur = wrap(bronze)
export const defenseBeauTemps = wrap(beauTemps)
export const defenseEnvol = wrap(envol)
export const defensePoire = wrap(poire)
export const defenseSerpent = wrap(serpent)
