/**
 * THE CALIFORNIA PALACE OF THE LEGION OF HONOR (George Applegarth, 1924; relation/21115818): a three-quarter copy
 * of the Palais de la Légion d'Honneur in Paris, white on the cliff in Lincoln Park.
 *
 * Rebuilt 2026-10-06 from the owner's photographs and aerial ("it's definitely the right shape but looks very
 * different … turned the wrong direction … the whole thing is a square of colonnades"). It is a SQUARE OF COLONNADES
 * round the Court of Honor, entered from the north-east, facing the round fountain across Legion of Honor Drive:
 *
 *  - THE FRONT: a DOUBLE row of Ionic columns under an entablature and a balustrade, with the TRIUMPHAL ARCH in the
 *    middle (a tall pier block, its round-headed opening, an attic over it), and at each end a plain PAVILION of the
 *    wings — a blind round-arched niche and a tall narrow one, a relief panel high up, a deep cornice;
 *  - THE COURT: paved, a single Ionic colonnade down each side in front of the wings, and across the back the
 *    museum's HEXASTYLE CORINTHIAN PORTICO under an entablature lettered HONNEUR ET PATRIE and a plain attic, the
 *    colonnade carrying on either side of it; seen from outside through the arch;
 *  - BEHIND: the galleries, a long block with a skylit roof, and the low dome over the rotunda;
 *  - the paved walk from the arch towards the fountain, white railings either side.
 *
 * OSM's outline is 60 m along the entrance front and 94 m deep: model x along the front, +z the entrance side.
 * (Placed by parks.json at `rotateDeg` 49, which turns +z to the north-east. It was 139, the court opening to the
 * south-east with the fountain at its side, and 94 m wide by 60 deep.)
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { boxAlong, colonnade, cupola } from '../parts.ts'
import { sign } from '../signage.ts'

const STONE: Rgb = [0.88, 0.86, 0.80]
const SHADE: Rgb = [0.74, 0.72, 0.67]
const ROOF: Rgb = [0.6, 0.6, 0.58]
const PAVING: Rgb = [0.74, 0.72, 0.66]
const DARK: Rgb = [0.3, 0.3, 0.3]
const SKYLIGHT: Rgb = [0.55, 0.68, 0.64]

export function legionOfHonor(out: MeshBuilder, _fit: Fit): void {
  // (smooth: the real stone is pale, fine-jointed limestone, and the ashlar page read as grey blocks)
  const stone = surfaceTag('stucco')
  const W = 30          // half the front
  const D = 47          // half the depth
  const wing = 11       // the side wings' width
  const cx = W - wing   // the court's half-width, wall to wall (19 m)
  const zF = D - 1      // the front colonnade's outer row
  const zP = -6         // the museum's court face, where the portico stands
  const H = 14          // the wings' cornice
  const CH = 9.5        // the colonnades' columns

  // THE COURT, paved (and handed to the city as paved ground, draped: the park's slope rose through a slab, 2026-10-04)
  box(out, 0, 0.12, (zF + zP) / 2, cx, 0.12, (zF - zP) / 2, PAVING, surfaceTag('concrete'))
  out.grounds.push([{ x: -cx, z: zP }, { x: cx, z: zP }, { x: cx, z: zF }, { x: -cx, z: zF }])
  // The Thinker's plinth (the statue is for the GLB pipeline, owner 2026-10-06)
  box(out, 0, 1.0, zF - 9, 1.3, 1.0, 1.3, STONE, stone)

  // THE WINGS down both sides of the court, from the museum to the front pavilions, under low hipped roofs
  for (const s of [-1, 1]) {
    const x = s * (cx + wing / 2)
    box(out, x, H / 2, (zP + D) / 2, wing / 2, H / 2, (D - zP) / 2, STONE, stone)
    box(out, x, H + 0.5, (zP + D) / 2, wing / 2 + 0.45, 0.5, (D - zP) / 2 + 0.45, SHADE, stone)        // the cornice
    for (let k = 0; k < 4; k++) box(out, x, H + 1.2 + k * 0.6, (zP + D) / 2, wing / 2 - 1 - k * 1.1, 0.3, (D - zP) / 2 - 1 - k * 0.6, ROOF, surfaceTag('concrete'))
    // the pavilion's front: a plinth course, a blind round-arched niche and a tall narrow one, a relief panel up high
    const zf = D + 0.02
    box(out, x, 0.6, zf, wing / 2, 0.6, 0.05, SHADE, stone)
    const nx = x - s * 1.5
    box(out, nx, 3.6, zf + 0.01, 1.6, 2.6, 0.03, SHADE, stone)
    for (let k = 0; k < 5; k++) { const t = (k + 0.5) / 5; box(out, nx, 6.2 + t * 1.6, zf + 0.01, 1.6 * Math.sqrt(1 - t * t), 0.16, 0.03, SHADE, stone) }
    box(out, x + s * 3, 4.2, zf + 0.01, 0.7, 3.2, 0.03, SHADE, stone)
    box(out, x, 10.6, zf + 0.01, wing / 2 - 1, 1.2, 0.03, [0.82, 0.8, 0.74], stone)
    box(out, x, 8.9, zf + 0.06, wing / 2 + 0.1, 0.18, 0.08, SHADE, stone)                               // a string course
    // the court colonnade in front of the wing, its roof a flat deck back to the wall
    const cxIn = s * (cx - 3.2)
    colonnade(out, { x: cxIn, z: zP + 3 }, { x: cxIn, z: zF - 6 }, 0.25, CH, 14, { order: 'ionic', colour: STONE, entablature: 1.3, radius: 0.42, out: 0 })
    box(out, s * (cx - 1.6), CH + 1.55, (zP + zF - 3) / 2, 1.6, 0.18, (zF - zP - 9) / 2, STONE, stone)
    box(out, s * (cx - 0.05), CH / 2, (zP + zF) / 2, 0.05, CH / 2, (zF - zP) / 2, [0.8, 0.78, 0.72], stone)   // the wall behind it
    // the outside walls, plain with tall windows dark between pilasters (seen from the drives)
    for (let k = 0; k < 9; k++) {
      const z = zP + 4 + k * ((D - zP - 8) / 8)
      box(out, s * (W + 0.02), 6.5, z, 0.03, 2.4, 0.9, DARK, surfaceTag('glass'))
    }
  }

  // THE FRONT: the double colonnade between the pavilions, an entablature and a balustrade over both rows
  for (const s of [-1, 1]) {
    for (const z of [zF, zF - 3.4]) colonnade(out, { x: s * 6.2, z }, { x: s * (cx - 0.6), z }, 0.25, CH, 6, { order: 'ionic', colour: STONE, entablature: 1.3, radius: 0.42, out: 0 })
    box(out, s * (cx + 6.2) / 2, CH + 1.55, zF - 1.7, (cx - 6.2) / 2, 0.18, 2.2, STONE, stone)       // the deck over the walk
    // the balustrade: a rail on balusters
    box(out, s * (cx + 6.2) / 2, CH + 2.95, zF + 0.1, (cx - 6.2) / 2, 0.14, 0.3, STONE, stone)
    for (let k = 0; k < 16; k++) box(out, s * (6.6 + k * ((cx - 7.2) / 15)), CH + 2.25, zF + 0.1, 0.12, 0.55, 0.12, STONE, stone)
    box(out, s * (cx + 6.2) / 2, CH + 1.8, zF + 0.1, (cx - 6.2) / 2, 0.12, 0.3, STONE, stone)
  }
  // THE ARCH: two piers through both rows, the round-headed opening, the spandrels, the attic, the cornice
  const AW = 3.6, AH = 9.6                     // the opening's half-width, and its springing
  for (const s of [-1, 1]) box(out, s * (AW + 1.3), 8.5, zF - 1.7, 1.3, 8.5, 2.6, STONE, stone)
  for (let k = 0; k < 9; k++) {
    // the arch's head, as courses closing in to the crown: a spandrel either side of each
    const t = (k + 0.5) / 9, half = AW * Math.sqrt(1 - t * t), w = AW - half
    for (const s of [-1, 1]) box(out, s * (AW - w / 2), AH + t * AW, zF - 1.7, w / 2, AW / 18, 2.6, STONE, stone)
  }
  box(out, 0, AH + AW + (17 - AH - AW) / 2, zF - 1.7, AW + 2.6, (17 - AH - AW) / 2, 2.6, STONE, stone)
  box(out, 0, 17.3, zF - 1.7, AW + 3.0, 0.3, 2.9, SHADE, stone)
  box(out, 0, 18.4, zF - 1.7, AW + 2.6, 0.8, 2.5, STONE, stone)
  box(out, 0, 0.12, zF + 4, 4.5, 0.12, 4, PAVING, surfaceTag('concrete'))

  // THE PORTICO across the back of the court: six Corinthian columns, the lettered entablature, the attic
  const PH = 12.5
  colonnade(out, { x: -8.5, z: zP + 4 }, { x: 8.5, z: zP + 4 }, 0.9, PH, 6, { order: 'corinthian', colour: STONE, entablature: 2.2, radius: 0.62, out: 0 })
  box(out, 0, 0.45, zP + 2.5, 10.5, 0.45, 3.2, STONE, stone)                                              // its steps
  box(out, 0, PH + 2.0, zP + 2, 10.2, 1.2, 2.3, STONE, stone)                                           // the entablature
  box(out, 0, PH + 3.4, zP + 2.1, 10.6, 0.25, 2.5, SHADE, stone)                                        // its cornice
  box(out, 0, PH + 5.2, zP + 1.6, 9.6, 1.6, 2.0, STONE, stone)                                          // the attic
  sign(out, { type: 'flat', text: 'HONNEUR ET PATRIE', h: 0.55, face: 'engraved', colour: [0.25, 0.24, 0.22], tracking: 0.2, lit: 'none' }, { x: 0, y: PH + 1.9, z: zP + 4.32, heading: 0 })
  // the doorway and a relief panel in the wall behind the columns
  box(out, 0, 3.2, zP + 0.04, 2.0, 3.2, 0.04, DARK, 0)
  box(out, 0, 9, zP + 0.04, 7, 1.2, 0.04, [0.8, 0.78, 0.72], stone)
  // the colonnade carrying on either side of the portico along the museum's court face
  for (const s of [-1, 1]) colonnade(out, { x: s * 11.5, z: zP + 3 }, { x: s * (cx - 3.2), z: zP + 3 }, 0.25, CH, 3, { order: 'ionic', colour: STONE, entablature: 1.3, radius: 0.42, out: 0 })

  // THE MUSEUM behind: the gallery block, its roof with a long skylight down the middle, the low dome over the rotunda
  const zm = (-D + zP) / 2, hd = (zP + D) / 2
  box(out, 0, (H + 1) / 2, zm, W, (H + 1) / 2, hd, STONE, stone)
  box(out, 0, H + 1.4, zm, W + 0.4, 0.4, hd + 0.4, SHADE, stone)
  box(out, 0, H + 2.0, zm, W - 1.5, 0.2, hd - 1.5, ROOF, surfaceTag('concrete'))
  for (const x of [-12, 12]) box(out, x, H + 2.6, zm, 3, 0.5, hd - 4, SKYLIGHT, surfaceTag('glass'))
  cupola(out, { x: 0, z: zm - 4 }, H + 2, 7, { drum: 2.5, dome: 5, colour: STONE, domeColour: [0.62, 0.7, 0.66], domeMaterial: 'copper', lantern: true })

  // the walk out of the arch towards the fountain, between white railings
  out.grounds.push([{ x: -4, z: D }, { x: 4, z: D }, { x: 4, z: D + 26 }, { x: -4, z: D + 26 }])
  for (const s of [-1, 1]) {
    box(out, s * 4.2, 1.0, D + 13, 0.03, 0.03, 13, [0.94, 0.94, 0.92], surfaceTag('metal'))
    for (let k = 0; k <= 10; k++) box(out, s * 4.2, 0.5, D + k * 2.6, 0.025, 0.5, 0.025, [0.94, 0.94, 0.92], surfaceTag('metal'))
  }
}

/**
 * The GLASS PYRAMID skylight in the Court of Honor (way/393275341, `tourism=artwork`, over the galleries dug under the
 * court in 1995): OSM's little glass building was drawn as a Victorian cottage with a hipped roof. A low glass pyramid
 * on a stone curb, its ridges in dark metal.
 */
