/**
 * Batch 12, the Opus trial (2026-10-31, claude-opus-5-5): four buildings cheaper models failed on. The vertical-plane feature comes first in each.
 *   perretFranklin (photo, Commons): the front recessed in a deep U toward rue Franklin (front bearing 115 from the street's geometry; the U is not in OSM's ring), stacked angled bays round a central bow, tiled frame, terraced top.
 *   maisonCambodge (photo, Commons 2010): wings forward round an open court, stepped terraces, central stair, small stepped spire. Way 13853585 was not in the Overpass cache and no server answered: the open side is read from fit.ring at build time, UNVERIFIED against the real ring.
 *   palatino (Mapillary, a poor frame, and the owner's description): curved banded podium, corbels, the wider tower on them. The curve's sense is a guess.
 *   malakoffSlab (photo, street view): rows 30, 35, 78 are parts of way/83794703, one curved slab. 24, 22, 20 storeys are OSM's; the two lower steps at the south-west end are read from the photo.
 */
import { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, hex, prism, rotated, type Rgb } from '../../kit.ts'

type P = [number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
/** A vertical quad a→b, facing right of travel (seen from above, x east, z north: anticlockwise rings face out). */
const wall = (out: MeshBuilder, a: P, b: P, y0: number, y1: number, c: Rgb, off = 0): void => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = dz / l, nz = -dx / l
  out.quad([[a[0] + nx * off, y0, a[1] + nz * off], [b[0] + nx * off, y0, b[1] + nz * off], [b[0] + nx * off, y1, b[1] + nz * off], [a[0] + nx * off, y1, a[1] + nz * off]], [nx, 0, nz], UV, c, 0)
}
/** A part of the way from a to b, as a point. */
const along = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const flat = (out: MeshBuilder, q: P[], y: number, c: Rgb): void =>
  out.quad(q.map((p) => [p[0], y, p[1]] as [number, number, number]), [0, 1, 0], UV, c, 0)
const blk = (out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, c: Rgb): void =>
  box(out, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0) / 2, (y1 - y0) / 2, Math.abs(z1 - z0) / 2, c)

