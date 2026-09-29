/**
 * Which landmark builders never reach a building.
 *
 * A builder can be written, exported and registered in `PROCEDURAL` and STILL draw nothing, because four
 * separate things have to line up: the builder exists in the registry, a manifest entry (or a city's skyline)
 * names it in its `procedural` key, that entry survives to be placed, and the building it names is in the
 * bake. The audit's unit is therefore a BAKED CITY, not a manifest — `landmarks/paris.json` serves
 * `public/cities/paris-centre/`, and conflating the two names is how Paris went unchecked (BUGS.md #101).
 *
 * Salesforce Tower was a good hand-written model that nobody could see, and there was no way to find the
 * others.
 *
 * Five lists, in the order they are worth fixing:
 *
 *   2 REFERENCED BUT NOT REGISTERED — `PROCEDURAL[e.procedural]` misses and `place()` draws nothing at all.
 *     A silent failure: the entry still REMOVES its OSM building (render/prepare.ts), so the result is bare
 *     ground where a building was.
 *   3 REFERENCED BUT SHADOWED — an earlier entry already claimed one of the same OSM ids, so the Landmarks
 *     constructor drops this one with a console warning nobody reads.
 *   4 IN AN UNREACHED FILE — an entry in a manifest file beside the city's that nothing includes. Never
 *     loaded, so never anything.
 *   5 NAMING A BUILDING THAT IS NOT IN THE BAKE — the one that actually bit Salesforce Tower, and the
 *     Federal Reserve Bank and the Transit Center before it. The entry is registered, named and unshadowed,
 *     and `tools/bake.ts` DROPPED the outline it names because the building's own `building:part`s cover it
 *     (`superseded`). Fixed systemically for the sixty-nine of BUGS.md #100 — an entry naming such an outline
 *     now claims its parts and is fitted to their union — so what is left here is an entry naming an id the
 *     bake has NOTHING for, which still waits forever and still leaves a plain box. Invisible to any
 *     source-level analysis: it is the one check that reads the baked tiles (~2 s over San Francisco's 107k
 *     files), and when a city's bake cannot be found it says SO — `bake: { ok: false, reason }` — because a
 *     null that reads as a clean run is exactly how it missed Paris entirely (BUGS.md #101).
 *   1 REGISTERED BUT NEVER REFERENCED BY ANY CITY — dead code, or a landmark nobody thought to place. The
 *     only list that is registry-wide rather than per city: `PROCEDURAL` is one flat keyspace holding every
 *     city's builders, so asked of Paris alone it calls San Francisco's five hundred dead.
 *
 * NOT done by reading the source. The district records mix `name: value` and shorthand `name,` entries and a
 * regex over them gives a different answer every time it is run (91, 55 and 630 on three attempts). This
 * imports the real registry and replicates the real selection code — `entryKind`, `packedIds` and the
 * constructor's claim loop are imported from render/landmarks.ts, not reimplemented.
 *
 *   npm run audit:builders                        every city in AUDITED
 *   npm run audit:builders -- --city=chicago-loop  one named bake (see `bakedCities()`)
 *
 * Run through vite-node, which ships with vitest: plain node cannot, because Babylon imports extensionless
 * paths (`@babylonjs/core/Meshes/mesh.vertexData`). Two vite-node quirks are worth knowing — it leaves
 * `process.argv[1]` pointing at its own bin AND rewrites `import.meta.url`, so the usual
 * `import.meta.url === file://${argv[1]}` main check never fires; the report below gates on `!VITEST`.
 *
 * `auditCity()` and `auditBuilders()` are LIBRARY functions and print nothing. A bake reporting on its own
 * city should call **`auditCity(<its bake directory name>)`**, after the last tile is written, because it
 * reads them — `auditBuilders()` does every city in `AUDITED`, which at the end of a Paris bake would read
 * San Francisco's 107k tiles for nothing. Narrow `c.bake.ok` before trusting list 5; `assertAllChecked()`
 * (or `Audit.unchecked`) does the same for a whole run.
 *
 * tests/audit-builders.test.ts runs the same functions over `AUDITED` and fails on anything not on an
 * explicit list below — in BOTH directions, so a list that stops reproducing fails too and cannot rot.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROCEDURAL } from '../src/render/landmarks/procedural.ts'
import { entryKind, packedIds, type LandmarkEntry } from '../src/render/landmarks.ts'
import { expandIncludes } from '../src/city/manifest.ts'
import { CITIES } from './cities.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LANDMARKS = resolve(ROOT, 'public/landmarks')

/** An entry with the manifest file it came from — `expandIncludes` alone loses that, and a shadow report needs it. */
type Sourced = LandmarkEntry & { __file: string }

