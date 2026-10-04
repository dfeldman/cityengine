/**
 * THE MASONIC (1958, Albert Roller; the California Masonic Memorial Temple), way/32947040 at 1111 California on Nob
 * Hill — "rule 7: tall building" had dressed it as a Chicago office block. A Mapillary frame on California is all
 * white veined Vermont marble; the descriptions (Wikipedia, artandarchitecture-sf): a stripped-classical windowless
 * marble box, the glazed lobby along the California front behind twin 23-ft marble columns topped with celestial and
 * terrestrial globes, and at the EAST end of that wall Emile Norman's sculpture — four 12-ft figures beside a frieze
 * of fourteen smaller ones, a dedicatory inscription under them. Front 0: California Street is north.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing } from '../tower.ts'
import { boxAlong, edgeAt, edgeFacing } from '../parts.ts'
import { prism } from '../../models.ts'

const MARBLE: Rgb = [0.9, 0.9, 0.88]
const SHADE: Rgb = [0.8, 0.8, 0.78]
const GLASS: Rgb = [0.16, 0.19, 0.22]
const BRONZE: Rgb = [0.42, 0.34, 0.22]

export function masonicTemple(out: MeshBuilder, fit: Fit): void {
  // the California front is at the hill's crest and the block falls 19 m to Pine: everything on the front stands on
  // the street (fit.grade), and the box rises 24 m above it
  const G = Math.max(0, fit.grade ?? 0)
  const H = G + 24
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'blank', wall: MARBLE, material: 'ashlar' }, cornice: { depth: 0.5, height: 1.2, colour: MARBLE } }],
    roof: [0.5, 0.5, 0.5],
    crown: { kind: 'flat' },
  })
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring))
  const st = surfaceTag('ashlar')
  // u along the front, east positive: with front 0 the loader turns the model half round, so local +x is WEST
  const east = e.tx >= 0 ? -1 : 1
  const on = (u: number, y0: number, o: number, w: number, h: number, d: number, c: Rgb, tag = st): void =>
    boxAlong(out, e.mid.x + e.tx * u * east + e.nx * o, G + y0, e.mid.z + e.tz * u * east + e.nz * o, w / 2, h / 2, d / 2, e.heading, c, tag)
  const L = e.L
  // the glazed lobby across the western half of the front, under a deep marble lintel
  const lobby = L * 0.5, lu = -L / 2 + 2 + lobby / 2
  on(lu, 4, 0.04, lobby, 8, 0.06, GLASS, 0)
  for (let k = 0; k <= 8; k++) on(lu - lobby / 2 + (k * lobby) / 8, 4, 0.1, 0.18, 8, 0.12, BRONZE, surfaceTag('metal'))
  on(lu, 8.6, 0.6, lobby + 1, 1.2, 1.2, SHADE)
  // the twin marble columns before it, each crowned with a globe
  for (const s of [-1, 1]) {
    const u = lu + s * lobby * 0.22
    const x = e.mid.x + e.tx * u * east + e.nx * 3.5, z = e.mid.z + e.tz * u * east + e.nz * 3.5
    prism(out, x, z, G, G + 7, 0.55, 12, MARBLE, st)
    prism(out, x, z, G + 7, G + 7.4, 0.8, 12, SHADE, st)
    prism(out, x, z, G + 7.4, G + 7.9, 0.45, 12, BRONZE, surfaceTag('metal'), 0.85)
    prism(out, x, z, G + 7.9, G + 8.6, 0.85, 12, BRONZE, surfaceTag('metal'), 0.85)
    prism(out, x, z, G + 8.6, G + 9.2, 0.85, 12, BRONZE, surfaceTag('metal'), 0.4)
  }
  // Norman's sculpture at the east end: four tall figures, then the frieze of small ones, the inscription below
  const su = L / 2 - 4
  for (let k = 0; k < 4; k++) on(su - k * 2.6, 19.5, 0.25, 1.4, 3.7, 0.5, SHADE)
  for (let k = 0; k < 14; k++) on(su - 11 - k * 1.1, 19, 0.18, 0.55, 1.6 + (k % 3) * 0.3, 0.36, SHADE)
  on(su - 13, 16.4, 0.03, 26, 0.5, 0.06, [0.45, 0.45, 0.45], 0)
}

export const MASONIC: Record<string, (out: MeshBuilder, fit: Fit) => void> = { masonicTemple }
