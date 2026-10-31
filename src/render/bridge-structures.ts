/**
 * The Seine's bridges as structures (BUGS.md #37), built from each bridge's own OSM outline
 * (`man_made=bridge`, baked as `CityPackage.bridges`).
 *
 * A Paris bridge is mapped as several ways side by side — two carriageways, a cycle track, two pavements —
 * and drawing the arches and parapets per way stacked a structure under every one of them. So the ways draw
 * only their running surfaces (render/bridges.ts `deck`, `structured`) and the bridge itself is drawn once,
 * here, on the outline's long axis:
 *
 *        lamp  ╿                                        ╿
 *   balustrade ▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙▟▙   (or a solid parapet, or an iron railing)
 *      cornice ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀   deck top, from the ways' own heights
 *    spandrel  █████▀▀▀▀▀▀▀▀██▀▀▀▀▀▀▀▀██▀▀▀▀▀▀▀▀█████
 *              ████▌  arch  ▐▌  arch  ▐▌  arch  ▐████    arches only where it stands clear of water or quay
 *              ████▌        ◣◢        ◣◢        ▐████    piers with cutwaters
 *   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   the river's surface (city/package.ts waterLevels)
 *
 * The design is the bridge's own, by name (`PARIS_BRIDGES`): stone arches, round or segmental; cast-iron arch
 * ribs with open spandrels; a steel girder; the Pont Alexandre III's pylons; the Pont Neuf's half-moon
 * bastions and its cornice of mascarons. An unnamed bridge over water gets plain stone arches.
 *
 * Local frame: `s` along the long axis from one end, `o` across it (right positive), `y` world height.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import type { TileLayer } from './city.ts'
import { isRaised, unpackPoints, waterLevels, wholeWater, type CityPackage, type PackedBridge, type PackedEdge, type PackedRail } from '../city/package.ts'
import type { Terrain } from '../city/terrain.ts'
import { axisAlong, axisOf, straightOutline } from '../city/bridge-axis.ts'

type Rgb = [number, number, number]
type P = { x: number; z: number }
type V3 = [number, number, number]
const FIXED = 0
const EMIT = 0.5
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export interface StructureStyle {
  /** stone arches; cast-iron arch ribs with open spandrels; a steel girder with no arch */
  kind: 'stone' | 'iron' | 'girder'
  /** how many arches in all (shared over the open stretches by length); by span when absent */
  arches?: number
  /** the span to aim for when `arches` is absent (m) */
  span?: number
  /** the arch's rise as a share of its half-span: 1 a semicircle, 0.3 a flat segment */
  rise?: number
  /** round (elliptical) arches, or flat segments of a circle */
  shape?: 'round' | 'segment'
  /** the pier's thickness along the bridge, as a share of the span */
  pier?: number
  cutwater?: 'pointed' | 'round' | 'none'
  parapet?: 'balustrade' | 'stone' | 'iron'
  lamps?: 'lantern' | 'candelabra' | 'modern' | 'none'
  stone?: Rgb
  iron?: Rgb
  /** iron: arch ribs across the width */
  ribs?: number
  /** the Pont Neuf: a half-moon bastion over every pier */
  bastions?: boolean
  /** the Pont Neuf's cornice: a grotesque head under it every metre */
  mascarons?: boolean
  /** medallions on the spandrels between the arches (the Pont au Change's and Saint-Michel's N) */
  medallions?: boolean
  /** empty statue niches in the piers (the Pont Marie) */
  niches?: boolean
  /** the Pont Alexandre III: a tall pylon at each corner, with a gilded group on top */
  pylons?: { height: number; width: number }
  /** a gilded band along the fascia (Alexandre III's garlands) */
  gilt?: boolean
  /** a timber deck (the footbridges) */
  timber?: boolean
  /** Bir-Hakeim: the métro's viaduct carried on a colonnade of iron posts down the middle of the road deck */
  metroDeck?: { height: number; width: number }
  /** the arches' lengths in proportion, where they differ (the Pont Mirabeau's 32, 93, 32) */
  spans?: number[]
  /** a girder's river piers, as shares of its length; by `span` when absent, none when neither (the Alma's one, off centre) */
  pierAt?: number[]
  /** how deep a girder's fascia is below the deck (m) */
  depth?: number
  /** bronze figures on the piers (the Pont Mirabeau's four, the Alma's Zouave) */
  figures?: boolean
  /** the Pont d'Iéna's four horsemen at its corners */
  horsemen?: boolean
  /** the Pont Alexandre III's gilded nymphs at the crown of the arch, on each face */
  nymphs?: boolean
}

const LIMESTONE: Rgb = [0.82, 0.78, 0.69]
const IRON_GREEN: Rgb = [0.2, 0.26, 0.23]
const GOLD: Rgb = [0.86, 0.68, 0.28]
const BRONZE: Rgb = [0.27, 0.3, 0.26]
const CONCRETE: Rgb = [0.62, 0.61, 0.58]
const STEEL: Rgb = [0.38, 0.41, 0.42]