export interface Finding { name: string; procedural: string; file: string; detail?: string }

/**
 * One BAKED CITY's audit. The unit is the bake, not the manifest: `paris.json` covers both `paris-marais`
 * and `paris-centre`, and each of those has its own tiles, so the same manifest is checked twice against
 * two different sets of buildings. Audited by manifest alone, Paris's bake was never checked at all.
 */
export interface CityAudit {
  city: string
  /** the manifest the GAME would load for it: `<city>.json`, else `<region>.json` (render/landmarks.ts) */
  manifest: string | null
  order: string[]
  unreached: string[]
  referencedUnregistered: Finding[]
  referencedShadowed: Finding[]
  inUnreachedFile: Finding[]
  /**
   * List 5, or WHY IT DID NOT RUN — and a caller cannot read the second as the first, because `notInBake`
   * does not exist on the failed shape and TypeScript will not let you reach it without narrowing `ok`.
   *
   * It used to be `Finding[] | null`, and that null read as a clean run: Paris was audited by manifest name,
   * found no `public/cities/paris/tiles` (its bakes are `paris-centre` and `paris-marais`), returned early
   * and printed green. The one check that catches BUGS.md #100 had never run there at all, and nothing said
   * so. A bake summary that does the same while sixty-nine landmarks are missing is the whole problem.
   */
  bake: { ok: true; notInBake: Finding[] } | { ok: false; reason: string }
  /** every builder this city names, for the registry-wide dead-code list */
  referenced: string[]
  entries: number
}

export interface Audit {
  cities: CityAudit[]
  /** cities whose list 5 did not run, and why. EMPTY is the only good value — see `assertAllChecked`. */
  unchecked: { city: string; reason: string }[]
  /**
   * Dead across the WHOLE registry. A builder belongs to no city in particular — `PROCEDURAL` is one flat
   * keyspace — so "never referenced" is only meaningful once every city has had its say. Asked per city it
   * says San Francisco's 500-odd builders are dead in Paris, which is true and useless.
   */
  registeredUnreferenced: string[]
  counts: { registered: number; entries: number; referenced: number }
}

/**
 * The manifest as the game loads it (src/city/manifest.ts), plus provenance. `expandIncludes` reads each file
 * once and in order, which IS the precedence order, so the array it returns is already strongest-first.
 */
async function loadManifest(base: string): Promise<{ entries: Sourced[]; order: string[] }> {
  const order: string[] = [`${base}.json`]
  const top = JSON.parse(readFileSync(resolve(LANDMARKS, `${base}.json`), 'utf8')) as unknown[]
  const entries = await expandIncludes<Sourced>(top as Sourced[], async (p) => {
    const f = resolve(LANDMARKS, p)
    if (!existsSync(f)) return null
    order.push(p)
    const got = JSON.parse(readFileSync(f, 'utf8')) as Record<string, unknown>[]
    // tag every entry with its file, including the `include` stubs (harmless: expandIncludes ignores extra keys)
    return got.map((e) => ({ ...e, __file: p }))
  })
  for (const e of entries) if (!e.__file) e.__file = `${base}.json`
  return { entries, order }
}

