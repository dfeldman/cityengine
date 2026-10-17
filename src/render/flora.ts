/**
 * What a region plants (render/vegetation.ts): the species of its street trees and its park trees with their
 * weights, the procedural species it adds (palms: render/palms.ts), and where those go. Each region's is in its own
 * file (render/paris/flora.ts, render/sf/flora.ts); a region without one gets the default here.
 */
import type { PalmKind } from './palms.ts'
import type { TreeForm } from '../city/tree-forms.ts'

export interface Flora {
  /** library species (public/trees/index.json) and relative weights */
  street: [string, number][]
  park: [string, number][]
  /** generated species, each with how many models to make */
  palms?: { kind: PalmKind; models: number }[]
  /**
   * Where a planting is a palm rather than a library tree: a 0..1 chance by place (local metres), e.g. 0.9 along
   * the Embarcadero, 0.3 in the Marina, 0 elsewhere. The choice is still by the planting's own hash, so it is
   * the same tree every session.
   */
  palmChance?: (x: number, z: number) => number
  /**
   * A FORM for a planting the bake knew none for (an untyped OSM tree), by place: the trees someone has looked at in a
   * photograph — Pier 27's three Monterey cypresses on the cruise terminal lawn were palms by `palmChance`. Null: as before.
   */
  formAt?: (x: number, z: number) => TreeForm | null
  /** another tree library beside public/trees, by its folder under public/: the region's own species (SF: sftrees) */
  library?: string
  /**
   * What draws each FORM (city/tree-forms.ts), where the bake knew a planting's: `[species, weight]`, a species
   * being a library tree's, or `palm:<kind>` for a generated palm. A form with nothing here falls back to the
   * street and park pools. A planting with a form never goes through `palmChance`: it is what it is.
   */
  forms?: Partial<Record<TreeForm, [string, number][]>>
  /** how many models a form gets (default 3): variety against load time */
  formModels?: Partial<Record<TreeForm, number>>
}

// Street trees are SMALL. A poplar or a mature elm on a pavement is a forest giant leaning over the road;
// what a city actually plants is something that stays under the windows of the first floor.
export const DEFAULT_FLORA: Flora = {
  street: [['maple', 4], ['birch', 3], ['ash', 3], ['beech', 1]],
  park: [['oak', 4], ['beech', 3], ['birch', 3], ['maple', 3], ['willow', 1]],
}