/** Central Paris's bridges, by the name on the outline (OSM spells some differently from their ways). */
export const PARIS_BRIDGES: Record<string, StructureStyle> = {
  'Pont Neuf': { kind: 'stone', span: 16, rise: 0.8, shape: 'round', cutwater: 'pointed', parapet: 'stone', lamps: 'candelabra', bastions: true, mascarons: true },
  'Pont Royal': { kind: 'stone', arches: 5, rise: 0.75, shape: 'round', cutwater: 'pointed', parapet: 'stone', lamps: 'lantern' },
  'Pont de la Concorde': { kind: 'stone', arches: 5, rise: 0.5, shape: 'segment', cutwater: 'round', parapet: 'balustrade', lamps: 'candelabra' },
  'Pont Alexandre III': { kind: 'iron', arches: 1, rise: 0.2, shape: 'segment', parapet: 'balustrade', lamps: 'candelabra', ribs: 9, iron: [0.42, 0.47, 0.44], gilt: true, pylons: { height: 17, width: 4.2 }, nymphs: true },
  'Pont des Invalides': { kind: 'stone', arches: 4, rise: 0.55, shape: 'segment', cutwater: 'round', parapet: 'stone', lamps: 'lantern' },
  "Pont de l'Alma": { kind: 'girder', pierAt: [0.72], depth: 2.2, parapet: 'iron', lamps: 'modern', iron: [0.33, 0.35, 0.36], figures: true },
  "Pont d'Iéna": { kind: 'stone', arches: 5, rise: 0.5, shape: 'segment', cutwater: 'round', parapet: 'stone', lamps: 'lantern', horsemen: true },
  // (the bridges left to the default of stone arches, 2026-10-30, the Seine audit: owner, "We should audit every seine bridge too"; each from its own page on
  //  fr.wikipedia and the IGN aerial. A concrete or steel beam bridge of the 1960s drew as a Second Empire arcade; the Mirabeau as five stone arches, not its 32, 93, 32 of steel)
  'Pont Mirabeau': { kind: 'iron', spans: [32.4, 93, 32.4], rise: 0.17, shape: 'segment', cutwater: 'pointed', pier: 0.05, parapet: 'iron', lamps: 'lantern', ribs: 5, iron: [0.2, 0.27, 0.27], figures: true },
  'Pont de Grenelle': { kind: 'iron', arches: 2, rise: 0.12, shape: 'segment', cutwater: 'round', parapet: 'iron', lamps: 'modern', ribs: 6, iron: STEEL },
  'Pont du Garigliano': { kind: 'girder', pierAt: [0.28, 0.72], depth: 2.6, parapet: 'iron', lamps: 'modern', iron: STEEL },
  'Pont Charles de Gaulle': { kind: 'girder', pierAt: [0.26, 0.74], depth: 2.2, parapet: 'iron', lamps: 'modern', iron: [0.8, 0.82, 0.82] },
  'Pont de Bercy': { kind: 'stone', arches: 5, rise: 0.5, shape: 'round', cutwater: 'round', parapet: 'stone', lamps: 'lantern' },
  'Pont de Tolbiac': { kind: 'stone', arches: 5, rise: 0.55, shape: 'round', cutwater: 'round', parapet: 'stone', lamps: 'lantern' },
  'Pont National': { kind: 'stone', arches: 5, rise: 0.5, shape: 'segment', cutwater: 'round', parapet: 'stone', lamps: 'lantern' },
  'Passerelle Simone de Beauvoir': { kind: 'iron', arches: 1, rise: 0.09, shape: 'segment', parapet: 'iron', lamps: 'none', ribs: 2, iron: [0.5, 0.5, 0.48], timber: true },
  'Pont de Sèvres': { kind: 'girder', pierAt: [0.24, 0.76], depth: 3, parapet: 'iron', lamps: 'modern', iron: CONCRETE },
  'Pont de Saint-Cloud': { kind: 'girder', pierAt: [0.27, 0.73], depth: 2.2, parapet: 'iron', lamps: 'modern', iron: STEEL },
  'Pont de Suresnes': { kind: 'stone', arches: 3, rise: 0.3, shape: 'segment', cutwater: 'round', parapet: 'iron', lamps: 'modern', stone: CONCRETE },
  'Pont de Puteaux': { kind: 'girder', span: 60, depth: 3, parapet: 'iron', lamps: 'modern', iron: CONCRETE },
  'Pont de Neuilly': { kind: 'iron', arches: 2, rise: 0.14, shape: 'segment', cutwater: 'round', parapet: 'iron', lamps: 'modern', ribs: 7, iron: STEEL },
  "Pont d'Issy": { kind: 'girder', span: 62, depth: 2.6, parapet: 'iron', lamps: 'modern', iron: CONCRETE },
  'Pont de Billancourt': { kind: 'girder', span: 55, depth: 2.2, parapet: 'iron', lamps: 'modern', iron: STEEL },
  'Ponts de Billancourt': { kind: 'girder', span: 55, depth: 2.2, parapet: 'iron', lamps: 'modern', iron: STEEL },
  'Pont de Courbevoie': { kind: 'stone', span: 42, rise: 0.25, shape: 'segment', cutwater: 'round', parapet: 'iron', lamps: 'modern', stone: CONCRETE },
  'Pont de Levallois': { kind: 'stone', arches: 4, rise: 0.3, shape: 'segment', cutwater: 'round', parapet: 'iron', lamps: 'modern', stone: CONCRETE },
  'Pont Nelson Mandela': { kind: 'girder', span: 60, depth: 2.6, parapet: 'iron', lamps: 'modern', iron: CONCRETE },
  "Pont d'Ivry": { kind: 'girder', span: 55, depth: 2.4, parapet: 'iron', lamps: 'modern', iron: CONCRETE },
  'Pont Daydé': { kind: 'girder', span: 40, depth: 2.6, parapet: 'iron', lamps: 'none', iron: [0.3, 0.33, 0.32] },
  'Pont Renault': { kind: 'girder', span: 40, depth: 2.2, parapet: 'iron', lamps: 'none', iron: CONCRETE },
  'Pont Seibert': { kind: 'girder', span: 40, depth: 2.2, parapet: 'iron', lamps: 'modern', iron: CONCRETE },
  'Passerelle Sud': { kind: 'girder', span: 45, depth: 1.4, parapet: 'iron', lamps: 'none', iron: [0.62, 0.64, 0.64] },
  'Passerelle Nord': { kind: 'girder', span: 45, depth: 1.4, parapet: 'iron', lamps: 'none', iron: [0.62, 0.64, 0.64] },
  "Passerelle de l'Avre": { kind: 'iron', span: 45, rise: 0.16, shape: 'segment', cutwater: 'round', parapet: 'iron', lamps: 'none', ribs: 2, iron: [0.3, 0.33, 0.31] },
  'Pont de Bir-Hakeim': { kind: 'iron', span: 50, rise: 0.25, shape: 'segment', parapet: 'iron', lamps: 'lantern', ribs: 6, cutwater: 'round', metroDeck: { height: 7.5, width: 7.5 } },
  'Pont du Carrousel': { kind: 'stone', arches: 3, rise: 0.45, shape: 'segment', cutwater: 'round', parapet: 'iron', lamps: 'modern' },
  'Passerelle Léopold-Sédar-Senghor': { kind: 'iron', arches: 1, rise: 0.18, shape: 'segment', parapet: 'iron', lamps: 'none', ribs: 2, iron: [0.45, 0.43, 0.4], timber: true },
  'Pont des Arts': { kind: 'iron', arches: 7, rise: 0.35, shape: 'segment', cutwater: 'pointed', parapet: 'iron', lamps: 'lantern', ribs: 4, timber: true },
  'Passerelle Debilly': { kind: 'iron', arches: 1, rise: 0.22, shape: 'segment', parapet: 'iron', lamps: 'none', ribs: 2, timber: true },
  'Pont Notre-Dame': { kind: 'stone', arches: 3, rise: 0.6, shape: 'segment', cutwater: 'round', parapet: 'stone', lamps: 'lantern' },
  'Pont au Change': { kind: 'stone', arches: 3, rise: 0.65, shape: 'segment', cutwater: 'round', parapet: 'stone', lamps: 'lantern', medallions: true },
  'Pont Saint-Michel': { kind: 'stone', arches: 3, rise: 0.65, shape: 'segment', cutwater: 'round', parapet: 'stone', lamps: 'lantern', medallions: true },
  'Petit-Pont - Cardinal Lustiger': { kind: 'stone', arches: 1, rise: 0.6, shape: 'segment', parapet: 'stone', lamps: 'lantern' },
  'Pont au Double': { kind: 'iron', arches: 1, rise: 0.3, shape: 'segment', parapet: 'iron', lamps: 'lantern', ribs: 5 },
  "Pont d'Arcole": { kind: 'iron', arches: 1, rise: 0.18, shape: 'segment', parapet: 'iron', lamps: 'lantern', ribs: 6 },
  'Pont Louis-Philippe': { kind: 'stone', arches: 3, rise: 0.55, shape: 'round', cutwater: 'pointed', parapet: 'stone', lamps: 'lantern' },
  'Pont Marie': { kind: 'stone', arches: 5, rise: 0.85, shape: 'round', cutwater: 'pointed', parapet: 'stone', lamps: 'lantern', niches: true },
  'Pont Saint-Louis': { kind: 'iron', arches: 1, rise: 0.3, shape: 'segment', parapet: 'iron', lamps: 'lantern', ribs: 3 },
  "Pont de l'Archevêché": { kind: 'stone', arches: 3, rise: 0.7, shape: 'segment', cutwater: 'pointed', parapet: 'stone', lamps: 'lantern' },
  'Pont de la Tournelle': { kind: 'stone', spans: [1, 3.4, 1], rise: 0.28, shape: 'segment', cutwater: 'round', parapet: 'stone', lamps: 'lantern' },
  'Pont de Sully': { kind: 'iron', span: 45, rise: 0.25, shape: 'segment', cutwater: 'round', parapet: 'iron', lamps: 'lantern', ribs: 6 },
  "Pont d'Austerlitz": { kind: 'stone', arches: 5, rise: 0.5, shape: 'segment', cutwater: 'round', parapet: 'stone', lamps: 'candelabra' },
  'Pont Morland': { kind: 'stone', arches: 1, rise: 0.6, shape: 'segment', parapet: 'stone', lamps: 'lantern' },
}

const DEFAULT_OVER_WATER: StructureStyle = { kind: 'stone', span: 28, rise: 0.55, shape: 'segment', cutwater: 'round', parapet: 'stone', lamps: 'lantern' }
/** a bridge over a road or a quay only: a plain stone-faced slab, as the ways drew it before */
const DEFAULT_OVER_LAND: StructureStyle = { kind: 'girder', parapet: 'stone', lamps: 'none', iron: [0.66, 0.62, 0.55] }
/**
 * …and outside Paris an unnamed footbridge over water is not a stone arch bridge: the walkway between the Embarcadero's
 * Piers 15 and 17 (the Exploratorium's) drew as a Seine bridge with two great stone arches (owner, 2026-10-03). A light
 * steel girder with an iron railing instead.
 */
export const STEEL_OVER_WATER: StructureStyle = { kind: 'girder', parapet: 'iron', lamps: 'none', iron: [0.55, 0.57, 0.58] }

export { axisOf }

/**
 * The bridges that carry a railway and no way, drawn from their outline (the Seine audit, 2026-10-30). The Viaduc d'Austerlitz (Line 5) crosses the Seine in one
 * leap of 140 m, a deck hung from two steel bows: fr.wikipedia, "without intermediate support". It drew as the Line 6 viaduct's supports every 20 m across
 * the river. The viaduct's own deck stays (render/bridges.ts), without its supports over the span.
 */
export const RAIL_ARCHES = new Set(["Viaduc d'Austerlitz"])

