import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { archedPane, block, box, hex, pane, prism, shade } from '../../kit.ts'
import { clockFace, offsetRing } from '../../parts.ts'
import { faceBand, type Face } from '../../tower.ts'
import { archBand, engraved, frontAt, frustum, statue } from './front.ts'
import { trainShed } from './shed.ts'
import { LYON_PARTS, LYON_SHED } from './data.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const METAL = surfaceTag('metal')
const toP = (r: [number, number][]): P2[] => r.map(([x, z]) => ({ x, z }))

/**
 * A block with a MANSARD: the ring raised to `eaves` and dressed, a steep slate slope drawn in by `inset` to `top`,
 * and a flat top. The Gare de Lyon's every range wears one. Where the inward offset of a concave ring comes back
 * with another vertex count, the slope is left off and the top laid at the eaves' ring (a rare tidy-up, not a hole).
 */
export function mansard(out: MeshBuilder, ring: P2[], eaves: number, top: number, face: Face, slate: Rgb, inset = 2.6,
  plain: number[] = []): void {
  const rest = ring.map((_, i) => i).filter((i) => !plain.includes(i))
  faceBand(out, ring, 0, eaves, face, rest)
  if (plain.length) faceBand(out, ring, 0, eaves, { kind: 'blank', wall: face.wall, material: 'ashlar' }, plain)
  // the cornice round the eaves
  const cor = offsetRing(ring, 0.6)
  if (cor.length === ring.length) {
    // (its top a hand's breadth under the roof's own plane: the two caps in one plane fought)
    faceBand(out, cor, eaves - 1.0, eaves - 0.12, { kind: 'blank', wall: shade(face.wall, 0.9), material: 'ashlar' })
    capPolygon(out, cor, eaves - 0.12, shade(face.wall, 0.9), surfaceTag('ashlar'))
  }
  if (top <= eaves + 0.5) { capPolygon(out, ring, eaves, slate, METAL); return }
  const up = offsetRing(ring, -inset)
  if (up.length !== ring.length) { capPolygon(out, ring, top, slate, METAL); faceBand(out, ring, eaves, top, { kind: 'blank', wall: slate, material: 'metal' }); return }
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    const a = ring[i], b = ring[j], c = up[j], d = up[i]
    const ex = b.x - a.x, ez = b.z - a.z, L = Math.hypot(ex, ez) || 1
    out.quad([[a.x, eaves, a.z], [b.x, eaves, b.z], [c.x, top, c.z], [d.x, top, d.z]], [ez / L * 0.9, 0.45, -ex / L * 0.9],
      [[0, 0], [1, 0], [1, 1], [0, 1]], slate, METAL)
  }
  capPolygon(out, up, top, shade(slate, 0.92), METAL)
}

/**
 * The Gare de Lyon (Toudoire, 1895–1902), on the Place Louis-Armand (references: Wikimedia Commons "Front of the Gare de
 * Lyon 2", "Tour Horloge Gare Lyon Paris 32", "Gare de Lyon vue aérienne"). The gist:
 *
 * - the CLOCK TOWER at the front's south-west corner, 67 m: a square stone shaft, the four great clock faces (blue
 *   numerals on white, 6.4 m across) under a cornice, an attic with oculi, and the slate dome and lantern on top;
 * - the front to the place: an arcade of great round arches on the ground floor, the first floor's tall windows
 *   (Le Train Bleu's are behind them), a balustraded cornice and a steep slate mansard with stone dormers and three
 *   sculpture groups; at its north-east end the pavilion heading the Boulevard Diderot range, with its tall square dome;
 * - the range along the Boulevard Diderot, the same mansard;
 * - behind, the GRANDE HALLE: two gabled iron-and-glass spans over the platforms (OSM's glass roof part, 20–30 m).
 *
 * Drawn as ONE model at its own point (the shed and the front must agree, and OSM maps the station as an outline with
 * a dozen parts): every part is OSM's own footprint, generated into stations/data.ts in this entry's frame, front −z
 * to the place (bearing 310°).
 */
