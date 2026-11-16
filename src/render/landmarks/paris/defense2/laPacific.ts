/**
 * La Pacific (ex-Tour Pacific / Japan Tower, Puteaux, Kisho Kurokawa & Mieko Inoue 1992, 25 floors; OSM way/68852287).
 * BD TOPO h 90.6 m (skyscrapercenter gives 84 m roof). Photo fr.wikipedia File:Tour_Pacific_Juin_2022.jpeg: pale blue
 * reflective glass with a sharp prow edge; concave slab with a great gate-like void through the lower half, a steel 'Japanese bridge'
 * footbridge on the front, and a pavilion crown with a low hipped roof. Gate/bridge on the curved face of the crescent ring.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, block, roof as hipRoof } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 90.6, LOBBY_H = 6
const WALL = '#c4ccd2', GLASS = '#86a0b4', ROOF = '#8a8c8a', LOBBY = '#3c454b', PARAPET = '#cfd1d0'
const FLOOR = 3.6, PITCH = 1.6
/** gate: dark recessed panel across the middle of the front, as a fraction of hx and of height */
const GATE_W = 0.22, GATE_H = 0.42, GATE_DEPTH = 0.6, GATE_COL = '#2f363b'
/** footbridge: deck height, span (fraction of hx), reach out from the front, colour */
const BRIDGE_Y = 7, BRIDGE_SPAN = 0.35, BRIDGE_REACH = 6, BRIDGE_W = 3.5, BRIDGE_COL = '#6e7478'
/** tea-house crown pavilion */
const PAV_W = 0.25, PAV_D = 0.7, PAV_H = 4, PAV_ROOF_H = 3, PAV_COL = '#c6c9c8', PAV_ROOF = '#5b6266'

export const laPacific = (out: MeshBuilder, fit: Fit): void => {
  tower(out, fit, {
    height: HEIGHT, roof: hex(ROOF),
    base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(WALL), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
    tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' } }],
    crown: { kind: 'parapet', height: 1.5, colour: hex(PARAPET), material: 'metal' },
  })
  const hx = fit.hx, hz = fit.hz
  // the curved (bulging) long face: of the ring's two crossings of x = 0, the one farther from the axis; OSM's ring is a
  // crescent — a curved SE face and a straight NW chord — so the gate and bridge go on the curve (s = its side)
  const ring = fit.ring ?? []
  let zf = -hz
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    if ((a.x <= 0) !== (b.x <= 0)) { const t = a.x / (a.x - b.x); const z = a.z + (b.z - a.z) * t; if (Math.abs(z) > Math.abs(zf) || zf === -hz) zf = z }
  }
  const s = zf < 0 ? -1 : 1
  let zo = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    if ((a.x <= 0) !== (b.x <= 0)) { const t = a.x / (a.x - b.x); const z = a.z + (b.z - a.z) * t; if (Math.abs(z - zf) > 0.5) zo = z }
  }
  const zc = (zf + zo) / 2, half = Math.abs(zf - zo) / 2
  const gw = GATE_W * hx
  const zr = (d: number): [number, number] => { const p = zf + s * d; return p < zf ? [p, zf - s * 0.05] : [zf - s * 0.05, p] }
  const [g0, g1] = zr(-GATE_DEPTH)
  block(out, -gw, gw, Math.min(g0, g1), Math.max(g0, g1), LOBBY_H, LOBBY_H + GATE_H * HEIGHT, hex(GATE_COL))
  const bs = BRIDGE_SPAN * hx
  const d0 = zf + s * BRIDGE_REACH, d1 = zf + s * (BRIDGE_REACH + BRIDGE_W)
  block(out, -bs, bs, Math.min(d0, d1), Math.max(d0, d1), BRIDGE_Y - 0.6, BRIDGE_Y, hex(BRIDGE_COL))
  for (const e of [-1, 1]) block(out, e * bs - 0.4, e * bs + 0.4, Math.min(zf, d1), Math.max(zf, d1), BRIDGE_Y - 0.6, BRIDGE_Y, hex(BRIDGE_COL))
  const px = PAV_W * hx, pz = PAV_D * half
  block(out, -px, px, zc - pz, zc + pz, HEIGHT, HEIGHT + PAV_H, hex(PAV_COL))
  hipRoof(out, -px - 1, px + 1, zc - pz - 1, zc + pz + 1, HEIGHT + PAV_H, PAV_ROOF_H, px * 0.7, pz * 0.4, hex(PAV_ROOF))
}