/** Builders a city's SKYLINE names (tools/cities.ts → baked into the package → Landmarks' constructor). */
function skylineRefs(city: string): Finding[] {
  const spec = CITIES.find((c) => c.id === city)
  return (spec?.skyline ?? []).map((s) => ({ name: s.name, procedural: s.procedural, file: 'tools/cities.ts (skyline)' }))
}

/**
 * The Landmarks constructor, exactly: restyle and placeholder entries are dropped (they never draw a model),
 * then the first entry to name an OSM id keeps it and any later entry naming ANY claimed id is skipped whole.
 * A standalone entry (lat/lon, no `osm`) has no ids, so it can neither shadow nor be shadowed.
 */
function shadowed(entries: Sourced[]): { survivors: Sourced[]; dropped: { e: Sourced; by: string }[] } {
  const claimed = new Map<number, string>()
  const survivors: Sourced[] = []
  const dropped: { e: Sourced; by: string }[] = []
  for (const e of entries) {
    const kind = entryKind(e)
    if (kind === 'restyle' || kind === 'placeholder') continue
    const ids = packedIds(e)
    const clash = ids.find((id) => claimed.has(id))
    if (clash !== undefined) { dropped.push({ e, by: claimed.get(clash)! }); continue }
    for (const id of ids) claimed.set(id, e.name)
    survivors.push(e)
  }
  return { survivors, dropped }
}

/**
 * The cities that HAVE been baked, from disk rather than from a list somebody has to remember to update:
 * `public/cities/<id>/tiles/`. Brooklyn and Chicago were baked and had never been audited, because nothing
 * enumerated them.
 */
export function bakedCities(): string[] {
  const dir = resolve(ROOT, 'public/cities')
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(resolve(dir, d.name, 'tiles')))
    .map((d) => d.name).sort()
}

/**
 * The manifest the GAME would load for a city — `landmarks/<city>.json`, else `landmarks/<region>.json`
 * (`landmarkManifest` in render/landmarks.ts). This is the join that was missing: the bakes are called
 * `paris-marais` and `paris-centre` and their manifest is `paris.json`. Null when there is none, which is a
 * fact about the city (Brooklyn and Chicago have no landmarks yet), not an error.
 */
export function manifestFor(city: string): string | null {
  const spec = CITIES.find((c) => c.id === city)
  for (const base of spec?.region ? [city, spec.region] : [city]) {
    if (existsSync(resolve(LANDMARKS, `${base}.json`))) return base
  }
  return null
}

/**
 * Every building id in a baked city, and which outline each `building:part` belongs to. Read straight off
 * the tiles (`buildings` and `fringe` are both what `addTile` feeds the landmarks), ~2 s for San Francisco's
 * 107k files. Null when the city has not been baked.
 */
function bakedBuildings(city: string): { ids: Set<number>; partsOf: Map<number, number> } | null {
  const dir = resolve(ROOT, 'public/cities', city, 'tiles')
  if (!existsSync(dir)) return null
  const ids = new Set<number>()
  const partsOf = new Map<number, number>()
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    const t = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as
      { buildings?: { id: number; partOf?: number }[]; fringe?: { id: number; partOf?: number }[] }
    for (const b of [...(t.buildings ?? []), ...(t.fringe ?? [])]) {
      ids.add(b.id)
      if (b.partOf !== undefined) partsOf.set(b.partOf, (partsOf.get(b.partOf) ?? 0) + 1)
    }
  }
  return { ids, partsOf }
}

