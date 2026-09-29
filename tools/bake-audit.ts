/**
 * The bake's own safety net: **is the work we paid for actually being rendered, and what is standing in the
 * city with nothing behind it?**
 *
 * Sixty-nine landmark entries — Transamerica, Coit Tower, the Ferry Building, all four Embarcadero Centers —
 * named an OSM outline the bake had dropped, so the model was never built and the classifier's plain box
 * stood there instead. **Nobody noticed.** They were found by audit, months later, after the owner happened
 * to ride past Salesforce Tower. A bake that silently succeeds while a flagship landmark is missing is the
 * bug this file exists to prevent.
 *
 * ## It fails EARLY, which is the whole point
 *
 * A full San Francisco bake runs for hours. A report at the end is a report you read after the money is
 * spent (owner, 2026-09-23: *"hopefully it terminates EARLY because we don't want to get errors at the end
 * of a 4 hour bake job"*). So each check runs at the EARLIEST moment its inputs exist:
 *
 *   stage 1  needs NOTHING but the source and the manifests — every `procedural` entry naming a builder that
 *            is not in the registry, entries in a file nothing includes, entries shadowed by an earlier one.
 *            Runs in the first seconds, before a single Overpass call. A missing builder must never cost
 *            four hours to discover.
 *   stage 2  needs the OSM data and the SUPERSESSION DECISION, and nothing else — no terrain, no tiles, no
 *            textures. This is the big one: an entry naming an outline that `bake.ts` drops because its
 *            `building:part`s cover >= 50% of it. Knowable the moment the surviving building ids are known,
 *            which is a few minutes in. Run for `procedural` AND `restyle` entries — nothing had ever checked
 *            a restyle, and the check found 36 of San Francisco's 600 naming an id not in the bake (BUGS.md
 *            #102). Thirty-two were a superseded outline and now resolve through its parts; the four that
 *            remain are ids the bake has nothing at all for (BUGS.md #113).
 *   stage 3  genuinely needs the finished tiles: direction B, the coverage gap.
 *
 * `--check-only` runs 1 and 3 against the EXISTING bake and exits without baking anything. That is what you
 * run in seconds after editing a manifest, before committing to a long job.
 *
 * ## Two directions, opposite meanings, never summed
 *
 *   **A — developed but not rendered.** WASTED MONEY: something somebody paid to build that nobody can see.
 *        NEVER filtered by prominence and never truncated — the existence of a hand-written builder or a
 *        chosen restyle IS the human judgement that the building matters, so a 12 m building on a side street
 *        with its own builder outranks a 60 m tower nobody bothered with, and a prominence filter would hide
 *        exactly that. Fatal.
 *   **B — conspicuous but never developed.** UNSPENT MONEY: something standing in the city with nothing but
 *        classifier output behind it. Prominence-ranked, because the literal reading is useless: the
 *        overwhelming majority of a bake's buildings have no generator and are never meant to. Information,
 *        never a failure.
 *
 * ## What is fatal
 *
 * A finding that means the bake's OUTPUT IS WRONG is fatal; a finding that means work is outstanding is not.
 * Stage 1 and stage 2 are gated against a recorded BASELINE (`docs/bake-audit-baseline.json`): today's known
 * breakage does not stop a bake, and one more than today's does. That is the case the owner named — *you
 * changed a manifest and broke forty landmarks, stop now* — and it is the only form of the gate that can be
 * turned on while the four restyles of BUGS.md #113 are still in the tree. `--strict` demands zero.
 *
 * Nothing here can be mistaken for a clean run: every stage prints a verdict line, and a stage that COULD
 * NOT RUN prints `!! NOT CHECKED` and is itself fatal in the early stages. Paris printed green for weeks
 * because a check skipped quietly (BUGS.md #101).
 *
 *   npx vite-node tools/bake-audit.ts --city=san-francisco --check-only
 *   npx vite-node tools/bake-audit.ts --city=san-francisco --stage=1
 *   npx vite-node tools/bake-audit.ts --city=san-francisco --stage=2 --ids=<file written by the bake>
 *   npx vite-node tools/bake-audit.ts --city=san-francisco --stage=3
 *
 * Plain node cannot run it: the real selection code lives in src/render/landmarks.ts, which imports Babylon
 * with extensionless specifiers. `tools/bake.ts` therefore SPAWNS this under vite-node rather than importing
 * it, and treats a spawn that does not run as a failure of the check.
 */
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROCEDURAL } from '../src/render/landmarks/procedural.ts'
import { entryKind, packedIds, type LandmarkEntry } from '../src/render/landmarks.ts'
import { expandIncludes } from '../src/city/manifest.ts'
import { CITIES } from './cities.ts'
import type { Finding } from './audit-builders.ts'

