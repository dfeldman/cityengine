/**
 * San Francisco's individually modelled buildings: h2 (SF_PLAN.md §10; the batch list is docs/sf-batches/H2-IDS.txt).
 * Modest civic and commercial buildings: lodges, small hotels, clubs, batteries, lighthouses. Most are from the
 * 1900s–1920s rebuild or the 1960s–80s commercial expansion, with no reference photographs. Recipes picked from
 * type and era; heights omitted to let the bake infer from footprint and neighbours.
 * Registered through render/landmarks/sf/index.ts; placed by public/landmarks/san-francisco/h2.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'

export const H2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Anglers Lodge: civic, small historic lodge. No photo; 1900s–1920s terracotta era guess. */
  /*
   * Battery Chamberlin and Battery Yates WERE here, as `chicago-block` recipes — a coastal gun battery
   * modelled as an apartment block, which docs/PARKS.md E1 records them being pulled from a recipe batch
   * for. Real builders now exist in `districts/batteries.ts`, and because `...H2` is spread AFTER
   * `...BATTERIES` these stale keys silently overrode them: the batteries were registered, placed, and
   * drawn as offices. Removed rather than renamed, so the duplicate cannot come back (BUGS.md #213c).
   */
  /** Building (unidentified): civic. No photo or name; generic 1900s–1920s guess. */
  buildingUnidentified: fromRecipe('edwardian-terracotta', {}),
  /** Castagnola's: civic, historic waterfront restaurant. No photo; 1960s-80s commercial era guess. */
  castagnolaS: fromRecipe('hotel-punched', {}),
  /** Dining Hall: civic, likely campus/institutional building. No photo; 1900s–1920s terracotta era guess. */
  diningHall: fromRecipe('edwardian-terracotta', {}),
  /** Ferry Station Post Office Building: civic, federal building at Ferry Building area. No photo; 1900s–1920s terracotta era guess. */
  /** Former Military Chapel: civic, historic religious building. No photo; 1900s–1920s terracotta era guess. */
  formerMilitaryChapel: fromRecipe('chicago-block', {}),
  /** Health Right 60: civic, modern health facility. No photo; 2000s contemporary guess. */
  healthRight60: fromRecipe('glass-tower', { height: 20 }),
  /** Hilton San Francisco Union Square: civic, major hotel at Post and Mason. No photo; 1960s-80s commercial hotel guess. */
  hiltonSanFranciscoUnionSquare: fromRecipe('hotel-punched', { height: 35 }),
}
