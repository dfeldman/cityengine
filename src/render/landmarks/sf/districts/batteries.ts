/**
 * Coastal artillery batteries at the Presidio: low reinforced-concrete emplacements dug into the bluff,
 * not buildings. Horizontal, massive, mostly below the skyline. The vocabulary is: concrete parapet wall
 * facing the sea, semicircular gun pits sunk into it, magazine and shelter rooms behind with plain
 * rectangular doorways and no windows, concrete stairs between levels, earth berm over the back.
 * Grey weathered concrete throughout. No roofs in the building sense, no windows, no facade.
 *
 * These are not generic — docs/PARKS.md E1 and BUGS.md #213 record that Battery Chamberlin and Battery
 * Yates were pulled from a recipe batch for being modelled as apartment blocks, which is exactly the failure
 * mode when no custom builder exists. Rebuilt 2026-09-24 to use proper pit structures, magazine doorways,
 * and stairs instead of concentric rings.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { boxAlong, edgeAt, longestEdge, gunPit, stair, stripRoof } from '../../parts.ts'
import { prism } from '../../../models.ts'
import { faceBand, towerRing } from '../../tower.ts'
import { capPolygon, capPolygonWithHoles } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

const CONCRETE: [number, number, number] = [0.65, 0.64, 0.61]
const CONCRETE_DARK: [number, number, number] = [0.48, 0.47, 0.44]
const CONCRETE_DARKER: [number, number, number] = [0.42, 0.41, 0.38]
const EARTH: [number, number, number] = [0.45, 0.42, 0.38]
const EARTH_DARK: [number, number, number] = [0.38, 0.35, 0.31]

type P2 = { x: number; z: number }

/**
 * Helper to define a point in the battery's local coordinate frame.
 * `u` = distance along the seaward edge (0 = left, L = right)
 * `v` = distance inland (negative = seaward, positive = inland) from the seaward edge's baseline
 * `y` = height
 */
function makeCoord(edge: ReturnType<typeof edgeAt>, u: number, v: number, y: number): [number, number, number] {
  return [
    edge.a.x + edge.tx * u - edge.nx * v,
    y,
    edge.a.z + edge.tz * u - edge.nz * v,
  ]
}

/**
 * Draw a magazine room doorway: a dark recessed opening in the wall with a concrete lintel above.
 */
function magazineDoor(out: MeshBuilder, cx: number, cz: number, width: number, height: number, depth: number,
                      heading: number, doorY: number): void {
  const doorTag = 0  // interior shadow
  const concreteTag = surfaceTag('concrete')

  // the doorway opening: dark recessed box
  boxAlong(out, cx, doorY + height / 2, cz, width, height / 2, depth, heading, [0.1, 0.1, 0.1], doorTag)

  // lintel block above the doorway
  boxAlong(out, cx, doorY + height + 0.1, cz, width + 0.2, 0.15, depth, heading, CONCRETE_DARK, concreteTag)
}

/**
 * A WWII-era (and later-buried) coastal battery as it is seen today in the Marin Headlands and on Angel Island
 * (batteries census, 2026-10-04: ten of them were 12 m walk-ups): an earth-covered concrete mass — a grassed mound
 * over the whole mapped footprint, low concrete walls at its foot — with along its longest side the concrete face of
 * the magazines, dark doorways in it, and on top the round concrete gun platforms open to the sky. Big mapped
 * footprints (Battery Wallace's is 104 × 156 m) are the whole emplacement, berm and all: drawn as one low hill.
 */
function earthworkBattery(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const GRASS: [number, number, number] = [0.25, 0.33, 0.19]
  const conc = surfaceTag('concrete')
  const rise = Math.min(6, Math.max(3, Math.min(fit.hx, fit.hz) * 0.18))
  faceBand(out, ring, -1, 1.6, { kind: 'blank', wall: CONCRETE_DARK, material: 'concrete' })
  stripRoof(out, ring, 1.6, rise, GRASS, 'concrete')
  const e = edgeAt(ring, longestEdge(ring))
  const face = Math.min(e.L * 0.7, 60)
  // the magazine face: a concrete wall standing out of the berm's long side, doorways along it
  const fx = e.mid.x - e.nx * 1.2, fz = e.mid.z - e.nz * 1.2
  boxAlong(out, fx, 2.6, fz, face / 2, 2.6, 1.2, e.heading, CONCRETE_DARK, conc)
  const doors = Math.max(2, Math.round(face / 12))
  for (let k = 0; k < doors; k++) {
    const u = -face / 2 + ((k + 0.5) * face) / doors
    boxAlong(out, fx + e.tx * u + e.nx * 1.22, 1.5, fz + e.tz * u + e.nz * 1.22, 1.3, 1.5, 0.04, e.heading, [0.08, 0.08, 0.08], 0)
  }
  // the gun platforms on top: one or two round concrete pads in a parapet ring
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= ring.length; cz /= ring.length
  const guns = e.L > 60 ? 2 : 1
  for (let g = 0; g < guns; g++) {
    const u = guns === 1 ? 0 : (g ? 1 : -1) * Math.min(e.L * 0.25, 30)
    const gx = cx + e.tx * u, gz = cz + e.tz * u
    const R = Math.min(7, Math.min(fit.hx, fit.hz) * 0.3)
    prism(out, gx, gz, 1.6 + rise - 0.6, 1.6 + rise + 0.6, R + 0.8, 20, CONCRETE, conc)
    prism(out, gx, gz, 1.6 + rise + 0.6, 1.6 + rise + 0.65, R, 20, CONCRETE_DARKER, conc)
  }
}