/**
 * `tools/audit-builders.ts` runs its whole CLI report at module scope (`if (!process.env.VITEST) { … }`), so
 * a plain import of it prints five lists before we print anything. It is another agent's file and asking for
 * a proper entry guard is a change to its shape, so this suppresses the side effect the only way the file
 * offers: the env var it already honours, set for the length of the import. **Requested upstream: a real
 * entry guard, so an importer does not have to pretend to be vitest.**
 */
async function quietAuditBuilders(): Promise<typeof import('./audit-builders.ts')> {
  const had = process.env.VITEST
  process.env.VITEST = '1'
  try { return await import('./audit-builders.ts') } finally {
    if (had === undefined) delete process.env.VITEST; else process.env.VITEST = had
  }
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LANDMARKS = resolve(ROOT, 'public/landmarks')

export interface Miss {
  /** the entry's name, which is what a person recognises */
  name: string
  /** `procedural:<builder>` or `restyle:<style>` — WHAT was developed */
  work: string
  file: string
  reason: string
}

/** A ring in the packed form the tiles carry: flattened x,z pairs. */
const ringArea = (r: number[]): number => {
  let a = 0
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) a += (r[j] - r[i]) * (r[i + 1] + r[j + 1])
  return Math.abs(a) / 2
}

/** The manifest the GAME would load for a city: `landmarks/<city>.json`, else `landmarks/<region>.json`. */
export function manifestFor(city: string): string | null {
  const spec = CITIES.find((c) => c.id === city)
  for (const base of spec?.region ? [city, spec.region] : [city]) {
    if (existsSync(resolve(LANDMARKS, `${base}.json`))) return base
  }
  return null
}

type Sourced = LandmarkEntry & { __file: string }

/** The manifest as the game loads it, in precedence order (FIRST entry wins), with provenance. */
export async function loadManifest(base: string): Promise<{ entries: Sourced[]; order: string[] }> {
  const order: string[] = [`${base}.json`]
  const top = JSON.parse(readFileSync(resolve(LANDMARKS, `${base}.json`), 'utf8')) as Sourced[]
  const entries = await expandIncludes<Sourced>(top, async (p) => {
    const f = resolve(LANDMARKS, p)
    if (!existsSync(f)) return null
    order.push(p)
    return (JSON.parse(readFileSync(f, 'utf8')) as Sourced[]).map((e) => ({ ...e, __file: p }))
  })
  for (const e of entries) if (!e.__file) e.__file = `${base}.json`
  return { entries, order }
}

/**
 * The `Landmarks` constructor's claim loop, exactly: restyle and placeholder entries never draw a model, so
 * they are dropped first; then the first entry to name an OSM id keeps it and any later entry naming ANY
 * claimed id is dropped whole.
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

// ---------------------------------------------------------------------------------------------- stage 1
export interface Stage1 { city: string; manifest: string; entries: number; order: string[]; misses: Miss[] }

/**
 * Everything knowable from the source and the manifests alone — no OSM, no tiles. Run before the bake does
 * any work at all.
 */