/** 25 bis rue Franklin (Perret, 1903). Feature: the U. Flanks stand at the street; between them the front falls back 3.6 m past angled bays to a central bow. */
export const perretFranklin = (out: MeshBuilder, fit: Fit): void => {
  const hx = fit.hx, hz = fit.hz, H = fit.height, s = hx / 7.9
  const tile = hex('#c2bca6'), frame = hex('#eeeadc'), panel = hex('#a8a288'), glass = hex('#2f3c44'), shutter = hex('#f0ecdf'), rail = hex('#34383a')
  const F0 = 4.6, FH = 3.05, N = 8, top = F0 + FH * N, xI = hx * 0.37, zF = -hz
  blk(out, -hx, hx, zF, hz, 0, F0, frame)                                  // the ground floor, full width
  wall(out, [-xI, zF], [xI, zF], 0.5, F0 - 0.5, hex('#2c3338'), 0.03)         // its shop
  for (const x of [-hx * 0.86, hx * 0.86]) wall(out, [x - 1, zF], [x + 1, zF], 0.3, F0 - 0.7, hex('#3a4347'), 0.03)
  blk(out, -hx, hx, zF - 0.25, zF + 3.6, F0 - 0.25, F0, frame)                   // the first-floor slab, running across the U
  wall(out, [-xI, zF - 0.25], [xI, zF - 0.25], F0, F0 + 1, rail, 0)
  blk(out, -hx, hx, zF + 3.6, hz, F0, top, tile)                                 // the block behind: no court
  const stripX = -hx + 2.2 * s
  blk(out, -hx, stripX, zF + 0.8, zF + 3.6, F0, top, frame)                       // the narrow glazed strip set back beside one flank
  const flank = (x0: number, x1: number): void => {
    blk(out, x0, x1, zF, zF + 3.6, F0, top, tile)
    const a: P = [x0, zF], b: P = [x1, zF]
    for (let k = 0; k < N; k++) {
      const y = F0 + FH * k
      wall(out, along(a, b, 0.1), along(a, b, 0.9), y + 0.3, y + FH - 0.3, panel, 0.02)      // the tiled panel
      wall(out, along(a, b, 0.24), along(a, b, 0.76), y + 0.55, y + FH - 0.55, k % 2 ? shutter : glass, 0.05)
      wall(out, along(a, b, 0.24), along(a, b, 0.76), y + 0.5, y + 1.15, rail, 0.09)
      blk(out, x0, x1, zF - 0.12, zF + 0.05, y - 0.13, y + 0.13, frame)                       // the frame's beam
    }
    for (const x of [x0 + 0.13, x1 - 0.13]) blk(out, x - 0.16, x + 0.16, zF - 0.14, zF + 0.05, F0, top, frame)  // its posts
  }
  flank(stripX, -xI); flank(xI, hx)
  for (let k = 0; k < N; k++) wall(out, [stripX - 2 * s, zF + 0.8], [stripX - 0.2 * s, zF + 0.8], F0 + FH * k + 0.3, F0 + FH * k + FH - 0.3, glass, 0.04)
  // the U, left to right: the angled bay, the central bow, the angled bay
  const u: P[] = [[-xI, zF + 0.7], [-1.45 * s, zF + 3.6], [-0.95 * s, zF + 2.5], [0.95 * s, zF + 2.5], [1.45 * s, zF + 3.6], [xI, zF + 0.7]]
  for (let k = 0; k < N; k++) {
    const y = F0 + FH * k
    for (let i = 0; i < u.length - 1; i++) {
      const a = u[i], b = u[i + 1], bay = i !== 1 && i !== 3
      wall(out, a, b, y, y + FH, frame)
      wall(out, along(a, b, 0.08), along(a, b, 0.92), y + 0.25, y + FH - 0.3, glass, 0.03)
      const lip = bay ? 0.45 : 0.1
      wall(out, a, b, y - 0.1, y + 0.12, frame, lip)                                     // the slab's edge, each floor's balcony
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = dz / l * lip, nz = -dx / l * lip
      flat(out, [a, b, [b[0] + nx, b[1] + nz], [a[0] + nx, a[1] + nz]], y + 0.12, frame)
      if (bay) wall(out, a, b, y + 0.12, y + 1.05, rail, lip)
    }
  }
  flat(out, [[-xI, zF + 0.7], [xI, zF + 0.7], [xI, zF + 3.7], [-xI, zF + 3.7]], top, frame)   // the U's head closed off above the top storey
  wall(out, [-xI, zF + 0.7], [xI, zF + 0.7], top - 0.5, top, frame, 0)
  // the terraced top: an attic behind the U, a lantern stepping back on each flank, the roof garden between them
  blk(out, -xI, xI, zF + 5.2, hz, top, top + 3.2, frame)
  wall(out, [-xI * 0.8, zF + 5.2], [xI * 0.8, zF + 5.2], top + 0.5, top + 2.6, glass, 0.03)
  blk(out, -xI, xI, zF + 5.2, hz, top + 3.2, top + 3.9, hex('#4f6b3c'))               // the garden
  for (const x of [-1.3 * s, 1.3 * s]) prism(out, x, zF + 8, top + 3.9, Math.max(H, top + 5.6), 0.9, 6, hex('#3f5d45'), 0, 0.15)
  for (const [x0, x1] of [[-xI, stripX], [xI, hx]] as P[]) {
    const lo = Math.min(x0, x1), hi = Math.max(x0, x1), m = (lo + hi) / 2, w = (hi - lo) / 2
    blk(out, lo + 0.25, hi - 0.25, zF + 0.4, zF + 4.4, top, top + 2.7, tile)
    wall(out, [m - w * 0.5, zF + 0.4], [m + w * 0.5, zF + 0.4], top + 0.3, top + 2.3, glass, 0.03)
    wall(out, [lo, zF], [hi, zF], top, top + 0.9, rail, -0.05)
    blk(out, m - w * 0.65, m + w * 0.65, zF + 1, zF + 3.6, top + 2.7, H - 0.5, frame)
    wall(out, [m - w * 0.35, zF + 1], [m + w * 0.35, zF + 1], top + 3, H - 1, glass, 0.03)
    blk(out, m - 0.5, m + 0.5, zF + 1.6, zF + 2.8, H - 0.5, H + 0.7, hex('#8b8c88'))  // the chimney
  }
  for (let k = 0; k < N; k++) for (const x of [-hx * 0.6, 0, hx * 0.6]) wall(out, [x + 0.8, hz], [x - 0.8, hz], F0 + FH * k + 0.5, F0 + FH * k + 2.3, glass, 0.03)
}