/** One baked city, checked against the manifest the game would load for it. */
export async function auditCity(city: string): Promise<CityAudit> {
  const base = manifestFor(city)
  if (!base) {
    const spec = CITIES.find((c) => c.id === city)
    return {
      city, manifest: null, order: [], unreached: [], referencedUnregistered: [], referencedShadowed: [],
      inUnreachedFile: [], referenced: [], entries: 0,
      bake: { ok: false, reason: `no landmark manifest: neither landmarks/${city}.json nor landmarks/${spec?.region ?? '<no region>'}.json exists` },
    }
  }

  const { entries, order } = await loadManifest(base)
  const reached = new Set(order)
  const dir = resolve(LANDMARKS, base)
  const unreached = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => `${base}/${f}`).filter((f) => !reached.has(f)).sort()
    : []

  const { survivors, dropped } = shadowed(entries)

  // 2 — the lookup `place()` does is PROCEDURAL, not a city's own record: every city spreads into it
  const referencedUnregistered: Finding[] = survivors
    .filter((e) => e.procedural && !(e.procedural in PROCEDURAL))
    .map((e) => ({ name: e.name, procedural: e.procedural!, file: e.__file }))
  for (const s of skylineRefs(city)) if (!(s.procedural in PROCEDURAL)) referencedUnregistered.push(s)

  // 3 — dropped by the claim loop, and only interesting when it WOULD have drawn something
  const referencedShadowed: Finding[] = dropped
    .filter(({ e }) => e.procedural)
    .map(({ e, by }) => ({ name: e.name, procedural: e.procedural!, file: e.__file, detail: `claimed first by "${by}"` }))

  // 4 — entries sitting in a file no include reaches
  const inUnreachedFile: Finding[] = []
  for (const f of unreached) {
    const got = JSON.parse(readFileSync(resolve(LANDMARKS, f), 'utf8')) as LandmarkEntry[]
    for (const e of got) if (e.procedural) inUnreachedFile.push({ name: e.name, procedural: e.procedural, file: f })
  }

  /*
   * 5 — named, registered, unshadowed, and there is no such building IN THIS CITY'S BAKE. An entry with BOTH
   * `lat` and `lon` is placed at its point whatever its ids are (`addTile`'s `ready`), so it can never fall
   * in here. An `on` entry stands on its host, so its host is what must exist.
   *
   * A shared manifest covers more ground than any one bake — `paris.json` names landmarks all over central
   * Paris and the Marais box holds a fraction of them — so an entry is only checked against a city whose BOX
   * it falls in. Everything else is simply somewhere else, which `landmarkManifest` says outright.
   */
  const baked = bakedBuildings(city)
  const notInBake: Finding[] = !baked ? [] : survivors
    .filter((e) => e.procedural && !(e.lat !== undefined && e.lon !== undefined))
    .filter((e) => {
      const ids = e.on ? packedIds({ name: e.name, osm: e.on }) : packedIds(e)
      // an outline the bake replaced with its own parts DOES resolve since BUGS.md #100 was fixed: the entry
      // claims every building whose `partOf` is that outline and is fitted to their union. An `on` entry is
      // the exception — it stands on a real building's footprint, and a dropped outline has none.
      return ids.length > 0 && !ids.some((id) => baked.ids.has(id) || (!e.on && baked.partsOf.has(id)))
    })
    .map((e) => {
      const ids = e.on ? packedIds({ name: e.name, osm: e.on }) : packedIds(e)
      const parts = ids.map((id) => baked.partsOf.get(id) ?? 0).reduce((a, b) => a + b, 0)
      return {
        name: e.name, procedural: e.procedural!, file: e.__file,
        detail: parts > 0
          ? `none of ${ids.length} id(s) is in the bake; ${parts} building:part(s) carry partOf, but an `
            + '`on` entry needs a footprint to stand on'
          : `none of ${ids.length} id(s) is in the bake`,
      }
    })

  const referenced = new Set<string>()
  for (const e of entries) if (e.procedural) referenced.add(e.procedural)
  for (const s of skylineRefs(city)) referenced.add(s.procedural)
  for (const f of inUnreachedFile) referenced.add(f.procedural)

  return {
    city, manifest: base, order, unreached,
    referencedUnregistered, referencedShadowed, inUnreachedFile,
    bake: baked ? { ok: true, notInBake } : { ok: false, reason: `no baked tiles: public/cities/${city}/tiles does not exist` },
    referenced: [...referenced].sort(), entries: entries.length,
  }
}

