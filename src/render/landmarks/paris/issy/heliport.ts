/**
 * Héliport de Paris – Issy-les-Moulineaux (OSM aeroway=heliport way/14036409; its apron and pads are not buildings, so this is a
 * standalone model). Read off the IGN orthophoto (0.55 m/px, centred 48.8316 N, 2.2755 E; positions are metres east/north
 * of that centre, tunable): a grey tarmac apron by the avenue, five round pads each with an orange ring and a white H,
 * a white hangar west of the apron, windsock masts. The terminal itself (way/100138538) stays OSM's generic box.
 * Frame: x = −east, z = −north at front 0.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tools, type Frame, type P2, type V3 } from '../museums/enframe.ts'

/** E/N metres from the ortho centre; the entry's lat/lon is ORIGIN */
export const HELI = {
  ORIGIN: [-26, 170] as P2,
  APRON: [[-85, 215], [-8, 232], [30, 200], [32, 128], [-8, 118], [-70, 140]] as P2[], // tarmac, ortho px (270,45)-(430,150)
  PADS: [[-27, 195], [-10, 179], [3, 160], [-39, 151], [-55, 168]] as P2[], PAD_R: 11, RING_W: 1.3,
  H_W: 6, H_L: 7, H_BAR: 0.9,
  HANGAR: [-115, 88] as P2, HANGAR_SIZE: [22, 10] as P2, HANGAR_H: 6, HANGAR_ANGLE: -20, // degrees from east
  SOCKS: [[-70, 150], [20, 215]] as P2[], MAST_H: 7,
  ASPHALT: '#7b7d80', DISC: '#6a6c70', ORANGE: '#e8801c', WHITE: '#f2f2ee', HANGAR_C: '#eceeee', HANGAR_ROOF: '#b9bcbe',
  Y: 0.3, // tarmac thickness (the ground under a standalone model is not measured)
}

const frame = (): Frame => ({ p: (e, n, h) => [-e, h, -n], n: (v) => [-v[0], v[2], -v[1]], xz: (e, n) => ({ x: -e, z: -n }), y0: 0 })

export const heliport = (out: MeshBuilder, _fit: Fit): void => {
  const K = HELI, T = tools(out, frame()), o = K.ORIGIN
  const sh = (p: P2): P2 => [p[0] - o[0], p[1] - o[1]]
  T.prism(K.APRON.map(sh), 0, K.Y, hex(K.ASPHALT), hex(K.ASPHALT))
  const disc = (c: P2, r: number, h: number, col: string): void => {
    const ring: P2[] = []
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; ring.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]) }
    T.cap(ring, h, hex(col))
  }
  const bar = (a: P2, b: P2, w: number, h: number): void => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / l * w / 2, ny = (b[0] - a[0]) / l * w / 2
    T.cap([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], h, hex(K.WHITE))
  }
  for (const raw of K.PADS) {
    const c = sh(raw)
    disc(c, K.PAD_R, K.Y + 0.04, K.ORANGE)
    disc(c, K.PAD_R - K.RING_W, K.Y + 0.08, K.DISC)
    const w = K.H_W / 2, l = K.H_L / 2, h = K.Y + 0.12
    bar([c[0] - w, c[1] - l], [c[0] - w, c[1] + l], K.H_BAR, h)
    bar([c[0] + w, c[1] - l], [c[0] + w, c[1] + l], K.H_BAR, h)
    bar([c[0] - w, c[1]], [c[0] + w, c[1]], K.H_BAR, h)
  }
  // hangar
  const ha = (K.HANGAR_ANGLE * Math.PI) / 180, hc = sh(K.HANGAR), cx = Math.cos(ha), sx = Math.sin(ha), [hw, hd] = [K.HANGAR_SIZE[0] / 2, K.HANGAR_SIZE[1] / 2]
  const hp = ([a, b]: P2): P2 => [hc[0] + a * cx - b * sx, hc[1] + a * sx + b * cx]
  T.prism([hp([-hw, -hd]), hp([hw, -hd]), hp([hw, hd]), hp([-hw, hd])], 0, K.HANGAR_H, hex(K.HANGAR_C), hex(K.HANGAR_ROOF))
  // windsocks: a mast, an orange-and-white cone streaming east
  for (const raw of K.SOCKS) {
    const c = sh(raw), top: V3 = [c[0], c[1], K.MAST_H]
    T.beam([c[0], c[1], 0], top, 0.12, hex('#9a9c9e'))
    for (let i = 0; i < 4; i++) T.beam([c[0] + i * 0.9, c[1], K.MAST_H - i * 0.12], [c[0] + (i + 1) * 0.9, c[1], K.MAST_H - (i + 1) * 0.12], 0.5 - i * 0.1, hex(i % 2 ? K.WHITE : K.ORANGE))
  }
}