export function gareDeLyon(out: MeshBuilder): void {
  const stone = hex('#e0d5bf')
  const deep = shade(stone, 0.85)
  const pale = shade(stone, 1.04)
  const slate = hex('#4f5762')
  const glass: Rgb = [0.2, 0.24, 0.27]
  const face: Face = { kind: 'punched', wall: stone, glass, floor: 5, pitch: 4.2, solid: 0.55, arched: true, material: 'ashlar' }
  const part = (id: string): P2[] => toP([...LYON_PARTS.head, ...LYON_PARTS.tower].find((p) => p.id === id)!.ring)
  const frontEdges = (r: P2[]): number[] => r.map((_, i) => i).filter((i) => {
    const a = r[i], b = r[(i + 1) % r.length], L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return (b.x - a.x) / L > 0.9 && L > 3
  })

  // ---- the ranges, each on its own OSM part
  const head = part('w115948337')
  const diderot = part('w115928131')
  mansard(out, head, 20.5, 29.5, face, slate, 3.2, frontEdges(head))
  mansard(out, part('w231098536'), 18, 24.5, face, slate, 3)
  mansard(out, diderot, 20.5, 28, face, slate, 3, frontEdges(diderot))
  mansard(out, part('w115948181'), 18, 25, face, slate, 3)
  mansard(out, part('w1161318096'), 14, 14, { ...face, floor: 4.6 }, slate)

  // ---- the front to the place: from the Diderot pavilion's far corner to the tower
  const x0 = Math.min(...diderot.map((p) => p.x))
  const tower = part('w115948339')
  const tx0 = Math.min(...tower.map((p) => p.x)), tx1 = Math.max(...tower.map((p) => p.x))
  const tz0 = Math.min(...tower.map((p) => p.z)), tz1 = Math.max(...tower.map((p) => p.z))
  const x1 = tx0
  const zAt = (x: number): number => {
    const z = Math.min(frontAt(head, x), frontAt(diderot, x))
    return Number.isFinite(z) ? z : -106
  }
  const pavR = x0 + 22                       // the Diderot pavilion's width
  // the arcade: great round arches between rusticated piers, over the whole front
  const bays = Math.max(6, Math.round((x1 - x0) / 9.8))
  const bw = (x1 - x0) / bays
  for (let i = 0; i < bays; i++) {
    const xa = x0 + bw * i, xb = xa + bw, xm = (xa + xb) / 2
    const zf = zAt(xm)
    // the piers' rustication, and the arch with its glazed fan and the dark doors under it
    block(out, xa, xa + 1.6, zf - 0.6, zf, 0, 9.6, shade(stone, 0.96))
    block(out, xb - 1.6, xb, zf - 0.6, zf, 0, 9.6, shade(stone, 0.96))
    archedPane(out, zf - 0.05, xm, 0.4, bw - 3.6, 8.6, glass)
    archBand(out, zf - 0.08, xm, 0.4 + 8.6 - (bw - 3.6) / 2, (bw - 3.6) / 2, (bw - 3.6) / 2 + 0.7, pale, 12)
    // the first floor: a pair of tall windows with a balustrade, an oculus with its cartouche between the bays
    for (const f of [-0.22, 0.22]) {
      pane(out, '-z', zf - 0.06, xm + f * bw, 11, 1.7, 4.4, glass)
      block(out, xm + f * bw - 1.1, xm + f * bw + 1.1, zf - 0.5, zf, 10.6, 11.2, pale)
    }
    pane(out, '-z', zf - 0.06, xm, 16.8, 1.4, 1.4, glass)
    box(out, xa, 13.4, zf - 0.25, 0.9, 1.2, 0.25, pale, FIXED)
    // the dormer on the mansard over each bay (not on the pavilion, which has its own roof)
    if (xa >= pavR - 0.1 && xb <= x1 + 0.1) {
      const zr = zf + 1.2
      block(out, xm - 1.4, xm + 1.4, zr - 0.4, zr + 2.2, 20.5, 24.4, stone)
      archedPane(out, zr - 0.43, xm, 21, 1.6, 2.6, glass)
      prism(out, xm, zr + 0.9, 24.4, 25.4, 1.6, 4, deep, FIXED, 0.2)
    }
  }
  // the bands: over the arcade, under the attic, the cornice and its balustrade
  for (const [y0, y1, d, c] of [[9.6, 10.6, 0.9, deep], [15.8, 16.3, 0.6, deep], [19.2, 20.5, 1.2, deep]] as const) {
    for (let i = 0; i < bays; i++) {
      const xa = x0 + bw * i, zf = zAt(xa + bw / 2)
      block(out, xa, xa + bw, zf - d, zf, y0, y1, c)
    }
  }
  for (let i = 0; i < bays; i++) {
    const xa = x0 + bw * i, zf = zAt(xa + bw / 2)
    block(out, xa, xa + bw, zf - 0.7, zf + 0.2, 20.5, 21.6, pale)
  }
  // the three sculpture groups on the mansard, over the middle and either third of the range
  for (const f of [0.18, 0.5, 0.82]) {
    const x = pavR + (x1 - pavR) * f
    const zf = zAt(x)
    block(out, x - 3, x + 3, zf + 0.4, zf + 3.4, 20.5, 26, stone)
    for (const d of [-1.6, 0, 1.6]) statue(out, x + d, 26, zf + 1.8, d === 0 ? 4 : 3.2, pale, false)
    box(out, x, 23.5, zf + 0.38, 1.8, 1.8, 0.1, deep, FIXED)          // the cartouche
  }
  // the Diderot pavilion: a little proud and taller, its segmental pediment with a sculpture, its tall square dome
  {
    const zf = zAt((x0 + pavR) / 2) - 1
    block(out, x0, pavR, zf, zf + 30, 0, 23.5, stone)
    block(out, x0 - 0.4, pavR + 0.4, zf - 0.8, zf + 30.4, 22.3, 23.5, deep)
    for (const x of [x0 + 2.2, pavR - 2.2]) block(out, x - 1.4, x + 1.4, zf - 0.6, zf, 0, 22.3, shade(stone, 1.02))
    // the pediment: a segmental arch of stone over the middle, a group in it
    archBand(out, zf - 0.85, (x0 + pavR) / 2, 23.5, 0.01, 7.5, stone, 14)
    statue(out, (x0 + pavR) / 2, 23.5, zf - 0.9, 4.2, pale, false)
    engraved(out, 'GARE DE LYON', (x0 + pavR) / 2, 10.1, zf - 0.95, 0.9, pavR - x0 - 6)
    // the dome: a truncated square pyramid of slate, steep, with a crest and a lantern
    const cx = (x0 + pavR) / 2, cz = zf + 12, hw = (pavR - x0) / 2 - 1
    for (let k = 0; k < 4; k++) {
      const t0 = k / 4, t1 = (k + 1) / 4
      const w0 = hw * (1 - 0.55 * t0 ** 1.4), w1 = hw * (1 - 0.55 * t1 ** 1.4)
      const y0 = 23.5 + 12 * t0, y1 = 23.5 + 12 * t1
      frustum(out, cx, cz, y0, y1, w0, w1, slate, METAL)
    }
    frustum(out, cx, cz, 35.5, 35.8, hw * 0.47, hw * 0.47, deep)
    prism(out, cx, cz, 35.8, 38.5, 1.6, 8, slate, METAL, 0.5)
  }

  // ---- the CLOCK TOWER, on its own OSM footprint at the front's corner
  {
    const cx = (tx0 + tx1) / 2, cz = (tz0 + tz1) / 2
    const hw = Math.max(4.4, Math.min(5.6, (tx1 - tx0) / 2))
    const sq = (y0: number, y1: number, w: number, c: Rgb, w1 = w): void => frustum(out, cx, cz, y0, y1, w, w1, c, surfaceTag('ashlar'))
    const turn = (f: (nx: number, nz: number, tx: number, tz: number) => void): void => {
      for (const [nx, nz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) f(nx, nz, -nz, nx)
    }
    // the shaft: a plinth, the long stage with its narrow windows and corner piers, a band
    sq(0, 4, hw + 0.4, shade(stone, 0.94))
    sq(4, 40, hw, stone)
    turn((nx, nz, tx, tz) => {
      for (const s of [-1, 1]) box(out, cx + nx * (hw + 0.25) + tx * s * (hw - 0.8), 22, cz + nz * (hw + 0.25) + tz * s * (hw - 0.8),
        Math.abs(tx) * 0.8 + 0.25, 18, Math.abs(tz) * 0.8 + 0.25, shade(stone, 1.03), FIXED)
      for (const y of [8, 15, 22, 29, 34]) box(out, cx + nx * (hw + 0.05), y, cz + nz * (hw + 0.05), Math.abs(tx) * 0.55 + 0.04, 1.6, Math.abs(tz) * 0.55 + 0.04, glass, FIXED)
    })
    sq(40, 41.2, hw + 0.6, deep)
    // the clock stage: a face on every side, framed, under a cornice
    sq(41.2, 50.5, hw + 0.2, stone)
    turn((nx, nz) => {
      clockFace(out, cx + nx * (hw + 0.2), 45.8, cz + nz * (hw + 0.2), nx, nz, 3.2, { dial: [0.95, 0.95, 0.93], rim: [0.18, 0.3, 0.62], marks: [0.16, 0.26, 0.6], hands: [0.12, 0.14, 0.2] })
    })
    // sculpted corner tops either side of each face
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      frustum(out, cx + sx * (hw - 0.3), cz + sz * (hw - 0.3), 41.2, 51.5, 0.75, 0.65, shade(stone, 1.03))
      prism(out, cx + sx * (hw - 0.3), cz + sz * (hw - 0.3), 51.5, 53, 0.8, 6, deep, FIXED, 0.2)
    }
    sq(50.5, 51.8, hw + 0.8, deep)
    // the attic with an oculus each side, then the dome, its lantern and finial
    sq(51.8, 55, hw - 0.4, stone)
    turn((nx, nz) => { box(out, cx + nx * (hw - 0.35), 53.4, cz + nz * (hw - 0.35), Math.abs(nz) * 0.7 + 0.04, 0.7, Math.abs(nx) * 0.7 + 0.04, glass, FIXED) })
    const dome = hex('#8d9aa6')
    for (let k = 0; k < 6; k++) {
      const a0 = (k / 6) * (Math.PI / 2), a1 = ((k + 1) / 6) * (Math.PI / 2)
      prism(out, cx, cz, 55 + Math.sin(a0) * 6.5, 55 + Math.sin(a1) * 6.5, (hw - 0.2) * Math.cos(a0) + 0.6, 12, dome, METAL, (hw - 0.2) * Math.cos(a1) + 0.6)
    }
    prism(out, cx, cz, 61.5, 64.2, 1.3, 8, stone, FIXED, 1.1)
    prism(out, cx, cz, 64.2, 65.4, 1.5, 8, dome, METAL, 0.3)
    prism(out, cx, cz, 65.4, 67, 0.1, 4, [0.2, 0.2, 0.2], FIXED, 0.04)
  }

  // ---- the Grande Halle: two gabled spans of iron and glass over the platforms
  const xs = LYON_SHED.sheds.flat().map(([x]) => x)
  const sa = Math.min(...xs), sb = Math.max(...xs), sm = (sa + sb) / 2
  trainShed(out, LYON_SHED, {
    spans: [
      { a: sa, b: sm, kind: 'gable', eaves: 20, rise: 10 },
      { a: sm, b: sb, kind: 'gable', eaves: 20, rise: 10 },
    ],
    roof: hex('#595242'),
    glass: [0.5, 0.57, 0.6],
    iron: [0.24, 0.26, 0.26],
    bay: 10,
    ends: { head: true, throat: true },
  })
}