/** The side of a footprint its court opens on, as an outward unit vector: the side with the most open ground between the bounding box and the ring. */
const openSide = (fit: Fit): P => {
  const r = fit.ring
  if (!r || r.length < 6) return [0, -1]
  const inside = (x: number, z: number): boolean => {
    let c = false
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) c = !c
    return c
  }
  const n = 16, sides: [P, number][] = [[[0, -1], 0], [[0, 1], 0], [[-1, 0], 0], [[1, 0], 0]]
  sides.forEach((sd) => {
    const [ox, oz] = sd[0]
    for (let a = 1; a < n - 1; a++) for (let d = 0; d < n / 2; d++) {
      const t = (a + 0.5) / n * 2 - 1, q = 1 - ((d + 0.5) / n) * 2
      if (inside(ox ? ox * q * fit.hx : t * fit.hx, oz ? oz * q * fit.hz : t * fit.hz)) break
      sd[1]++
    }
  })
  sides.sort((a, b) => b[1] - a[1])
  return sides[0][1] > n * 2.5 ? sides[0][0] : [0, -1]
}

/** Pavillon du Cambodge (Cité universitaire, 1957). Feature: wings forward round an open court, up stepped terraces to a central stair; the Khmer spire small behind the middle. */
export const maisonCambodge = (out: MeshBuilder, fit: Fit): void => {
  const [ox, oz] = openSide(fit), part = new MeshBuilder()
  const hx = ox ? fit.hz : fit.hx, hz = ox ? fit.hx : fit.hz, H = fit.height
  build: {
    const stone = hex('#d9d4c4'), shade2 = hex('#bfb9a8'), step = hex('#8f8a7a'), glass = hex('#39444b'), door = hex('#2f3a3d')
    const wing = Math.min(hx * 0.3, 12), barD = Math.min(hz * 0.55, 15), T = 2.6, zBar = hz - barD, xW = hx - wing, attic = H - 3.4
    // the terraces: three courses stepping up to the plinth, wrapped round the wings' fronts, a low wall across the court's mouth
    for (let i = 0; i < 3; i++) blk(part, -hx - 1.8 + i * 0.6, hx + 1.8 - i * 0.6, -hz - 2.4 + i * 0.8, -hz + 5, i * T / 3, (i + 1) * T / 3, i % 2 ? stone : step)
    blk(part, -xW, xW, -hz + 5, zBar, 0, T, step)                                 // the court, raised
    flat(part, [[-xW, -hz + 5], [xW, -hz + 5], [xW, zBar], [-xW, zBar]], T + 0.02, hex('#a9a593'))
    blk(part, -hx * 0.2, hx * 0.2, -hz - 2.9, -hz + 5.1, 0, 0.01, step)
    for (let i = 0; i < 8; i++) blk(part, -hx * 0.2, hx * 0.2, -hz - 3.4 + i * 0.75, -hz + 5.2, 0, (i + 1) * T / 8 + 0.03, i % 2 ? step : stone)    // the central stair
    // the block: a long bar at the back, the two wings forward
    blk(part, -hx, hx, zBar, hz, 0, attic, stone)
    for (const sg of [-1, 1]) {
      const x0 = sg * xW, x1 = sg * hx, lo = Math.min(x0, x1), hi = Math.max(x0, x1), m = (lo + hi) / 2, w = (hi - lo) / 2
      blk(part, lo, hi, -hz, zBar, 0, attic, stone)
      blk(part, lo - 0.25, hi + 0.25, -hz - 0.25, zBar, attic, attic + 0.5, shade2)    // its thin eave
      wall(part, [m - w * 0.2, -hz], [m + w * 0.2, -hz], T + 0.7, attic - 1.2, hex('#55605f'), 0.05)    // the tall louvred slot in its end
      for (let k = 0; k < 3; k++) {
        const y = T + 1.5 + k * 3.7
        wall(part, sg > 0 ? [xW, zBar - 1] : [-xW, -hz + 3], sg > 0 ? [xW, -hz + 3] : [-xW, zBar - 1], y, y + 1.3, glass, 0.04)   // inner side, a band
        const a: P = sg > 0 ? [hx, -hz + 4] : [-hx, zBar - 1], b: P = sg > 0 ? [hx, zBar - 1] : [-hx, -hz + 4]
        for (let q = 0; q < 4; q++) wall(part, along(a, b, q / 4 + 0.05), along(a, b, q / 4 + 0.2), y, y + 1.3, glass, 0.04)  // the outer side
      }
    }
    // the court's back wall: a glazed ground floor behind piers, two ribbons of windows, the emblem and the name
    const a: P = [-xW, zBar], b: P = [xW, zBar]
    wall(part, a, b, T, T + 3.3, door, 0.02)
    const piers = 12
    for (let i = 0; i <= piers; i++) { const p = along(a, b, i / piers); blk(part, p[0] - 0.25, p[0] + 0.25, zBar - 0.3, zBar, T, T + 3.3, stone) }
    blk(part, -xW, xW, zBar - 0.5, zBar, T + 3.3, T + 3.7, shade2)
    for (let k = 0; k < 2; k++) {
      const y = T + 4.9 + k * 3.8, n = 12
      for (let i = 0; i < n; i++) if (!(k === 0 && (i === 5 || i === 6))) wall(part, along(a, b, (i + 0.12) / n), along(a, b, (i + 0.88) / n), y, y + 1.15, glass, 0.04)
    }
    wall(part, [-2.6, zBar], [2.6, zBar], T + 4.3, T + 6.8, shade2, 0.08)               // the emblem
    wall(part, [-4.5, zBar], [4.5, zBar], T + 3.75, T + 4.2, hex('#7e7a6b'), 0.08)
    for (const x of [-hx * 0.2 - 1, hx * 0.2 + 1]) { blk(part, x - 0.8, x + 0.8, -hz + 3, -hz + 4.6, T, T + 1, shade2); prism(part, x, -hz + 3.8, T + 1, T + 2.6, 0.55, 6, hex('#a29c88'), 0, 0.4) }  // the guardian lions, on their blocks
    // the attic, set back behind the eave, and the spire stepping up from the middle of the roof
    blk(part, -hx - 0.3, hx + 0.3, zBar - 0.3, hz + 0.3, attic, attic + 0.5, shade2)
    blk(part, -hx * 0.58, hx * 0.58, zBar + 2, hz - 2, attic + 0.5, H, stone)
    wall(part, [-hx * 0.5, zBar + 2], [hx * 0.5, zBar + 2], attic + 1, H - 0.8, glass, 0.04)
    blk(part, -hx * 0.6, hx * 0.6, zBar + 1.8, hz - 1.8, H, H + 0.35, shade2)
    const zs = (zBar + hz) / 2
    const tiers: [number, number][] = [[3.2, 1.5], [2.5, 1.3], [1.9, 1.2], [1.35, 1.1]]
    let y = H + 0.35
    for (const [r, h] of tiers) { blk(part, -r, r, zs - r, zs + r, y, y + h, stone); y += h }
    prism(part, 0, zs, y, y + 3.4, 1.1, 8, stone, 0, 0.2)                                    // the bell of the prasat, drawn to a point
    prism(part, 0, zs, y + 3.4, y + 4.4, 0.2, 6, hex('#a59a6e'), 0, 0.03)
  }
  rotated(out, part, Math.atan2(-ox, -oz))
}