export async function stage1(city: string): Promise<Stage1> {
  const base = manifestFor(city)
  if (!base) throw new Error(`no landmark manifest for ${city}: neither landmarks/${city}.json nor its region's`)
  const { entries, order } = await loadManifest(base)
  const { survivors, dropped } = shadowed(entries)
  const misses: Miss[] = []

  // a builder the registry does not have. `place()` draws nothing AND the entry still removes its OSM
  // building, so the result is bare ground — the worst of the failures and the cheapest to catch.
  for (const e of survivors) {
    if (e.procedural && !(e.procedural in PROCEDURAL)) {
      misses.push({ name: e.name, work: `procedural:${e.procedural}`, file: e.__file,
        reason: 'NOT REGISTERED — no such builder in PROCEDURAL; draws nothing and removes its building' })
    }
  }
  const spec = CITIES.find((c) => c.id === city)
  for (const s of spec?.skyline ?? []) {
    if (!(s.procedural in PROCEDURAL)) {
      misses.push({ name: s.name, work: `procedural:${s.procedural}`, file: 'tools/cities.ts (skyline)',
        reason: 'NOT REGISTERED — no such builder in PROCEDURAL' })
    }
  }
  // dropped by the claim loop: an earlier entry already owns one of its buildings
  for (const { e, by } of dropped) {
    if (!e.procedural) continue
    misses.push({ name: e.name, work: `procedural:${e.procedural}`, file: e.__file,
      reason: `SHADOWED — "${by}" claimed one of its OSM ids first` })
  }
  // an entry sitting in a manifest file no `include` reaches: loaded by nothing, ever
  const reached = new Set(order)
  const dir = resolve(LANDMARKS, base)
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      const rel = `${base}/${f}`
      if (reached.has(rel)) continue
      for (const e of JSON.parse(readFileSync(resolve(LANDMARKS, rel), 'utf8')) as LandmarkEntry[]) {
        const work = e.procedural ? `procedural:${e.procedural}` : e.restyle ? `restyle:${e.restyle}` : ''
        if (work) misses.push({ name: e.name, work, file: rel, reason: 'IN AN UNREACHED FILE — nothing includes it' })
      }
    }
  }
  return { city, manifest: base, entries: entries.length, order, misses }
}

// ---------------------------------------------------------------------------------------------- stage 2
/** The surviving building ids of a bake in progress, as tools/bake.ts hands them over. */
export interface Surviving { ids: number[]; partOf: number[] }

export interface Stage2 { city: string; manifest: string; checked: number; misses: Miss[] }

/**
 * Every entry — `procedural` AND `restyle` — whose OSM ids are not among the buildings that will exist.
 *
 * Both paths now resolve an outline the bake replaced with its parts, through those parts: the procedural one
 * since BUGS.md #100 (it claims them and is fitted to their union), the restyle one since BUGS.md #102 was
 * fixed (`claims()` in src/render/landmarks.ts, the one rule both use — each part takes the entry's style,
 * and not its `height`/`eaves`/`levels`, which are the whole building's). So a superseded outline is a miss
 * for neither, and what is left in direction A is an id the bake has nothing at all for.
 *
 * The one exception is an `on` entry, which stands on a real footprint and a dropped outline has none.
 */
export function stage2(city: string, manifest: string, entries: Sourced[], live: Surviving): Stage2 {
  const ids = new Set(live.ids)
  const partsOf = new Set(live.partOf)
  const { survivors } = shadowed(entries)
  const misses: Miss[] = []
  let checked = 0

  for (const e of survivors) {
    if (!e.procedural) continue
    // an entry with its own lat/lon is placed at its point whatever its ids are
    if (e.lat !== undefined && e.lon !== undefined) continue
    const on = e.on ? packedIds({ name: e.name, osm: e.on } as LandmarkEntry) : packedIds(e)
    if (on.length === 0) continue
    checked++
    // `on` stands on a real building's footprint, and a dropped outline has none; a plain entry may resolve
    // through the parts that replaced its outline
    if (on.some((id) => ids.has(id) || (!e.on && partsOf.has(id)))) continue
    misses.push({ name: e.name, work: `procedural:${e.procedural}`, file: e.__file,
      reason: on.some((id) => partsOf.has(id))
        ? 'NOT IN THE BAKE — the outline was replaced by its parts and an `on` entry needs a footprint'
        : `NOT IN THE BAKE — none of ${on.length} OSM id(s) exists in this city` })
  }

  for (const e of entries) {
    if (entryKind(e) !== 'restyle') continue
    const mine = packedIds(e)
    // a `within`/`named` restyle takes whatever it finds and cannot "miss"; only its named ids are checkable
    if (mine.length === 0) continue
    checked++
    // an id that named an outline the bake replaced resolves through its parts, exactly as a procedural
    // entry's does — `restyles()` claims every part of it (BUGS.md #102, fixed 2026-09-23)
    const bad = mine.filter((id) => !ids.has(id) && !partsOf.has(id))
    if (bad.length === 0) continue
    misses.push({ name: e.name, work: `restyle:${e.restyle}`, file: e.__file,
      reason: `NOT IN THE BAKE — ${bad.length} of ${mine.length} OSM id(s) does not exist in this city` })
  }
  return { city, manifest, checked, misses }
}

