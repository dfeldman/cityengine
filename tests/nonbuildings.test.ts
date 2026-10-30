/**
 * The nonbuildings — fountains, plazas, piers, bridges, statues, art, signs — checked on every `npm test`.
 *
 * They need their own test because they fall out of the only human check this project has. `tools/review-page.ts`
 * pairs a street photograph with a render and asks "is this the right building"; there is no Mapillary frame of
 * a fountain and no right-building question to ask of a plaza, so the whole category has never been reviewed by
 * anybody. They also fail in ways a building does not — the wrong place, cutting through its neighbours, a
 * z-fighting slab, a mirrored GLB, a second entry for the same thing — and every one of those is a defect that
 * has actually been reported here (BUGS.md #66, #67, #85, #99, and now #108–#112).
 *
 * The policy is `tests/audit-builders.test.ts`'s, deliberately: **known findings are listed explicitly against
 * BUGS.md numbers, and the assertion fails in BOTH directions.** A new finding fails because it is not on the
 * list; a listed finding that stops reproducing fails because it is no longer found. The list can shrink and
 * cannot rot, and nobody can quietly stop checking.
 *
 * What is NOT here: whether any of it looks right. That is the contact sheet
 * (`npx vite-node tools/nonbuildings.ts --city=<c> --seed-views`, then
 * `node --experimental-strip-types tools/views.ts --city=<c> --group=nonbuilding`), and it is a human's job.
 */
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AUDITED, allNonbuildings, classifiedBuilders, kindOfBuilder, BUILDINGS_OK, EXPLICIT, issueKey, inspectGlb, buildIt,
} from '../tools/nonbuildings.ts'
import { namedBuilders } from '../tools/nonbuildings.ts'
import { baked } from './baked.ts'

const all = await allNonbuildings()
/** Every builder a manifest or a skyline names in the audited cities, from the audit that already loads them. */
const manifestNamed = (): string[] => [...new Set(namedBuilders())].sort()
const city = (id: string) => all.find((c) => c.city === id)!

/**
 * Every finding that reproduces today, keyed `<check> | <name>`, with the BUGS.md number it is logged under.
 * Shrink this list by fixing things; never grow it to make a run green.
 */