function railArch(out: MeshBuilder, ring: P[], rails: PackedRail[], wetAt: (x: number, z: number) => number | null): void {
  const ax = axisOf(ring)
  if (!ax) return
  const { ux, uz } = ax
  const vx = -uz, vz = ux
  const W = (s: number, o: number): P => ({ x: ax.o.x + ux * s + vx * o, z: ax.o.z + uz * s + vz * o })
  // the deck's height, from the rail on it
  const hs: number[] = []
  let oMid = 0, nMid = 0
  for (const r of rails) {
    if (!r.heights) continue
    for (let i = 0; i < r.heights.length; i++) {
      const x = r.points[2 * i] - ax.o.x, z = r.points[2 * i + 1] - ax.o.z
      const s = x * ux + z * uz, o = x * vx + z * vz
      if (s >= 0 && s <= ax.L && Math.abs(o) <= ax.half + 2) { hs.push(r.heights[i]); oMid += o; nMid++ }
    }
  }
  if (!hs.length) return
  hs.sort((a, b) => a - b)
  const y = hs[Math.floor(hs.length / 2)]
  const off = oMid / nMid
  let a = Infinity, b = -Infinity
  for (let s = 0; s <= ax.L; s += 2) { const p = W(s, off); if (wetAt(p.x, p.z) !== null) { a = Math.min(a, s); b = Math.max(b, s) } }
  if (!(b - a > 30)) return
  a -= 4; b += 4
  const span = b - a, half = 4.3, rise = span * 0.17
  const iron: Rgb = [0.3, 0.36, 0.34]
  for (const side of [-1, 1]) {
    const o = off + side * half
    const pt = (s: number, yy: number): V3 => { const p = W(s, o); return [p.x, yy, p.z] }
    const crown = (s: number): number => y + rise * (1 - ((s - (a + b) / 2) / (span / 2)) ** 2)
    const N = 24
    for (let i = 0; i < N; i++) {
      const s0 = a + (span * i) / N, s1 = a + (span * (i + 1)) / N
      member(out, pt(s0, crown(s0) - 1), pt(s1, crown(s1) - 1), 0.55, iron)
      member(out, pt(s0, crown(s0) + 0.6), pt(s1, crown(s1) + 0.6), 0.32, iron)
      if (i % 2 === 0) member(out, pt(s0, crown(s0) - 1), pt(s1, crown(s1) + 0.6), 0.1, iron)
    }
    for (let i = 1; i < N; i++) {
      const s = a + (span * i) / N
      if (crown(s) - y > 1.5) member(out, pt(s, y - 0.1), pt(s, crown(s) - 1), 0.08, iron)
    }
    // the abutments' stone at its two feet
    for (const s of [a, b]) blockAt(out, W(s, o), y - 8, y + 0.6, 3.2, 1.6, ux, uz, [0.7, 0.66, 0.58])
  }
  // the bows' portal bracing, across the top
  for (const f of [0.2, 0.32, 0.44, 0.56, 0.68, 0.8]) {
    const s = a + span * f
    const yy = y + rise * (1 - ((s - (a + b) / 2) / (span / 2)) ** 2) - 0.4
    const p0 = W(s, off - half), p1 = W(s, off + half)
    member(out, [p0.x, yy, p0.z], [p1.x, yy, p1.z], 0.2, iron)
  }
}

interface Water { ring: P[]; holes: P[][]; x0: number; x1: number; z0: number; z1: number; level: number }

function inside(r: P[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
  }
  return o
}

/** Structures as a per-tile layer: each outline built by the tile its centre is in, whole. */
export function bridgeStructuresLayer(scene: Scene, pkg: Pick<CityPackage, 'areas' | 'water'>, terrain: Terrain, drop: number,
  styles: Record<string, StructureStyle>, covered?: (id: number) => boolean, overWater: StructureStyle = DEFAULT_OVER_WATER): TileLayer {
  const bodies = wholeWater(pkg)
  const levels = waterLevels(bodies, (x, z) => terrain.heightAt(x, z), drop)
  const water: Water[] = bodies.map((a, k) => {
    const ring = unpackPoints(a.ring)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    return { ring, holes: (a.holes ?? []).map(unpackPoints), x0, x1, z0, z1, level: levels[k] }
  })
  const wetAt = (x: number, z: number): number | null => {
    let lv: number | null = null
    for (const w of water) {
      if (x < w.x0 || x > w.x1 || z < w.z0 || z > w.z1) continue
      if (inside(w.ring, x, z) && !w.holes.some((h) => inside(h, x, z))) lv = lv === null ? w.level : Math.min(lv, w.level)
    }
    return lv
  }
  return {
    name: 'bridge-structures',
    build(near, rect) {
      const out = new MeshBuilder()
      for (const b of near.tile.bridges ?? []) {
        // a bridge a landmark hand-models is drawn once, by the landmark (City.coverRaised, BUGS.md #136)
        if (covered?.(b.id)) continue
        const ring = unpackPoints(b.ring)
        if (b.name && RAIL_ARCHES.has(b.name)) {
          let ax = 0, az = 0
          for (const q of ring) { ax += q.x; az += q.z }
          ax /= ring.length; az /= ring.length
          if (ax >= rect.x0 && ax < rect.x1 && az >= rect.z0 && az < rect.z1) railArch(out, ring, near.around.rails, wetAt)
          continue
        }
        let cx = 0, cz = 0
        for (const q of ring) { cx += q.x; cz += q.z }
        cx /= ring.length
        cz /= ring.length
        if (cx < rect.x0 || cx >= rect.x1 || cz < rect.z0 || cz >= rect.z1) continue
        buildStructure(out, b, ring, near.around.edges, terrain, wetAt, styles, overWater)
      }
      if (out.triangles === 0) return []
      const m = new Mesh(`bridges:${near.key}`, scene)
      out.toVertexData().applyToMesh(m)
      const mat = cartoonMaterial(scene, 'cartoonBridge', false)
      mat.backFaceCulling = false
      m.material = mat
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}

/** Is a point inside a bridge's outline, give or take `pad`? (the ways under a structure draw only surfaces) */
export function inOutline(ring: P[], x: number, z: number, pad = 1): boolean {
  if (inside(ring, x, z)) return true
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j]
    const b = ring[i]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
    if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < pad) return true
  }
  return false
}

/** The style a bridge is drawn in, or null when it is left to the ways (no raised way on it, nothing to span). */
export function styleFor(b: PackedBridge, styles: Record<string, StructureStyle>): StructureStyle | undefined {
  return b.name ? styles[b.name] ?? styles[b.name.replace(/ - .*$/, '')] : undefined
}

/**
 * A freeway's structure is not one of these. OSM outlines the ramps of an interchange too (`man_made=bridge` round
 * each flyover on Yerba Buena Island), and a curved ramp built on its outline's long axis, with stone abutments up
 * to whatever way was nearest, stood as a saw-toothed masonry wall beside the Bay Bridge's on-ramp (2026-09-30).
 * An outline with a freeway way on it is left to the ways: each draws its own slab and piers (render/bridges.ts).
 */
export const FREEWAY_KINDS = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link', 'busway'])
/**
 * …but a road named for the bridge is the bridge (the Seine audit, 2026-10-30): OSM's `trunk` over the Pont de Neuilly is that bridge's own roadway, and it had no
 * structure at all, only a slab and a row of piers per carriageway.
 */
export const freewayKind = (e: Pick<PackedEdge, 'kind' | 'name'>): boolean => FREEWAY_KINDS.has(e.kind) && !/^Pont\b/.test(e.name ?? '')
/** bridges whose outline flares at its heads under the 45 % `straightOutline` asks, and are straight for all that (the Pont de l'Archevêché's, a T each end) */
export const FLARED_OUTLINES = new Set(["Pont de l'Archevêché"])