/**
 * Throw unless every city's list 5 actually ran. For a caller that reports rather than tests — the bake's
 * end-of-run summary — so a city it cannot resolve stops it, instead of being summarised as having nothing
 * wrong. Print `audit.unchecked` instead if a softer treatment is wanted; do not ignore it.
 */
export function assertAllChecked(a: Audit): void {
  if (a.unchecked.length === 0) return
  throw new Error(`landmark audit did not run for ${a.unchecked.length} city/cities:\n`
    + a.unchecked.map((u) => `  ${u.city}: ${u.reason}`).join('\n'))
}

/*
 * The cities this is RUN over, and the set tests/audit-builders.test.ts covers.
 *
 * Not every baked directory. `paris-centre` SUPERSEDES `paris-marais` — it now includes the Marais — so the
 * Marais is the old, smaller bake of the same manifest and auditing both would report the same landmarks
 * twice, most of them merely outside the smaller box. `chicago-loop` and `brooklyn-heights` are baked but
 * unfinished and have no landmark manifest at all yet; `bakedCities()` still finds them and the CLI still
 * takes them by name, so they cost nothing to pick up later.
 *
 * It must hold every city that OWNS builders, because list 1 is registry-wide: San Francisco covers
 * SF_BUILDERS and paris-centre covers the Paris ones, which between them is all of PROCEDURAL.
 */
export const AUDITED = ['paris-centre', 'san-francisco']

/** Every audited city, and the registry-wide dead-code list over the union of what they all name. */
export async function auditBuilders(cities: string[] = AUDITED): Promise<Audit> {
  const out: CityAudit[] = []
  for (const c of cities) out.push(await auditCity(c))
  const referenced = new Set<string>()
  for (const c of out) for (const r of c.referenced) referenced.add(r)
  /*
   * 1 — a builder nothing names, ANYWHERE. Every reference counts, including one that is shadowed or sits in
   * an unreached file: those are reported above as their own, sharper, problem, and counting them here too
   * would say "dead code" about a builder somebody clearly meant to place.
   */
  const registeredUnreferenced = Object.keys(PROCEDURAL).filter((k) => !referenced.has(k)).sort()
  return {
    cities: out,
    unchecked: out.filter((c) => !c.bake.ok).map((c) => ({ city: c.city, reason: (c.bake as { reason: string }).reason })),
    registeredUnreferenced,
    counts: {
      registered: Object.keys(PROCEDURAL).length,
      entries: out.reduce((a, c) => a + c.entries, 0),
      referenced: referenced.size,
    },
  }
}

/*
 * Builders that are registered and named by nothing, and are allowed to be.
 *
 * NOT a silent skip. Two kinds, both explicit, and anything outside them fails tests/audit-builders.test.ts:
 * a builder that is not in a city and not covered here is a model nobody can see.
 */
