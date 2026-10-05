/**
 * THE BANK OF CALIFORNIA, 400 California Street at Sansome (Bliss & Faville, 1908; way/260286446). Historic-landmark
 * census 2026-10-05 (it was a generic `chicago` box), from Commons "Bank of California - 400 California St (with
 * annex).jpg": a temple of grey granite. On the California Street front, SIX giant fluted Corinthian columns stand
 * between two massive corner piers; down Sansome, EIGHT more. Behind them, a recessed wall of tall dark windows; under
 * them, a granite step. Over everything, a deep entablature lettered THE BANK OF CALIFORNIA, with modillions under
 * its cornice, and a low attic. The north and west sides are party walls against the 1967 tower and its annex.
 *
 * The manifest gives `front: 180`, so the fit turns local −z south (California) and +x east (Sansome); the two street
 * faces are found by their outward normals.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { capPolygon } from '../../buildings.ts'
import { towerRing, insetRing, faceBand } from '../tower.ts'
import { boxAlong, colonnade, edgeAt, signText } from '../parts.ts'

const GRANITE: Rgb = [0.6, 0.6, 0.58]
const SHADE: Rgb = [0.52, 0.52, 0.5]
const DARK: Rgb = [0.13, 0.14, 0.16]
const ROOF: Rgb = [0.46, 0.46, 0.45]

export function bankOfCalifornia(out: MeshBuilder, fit: Fit): void {
  const G = Math.max(0, fit.grade ?? 0)
  const st = surfaceTag('granite')
  const ring = towerRing(fit)
  const COLS = 15, ENT = 2.6, H = G + 1.2 + COLS + ENT
  const RECESS = 2.6
  // the recessed wall behind the columns, with its tall windows, and the plain party walls
  const inner = insetRing(ring, RECESS)
  faceBand(out, inner, 0, G + 1.2 + COLS, { kind: 'punched', wall: SHADE, glass: DARK, pitch: 4.2, solid: 0.55, floor: COLS * 0.75, material: 'ashlar' })
  // the step all round the street faces, and the base under everything
  faceBand(out, ring, 0, G + 1.2, { kind: 'blank', wall: SHADE, material: 'ashlar' })
  capPolygon(out, ring.map((p) => ({ x: p.x, z: p.z })), G + 1.2, SHADE, st)
  // the entablature and the attic over the whole footprint
  faceBand(out, ring, G + 1.2 + COLS, H, { kind: 'blank', wall: GRANITE, material: 'ashlar' })
  faceBand(out, insetRing(ring, -0.5), H - 0.9, H - 0.2, { kind: 'blank', wall: SHADE, material: 'ashlar' })
  faceBand(out, insetRing(ring, 0.8), H, H + 1.8, { kind: 'blank', wall: GRANITE, material: 'ashlar' })
  capPolygon(out, insetRing(ring, 0.8).map((p) => ({ x: p.x, z: p.z })), H + 1.8, ROOF, surfaceTag('concrete'))

  // the street faces: the edge facing most south (−z) and the one facing most east (+x)
  const best = (dx: number, dz: number): number => {
    let k = 0, s = -Infinity
    for (let i = 0; i < ring.length; i++) {
      const e = edgeAt(ring, i)
      const d = (e.nx * dx + e.nz * dz) * Math.min(1, e.L / 15)
      if (d > s) { s = d; k = i }
    }
    return k
  }
  const PIER = 4.2
  for (const [i, n, label] of [[best(0, -1), 6, true], [best(1, 0), 8, false]] as const) {
    const e = edgeAt(ring, i)
    // the corner piers, full height to the entablature
    for (const s of [-1, 1]) {
      const u = s * (e.L / 2 - PIER / 2)
      boxAlong(out, e.mid.x + e.tx * u - e.nx * (RECESS / 2), G + 1.2 + COLS / 2, e.mid.z + e.tz * u - e.nz * (RECESS / 2), PIER / 2, COLS / 2, RECESS / 2, e.heading, GRANITE, st)
    }
    // the columns between them, standing on the ring line
    const a = { x: e.a.x + e.tx * PIER - e.nx * 1.3, z: e.a.z + e.tz * PIER - e.nz * 1.3 }
    const b = { x: e.b.x - e.tx * PIER - e.nx * 1.3, z: e.b.z - e.tz * PIER - e.nz * 1.3 }
    colonnade(out, a, b, G + 1.2, COLS - 0.2, n, { order: 'corinthian', colour: GRANITE, material: 'granite', radius: 0.78, out: 1.2, entablature: 0.01, flutes: true })
    // the doorway in the middle bay of the California front
    if (label) {
      boxAlong(out, e.mid.x - e.nx * (RECESS - 0.05), G + 1.2 + 3.4, e.mid.z - e.nz * (RECESS - 0.05), 1.7, 3.4, 0.08, e.heading, [0.3, 0.25, 0.18], 0)
      signText(out, 'THE BANK OF CALIFORNIA', e.mid.x + e.nx * 0.06, G + 1.2 + COLS + ENT * 0.55, e.mid.z + e.nz * 0.06, 0.62, [0.42, 0.41, 0.39], { heading: e.heading })
    }
  }
}

export const BANK_OF_CALIFORNIA: Record<string, (out: MeshBuilder, fit: Fit) => void> = { bankOfCalifornia }
