/**
 * THE HAAS-LILIENTHAL HOUSE, 2007 Franklin Street (Peter R. Schmidt, 1886; way/256993595) — San Francisco Heritage's
 * house museum, the city's grandest surviving Queen Anne. Rebuilt by hand (2026-10-21) from the Mapillary frames in
 * p4/refs/way-256993595/ (01: Franklin Street, square on) and the Commons photographs "Haas-Lilienthal House
 * exterior 2025.jpg" (Franklin, square on), "Haas-Lilienthal House.jpg" (the tower and both gables from the
 * south-east) and "Haas-Lilienthal House (San Francisco).jpg" (HABS colour, the whole south side). It replaces
 * tierA-6.ts's `tower()` box with a mansard and a little spire on one corner.
 *
 * What the photographs show:
 *  - a wooden house on a raised basement, painted a grey-green sage with paler grey-green trim (the HABS photograph
 *    of the 1970s shows it white; the Mapillary frames and the 2025 photograph show today's sage);
 *  - on FRANKLIN (east): at the SOUTH corner the ROUND TOWER — a bay through the two main storeys, then a slender drum
 *    rising clear of the roofs with a frieze of carved panels, four little gable-hooded windows round its top and a
 *    tall "witch's hat" cone of dark shingle with a pale turned finial; in the middle the BIG FRONT GABLE — fish-scale
 *    shingles, a bracketed shelf, a carved panel at the apex, a kingpost finial — over a recessed LOGGIA with an
 *    arched opening and a balustraded balcony; at the NORTH end the ENTRANCE PORCH, its arched opening between posts
 *    under a small pediment, a balustrade along its floor, the flight of STEPS down to the pavement; a low retaining
 *    wall along the pavement with the garden behind it;
 *  - on the SOUTH (the garden side): a second gable over a two-storey bay, the tall red-brick CHIMNEY, and at the
 *    back the REAR WING stepping out south toward the garden with its own east-facing gable and bay;
 *  - dark grey-brown shingle roofs, bracketed cornices at every storey, tall sash windows in pale frames.
 *
 * The frame: the city turns the model so the manifest front (Franklin) faces local −z. The builder finds everything
 * on the outline rather than assuming it: the edges are snapped square, the porch is the outermost front edge, the
 * main front the next one back, the north and south walls of the front block the long side edges, and the rear wing
 * the part of the outline that steps out south behind the garden. If the outline came mirrored (the rear wing on +x)
 * the whole house is drawn mirrored to match. Heights are over the model's base (the lowest ground, Franklin's north
 * end); the street-level work stands on `fit.grade` / `fit.groundAt`.
 */
import { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { beam, pane, roof, placed } from '../../kit.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const FIXED = 0
const CLAP = surfaceTag('clapboard')
const STUCCO = surfaceTag('stucco')
const BRICK = surfaceTag('brick')
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** today's sage body, its paler trim, the darker accents (sashes, panels), the shingles in the gables */
const BODY: Rgb = [0.47, 0.52, 0.48]
const TRIM: Rgb = [0.6, 0.65, 0.62]
const ACCENT: Rgb = [0.33, 0.38, 0.35]
const SHINGLE: Rgb = [0.42, 0.47, 0.44]
const BASE: Rgb = [0.55, 0.59, 0.56]
const GLASS: Rgb = [0.13, 0.15, 0.17]
const DOOR: Rgb = [0.24, 0.17, 0.12]
const ROOF: Rgb = [0.33, 0.31, 0.31]
const CONE: Rgb = [0.27, 0.23, 0.22]
const CHIMNEY: Rgb = [0.55, 0.27, 0.2]
const WALL: Rgb = [0.6, 0.62, 0.6]
const IRON: Rgb = [0.12, 0.13, 0.13]

function quad(o: MeshBuilder, p: V3[], c: Rgb, tag = FIXED): void {
  const ax = p[1][0] - p[0][0], ay = p[1][1] - p[0][1], az = p[1][2] - p[0][2]
  const bx = p[3][0] - p[0][0], by = p[3][1] - p[0][1], bz = p[3][2] - p[0][2]
  let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx
  const l = Math.hypot(nx, ny, nz) || 1
  nx /= l; ny /= l; nz /= l
  o.quad(p, [nx, ny, nz], UV, c, tag)
}

/**
 * A gable end drawn facing −z at z = 0, centred on x = 0: the triangle from y0 up `h`, `hw` either side, and its
 * Queen Anne dressing — bargeboards on the rakes, a bracketed shelf across the foot, courses of fish-scale shingle,
 * a carved panel at the apex and the kingpost finial through it. Placed with kit `placed`.
 */
function gable(hw: number, h: number, y0: number, o: { panel?: boolean; shelf?: boolean; brackets?: number } = {}): MeshBuilder {
  const g = new MeshBuilder()
  // the tympanum, a hair behind the trim
  quad(g, [[hw, y0, 0.02], [-hw, y0, 0.02], [0, y0 + h, 0.02], [0, y0 + h, 0.02]], SHINGLE, CLAP)
  // fish-scale courses as darker bands between pale fillets
  for (let k = 0; k < 3; k++) {
    const y = y0 + h * (0.14 + k * 0.17)
    const w = hw * (1 - (y - y0) / h) - 0.15
    if (w < 0.3) break
    box(g, 0, y, -0.02, w, 0.22, 0.03, k % 2 ? ACCENT : SHINGLE, FIXED)
    box(g, 0, y + 0.27, -0.03, w, 0.04, 0.04, TRIM, FIXED)
  }
  // the bargeboards and the kingpost
  for (const s of [-1, 1]) beam(g, [s * (hw + 0.25), y0 - 0.12, -0.12], [0, y0 + h + 0.12, -0.12], 0.07, TRIM, 0.18)
  box(g, 0, y0 + h * 0.62, -0.1, 0.07, h * 0.38 + 0.45, 0.07, TRIM, FIXED)
  box(g, 0, y0 + h + 0.55, -0.1, 0.12, 0.14, 0.12, TRIM, FIXED)
  if (o.panel !== false) box(g, 0, y0 + h * 0.66, -0.06, Math.min(0.9, hw * 0.22), h * 0.11, 0.04, TRIM, FIXED)
  if (o.shelf !== false) {
    // the shelf across the gable's foot, on brackets
    box(g, 0, y0 + 0.05, -0.2, hw + 0.15, 0.1, 0.24, TRIM, FIXED)
    const n = o.brackets ?? Math.max(2, Math.round(hw / 0.9))
    for (let k = 0; k <= n; k++) box(g, -hw + 0.3 + ((2 * hw - 0.6) * k) / n, y0 - 0.25, -0.17, 0.06, 0.2, 0.17, TRIM, FIXED)
  }
  return g
}

/** A window on a wall plane: the dark sash in a pale frame, a little cornice over it. */
function win(o: MeshBuilder, face: '-z' | '+z' | '-x' | '+x', plane: number, t: number, y0: number, w: number, h: number): void {
  pane(o, face, plane, t, y0 - 0.12, w + 0.3, h + 0.2, TRIM, 0.04)
  pane(o, face, plane, t, y0, w, h, GLASS, 0.07)
  const out = face === '-z' || face === '-x' ? -1 : 1
  const off = 0.13 * out
  if (face === '-z' || face === '+z') box(o, t, y0 + h + 0.2, plane + off, w / 2 + 0.25, 0.08, 0.1, TRIM, FIXED)
  else box(o, plane + off, y0 + h + 0.2, t, 0.1, 0.08, w / 2 + 0.25, TRIM, FIXED)
}

/** windows evenly along a wall, `n` to a storey, on each of the storey sills given */
function winRow(o: MeshBuilder, face: '-z' | '+z' | '-x' | '+x', plane: number, t0: number, t1: number, sills: number[],
                h: number, pitch = 2.6, w = 1.0): void {
  if (t1 - t0 < 1.4) return
  const n = Math.max(1, Math.floor((t1 - t0) / pitch))
  for (const y of sills) for (let i = 0; i < n; i++) win(o, face, plane, t0 + ((t1 - t0) * (i + 0.5)) / n, y, w, h)
}

/** turn a builder about y, mirror it across x if asked (flipping its windings so its faces still face out) */
function mirrorX(part: MeshBuilder): void {
  for (let i = 0; i < part.positions.length; i += 3) { part.positions[i] = -part.positions[i]; part.normals[i] = -part.normals[i] }
  for (let i = 0; i < part.indices.length; i += 3) { const t = part.indices[i + 1]; part.indices[i + 1] = part.indices[i + 2]; part.indices[i + 2] = t }
}

function haas(out: MeshBuilder, fit: Fit): void {
  // ---------------------------------------------------------------------------------------- the frame
  let ring: P2[] = fit.ring && fit.ring.length >= 4 ? fit.ring : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring = [...ring].reverse()
  // the walls' own square: the length-weighted mean of the edges' directions, modulo a right angle
  let C = 0, S = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z), t = Math.atan2(b.z - a.z, b.x - a.x)
    C += L * Math.cos(4 * t); S += L * Math.sin(4 * t)
  }
  // kit `rotated` by β takes an edge at angle t (atan2(z, x)) to t − β: turn by the walls' angle, nearest to square
  /*
   * Which end is Franklin is FOUND too, not taken from the frame: the bake's frontage for this house is its short
   * north bay (bearing ~351°), so `front: "street"` turns the model to face Jackson Street's side. The plan is
   * unmistakable — long east–west, narrow at the Franklin end (the front block alone) and wide at the back (where
   * the rear wing steps out south) — so of the four square turns, the one that puts the long axis on z and the
   * narrow end at −z is the front, whatever the manifest says.
   */
  const turn = (q: P2[], a: number): P2[] => q.map((p) => ({ x: p.x * Math.cos(a) + p.z * Math.sin(a), z: -p.x * Math.sin(a) + p.z * Math.cos(a) }))
  const span = (q: P2[]): number => q.length ? Math.max(...q.map((p) => p.x)) - Math.min(...q.map((p) => p.x)) : 0
  let beta = Math.atan2(S, C) / 4, best = -Infinity
  for (let k = 0; k < 4; k++) {
    const a = Math.atan2(S, C) / 4 + (k * Math.PI) / 2
    const q = turn(ring, a)
    const z0 = Math.min(...q.map((p) => p.z)), z1 = Math.max(...q.map((p) => p.z)), d = z1 - z0
    const score = (d >= span(q) ? 100 : 0) + span(q.filter((p) => p.z > z1 - 0.4 * d)) - span(q.filter((p) => p.z < z0 + 0.25 * d))
      - 0.01 * Math.abs(Math.atan2(Math.sin(a), Math.cos(a)))
    if (score > best) { best = score; beta = a }
  }
  const cb = Math.cos(beta), sn = Math.sin(beta)
  let P: P2[] = turn(ring, beta)
  const zMin = Math.min(...P.map((p) => p.z)), zMax = Math.max(...P.map((p) => p.z))
  const D = zMax - zMin
  // the rear wing steps out SOUTH (to the viewer's left from Franklin, −x); if it lies on +x, mirror the plan
  const mean = (q: P2[]): number => q.reduce((t, p) => t + p.x, 0) / Math.max(1, q.length)
  const mirror = mean(P.filter((p) => p.z > zMin + 0.6 * D)) > mean(P.filter((p) => p.z < zMin + 0.3 * D)) + 0.5
  if (mirror) P = P.map((p) => ({ x: -p.x, z: p.z })).reverse()
  const toModel = (x: number, z: number): P2 => {
    const mx = mirror ? -x : x
    return { x: mx * cb - z * sn, z: mx * sn + z * cb }
  }
  const ground = (x: number, z: number, d: number): number => {
    if (!fit.groundAt) return d
    const m = toModel(x, z)
    return fit.groundAt(m.x, m.z)
  }
  // the edges with their outward normals (dz, −dx)
  const E = P.map((a, i) => {
    const b = P[(i + 1) % P.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { a, b, L, nx: (b.z - a.z) / L, nz: -(b.x - a.x) / L, mx: (a.x + b.x) / 2, mz: (a.z + b.z) / 2 }
  }).filter((e) => e.L > 0.4)
  const wP = zMin
  // the front block's sides: the south wall, length-weighted, and the north wall, its longest edge
  const south = E.filter((e) => e.nx < -0.9 && e.mz > wP + 0.1 * D && e.mz < wP + 0.62 * D)
  const uS = south.length ? south.reduce((t, e) => t + e.mx * e.L, 0) / south.reduce((t, e) => t + e.L, 0) : Math.min(...P.map((p) => p.x)) + 3
  const north = E.filter((e) => e.nx > 0.9 && e.mz > wP + 0.1 * D && e.mz < wP + 0.8 * D).sort((p, q) => q.L - p.L)
  const uN = north.length ? north[0].mx : Math.max(...P.map((p) => p.x))
  // the main front: the front-facing edge next behind the porch
  const fronts = E.filter((e) => e.nz < -0.9 && e.mx > uS && e.mx < uN).map((e) => e.mz).sort((p, q) => p - q)
  const wF = fronts.find((z) => z > wP + 0.8 && z < wP + 3.5) ?? wP + 1.8
  const porchEdge = E.filter((e) => e.nz < -0.9 && e.mz < wP + 0.4).sort((p, q) => q.L - p.L)[0]
  let uP0 = porchEdge ? Math.min(porchEdge.a.x, porchEdge.b.x) : uN - 5
  let uP1 = porchEdge ? Math.max(porchEdge.a.x, porchEdge.b.x) : uN
  if (uP1 - uP0 > 0.55 * (uN - uS)) uP0 = uP1 - 0.45 * (uN - uS)
  uP1 = Math.min(uP1, uN)
  // the back of the front block, where its north side ends
  const mid = (uS + uN) / 2
  const backs = P.filter((p) => p.x > mid + 0.5).map((p) => p.z)
  const wR = Math.max(wF + 8, backs.length ? Math.max(...backs) : zMax)
  // the rear wing: the outline south of the front block
  const wingPts = P.filter((p) => p.x < uS - 2)
  const hasWing = wingPts.length >= 2
  const uW = hasWing ? Math.min(...wingPts.map((p) => p.x)) : uS
  const wW = hasWing ? Math.min(...wingPts.map((p) => p.z)) : wR
  const wB = zMax
  const rearU = P.filter((p) => p.z > wR + 0.5).map((p) => p.x)
  const uWn = Math.max(uS + 1, rearU.length ? Math.max(...rearU) : uS + 1)
  // the north bay, if the outline has one
  const nb = P.filter((p) => p.x > uN + 0.6)
  // the south gable's bay: a south-facing edge stepped out from the front block, before the wing
  const sBay = E.filter((e) => e.nx < -0.9 && e.mx < uS - 0.5 && e.mx > uS - 2.5 && e.mz < wW - 1).sort((p, q) => q.L - p.L)[0]

  // ---------------------------------------------------------------------------------------- heights
  const G = Math.max(0, Math.min(2.5, fit.grade ?? 0.4))
  const B = G + 2.7          // the raised basement's top: the porch and first floor
  const F2 = B + 4.15        // the second floor
  const EV = F2 + 4.2        // the main eaves
  const RISE = 5.8           // the big gables' rise
  const sills1 = [B + 0.75], sills2 = [F2 + 0.7]
  const WH = 2.5             // a sash's height

  const o = new MeshBuilder()

  // ---------------------------------------------------------------------------------------- the body
  const body = (x0: number, x1: number, z0: number, z1: number, y1: number): void => {
    box(o, (x0 + x1) / 2, y1 / 2, (z0 + z1) / 2, (x1 - x0) / 2, y1 / 2, (z1 - z0) / 2, BODY, CLAP)
    // the raised basement, pale, a hair proud
    box(o, (x0 + x1) / 2, B / 2, (z0 + z1) / 2, (x1 - x0) / 2 + 0.06, B / 2, (z1 - z0) / 2 + 0.06, BASE, STUCCO)
    // a belt at each floor and the cornice at the eaves
    box(o, (x0 + x1) / 2, B + 0.05, (z0 + z1) / 2, (x1 - x0) / 2 + 0.12, 0.12, (z1 - z0) / 2 + 0.12, TRIM, FIXED)
    if (y1 > F2 + 1) box(o, (x0 + x1) / 2, F2, (z0 + z1) / 2, (x1 - x0) / 2 + 0.14, 0.16, (z1 - z0) / 2 + 0.14, TRIM, FIXED)
    box(o, (x0 + x1) / 2, y1 - 0.2, (z0 + z1) / 2, (x1 - x0) / 2 + 0.35, 0.22, (z1 - z0) / 2 + 0.35, TRIM, FIXED)
  }
  body(uS, uN, wF, wR, EV)
  if (hasWing) body(uW, uWn, wW, wB, EV)
  if (nb.length >= 2) {
    const z0 = Math.min(...nb.map((p) => p.z)), z1 = Math.max(...nb.map((p) => p.z)), x1 = Math.max(...nb.map((p) => p.x))
    body(uN - 0.2, x1, z0, z1, F2 + 3.6)
    roof(o, uN - 0.2, x1 + 0.3, z0 - 0.3, z1 + 0.3, F2 + 3.6, 1.2, (x1 - uN) / 2 + 0.25, 0.8, ROOF)
    winRow(o, '+x', x1, z0 + 0.4, z1 - 0.4, [...sills1, ...sills2], WH, 2.2)
  }

  // ---------------------------------------------------------------------------------------- the roofs
  const hwMain = (uN - uS) / 2 + 0.4
  // a hipped roof over the block, the big gable crossing it at the front
  roof(o, uS - 0.4, uN + 0.4, wF - 0.35, wR + 0.4, EV, RISE, hwMain, hwMain, ROOF)
  // the big front gable rises from the tower's shoulder to the north corner, not across the whole front
  const TR = 2.15
  const tu = uS + TR - 0.15, tw = wF + TR - 0.5
  const fg0 = tu, fg1 = uN + 0.4, fhw = (fg1 - fg0) / 2, fmid = (fg0 + fg1) / 2, FRISE = RISE + 0.5
  roof(o, fg0, fg1, wF - 0.35, wF + fhw + 2, EV, FRISE, fhw, 0, ROOF)
  placed(o, gable(fhw, FRISE, EV, { brackets: 6 }), 0, fmid, wF - 0.42)
  if (hasWing) {
    const hw = (uWn - uW) / 2 + 0.4, cx = (uW + uWn) / 2
    roof(o, uW - 0.4, uWn + 0.4, wW + 1, wB + 0.4, EV, RISE * 0.8, hw, hw, ROOF)
    roof(o, uW - 0.4, uWn + 0.4, wW - 0.35, wW + hw + 1.5, EV, RISE * 0.8, hw, 0, ROOF)
    placed(o, gable(hw, RISE * 0.8, EV, {}), 0, cx, wW - 0.42)
    // a two-storey bay on the wing's east face, toward the garden
    const bw = Math.min(1.8, hw * 0.4)
    box(o, cx, (B + EV - 0.6) / 2, wW - 0.55, bw, (EV - 0.6 - B) / 2, 0.55, BODY, CLAP)
    box(o, cx, EV - 0.5, wW - 0.6, bw + 0.2, 0.15, 0.68, TRIM, FIXED)
    for (const y of [B + 0.75, F2 + 0.7]) win(o, '-z', wW - 1.1, cx, y, bw * 1.2, WH)
    winRow(o, '-z', wW, uW + 0.3, cx - bw - 0.3, [...sills1, ...sills2], WH, 2.4)
    winRow(o, '-x', uW, wW + 0.6, wB - 0.6, [...sills1, ...sills2], WH, 2.8)
    winRow(o, '+z', wB, uW + 0.6, uWn - 0.6, [F2 + 0.7], WH, 2.8)
  }
  // the south gable over its bay, and the bay
  const sb = sBay ? { u: sBay.mx, z0: Math.min(sBay.a.z, sBay.b.z), z1: Math.max(sBay.a.z, sBay.b.z) } : null
  const sgz0 = sb ? sb.z0 : wF + 0.45 * (wR - wF), sgz1 = sb ? sb.z1 : wF + 0.65 * (wR - wF)
  const sgu = sb ? sb.u : uS - 1
  {
    const hw = (sgz1 - sgz0) / 2 + 0.3, cz = (sgz0 + sgz1) / 2
    box(o, (sgu + uS) / 2, EV / 2, cz, (uS - sgu) / 2 + 0.05, EV / 2, (sgz1 - sgz0) / 2, BODY, CLAP)
    box(o, (sgu + uS) / 2, B / 2, cz, (uS - sgu) / 2 + 0.1, B / 2, (sgz1 - sgz0) / 2 + 0.06, BASE, STUCCO)
    box(o, sgu, EV - 0.2, cz, 0.35, 0.22, (sgz1 - sgz0) / 2 + 0.35, TRIM, FIXED)
    box(o, sgu, F2, cz, 0.14, 0.16, (sgz1 - sgz0) / 2 + 0.14, TRIM, FIXED)
    roof(o, sgu - 0.4, mid, cz - hw, cz + hw, EV, RISE * 0.82, 0, hw, ROOF)
    placed(o, gable(hw, RISE * 0.82, EV, {}), Math.PI / 2, sgu - 0.42, cz)
    winRow(o, '-x', sgu, sgz0 + 0.3, sgz1 - 0.3, [...sills1, ...sills2], WH, 2.0)
    pane(o, '-x', sgu - 0.42, cz, EV + 1.0, 0.9, 1.5, GLASS, 0.08)
  }
  // the red-brick chimney on the south wall, between the tower and the south gable
  const chz = (wF + 4.5 + sgz0) / 2
  box(o, uS - 0.45, (EV + RISE + 0.6) / 2, chz, 0.55, (EV + RISE + 0.6) / 2, 0.75, CHIMNEY, BRICK)
  box(o, uS - 0.45, EV + RISE + 0.75, chz, 0.68, 0.18, 0.88, CHIMNEY, BRICK)
  // windows along the front block's south wall (between the tower and the chimney, the chimney and the gable,
  // the gable and the wing) and its north wall
  winRow(o, '-x', uS, wF + 4.8, chz - 1.0, [...sills1, ...sills2], WH, 2.4)
  winRow(o, '-x', uS, chz + 1.0, sgz0 - 0.2, [...sills1, ...sills2], WH, 2.4)
  winRow(o, '-x', uS, sgz1 + 0.3, (hasWing ? wW : wR) - 0.3, [...sills1, ...sills2], WH, 2.6)
  {
    const nz0 = nb.length >= 2 ? Math.min(...nb.map((p) => p.z)) : wF + 5
    const nz1 = nb.length >= 2 ? Math.max(...nb.map((p) => p.z)) : wF + 5
    winRow(o, '+x', uN, wF + 2.2, nz0 - 0.3, [...sills1, ...sills2], WH, 2.4)
    winRow(o, '+x', uN, nz1 + 0.3, wR - 0.5, [...sills1, ...sills2], WH, 2.8)
    winRow(o, '+z', wR, uWn + 0.5, uN - 0.5, [...sills1, ...sills2], WH, 2.8)
  }

  // ---------------------------------------------------------------------------------------- the tower
  const TOP = EV + 5.0       // the drum's cornice
  prism(o, tu, tw, 0, B, TR + 0.06, 12, BASE, STUCCO)
  prism(o, tu, tw, B, TOP, TR, 12, BODY, CLAP, TR, false)
  for (const [y, d, h] of [[B, 0.12, 0.14], [F2, 0.16, 0.18], [EV - 0.25, 0.35, 0.25], [TOP - 1.25, 0.08, 0.7], [TOP - 0.15, 0.4, 0.22]] as const) {
    prism(o, tu, tw, y - h, y + h, TR + d, 12, y > TOP - 2 && h > 0.5 ? TRIM : TRIM, FIXED, TR + d, false)
  }
  // the carved frieze under the drum's cornice: a darker band between the pale ones
  prism(o, tu, tw, TOP - 1.0, TOP - 0.5, TR + 0.1, 12, ACCENT, FIXED, TR + 0.1, false)
  // the sashes round the bay storeys and the drum: on the faces toward the street and the garden
  const tsash = (y0: number, h: number, w: number): void => {
    for (let k = 0; k < 12; k++) {
      const a = ((k + 0.5) / 12) * Math.PI * 2
      const nx = Math.sin(a), nz = Math.cos(a)
      if (nz > 0.5 && nx > -0.2) continue           // the side buried in the house
      const f = new MeshBuilder()
      pane(f, '-z', -(TR * Math.cos(Math.PI / 12)), 0, y0 - 0.1, w + 0.2, h + 0.18, TRIM, 0.03)
      pane(f, '-z', -(TR * Math.cos(Math.PI / 12)), 0, y0, w, h, GLASS, 0.06)
      placed(o, f, a + Math.PI, tu, tw)
    }
  }
  tsash(B + 0.75, WH, 0.72)
  tsash(F2 + 0.7, WH, 0.72)
  tsash(EV + 0.6, 1.5, 0.6)
  // four gable-hooded windows standing round the foot of the cone
  for (let k = 0; k < 4; k++) {
    const a = Math.PI + k * (Math.PI / 2) - Math.PI / 4
    const d = new MeshBuilder()
    box(d, 0, TOP + 0.7, -TR + 0.05, 0.5, 0.85, 0.35, TRIM, FIXED)
    pane(d, '-z', -TR - 0.3, 0, TOP + 0.15, 0.55, 1.05, GLASS, 0.06)
    roof(d, -0.65, 0.65, -TR - 0.35, -TR + 0.6, TOP + 1.55, 0.75, 0.65, 0, ROOF)
    quad(d, [[0.62, TOP + 1.55, -TR - 0.38], [-0.62, TOP + 1.55, -TR - 0.38], [0, TOP + 2.25, -TR - 0.38], [0, TOP + 2.25, -TR - 0.38]], TRIM)
    placed(o, d, a, tu, tw)
  }
  // the witch's hat, and the turned finial
  prism(o, tu, tw, TOP + 0.05, TOP + 5.3, TR + 0.45, 12, CONE, FIXED, 0.16)
  prism(o, tu, tw, TOP + 5.0, TOP + 5.6, 0.3, 8, TRIM, FIXED, 0.22)
  prism(o, tu, tw, TOP + 5.6, TOP + 6.0, 0.22, 8, TRIM, FIXED, 0.1)
  prism(o, tu, tw, TOP + 6.0, TOP + 6.6, 0.12, 6, ACCENT, FIXED, 0.02)

  // ---------------------------------------------------------------------------------------- the Franklin front
  const cu0 = tu + TR, cu1 = uP0
  // the centre bay between the tower and the porch: a sash a storey
  if (cu1 - cu0 > 1.2) {
    win(o, '-z', wF, (cu0 + cu1) / 2, B + 0.75, Math.min(1.1, cu1 - cu0 - 0.6), WH)
    win(o, '-z', wF, (cu0 + cu1) / 2, F2 + 0.7, Math.min(1.1, cu1 - cu0 - 0.6), WH)
  }
  // over the porch, the second-floor pair with carved panels between
  win(o, '-z', wF, (uP0 + uP1) / 2 - 0.75, F2 + 0.7, 0.95, WH)
  win(o, '-z', wF, (uP0 + uP1) / 2 + 0.75, F2 + 0.7, 0.95, WH)
  box(o, (uP0 + uP1) / 2, F2 + 2.0, wF - 0.08, 0.25, 0.9, 0.05, TRIM, FIXED)
  // the loggia in the big gable: an arched opening, dark behind, over a balustraded balcony on brackets
  {
    const lw = Math.min(3.8, fhw * 0.7), lu = fmid, z = wF - 0.45
    const y0 = EV + 0.15, h = 2.1
    pane(o, '-z', z + 0.03, lu, y0, lw, h - 0.4, GLASS, 0.0)
    for (let k = 0; k < 7; k++) {
      // the arch, as pale voussoir blocks round an ellipse
      const t0 = (k / 7) * Math.PI, t1 = ((k + 1) / 7) * Math.PI
      beam(o, [lu + Math.cos(t0) * lw / 2, y0 + h - 0.4 + Math.sin(t0) * 0.55, z - 0.05], [lu + Math.cos(t1) * lw / 2, y0 + h - 0.4 + Math.sin(t1) * 0.55, z - 0.05], 0.1, TRIM, 0.08)
    }
    pane(o, '-z', z + 0.03, lu, y0 + h - 0.4, lw * 0.8, 0.45, GLASS, 0.0)
    for (const s of [-1, 1]) box(o, lu + s * (lw / 2 + 0.1), y0 + (h - 0.4) / 2, z - 0.05, 0.12, (h - 0.4) / 2, 0.1, TRIM, FIXED)
    // the balcony: floor, rail, balusters, the brackets under it
    box(o, lu, y0 - 0.1, z - 0.55, lw / 2 + 0.5, 0.12, 0.5, TRIM, FIXED)
    box(o, lu, y0 + 0.85, z - 0.95, lw / 2 + 0.5, 0.06, 0.08, TRIM, FIXED)
    box(o, lu, y0 + 0.42, z - 0.95, lw / 2 + 0.45, 0.33, 0.03, ACCENT, FIXED)
    for (let k = 0; k <= 6; k++) box(o, lu - lw / 2 - 0.4 + ((lw + 0.8) * k) / 6, y0 + 0.42, z - 0.98, 0.05, 0.38, 0.05, TRIM, FIXED)
    for (const s of [-1, 1]) box(o, lu + s * (lw / 2 + 0.2), y0 - 0.5, z - 0.4, 0.08, 0.3, 0.4, TRIM, FIXED)
  }
  // the entrance porch: its floor on the basement, the posts, the arch, the pediment and its roof, the door
  {
    const pw = uP1 - uP0, pc = (uP0 + uP1) / 2, depth = wF - wP
    const ptop = B + 3.3
    box(o, pc, B / 2, (wP + wF) / 2, pw / 2, B / 2, depth / 2 + 0.02, BASE, STUCCO)
    box(o, pc, B + 0.06, (wP + wF) / 2, pw / 2 + 0.08, 0.08, depth / 2 + 0.06, TRIM, FIXED)
    for (const s of [-1, 1]) {
      box(o, pc + s * (pw / 2 - 0.22), (B + ptop) / 2, wP + 0.22, 0.2, (ptop - B) / 2, 0.2, TRIM, FIXED)
      box(o, pc + s * (pw / 2 - 0.22), B + 0.5, wP + 0.22, 0.27, 0.5, 0.27, TRIM, FIXED)
    }
    // the entablature, and the arch springing from the posts
    box(o, pc, ptop + 0.3, wP + 0.1, pw / 2 + 0.1, 0.32, 0.12, TRIM, FIXED)
    box(o, pc, ptop + 0.3, (wP + wF) / 2, pw / 2 + 0.1, 0.32, depth / 2, BODY, CLAP)
    const ar = pw / 2 - 0.42
    for (let k = 0; k < 6; k++) {
      const t0 = (k / 6) * Math.PI, t1 = ((k + 1) / 6) * Math.PI
      beam(o, [pc + Math.cos(t0) * ar, ptop - 0.9 + Math.sin(t0) * 0.85, wP + 0.12], [pc + Math.cos(t1) * ar, ptop - 0.9 + Math.sin(t1) * 0.85, wP + 0.12], 0.1, TRIM, 0.1)
    }
    // the spandrels over the arch's haunches, in the body colour
    for (const s of [-1, 1]) box(o, pc + s * (ar - 0.25), ptop - 0.25, wP + 0.12, 0.4, 0.3, 0.06, BODY, CLAP)
    // the pediment and the porch roof behind it
    roof(o, uP0 - 0.15, uP1 + 0.15, wP - 0.25, wF, ptop + 0.6, 1.6, pw / 2 + 0.15, 0, ROOF)
    placed(o, gable(pw / 2 + 0.15, 1.6, ptop + 0.6, { panel: false, brackets: 3 }), 0, pc, wP - 0.3)
    // the balustrade along the porch's front, open at its south end where the steps arrive
    const land = 1.45
    {
      const a = uP0 + land, b = uP1 - 0.4
      if (b - a > 0.4) {
        box(o, (a + b) / 2, B + 0.95, wP + 0.15, (b - a) / 2, 0.06, 0.08, TRIM, FIXED)
        box(o, (a + b) / 2, B + 0.5, wP + 0.17, (b - a) / 2, 0.38, 0.02, ACCENT, FIXED)
        const n = Math.max(1, Math.round((b - a) / 0.35))
        for (let k = 0; k <= n; k++) box(o, a + ((b - a) * k) / n, B + 0.5, wP + 0.14, 0.04, 0.4, 0.04, TRIM, FIXED)
      }
    }
    // the double door in its frame, a transom over it, lamps either side
    pane(o, '-z', wF, pc, B, 1.9, 3.15, TRIM, 0.03)
    pane(o, '-z', wF, pc, B + 0.02, 1.6, 2.5, DOOR, 0.06)
    pane(o, '-z', wF, pc, B + 2.62, 1.6, 0.45, GLASS, 0.06)
    for (const s of [-1, 1]) box(o, pc + s * 1.3, B + 1.9, wF - 0.15, 0.1, 0.18, 0.1, IRON, FIXED)

    // ------------------------------------------------------------------------------------ the steps and the wall
    /*
     * The flight climbs ALONG the front, from the pavement at the south up to a landing before the porch's south
     * end: the photographs' flight runs straight out to the pavement, but the city's Franklin pavement begins hard
     * against the outline, and a flight five metres out stood in the roadway (first city shot). Along the front it
     * stays within 1.4 m of the outline, between a solid outer cheek wall and the house.
     */
    const sd = 1.35, zo = wP - sd                    // the flight's outer face
    const landing0 = uP0 - 0.1
    const gS = ground(landing0 - 3, wP - 0.7, G)
    const rise = B - gS
    const n = Math.max(4, Math.round(rise / 0.19))
    const tread = Math.min(0.3, Math.max(0.24, (landing0 - (tu - TR) - 0.3) / n)), run = n * tread
    const foot = landing0 - run
    // the landing, before the porch
    box(o, uP0 + land / 2 - 0.05, (gS - 0.3 + B) / 2, wP - sd / 2, land / 2 + 0.05, (B - gS + 0.3) / 2, sd / 2, BASE, STUCCO)
    for (let k = 0; k < n; k++) {
      const top = gS + (rise * (k + 1)) / n
      const x0 = foot + k * tread
      box(o, (x0 + landing0) / 2, (gS - 0.3 + top) / 2, wP - sd / 2, (landing0 - x0) / 2, (top - gS + 0.3) / 2, sd / 2, BASE, STUCCO)
    }
    // the outer cheek wall's coping, rising with the flight, a newel at its foot, a rail round the landing
    beam(o, [foot + 0.2, gS + 0.95, zo - 0.12], [landing0, B + 0.95, zo - 0.12], 0.12, TRIM, 0.08)
    const side = new MeshBuilder()
    quad(side, [[foot, gS - 0.3, 0], [landing0, gS - 0.3, 0], [landing0, B + 0.9, 0], [foot, gS + 0.9, 0]], BASE, STUCCO)
    placed(o, side, 0, 0, zo - 0.04)
    box(o, foot + 0.1, (gS - 0.3 + gS + 1.1) / 2, zo - 0.12, 0.24, 0.7, 0.24, BASE, STUCCO)
    box(o, foot + 0.1, gS + 1.15, zo - 0.12, 0.3, 0.06, 0.3, TRIM, FIXED)
    box(o, uP0 + land / 2 - 0.05, B + 0.95, zo - 0.08, land / 2 + 0.1, 0.06, 0.08, TRIM, FIXED)
    box(o, uP0 + land / 2 - 0.05, B + 0.5, zo - 0.06, land / 2 + 0.05, 0.4, 0.03, ACCENT, FIXED)
    // the low retaining wall along the pavement in front of the garden, with an iron rail on it
    const wz = zo
    const a0 = uW - 0.2, b0 = foot - 0.35
    if (b0 - a0 > 0.5) {
      const segs = Math.max(1, Math.round((b0 - a0) / 5))
      for (let k = 0; k < segs; k++) {
        const x0 = a0 + ((b0 - a0) * k) / segs, x1 = a0 + ((b0 - a0) * (k + 1)) / segs
        const g = ground((x0 + x1) / 2, wz, G)
        box(o, (x0 + x1) / 2, g + 0.25, wz, (x1 - x0) / 2, 0.75, 0.2, WALL, STUCCO)
        box(o, (x0 + x1) / 2, g + 1.03, wz, (x1 - x0) / 2 + 0.02, 0.04, 0.24, TRIM, FIXED)
        box(o, (x0 + x1) / 2, g + 1.75, wz, (x1 - x0) / 2, 0.03, 0.02, IRON, FIXED)
        for (let j = 0; j <= 4; j++) box(o, x0 + ((x1 - x0) * j) / 4, g + 1.4, wz, 0.025, 0.35, 0.025, IRON, FIXED)
      }
    }
  }

  // ---------------------------------------------------------------------------------------- into the model's frame
  if (mirror) mirrorX(o)
  // turned back by −β (kit `rotated`'s sense), copied without spreading: the arrays outgrow the argument limit
  const c = Math.cos(-beta), s = Math.sin(-beta)
  const base = out.positions.length / 3
  for (let i = 0; i < o.positions.length; i += 3) {
    const px = o.positions[i], pz = o.positions[i + 2], nx = o.normals[i], nz = o.normals[i + 2]
    out.positions.push(px * c + pz * s, o.positions[i + 1], -px * s + pz * c)
    out.normals.push(nx * c + nz * s, o.normals[i + 1], -nx * s + nz * c)
  }
  for (const v of o.uvs) out.uvs.push(v)
  for (const v of o.colors) out.colors.push(v)
  for (const i of o.indices) out.indices.push(base + i)
}

export const HAAS_LILIENTHAL: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Haas-Lilienthal House (1886, Peter R. Schmidt): the Queen Anne house museum on Franklin Street — corner tower and witch's hat, the big front gable over its loggia, the entrance porch and its steps. */
  haasLilienthalHouse: (out: MeshBuilder, fit: Fit): void => haas(out, fit),
}