export const UNREFERENCED_OK = {
  /** Never placed by design — built straight out of the registry by a tool, not by a manifest. */
  patterns: [
    // src/render/landmarks/sf/experiments/kit-demo.ts: the kit catalogue, shot by tools/kit-shots.ts
    /^kit_/,
    // src/render/landmarks/sf/experiments/e*.ts: the modelling experiments, several models of the SAME
    // handful of FiDi buildings by different agents, compared in shots. Only the winner is ever placed.
    /^e\d+_/,
  ] as RegExp[],
  /**
   * Known-dead, logged as BUGS.md #98. Modelled buildings in real district files that no manifest entry
   * names — several are earlier versions superseded by a differently-named builder for the same building
   * (`hunterDulin` vs the placed `hunterDulinBuilding`, `oneSansomeStreet` vs `oneSansomeTower`,
   * `fortyFourMontgomery` vs `montgomery44`); the rest are simply unplaced. Shrink this list, never grow it.
   */
  known: [
    'h4_hiltonUnionSquare',
    /*
     * `batteryChamberlin` and `batteryYates` WERE here, as dead `chicago-block` recipes in batches/h2.ts.
     * Real builders now exist in districts/batteries.ts and Chamberlin is placed from
     * landmarks/san-francisco/batteries.json, so the dead keys were deleted rather than allowed for. Yates
     * has no builder and no entry yet; it is simply absent.
     */
    /*
     * The Lyon Street Steps are placed by the STAIRWAYS table (render/landmarks/sf/stairways.ts, keyed by
     * OSM name and handed to `stairsLayer`), not by a manifest `procedural` entry — so the builder is
     * registered and correctly referenced by nothing. Every named stairway will look like this.
     */
    'lyonStreetSteps',
    /*
     * The three Presidio batteries. Their builders are written and registered, and batteries.json is
     * deliberately EMPTY: two successive modelling passes produced a flat pad (62 triangles) and then two
     * crossed sticks (786-1,564 triangles), so nothing is placed until a model shot shows a fortification.
     * BUGS.md #213c has the images and the numbers.
     */
    'batteryChamberlin',
    'batteryCrosby',
    'batteryGodfrey',
    'formerMilitaryChapel',
    'diningHall',
    'buildingUnidentified',
    'millsBuilding',
    'hiltonSanFranciscoUnionSquare',
    'fifteenHundredMission',
    /*
     * PARKED, not dead — BUGS.md #175. Fifteen Alcatraz and Treasure Island buildings whose builders are
     * written and correct, but which the bake never emits because `bake.ts:483` drops every street
     * component but the largest and takes those islands' buildings with it. Their manifest entries are
     * removed (listed in docs/PARKED-ISLANDS.json) so the audit stays honest about what can render; put
     * them back when the bake emits island buildings for display. Plus a handful pulled for other
     * reasons the same day: two coastal artillery batteries a recipe batch rendered as apartment blocks,
     * three ids absent from the bake entirely, and a Hilton outline that double-drew its own tower.
     */
    'b11_modelIndustriesBuilding_24433389',
    'b11_morgue_28000041',
    'b11_newIndustriesBuilding_24433395',
    'b11_powerhouse_27996721',
    'b11_quarters1NimitzHouse_291188933',
    'b11_quarters2_291188936',
    'b11_quarters3_291188941',
    'b11_quarters4_291188937',
    'b11_quarters5_291188938',
    'b11_quarters6_291188939',
    'b11_quarters7_291188940',
    'b11_quarters9_291188963',
    'h3_firestationH_764313741',
    'h3_harveyMilkMemorial_34313513',
    'h3_injectorStation_1038340434',
    'ccsfChinatownAnnex', 'fiftyCaliforniaStreet', 'foGuangShanSanBaoTemple', 'fortyFourMontgomery',
    'fourTwentyFiveMarket', 'fulton501', 'hunterDulin', 'newcomerSchool', 'oneSansomeStreet',
    'pgeGeneralOffice', 'twoThirtyFivePine', 'twoTwentyFiveBush', 'unnamedNineHundredBlock',
    'unnamedPineStreet', 'unnamedSeventyThreeMeterTower', 'unnamedSutterStreet', 'unnamedSutterStreetTwo',
    'unnamedTower256477866', 'usAppraisersBuilding',
    // the piers: modelled in piers.ts, absent from piers.json, which places sixteen of the twenty-two
    'pier3', 'pier19', 'pier23', 'pier29', 'pier31', 'pier45',
  ] as string[],
}

/** A category-5 finding's stable key: the builder, the entry's name and the file it is in. */
export const bakeKey = (f: Finding): string => `${f.procedural} | ${f.name} | ${f.file}`

/*
 * BUGS.md #100, FIXED 2026-09-23: sixty-nine entries named an OSM outline that the bake had replaced with the
 * building's own `building:part`s, so nothing resolved, no model was built and the classifier's plain box
 * stood in the landmark's place. An entry naming such an outline now claims every building whose `partOf` is
 * that outline and is fitted to the union of the grounded ones (src/render/landmarks.ts), and the check above
 * counts a superseded outline as resolvable. The list is empty and must stay so: an entry naming an id the
 * bake has nothing at all for — no building and no parts — is still a landmark nobody can see.
 */
