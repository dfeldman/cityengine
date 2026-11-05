/**
 * Tour La Sablière (André Remondet, 1967), rue de la Chapelle / Porte de la Chapelle, Paris 18e. 27-storey, 208-flat
 * concrete housing slab, OSM 76 m, fr.wikipedia 78 m. Pale grey-beige precast panels, stepped plan with full-height bay
 * strips (aerial 2024: notched west face, plain roof with a central plant block), rows of dark windows with pale
 * spandrels, glazed ground-floor shops, and a lit advertising sign on the roof (Mita, TDK, Mercedes, now Haier/Samsung).
 * Plan is OSM's outline; facade rhythm from Commons "Immeubles Porte Chapelle" 2022 and the 2024 IGN aerial.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, hex, type Rgb } from '../../kit.ts'

type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const wall = (out: MeshBuilder, a: P, b: P, y0: number, y1: number, c: Rgb, off = 0): void => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = dz / l, nz = -dx / l
  out.quad([[a[0] + nx * off, y0, a[1] + nz * off], [b[0] + nx * off, y0, b[1] + nz * off], [b[0] + nx * off, y1, b[1] + nz * off], [a[0] + nx * off, y1, a[1] + nz * off]], [nx, 0, nz], UV, c, 0)
}
const fan = (out: MeshBuilder, pts: P[], c: P, y: number, col: Rgb): void => {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]
    out.quad([[c[0], y, c[1]], [b[0], y, b[1]], [a[0], y, a[1]], [c[0], y, c[1]]], [0, 1, 0], UV, col, 0)
  }
}

export const SABLIERE = {
  SHOP_H: 5, FLOOR: 2.75, WIN_BOT: 0.85, WIN_TOP: 2.25, WIN_W: 1.5, WIN_GAP: 1.0, EDGE: 1.2, SPAN: 0.14, // spandrel/window slab depth
  PARAPET: 1.2, PLANT: 4, PLANT_SHARE: 0.35, SIGN_W: 18, SIGN_H: 3.6, SIGN_UP: 2.5, MIN_WALL: 3,
}

export const tourLaSabliere = (out: MeshBuilder, fit: Fit): void => {
  const K = SABLIERE, H = fit.height, panel = hex('#cfc8b8'), strip = hex('#e0dacb'), glass = hex('#38434d'), shop = hex('#2d353b'), roofC = hex('#8d8a82'), sign = hex('#1a3f8c'), signW = hex('#f1f1f1')
  const ring: P[] = fit.ring?.length ? fit.ring.map((p) => [p.x, p.z]) : [[-fit.hx, -fit.hz], [fit.hx, -fit.hz], [fit.hx, fit.hz], [-fit.hx, fit.hz]]
  const floors = Math.floor((H - K.SHOP_H - K.PARAPET) / K.FLOOR), top = K.SHOP_H + floors * K.FLOOR
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 0.3) continue
    wall(out, a, b, 0, H, panel)
    wall(out, a, b, 0.4, K.SHOP_H - 0.6, shop, 0.05) // glazed shops/lobby
    if (l < K.MIN_WALL) continue
    const ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l, n = Math.max(1, Math.floor((l - 2 * K.EDGE) / (K.WIN_W + K.WIN_GAP)))
    const pad = (l - n * K.WIN_W - (n - 1) * K.WIN_GAP) / 2
    for (let f = 0; f < floors; f++) {
      const y = K.SHOP_H + f * K.FLOOR
      for (let w = 0; w < n; w++) {
        const s = pad + w * (K.WIN_W + K.WIN_GAP), p: P = [a[0] + ux * s, a[1] + uz * s], q: P = [a[0] + ux * (s + K.WIN_W), a[1] + uz * (s + K.WIN_W)]
        wall(out, p, q, y + K.WIN_BOT, y + K.WIN_TOP, glass, 0.04)
      }
      wall(out, a, b, y + K.FLOOR - 0.3, y + K.FLOOR, strip, K.SPAN) // pale slab edge
    }
    // full-height pale bay strips at the corners
    for (const s of [0, l - 0.9]) {
      const p: P = [a[0] + ux * s, a[1] + uz * s], q: P = [a[0] + ux * (s + 0.9), a[1] + uz * (s + 0.9)]
      wall(out, p, q, K.SHOP_H, top, strip, 0.08)
    }
  }
  fan(out, ring, [0, 0], H, roofC)
  // roof plant block and parapet band
  for (let i = 0; i < ring.length; i++) wall(out, ring[i], ring[(i + 1) % ring.length], H, H + 0.0, panel)
  const px = fit.hx * K.PLANT_SHARE, pz = fit.hz * K.PLANT_SHARE
  box(out, 0, H + K.PLANT / 2, 0, px, K.PLANT / 2, pz, hex('#b8b3a6'))
  // the lit roof sign, long axis along the tower's long axis, on two posts
  const alongZ = fit.hz >= fit.hx, sw = K.SIGN_W / 2, sh = K.SIGN_H / 2, y = H + K.PLANT + K.SIGN_UP + sh
  const bx = alongZ ? 0.5 : sw, bz = alongZ ? sw : 0.5
  box(out, 0, y, 0, bx, sh, bz, sign)
  const fx = alongZ ? 0.55 : sw * 0.8, fz = alongZ ? sw * 0.8 : 0.55
  box(out, 0, y, 0, alongZ ? 0.56 : fx, sh * 0.5, alongZ ? fz : 0.56, signW)
  for (const t of [-0.6, 0.6]) box(out, alongZ ? 0 : t * sw, H + K.PLANT + K.SIGN_UP / 2, alongZ ? t * sw : 0, 0.3, K.SIGN_UP / 2, 0.3, hex('#555'))
}
