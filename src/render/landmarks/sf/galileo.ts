/**
 * GALILEO ACADEMY (Galileo High School), 1150 Francisco Street, 1924 — the bake's courtyard block (relation 1361062,
 * baked 2722125). The owner's Street View on Polk Street (2026-10-06: "we have nothing for Galileo High School"): a long
 * cream four-storey Mediterranean-revival school on a rusticated pinkish base storey, rows of tall paired windows, a
 * deep bracketed cornice under a low tiled roof edge, and between the wings a recessed arcaded loggia stair tower —
 * round arches with balconies, a pergola on its roof.
 *
 * Standalone at the outline's centre with no turn (local x east, z north); FOOT and COURT are the bake's outline and
 * courtyard in that frame.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygonWithHoles } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { inset, norm, outward, orientedBox, soffit, walls, type P } from './ec4-podium.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const C = { x: -1070, z: 1203 }
const rel = (pts: [number, number][]): P[] => pts.map(([x, z]) => ({ x: x - C.x, z: z - C.z }))
const FOOT = rel([[-1134.0, 1233.2], [-1121.4, 1152.8], [-1104.1, 1155.5], [-1105.0, 1161.1], [-1101.5, 1161.7], [-1101.8, 1163.7],
  [-1076.9, 1167.6], [-1075.8, 1160.6], [-1063.2, 1162.6], [-1064.5, 1170.5], [-1052.7, 1172.3], [-1051.5, 1164.5], [-1008.5, 1171.2],
  [-1012.6, 1197.6], [-1011.4, 1197.8], [-1015.7, 1225.3], [-1016.9, 1225.1], [-1021.0, 1251.1], [-1064.6, 1244.3], [-1064.4, 1243.2],
  [-1067.6, 1242.7], [-1066.5, 1235.9], [-1073.8, 1234.8], [-1075.0, 1242.6], [-1088.3, 1240.5], [-1087.5, 1235.9], [-1093.6, 1234.9],
  [-1093.0, 1231.4], [-1111.7, 1228.5], [-1112.1, 1231.0], [-1116.8, 1230.2], [-1117.6, 1235.8]])
// the courtyard, turned clockwise so its walls face into it
const COURT = rel([[-1073.1, 1229.0], [-1070.0, 1208.8], [-1059.8, 1210.3], [-1057.9, 1197.6], [-1068.2, 1195.9], [-1066.1, 1182.4],
  [-1062.6, 1183.0], [-1061.5, 1176.0], [-1053.5, 1177.2], [-1053.7, 1178.1], [-1031.9, 1181.5], [-1040.0, 1234.2]]).reverse()

const CREAM: Rgb = [0.93, 0.89, 0.8]
const BASE: Rgb = [0.86, 0.73, 0.64]
const BASE_LINE: Rgb = [0.74, 0.62, 0.54]
const TRIM: Rgb = [0.83, 0.68, 0.58]
const GLASS: Rgb = [0.17, 0.2, 0.23]
const FRAME: Rgb = [0.97, 0.95, 0.9]
const ROOF: Rgb = [0.45, 0.3, 0.24]

const BASE_TOP = 4.4, EAVES = 16.4

/** windows along every edge of `ring`, `pitch` apart, sill y0 to head y1; a frame behind each pane */
function windowsAlong(out: MeshBuilder, ring: P[], y0: number, y1: number, pitch: number, w: number, frame: Rgb, tag: number): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    const n = Math.floor((L - 1) / pitch)
    if (n < 1) continue
    const o = outward(ring, i), u = norm(b.x - a.x, b.z - a.z)
    for (let k = 0; k < n; k++) {
      const t = (L - n * pitch) / 2 + (k + 0.5) * pitch
      const cx = a.x + u.x * t, cz = a.z + u.z * t
      for (const [off, ww, h0, h1, c, tg] of [[0.03, w / 2 + 0.12, y0 - 0.12, y1 + 0.12, frame, 0], [0.05, w / 2, y0, y1, GLASS, tag]] as [number, number, number, number, Rgb, number][]) {
        const px = cx + o.x * off, pz = cz + o.z * off
        out.quad([[px - u.x * ww, h0, pz - u.z * ww], [px + u.x * ww, h0, pz + u.z * ww], [px + u.x * ww, h1, pz + u.z * ww], [px - u.x * ww, h1, pz - u.z * ww]], [o.x, 0, o.z], UV, c, tg)
      }
    }
  }
}

