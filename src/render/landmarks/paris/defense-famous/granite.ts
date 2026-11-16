/**
 * TOUR GRANITE (Christian de Portzamparc, 2008; 184 m, 37 storeys), Nanterre, La Défense: Société Générale's third
 * tower, beside the twin Tours Société Générale. A wedge in plan (sharp west prow, a broad east flank, convex south-west
 * face) whose roof is one plane falling from the prow (~180 m) to the east flank (~147 m), so it reads as a blade cut on
 * the slant. Pale blue-silver glass ruled by fine pale granite fins (wider and pinker low down), a white stone spine up
 * the prow with the red-and-black logo at its top, a low base wing along the east side.
 * Sources: fr.wikipedia "Tour Granite" page image (Tour_Granite_Mai_2021.jpeg: finished tower, the slanted top, the
 * colour, the prow spine); IGN LiDAR HD MNS (tools/ign-mns.ts, 2026-11-16, ground 57.2 m NGF): prow 174-182 m, east
 * flank 145-149 m, base wing ~19 m above the street (~10 m above the dalle); plan traced from the MNS >100 m footprint.
 * Drawn in an east/north frame (metres from the OSM box centre 48.89172 N, 2.22953 E) registered onto the fit.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'
import { registerRing, type P2, type V3 } from '../museums/enframe.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const STONE = surfaceTag('metal') // tagged so the pale faces don't go to ashlar

// ---- tunables ----
const G_GLASS = '#b0c7da'        // pale blue-silver glass with sky
const G_ROOF = '#a0b8ca'         // the sloped glass roof
const G_FIN = '#e8e4e0'          // pale granite fins
const G_FIN_LOW = '#e2cfc8'      // pinker granite low down
const G_SPINE = '#f0eeea'        // white stone prow spine
const G_LOGO_RED = '#d6001c', G_LOGO_BLACK = '#1a1a1a'
const G_LOBBY = '#56656e'
const G_WING = '#d8d2cc', G_WING_GLASS = '#7f96a6'
const G_TOP_W = 181              // roof at the prow (MNS 174-182)
const G_TOP_E = 147              // roof at the east flank (MNS 145-149)
const G_SLOPE_E0 = -28, G_SLOPE_E1 = 16 // east-coordinates the roof slope runs between
const G_LOBBY_H = 9
const G_FIN_EVERY = 3.0, G_FIN_W = 0.35, G_FIN_W_LOW = 0.7, G_LOW_K = 0.33
const G_SPINE_W = 3.2, G_SPINE_OVER = 3
const G_WING_H = 10              // above the dalle (MNS ~19 m above the street)

// tower plan, east/north metres (MNS >100 m), anticlockwise
const TOWER: P2[] = [[-30, 1], [-29, -6], [-18, -16], [-6, -21], [8, -25], [17, -27], [22, -18], [26, -8], [26, 10], [18, 17], [12, 23]]
// the low wing along the east flank
const WING: P2[] = [[26, -22], [34, -22], [34, 30], [26, 30]]
// the OSM ring, the site the loader fits
const SITE: P2[] = [[34.8, 25], [30, 29.7], [24.9, 28], [-37, -4.5], [-36.1, -8], [-26.1, -12.8], [-13.2, -18.2], [4.1, -24], [17.6, -27.5], [28.4, -29.7], [30.5, -21.3], [32.4, -14.2], [37, -13.8], [36, 14.1], [35.8, 23.2]]

export function granite(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(SITE, fit)
  const P = (v: V3): V3 => F.p(v[0], v[1], v[2])
  const k = fit.height > 150 && fit.height < 200 ? fit.height / 184 : 1
  const roof = (e: number): number => k * (G_TOP_W + (G_TOP_E - G_TOP_W) * Math.min(1, Math.max(0, (e - G_SLOPE_E0) / (G_SLOPE_E1 - G_SLOPE_E0))))
  let ce = 0, cn = 0
  for (const [e, n] of TOWER) { ce += e / TOWER.length; cn += n / TOWER.length }

  const face = (pts: V3[], col: Rgb, tag: number, hint?: V3, lit = true): void => {
    const [a, b, c] = pts
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const L = Math.hypot(...n) || 1; n = [n[0] / L, n[1] / L, n[2] / L]
    const h: V3 = hint ?? [(a[0] + b[0] + c[0]) / 3 - ce, (a[1] + b[1] + c[1]) / 3 - cn, 0]
    if (n[0] * h[0] + n[1] * h[1] + n[2] * h[2] < 0) n = [-n[0], -n[1], -n[2]]
    const t = lit ? 0.86 + 0.1 * (n[0] * -0.6 + n[1] * -0.8) + 0.12 * n[2] : 1
    const q = pts.length === 3 ? [pts[0], pts[1], pts[2], pts[2]] : pts
    out.quad(q.map(P) as [V3, V3, V3, V3], F.n(n), UV, shade(col, t), tag)
  }
  // a vertical strip standing proud of a wall from a (bottom) up to height h1, along the wall direction d
  const fin = (x: number, z: number, o: P2, h0: number, h1: number, w: number, col: Rgb, off = 0.2): void => {
    const tx = -o[1] * w / 2, tz = o[0] * w / 2, px = x + o[0] * off, pz = z + o[1] * off
    face([[px - tx, pz - tz, h0], [px + tx, pz + tz, h0], [px + tx, pz + tz, h1], [px - tx, pz - tz, h1]], col, STONE, [o[0], o[1], 0], false)
  }

  const glass = hex(G_GLASS), finHi = hex(G_FIN), finLo = hex(G_FIN_LOW), lobby = hex(G_LOBBY)
  for (let i = 0; i < TOWER.length; i++) {
    const a = TOWER[i], b = TOWER[(i + 1) % TOWER.length]
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1
    let o: P2 = [dz / L, -dx / L]
    if (o[0] * ((a[0] + b[0]) / 2 - ce) + o[1] * ((a[1] + b[1]) / 2 - cn) < 0) o = [-o[0], -o[1]]
    const ra = roof(a[0]), rb = roof(b[0])
    // lobby: recessed dark glass, then the glass shaft up to the slanted roofline
    const ia: P2 = [a[0] - o[0] * 1.2, a[1] - o[1] * 1.2], ib: P2 = [b[0] - o[0] * 1.2, b[1] - o[1] * 1.2]
    face([[ia[0], ia[1], 0], [ib[0], ib[1], 0], [ib[0], ib[1], G_LOBBY_H], [ia[0], ia[1], G_LOBBY_H]], lobby, GLASS, [o[0], o[1], 0], false)
    face([[a[0], a[1], G_LOBBY_H], [b[0], b[1], G_LOBBY_H], [ib[0], ib[1], G_LOBBY_H], [ia[0], ia[1], G_LOBBY_H]], finHi, STONE, [0, 0, -1], false)
    face([[a[0], a[1], G_LOBBY_H], [b[0], b[1], G_LOBBY_H], [b[0], b[1], rb], [a[0], a[1], ra]], glass, GLASS, [o[0], o[1], 0])
    // fins: wider and pinker on the lower third, fine and pale above
    const m = Math.max(1, Math.round(L / G_FIN_EVERY))
    for (let f = 0; f < m; f++) {
      const u = f / m, x = a[0] + dx * u, z = a[1] + dz * u, top = ra + (rb - ra) * u, split = G_LOBBY_H + (top - G_LOBBY_H) * G_LOW_K
      fin(x, z, o, G_LOBBY_H, split, G_FIN_W_LOW, finLo)
      fin(x, z, o, split, top, G_FIN_W, finHi)
    }
  }
  // the sloped glass roof
  const top = TOWER.map((p): V3 => [p[0], p[1], roof(p[0])])
  for (let i = 1; i + 1 < top.length; i++) face([top[0], top[i], top[i + 1]], hex(G_ROOF), GLASS, [0.6, 0, 1], false)

  // the prow spine: white stone on the west point, a little proud and above the roof, the logo at its head
  const pr = TOWER[0], spine = hex(G_SPINE), H = roof(pr[0]) + G_SPINE_OVER
  const w = G_SPINE_W / 2
  const sp: P2[] = [[pr[0] - 0.8, pr[1] - w], [pr[0] + 2.5, pr[1] - w], [pr[0] + 2.5, pr[1] + w], [pr[0] - 0.8, pr[1] + w]]
  for (let i = 0; i < 4; i++) {
    const a = sp[i], b = sp[(i + 1) % 4]
    face([[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], H], [a[0], a[1], H]], spine, STONE, [(a[0] + b[0]) / 2 - pr[0] - 0.85, (a[1] + b[1]) / 2 - pr[1], 0])
  }
  face([[sp[0][0], sp[0][1], H], [sp[1][0], sp[1][1], H], [sp[2][0], sp[2][1], H], [sp[3][0], sp[3][1], H]], spine, STONE, [0, 0, 1], false)
  for (const s of [-1, 1]) {
    const y = pr[1] + s * (w + 0.05)
    face([[pr[0] - 0.6, y, H - 6], [pr[0] + 2.3, y, H - 6], [pr[0] + 2.3, y, H - 3], [pr[0] - 0.6, y, H - 3]], hex(G_LOGO_RED), STONE, [0, s, 0], false)
    face([[pr[0] - 0.6, y, H - 9], [pr[0] + 2.3, y, H - 9], [pr[0] + 2.3, y, H - 6], [pr[0] - 0.6, y, H - 6]], hex(G_LOGO_BLACK), STONE, [0, s, 0], false)
  }
  face([[pr[0] - 0.85, pr[1] - w + 0.3, H - 9], [pr[0] - 0.85, pr[1] + w - 0.3, H - 9], [pr[0] - 0.85, pr[1] + w - 0.3, H - 3], [pr[0] - 0.85, pr[1] - w + 0.3, H - 3]], hex(G_LOGO_RED), STONE, [-1, 0, 0], false)

  // the base wing: granite bands and glass, flat roof
  const wing = hex(G_WING), wg = hex(G_WING_GLASS)
  let we = 0, wn = 0
  for (const [e, n] of WING) { we += e / 4; wn += n / 4 }
  for (let i = 0; i < WING.length; i++) {
    const a = WING[i], b = WING[(i + 1) % WING.length], o: V3 = [(a[0] + b[0]) / 2 - we, (a[1] + b[1]) / 2 - wn, 0]
    for (let f = 0; f < 2; f++) {
      const h0 = (G_WING_H / 2) * f, h1 = h0 + G_WING_H / 2
      face([[a[0], a[1], h0], [b[0], b[1], h0], [b[0], b[1], h0 + 3], [a[0], a[1], h0 + 3]], wg, GLASS, o)
      face([[a[0], a[1], h0 + 3], [b[0], b[1], h0 + 3], [b[0], b[1], h1], [a[0], a[1], h1]], wing, STONE, o)
    }
  }
  face(WING.map((p): V3 => [p[0], p[1], G_WING_H]), shade(wing, 0.85), STONE, [0, 0, 1], false)
}