const KNOWN: Record<string, string[]> = {
  'paris-centre': [
    // #108 — a nonbuilding standing in its neighbours' footprints. Several of these are a monument on a place
    // whose OSM square overlaps the buildings round it, and are probably fine; they need the contact sheet.
    'intersects | Musée Carnavalet — the court',
    'intersects | Tour Saint-Jacques',
    'intersects | Opéra Bastille — the arch',
    'intersects | Tour Eiffel',
    'intersects | Louvre Pyramid',
    'intersects | Colonnes de Buren',
    'intersects | Danton',
    // the palaces family's terraced court (2026-10-29): the parvis spans the museum wings it sits between — reads right
    // in the city shot, to be claimed or trimmed on the contact sheet
    'intersects | Palais de Tokyo — the parvis',
    // #109 — the ground under it
    'height | Square Louis-XIII',
    'ground | Étienne Marcel',
    'height | Palais de Tokyo — the parvis',
    // the 2026-10-29 bake's finer ground on the parvis of Notre-Dame: 1.6 m under the statue, which its 2.4 m plinth takes
    'ground | Charlemagne et ses Leudes',
    // #110 — z-fighting candidates
    'coplanar | Square Louis-XIII',
    'coplanar | Tour Eiffel',
  ],
  'san-francisco': [
    // Embarcadero Center's podium level (2026-10-03): placed at its own datum (baseY 0, the deck 8 m over the street)
    // and spanning the blocks whose walks it lifts — the four old plaza-deck entries it replaced are gone
    'height | Embarcadero Center — podium level',
    'intersects | Embarcadero Center — podium level',
    // #108 — standing in footprints it does not claim
    'intersects | Opera Plaza courtyard',
    'intersects | Powell Street Station Canopy',
    'intersects | Redwood Park pool',
    // the mural alleys (2026-10-04): the murals are painted ON the alleys' walls, so their panels stand at the walls
    'intersects | Balmy Alley murals',
    'intersects | Clarion Alley murals',
    'intersects | Dandelion Fountain',
    // the concourse's oval spans the buildings round it at its tips (the bandshell's colonnade, the Academy's terrace) — accepted
    'intersects | Music Concourse',
    'intersects | Ghirardelli sign',
    'intersects | Union Square',
    // (two of OSM's Hearts in San Francisco stand where OSM's building outlines reach — a forecourt, a lobby's plaza)
    'intersects | My Heart',
    'intersects | Heart, Inner Richmond',
      // the garden's grounds (lanterns, fence, bridges) surround its own buildings, by design (#238)
      'intersects | Japanese Tea Garden grounds',
      // (the garden's landscape, like its grounds, is one entry over the whole garden: its box takes in the buildings)
      'intersects | Japanese Tea Garden landscape',
      // the food-truck park and the mini golf surround their own structures (OSM's, modelled), by design (#245)
      'intersects | SPARK Social SF',
      'intersects | Stagecoach Greens',
      // the round BART plaza runs up to the building south of it, as in the owner's aerial (#248)
      'intersects | 24th St Mission BART Plaza (south-west)',
      // Hallidie Plaza's 80 m box takes in both sunken halves either side of the Cyril Magnin bridge, and so the corners of
      // 1 Powell and One Hallidie Plaza that stand round them; its floors and walls stop at their fronts (#318)
      'intersects | Hallidie Plaza',
    // (Civic Center Plaza: OSM's own café at 52 Grove and the 1958 garage pay kiosk stand in it, as they do)
    'intersects | Civic Center Plaza',
    // #109 — not on the ground. The Opera Plaza courtyard's +3.80 m is a RAISED DECK and is probably right;
    // (Union Square left this list 2026-10-18: no longer draped or sunk — its levels are set from the ground, and the
    //  garage ramps that went 3.2 m down are gone)
    'height | Opera Plaza courtyard',
    'height | Union Square Market Street Headhouse',
    'height | Powell Street Station Canopy',
    "height | Cupid's Span",
    'height | Ruth Asawa Mermaid Fountain',
    // #110 — z-fighting candidates
    'coplanar | Opera Plaza courtyard',
    'coplanar | Union Square Market Street Headhouse',
    'coplanar | Powell Street Station Canopy',
    'coplanar | Oracle Park',
    'coplanar | Bush Plaza Pavilion',
    'coplanar | Golden Gate Bridge',
    // #111 — duplicates, which the claim loop structurally cannot see
        /*
     * Portsmouth Square (docs/SKYPARKS.md), 2026-09-24. The deck's own lat/lon sits inside the square, a few
     * metres from the existing Robert Louis Stevenson Memorial (sf/art.ts) — expected, not a collision, the
     * memorial genuinely stands on the square. Ground relief and the height mismatch are also expected: the
     * square is a raised deck over Portsmouth Square Garage with real hillside relief (level access from
     * Walter U Lum Place, walled on the other three sides — the whole point of the entry), and the manifest's
     * `height: 4.4` is the deck's own datum, not the pagodas' roof height, same convention as the Embarcadero
     * Center decks above.
     */
    'duplicate | Robert Louis Stevenson Memorial / Portsmouth Square — deck, pagodas and the skybridge to the Hilton',
    'intersects | Portsmouth Square — deck, pagodas and the skybridge to the Hilton',
    'height | Portsmouth Square — deck, pagodas and the skybridge to the Hilton',
    /*
     * #130 — the Yerba Buena block, where the ground is deliberately NOT where the terrain says it is.
     * Every one of these is the audit correctly describing a raised deck and a bridge over a street, and
     * each is expected rather than outstanding:
     *
     *  - `intersects`: the two decks are ground, and ground covers the footprints of the things buried
     *    under it (Moscone North and South, the YBCA halls). That is the point of them, not a defect.
     *  - `height`: the MLK memorial stands at +4 m because the lawn is at +4 m, and the enclosed skybridge
     *    at +7.6 m because it crosses Howard Street two storeys up. Both are floating ON PURPOSE, which is
     *    the one thing the `height` check cannot distinguish.
     *
     * The `duplicate | Moscone Skybridge / Moscone South Deck` finding that used to sit here is GONE, and
     * deliberately: the skybridge was standing 40 m south-west of its own OSM way (way/940154716), 43 m off
     * Howard's centre line and all but on top of the south deck. BUGS.md #136 put it on the way, where it
     * crosses the street and lands on the deck's north edge instead of overlapping its middle.
     */
    'intersects | Yerba Buena Gardens',
    /*
     * The park level of the Moscone South block. Every deck park on these two blocks overlaps the buildings
     * it stands ON, and this one overlaps NINE — among them way/109141776, capped by `mosconeSouthDeck` in
     * sf/yerba-buena.ts (its manifest entry now builds nothing — `mosconeSouthClaimed` — since the
     * `mosconeHall` preset that used to stand there was removed 2026-09-23, not lowered again), way/288716388
     * (the Children's Creativity Museum) and way/109141782 (the Bowling Center). Reported rather than
     * claimed: the entry is placed by lat/lon precisely because it is landscape over other people's
     * buildings.
     */
    "intersects | Yerba Buena Public Square and Children's Garden",
    /*
     * And 3.3 m of terrain relief under it, which is SoMa's real slope across 165 m of block, not a fault in
     * the entry: the park is a DECK, its lowest surface is `LEVELS.garden` = 4 m above the street, and the
     * level-1 Moscone hall that carries it is sf/moscone-south.ts'.
     */
    
    'intersects | Moscone South Deck',
    'intersects | Moscone Skybridge',
    'intersects | MLK Memorial Waterfall',
    'height | MLK Memorial Waterfall',
    'height | Moscone Skybridge',
    /*
     * By design (owner, 2026-10-16, with a Street View): Language of the Birds IS a flock of books hung on fine wires
     * 6-13 m over Broadway & Columbus — so its lowest vertex is far off the ground, and the flock overhangs the
     * corner's buildings as the real one does.
     */
    'height | Language of the Birds',
    /*
     * St. Mary's Cathedral plaza (BUGS.md #267): a deck on the garage roof, so it is placed by `baseY` at the deck and
     * its walls run 2.6 m down to the courts (`height` both ways); its terracotta field and star lattice are layered
     * centimetres apart by design (`coplanar`); it covers the garage and the courts (`intersects`).
     */
    "coplanar | St. Mary's Cathedral plaza",
    "height | St. Mary's Cathedral plaza",
    "height | St. Mary's Cathedral plaza",
    "intersects | St. Mary's Cathedral plaza",
    // the Chinese Hospital's sign hangs on its wall 4 m up, by design (2026-10-16)
    'height | Chinese Hospital sign',
    'intersects | Chinese Hospital sign',
    // the HILLS BROS COFFEE letters stand on the coffee works' roof, 24 m up, by design (2026-10-16)
    'height | Hills Bros. Coffee roof sign',
    'intersects | Hills Bros. Coffee roof sign',
    'intersects | Language of the Birds',
    /*
     * `coplanar` is a HEURISTIC (tools/nonbuildings.ts §coplanarSlabs) and this is a candidate, not a
     * defect. A public garden IS layered surfaces a few centimetres apart — the paved deck, the checker
     * band over it, the ring path round the lawn, the lawn itself, the walkway on the terrace garden. They
     * were spread from 1 cm to 5–14 cm apart until the flag went quiet on every pair but one; the last is
     * the ring path against the terrace walkway, 2 cm, and the renders in docs/shots/views/san-francisco/
     * show no shimmer between them. Left flagged rather than pushed further apart, because a 20 cm step
     * where a path meets a lawn is a worse defect than the one being avoided.
     */
    'coplanar | Yerba Buena Gardens',
    /*
     * The Golden Gate now has a NEAR level too (BUGS.md #211): the same builder, tessellated, placed as a
     * standalone entry at the bridge's own point, which is what takes it off the `skyline` list. What it
     * gains instead is `intersects` — like Pier 39 and the Moscone decks, a 2.7 km structure placed by
     * lat/lon stands over other people's ground by design, and its `coversRaised` footprint is exactly the
     * declaration that it does.
     */
    'intersects | Golden Gate Bridge',
    /*
     * And `coplanar`, which is the heuristic (§coplanarSlabs) counting ADJACENT roadway panels as one
     * surface, not two surfaces fighting. The deck is laid in 61 m groups along 2.7 km, and #211 flattened
     * its sag from 2.5 m to 0.55 m to meet the ride graph's own near-flat height profile — so neighbouring
     * groups now sit within the heuristic's 1 cm bucket and are counted together. They are end to end, not
     * one over the other; there is nothing for the depth buffer to choose between.
     */
    'coplanar | Golden Gate Bridge',
    // (#112, the Bay Bridge far-only, is closed: BUGS.md #238, `bayBridgeNear`.) Its roadways are slabs on a grade,
    // end to end, which the heuristic counts as it does the Golden Gate's. (One model; the other's pair stopped
    // counting when the heuristic began requiring the two levels to overlap in plan, 2026-10-03.)
    'coplanar | Bay Bridge',
    // 2026-10-03 appearance pass: the Ferry Plaza deck stands on piles at street level (raised by design) and its
    // rectangle overlaps the Ferry Building's floats; Oracle Park is placed standalone on its survey, so the audit
    // tests its bounding rectangle against King Street's buildings across the road (the model follows the outline);
    // Pier 39 and One Maritime Plaza Park were already reporting before this pass
    'height | Ferry Plaza deck',
    'intersects | Ferry Plaza deck',
    // (the South Basin's plaza deck at the Ferry Terminal, 2026-10-03: the same builder on piles, the same datum)
    'height | South Basin plaza deck (Ferry Terminal)',
    'duplicate | plazaDeck',
    // a generic figure-on-a-pedestal builder shared by standalone monuments (sf/monuments.ts, 2026-10-04): each entry is
    // placed by its own point — standalone entries cannot shadow one another
    'duplicate | figureOnPedestal',
    // the Muni Metro tunnel portals (sf/portals.ts, 2026-10-06): one generic builder placed at each standalone point
    'duplicate | tunnelPortal',
    // the F-line shelters (fline-shelters.json, 2026-10-16): one builder placed on each Embarcadero tram platform
    'duplicate | flineShelter',
    'duplicate | rampPortal',
    // Angel Island's two fog-signal lights (batch-1006.ts): one builder on two OSM outlines
    'duplicate | angelLight',
    // the Taj Mahal houseboat's float meets the marina's water plane (batch-1006.ts): a float on the water is coplanar by design
    'coplanar | Taj Mahal houseboat',
    'height | One Maritime Plaza Park',
    'intersects | One Maritime Plaza Park',
    'intersects | Oracle Park',
    // Fisherman's Wharf, 2026-10-17 (#290): the three marinas lay boats along OSM's docks, the box round them reaching the
    // shore's buildings, and a hull's deck can sit within 2 cm of another's at the same draught; the crab stands (one builder
    // at three OSM nodes) stand on the sidewalk against their restaurants; the Boudin silo stands in the bakery's corner it
    // is part of; the Mirror Maze sign hangs on Building O's wall and the Pier 39 street bridge spans the street at the
    // upper floor — both up in the air by design
    'coplanar | Fisherman\'s Wharf lagoon fleet',
    'intersects | Fisherman\'s Wharf lagoon fleet',
    'coplanar | Hyde Street harbour boats',
    'intersects | Hyde Street harbour boats',
    'coplanar | Pier 39 marina boats',
    'intersects | Pier 39 marina boats',
    'duplicate | crabStand',
    'intersects | Crab stand (Fisherman\'s Wharf sidewalk stands)',
    'intersects | Crab Station',
    'intersects | Frankie\'s Crab Stand',
    'intersects | Boudin silo',
    'height | Mirror Maze sign',
    'intersects | Mirror Maze sign',
    'height | Pier 39 street bridge',
    // by design (2026-10-17): the Municipal Pier's piles reach 9 m down into the cove and its deck is the OSM ring's own
    // outline, with the mapped lot drawn beneath it; the bleachers are a raised stand placed from the satellite view,
    // and their foot promenade meets the beach paths OSM maps along them
    'height | Municipal Pier, Aquatic Park',
    'coplanar | Municipal Pier, Aquatic Park',
    'intersects | Aquatic Park Bleachers',
    // by design (2026-10-18): Hyde Street Pier's piles reach under the water, and its deck meets the ships' pier buildings
    'height | Hyde Street Pier',
    'intersects | Hyde Street Pier',
    // the Sausalito docks float on the sea (deckAbove), over a sea bed the check calls ground
    'height | Sausalito houseboat docks',
    // the houseboat's assetkit model replaces its procedural stand-in when near (statues.ts `replaces`): one place, two entries
    // by design (2026-10-18): Lincoln's model replaces its procedural stand-in at the same place; Gandhi stands on the
    // Ferry Plaza deck; the Jeremiah O'Brien lies alongside Pier 35, her guard against its fender line
    'duplicate | Ferry Plaza deck / Mahatma Gandhi',
    "intersects | SS Jeremiah O'Brien",
    // Pier 39's frontages (pier39-fronts.ts, 2026-10-17): point models laid against their buildings' walls, the viewing rail
    // along Building K; standalone fronts within 15 m of the pretzel kiosk and the street bridge
    "duplicate | Aunt Fanny's Hot Pretzels / Players Sports Grill & Arcade / Bubba Gump frontage (Pier 39, way/128240131 west face)",
    'duplicate | Pier 39 street bridge / Fog Harbor Fish House and Wipeout Bar & Grill frontage (Pier 39, way/128240149 east face)',
    'intersects | Fog Harbor Fish House and Wipeout Bar & Grill frontage (Pier 39, way/128240149 east face)',
    'intersects | Pier 39 sea lion viewing rail and platform (K-Dock)',
    'intersects | Players Sports Grill & Arcade / Bubba Gump frontage (Pier 39, way/128240131 west face)',
    // the Wharf's interior courts (wharf-landside.ts, 2026-10-17): shop rows laid against the courts' walls, the court's
    // furnishings touching them, the Cannery's court and glass bridge between its two wings
    "duplicate | Anchor's Landing court: shops on the In-N-Out wing's east wall / Anchor's Landing court: shops on the In-N-Out wing's south wall",
    "duplicate | Anchor's Landing court: shops on the In-N-Out wing's south wall / Anchor's Landing passage from Jefferson: west wall shops",
    "duplicate | Anchor's Landing court: the anchor, festoons, cafe tables / Anchor's Landing court: shops on the In-N-Out wing's east wall",
    "intersects | Anchor's Landing court: shops on the In-N-Out wing's east wall",
    "intersects | Anchor's Landing court: shops on the In-N-Out wing's south wall",
    "intersects | Anchor's Landing court: the anchor, festoons, cafe tables",
    "intersects | Anchor's Landing passage from Jefferson: mouth",
    "intersects | Anchor's Landing passage from Jefferson: west wall shops",
    "intersects | The Cannery's olive court and its glass bridge",
    // the Al Scoma Way lagoon overlook (2026): laid on the lagoon edge between Castagnola's and the Fish Alley shed
    'intersects | Lagoon overlook and fish market, Al Scoma Way',
    // Pier 39's upper galleries (pier39-style.ts, 2026-10-17): one frame in three parts under the triangle budget — their
    // decks meet, posts stand through them; the Flyer kiosk at OSM's node 6 m from the gate
    "coplanar | Pier 39 upper deck galleries and stairs, middle",
    "coplanar | Pier 39 upper deck galleries and stairs, north",
    "coplanar | Pier 39 upper deck galleries and stairs, south",
    "duplicate | Pier 39 gate / Pier 39 Flyer ticket kiosk",
    "duplicate | Pier 39 upper deck galleries and stairs, middle / Pier 39 upper deck galleries and stairs, north",
    "duplicate | Pier 39 upper deck galleries and stairs, south / Pier 39 upper deck galleries and stairs, middle",
    "duplicate | Pier 39 upper deck galleries and stairs, south / Pier 39 upper deck galleries and stairs, north",
    "intersects | Pier 39 upper deck galleries and stairs, middle",
    "intersects | Pier 39 upper deck galleries and stairs, north",
    "intersects | Pier 39 upper deck galleries and stairs, south",
  ],
}