export function galileoHigh(out: MeshBuilder, _fit: Fit): void {
  const stucco = surfaceTag('stucco'), glass = surfaceTag('glass')
  for (const ring of [FOOT, COURT]) {
    // the rusticated base, its joints, and a string course over it
    walls(out, ring, 0, BASE_TOP, BASE, stucco)
    for (let y = 0.7; y < BASE_TOP - 0.2; y += 0.7) walls(out, inset(ring, -0.02), y, y + 0.06, BASE_LINE, 0)
    walls(out, inset(ring, -0.12), BASE_TOP - 0.25, BASE_TOP + 0.1, TRIM, stucco)
    soffit(out, inset(ring, -0.12), ring, BASE_TOP - 0.25, TRIM, stucco)
    // the cream storeys, and a band under the top floor
    walls(out, ring, BASE_TOP, EAVES, CREAM, stucco)
    walls(out, inset(ring, -0.05), 12.4, 12.6, TRIM, stucco)
    // the windows: small arched-looking ones in the base, tall ones above
    windowsAlong(out, ring, 1.0, 3.4, 2.8, 0.8, FRAME, glass)
    for (const [y0, y1] of [[5.3, 8.0], [8.9, 11.6], [13.0, 15.4]]) windowsAlong(out, ring, y0, y1, 2.4, 1.3, FRAME, glass)
    // the cornice, deep, on brackets — and its underside
    const lip = inset(ring, -0.6)
    walls(out, lip, EAVES, EAVES + 0.45, CREAM, stucco)
    soffit(out, lip, ring, EAVES, TRIM, stucco)
  }
  // the roof: a low tiled edge sloping up from the cornice, and the flat behind it
  {
    const lip = inset(FOOT, -0.6), top = inset(FOOT, 3)
    for (let i = 0; i < lip.length; i++) {
      const j = (i + 1) % lip.length, o = outward(FOOT, i)
      out.quad([[lip[i].x, EAVES + 0.45, lip[i].z], [lip[j].x, EAVES + 0.45, lip[j].z], [top[j].x, EAVES + 1.5, top[j].z], [top[i].x, EAVES + 1.5, top[i].z]],
        [o.x * 0.35, 1, o.z * 0.35], UV, ROOF, surfaceTag('tile'))
    }
    capPolygonWithHoles(out, [top, inset(COURT, 3)], EAVES + 1.5, [0.55, 0.53, 0.5], 0)
    const clip = inset(COURT, -0.6), ctop = inset(COURT, 3)
    for (let i = 0; i < clip.length; i++) {
      const j = (i + 1) % clip.length, o = outward(COURT, i)
      out.quad([[clip[i].x, EAVES + 0.45, clip[i].z], [clip[j].x, EAVES + 0.45, clip[j].z], [ctop[j].x, EAVES + 1.5, ctop[j].z], [ctop[i].x, EAVES + 1.5, ctop[i].z]],
        [o.x * 0.35, 1, o.z * 0.35], UV, ROOF, surfaceTag('tile'))
    }
  }
  // the loggia stair tower on Polk Street, in the notch between the wings: a recess of round arches, three storeys of
  // balconies, and a pergola on the roof
  {
    const at = { x: -1013.9 - C.x, z: 1211.5 - C.z }
    const u = norm(-4.3, 27.5), o = { x: u.z, z: -u.x }     // along the facade (northward), and out of it (east)
    const W = 4.6
    // (stood 1 m proud of the facade: a recess cut into it is hidden behind the wall the outline already draws)
    const P3 = (s: number, y: number, d0: number): [number, number, number] => { const d = d0 + 1.5; return [at.x + u.x * s + o.x * d, y, at.z + u.z * s + o.z * d] }
    // the recess: a dark back wall a bay deep
    out.quad([P3(-W, BASE_TOP, -0.85), P3(W, BASE_TOP, -0.85), P3(W, EAVES + 0.4, -0.85), P3(-W, EAVES + 0.4, -0.85)], [o.x, 0, o.z], UV, [0.32, 0.3, 0.28], 0)
    // its sides, back to the facade
    for (const s0 of [-W - 0.35, W + 0.35]) out.quad([P3(s0, 0, -1), P3(s0, 0, 0.7), P3(s0, EAVES + 0.45, 0.7), P3(s0, EAVES + 0.45, -1)], s0 < 0 ? [-u.x, 0, -u.z] : [u.x, 0, u.z], UV, CREAM, stucco)
    for (const [y0, y1] of [[BASE_TOP + 0.6, 8.6], [9.4, 12.6], [13.4, EAVES]]) {
      // two round arches a storey: piers and the arch heads, stepped in five pieces
      for (const s of [-W, 0, W]) orientedBox(out, P3(s, 0, 0.35)[0], (y0 + y1) / 2, P3(s, 0, 0.35)[2], 0.35, (y1 - y0) / 2, 0.35, u.x, u.z, CREAM, stucco)
      for (const c of [-W / 2, W / 2]) {
        for (let k = 0; k < 5; k++) {
          const a0 = (k / 5) * Math.PI, a1 = ((k + 1) / 5) * Math.PI, R = W / 2 - 0.35
          const s0 = c + Math.cos(a0) * R, s1 = c + Math.cos(a1) * R
          const yA = y1 - 1.1 + Math.sin((a0 + a1) / 2) * 0.9
          const m = P3((s0 + s1) / 2, 0, 0.35)
          orientedBox(out, m[0], (yA + y1) / 2, m[2], Math.abs(s1 - s0) / 2 + 0.05, (y1 - yA) / 2, 0.3, u.x, u.z, CREAM, stucco)
        }
        // the balcony rail across the arch
        const r = P3(c, 0, 0.55)
        orientedBox(out, r[0], y0 + 0.5, r[2], W / 2 - 0.4, 0.5, 0.04, u.x, u.z, [0.18, 0.18, 0.18], surfaceTag('metal'))
      }
      orientedBox(out, P3(0, 0, 0.35)[0], y1 + 0.2, P3(0, 0, 0.35)[2], W + 0.35, 0.2, 0.4, u.x, u.z, TRIM, stucco)
    }
    // the pergola on the roof: posts and a grid of beams
    const yP = EAVES + 1.5
    for (const s of [-W, -W / 3, W / 3, W]) for (const d of [-2.5, 0.2]) {
      const p = P3(s, 0, d); box(out, p[0], yP + 1.2, p[2], 0.15, 1.2, 0.15, FRAME, stucco)
    }
    for (const d of [-2.5, -1.2, 0.2]) { const p = P3(0, 0, d); orientedBox(out, p[0], yP + 2.45, p[2], W + 0.4, 0.1, 0.08, u.x, u.z, FRAME, stucco) }
    for (let s = -W; s <= W + 0.01; s += 0.9) { const p = P3(s, 0, -1.15); orientedBox(out, p[0], yP + 2.6, p[2], 0.06, 0.07, 1.6, u.x, u.z, FRAME, stucco) }
  }
}

export const GALILEO: Record<string, (out: MeshBuilder, fit: Fit) => void> = { galileoHigh }
