/**
 * SAINT-MARTIN-DES-CHAMPS, the Musée des Arts et Métiers' church (the Cluniac priory's choir, 1130–40, Paris's oldest Gothic vault; nave 13th century; restored by Vaudoyer in the 1860s; OSM ways 56301534, 1484904717–19). From the Rue Réaumur, which is how Paris knows it: the low ambulatory with its ring of radiating chapels, the high choir above, the Romanesque bell
 * tower with its tiled cap at the angle, and the long slate nave behind. Read from IGN's aerial (48.8661 2.355, 0.16 m/px): the choir's lobes at (590–680, 620), the golden-brown tower cap at (460, 655), and the nave's little round turrets at its west end (265, 412) and (215, 535). Foucault's pendulum is inside. Replaces the church kit's barn of 2026-10-29: "a plain gabled barn with one door".
 * The entry's point is world (1664, 620), front 292: −z down the nave to its west gable, +z up it to the chevet (bearing 112), +x to the south, the Rue Réaumur. The numbers are OSM's outlines in this frame.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, placed, pointedPane, prism, roof, shade, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { archOn, pedimentOn, rectOn, slabOn } from '../palaces/common.ts'

const S = hex('#a89e88'), T = hex('#b9b09c'), BAND = hex('#8a8373'), SLATE = hex('#454c52'), GLASS: Rgb = [0.13, 0.15, 0.18], DOOR = hex('#2a2520'), TILE = hex('#57431f')
const tag = surfaceTag('ashlar'), metal = surfaceTag('metal')

/** One bay of a round wall, drawn on −z, `w` wide at radius r: for `placed` round a centre. */
function around(out: MeshBuilder, cx: number, cz: number, r: number, a0: number, a1: number, n: number, draw: (q: MeshBuilder, w: number) => void): void {
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * (i + 0.5)) / n
    const q = new MeshBuilder()
    const w = 2 * r * Math.sin(Math.abs(a1 - a0) / n / 2)
    draw(q, w)
    // its −z goes outward at bearing `a` (0 toward +z, turning toward +x)
    placed(out, q, a + Math.PI, cx + Math.sin(a) * r, cz + Math.cos(a) * r)
  }
}

