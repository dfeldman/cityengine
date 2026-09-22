/**
 * What a region plants (render/vegetation.ts): the species of its street trees and its park trees with their
 * weights, the procedural species it adds (palms: render/palms.ts), and where those go. Each region's is in its own
 * file (render/paris/flora.ts, render/sf/flora.ts); a region without one gets the default here.
 */
import type { PalmKind } from './palms.ts'

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
}

// Street trees are SMALL. A poplar or a mature elm on a pavement is a forest giant leaning over the road;
// what a city actually plants is something that stays under the windows of the first floor.
export const DEFAULT_FLORA: Flora = {
  street: [['maple', 4], ['birch', 3], ['ash', 3], ['beech', 1]],
  park: [['oak', 4], ['beech', 3], ['birch', 3], ['maple', 3], ['willow', 1]],
}
