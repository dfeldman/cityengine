/**
 * Émile Aillaud's Tours Nuages (Cité Pablo-Picasso, Nanterre, 1973-81): towers on lobed, cloud-like plans of clustered
 * round lobes (OSM's rings carry the lobes), pale render covered in a mosaic "sky camouflage" — patches of blue,
 * blue-grey, green-grey and white that go bluer and darker low down and paler toward the top — with small, tightly
 * scattered punched windows and flat roofs. The mosaic is drawn as per-edge, per-band wall colours (faceOverrides on
 * towerRing edges) rather than geometry: a deterministic hash picks a palette tone for each run of RUN edges in each
 * of BANDS horizontal bands, so patches wrap a lobe and change with height. Refs: Commons "Tours Aillaud, de la
 * prefecture des Hauts de Seine.JPG", "Cité pablo picasso nanterre.jpg"; heights from IGN BD TOPO batiment.hauteur.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower, towerRing, type Face, type Tier } from '../../tower.ts'

/** palette, darkest/bluest first; the band's height shifts the pick toward the pale end */
export const NUAGES_TONES = ['#5f7f9e', '#7894b0', '#8fa79c', '#c9988a', '#9aabbd', '#dcb3a0', '#b4c5d6', '#cfd9e2', '#e6e9e8'] // + peach/salmon patches (Panoramax 2026-11: Rieti sky murals read pink-orange low on the tower)
export const GLASS = '#3b434c', ROOF = '#8f9396', LOBBY = '#6d7479', PARAPET = '#d2d8dc'
export const LOBBY_H = 3.5, FLOOR = 2.7, PITCH = 1.7, SOLID = 0.74, PARAPET_H = 1.0
/** horizontal colour bands up the tower, edges per patch, and how strongly height lightens the tone (0..1) */
export const BANDS = 7, RUN = 3, LIFT = 0.4

const hash = (a: number, b: number, s: number): number => {
  let h = (a * 374761393 + b * 668265263 + s * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const face = (tone: string): Face => ({ kind: 'punched', wall: hex(tone), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' })

export function nuages(out: MeshBuilder, fit: Fit, height: number, seed: number): void {
  const n = towerRing(fit).length
  const tiers: Tier[] = []
  for (let b = 0; b < BANDS; b++) {
    const up = b / (BANDS - 1)
    const groups = new Map<number, number[]>()
    for (let e = 0; e < n; e++) {
      const r = hash(Math.floor((e + (b % 2) * 1.5) / RUN), b, seed)
      const t = Math.min(NUAGES_TONES.length - 1, Math.floor((r * (1 - LIFT) + up * LIFT) * NUAGES_TONES.length))
      const g = groups.get(t) ?? []; g.push(e); groups.set(t, g)
    }
    const [first, ...rest] = [...groups.entries()]
    tiers.push({
      to: (b + 1) / BANDS,
      face: face(NUAGES_TONES[first[0]]),
      faceOverrides: rest.map(([t, edges]) => ({ edges, face: face(NUAGES_TONES[t]) })),
    })
  }
  tower(out, fit, {
    height, roof: hex(ROOF),
    base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
    tiers,
    crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
  })
}

/** the generic family member (the unnamed Aillaud towers); height comes from the manifest entry */
export const nuagesTower = (out: MeshBuilder, fit: Fit): void => nuages(out, fit, 54, Math.round(fit.hx * 97 + fit.hz * 31))