function buildStructure(out: MeshBuilder, b: PackedBridge, ring: P[], edges: PackedEdge[], terrain: Terrain,
  wetAt: (x: number, z: number) => number | null, styles: Record<string, StructureStyle>, waterDefault: StructureStyle = DEFAULT_OVER_WATER): void {
  const long = axisOf(ring)
  if (!long || long.L < 8 || !(straightOutline(ring) || FLARED_OUTLINES.has(b.name ?? ''))) return
  // (a slip road off the A13 at the Pont de Saint-Cloud's head is inside its outline: a bridge with a design of its own is still that bridge, and draws)
  if (!styleFor(b, styles)) for (const e of edges) {
    if (!freewayKind(e) || !isRaised(e)) continue
    const k = Math.floor(e.points.length / 4) * 2
    if (inOutline(ring, e.points[k], e.points[k + 1], 1.5)) return
  }
  // along the bridge's own ways, which is not always its long side (bridge-axis.ts `axisAlong`)
  const own: [P, P][] = []
  for (const e of edges) {
    if (!e.bridge || freewayKind(e)) continue
    const pts = unpackPoints(e.points)
    for (let i = 1; i < pts.length; i++) {
      if (inOutline(ring, (pts[i - 1].x + pts[i].x) / 2, (pts[i - 1].z + pts[i].z) / 2, 0.5)) own.push([pts[i - 1], pts[i]])
    }
  }
  const ax = axisAlong(long, own)
  const { ux, uz } = ax
  let O = ax.o
  let L = ax.L
  let hw = ax.half
  const vx = -uz
  const vz = ux
  const W = (s: number, o: number): P => ({ x: O.x + ux * s + vx * o, z: O.z + uz * s + vz * o })
  const at = (s: number, o: number, y: number): V3 => { const p = W(s, o); return [p.x, y, p.z] }

  // the deck's height along the axis, from the raised ways on it (their own heights), every metre
  const nb0 = Math.max(2, Math.ceil(L)) + 1
  let bins: (number | null)[] = new Array(nb0).fill(null)
  let lowBins: number[] = new Array(nb0).fill(Infinity)
  // every height seen in each bin: the deck is their MEDIAN, not their max — one stray way tagged a bridge at
  // 2.8 m over the Pont Alexandre III's −1 m roadway hung the iron soffit over the rider's head
  const samples: number[][] = Array.from({ length: nb0 }, () => [])
  const olo: number[] = new Array(nb0).fill(Infinity)
  const ohi: number[] = new Array(nb0).fill(-Infinity)
  let any = false
  // where the bridge carries a carriageway, its heights are the carriageway's: a footway on the Pont Alexandre
  // III's north end stands flat at 2.8 m (a bake guess) over a roadway at −3.5, and the deck rose to it
  const onIt = (e: PackedEdge): boolean => {
    const pts = unpackPoints(e.points)
    return pts.some((q) => { const x = q.x - O.x; const z = q.z - O.z; const s = x * ux + z * uz; const o = x * vx + z * vz; return s >= -1 && s <= L + 1 && Math.abs(o) <= hw + 1.5 })
  }
  const road = edges.some((e) => e.bridge && !e.foot && e.heights && onIt(e))
  for (const e of edges) {
    // every raised way gives heights (a ramp onto the bridge lies lower than its footways), but only the
    // bridge's own ways say how far the structure runs
    if (!e.heights || !isRaised(e, terrain)) continue
    /*
     * …but not a freeway crossing OVER the bridge (22nd Street's overpass on the Caltrain cut, under I-280, 2026-10-05):
     * its heights 16 m above the bridge's own went into the bins where it crosses, the median of two picked the higher,
     * and the structure rose to the freeway — a wall 16 m high across 22nd Street. A freeway draws its own deck.
     */
    if (freewayKind(e)) continue
    const own = e.bridge === true
    const pts = unpackPoints(e.points)
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const c = pts[i]
      const seg = Math.hypot(c.x - a.x, c.z - a.z)
      const k = Math.max(1, Math.ceil(seg))
      for (let j = 0; j <= k; j++) {
        const t = j / k
        const x = a.x + (c.x - a.x) * t - O.x
        const z = a.z + (c.z - a.z) * t - O.z
        const s = x * ux + z * uz
        const o = x * vx + z * vz
        if (s < -1 || s > L + 1 || Math.abs(o) > hw + 1.5) continue
        const h = e.heights[i - 1] + (e.heights[i] - e.heights[i - 1]) * t
        const bi = Math.max(0, Math.min(nb0 - 1, Math.round(s)))
        if (!road || !e.foot) {
          samples[bi].push(h)
          lowBins[bi] = Math.min(lowBins[bi], h)
        }
        if (!own) continue
        const ext = e.foot ? e.width / 2 : e.width / 2 + Math.max(0.6, e.walk)
        olo[bi] = Math.min(olo[bi], o - ext)
        ohi[bi] = Math.max(ohi[bi], o + ext)
        any = true
      }
    }
  }
  if (!any) return
  samples.forEach((v, i) => { if (v.length) { v.sort((a, b) => a - b); bins[i] = v[Math.floor(v.length / 2)] } })
  /*
   * The structure is as long and as wide as the raised ways on it, not the outline's rectangle: OSM draws
   * some outlines round a bridge's approaches and pylons too (the Pont Alexandre III's is 61 m wide), and the
   * rectangle stood a spandrel wall across the Cours la Reine and floated a deck over the Place du Pont-Neuf.
   */
  const have = olo.map((v, i) => (Number.isFinite(v) ? i : -1)).filter((i) => i >= 0)
  const kf = have[0]
  const kl = have[have.length - 1]
  if (kl - kf < 8) return
  const halves = have.map((i) => (ohi[i] - olo[i]) / 2).sort((a, b) => a - b)
  const mids = have.map((i) => (ohi[i] + olo[i]) / 2).sort((a, b) => a - b)
  const half = halves[Math.floor(halves.length / 2)]
  const mid = Math.max(-hw, Math.min(hw, mids[Math.floor(mids.length / 2)]))
  O = { x: O.x + ux * kf + -uz * mid, z: O.z + uz * kf + ux * mid }
  L = kl - kf
  hw = Math.min(hw + 0.5, half + 0.35)
  bins = bins.slice(kf, kl + 1)
  lowBins = lowBins.slice(kf, kl + 1)
  const n = bins.length
  // fill the gaps between samples
  const known = bins.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0)
  for (let i = 0; i < n; i++) {
    if (bins[i] !== null) continue
    const lo = known.filter((k) => k < i).pop()
    const hi = known.find((k) => k > i)
    bins[i] = lo === undefined ? bins[hi!] : hi === undefined ? bins[lo] : bins[lo]! + ((bins[hi]! - bins[lo]!) * (i - lo)) / (hi - lo)
  }
  const top = (s: number): number => {
    const f = Math.max(0, Math.min(n - 1, s))
    const i = Math.floor(f)
    const j = Math.min(n - 1, i + 1)
    return bins[i]! + (bins[j]! - bins[i]!) * (f - i) + 0.15
  }
  // what is under it: the river's surface where there is water, the ground elsewhere
  const groundAt = (s: number, o: number): number => {
    const p = W(s, o)
    return wetAt(p.x, p.z) ?? terrain.heightAt(p.x, p.z)
  }
  const under = (s: number): number => Math.min(groundAt(s, -hw), groundAt(s, 0), groundAt(s, hw))
  const wetUnder = (s: number): boolean => { const p = W(s, 0); return wetAt(p.x, p.z) !== null }

  // the stretches it stands clear over, where the arches go (gaps under 6 m closed)
  const open: { a: number; b: number }[] = []
  let overWater = false
  for (let s = 0; s <= L; s += 1) {
    if (wetUnder(s)) overWater = true
    if (top(s) - under(s) < 3.4) continue
    const last = open[open.length - 1]
    if (last && s - last.b <= 6) last.b = s
    else open.push({ a: s, b: s })
  }
  const style = styleFor(b, styles) ?? (overWater ? waterDefault : DEFAULT_OVER_LAND)
  const stone = style.stone ?? LIMESTONE
  const iron = style.iron ?? IRON_GREEN
  const spans = open.filter((q) => q.b - q.a >= 6)

  // the arches: shared over the open stretches by their length
  interface Arch { a: number; b: number; spring: number; rise: number }
  const arches: Arch[] = []
  const piers: { s: number; w: number; spring: number }[] = []
  if (style.kind !== 'girder') {
    const total = spans.reduce((t, q) => t + (q.b - q.a), 0)
    const want = style.spans?.length ?? style.arches ?? Math.max(1, Math.round(total / (style.span ?? 28)))
    let given = 0
    spans.forEach((q, k) => {
      const len = q.b - q.a
      const m = k === spans.length - 1 ? Math.max(1, want - given) : Math.max(1, Math.round((want * len) / total))
      given += m
      const pierW = m > 1 ? Math.max(1.8, Math.min(6, (len / m) * (style.pier ?? 0.14))) : 0
      const span = (len - (m - 1) * pierW) / m
      if (span < 3) return
      let low = Infinity
      for (let s = q.a; s <= q.b; s += 1) low = Math.min(low, under(s))
      const spring = low + 0.4
      // (each arch its share of the clear length, where they are not all alike)
      const shares = style.spans?.length === m ? style.spans : null
      const sum = shares ? shares.reduce((t, v) => t + v, 0) : m
      let a = q.a
      for (let i = 0; i < m; i++) {
        const w = ((shares ? shares[i] : 1) / sum) * (len - (m - 1) * pierW)
        const bb = a + w
        let deckMin = Infinity
        for (let t = 0; t <= 12; t++) deckMin = Math.min(deckMin, top(a + ((bb - a) * t) / 12))
        const rise = Math.max(0.8, Math.min((w / 2) * (style.rise ?? 0.5), deckMin - (style.kind === 'iron' ? 1.0 : 1.2) - spring))
        arches.push({ a, b: bb, spring, rise })
        if (i > 0) piers.push({ s: a - pierW / 2, w: pierW, spring })
        a = bb + pierW
      }
    })
  }
  const archAt = (s: number): Arch | undefined => arches.find((q) => s > q.a && s < q.b)
  const intrados = (q: Arch, s: number): number => {
    const u = (s - (q.a + q.b) / 2) / ((q.b - q.a) / 2)
    const f = style.shape === 'segment' ? 1 - u * u : Math.sqrt(Math.max(0, 1 - u * u))
    return Math.min(top(s) - 0.75, q.spring + q.rise * f)
  }
  const bottom = (s: number): number => {
    const q = archAt(s)
    return q ? Math.max(intrados(q, s), under(s)) : under(s) - 0.5
  }

  // for probes (tools/*, with ?probe in the URL): what each structure was built from
  const probing = typeof location !== 'undefined' && location.search.includes('probe')
  const dbg = probing ? ((globalThis as { __bridges?: Record<string, unknown> }).__bridges ??= {}) : {} as Record<string, unknown>
  if (probing) dbg[`${b.name ?? b.id}`] = { L: +L.toFixed(1), hw: +hw.toFixed(1), O: [+O.x.toFixed(1), +O.z.toFixed(1)], u: [+ux.toFixed(3), +uz.toFixed(3)], kind: style.kind,
    arches: arches.map((q) => [+q.a.toFixed(1), +q.b.toFixed(1), +q.spring.toFixed(1), +q.rise.toFixed(1)]),
    top: Array.from({ length: 11 }, (_, i) => +top((L * i) / 10).toFixed(1)), low: Array.from({ length: 11 }, (_, i) => +(lowBins[Math.round(((n - 1) * i) / 10)] ?? NaN).toFixed(1)) }

  const step = 0.5
  const n0 = (side: number): V3 => [vx * side, 0, vz * side]
  const quad = (p: V3[], nrm: V3, c: Rgb, tag = FIXED): void => out.quad(p, nrm, UV, c, tag)
  const lighter = (c: Rgb, k: number): Rgb => [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)]

  // ---- the faces: solid spandrel walls in stone; in iron, stone only over the abutments, a plate over the arches
  for (const side of [-1, 1]) {
    const o = side * hw
    for (let s = 0; s < L - 1e-6; s += step) {
      const s1 = Math.min(L, s + step)
      const m = (s + s1) / 2
      const q = archAt(m)
      const y0a = style.kind === 'stone' ? bottom(s) : q ? top(s) - 0.95 : bottom(s)
      const y0b = style.kind === 'stone' ? bottom(s1) : q ? top(s1) - 0.95 : bottom(s1)
      const c = style.kind === 'stone' ? stone : q ? iron : style.kind === 'girder' ? iron : stone
      const yb = (ss: number): number => style.kind === 'girder' ? Math.max(under(ss) - 0.5, top(ss) - (style.depth ?? 2.4)) : 0
      if (style.kind === 'girder') {
        quad([at(s, o, yb(s)), at(s1, o, yb(s1)), at(s1, o, top(s1)), at(s, o, top(s))], n0(side), c)
      } else {
        quad([at(s, o, y0a), at(s1, o, y0b), at(s1, o, top(s1)), at(s, o, top(s))], n0(side), c)
      }
      // the voussoirs round a stone arch: a paler ring just proud of the face
      if (style.kind === 'stone' && q && archAt(s) === q && archAt(s1) === q) {
        const r0 = intrados(q, s)
        const r1 = intrados(q, s1)
        const d = side * 0.07
        quad([at(s, o + d, r0), at(s1, o + d, r1), at(s1, o + d, Math.min(top(s1) - 0.5, r1 + 0.75)), at(s, o + d, Math.min(top(s) - 0.5, r0 + 0.75))], n0(side), lighter(stone, 1.07))
      }
      if (style.gilt && q) {
        quad([at(s, o + side * 0.05, top(s) - 0.7), at(s1, o + side * 0.05, top(s1) - 0.7), at(s1, o + side * 0.05, top(s1) - 0.35), at(s, o + side * 0.05, top(s) - 0.35)], n0(side), GOLD)
      }
    }
  }
  // the girder's soffit, and the iron arches' deck soffit
  if (style.kind !== 'stone') {
    for (let s = 0; s < L - 1e-6; s += step * 2) {
      const s1 = Math.min(L, s + step * 2)
      const d = style.kind === 'girder' ? (ss: number): number => Math.max(under(ss) - 0.5, top(ss) - (style.depth ?? 2.4)) : (ss: number): number => top(ss) - 0.95
      quad([at(s, -hw, d(s)), at(s1, -hw, d(s1)), at(s1, hw, d(s1)), at(s, hw, d(s))], [0, -1, 0], lighter(iron, 0.7))
    }
  }

  // ---- stone barrels under each arch, across the whole width
  if (style.kind === 'stone') {
    for (const q of arches) {
      for (let s = q.a; s < q.b - 1e-6; s += step / 2) {
        const s1 = Math.min(q.b, s + step / 2)
        quad([at(s, -hw, intrados(q, s)), at(s1, -hw, intrados(q, s1)), at(s1, hw, intrados(q, s1)), at(s, hw, intrados(q, s))], [0, -1, 0], lighter(stone, 0.6))
      }
    }
  }

  // ---- iron arch ribs, with posts up to the deck
  if (style.kind === 'iron') {
    const nr = Math.max(2, style.ribs ?? 4)
    for (const q of arches) {
      for (let r = 0; r < nr; r++) {
        const o = -hw + 0.5 + ((2 * hw - 1) * r) / (nr - 1)
        const outer = r === 0 || r === nr - 1
        const k = Math.max(8, Math.round((q.b - q.a) / 1.5))
        let prev: V3 | null = null
        for (let i = 0; i <= k; i++) {
          const s = q.a + ((q.b - q.a) * i) / k
          const p = at(s, o, intrados(q, s))
          if (prev) member(out, prev, p, outer ? 0.32 : 0.26, iron)
          if (outer && i % 2 === 0 && i > 0 && i < k) {
            const d = top(s) - 0.95
            if (d - p[1] > 0.3) member(out, p, at(s, o, d), 0.07, iron)
          }
          prev = p
        }
      }
    }
  }

  // ---- piers: the faces between the arches, the cutwaters, niches, bastions
  for (const p of piers) {
    const a = p.s - p.w / 2
    const bb = p.s + p.w / 2
    const g = under(p.s) - 0.5
    const yTop = style.kind === 'iron' ? top(p.s) - 0.95 : p.spring
    // the pier's own faces into the arches either side, across the width
    for (const [s, dir] of [[a, -1], [bb, 1]] as const) {
      quad([at(s, -hw, g), at(s, hw, g), at(s, hw, yTop), at(s, -hw, yTop)], [ux * dir, 0, uz * dir], lighter(stone, 0.85))
    }
    if (style.kind === 'iron') {
      // an iron bridge's stone pier stands up to the deck: its side faces
      for (const side of [-1, 1]) {
        quad([at(a, side * hw, g), at(bb, side * hw, g), at(bb, side * hw, yTop), at(a, side * hw, yTop)], n0(side), stone)
      }
    }
    if (style.cutwater && style.cutwater !== 'none') {
      for (const side of [-1, 1]) {
        const y1 = Math.min(yTop, p.spring + 1.2)
        if (style.cutwater === 'pointed') {
          const tip = W(p.s, side * (hw + p.w * 0.85))
          const l = W(a, side * hw)
          const r = W(bb, side * hw)
          for (const [u, v] of [[l, tip], [tip, r]] as const) {
            const nx = (v.z - u.z) * side
            const nz = -(v.x - u.x) * side
            const ln = Math.hypot(nx, nz) || 1
            quad([[u.x, g, u.z], [v.x, g, v.z], [v.x, y1, v.z], [u.x, y1, u.z]], [nx / ln, 0, nz / ln], stone)
          }
          const apex = W(p.s, side * hw)
          quad([[l.x, y1, l.z], [tip.x, y1, tip.z], [apex.x, y1 + p.w * 0.55, apex.z], [apex.x, y1 + p.w * 0.55, apex.z]], [vx * side * 0.6, 0.8, vz * side * 0.6], lighter(stone, 0.92))
          quad([[tip.x, y1, tip.z], [r.x, y1, r.z], [apex.x, y1 + p.w * 0.55, apex.z], [apex.x, y1 + p.w * 0.55, apex.z]], [vx * side * 0.6, 0.8, vz * side * 0.6], lighter(stone, 0.92))
        } else {
          // round: a half-drum, capped with a half-dome of three bands
          const R = p.w / 2
          const seg = 8
          for (let i = 0; i < seg; i++) {
            const t0 = (Math.PI * i) / seg
            const t1 = (Math.PI * (i + 1)) / seg
            const c0 = W(p.s - Math.cos(t0) * R, side * (hw + Math.sin(t0) * R))
            const c1 = W(p.s - Math.cos(t1) * R, side * (hw + Math.sin(t1) * R))
            const tm = (t0 + t1) / 2
            const nrm: V3 = [-Math.cos(tm) * ux + Math.sin(tm) * side * vx, 0, -Math.cos(tm) * uz + Math.sin(tm) * side * vz]
            quad([[c0.x, g, c0.z], [c1.x, g, c1.z], [c1.x, y1, c1.z], [c0.x, y1, c0.z]], nrm, stone)
            const k0 = W(p.s - Math.cos(t0) * R * 0.5, side * (hw + Math.sin(t0) * R * 0.5))
            const k1 = W(p.s - Math.cos(t1) * R * 0.5, side * (hw + Math.sin(t1) * R * 0.5))
            quad([[c0.x, y1, c0.z], [c1.x, y1, c1.z], [k1.x, y1 + R * 0.45, k1.z], [k0.x, y1 + R * 0.45, k0.z]], [nrm[0] * 0.6, 0.8, nrm[2] * 0.6], lighter(stone, 0.92))
          }
        }
        if (style.niches) {
          const ny0 = y1 + p.w * 0.7
          const ny1 = Math.min(top(p.s) - 1.2, ny0 + 2.6)
          if (ny1 - ny0 > 1) {
            const w = p.w * 0.22
            quad([at(p.s - w, side * (hw + 0.04), ny0), at(p.s + w, side * (hw + 0.04), ny0), at(p.s + w, side * (hw + 0.04), ny1), at(p.s - w, side * (hw + 0.04), ny1)], n0(side), [0.32, 0.3, 0.27])
          }
        }
        if (style.medallions) {
          // a gilt-framed N in a wreath, on the spandrel over the pier
          const y = (top(p.s) + p.spring + (arches[0]?.rise ?? 2) * 0.5) / 2
          disc(out, W(p.s, side * (hw + 0.1)), y, 1.1, side, vx, vz, GOLD)
          disc(out, W(p.s, side * (hw + 0.14)), y, 0.8, side, vx, vz, lighter(stone, 0.95))
        }
        if (style.bastions) {
          // the Pont Neuf's half-moon: the cutwater carried up to the deck as a round bay you can stand in
          // a bay over the cutwater, smaller than the pier is long, from the cutwater's cap up: the arches
          // between must still read (a first try from the water up made a colonnade of drums)
          const R = Math.min(p.w * 0.45, 2.4)
          const seg = 10
          const yb = Math.max(y1 + p.w * 0.5, top(p.s) - 3.2)
          const yt = top(p.s)
          for (let i = 0; i < seg; i++) {
            const t0 = (Math.PI * i) / seg
            const t1 = (Math.PI * (i + 1)) / seg
            const c0 = W(p.s - Math.cos(t0) * R, side * (hw + Math.sin(t0) * R))
            const c1 = W(p.s - Math.cos(t1) * R, side * (hw + Math.sin(t1) * R))
            const tm = (t0 + t1) / 2
            const nrm: V3 = [-Math.cos(tm) * ux + Math.sin(tm) * side * vx, 0, -Math.cos(tm) * uz + Math.sin(tm) * side * vz]
            quad([[c0.x, yb, c0.z], [c1.x, yb, c1.z], [c1.x, yt, c1.z], [c0.x, yt, c0.z]], nrm, stone)
            const cc = W(p.s, side * hw)
            quad([[cc.x, yt, cc.z], [c0.x, yt, c0.z], [c1.x, yt, c1.z], [cc.x, yt, cc.z]], [0, 1, 0], [0.62, 0.6, 0.56])
            // its parapet
            const k0 = W(p.s - Math.cos(t0) * (R - 0.35), side * (hw + Math.sin(t0) * (R - 0.35)))
            const k1 = W(p.s - Math.cos(t1) * (R - 0.35), side * (hw + Math.sin(t1) * (R - 0.35)))
            quad([[c0.x, yt, c0.z], [c1.x, yt, c1.z], [c1.x, yt + 1.05, c1.z], [c0.x, yt + 1.05, c0.z]], nrm, stone)
            quad([[k0.x, yt, k0.z], [k1.x, yt, k1.z], [k1.x, yt + 1.05, k1.z], [k0.x, yt + 1.05, k0.z]], [-nrm[0], 0, -nrm[2]], stone)
            quad([[c0.x, yt + 1.05, c0.z], [c1.x, yt + 1.05, c1.z], [k1.x, yt + 1.05, k1.z], [k0.x, yt + 1.05, k0.z]], [0, 1, 0], lighter(stone, 1.05))
          }
        }
      }
    }
  }

  // ---- a girder's river piers: a blade of concrete on a rounded foot, under the fascia. It carried nothing before, 150 m of deck on air (the Alma, the Garigliano)
  if (style.kind === 'girder' && (style.pierAt || style.span)) {
    const total = spans.reduce((t, q) => t + (q.b - q.a), 0)
    const at: number[] = []
    if (style.pierAt) {
      for (const f of style.pierAt) at.push(f * L)
    } else {
      for (const q of spans) {
        const m = Math.round(((q.b - q.a) / Math.max(total, 1)) * (total / style.span!))
        for (let i = 1; i < m; i++) at.push(q.a + ((q.b - q.a) * i) / m)
      }
    }
    for (const s of at) {
      const y1 = top(s) - (style.depth ?? 2.4) + 0.05
      const g = under(s) - 0.5
      if (y1 - g < 1) continue
      const pc: Rgb = style.iron === CONCRETE ? lighter(CONCRETE, 0.92) : lighter(LIMESTONE, 0.85)
      const c = W(s, 0)
      blockAt(out, c, g, y1, 0.9, Math.max(1, hw * 0.72), ux, uz, pc)
      for (const side of [-1, 1]) {
        const seg = 8
        for (let i = 0; i < seg; i++) {
          const t0 = (Math.PI * i) / seg, t1 = (Math.PI * (i + 1)) / seg
          const o = side * Math.max(1, hw * 0.72)
          const p0 = W(s - Math.cos(t0) * 0.9, o + side * Math.sin(t0) * 0.9)
          const p1 = W(s - Math.cos(t1) * 0.9, o + side * Math.sin(t1) * 0.9)
          const tm = (t0 + t1) / 2
          quad([[p0.x, g, p0.z], [p1.x, g, p1.z], [p1.x, y1, p1.z], [p0.x, y1, p0.z]], [-Math.cos(tm) * ux + Math.sin(tm) * side * vx, 0, -Math.cos(tm) * uz + Math.sin(tm) * side * vz], pc)
        }
      }
      // the Zouave stands on the Alma's pier, its foot at the level of the water, the Seine's height-gauge these two centuries
      if (style.figures) figure(out, W(s, -Math.max(1, hw * 0.72) - 0.6), g + 2.6, 3.2, BRONZE, ux, uz)
    }
  }
  // ---- the Pont Mirabeau's four bronzes, one on each side of each pier, on the cutwater's cap
  if (style.figures && style.kind !== 'girder') {
    for (const p of piers) {
      for (const side of [-1, 1]) {
        const y0 = p.spring + 1.2 + p.w * 0.4
        blockAt(out, W(p.s, side * (hw + p.w * 0.25)), y0 - 0.5, y0, p.w * 0.28, p.w * 0.28, ux, uz, stone)
        figure(out, W(p.s, side * (hw + p.w * 0.25)), y0, 3.4, BRONZE, ux, uz)
      }
    }
  }
  // ---- the Pont d'Iéna's horsemen: a Gallic, a Greek, a Roman and an Arab warrior on tall plinths, at the four corners
  if (style.horsemen) {
    for (const s of [1.5, L - 1.5]) {
      for (const side of [-1, 1]) {
        const c = W(s, side * (hw - 1.4))
        const g = top(s)
        blockAt(out, c, g, g + 2.4, 2.1, 1.1, ux, uz, stone)
        blockAt(out, c, g + 2.4, g + 2.65, 2.25, 1.25, ux, uz, lighter(stone, 1.06))
        const inward = s < L / 2 ? 1 : -1
        const P = (a: number, o: number, y: number): V3 => [c.x + ux * a * inward + vx * o, g + 2.65 + y, c.z + uz * a * inward + vz * o]
        member(out, P(-1, 0, 1.15), P(0.85, 0, 1.3), 0.38, BRONZE)              // the horse's barrel
        member(out, P(0.85, 0, 1.3), P(1.35, 0, 2.05), 0.2, BRONZE)             // neck
        member(out, P(1.35, 0, 2.05), P(1.75, 0, 1.85), 0.13, BRONZE)           // head
        for (const o of [-0.22, 0.22]) {
          member(out, P(-0.85, o, 1.05), P(-0.95, o, 0), 0.09, BRONZE)
          member(out, P(0.75, o, 1.05), P(0.85, o, 0), 0.09, BRONZE)
        }
        member(out, P(-0.05, 0, 1.55), P(0.05, 0, 2.4), 0.2, BRONZE)            // the rider
        member(out, P(0.05, 0, 2.4), P(0.05, 0, 2.7), 0.13, BRONZE)
      }
    }
  }
  // ---- the Pont Alexandre III: at the crown of the arch, on each face, gilded nymphs round the arms of the Seine and of the Neva
  if (style.nymphs) {
    for (const side of [-1, 1]) {
      const mid = L / 2
      const o = side * (hw + 0.12)
      disc(out, W(mid, o), top(mid) - 1.6, 1.3, side, vx, vz, GOLD)
      disc(out, W(mid, o + side * 0.04), top(mid) - 1.6, 0.85, side, vx, vz, lighter(iron, 1.2))
      for (const dir of [-1, 1]) {
        // the two reclining figures and their garland, swept back along the fascia
        member(out, at(mid + dir * 1.6, o, top(mid) - 1.7), at(mid + dir * 4.2, o, top(mid) - 1.1), 0.22, GOLD)
        member(out, at(mid + dir * 4.2, o, top(mid) - 1.1), at(mid + dir * 5, o, top(mid) - 0.8), 0.14, GOLD)
        member(out, at(mid + dir * 1.8, o, top(mid) - 2.3), at(mid + dir * 7.5, o, top(mid) - 1.6), 0.09, GOLD)
      }
    }
  }

  // ---- the deck's own top across its width, under the LOWEST way's surface there (the highest put it over a
  // carriageway lying lower than its pavements, and the rider under it): no gap between the ways
  const low = (s: number): number => {
    const i = Math.max(0, Math.min(n - 1, Math.round(s)))
    const v = lowBins[i]
    return Number.isFinite(v) ? v : top(s) - 0.15
  }
  for (let s = 0; s < L - 1e-6; s += 1) {
    const s1 = Math.min(L, s + 1)
    quad([at(s, -hw, low(s) - 0.08), at(s1, -hw, low(s1) - 0.08), at(s1, hw, low(s1) - 0.08), at(s, hw, low(s) - 0.08)], [0, 1, 0], style.timber ? [0.5, 0.38, 0.26] : [0.5, 0.49, 0.46])
  }

  // ---- the cornice, the parapets, the mascarons
  const para = style.parapet ?? 'stone'
  for (const side of [-1, 1]) {
    const o = side * hw
    const pr = side * 0.28
    // cornice: a band proud of the face under the parapet
    if (style.kind !== 'girder') {
      for (let s = 0; s < L - 1e-6; s += 1) {
        const s1 = Math.min(L, s + 1)
        const c = lighter(style.kind === 'iron' && archAt(s + 0.5) ? iron : stone, 1.04)
        quad([at(s, o + pr, top(s) - 0.45), at(s1, o + pr, top(s1) - 0.45), at(s1, o + pr, top(s1) - 0.05), at(s, o + pr, top(s) - 0.05)], n0(side), c)
        quad([at(s, o, top(s) - 0.05), at(s1, o, top(s1) - 0.05), at(s1, o + pr, top(s1) - 0.05), at(s, o + pr, top(s) - 0.05)], [0, 1, 0], c)
        quad([at(s, o, top(s) - 0.45), at(s1, o, top(s1) - 0.45), at(s1, o + pr, top(s1) - 0.45), at(s, o + pr, top(s) - 0.45)], [0, -1, 0], lighter(c, 0.7))
      }
    }
    if (style.mascarons) {
      for (let s = 0.6; s < L - 0.5; s += 1.1) {
        const c = W(s, o + side * 0.18)
        const y = top(s) - 0.72
        blockAt(out, c, y, y + 0.32, 0.17, 0.16, ux, uz, lighter(stone, 0.8))
      }
    }
    // the parapet itself, standing on the deck's edge
    const inner = o - side * 0.35
    if (para === 'iron') {
      for (let s = 0; s < L - 1e-6; s += 1) {
        const s1 = Math.min(L, s + 1)
        for (const y of [0.1, 1.0]) {
          quad([at(s, o - side * 0.05, top(s) + y), at(s1, o - side * 0.05, top(s1) + y), at(s1, o - side * 0.05, top(s1) + y + 0.06), at(s, o - side * 0.05, top(s) + y + 0.06)], n0(side), iron)
        }
        for (let t = s; t < s1 - 1e-6; t += 0.14) {
          const c = W(t, o - side * 0.05)
          quad([[c.x - ux * 0.012, top(t) + 0.1, c.z - uz * 0.012], [c.x + ux * 0.012, top(t) + 0.1, c.z + uz * 0.012], [c.x + ux * 0.012, top(t) + 1.0, c.z + uz * 0.012], [c.x - ux * 0.012, top(t) + 1.0, c.z - uz * 0.012]], n0(side), iron)
        }
      }
      for (let s = 0; s <= L; s += 2.4) blockAt(out, W(s, o - side * 0.05), top(s), top(s) + 1.08, 0.05, 0.05, ux, uz, iron)
    } else {
      // stone: a plinth, then balusters or a solid wall, then the coping; dies every four metres
      for (let s = 0; s < L - 1e-6; s += 1) {
        const s1 = Math.min(L, s + 1)
        const solid = para === 'stone'
        const h0 = solid ? 1.0 : 0.22
        quad([at(s, o, top(s)), at(s1, o, top(s1)), at(s1, o, top(s1) + h0), at(s, o, top(s) + h0)], n0(side), stone)
        quad([at(s, inner, top(s)), at(s1, inner, top(s1)), at(s1, inner, top(s1) + h0), at(s, inner, top(s) + h0)], n0(-side), lighter(stone, 0.95))
        if (!solid) {
          for (let t = s + 0.16; t < s1; t += 0.33) {
            const c = W(t, o - side * 0.17)
            baluster(out, c, top(t) + 0.22, top(t) + 0.86, ux, uz, stone)
          }
        }
        // the coping
        const y = top(s) + (solid ? 1.0 : 0.86)
        const y1 = top(s1) + (solid ? 1.0 : 0.86)
        quad([at(s, o + side * 0.04, y + 0.13), at(s1, o + side * 0.04, y1 + 0.13), at(s1, inner - side * 0.04, y1 + 0.13), at(s, inner - side * 0.04, y + 0.13)], [0, 1, 0], lighter(stone, 1.06))
        if (!solid) {
          quad([at(s, o + side * 0.04, y), at(s1, o + side * 0.04, y1), at(s1, o + side * 0.04, y1 + 0.13), at(s, o + side * 0.04, y + 0.13)], n0(side), lighter(stone, 1.03))
          quad([at(s, inner - side * 0.04, y), at(s1, inner - side * 0.04, y1), at(s1, inner - side * 0.04, y1 + 0.13), at(s, inner - side * 0.04, y + 0.13)], n0(-side), lighter(stone, 1.03))
          quad([at(s, o + side * 0.04, y), at(s1, o + side * 0.04, y1), at(s1, inner - side * 0.04, y1), at(s, inner - side * 0.04, y)], [0, -1, 0], lighter(stone, 0.8))
        }
      }
      if (para === 'balustrade') {
        for (let s = 0; s <= L; s += 4) blockAt(out, W(s, o - side * 0.18), top(s), top(s) + 1.02, 0.3, 0.24, ux, uz, lighter(stone, 1.02))
      }
    }
  }

  // ---- lamps: at the ends, over every pier, and between where the spacing is long
  const lamp = style.lamps ?? 'lantern'
  if (lamp !== 'none') {
    const spots = new Set<number>([2, L - 2, ...piers.map((p) => p.s)])
    const sorted = [...spots].sort((a, b) => a - b)
    const every = lamp === 'candelabra' && style.pylons ? 12 : 22
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i] - sorted[i - 1]
      const k = Math.floor(gap / every)
      for (let j = 1; j <= k; j++) spots.add(sorted[i - 1] + (gap * j) / (k + 1))
    }
    for (const s of spots) {
      for (const side of [-1, 1]) {
        const off = side * (hw - (para === 'iron' ? 0.35 : 0.18))
        lampAt(out, W(s, off), top(s) + (para === 'iron' ? 0 : 1.02), lamp, iron)
      }
    }
  }

  // ---- Bir-Hakeim's upper deck: the métro viaduct on its colonnade of paired iron posts down the middle, with
  // the cast-iron arcade between them (the rail itself is drawn by the rail deck; this is the bridge's own)
  if (style.metroDeck) {
    const { height, width } = style.metroDeck
    const hwm = width / 2
    for (let s = 2; s <= L - 2 + 1e-6; s += 4) {
      for (const side of [-1, 1]) {
        const c = W(s, side * (hwm - 0.4))
        blockAt(out, c, top(s), top(s) + height, 0.18, 0.18, ux, uz, iron)
        // an arch between this post and the next, under the deck
        if (s + 4 <= L - 2 + 1e-6) {
          const n = 6
          let prev: V3 | null = null
          for (let k = 0; k <= n; k++) {
            const t = k / n
            const ss = s + 4 * t
            const p = at(ss, side * (hwm - 0.4), top(ss) + height - 1.1 + Math.sin(Math.PI * t) * 0.8)
            if (prev) member(out, prev, p, 0.07, iron)
            prev = p
          }
        }
      }
    }
    for (let s = 0; s < L - 1e-6; s += 1) {
      const s1 = Math.min(L, s + 1)
      quad([at(s, -hwm, top(s) + height), at(s1, -hwm, top(s1) + height), at(s1, hwm, top(s1) + height), at(s, hwm, top(s) + height)], [0, -1, 0], lighter(iron, 0.8))
      for (const side of [-1, 1]) {
        quad([at(s, side * hwm, top(s) + height), at(s1, side * hwm, top(s1) + height), at(s1, side * hwm, top(s1) + height + 0.9), at(s, side * hwm, top(s) + height + 0.9)], n0(side), iron)
      }
      quad([at(s, -hwm, top(s) + height + 0.9), at(s1, -hwm, top(s1) + height + 0.9), at(s1, hwm, top(s1) + height + 0.9), at(s, hwm, top(s) + height + 0.9)], [0, 1, 0], lighter(iron, 1.2))
    }
  }

  // ---- the Pont Alexandre III's pylons: stone shafts at the four corners, a gilded group on each
  if (style.pylons) {
    const { height, width } = style.pylons
    for (const s of [width / 2 + 0.5, L - width / 2 - 0.5]) {
      for (const side of [-1, 1]) {
        const c = W(s, side * (hw + width / 2 - 0.6))
        const g = top(s) - 1
        blockAt(out, c, g, g + 1.6, width / 2 + 0.3, width / 2 + 0.3, ux, uz, lighter(stone, 0.95))
        blockAt(out, c, g + 1.6, g + height - 1.2, width / 2, width / 2, ux, uz, stone)
        blockAt(out, c, g + height - 1.2, g + height - 0.6, width / 2 + 0.25, width / 2 + 0.25, ux, uz, lighter(stone, 1.05))
        // the gilded group: a Renommée astride a rearing winged horse, facing out along the bridge
        const gy = g + height - 0.6
        const out2 = s < L / 2 ? -1 : 1
        const P = (a: number, o: number, y: number): [number, number, number] => [c.x + ux * a * out2 + vx * o, gy + y, c.z + uz * a * out2 + vz * o]
        member(out, P(-0.6, 0, 1.0), P(0.7, 0, 1.9), 0.42, GOLD)                                  // the body, rearing
        member(out, P(0.7, 0, 1.9), P(1.1, 0, 2.9), 0.25, GOLD)                                   // neck
        member(out, P(1.1, 0, 2.9), P(1.45, 0, 2.7), 0.16, GOLD)                                  // head
        for (const o of [-0.25, 0.25]) {
          member(out, P(-0.5, o, 0.8), P(-0.6, o, 0), 0.11, GOLD)                               // hind legs
          member(out, P(0.7, o, 1.6), P(1.1, o, 1.2), 0.1, GOLD)                                // forelegs, raised
          member(out, P(1.1, o, 1.2), P(1.25, o, 1.6), 0.09, GOLD)
        }
        for (const o of [-1, 1]) {
          // the wings, swept up and back
          member(out, P(0.2, o * 0.3, 2.1), P(-0.4, o * 1.3, 3.2), 0.12, GOLD)
          member(out, P(-0.4, o * 1.3, 3.2), P(-1.2, o * 1.1, 3.6), 0.08, GOLD)
          member(out, P(0.2, o * 0.3, 2.1), P(-0.9, o * 0.9, 2.5), 0.1, GOLD)
        }
        member(out, P(0.1, 0, 2.3), P(0.1, 0, 3.4), 0.2, GOLD)                                    // the rider
        member(out, P(0.1, 0, 3.2), P(0.6, 0, 4.2), 0.06, GOLD)                                   // her raised trumpet arm
        // the smaller bronze figure at its foot, on the roadway side
        const f = W(s, side * (hw + width / 2 - 0.6 - width / 2 - 0.4))
        blockAt(out, f, g + 1.6, g + 3.6, 0.45, 0.6, ux, uz, [0.3, 0.34, 0.3])
      }
    }
  }
}