/** Palatino (13e). Feature: the corbels. A curved banded podium, and on heavy concrete brackets the wider storeys of the tower stand out over it. */
export const palatino = (out: MeshBuilder, fit: Fit): void => {
  const hx = fit.hx, hz = fit.hz, H = fit.height, inset = Math.min(3.2, hz * 0.35), P0 = 15, C = 4.6, T = P0 + C
  const white = hex('#f1f1ec'), lip = hex('#fbfbf7'), glass = hex('#3e5361'), conc = hex('#c7c5bb'), dark = hex('#555a5c'), slate = hex('#7b8387')
  // the podium's plan: a stadium, its long sides bowed, anticlockwise
  const pz = hz - inset, rr = pz, plan: P[] = []
  const bow = (x: number): number => 1.6 * (1 - (x / (hx - rr)) ** 2)
  const hxP = hx - 1.2, NS = 16
  for (let i = 0; i <= NS; i++) { const x = -(hxP - rr) + (2 * (hxP - rr) * i) / NS; plan.push([x, -pz - bow(x * (hx - rr) / (hxP - rr)) + 1.6]) }
  for (let i = 1; i < 6; i++) { const a = -Math.PI / 2 + (Math.PI * i) / 6; plan.push([hxP - rr + Math.cos(a) * rr, Math.sin(a) * (rr - 0.8)]) }
  for (let i = 0; i <= NS; i++) { const x = hxP - rr - (2 * (hxP - rr) * i) / NS; plan.push([x, pz - 1.6 + bow(x * (hx - rr) / (hxP - rr))]) }
  for (let i = 1; i < 6; i++) { const a = Math.PI / 2 + (Math.PI * i) / 6; plan.push([-(hxP - rr) + Math.cos(a) * rr, Math.sin(a) * (rr - 0.8)]) }
  const floors = 4, fh = P0 / floors
  for (let i = 0; i < plan.length; i++) {
    const a = plan[i], b = plan[(i + 1) % plan.length]
    wall(out, a, b, 0, P0, white)
    wall(out, a, b, 0, 2.8, hex('#39454c'), 0.03)
    const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = dz / l * 0.45, nz = -dx / l * 0.45
    for (let k = 1; k <= floors; k++) {
      const y = fh * k
      wall(out, a, b, y - 1.0, y - 0.1, lip, 0.45)                                   // the white band, rounding the curve
      if (k < floors) flat(out, [a, b, [b[0] + nx, b[1] + nz], [a[0] + nx, a[1] + nz]], y - 0.1, lip)
      if (k > 0) wall(out, a, b, y - fh + 0.1, y - 1.0, glass, 0.04)                  // the ribbon window
    }
  }
  // the shadow behind the brackets, then the brackets: wedges standing out from the podium to carry the tower's soffit
  blk(out, -hxP + 2, hxP - 2, -pz + 0.3, pz - 0.3, P0, T, dark)
  const wedge = (x: number, z0: number, z1: number, w: number): void => {
    const c = shadeC(conc)
    wall(out, [x - w, z1], [x + w, z1], T - 0.6, T, conc)
    out.quad([[x - w, P0, z0], [x + w, P0, z0], [x + w, T - 0.6, z1], [x - w, T - 0.6, z1]], [0, -0.55, Math.sign(z1 - z0) * 0.83], UV, c, 0)
    for (const sx of [-1, 1]) out.quad([[x + sx * w, P0, z0], [x + sx * w, P0, z0], [x + sx * w, T - 0.6, z1], [x + sx * w, T, z1]], [sx, 0, 0], UV, c, 0)
    for (const sx of [-1, 1]) out.quad([[x + sx * w, P0, z0], [x + sx * w, T, z1], [x + sx * w, T, z0], [x + sx * w, P0, z0]], [sx, 0, 0], UV, c, 0)
    blk(out, x - w, x + w, Math.min(z0, z1), Math.max(z0, z1), T - 0.01, T, conc)
  }
  const bays = Math.round((2 * hx) / 6.2)
  for (let i = 0; i < bays; i++) {
    const x = -hx + (2 * hx * (i + 0.5)) / bays
    wedge(x, -pz + 1.0, -hz, 1.0)
    wedge(x, pz - 1.0, hz, 1.0)
  }
  blk(out, -hx, hx, -hz, hz, T - 0.5, T, conc)                                        // the soffit beam the brackets carry
  // the tower: white piers, tall windows, slate panels, a floor line heavier every second storey
  blk(out, -hx, hx, -hz, hz, T, H - 2.8, white)
  const nF = Math.floor((H - 2.8 - T) / 3), bw = 2 * hx / Math.round((2 * hx) / 3.1), nB = Math.round((2 * hx) / bw)
  for (const sd of [-1, 1]) {
    const z = sd * hz, a: P = sd < 0 ? [-hx, z] : [hx, z], b: P = sd < 0 ? [hx, z] : [-hx, z]
    for (let i = 0; i < nB; i++) for (let k = 0; k < nF; k++) {
      const y = T + 3 * k, t0 = i / nB, t1 = (i + 1) / nB
      const pa = along(a, b, t0 + (t1 - t0) * 0.2), pb = along(a, b, t0 + (t1 - t0) * 0.8)
      if ((i + (k >> 1)) % 3 === 2) wall(out, pa, pb, y + 1.3, y + 2.7, slate, 0.03)
      else wall(out, pa, pb, y + 0.5, y + 2.7, glass, 0.03)
    }
    for (let i = 0; i <= nB; i += 2) { const p = along(a, b, i / nB); blk(out, p[0] - 0.22, p[0] + 0.22, z - 0.3, z + 0.3, T, H - 2.8, lip) }
  }
  for (const sx of [-1, 1]) {
    const a: P = sx < 0 ? [-hx, hz] : [hx, -hz], b: P = sx < 0 ? [-hx, -hz] : [hx, hz]
    for (let k = 0; k < nF; k++) for (let i = 0; i < 4; i++) wall(out, along(a, b, (i + 0.2) / 4), along(a, b, (i + 0.8) / 4), T + 3 * k + 0.5, T + 3 * k + 2.7, glass, 0.03)
  }
  blk(out, -hx + 1.6, hx - 1.6, -hz + 1.4, hz - 1.4, H - 2.8, H, hex('#e4e4de'))   // the set-back top storey
  blk(out, -hx, hx, -hz, hz, H - 3.1, H - 2.8, lip)
}
const shadeC = (c: Rgb): Rgb => [c[0] * 0.8, c[1] * 0.8, c[2] * 0.8]