// ---------------------------------------------------------------------------------------------- stage 3
/** Every building id in a baked city, the parts' owners, the names, and the heights. */
export interface Baked {
  ids: Set<number>
  partOf: Set<number>
  /**
   * ONE ROW PER BUILDING AS A PERSON SEES IT, keyed by the outline where there is one: a tower mapped as
   * fifty `building:part`s is one building, not fifty. Without this, direction B's list was nine rows of
   * Salesforce Tower's own parts at 326 m each — a building that HAS a hand-written model.
   */
  info: Map<number, { h: number; area: number; name?: string; parts: number }>
  /** a `building:part`'s id → the outline it belongs to, so an entry naming a PART covers the whole tower */
  ownerOf: Map<number, number>
}

export function readBake(city: string): Baked | null {
  const dir = resolve(ROOT, 'public/cities', city, 'tiles')
  if (!existsSync(dir)) return null
  const ids = new Set<number>()
  const partOf = new Set<number>()
  const info = new Map<number, { h: number; area: number; name?: string; parts: number }>()
  const nameOf = new Map<number, string>()
  const ownerOf = new Map<number, number>()
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    const t = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as {
      buildings?: { id: number; partOf?: number; height?: number; levels?: number; ring: number[]; style?: string }[]
      fringe?: { id: number; partOf?: number }[]
      landmarks?: { id: number; name: string }[]
    }
    for (const b of t.buildings ?? []) {
      ids.add(b.id)
      if (b.partOf !== undefined) { partOf.add(b.partOf); ownerOf.set(b.id, b.partOf) }
      const key = b.partOf ?? b.id
      const h = b.height ?? (b.levels ?? 0) * 3.5
      const prev = info.get(key)
      // the tallest part is the building's height; the largest is the nearest thing to its footprint
      if (!prev) info.set(key, { h, area: ringArea(b.ring), parts: b.partOf === undefined ? 0 : 1 })
      else {
        prev.h = Math.max(prev.h, h)
        prev.area = Math.max(prev.area, ringArea(b.ring))
        if (b.partOf !== undefined) prev.parts++
      }
    }
    for (const b of t.fringe ?? []) { ids.add(b.id); if (b.partOf !== undefined) partOf.add(b.partOf) }
    // the bake keeps the NAME on the dropped outline (tools/bake.ts `named`), which is the key we group by
    for (const l of t.landmarks ?? []) nameOf.set(l.id, l.name)
  }
  for (const [id, n] of nameOf) {
    const e = info.get(id)
    if (e) e.name = n
  }
  return { ids, partOf, info, ownerOf }
}

export interface Uncovered { id: number; h: number; area: number; name?: string; restyled?: string; parts: number }
export interface Stage3 {
  city: string
  buildings: number
  /** how "the core" was defined for direction B */
  core: string
  inCore: number
  covered: number
  uncovered: Uncovered[]
  /** how many of the uncovered rows are a tower mapped as parts, collapsed to one row each */
  /** refaced but never modelled: LADDER §3a says that is NOT DONE in the core, so it is a work queue */
  refacedOnly: Uncovered[]
  misses: Miss[]
}

/**
 * Direction B, plus a last confirmation of direction A against the FINISHED tiles.
 *
 * "The core" has to be defined or the answer is useless: a whole-city bake holds 26,000 ordinary buildings
 * and a list of "uncovered" ones that is mostly suburban housing teaches nothing. It is defined here as the
 * REGISTER's own boundary (docs/LADDER.md §2) — a building at least `coreHeight` metres tall, or one the
 * bake gave a name plate. That is the population the queue already draws from, so the list is comparable
 * with the work that has actually been done.
 */