export function legionPyramid(out: MeshBuilder, fit: Fit): void {
  const h = Math.max(2.4, Math.min(fit.hx, fit.hz)), y0 = 0.5, y1 = y0 + h * 0.75
  box(out, 0, 0.25, 0, h + 0.3, 0.25, h + 0.3, STONE, surfaceTag('ashlar'))
  const k: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  for (let i = 0; i < 4; i++) {
    const [ax, az] = k[i], [bx, bz] = k[(i + 1) % 4]
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, L = Math.hypot(mx, 0.75, mz)
    out.quad([[ax * h, y0, az * h], [bx * h, y0, bz * h], [0, y1, 0], [0, y1, 0]], [mx / L, 0.75 / L, mz / L], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], [0.55, 0.68, 0.72], surfaceTag('glass'))
  }
}

/**
 * THE LEGION OF HONOR'S FOUNTAIN (node/4023038695; owner, 2026-10-06: "I'm looking at the legion of honor fountain in
 * particular … just the water with a spray coming out"), in the round at the head of the walk, on the arch's axis.
 * A round pool in a low stone rim, a stone drum in the middle carrying a shallow bowl, and the WATER (render/water.ts):
 * a tall jet out of the bowl falling back into it and over its lip, a ring of arching jets from the rim to the middle,
 * white water where they land. No sculpture (statues are for the GLB pipeline).
 */