/** An upright block turned along (ux, uz), from y0 to y1, half-extents a (along) and c (across). */
function blockAt(out: MeshBuilder, p: P, y0: number, y1: number, a: number, c: number, ux: number, uz: number, col: Rgb, tag = FIXED): void {
  const vx = -uz
  const vz = ux
  const k = (sa: number, sc: number, y: number): V3 => [p.x + ux * a * sa + vx * c * sc, y, p.z + uz * a * sa + vz * c * sc]
  const faces: [V3[], V3][] = [
    [[k(-1, 1, y0), k(1, 1, y0), k(1, 1, y1), k(-1, 1, y1)], [vx, 0, vz]],
    [[k(1, -1, y0), k(-1, -1, y0), k(-1, -1, y1), k(1, -1, y1)], [-vx, 0, -vz]],
    [[k(1, 1, y0), k(1, -1, y0), k(1, -1, y1), k(1, 1, y1)], [ux, 0, uz]],
    [[k(-1, -1, y0), k(-1, 1, y0), k(-1, 1, y1), k(-1, -1, y1)], [-ux, 0, -uz]],
    [[k(-1, -1, y1), k(-1, 1, y1), k(1, 1, y1), k(1, -1, y1)], [0, 1, 0]],
  ]
  for (const [q, n] of faces) out.quad(q, n, UV, col, tag)
}

