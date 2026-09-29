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

/**
 * `strut`/`beam` (models.ts/golden-gate.ts) pick their own cross-section axes from the beam's direction: when
 * the beam is near-vertical the wide axis lands in X and the thin axis in Z, but when the beam is more
 * horizontal that flips — the wide axis lands in Z (depth, out of the sail's plane) and the thin axis in Y
 * (vertical). Passed a fixed (wide, thin) pair, a windmill sail pointing sideways from the hub therefore comes
 * out as a flat plank bulging toward the camera instead of a blade standing in the vertical plane — this was
 * bug #(see BUGS.md). `orientedBeam` swaps the two arguments for the more-horizontal beams so `wide` always
 * ends up in-plane (spanning the sail's face) and `thin` always ends up along Z (the sail's paper-thin depth).
 */
function orientedBeam(out: MeshBuilder, a: [number, number, number], b: [number, number, number], wide: number, thin: number, colour: Rgb): void {
  const dy = Math.abs(b[1] - a[1])
  const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const vertical = d < 1e-6 || dy / d > 0.98
  beam(out, a, b, vertical ? wide : thin, vertical ? thin : wide, colour)
}

const centroidP2 = (ring: { x: number; z: number }[]): { x: number; z: number } =>
  ring.reduce((a, p) => ({ x: a.x + p.x / ring.length, z: a.z + p.z / ring.length }), { x: 0, z: 0 })

/** Uniform scale of `ring` toward its own centroid by `k` (1 = unchanged, <1 = smaller) — a TRUE proportional
 * shrink, unlike `insetRing`'s constant-distance one, so a ring built this way from a base ring gives a
 * dead-straight taper with no per-tier stepping when the two are joined by `frustumBand`. */
function scaleRing(ring: { x: number; z: number }[], k: number): { x: number; z: number }[] {
  const c = centroidP2(ring)
  return ring.map((p) => ({ x: c.x + (p.x - c.x) * k, z: c.z + (p.z - c.z) * k }))
}

/** One tapering band of wall between two same-length rings at different heights and (generally) different
 * radii — a smooth cone frustum, not a stack of stepped cylinders. Also used, ring-widening, for the cap's
 * overhang. This is `tower.ts`'s own (unexported) `frustum` helper, copied rather than exported for one caller. */
function frustumBand(out: MeshBuilder, ring0: { x: number; z: number }[], y0: number, ring1: { x: number; z: number }[], y1: number, colour: Rgb, tag: number): void {
  for (let i = 0; i < ring0.length; i++) {
    const j = (i + 1) % ring0.length
    const a = ring0[i]
    const b = ring0[j]
    const e = { x: b.x - a.x, z: b.z - a.z }
    const L = Math.hypot(e.x, e.z) || 1
    const up = Math.max(0.2, (y1 - y0) / Math.max(0.5, Math.hypot(ring1[i].x - a.x, ring1[i].z - a.z)))
    const n: [number, number, number] = [e.z / L, 1 / up, -e.x / L]
    const nl = Math.hypot(n[0], n[1], n[2]) || 1
    out.quad(
      [[a.x, y0, a.z], [b.x, y0, b.z], [ring1[j].x, y1, ring1[j].z], [ring1[i].x, y1, ring1[i].z]],
      [n[0] / nl, n[1] / nl, n[2] / nl], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag,
    )
  }
}

/** A simple cone from `ring` at `y0` up to a point above its centroid at `y1` — the windmill cap's tip. Each
 * face is a degenerate quad (its top two corners collapsed onto the apex): `frustumBand` with `ring1`
 * replaced by the repeated apex. */
function frustumCap(out: MeshBuilder, ring: { x: number; z: number }[], y0: number, y1: number, colour: Rgb, tag: number): void {
  const c = centroidP2(ring)
  const apex = ring.map(() => c)
  frustumBand(out, ring, y0, apex, y1, colour, tag)
}

/**
 * A smock-mill tower: a round tower tapering in ONE continuous straight cone from base to gallery (no
 * stepped tiers — `frustumBand` between a base ring and a proportionally-scaled top ring), a thin, DARK,
 * near-flush gallery deck where the cap meets the shaft, and a broad dark cap standing proud of the shaft —
 * flared out wider than the tower first (the boat-like overhang in the reference photo), then tapered to a
 * point. Returns the hub position for `sailAssembly` to mount on: at gallery height, out in front of the cap.
 */