export function legionFountain(out: MeshBuilder, fit: Fit): void {
  const stone = surfaceTag('ashlar')
  const R = Math.max(5, Math.min(fit.hx, fit.hz) - 0.3)
  // built from y = 0, then stood on the HIGHEST ground round the rim: the model's base is the lowest, and on the
  // circle's slope the lawn rose over the pool's far side
  const v0 = out.positions.length, w0 = out.water.length
  const g = fit.groundAt
  let lift = 0
  if (g) for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; lift = Math.max(lift, g(Math.sin(a) * (R + 0.6), Math.cos(a) * (R + 0.6)), g(0, 0)) }
  const WATER_Y = 0.42
  // the rim: a ring of stone, a coping on it
  const N = 40
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * Math.PI * 2, a1 = ((k + 1) / N) * Math.PI * 2
    const am = (a0 + a1) / 2, L = 2 * (R + 0.35) * Math.sin(Math.PI / N)
    boxAlong(out, Math.sin(am) * (R + 0.3), 0.3, Math.cos(am) * (R + 0.3), L / 2 + 0.02, 0.3, 0.3, am, STONE, stone)
    void a0; void a1
  }
  // the drum and its bowl in the middle
  cupolaLessDrum(out, 1.3, 0.75, stone)
  const pool: { x: number; z: number }[] = []
  for (let k = 0; k < N; k++) { const a = (k / N) * Math.PI * 2; pool.push({ x: Math.sin(a) * R, z: Math.cos(a) * R }) }
  out.water.push({ kind: 'pool', ring: pool, y: WATER_Y, colour: [0.2, 0.36, 0.4] })
  // the bowl's own water, overflowing in a sheet all round its lip
  const bowl: { x: number; z: number }[] = []
  for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; bowl.push({ x: Math.sin(a) * 1.75, z: Math.cos(a) * 1.75 }) }
  out.water.push({ kind: 'pool', ring: bowl, y: 1.22, colour: [0.22, 0.38, 0.42] })
  for (let k = 0; k < 12; k++) {
    const a0 = (k / 12) * Math.PI * 2, a1 = ((k + 1) / 12) * Math.PI * 2
    out.water.push({ kind: 'sheet', a: [Math.sin(a1) * 1.85, 1.24, Math.cos(a1) * 1.85], b: [Math.sin(a0) * 1.85, 1.24, Math.cos(a0) * 1.85], out: 0.5, drop: 1.24 - WATER_Y })
  }
  // the tall jet out of the middle, falling back on itself
  out.water.push({ kind: 'jet', at: [0, 1.3, 0], v: [0, 8.5, 0], width: 0.09, spread: 0.55 })
  out.water.push({ kind: 'jet', at: [0, 1.3, 0], v: [0.25, 7.6, 0.15], width: 0.06, spread: 0.4 })
  // the ring of arching jets from the rim toward the drum, and where they land
  const J = 12
  for (let k = 0; k < J; k++) {
    const a = (k / J) * Math.PI * 2
    const sx = Math.sin(a), sz = Math.cos(a)
    const r0 = R - 0.2
    out.water.push({ kind: 'jet', at: [sx * r0, 0.45, sz * r0], v: [-sx * 2.6, 4.6, -sz * 2.6], width: 0.035, spread: 0.18 })
    // (flight to the pool: t = (4.6 + sqrt(4.6² + 2g·0.13)) / g ≈ 0.96 s, 2.5 m in)
    out.water.push({ kind: 'splash', at: [sx * (r0 - 2.5), WATER_Y + 0.01, sz * (r0 - 2.5)], r: 0.55 })
  }
  out.water.push({ kind: 'splash', at: [0, WATER_Y + 0.01, 0], r: 2.6 })
  if (lift > 0.01) {
    for (let i = v0; i < out.positions.length; i += 3) out.positions[i + 1] += lift
    // the rim's foot carried down to the lowest ground
    for (let k = 0; k < N; k++) {
      const am = ((k + 0.5) / N) * Math.PI * 2, L = 2 * (R + 0.35) * Math.sin(Math.PI / N)
      boxAlong(out, Math.sin(am) * (R + 0.3), lift / 2 - 0.1, Math.cos(am) * (R + 0.3), L / 2 + 0.02, lift / 2 + 0.1, 0.3, am, STONE, stone)
    }
    for (let i = w0; i < out.water.length; i++) {
      const f = out.water[i]
      if (f.kind === 'pool') f.y += lift
      else if (f.kind === 'jet' || f.kind === 'splash') f.at[1] += lift
      else { f.a[1] += lift; f.b[1] += lift }
    }
    // the pool's floor, so the lawn under it does not show through the water
    box(out, 0, lift + 0.05, 0, R * 0.72, 0.05, R * 0.72, [0.16, 0.24, 0.26], 0)
  }
}

/** the fountain's middle: a stone drum and a shallow bowl on it */
function cupolaLessDrum(out: MeshBuilder, r: number, h: number, tag: number): void {
  const N = 20
  for (let k = 0; k < N; k++) {
    const a = ((k + 0.5) / N) * Math.PI * 2, L = 2 * r * Math.sin(Math.PI / N)
    boxAlong(out, Math.sin(a) * r * 0.97, h / 2, Math.cos(a) * r * 0.97, L / 2 + 0.02, h / 2, 0.12, a, STONE, tag)
  }
  box(out, 0, h / 2, 0, r * 0.7, h / 2, r * 0.7, STONE, tag)
  // the bowl: a wider shallow disc and its lip
  for (let k = 0; k < N; k++) {
    const a = ((k + 0.5) / N) * Math.PI * 2, L = 2 * 1.85 * Math.sin(Math.PI / N)
    boxAlong(out, Math.sin(a) * 1.8, h + 0.25, Math.cos(a) * 1.8, L / 2 + 0.03, 0.25, 0.1, a, SHADE, tag)
  }
  box(out, 0, h + 0.05, 0, 1.3, 0.05, 1.3, SHADE, tag)
}