export function stage3(city: string, entries: Sourced[], baked: Baked, coreHeight = 35): Stage3 {
  const { survivors } = shadowed(entries)
  const modelled = new Set<number>()
  // a manifest entry may name the OUTLINE or one of its `building:part`s; either covers the whole tower,
  // and `info` is keyed by the outline, so every modelled id is resolved to its outline first
  for (const e of survivors) if (e.procedural) for (const id of packedIds(e)) modelled.add(baked.ownerOf.get(id) ?? id)
  const restyleOf = new Map<number, string>()
  for (const e of entries) {
    if (entryKind(e) !== 'restyle' || !e.restyle) continue
    for (const id of packedIds(e)) {
      const key = baked.ownerOf.get(id) ?? id
      if (!restyleOf.has(key)) restyleOf.set(key, e.restyle)
    }
  }

  const uncovered: Uncovered[] = []
  const refacedOnly: Uncovered[] = []
  let inCore = 0
  let covered = 0
  for (const [id, b] of baked.info) {
    const core = b.h >= coreHeight || b.name !== undefined
    if (!core) continue
    inCore++
    if (modelled.has(id)) { covered++; continue }
    const row: Uncovered = { id, h: b.h, area: b.area, name: b.name, restyled: restyleOf.get(id), parts: b.parts }
    uncovered.push(row)
    if (row.restyled) refacedOnly.push(row)
  }
  // prominence: height first, then a name, then footprint. Nothing else is available from the tiles, and
  // adding a second data source to a check that runs at the end of every bake is not worth the seconds.
  const rank = (a: Uncovered, b: Uncovered): number =>
    b.h - a.h || Number(!!b.name) - Number(!!a.name) || b.area - a.area
  uncovered.sort(rank)
  refacedOnly.sort(rank)

  /*
   * Direction A's PROCEDURAL half is `tools/audit-builders.ts`'s job and is not reimplemented here — it
   * imports the real registry and replicates the real selection code, and another agent owns it. Only the
   * RESTYLE half is ours, because nothing had ever checked it (BUGS.md #102).
   */
  const misses = stage2(city, '', entries, { ids: [...baked.ids], partOf: [...baked.partOf] }).misses
    .filter((m) => m.work.startsWith('restyle:'))
  return { city, buildings: baked.ids.size, core: `height >= ${coreHeight} m, or named by the bake`,
    inCore, covered, uncovered, refacedOnly, misses }
}

// ----------------------------------------------------------------------------------------------- report
interface Baseline { [city: string]: { stage1?: number; stage2?: number; why?: string } | undefined }
const BASELINE = resolve(ROOT, 'docs', 'bake-audit-baseline.json')
export const baseline = (): Baseline => existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {}


const RULE = '='.repeat(96)
function showMisses(title: string, misses: Miss[]): void {
  console.log(`\n  ${title} — ${misses.length}`)
  // NEVER truncated and never prominence-filtered: that a builder or a restyle EXISTS is the human judgement
  // that the building matters (owner, 2026-09-23), and a prominence cut would hide the small ones first.
  for (const m of misses) console.log(`     ${m.work.padEnd(34)} "${m.name}"  [${m.file}]\n        ${m.reason}`)
}

const arg = (n: string): string | undefined => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=')