export const BATTERIES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  earthworkBattery,
  /**
   * Battery Chamberlin (1904) — one of the best-preserved coastal batteries at the Presidio.
   * One large gun pit (12-inch/disappearing gun), surrounded by a substantial concrete parapet.
   * Magazine rooms behind with doorways visible on the inner wall. Earth berm over the back.
   *
   * Strategy: Use the seaward edge as the coordinate frame origin. Build the parapet as a
   * thick monolithic box, add a proper gun pit structure with walls and lip, add magazine
   * block with doorways, and a slope berm.
   */
  batteryChamberlin: (out, fit) => {
    const ring = towerRing(fit)
    const seaward = edgeAt(ring, longestEdge(ring))

    const parapetHeight = 3.5
    const deckHeight = 0.3
    const magHeight = 2.8
    const bermHeight = 2.3
    const parapeDepth = 2.4  // thickness of parapet

    // ===== THE GUN PIT: SUNKEN CIRCULAR EMPLACEMENT IN THE PARAPET =====
    // Position the pit in the center of the parapet, sunk below the gun deck
    // Build it first so the parapet can be split around it
    const pitCx = seaward.a.x + seaward.tx * (seaward.L / 2) - seaward.nx * 0.7
    const pitCz = seaward.a.z + seaward.tz * (seaward.L / 2) - seaward.nz * 0.7
    const pitRx = 2.5
    gunPit(out, pitCx, pitCz, pitRx, 2.0, 0.0, 2.0, parapetHeight, CONCRETE, CONCRETE_DARK, CONCRETE_DARKER)

    // ===== THE SEAWARD PARAPET: TWO SEGMENTS SPLIT BY THE GUN PIT =====
    // Build the parapet as two boxes either side of the pit so the pit breaks visibly through the wall
    const parapeWidth = seaward.L
    const segmentWidth = (parapeWidth - pitRx * 2.8) / 2  // width of each parapet segment

    // left segment
    const leftX = seaward.a.x + seaward.tx * (segmentWidth / 2) - seaward.nx * (parapeDepth / 2)
    const leftZ = seaward.a.z + seaward.tz * (segmentWidth / 2) - seaward.nz * (parapeDepth / 2)
    boxAlong(out, leftX, parapetHeight / 2, leftZ, segmentWidth * 0.95, parapetHeight / 2, parapeDepth,
      seaward.heading, CONCRETE, surfaceTag('concrete'))

    // right segment
    const rightX = seaward.a.x + seaward.tx * (parapeWidth - segmentWidth / 2) - seaward.nx * (parapeDepth / 2)
    const rightZ = seaward.a.z + seaward.tz * (parapeWidth - segmentWidth / 2) - seaward.nz * (parapeDepth / 2)
    boxAlong(out, rightX, parapetHeight / 2, rightZ, segmentWidth * 0.95, parapetHeight / 2, parapeDepth,
      seaward.heading, CONCRETE, surfaceTag('concrete'))

    // ===== THE GUN DECK: FLAT PLATFORM BEHIND THE PARAPET =====
    const deckDepth = 4.5
    const deckX = seaward.a.x + seaward.tx * (seaward.L / 2) - seaward.nx * (parapeDepth + deckDepth / 2)
    const deckZ = seaward.a.z + seaward.tz * (seaward.L / 2) - seaward.nz * (parapeDepth + deckDepth / 2)
    capPolygon(
      out,
      [
        { x: seaward.a.x - seaward.nx * parapeDepth, z: seaward.a.z - seaward.nz * parapeDepth },
        { x: seaward.b.x - seaward.nx * parapeDepth, z: seaward.b.z - seaward.nz * parapeDepth },
        { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth) },
        { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth) },
      ],
      deckHeight,
      CONCRETE_DARK,
      0,
    )

    // ===== MAGAZINE BLOCK: REAR STRUCTURE WITH DOORWAYS =====
    const magDepth = 3.2
    const magX = seaward.a.x + seaward.tx * (seaward.L / 2) - seaward.nx * (parapeDepth + deckDepth + magDepth / 2)
    const magZ = seaward.a.z + seaward.tz * (seaward.L / 2) - seaward.nz * (parapeDepth + deckDepth + magDepth / 2)

    // mag block walls
    boxAlong(out, magX, (deckHeight + magHeight) / 2, magZ, seaward.L * 0.85, (magHeight - deckHeight) / 2, magDepth,
      seaward.heading, CONCRETE_DARKER, surfaceTag('concrete'))

    // mag block roof at magHeight
    capPolygon(
      out,
      [
        { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth) },
        { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth) },
        { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth + magDepth), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth + magDepth) },
        { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth + magDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth + magDepth) },
      ],
      magHeight,
      CONCRETE_DARK,
      0,
    )

    // magazine doorways and vents - front face
    for (let i = 1; i < 5; i++) {
      const u = (i / 5) * seaward.L
      const doorX = seaward.a.x + seaward.tx * u - seaward.nx * (parapeDepth + deckDepth + 0.15)
      const doorZ = seaward.a.z + seaward.tz * u - seaward.nz * (parapeDepth + deckDepth + 0.15)
      magazineDoor(out, doorX, doorZ, 0.8, 1.2, 0.3, seaward.heading, deckHeight)
    }

    // additional vents and access ports on rear of magazine block
    for (let i = 1; i < 4; i++) {
      const u = (i / 4) * seaward.L
      const rearX = seaward.a.x + seaward.tx * u - seaward.nx * (parapeDepth + deckDepth + magDepth - 0.1)
      const rearZ = seaward.a.z + seaward.tz * u - seaward.nz * (parapeDepth + deckDepth + magDepth - 0.1)
      magazineDoor(out, rearX, rearZ, 0.7, 0.9, 0.3, seaward.heading, deckHeight + 0.3)
    }

    // internal partition walls for ammunition storage areas
    for (let j = 1; j < 3; j++) {
      const partX = seaward.a.x + seaward.tx * (seaward.L / 3) - seaward.nx * (parapeDepth + deckDepth + magDepth * (j / 3))
      const partZ = seaward.a.z + seaward.tz * (seaward.L / 3) - seaward.nz * (parapeDepth + deckDepth + magDepth * (j / 3))
      boxAlong(out, partX, (deckHeight + magHeight) / 2, partZ, seaward.L * 0.7, (magHeight - deckHeight) / 2, 0.25,
        seaward.heading + Math.PI / 2, CONCRETE_DARKER, 0)
    }

    // ===== STAIRS: FROM GUN DECK TO MAGAZINE ROOF =====
    const stairStart: P2 = {
      x: seaward.a.x + seaward.tx * 0.3 * seaward.L - seaward.nx * (parapeDepth + 1.0),
      z: seaward.a.z + seaward.tz * 0.3 * seaward.L - seaward.nz * (parapeDepth + 1.0),
    }
    const stairEnd: P2 = {
      x: seaward.a.x + seaward.tx * 0.3 * seaward.L - seaward.nx * (parapeDepth + deckDepth + magDepth - 0.5),
      z: seaward.a.z + seaward.tz * 0.3 * seaward.L - seaward.nz * (parapeDepth + deckDepth + magDepth - 0.5),
    }
    stair(out, stairStart, stairEnd, deckHeight, magHeight, {
      material: 'concrete',
      colour: CONCRETE,
      riser: 0.18,
      railKind: 'solid',
    })

    // ===== AMMUNITION HOIST STRUCTURES =====
    for (let i = 0; i < 3; i++) {
      const hoistX = seaward.a.x + seaward.tx * ((i + 0.5) / 3) * seaward.L - seaward.nx * (parapeDepth + deckDepth + magDepth / 2)
      const hoistZ = seaward.a.z + seaward.tz * ((i + 0.5) / 3) * seaward.L - seaward.nz * (parapeDepth + deckDepth + magDepth / 2)
      // vertical shafts for ammunition hoists
      boxAlong(out, hoistX, (deckHeight + magHeight) / 2, hoistZ, 0.4, (magHeight - deckHeight) / 2, 0.4,
        seaward.heading, CONCRETE_DARKER, surfaceTag('concrete'))
    }

    // ===== STORAGE COMPARTMENTS =====
    for (let k = 0; k < 2; k++) {
      for (let i = 1; i < 5; i++) {
        const u = (i / 5) * seaward.L
        const compX = seaward.a.x + seaward.tx * u - seaward.nx * (parapeDepth + deckDepth + magDepth * 0.25 + k * 0.6)
        const compZ = seaward.a.z + seaward.tz * u - seaward.nz * (parapeDepth + deckDepth + magDepth * 0.25 + k * 0.6)
        boxAlong(out, compX, deckHeight + 0.3 + k * 0.5, compZ, 0.5, 0.3, 0.4,
          seaward.heading + Math.PI / 2, CONCRETE_DARKER, 0)
      }
    }

    // ===== SHELL STORAGE RACKS =====
    for (let i = 0; i < 5; i++) {
      const rackX = seaward.a.x + seaward.tx * ((i + 0.5) / 5) * seaward.L - seaward.nx * (parapeDepth + deckDepth + magDepth * 0.5)
      const rackZ = seaward.a.z + seaward.tz * ((i + 0.5) / 5) * seaward.L - seaward.nz * (parapeDepth + deckDepth + magDepth * 0.5)
      boxAlong(out, rackX, deckHeight + magHeight * 0.3, rackZ, 0.25, magHeight * 0.3, 0.35,
        seaward.heading + Math.PI / 2, [0.35, 0.35, 0.32], 0)
    }

    // ===== EARTH BERM: SLOPED COVER OVER THE MAGAZINE =====
    const bermMid = magHeight
    const bermEnd = 0  // ground level at the inland edge
    // ramp from magazine roof down to ground
    const bermFront: P2 = {
      x: seaward.a.x + seaward.tx * 0.5 * seaward.L - seaward.nx * (parapeDepth + deckDepth),
      z: seaward.a.z + seaward.tz * 0.5 * seaward.L - seaward.nz * (parapeDepth + deckDepth),
    }
    const bermBack: P2 = {
      x: seaward.a.x + seaward.tx * 0.5 * seaward.L - seaward.nx * (parapeDepth + deckDepth + magDepth + 1.5),
      z: seaward.a.z + seaward.tz * 0.5 * seaward.L - seaward.nz * (parapeDepth + deckDepth + magDepth + 1.5),
    }

    // berm slope quads (4-sided slope)
    const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

    // left side of berm
    const bermL0: P2 = { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth) }
    const bermL1: P2 = { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth + magDepth + 1.5), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth + magDepth + 1.5) }

    // slope normal calculation for realistic berm
    const dx = bermL1.x - bermL0.x
    const dz = bermL1.z - bermL0.z
    const slope = Math.hypot(dx, dz) || 1
    const slopeNx = -dz / slope
    const slopeNz = dx / slope

    out.quad(
      [[bermL0.x, bermMid, bermL0.z], [bermFront.x, bermMid, bermFront.z], [bermBack.x, bermEnd, bermBack.z], [bermL1.x, bermEnd, bermL1.z]],
      [slopeNx, 0.5, slopeNz],
      UV,
      EARTH,
      0,
    )

    // berm top cap
    capPolygon(out, [bermL0, bermFront, bermBack, bermL1], bermMid, EARTH_DARK, 0)
  },

  /**
   * Battery Crosby (1900) — smaller and lower than Chamberlin, with TWO gun pits.
   */
  batteryCrosby: (out, fit) => {
    const ring = towerRing(fit)
    const seaward = edgeAt(ring, longestEdge(ring))

    const parapetHeight = 3.0
    const deckHeight = 0.25
    const magHeight = 2.2
    const parapeDepth = 1.8

    // ===== TWO GUN PITS - BUILD FIRST SO PARAPET CAN SPLIT AROUND THEM =====
    const pitRx = 1.9
    for (let pit = 0; pit < 2; pit++) {
      const pitCx = seaward.a.x + seaward.tx * ((pit + 0.5) / 2) * seaward.L - seaward.nx * 0.6
      const pitCz = seaward.a.z + seaward.tz * ((pit + 0.5) / 2) * seaward.L - seaward.nz * 0.6
      gunPit(out, pitCx, pitCz, pitRx, 1.6, 0.0, 1.8, parapetHeight, CONCRETE, CONCRETE_DARK, CONCRETE_DARKER)
    }

    // ===== THE SEAWARD PARAPET - THREE SEGMENTS AROUND TWO PITS =====
    const parapeWidth = seaward.L
    const segment1Width = (parapeWidth * 0.35 - pitRx * 1.2) * 0.9
    const segment2Width = (parapeWidth * 0.30 - pitRx * 1.2) * 0.9
    const segment3Width = (parapeWidth * 0.35 - pitRx * 1.2) * 0.9

    // left segment
    const left1X = seaward.a.x + seaward.tx * (segment1Width / 2) - seaward.nx * (parapeDepth / 2)
    const left1Z = seaward.a.z + seaward.tz * (segment1Width / 2) - seaward.nz * (parapeDepth / 2)
    boxAlong(out, left1X, parapetHeight / 2, left1Z, segment1Width, parapetHeight / 2, parapeDepth,
      seaward.heading, CONCRETE, surfaceTag('concrete'))

    // middle segment
    const mid2X = seaward.a.x + seaward.tx * (parapeWidth / 2) - seaward.nx * (parapeDepth / 2)
    const mid2Z = seaward.a.z + seaward.tz * (parapeWidth / 2) - seaward.nz * (parapeDepth / 2)
    boxAlong(out, mid2X, parapetHeight / 2, mid2Z, segment2Width, parapetHeight / 2, parapeDepth,
      seaward.heading, CONCRETE, surfaceTag('concrete'))

    // right segment
    const right3X = seaward.a.x + seaward.tx * (parapeWidth - segment3Width / 2) - seaward.nx * (parapeDepth / 2)
    const right3Z = seaward.a.z + seaward.tz * (parapeWidth - segment3Width / 2) - seaward.nz * (parapeDepth / 2)
    boxAlong(out, right3X, parapetHeight / 2, right3Z, segment3Width, parapetHeight / 2, parapeDepth,
      seaward.heading, CONCRETE, surfaceTag('concrete'))

    // ===== THE GUN DECK =====
    const deckDepth = 3.5
    capPolygon(
      out,
      [
        { x: seaward.a.x - seaward.nx * parapeDepth, z: seaward.a.z - seaward.nz * parapeDepth },
        { x: seaward.b.x - seaward.nx * parapeDepth, z: seaward.b.z - seaward.nz * parapeDepth },
        { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth) },
        { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth) },
      ],
      deckHeight,
      CONCRETE_DARK,
      0,
    )

    // ===== MAGAZINE BLOCK =====
    const magDepth = 2.5
    boxAlong(out, seaward.a.x + seaward.tx * (seaward.L / 2) - seaward.nx * (parapeDepth + deckDepth + magDepth / 2),
      (deckHeight + magHeight) / 2,
      seaward.a.z + seaward.tz * (seaward.L / 2) - seaward.nz * (parapeDepth + deckDepth + magDepth / 2),
      seaward.L * 0.8, (magHeight - deckHeight) / 2, magDepth,
      seaward.heading, CONCRETE_DARKER, surfaceTag('concrete'))

    capPolygon(
      out,
      [
        { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth) },
        { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth) },
        { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth + magDepth), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth + magDepth) },
        { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth + magDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth + magDepth) },
      ],
      magHeight,
      CONCRETE_DARK,
      0,
    )

    // magazine doorways - front face
    for (let i = 1; i < 5; i++) {
      const u = (i / 5) * seaward.L
      const doorX = seaward.a.x + seaward.tx * u - seaward.nx * (parapeDepth + deckDepth + 0.15)
      const doorZ = seaward.a.z + seaward.tz * u - seaward.nz * (parapeDepth + deckDepth + 0.15)
      magazineDoor(out, doorX, doorZ, 0.75, 1.1, 0.3, seaward.heading, deckHeight)
    }

    // additional vents on rear
    for (let i = 1; i < 4; i++) {
      const u = (i / 4) * seaward.L
      const rearX = seaward.a.x + seaward.tx * u - seaward.nx * (parapeDepth + deckDepth + magDepth - 0.1)
      const rearZ = seaward.a.z + seaward.tz * u - seaward.nz * (parapeDepth + deckDepth + magDepth - 0.1)
      magazineDoor(out, rearX, rearZ, 0.65, 0.85, 0.3, seaward.heading, deckHeight + 0.2)
    }

    // internal partition
    const partX = seaward.a.x + seaward.tx * (seaward.L / 2) - seaward.nx * (parapeDepth + deckDepth + magDepth / 2)
    const partZ = seaward.a.z + seaward.tz * (seaward.L / 2) - seaward.nz * (parapeDepth + deckDepth + magDepth / 2)
    boxAlong(out, partX, (deckHeight + magHeight) / 2, partZ, seaward.L * 0.7, (magHeight - deckHeight) / 2, 0.2,
      seaward.heading + Math.PI / 2, CONCRETE_DARKER, 0)

    // ===== STAIRS =====
    stair(out,
      { x: seaward.a.x + seaward.tx * 0.25 * seaward.L - seaward.nx * (parapeDepth + 1.0), z: seaward.a.z + seaward.tz * 0.25 * seaward.L - seaward.nz * (parapeDepth + 1.0) },
      { x: seaward.a.x + seaward.tx * 0.25 * seaward.L - seaward.nx * (parapeDepth + deckDepth + magDepth - 0.5), z: seaward.a.z + seaward.tz * 0.25 * seaward.L - seaward.nz * (parapeDepth + deckDepth + magDepth - 0.5) },
      deckHeight, magHeight,
      { material: 'concrete', colour: CONCRETE, riser: 0.16, railKind: 'solid' },
    )

    // ===== AMMUNITION HOIST STRUCTURES =====
    for (let i = 0; i < 2; i++) {
      const hoistX = seaward.a.x + seaward.tx * ((i + 0.5) / 2) * seaward.L - seaward.nx * (parapeDepth + deckDepth + magDepth / 2)
      const hoistZ = seaward.a.z + seaward.tz * ((i + 0.5) / 2) * seaward.L - seaward.nz * (parapeDepth + deckDepth + magDepth / 2)
      boxAlong(out, hoistX, (deckHeight + magHeight) / 2, hoistZ, 0.35, (magHeight - deckHeight) / 2, 0.35,
        seaward.heading, CONCRETE_DARKER, surfaceTag('concrete'))
    }

    // ===== STORAGE AND SHELL RACKS =====
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 5; i++) {
        const u = (i / 5) * seaward.L
        const rackX = seaward.a.x + seaward.tx * u - seaward.nx * (parapeDepth + deckDepth + magDepth * 0.4 + k * 0.5)
        const rackZ = seaward.a.z + seaward.tz * u - seaward.nz * (parapeDepth + deckDepth + magDepth * 0.4 + k * 0.5)
        boxAlong(out, rackX, deckHeight + k * 0.6, rackZ, 0.2, 0.25, 0.3,
          seaward.heading + Math.PI / 2, [0.35, 0.35, 0.32], 0)
      }
    }

    // ===== EARTH BERM =====
    const bermL0: P2 = { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth) }
    const bermL1: P2 = { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth + magDepth + 1.2), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth + magDepth + 1.2) }
    const bermR0: P2 = { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth) }
    const bermR1: P2 = { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth + magDepth + 1.2), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth + magDepth + 1.2) }

    const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    out.quad([[bermL0.x, magHeight, bermL0.z], [bermR0.x, magHeight, bermR0.z], [bermR1.x, 0, bermR1.z], [bermL1.x, 0, bermL1.z]],
      [0, 0.6, 0], UV, EARTH, 0)
    capPolygon(out, [bermL0, bermR0, bermR1, bermL1], magHeight, EARTH_DARK, 0)
  },

  /**
   * Battery Godfrey (1896) — earliest battery, on central bluff, with THREE gun pits.
   */
  batteryGodfrey: (out, fit) => {
    const ring = towerRing(fit)
    const seaward = edgeAt(ring, longestEdge(ring))

    const parapetHeight = 3.2
    const deckHeight = 0.3
    const magHeight = 2.5
    const parapeDepth = 2.0

    // ===== THREE GUN PITS - BUILD FIRST =====
    const pitRx = 2.1
    for (let pit = 0; pit < 3; pit++) {
      const pitCx = seaward.a.x + seaward.tx * ((pit + 0.5) / 3) * seaward.L - seaward.nx * 0.65
      const pitCz = seaward.a.z + seaward.tz * ((pit + 0.5) / 3) * seaward.L - seaward.nz * 0.65
      gunPit(out, pitCx, pitCz, pitRx, 1.8, 0.0, 1.9, parapetHeight, CONCRETE, CONCRETE_DARK, CONCRETE_DARKER)
    }

    // ===== THE SEAWARD PARAPET - FOUR SEGMENTS AROUND THREE PITS =====
    const parapeWidth = seaward.L
    const segmentWidth = (parapeWidth - pitRx * 3.6) / 4

    for (let seg = 0; seg < 4; seg++) {
      const segX = seaward.a.x + seaward.tx * (segmentWidth * (seg + 0.5)) - seaward.nx * (parapeDepth / 2)
      const segZ = seaward.a.z + seaward.tz * (segmentWidth * (seg + 0.5)) - seaward.nz * (parapeDepth / 2)
      boxAlong(out, segX, parapetHeight / 2, segZ, segmentWidth * 0.95, parapetHeight / 2, parapeDepth,
        seaward.heading, CONCRETE, surfaceTag('concrete'))
    }

    // ===== THE GUN DECK =====
    const deckDepth = 3.8
    capPolygon(
      out,
      [
        { x: seaward.a.x - seaward.nx * parapeDepth, z: seaward.a.z - seaward.nz * parapeDepth },
        { x: seaward.b.x - seaward.nx * parapeDepth, z: seaward.b.z - seaward.nz * parapeDepth },
        { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth) },
        { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth) },
      ],
      deckHeight,
      CONCRETE_DARK,
      0,
    )

    // ===== MAGAZINE BLOCK =====
    const magDepth = 2.8
    boxAlong(out, seaward.a.x + seaward.tx * (seaward.L / 2) - seaward.nx * (parapeDepth + deckDepth + magDepth / 2),
      (deckHeight + magHeight) / 2,
      seaward.a.z + seaward.tz * (seaward.L / 2) - seaward.nz * (parapeDepth + deckDepth + magDepth / 2),
      seaward.L * 0.85, (magHeight - deckHeight) / 2, magDepth,
      seaward.heading, CONCRETE_DARKER, surfaceTag('concrete'))

    capPolygon(
      out,
      [
        { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth) },
        { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth) },
        { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth + magDepth), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth + magDepth) },
        { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth + magDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth + magDepth) },
      ],
      magHeight,
      CONCRETE_DARK,
      0,
    )

    // magazine doorways - front face
    for (let i = 1; i < 6; i++) {
      const u = (i / 6) * seaward.L
      const doorX = seaward.a.x + seaward.tx * u - seaward.nx * (parapeDepth + deckDepth + 0.15)
      const doorZ = seaward.a.z + seaward.tz * u - seaward.nz * (parapeDepth + deckDepth + 0.15)
      magazineDoor(out, doorX, doorZ, 0.8, 1.15, 0.3, seaward.heading, deckHeight)
    }

    // additional vents and passages on rear and sides
    for (let i = 1; i < 5; i++) {
      const u = (i / 5) * seaward.L
      const rearX = seaward.a.x + seaward.tx * u - seaward.nx * (parapeDepth + deckDepth + magDepth - 0.1)
      const rearZ = seaward.a.z + seaward.tz * u - seaward.nz * (parapeDepth + deckDepth + magDepth - 0.1)
      magazineDoor(out, rearX, rearZ, 0.7, 0.95, 0.3, seaward.heading, deckHeight + 0.4)
    }

    // internal partition walls
    for (let j = 1; j < 3; j++) {
      const partX = seaward.a.x + seaward.tx * (seaward.L / 3) - seaward.nx * (parapeDepth + deckDepth + magDepth * (j / 3))
      const partZ = seaward.a.z + seaward.tz * (seaward.L / 3) - seaward.nz * (parapeDepth + deckDepth + magDepth * (j / 3))
      boxAlong(out, partX, (deckHeight + magHeight) / 2, partZ, seaward.L * 0.75, (magHeight - deckHeight) / 2, 0.22,
        seaward.heading + Math.PI / 2, CONCRETE_DARKER, 0)
    }

    // ===== STAIRS =====
    stair(out,
      { x: seaward.a.x + seaward.tx * 0.3 * seaward.L - seaward.nx * (parapeDepth + 1.2), z: seaward.a.z + seaward.tz * 0.3 * seaward.L - seaward.nz * (parapeDepth + 1.2) },
      { x: seaward.a.x + seaward.tx * 0.3 * seaward.L - seaward.nx * (parapeDepth + deckDepth + magDepth - 0.5), z: seaward.a.z + seaward.tz * 0.3 * seaward.L - seaward.nz * (parapeDepth + deckDepth + magDepth - 0.5) },
      deckHeight, magHeight,
      { material: 'concrete', colour: CONCRETE, riser: 0.17, railKind: 'solid' },
    )

    // ===== AMMUNITION HOIST STRUCTURES - 4 SHAFTS =====
    for (let i = 0; i < 4; i++) {
      const hoistX = seaward.a.x + seaward.tx * ((i + 0.5) / 4) * seaward.L - seaward.nx * (parapeDepth + deckDepth + magDepth / 2)
      const hoistZ = seaward.a.z + seaward.tz * ((i + 0.5) / 4) * seaward.L - seaward.nz * (parapeDepth + deckDepth + magDepth / 2)
      boxAlong(out, hoistX, (deckHeight + magHeight) / 2, hoistZ, 0.42, (magHeight - deckHeight) / 2, 0.42,
        seaward.heading, CONCRETE_DARKER, surfaceTag('concrete'))
    }

    // ===== ADDITIONAL STORAGE COMPARTMENTS =====
    for (let k = 0; k < 3; k++) {
      for (let i = 1; i < 5; i++) {
        const u = (i / 5) * seaward.L
        const compX = seaward.a.x + seaward.tx * u - seaward.nx * (parapeDepth + deckDepth + magDepth * 0.2 + k * 0.7)
        const compZ = seaward.a.z + seaward.tz * u - seaward.nz * (parapeDepth + deckDepth + magDepth * 0.2 + k * 0.7)
        boxAlong(out, compX, deckHeight + 0.4 + k * 0.5, compZ, 0.55, 0.3, 0.45,
          seaward.heading + Math.PI / 2, CONCRETE_DARKER, 0)
      }
    }

    // ===== MUNITION RACKS AND SHELLS STORAGE =====
    for (let i = 0; i < 6; i++) {
      const rackX = seaward.a.x + seaward.tx * ((i + 0.5) / 6) * seaward.L - seaward.nx * (parapeDepth + deckDepth + magDepth * 0.6)
      const rackZ = seaward.a.z + seaward.tz * ((i + 0.5) / 6) * seaward.L - seaward.nz * (parapeDepth + deckDepth + magDepth * 0.6)
      boxAlong(out, rackX, deckHeight + magHeight * 0.4, rackZ, 0.3, magHeight * 0.35, 0.4,
        seaward.heading + Math.PI / 2, [0.35, 0.35, 0.32], 0)
    }

    // ===== DEFENSIVE COUNTER-WALLS ON FLANKS =====
    // Side defensive structures to protect the magazine from flanking fire
    for (const side of [-1, 1]) {
      const edgeX = (side < 0 ? seaward.a.x : seaward.b.x) + seaward.nx * 0.5
      const edgeZ = (side < 0 ? seaward.a.z : seaward.b.z) + seaward.nz * 0.5
      const flankX = edgeX - seaward.nx * (parapeDepth + deckDepth + magDepth / 2)
      const flankZ = edgeZ - seaward.nz * (parapeDepth + deckDepth + magDepth / 2)
      boxAlong(out, flankX, (deckHeight + magHeight) / 2, flankZ, 0.5, (magHeight - deckHeight) / 2, magDepth,
        seaward.heading + Math.PI / 2, CONCRETE_DARKER, surfaceTag('concrete'))
    }

    // ===== MORE SHELL STORAGE RACKS =====
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < 8; i++) {
        const u = (i / 8) * seaward.L
        const shellX = seaward.a.x + seaward.tx * u - seaward.nx * (parapeDepth + deckDepth + magDepth * 0.8 + k * 0.6)
        const shellZ = seaward.a.z + seaward.tz * u - seaward.nz * (parapeDepth + deckDepth + magDepth * 0.8 + k * 0.6)
        boxAlong(out, shellX, deckHeight + k * 0.7, shellZ, 0.25, 0.25, 0.35,
          seaward.heading, [0.40, 0.40, 0.37], 0)
      }
    }

    // ===== EARTH BERM =====
    const bermL0: P2 = { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth) }
    const bermL1: P2 = { x: seaward.a.x - seaward.nx * (parapeDepth + deckDepth + magDepth + 1.4), z: seaward.a.z - seaward.nz * (parapeDepth + deckDepth + magDepth + 1.4) }
    const bermR0: P2 = { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth) }
    const bermR1: P2 = { x: seaward.b.x - seaward.nx * (parapeDepth + deckDepth + magDepth + 1.4), z: seaward.b.z - seaward.nz * (parapeDepth + deckDepth + magDepth + 1.4) }

    const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    out.quad([[bermL0.x, magHeight, bermL0.z], [bermR0.x, magHeight, bermR0.z], [bermR1.x, 0, bermR1.z], [bermL1.x, 0, bermL1.z]],
      [0, 0.65, 0], UV, EARTH, 0)
    capPolygon(out, [bermL0, bermR0, bermR1, bermL1], magHeight, EARTH_DARK, 0)
  },
}

/**
 * Batteries Boutelle and Cranston (OSM ways 420287677, 420287682), on the bluff by Battery Godfrey: the same
 * Endicott-period emplacements, drawn by the same builders under their own names (one name per entry). 2026-10-04,
 * when the batteries were first placed: batteries.json had been empty, and every one stood as a 12 m barracks.
 */
BATTERIES.batteryBoutelle = BATTERIES.batteryCrosby
BATTERIES.batteryCranston = BATTERIES.batteryGodfrey