export function saintMartinChevet(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  const NX = 7.4, Z0 = -22.7, Z1 = 21.5, E = y + 15.5, R = 8.4, RA = 14.2, CZ = 33.6
  // ---- the nave: a tall wall, a steep slate roof, its buttresses and paired lancets
  block(out, -NX, NX, Z0, Z1, y, E, S, tag)
  roof(out, -NX - 0.3, NX + 0.3, Z0 - 0.1, Z1 + 0.4, E, 9, NX + 0.3, 0, SLATE)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x', X = s * NX
    for (let z = Z0 + 3.2, k = 0; z < Z1 - 1; z += 6.2, k++) {
      slabOn(out, f, X, z + 3.1 - 0.55, z + 3.1 + 0.55, y, E - 2.4, 1.1, T)
      slabOn(out, f, X, z + 3.1 - 0.55, z + 3.1 + 0.55, y, y + 5, 1.7, S)
      for (const d of [-1.2, 1.2]) rectOn(out, f, X, z + d - 0.55, z + d + 0.55, y + 7, y + 13.4, GLASS, 0.06)
      archOn(out, f, X, z, y + 1.4, 1.9, 3.6, GLASS, 0.06)
    }
    slabOn(out, f, X, Z0, Z1, E - 0.5, E, 0.3, T)
    slabOn(out, f, X, Z0, Z1, y + 6.1, y + 6.3, 0.12, T)
  }
  // ---- the west gable, plain and high between its two round turrets, a portal and three lancets
  const wz = Z0
  rectOn(out, '-z', wz, -NX, NX, y, E, shade(S, 0.98), 0.02)
  pedimentOn(out, '-z', wz, -NX, NX, E, 9, 0.1, S)
  const bf = new MeshBuilder()
  pointedPane(bf, wz - 0.08, 0, y, 3.4, 6, DOOR)
  for (const t of [-2.6, 0, 2.6]) pointedPane(bf, wz - 0.08, t, y + 9, 1.3, 7, GLASS)
  for (const k of [0, 1, 2]) rectOn(bf, '-z', wz, -2.5 - k * 0.3, 2.5 + k * 0.3, y, y + 0.3, T, 0.05)
  out.positions.push(...bf.positions); out.normals.push(...bf.normals); out.uvs.push(...bf.uvs); out.colors.push(...bf.colors)
  { const base = (out.positions.length - bf.positions.length) / 3; for (const i of bf.indices) out.indices.push(base + i) }
  for (const s of [-1, 1]) {
    prism(out, s * (NX + 0.4), wz + 0.4, y, y + 21, 1.5, 10, S, tag)
    prism(out, s * (NX + 0.4), wz + 0.4, y + 21, y + 21.4, 1.7, 10, T, tag)
    prism(out, s * (NX + 0.4), wz + 0.4, y + 21.4, y + 25, 1.6, 10, SLATE, metal, 0.08)
  }
  // ---- the high choir: a drum of round-headed windows, its half cone of slate meeting the nave's ridge
  const CY = E + 1.2
  block(out, -NX, NX, Z1, CZ, y, CY, S, tag)
  roof(out, -NX - 0.2, NX + 0.2, Z1 - 0.2, CZ, CY, 7.8, NX + 0.2, 0, SLATE)
  prism(out, 0, CZ, y, CY, R, 16, S, tag)
  prism(out, 0, CZ, CY - 0.4, CY, R + 0.3, 16, T, tag)
  prism(out, 0, CZ, CY, CY + 7.8, R + 0.3, 16, SLATE, metal, 0.2)
  around(out, 0, CZ, R, -Math.PI * 0.72, Math.PI * 0.72, 9, (q, w) => {
    archOn(q, '-z', -0.02, 0, y + 10.5, Math.min(1.9, w * 0.5), 4, GLASS, 0.08)
    block(q, -w / 2 - 0.1, -w / 2 + 0.25, -0.5, 0, y + 8.2, CY - 0.6, T, tag)
  })
  // ---- the ambulatory, its lean-to of slate, and the ring of chapels
  prism(out, 0, CZ, y, y + 8, RA, 18, S, tag)
  prism(out, 0, CZ, y + 7.7, y + 8, RA + 0.3, 18, T, tag)
  prism(out, 0, CZ, y + 8, y + 10.8, RA + 0.3, 18, SLATE, metal, R + 0.1)
  around(out, 0, CZ, RA, -Math.PI * 0.62, Math.PI * 0.62, 10, (q, w) => {
    archOn(q, '-z', -0.02, 0, y + 2.6, 1.4, 3.2, GLASS, 0.08)
    rectOn(q, '-z', -0.02, -w / 2, w / 2, y + 2, y + 2.2, BAND, 0.05)
  })
  const CH = 5
  for (let k = 0; k < CH; k++) {
    const a = -Math.PI * 0.52 + (k / (CH - 1)) * Math.PI * 1.04, cx = Math.sin(a) * (RA + 1.3), cz = CZ + Math.cos(a) * (RA + 1.3), r = 3.7
    prism(out, cx, cz, y, y + 6.6, r, 12, S, tag)
    prism(out, cx, cz, y + 6.4, y + 6.7, r + 0.2, 12, T, tag)
    prism(out, cx, cz, y + 6.7, y + 9.6, r + 0.25, 12, SLATE, metal, 0.5)
    around(out, cx, cz, r, a - 1.25, a + 1.25, 4, (q, w) => {
      archOn(q, '-z', -0.02, 0, y + 1.9, Math.min(1.1, w * 0.46), 2.9, GLASS, 0.08)
      block(q, -w / 2 - 0.1, -w / 2 + 0.12, -0.24, 0, y, y + 6.4, T, tag)
    })
  }
  // ---- the bell tower at the angle, Romanesque, three tiers of blind arcades and paired openings, and its tile cap
  const TX = 14.2, TZ = 21.9, HW = 4.3, TOP = y + 31
  block(out, TX - HW, TX + HW, TZ - HW, TZ + HW, y, TOP, S, tag)
  block(out, TX - HW - 0.2, TX + HW + 0.2, TZ - HW - 0.2, TZ + HW + 0.2, TOP - 0.4, TOP + 0.1, T, tag)
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const q = new MeshBuilder(), F = -HW
    for (const [y0, h, n, c] of [[y + 11.5, 3.4, 4, BAND], [y + 16.5, 5, 3, BAND], [y + 23, 6.4, 2, DOOR]] as const) {
      slabOn(q, '-z', F, -HW - 0.1, HW + 0.1, y0 - 0.5, y0 - 0.2, 0.16, T)
      for (let i = 0; i < n; i++) {
        const t = -HW + ((i + 0.5) * 2 * HW) / n
        archOn(q, '-z', F, t, y0, (2 * HW / n) * 0.62, h, c, 0.05)
      }
    }
    for (const t of [-HW + 0.3, HW - 0.3]) slabOn(q, '-z', F, t - 0.3, t + 0.3, y, y + 11.2, 0.25, T)
    placed(out, q, a, TX, TZ)
  }
  roof(out, TX - HW - 0.5, TX + HW + 0.5, TZ - HW - 0.5, TZ + HW + 0.5, TOP + 0.1, 7.5, HW + 0.5, HW + 0.5, TILE)
  prism(out, TX, TZ, TOP + 7.2, TOP + 9.2, 0.1, 5, hex('#23272a'), metal, 0.02)
}