async function main(): Promise<void> {
  const city = arg('city')
  if (!city) throw new Error('need --city=<id>')
  const strict = process.argv.includes('--strict')
  const checkOnly = process.argv.includes('--check-only')
  /*
   * Stage 2 is the bake's own gate and needs the ids of a bake in progress, so it is never part of a default
   * run: without `--stage=2 --ids=…` there is nothing to check it against. `--check-only` and a bare
   * `--city=` are therefore the same thing — the manifests, and the bake already on disk.
   */
  const stages = arg('stage') ? [Number(arg('stage'))] : [1, 3]
  void checkOnly
  const base = baseline()[city] ?? {}
  let fatal = 0

  if (stages.includes(1)) {
    console.log(`\n${RULE}\nBAKE AUDIT stage 1 — ${city}: the manifests alone, before any work`)
    /*
     * A city with NO landmark manifest at all has nothing to check and nothing at risk — chicago-loop and
     * brooklyn-heights are baked and parked, with no landmarks yet. That is a fact about the city, not a
     * failure, so it is loud and it does not stop the bake. Everything else that cannot run does.
     */
    if (!manifestFor(city)) {
      console.log(`  !! NOT CHECKED — no landmark manifest (neither landmarks/${city}.json nor its region's).`)
      console.log('     Nothing has been developed for this city yet, so there is nothing to lose. Not a pass; not a failure.')
      if (stages.length === 1) { console.log(`\n${RULE}`); return }
    } else {
    const s = await stage1(city)
    console.log(`  manifest landmarks/${s.manifest}.json, ${s.entries} entries over ${s.order.length} files`)
    showMisses('A. DEVELOPED BUT CANNOT RENDER (wasted money: somebody paid to build these)', s.misses)
    const allow = strict ? 0 : base.stage1 ?? 0
    if (s.misses.length > allow) {
      console.log(`\n  !! FATAL — ${s.misses.length} findings, baseline ${allow}. Stopping BEFORE the bake `
        + 'spends hours. Fix the manifest, or raise the baseline in docs/bake-audit-baseline.json deliberately.')
      fatal++
    } else console.log(`\n  stage 1 OK — ${s.misses.length} findings, at or under the recorded baseline of ${allow}`)
    /*
     * And the fourth reason a builder never draws: NOBODY NAMES IT. Registry-wide, not per city —
     * `PROCEDURAL` is one flat keyspace, so asked of San Francisco alone it calls every Paris builder dead.
     * Reported as a count with the not-allowed-for ones named, so the ~160 deliberate ones (the kit
     * catalogue, the modelling experiments, BUGS #98's known-dead list) cannot bury a new one.
     */
    const { auditBuilders, allowedUnreferenced } = await quietAuditBuilders()
    const dead = (await auditBuilders()).registeredUnreferenced
    const loose = dead.filter((k) => !allowedUnreferenced(k))
    console.log(`  builders NEVER REFERENCED by any audited city: ${dead.length}, of them ${loose.length} not `
      + `allowed for${loose.length ? `\n     ${loose.join('\n     ')}` : ' (the rest are the kit catalogue, the experiments and BUGS #98)'}`)
    }
  }

  if (stages.includes(2)) {
    const idsFile = arg('ids')
    if (!idsFile) throw new Error('stage 2 needs --ids=<file>: the surviving building ids of a bake in progress')
    const live = JSON.parse(readFileSync(idsFile, 'utf8')) as Surviving
    const mf = manifestFor(city)
    if (!mf) {
      console.log(`\n${RULE}\nBAKE AUDIT stage 2 — ${city}: !! NOT CHECKED — no landmark manifest, so nothing `
        + 'has been developed for this city to lose. Not a pass; not a failure.')
      console.log(`\n${RULE}`)
      return
    }
    const { entries } = await loadManifest(mf)
    console.log(`\n${RULE}\nBAKE AUDIT stage 2 — ${city}: the entries against the buildings that will exist`)
    const s = stage2(city, mf, entries, live)
    console.log(`  ${live.ids.length} buildings decided, ${live.partOf.length} outlines replaced by their parts; `
      + `${s.checked} entries name an OSM id`)
    showMisses('A. DEVELOPED BUT WILL NOT RENDER (wasted money)', s.misses)
    const allow = strict ? 0 : base.stage2 ?? 0
    if (s.misses.length > allow) {
      console.log(`\n  !! FATAL — ${s.misses.length} findings, baseline ${allow}. Stopping NOW rather than at `
        + 'the end of a four-hour bake.')
      fatal++
    } else console.log(`\n  stage 2 OK — ${s.misses.length} findings, at or under the recorded baseline of ${allow}`)
  }

  if (stages.includes(3)) {
    console.log(`\n${RULE}\nBAKE AUDIT stage 3 — ${city}: the finished bake`)
    const baked = readBake(city)
    if (!baked) {
      // a city whose bake cannot be found must NEVER read as a clean run: Paris did exactly that for weeks
      console.log(`  !! NOT CHECKED — no baked tiles at public/cities/${city}/tiles. This is not a pass.`)
      fatal++
    } else {
      const mf = manifestFor(city)
      if (!mf) {
        // parked city, nothing developed: loud, and not a failure
        console.log(`  !! NOT CHECKED — no landmark manifest for ${city}, so nothing has been developed for `
          + 'it to lose. Not a pass; not a failure.')
      } else {
        const { entries } = await loadManifest(mf)
        const s = stage3(city, entries, baked)
        console.log(`  ${s.buildings} buildings in the bake; direction B's core is ${s.core} → ${s.inCore} buildings`)

        // the procedural half of direction A, from the tool that owns it (tools/audit-builders.ts)
        const { auditCity } = await quietAuditBuilders()
        const a = await auditCity(city)
        const fromAudit: Miss[] = [
          ...a.referencedUnregistered.map((f: Finding) => ({ name: f.name, work: `procedural:${f.procedural}`, file: f.file, reason: `NOT REGISTERED — ${f.detail ?? 'no such builder'}` })),
          ...a.referencedShadowed.map((f: Finding) => ({ name: f.name, work: `procedural:${f.procedural}`, file: f.file, reason: `SHADOWED — ${f.detail ?? ''}` })),
          ...a.inUnreachedFile.map((f: Finding) => ({ name: f.name, work: `procedural:${f.procedural}`, file: f.file, reason: 'IN AN UNREACHED FILE — nothing includes it' })),
        ]
        // `bake` is a discriminated union precisely so a skip cannot read as a pass (BUGS.md #101)
        if (a.bake.ok) fromAudit.push(...a.bake.notInBake.map((f: Finding) => ({ name: f.name, work: `procedural:${f.procedural}`, file: f.file, reason: `NOT IN THE BAKE — ${f.detail ?? ''}` })))
        else { console.log(`  !! NOT CHECKED (audit-builders, list 5) — ${a.bake.reason}. This is not a pass.`); fatal++ }

        const aAll = [...fromAudit, ...s.misses]
        showMisses('A. DEVELOPED BUT NOT RENDERED (wasted money — every one, unranked, untruncated)', aAll)
        // gated against the same baseline as stage 2: it is the same population, confirmed against the
        // tiles that were actually written rather than the ids the bake predicted
        const allowA = strict ? 0 : base.stage2 ?? 0
        if (aAll.length > allowA) {
          console.log(`\n  !! FATAL — ${aAll.length} developed things do not render, baseline ${allowA}.`)
          fatal++
        } else console.log(`\n  direction A OK — ${aAll.length} findings, at or under the recorded baseline of ${allowA}`)
        console.log(`\n  B. CONSPICUOUS BUT NEVER DEVELOPED (unspent money — NOT a failure, a work queue)`)
        console.log(`     ${s.covered} of ${s.inCore} core buildings have a model; ${s.uncovered.length} have `
          + 'only the classifier. A and B are opposite and must never be summed.')
        console.log(`     of those, ${s.refacedOnly.length} have a RESTYLE but no model — LADDER §3a: in the `
          + 'core that is NOT DONE, and it is the top of the queue.')
        const CAP = 50
        for (const u of s.uncovered.slice(0, CAP)) {
          console.log(`       ${String(Math.round(u.h)).padStart(4)} m  ${String(Math.round(u.area)).padStart(6)} m²  `
            + `way/${String(u.id).padEnd(11)} ${u.parts ? `(${u.parts} parts) ` : ''}`
            + `${u.restyled ? `[restyled ${u.restyled}] ` : ''}${u.name ?? ''}`)
        }
        const out = resolve(ROOT, 'docs', 'review', `${city}-uncovered.txt`)
        if (s.uncovered.length > CAP) console.log(`       …and ${s.uncovered.length - CAP} more → ${out}`)
        try {
          writeFileSync(out, s.uncovered.map((u) => `${Math.round(u.h)}\t${Math.round(u.area)}\t${u.id}\t${u.restyled ?? ''}\t${u.name ?? ''}`).join('\n') + '\n')
        } catch { /* docs/review may not exist for a new city; the list on screen is the deliverable */ }
      }
    }
  }
  console.log(`\n${RULE}`)
  if (fatal) { console.error(`BAKE AUDIT: ${fatal} stage(s) FAILED for ${city}`); process.exit(1) }
  console.log(`BAKE AUDIT: ${city} passed stage(s) ${stages.join(', ')}`)
}

// vite-node rewrites import.meta.url and points argv[1] at its own bin, so the usual entry guard never fires.
// The only importer that must not print is the test, and vitest says so itself.
if (!process.env.VITEST) await main()