/**
 * The slab's plan, traced from way/83794703: across the axis from the south-west end to the north-east, v measured anticlockwise of it (toward the north-west, its convex side).
 * The model's frame is whatever the placement chose, so the axis comes from the ring and the end from whichever way round fits it (a rotation, never a mirror).
 */
const SLAB: P[] = [[-6.2, -3], [-14.5, -0.3], [-14.3, 2.9], [-11.1, 6.6], [-8.8, 8.3], [-7.5, 7.9], [-7.1, 8.2], [-7.7, 9.1], [-9.1, 7.8], [-11.5, 6.2], [-14.9, 2.5], [-12.4, 1.1], [-5.6, -3]]
/** Metres along the plan (0–1) where each step starts, and its height: 20, 22, 24 storeys are OSM's parts; the two below them the photo's. */
const STEPS: P[] = [[0, 51], [0.18, 57], [0.35, 63], [0.47, 69], [0.66, 75]]

/** The Malakoff slab (rue Savier; parts way/1169909307, 8, 9 of way/83794703). Feature: one long curved wall, stepping up along its length. */
export const malakoffSlab = (out: MeshBuilder, fit: Fit): void => {
  const r = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const mx = r.reduce((a, p) => a + p.x, 0) / r.length, mz = r.reduce((a, p) => a + p.z, 0) / r.length
  let xx = 0, zz = 0, xz = 0
  for (const p of r) { xx += (p.x - mx) ** 2; zz += (p.z - mz) ** 2; xz += (p.x - mx) * (p.z - mz) }
  const th = 0.5 * Math.atan2(2 * xz, xx - zz)
  const vs = SLAB.flat(), vMid = (Math.min(...vs) + Math.max(...vs)) / 2
  const placeBy = (sg: number) => {
    const U: P = [Math.cos(th) * sg, Math.sin(th) * sg], V: P = [-U[1], U[0]]
    const us = r.map((p) => p.x * U[0] + p.z * U[1]), vr = r.map((p) => p.x * V[0] + p.z * V[1])
    const u0 = Math.min(...us), u1 = Math.max(...us), vc = (Math.min(...vr) + Math.max(...vr)) / 2
    const to = (f: number, v: number): P => { const u = u0 + (u1 - u0) * f, w = v - vMid + vc; return [U[0] * u + V[0] * w, U[1] * u + V[1] * w] }
    const across = (f: number): P => {
      const t = Math.min(0.999, Math.max(0, (f - 0.02) / 0.96)) * (SLAB.length - 1), i = Math.floor(t), q = t - i
      return [SLAB[i][0] * (1 - q) + SLAB[i + 1][0] * q, SLAB[i][1] * (1 - q) + SLAB[i + 1][1] * q]
    }
    let miss = 0
    for (let i = 0; i < r.length; i++) {
      const f = (us[i] - u0) / (u1 - u0), [a, b] = across(f), w = vr[i] - vc + vMid
      miss += Math.max(0, a - w, w - b) ** 2
    }
    return { to, across, miss }
  }
  const A = placeBy(1), B = placeBy(-1), { to, across } = A.miss <= B.miss ? A : B
  const cream = hex('#e7dfc8'), glass = hex('#59646b'), shadow = hex('#a89f88'), roofC = hex('#8a8880'), parapet = hex('#d9d1b8')
  const NS = 26, FH = 3.05
  const hAt = (f: number): number => { let h = STEPS[0][1]; for (const [g, v] of STEPS) if (f >= g) h = v; return h }
  for (let i = 0; i < NS; i++) {
    const f0 = i / NS, f1 = (i + 1) / NS, h = hAt((f0 + f1) / 2)
    const [a0, b0] = across(f0), [a1, b1] = across(f1)
    const lo0 = to(f0, a0), lo1 = to(f1, a1), hi0 = to(f0, b0), hi1 = to(f1, b1)
    for (const [p, q] of [[lo0, lo1], [hi1, hi0]] as [P, P][]) {
      wall(out, p, q, 0, h, cream)
      const floors = Math.floor((h - 5.5) / FH)
      wall(out, p, q, 0, 4.6, hex('#55524c'), 0.03)                                     // the dark foot
      for (let k = 0; k < floors; k++) {
        const y = 5.5 + FH * k
        if (i % 5 === 2) { wall(out, p, q, y - 0.1, y + FH + 0.1, shadow, 0.02); continue }  // the recessed column of loggias breaking the wall into towers
        wall(out, p, q, y + 0.9, y + 2.5, glass, 0.04)                                // the ribbon
      }
      wall(out, p, q, h - 1.1, h + 0.7, parapet, 0.05)
    }
    flat(out, [lo0, lo1, hi1, hi0], h + 0.4, roofC)
    if (i === 0) wall(out, hi0, lo0, 0, h + 0.7, cream)
    if (i === NS - 1) wall(out, lo1, hi1, 0, h + 0.7, cream)
    const nxt = i < NS - 1 ? hAt((f1 + f1 + 1 / NS) / 2) : h
    if (nxt !== h) {
      const [lp, hp] = nxt < h ? [lo1, hi1] : [hi1, lo1]
      wall(out, lp, hp, Math.min(h, nxt), Math.max(h, nxt) + 0.7, cream)                 // the riser where it steps
      for (let k = 0; k < Math.floor(Math.abs(h - nxt) / FH); k++) wall(out, along(lp, hp, 0.2), along(lp, hp, 0.8), Math.min(h, nxt) + FH * k + 1, Math.min(h, nxt) + FH * k + 2.5, glass, 0.04)
    }
  }
}