for (const id of AUDITED) describe.skipIf(!baked(id))(`nonbuildings — ${id}`, () => {
  const c = city(id)

  /*
   * FIRST, and before any finding is believed: the checks had their inputs. A city whose manifest or bake
   * cannot be found returns an empty issue list, which reads exactly like a clean run — failure J in
   * docs/PIPELINE.md, and how Paris went unchecked for months.
   */
  it('resolved its manifest, its bake and some nonbuildings', () => {
    expect(c.manifest).not.toBe(null)
    expect(c.items.length).toBeGreaterThan(0)
    expect(c.issues.filter((i) => i.detail.includes('every positional check SKIPPED'))).toEqual([])
  })

  /*
   * The category's population, so a manifest edit that loses half of it is loud. These are floors, not exact
   * counts: adding a fountain must not fail the suite.
   */
  it('has at least the nonbuildings it had when this was written', () => {
    expect(c.items.length).toBeGreaterThanOrEqual(id === 'san-francisco' ? 44 : 31)
  })

  /** Every nonbuilding's builder produces real, finite geometry. No known findings — this must stay empty. */
  it('every nonbuilding builds non-empty, finite geometry', () => {
    expect(c.issues.filter((i) => i.check === 'geometry').map((i) => `${i.name}: ${i.detail}`)).toEqual([])
  })

  /**
   * Every GLB either loads or is honestly PENDING. "Declared but not modelled yet" is a legitimate state
   * (MODELS_NEEDED.md) and is reported with `pending: true`; a corrupt or mirrored asset is not.
   */
  it('no GLB asset is broken or mirrored in the file', () => {
    expect(c.issues.filter((i) => i.check === 'asset' && !i.pending).map((i) => `${i.name}: ${i.detail}`)).toEqual([])
  })

  /** A `kind` in the JSON that is not one of the sub-kinds — a typo that would otherwise pass silently. */
  it('no entry declares a kind that does not exist', () => {
    expect(c.issues.filter((i) => i.check === 'unclassified').map((i) => `${i.name}: ${i.detail}`)).toEqual([])
  })

  /** A fountain overlay or statue attached to a host nothing places never appears at all. */
  it('every attached statue and fountain names a host that exists', () => {
    expect(c.issues.filter((i) => i.check === 'host').map((i) => `${i.name}: ${i.detail}`)).toEqual([])
  })

  /*
   * And the whole finding set, both directions. `toEqual` on sorted arrays rather than a subset test: a
   * finding that disappears is as important as one that arrives, because that is how the BUGS #100 fix was
   * confirmed to have worked rather than merely believed.
   */
  it('finds exactly the known outstanding defects — no more, and no fewer', () => {
    expect(c.issues.map(issueKey).sort()).toEqual([...KNOWN[id]].sort())
  })
})

