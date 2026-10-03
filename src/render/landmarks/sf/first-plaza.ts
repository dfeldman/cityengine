/**
 * 100 FIRST PLAZA (1988; 27 storeys, 136 m): Salesforce Park's postmodern neighbour at First and Mission.
 * From a Mapillary panorama at First and Mission (2026-10-02, docs/SALESFORCE-PARK.md) and the owner ("could use a lot
 * of work to look good"): PINKISH GRANITE with punched windows, cut top to bottom by deep GROOVES of dark blue glass —
 * down the middle of each face and at the corners — stepping back tier after tier near the top into a jagged ziggurat
 * crown (OSM's 19 m "spire" is the stepped top; there is no mast), the whole standing on a three-storey COLONNADE of tall square columns.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, type TowerSpec } from '../tower.ts'
import { boxAlong, edgeAt } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Rgb } from '../../models.ts'

const GRANITE: Rgb = [0.80, 0.70, 0.64]
const WINDOW: Rgb = [0.26, 0.32, 0.44]
const DARK_BLUE: Rgb = [0.16, 0.24, 0.40]
const H = 136

const punched = (solid: number) => ({ kind: 'punched' as const, wall: GRANITE, glass: WINDOW, pitch: 2.4, floor: 4.0, solid, material: 'granite' as const })

const spec: TowerSpec = {
  height: H,
  base: { height: 13, face: { kind: 'curtain', wall: GRANITE, glass: [0.30, 0.34, 0.40], pitch: 4.2, floor: 13, material: 'granite' } },
  tiers: [
    { to: 0.60, face: punched(0.55), cornice: { depth: 0.4, height: 0.5, colour: GRANITE } },
    { to: 0.70, inset: 2.4, face: punched(0.55) },
    { to: 0.78, inset: 2.4, face: punched(0.55) },
    { to: 0.85, inset: 2.4, face: punched(0.55) },
    { to: 0.92, inset: 2.4, face: punched(0.55) },
    { to: 1.0, inset: 2.4, face: { kind: 'curtain', wall: GRANITE, glass: DARK_BLUE, pitch: 1.6, floor: 4.0, material: 'glass' } },
  ],
  // no spire: the panorama shows the top stepping in, tier on tier, to a flat granite cap
  crown: { kind: 'stepped', steps: 3, height: 9, inset: 2.2, face: punched(0.6), material: 'granite' },
}

export function oneHundredFirstPlaza(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: H }, spec)
  const ring = towerRing(fit)
  const glass = surfaceTag('glass')
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 12) continue
    // the GROOVE down the middle of the face: a dark glass slot, standing just proud of the stone, from the colonnade to
    // the first setback — and at both ends of the face, the corner grooves
    for (const [t, w, top] of [[0.5, Math.min(7, e.L * 0.18), 0.6], [0.06, Math.min(3.5, e.L * 0.08), 0.6], [0.94, Math.min(3.5, e.L * 0.08), 0.6]] as const) {
      const cx = e.a.x + e.tx * e.L * t + e.nx * 0.12
      const cz = e.a.z + e.tz * e.L * t + e.nz * 0.12
      boxAlong(out, cx, (13 + H * top) / 2, cz, w / 2, (H * top - 13) / 2, 0.15, e.heading, DARK_BLUE, glass)
    }
  }
}

/**
 * THE PODIUM (way/91626348, the whole site, 3 levels): the colonnade the tower stands on, and the south-west wing's
 * roof garden (OSM's "Rooftop Park", leisure=park at layer 1, reached by steps from First Street). The tower is its own
 * entry (way/1410929341, the 136 m part) — fitting one model to both drew an L-shaped tower with broken setbacks.
 */
export function oneHundredFirstPodium(out: MeshBuilder, fit: Fit): void {
  const P = 13
  tower(out, { ...fit, height: P }, {
    height: P,
    tiers: [{ to: 1, face: { kind: 'curtain', wall: GRANITE, glass: [0.30, 0.34, 0.40], pitch: 4.2, floor: 6.5, material: 'granite' } }],
    crown: { kind: 'parapet', height: 1.1, colour: GRANITE, material: 'granite' },
  })
  const ring = towerRing(fit)
  const stone = surfaceTag('granite')
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 6) continue
    // the colonnade's tall square columns, standing proud of the glass
    const n = Math.max(2, Math.round(e.L / 6))
    for (let k = 0; k <= n; k++) {
      const t = k / n
      boxAlong(out, e.a.x + e.tx * e.L * t + e.nx * 0.5, P / 2, e.a.z + e.tz * e.L * t + e.nz * 0.5, 0.6, P / 2, 0.6, e.heading, [0.86, 0.80, 0.74], stone)
    }
  }
  // the roof garden: shrubs and flowers over the whole roof (what falls inside the tower is hidden by it); no trees,
  // which would come up through the tower's floors
  out.decks.push({ ring, y: P + 0.05, keepOff: 1.5, trees: false })
}
