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
  /** Argonaut Hotel: civic, historic hotel. No photo; 1900s–1920s terracotta era guess. */
  argonautHotel: fromRecipe('edwardian-terracotta', {}),
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
  /** Clay Theatre: civic, historic cinema at Fillmore and Clay. No photo; 1900s–1920s terracotta era guess. */
  clayTheatre: fromRecipe('edwardian-terracotta', {}),
  /** Dining Hall: civic, likely campus/institutional building. No photo; 1900s–1920s terracotta era guess. */
  diningHall: fromRecipe('edwardian-terracotta', {}),
  /** Dolphin Club: civic, historic swimming club at North Beach. No photo; 1900s–1920s terracotta era guess. */
  dolphinClub: fromRecipe('edwardian-terracotta', {}),
  /** East Ping Yuen: civic, Chinese American residential/community building. No photo; 1960s-80s postwar guess. */
  eastPingYuen: fromRecipe('hotel-punched', {}),
  /** Ferry Station Post Office Building: civic, federal building at Ferry Building area. No photo; 1900s–1920s terracotta era guess. */
  /** Former Military Chapel: civic, historic religious building. No photo; 1900s–1920s terracotta era guess. */
  formerMilitaryChapel: fromRecipe('chicago-block', {}),
  /** Galleria Park Hotel: civic, historic hotel at Kearny and Post. No photo; 1900s–1920s terracotta era guess. */
  galleriaParallelHotel: fromRecipe('edwardian-terracotta', {}),
  /** Golden Gate Club: civic, historic social club. No photo; 1900s–1920s terracotta era guess. */
  goldenGateClub: fromRecipe('edwardian-terracotta', {}),
  /** Green Tortoise Hostel: civic, 1970s budget hostel at Taylor and Bay. No photo; 1960s-80s commercial slab guess. */
  greenTortoiseHostel: fromRecipe('hotel-punched', {}),
  /** HI San Francisco Fisherman's Wharf: civic, 1970s hostel at Fisherman's Wharf. No photo; 1960s-80s commercial guess. */
  hiSanFranciscoFishermansWharf: fromRecipe('hotel-punched', {}),
  /** Harbor Court Hotel: civic, historic hotel at stud and Mission. No photo; 1900s–1920s terracotta era guess. */
  harborCourtHotel: fromRecipe('edwardian-terracotta', {}),
  /** Health Right 60: civic, modern health facility. No photo; 2000s contemporary guess. */
  healthRight60: fromRecipe('glass-tower', { height: 20 }),
  /** Hilton San Francisco Union Square: civic, major hotel at Post and Mason. No photo; 1960s-80s commercial hotel guess. */
  hiltonSanFranciscoUnionSquare: fromRecipe('hotel-punched', { height: 35 }),
  /** Hotel Riu Plaza Fisherman's Wharf: civic, modern hotel at Bay and Stockton. No photo; 1960s-80s commercial hotel guess. */
  hotelRiuPlazaFishermansWharf: fromRecipe('hotel-punched', { height: 30 }),
  /** Hotel Triton: civic, boutique hotel at Grant and Geary. No photo; 1990s contemporary guess. */
  hotelTriton: fromRecipe('glass-tower', { height: 25 }),
  /** Hotel Union: civic, historic hotel in downtown. No photo; 1900s–1920s terracotta era guess. */
  hotelUnion: fromRecipe('edwardian-terracotta', {}),
  /** Hotel VIA: civic, modern hotel near Ferry Building. No photo; 1990s contemporary guess. */
  // owner, 2026-10-15: a two-storey lobby, ten floors of rooms and a mechanical floor on top — about 44 m, not 22
  hotelVia: fromRecipe('glass-tower', { height: 44 }),
  /** Inn at the Presidio: civic, historic inn at Presidio Officers' Club. No photo; 1900s–1920s terracotta era guess. */
  innAtThePresidio: fromRecipe('edwardian-terracotta', {}),
  /** Julius' Castle: civic, historic mansion/restaurant in Telegraph Hill. No photo; 1920s–1930s era guess. */
  juliesCastle: fromRecipe('edwardian-terracotta', {}),
  /** Langley Porter Psychiatric Institute: civic, medical facility on Parnassus. No photo; 1960s-80s concrete guess. */
  langleyPorterPsychiatricInstitute: fromRecipe('concrete-piers', { height: 30 }),
}