/** A turned stone baluster: a square foot, a swelling body, a square cap — three blocks. */
function baluster(out: MeshBuilder, p: P, y0: number, y1: number, ux: number, uz: number, col: Rgb): void {
  const h = y1 - y0
  blockAt(out, p, y0, y0 + h * 0.15, 0.08, 0.08, ux, uz, col)
  blockAt(out, p, y0 + h * 0.15, y0 + h * 0.8, 0.065, 0.065, ux, uz, col)
  blockAt(out, p, y0 + h * 0.8, y1, 0.08, 0.08, ux, uz, col)
}

/** A square member between two points, for iron ribs and posts. */
function member(out: MeshBuilder, a: V3, b: V3, r: number, c: Rgb): void {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  const l = Math.hypot(dx, dy, dz) || 1
  // a side vector: horizontal, across the member
  let sx = -dz
  let sz = dx
  const hl = Math.hypot(sx, sz)
  if (hl < 1e-6) { sx = 1; sz = 0 } else { sx /= hl; sz /= hl }
  // and up, across it the other way: side × direction
  const ux = (sz * dy) / l
  const uy = (sx * dz - sz * dx) / l
  const uz = (-sx * dy) / l
  const v = (p: V3, s: number, u: number): V3 => [p[0] + (sx * s + ux * u) * r, p[1] + uy * u * r, p[2] + (sz * s + uz * u) * r]
  const faces: [number, number, number, number, V3][] = [
    [-1, 1, 1, 1, [ux, uy, uz]], [1, -1, -1, -1, [-ux, -uy, -uz]],
    [-1, -1, -1, 1, [-sx, 0, -sz]], [1, 1, 1, -1, [sx, 0, sz]],
  ]
  for (const [s0, u0, s1, u1, n] of faces) out.quad([v(a, s0, u0), v(b, s0, u0), v(b, s1, u1), v(a, s1, u1)], n, UV, c, FIXED)
}

