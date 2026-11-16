/**
 * Tour Emblem (ex-T4 / Cegetel / Cèdre, Puteaux, 1998 by Andrault & Ayoub, reclad 2020–21; OSM way/82486366): a right
 * prism of 25 office floors. Since the reclad: blue-grey reflective glass, with white full-height vertical fins on the
 * narrow end faces and plain sky-reflecting glass on the long faces (fr.wikipedia photo Tour_Emblem_Mai_2022.jpeg).
 * Height: BD TOPO batiment hauteur 97.6 m (Wikipedia: 103 m base-to-roof, from below the dalle).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower, towerRing } from '../../tower.ts'

const HEIGHT = 97.6
const LOBBY_H = 6
const GLASS = '#55697f', MULLION = '#aab4bb', FIN = '#e6e8e8', FIN_GLASS = '#485c72', ROOF = '#7a8084', LOBBY = '#3a4a55'
const FLOOR = 3.6, PITCH = 1.5, FIN_PITCH = 1.6, FIN_DEPTH = 0.45, FIN_SOLID = 0.22, PARAPET_H = 2.5
/** edges shorter than this share of the longest edge count as the narrow, finned ends */
const NARROW = 0.75

export const tourEmblem = (out: MeshBuilder, fit: Fit): void => {
  const ring = towerRing(fit)
  const len = ring.map((a, i) => { const b = ring[(i + 1) % ring.length]; return Math.hypot(b.x - a.x, b.z - a.z) })
  const max = Math.max(...len)
  const narrow = len.map((l, i) => (l < NARROW * max && l > 4 ? i : -1)).filter(i => i >= 0)
  const fins = { kind: 'fins' as const, wall: hex(FIN), glass: hex(FIN_GLASS), floor: FLOOR, pitch: FIN_PITCH, depth: FIN_DEPTH, solid: FIN_SOLID, continuous: true, material: 'metal' as const }
  tower(out, fit, {
    height: HEIGHT, roof: hex(ROOF),
    base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(LOBBY), floor: LOBBY_H, pitch: 3, material: 'glass' } },
    tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(MULLION), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, material: 'glass' },
      faceOverrides: narrow.length ? [{ edges: narrow, face: fins }] : undefined }],
    crown: { kind: 'parapet', height: PARAPET_H, colour: hex(FIN), material: 'metal' },
  })
}