export const NOT_IN_BAKE_KNOWN: Record<string, string[]> = {
  /*
   * Empty, and that is a result rather than a default: BUGS.md #100 listed sixty-nine of these in San
   * Francisco — the Transamerica Pyramid, Coit Tower and the Ferry Building among them — and the systemic
   * `partOf` fix in render/landmarks.ts cleared the lot. The "an old one going away also fails" half of the
   * policy is what caught that they had gone.
   */
  'san-francisco': [],
  /*
   * Paris had NEVER been checked: audited under the name "paris" it found no `public/cities/paris/tiles`
   * (the bake is `paris-centre`) and returned a null that read as a clean run. Checked properly, all
   * seventeen of `paris.json`'s entries that resolve by OSM id resolve — the other entries stand at a
   * `lat`/`lon`, are restyles, or are placeholders, none of which can fall in this list.
   */
  'paris-centre': [],
}

/** An unreferenced builder that needs no excuse. */
export const allowedUnreferenced = (name: string): boolean =>
  UNREFERENCED_OK.patterns.some((p) => p.test(name)) || UNREFERENCED_OK.known.includes(name)

/*
 * The report. Not guarded the usual way: vite-node leaves `process.argv[1]` pointing at its own bin and
 * rewrites `import.meta.url`, so `import.meta.url === file://${argv[1]}` never fires. The only importer that
 * must not print is the test, and vitest says so itself.
 */
if (!process.env.VITEST) {
  const named = process.argv.filter((a) => a.startsWith('--city=')).map((a) => a.slice(7))
  const a = await auditBuilders(named.length ? named : AUDITED)
  const show = (title: string, rows: Finding[]): void => {
    console.log(`\n  -- ${title} — ${rows.length}`)
    for (const r of rows) console.log(`     ${r.procedural}  "${r.name}"  [${r.file}]${r.detail ? `  ${r.detail}` : ''}`)
  }
  console.log(`registry ${a.counts.registered} builders · ${a.counts.entries} manifest entries · ${a.counts.referenced} builders named`)
  console.log(`baked on disk: ${bakedCities().join(', ')}`)
  for (const c of a.cities) {
    console.log(`\n======== ${c.city}  (manifest ${c.manifest ? `landmarks/${c.manifest}.json` : 'NONE'}, ${c.entries} entries)`)
    /*
     * A skip is LOUD. `notInBake: null` read as a clean run once already: Paris was audited by manifest name,
     * found no `public/cities/paris/tiles`, silently returned early, and printed green — so the check that
     * catches BUGS.md #100 had never run there at all. The test fails on a skip; the report shouts about it.
     */
    if (!c.bake.ok) console.log(`  !! LIST 5 DID NOT RUN — ${c.bake.reason}`)
    console.log(`  include order (precedence: FIRST wins)\n     ${c.order.join('\n     ')}`)
    show('2. referenced but NOT REGISTERED (draws nothing, building still removed)', c.referencedUnregistered)
    show('3. referenced but SHADOWED (an earlier entry claimed the building)', c.referencedShadowed)
    show('4. in a manifest file NOTHING INCLUDES (never loaded)', c.inUnreachedFile)
    if (c.bake.ok) show('5. names a building that IS NOT IN THIS BAKE (waits forever; a plain box stands there)', c.bake.notInBake)
    console.log(`  -- unreached manifest files — ${c.unreached.length}${c.unreached.length ? `\n     ${c.unreached.join('\n     ')}` : ''}`)
  }
  const loose = a.registeredUnreferenced.filter((k) => !allowedUnreferenced(k))
  console.log(`\n======== 1. registered but NEVER REFERENCED BY ANY AUDITED CITY — ${a.registeredUnreferenced.length}, of them ${loose.length} not allowed for`)
  for (const k of a.registeredUnreferenced) console.log(`   ${k}${allowedUnreferenced(k) ? '  (allowed)' : '  <<< NOT ALLOWED FOR'}`)
}