/** A standing figure on a plinth's top, from a handful of members: enough to read as a bronze at a boat's distance. */
function figure(out: MeshBuilder, p: P, y: number, h: number, col: Rgb, ux: number, uz: number): void {
  const at_ = (a: number, c: number, yy: number): V3 => [p.x + ux * a - uz * c, y + yy, p.z + uz * a + ux * c]
  member(out, at_(0, -0.14 * h / 3, 0), at_(0, -0.1 * h / 3, h * 0.46), 0.1 * h / 3, col)
  member(out, at_(0, 0.14 * h / 3, 0), at_(0, 0.1 * h / 3, h * 0.46), 0.1 * h / 3, col)
  member(out, at_(0, 0, h * 0.44), at_(0, 0, h * 0.8), 0.19 * h / 3, col)
  member(out, at_(0, 0, h * 0.8), at_(0, 0, h * 0.97), 0.12 * h / 3, col)
  member(out, at_(0, -0.2 * h / 3, h * 0.78), at_(0.12, -0.34 * h / 3, h * 0.46), 0.07 * h / 3, col)
  member(out, at_(0, 0.2 * h / 3, h * 0.78), at_(0.12, 0.34 * h / 3, h * 0.46), 0.07 * h / 3, col)
}

/** A flat disc on a face (a medallion), facing out along ±(vx, vz). */
function disc(out: MeshBuilder, c: P, y: number, r: number, side: number, vx: number, vz: number, col: Rgb): void {
  const ax = vz
  const az = -vx
  const seg = 12
  for (let i = 0; i < seg; i += 2) {
    const pt = (k: number): V3 => { const t = (Math.PI * 2 * k) / seg; return [c.x + ax * Math.cos(t) * r, y + Math.sin(t) * r, c.z + az * Math.cos(t) * r] }
    out.quad([pt(i), pt(i + 1), pt(i + 2), [c.x, y, c.z]], [vx * side, 0, vz * side], UV, col, FIXED)
  }
}