function smockTower(height: number, capHeight: number, taper: number, wall: Rgb, capColour: Rgb) {
  return (out: MeshBuilder, fit: Fit): { hub: [number, number, number] } => {
    const baseR = Math.min(fit.hx, fit.hz) * 0.95
    const ring0 = roundRing(towerRing(fit), baseR, 8)
    const galleryY = height
    const topRing = scaleRing(ring0, taper)
    const wallTag = surfaceTag('stucco')
    frustumBand(out, ring0, 0, topRing, galleryY, wall, wallTag)
    // the gallery: a thin, dark band standing only slightly proud of the shaft (not a bright overhanging
    // ledge — see BUGS.md #134a/#162 — pale or oversized bands here read as a glowing picket fence)
    const DARK_TIMBER: Rgb = [0.16, 0.14, 0.12]
    const galleryRing = insetRing(topRing, -0.35)
    frustumBand(out, topRing, galleryY, galleryRing, galleryY + 0.15, DARK_TIMBER, surfaceTag('clapboard'))
    frustumBand(out, galleryRing, galleryY + 0.15, galleryRing, galleryY + 0.55, DARK_TIMBER, surfaceTag('clapboard'))
    capPolygon(out, galleryRing, galleryY + 0.55, DARK_TIMBER, surfaceTag('clapboard'))
    // the cap: flares out wider than the gallery (the boat/ogee overhang), then narrows to a point
    const capBaseY = galleryY + 0.55
    const flareRing = scaleRing(galleryRing, 1.4)
    const midRing = scaleRing(galleryRing, 0.85)
    const capTag = surfaceTag('tile')
    frustumBand(out, galleryRing, capBaseY, flareRing, capBaseY + capHeight * 0.18, capColour, capTag)
    frustumBand(out, flareRing, capBaseY + capHeight * 0.18, midRing, capBaseY + capHeight * 0.55, capColour, capTag)
    frustumCap(out, midRing, capBaseY + capHeight * 0.55, capBaseY + capHeight, capColour, capTag)
    const c = centroidP2(galleryRing)
    const hubOut = Math.max(...flareRing.map((p) => Math.hypot(p.x - c.x, p.z - c.z))) + 1.5
    return { hub: [c.x, galleryY + 0.35, c.z + hubOut] }
  }
}

/**
 * Four sails crossed at a hub, each a main spar (`beam`, hub to tip) with ONE crossbar batten near the tip,
 * standing in the vertical plane of constant Z through the hub, swept in a full circle (an arm above the
 * hub, one below, one each side) face-on to a camera looking along Z. The crossbar's offset from the arm's
 * own axis is computed with the PERPENDICULAR unit vector in the X-Y plane, not a fixed Y offset — a fixed Y
 * offset is perpendicular to a sideways arm but nearly PARALLEL to an up/down one, which is what silently
 * turned the up/down sails into bare poles with no crosspiece (BUGS.md #162, round 2).
 */
function sailAssembly(out: MeshBuilder, hub: [number, number, number], armLen: number, spar: number, sparThin: number, crossAt: number, crossHalf: number, cross: number, crossThin: number): void {
  for (const a of [0, 90, 180, 270]) {
    const rad = (a * Math.PI) / 180
    const dx = Math.sin(rad)
    const dy = Math.cos(rad)
    const px = dy    // perpendicular to (dx, dy) in the X-Y plane
    const py = -dx
    const tip: [number, number, number] = [hub[0] + dx * armLen, hub[1] + dy * armLen, hub[2]]
    orientedBeam(out, hub, tip, spar, sparThin, SAIL_WOOD)
    const cx = hub[0] + dx * crossAt
    const cy = hub[1] + dy * crossAt
    const crossA: [number, number, number] = [cx - px * crossHalf, cy - py * crossHalf, hub[2]]
    const crossB: [number, number, number] = [cx + px * crossHalf, cy + py * crossHalf, hub[2]]
    orientedBeam(out, crossA, crossB, cross, crossThin, SAIL_WOOD)
  }
}

const WHITE: Rgb = [0.93, 0.92, 0.88]
const GLASS_PALE: Rgb = [0.78, 0.86, 0.82]
const LIVING_GREEN: Rgb = [0.34, 0.46, 0.28]
const RED_LACQUER: Rgb = [0.62, 0.16, 0.12]
const TEA_GREEN: Rgb = [0.24, 0.34, 0.24]
const SAIL_WOOD: Rgb = [0.58, 0.56, 0.51]
const CREAM: Rgb = [0.87, 0.83, 0.73]
/** pale cream-grey smock-mill stucco (Dutch/Murphy Windmill) — deliberately lighter and greyer than `CREAM`
 * so it reads distinctly against the dark cap and dark sails at any lighting angle. */
const MILL_STUCCO: Rgb = [0.83, 0.8, 0.72]
const MILL_CAP: Rgb = [0.15, 0.14, 0.13]
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
   * Dutch Windmill (1902/1981) and Murphy Windmill (1907): smock-style windmills at the park's ocean end — a
   * PALE CREAM-GREY tower in ONE continuous taper (no steps) from a wide base to a narrow neck, a thin dark
   * gallery deck where the cap meets the shaft, and a broad, dark, boat-profiled cap standing proud of the
   * shaft, with four sails, EACH SEVERAL TIMES THE TOWER'S DIAMETER, crossed at a hub mounted out in front of
   * the cap and swept in a full circle (up, down, and both sides). Mapillary way/287921407
   * (docs/shots/refs/sf-mapillary/way-287921407-01.jpg) is the reference for all of this — the taper, the
   * gallery, the dark cap, and the huge sails relative to the tower. Murphy is the larger of the two, with
   * even longer sails relative to its (taller) tower. The sails are diagonal beams, not boxes turned to a
   * wall, so `beam` (golden-gate.ts) draws them via `sailAssembly` above.
   */
  dutchWindmill: (() => {
    const tow = smockTower(20, 6, 0.55, MILL_STUCCO, MILL_CAP)
    return (out: MeshBuilder, fit: Fit): void => {
      const cap = tow(out, fit)
      sailAssembly(out, cap.hub, 17, 0.55, 0.14, 14, 1.4, 1.7, 0.1)
    }
  })(),
  murphyWindmill: (() => {
    const tow = smockTower(24, 7, 0.52, MILL_STUCCO, MILL_CAP)
    return (out: MeshBuilder, fit: Fit): void => {
      const cap = tow(out, fit)
      sailAssembly(out, cap.hub, 22, 0.6, 0.16, 18, 1.7, 2, 0.12)
    }
  })(),

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
