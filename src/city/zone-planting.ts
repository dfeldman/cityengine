/**
 * Planting by ZONE (docs/MAP-FORMAT.md §7): what grows at a point is whatever the zones over it say — never a rule
 * keyed on a city's or a park's name. The owner, 2026-09-28: zones "should have a lot of flexibility (eg 30% palms,
 * 70% deciduous trees, tropical shrubs) to represent the plant diversity of the area."
 *
 * Resolution is PER KEY: for each of `wood`, `lawn`, `street`, `shrubs` the highest-priority zone over the point
 * that says anything about it answers. So a zone can speak about one thing — Sausalito says only "no register
 * here, invent the street rows" — and take everything else from the zones beneath it. `park` is the one pairing:
 * the highest zone that says `park` OR `wood` answers with its `park ?? wood`, because a zone like Golden Gate
 * Park's means "the park here IS forest", and must not fall through to a city-wide ordinary park beneath it.
 *
 * Code frame: x east, z north, metres.
 */
import type { ParkRule, ParkSpot } from './park-planting.ts'
import type { TreeForm } from './tree-forms.ts'
import type { PlantSpot, StreetPlant, ZonePlant } from '../map/format.ts'
import { inRing, type LocalZone } from '../map/zones.ts'

const CELL = 250

/** The zones that have anything to say about planting, bucketed for the millions of lookups a bake makes. */
export class PlantZones {
  private readonly cells = new Map<string, LocalZone[]>()
  readonly count: number

  constructor(zones: LocalZone[]) {
    const planted = zones.filter((z) => z.props.plant).sort((a, b) => b.priority - a.priority)
    this.count = planted.length
    for (const zn of planted) {
      const [x0, z0, x1, z1] = zn.bbox
      for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) {
        for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) {
          const k = `${i},${j}`
          const l = this.cells.get(k)
          if (l) l.push(zn)
          else this.cells.set(k, [zn])
        }
      }
    }
  }

  /** the planting zones over a point, highest priority first */
  at(x: number, z: number): ZonePlant[] {
    const out: ZonePlant[] = []
    for (const zn of this.cells.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) ?? []) {
      const [x0, z0, x1, z1] = zn.bbox
      if (x < x0 || x > x1 || z < z0 || z > z1 || !inRing(zn.ring, x, z)) continue
      out.push(zn.props.plant!)
    }
    return out
  }

  wood(x: number, z: number): PlantSpot | null { return this.at(x, z).find((p) => p.wood)?.wood ?? null }
  lawn(x: number, z: number): PlantSpot | null { return this.at(x, z).find((p) => p.lawn)?.lawn ?? null }
  park(x: number, z: number): PlantSpot | null {
    const p = this.at(x, z).find((q) => q.park || q.wood)
    return p ? (p.park ?? p.wood ?? null) : null
  }
  /** street trees here: 'register', an invented-row rule, or false; undefined where no zone says */
  street(x: number, z: number): StreetPlant | undefined {
    for (const p of this.at(x, z)) if (p.street !== undefined) return p.street
    return undefined
  }
  shrubs(x: number, z: number): ZonePlant['shrubs'] | undefined { return this.at(x, z).find((p) => p.shrubs)?.shrubs }
  /** every zone's shrub rule, for loading the models they name */
  allShrubs(): NonNullable<ZonePlant['shrubs']>[] {
    const out: NonNullable<ZonePlant['shrubs']>[] = []
    for (const l of this.cells.values()) for (const zn of l) if (zn.props.plant?.shrubs && !out.includes(zn.props.plant.shrubs)) out.push(zn.props.plant.shrubs)
    return out
  }
}

const asSpot = (s: PlantSpot): ParkSpot => ({
  density: s.density, clump: s.clump,
  species: s.species.map((q) => ({ form: q.form as TreeForm, weight: q.weight, h: q.h })),
  ...(s.trailside ? { trailside: true } : {}),
})

/**
 * The park pass's rule (city/park-planting.ts `ParkRule`) from zones: `grass` is a lawn, `wood` forest, `park` the
 * zone's park planting. Null where no zone says — that ground is left as it is.
 */
export function zonePlantRule(zones: PlantZones): ParkRule {
  // the same PlantSpot object answers for a whole zone, so its ParkSpot is converted once
  const memo = new WeakMap<PlantSpot, ParkSpot>()
  const conv = (s: PlantSpot | null): ParkSpot | null => {
    if (!s) return null
    let v = memo.get(s)
    if (!v) { v = asSpot(s); memo.set(s, v) }
    return v
  }
  return (x, z, kind) => conv(kind === 'grass' ? zones.lawn(x, z) : kind === 'wood' ? zones.wood(x, z) : zones.park(x, z))
}