/** A lamp standard on the parapet: a lantern on a post, a candelabra of three, or a plain modern mast. */
function lampAt(out: MeshBuilder, p: P, y: number, kind: 'lantern' | 'candelabra' | 'modern', iron: Rgb): void {
  const dark: Rgb = [iron[0] * 0.7, iron[1] * 0.7, iron[2] * 0.7]
  const glass: Rgb = [1.0, 0.92, 0.7]
  if (kind === 'modern') {
    blockAt(out, p, y, y + 6.5, 0.07, 0.07, 1, 0, [0.4, 0.42, 0.43])
    blockAt(out, p, y + 6.5, y + 6.7, 0.35, 0.12, 1, 0, [0.4, 0.42, 0.43])
    blockAt(out, p, y + 6.42, y + 6.5, 0.3, 0.09, 1, 0, glass, EMIT)
    return
  }
  blockAt(out, p, y, y + 0.5, 0.18, 0.18, 1, 0, dark)
  blockAt(out, p, y + 0.5, y + 3.4, 0.065, 0.065, 1, 0, dark)
  const lantern = (q: P, yy: number): void => {
    blockAt(out, q, yy, yy + 0.08, 0.16, 0.16, 1, 0, dark)
    blockAt(out, q, yy + 0.08, yy + 0.55, 0.14, 0.14, 1, 0, glass, EMIT)
    blockAt(out, q, yy + 0.55, yy + 0.68, 0.19, 0.19, 1, 0, dark)
    blockAt(out, q, yy + 0.68, yy + 0.8, 0.08, 0.08, 1, 0, dark)
  }
  if (kind === 'lantern') {
    lantern(p, y + 3.4)
    return
  }
  // the candelabra: a crossbar and three lanterns
  blockAt(out, p, y + 3.2, y + 3.28, 0.55, 0.04, 1, 0, dark)
  for (const dx of [-0.5, 0.5]) lantern({ x: p.x + dx, z: p.z }, y + 3.28)
  lantern(p, y + 3.5)
}