describe('the category is marked, and the marking is maintained', () => {
  /*
   * The honest part of the design: some of this IS an explicit list, because "is this a building" is a fact
   * about the world and no key in the data carries it. What keeps the list from rotting is this test — a
   * builder a manifest names that is neither classified as a nonbuilding nor on `BUILDINGS_OK` is a judgement
   * nobody has made, and every name in `EXPLICIT` must still exist in the registry.
   */
  /*
   * THE GUARD THAT MAKES THE EXPLICIT LIST HONEST. A builder whose NAME says fountain, plaza, statue,
   * monument, memorial, pagoda, windmill, kiosk, obelisk, column or head house, that a manifest names, and
   * that is neither marked nor exempted, is a judgement nobody has made — so the category cannot grow in
   * silence. Words that are commonly part of a BUILDING's name (tower, park, bridge, gate, square, court,
   * arch, sign) are deliberately not in the pattern: they would fail on eighty real buildings and a guard
   * that always fails is a guard nobody keeps.
   */
  it('no manifest names a nonbuilding-shaped builder that nobody has classified', () => {
    const RE = /fountain|plaza|statue|monument|memorial|pagoda|windmill|kiosk|obelisk|column|headhouse|pavilion|parvis|pyramid|canopy/i
    /*
     * Scoped to what a MANIFEST or a skyline actually names. `kit_*` (the catalogue) and `e<n>_*` (the
     * modelling experiments) are built straight out of the registry by a tool and are nobody's landmark, and
     * asking whether `kit_classicalColumn_ionic` is a nonbuilding is a question with no answer.
     */
    const loose = manifestNamed()
      .filter((k) => RE.test(k) && kindOfBuilder(k) === undefined && !BUILDINGS_OK.includes(k))
    expect(loose).toEqual([])
  })

  it('every explicitly marked builder still exists and still builds', () => {
    const gone = Object.keys(EXPLICIT).filter((k) => buildIt(k) === null)
    expect(gone).toEqual([])
  })

  it('no builder is classified twice with different answers', () => {
    const marked = classifiedBuilders()
    for (const [k, v] of Object.entries(marked)) expect(kindOfBuilder(k)).toBe(v)
  })

  /** The exemption list is only meaningful while its names are real. */
  it('the BUILDINGS_OK exemptions are real builders and are not also marked as nonbuildings', () => {
    for (const k of BUILDINGS_OK) {
      expect(buildIt(k), `${k} is exempted but is not a registered builder`).not.toBe(null)
      expect(kindOfBuilder(k), `${k} is both exempted and marked`).toBeUndefined()
    }
  })

  /** Both cities really did contribute: a run that silently covered one of them proves nothing about the other. */
  it('covers every audited city', () => {
    expect(all.map((c) => c.city).sort()).toEqual([...AUDITED].sort())
  })
})

describe('the GLB reader itself', () => {
  /*
   * A check nobody has tested is a check nobody should trust. `inspectGlb` is the only piece here that parses
   * a binary format, and its two answers ("missing" and "mirrored") are the two that carry consequences —
   * missing means wait for the owner, mirrored means a statue facing inside out that no thumbnail reveals.
   */
  it('says so when a file is not there, and reads a real one', () => {
    expect(inspectGlb('/nowhere/at/all.glb')).toEqual({ ok: false, reason: 'file does not exist' })
    // a real statue: packed by tools/glb/pack.ts into public/models/ (gitignored; the game reads it from the
    // asset bucket), so a fresh clone may not have one
    const real = new URL('../public/models/paris/henri-iv.glb', import.meta.url).pathname
    if (!existsSync(real)) return console.warn('(no public/models/paris/henri-iv.glb here: only the missing-file case was checked)')
    const g = inspectGlb(real)
    expect(g.ok).toBe(true)
    expect(g.nodes).toBeGreaterThan(0)
  })
})
