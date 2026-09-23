/**
 * Golden Gate Park and the Presidio: "Golden Gate Park is FULL of plants, with just a few big buildings in the
 * park" (project owner). Almost none of these are footprint-extrusions — the shape IS the point (a dome, an
 * undulating green roof, a windmill's sails, a bandshell's colonnade) — so most are hand-built on the shared
 * parts rather than a recipe.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { tower, towerRing, faceBand, insetRing, type TowerSpec } from '../../tower.ts'
import { edgeAt, edgeFacing, colonnade, arcade, cupola, roundRing } from '../../parts.ts'
import { beam } from '../golden-gate.ts'
import { fromRecipe } from '../recipes.ts'

const spec = (s: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, s)

const WHITE: Rgb = [0.93, 0.92, 0.88]
const GLASS_PALE: Rgb = [0.78, 0.86, 0.82]
const LIVING_GREEN: Rgb = [0.34, 0.46, 0.28]
const RED_LACQUER: Rgb = [0.62, 0.16, 0.12]
const TEA_GREEN: Rgb = [0.24, 0.34, 0.24]
const BRICK: Rgb = [0.55, 0.32, 0.26]
const SAIL_WHITE: Rgb = [0.88, 0.86, 0.8]
const CREAM: Rgb = [0.87, 0.83, 0.73]
const CHALET_ROOF: Rgb = [0.42, 0.22, 0.18]
const STONE: Rgb = [0.78, 0.76, 0.7]

export const PARKS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * Conservatory of Flowers (1878, rebuilt after fire): a white Victorian glasshouse — a long barrel-vaulted
   * greenhouse wing each side of a domed central pavilion. Glass and white-painted wood.
   */
  conservatoryOfFlowers: (out: MeshBuilder, fit: Fit): void => {
    const ring = towerRing(fit)
    // the long glasshouse body: a low white timber base and a shallow-hipped glass roof reads as the vaulted wings
    tower(out, fit, {
      height: 11,
      base: { height: 2.2, face: { kind: 'blank', wall: WHITE, material: 'clapboard' } },
      tiers: [{ to: 1, face: { kind: 'curtain', wall: WHITE, glass: GLASS_PALE, pitch: 2.4, floor: 3, solid: 0.22, material: 'metal' } }],
      roof: GLASS_PALE,
      crown: { kind: 'hip', height: 3.2, inset: 3, colour: GLASS_PALE, material: 'glass' },
    })
    // the domed central pavilion, standing taller in the middle of the ridge
    const c = ring.reduce((a, p) => ({ x: a.x + p.x / ring.length, z: a.z + p.z / ring.length }), { x: 0, z: 0 })
    cupola(out, c, 11, 11, { drum: 4, dome: 9, colour: WHITE, domeColour: GLASS_PALE, material: 'metal', domeMaterial: 'glass', lantern: true })
  },

  /**
   * California Academy of Sciences (Renzo Piano, 2008): a flat glass box under a famous undulating GREEN LIVING
   * ROOF with round domes (the planetarium, the rainforest dome) pushed up through it, and a glass canopy
   * overhanging all round.
   */
  californiaAcademyOfSciences: (out: MeshBuilder, fit: Fit): void => {
    const ring = towerRing(fit)
    tower(out, fit, {
      height: 9,
      tiers: [{ to: 1, face: { kind: 'curtain', wall: [0.55, 0.56, 0.53], glass: [0.5, 0.58, 0.55], pitch: 4, floor: 4.5, solid: 0.18, material: 'metal' } }],
      roof: LIVING_GREEN,
      crown: { kind: 'flat' },
    })
    // the canopy overhanging the whole building: a thin glass slab a little wider than the footprint
    const wide = insetRing(ring, -1.8)
    faceBand(out, wide, 9.6, 9.75, { kind: 'blank', wall: [0.75, 0.8, 0.78], material: 'glass' })
    capPolygon(out, wide, 9.75, [0.75, 0.8, 0.78], surfaceTag('glass'))
    // the domes standing up through the living roof: the planetarium (big) and the rainforest dome (smaller)
    const c = ring.reduce((a, p) => ({ x: a.x + p.x / ring.length, z: a.z + p.z / ring.length }), { x: 0, z: 0 })
    cupola(out, { x: c.x - fit.hx * 0.28, z: c.z }, 9, 11, { drum: 0.5, dome: 7, colour: LIVING_GREEN, domeColour: [0.5, 0.58, 0.55], material: 'concrete', domeMaterial: 'glass', lantern: false })
    cupola(out, { x: c.x + fit.hx * 0.3, z: c.z }, 9, 6, { drum: 0.3, dome: 4, colour: LIVING_GREEN, domeColour: [0.5, 0.58, 0.55], material: 'concrete', domeMaterial: 'glass', lantern: false })
  },

  /**
   * Japanese Tea Garden: the South Gate, its pagoda and its tea house, on their own small footprints — red and
   * green timber, deep tiled eaves. Each is one small tiered pyramid roof on a plain base, which is what most
   * of the garden's structures actually are at this distance.
   */
  japaneseTeaGardenGate: spec({
    height: 6,
    tiers: [{ to: 1, face: { kind: 'blank', wall: RED_LACQUER, material: 'clapboard' } }],
    roof: TEA_GREEN,
    crown: { kind: 'pyramid', height: 3, colour: TEA_GREEN, material: 'tile' },
  }),
  japaneseTeaGardenPagoda: (out: MeshBuilder, fit: Fit): void => {
    // a two-tier pagoda: a lower storey, a deep green tiled roof, a smaller upper storey, a second roof, a finial
    tower(out, fit, {
      height: 5,
      tiers: [{ to: 1, face: { kind: 'blank', wall: RED_LACQUER, material: 'clapboard' } }],
      roof: TEA_GREEN,
      crown: { kind: 'hip', height: 1.6, inset: 1.6, colour: TEA_GREEN, material: 'tile' },
    })
    const ring = insetRing(towerRing(fit), 2.4)
    faceBand(out, ring, 6.6, 7.8, { kind: 'blank', wall: RED_LACQUER, material: 'clapboard' })
    capPolygon(out, ring, 7.8, RED_LACQUER, surfaceTag('clapboard'))
    const c = ring.reduce((a, p) => ({ x: a.x + p.x / ring.length, z: a.z + p.z / ring.length }), { x: 0, z: 0 })
    box(out, c.x, 9, c.z, 0.6, 1.4, 0.6, TEA_GREEN, surfaceTag('tile'))
    box(out, c.x, 10.2, c.z, 0.12, 0.5, 0.12, [0.7, 0.62, 0.3], 0)
  },
  japaneseTeaGardenTeaHouse: spec({
    height: 5,
    tiers: [{ to: 1, face: { kind: 'blank', wall: [0.42, 0.34, 0.24], material: 'clapboard' } }],
    roof: TEA_GREEN,
    crown: { kind: 'hip', height: 2.4, inset: 1.4, colour: TEA_GREEN, material: 'tile' },
  }),

  /**
   * Dutch Windmill (1902/1981) and Murphy Windmill (1907): brick-based Dutch windmills at the park's ocean end,
   * a conical brick tower under a peaked cap, with four long sails crossed at the hub. The sails are diagonal
   * beams, not boxes turned to a wall, so `beam` (golden-gate.ts) draws them.
   */
  dutchWindmill: (out: MeshBuilder, fit: Fit): void => {
    const ring = roundRing(towerRing(fit), Math.min(fit.hx, fit.hz) * 0.9, 6)
    faceBand(out, ring, 0, 18, { kind: 'blank', wall: BRICK, material: 'brick' })
    capPolygon(out, insetRing(ring, 1), 18, BRICK, surfaceTag('brick'))
    const c = { x: 0, z: 0 }
    box(out, c.x, 20, c.z, 1.4, 2, 1.4, [0.3, 0.28, 0.25], surfaceTag('tile'))
    const hub: [number, number, number] = [c.x, 20, c.z + fit.hz * 0.9]
    for (const a of [0, 90, 180, 270]) {
      const rad = (a * Math.PI) / 180
      const tip: [number, number, number] = [hub[0] + Math.sin(rad) * 9, hub[1] + Math.cos(rad) * 9, hub[2]]
      beam(out, hub, tip, 0.5, 0.12, SAIL_WHITE)
      const cross: [number, number, number] = [hub[0] + Math.sin(rad) * 8.5, hub[1] + Math.cos(rad) * 8.5 - 1.6, hub[2]]
      beam(out, [hub[0] + Math.sin(rad) * 2, hub[1] + Math.cos(rad) * 2, hub[2]], cross, 1.8, 0.08, SAIL_WHITE)
    }
  },
  murphyWindmill: (out: MeshBuilder, fit: Fit): void => {
    const ring = roundRing(towerRing(fit), Math.min(fit.hx, fit.hz) * 0.9, 6)
    faceBand(out, ring, 0, 14, { kind: 'blank', wall: BRICK, material: 'brick' })
    capPolygon(out, insetRing(ring, 1), 14, BRICK, surfaceTag('brick'))
    const c = { x: 0, z: 0 }
    box(out, c.x, 15.6, c.z, 1.2, 1.6, 1.2, [0.3, 0.28, 0.25], surfaceTag('tile'))
    const hub: [number, number, number] = [c.x, 15.6, c.z + fit.hz * 0.9]
    for (const a of [0, 90, 180, 270]) {
      const rad = (a * Math.PI) / 180
      const tip: [number, number, number] = [hub[0] + Math.sin(rad) * 8, hub[1] + Math.cos(rad) * 8, hub[2]]
      beam(out, hub, tip, 0.45, 0.1, SAIL_WHITE)
      const cross: [number, number, number] = [hub[0] + Math.sin(rad) * 7.5, hub[1] + Math.cos(rad) * 7.5 - 1.4, hub[2]]
      beam(out, [hub[0] + Math.sin(rad) * 1.8, hub[1] + Math.cos(rad) * 1.8, hub[2]], cross, 1.6, 0.07, SAIL_WHITE)
    }
  },

  /** Beach Chalet (1925, Willis Polk): cream stucco, two storeys, a red-brown hipped tile roof, at the west end. */
  beachChalet: fromRecipe('edwardian-terracotta', {
    height: 12, wall: CREAM, glass: [0.22, 0.24, 0.24], base: 4, baseWall: [0.3, 0.27, 0.22],
    crown: { kind: 'hip', height: 5, inset: 1, colour: CHALET_ROOF, material: 'tile' },
  }),

  /**
   * Spreckels Temple of Music (the Music Concourse bandshell, 1900): a stone bandshell with a colonnade —
   * a curved back wall behind an open colonnaded front, no roof over the audience side.
   */
  spreckelsTempleOfMusic: (out: MeshBuilder, fit: Fit): void => {
    const ring = towerRing(fit)
    const front = edgeFacing(ring, 0)
    const e = edgeAt(ring, front)
    // the stage floor and the curved stone back wall (a shallow drum standing behind the colonnade)
    capPolygon(out, ring, 0.3, STONE, surfaceTag('ashlar'))
    faceBand(out, insetRing(ring, 1.5), 0.3, 8, { kind: 'blank', wall: STONE, material: 'ashlar' })
    capPolygon(out, insetRing(ring, 1.5), 8, STONE, surfaceTag('ashlar'))
    colonnade(out, e.a, e.b, 0.3, 5.5, Math.max(4, Math.round(e.L / 4)), { colour: STONE, material: 'ashlar', out: 0.9, entablature: 1.2 })
  },

  /** Presidio Officers' Club (adobe origins, 1930s remodel): white Spanish colonial, arcaded along the front. */
  presidioOfficersClub: (out: MeshBuilder, fit: Fit): void => {
    const ring = towerRing(fit)
    tower(out, fit, {
      height: 7,
      tiers: [{ to: 1, face: { kind: 'blank', wall: WHITE, material: 'stucco' } }],
      roof: [0.5, 0.3, 0.24],
      crown: { kind: 'hip', height: 2.6, inset: 1, colour: [0.55, 0.32, 0.24], material: 'tile' },
    })
    const front = edgeFacing(ring, 0)
    const e = edgeAt(ring, front)
    arcade(out, e.a, e.b, 0.2, 3.2, Math.max(3, Math.round(e.L / 3.5)), { colour: WHITE, material: 'stucco', depth: 0.5 })
  },
}
