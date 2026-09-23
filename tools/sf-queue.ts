/**
 * The work queue: which buildings are still to be decided, in what order, and by which model.
 *
 * The rule (user, 2026-09-22): a building's priority comes from what it IS and where it STANDS — its height and
 * its distance from the routes people ride — and never from whether OSM happens to carry a name for it. "There
 * are plenty of notable buildings that don't even have a name", and a missing name is if anything a reason to
 * look harder, not to skip.
 *
 * Three stages, each cheaper than the next and each handing on only what it cannot finish:
 *
 *   haiku   reface from ONE photograph. Three outcomes: the classifier is already right (write nothing),
 *           a restyle entry, or "this wants a model" — which escalates.
 *   sonnet  a model, from the same photograph, for the ones that merit it (tall, or near the core, or civic).
 *   opus    the ones Sonnet bailed out of — a rotunda, a dome, a sculpted crown (the Palace of Fine Arts).
 *
 * An escalation is NOT automatic: a bail-out only moves up if the building's priority clears the next cut.
 * Below that the classifier keeps it, which is the right answer for an ordinary building on a back street.
 *
 *   node --experimental-strip-types tools/sf-queue.ts                 the queue, and what is in each stage
 *   node --experimental-strip-types tools/sf-queue.ts --stage=sonnet  list one stage, highest priority first
 *   node --experimental-strip-types tools/sf-queue.ts --cut=8         write the top slice of each stage to docs/sf-batches/
 *
 * State lives in docs/sf-queue-log.csv, which is APPEND-ONLY: one row each time a stage finishes with a
 * building (osm, stage, model, outcome, image, date). The queue is derived from the register plus that log, so
 * nothing is ever hand-kept and work already done is never offered twice — including everything done before
 * this tool existed, which the register already records.
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { distToRoutes } from './sf-corridors.ts'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')

/** csv with quoted fields */
const cells = (line: string): string[] => {
  const out: string[] = []
  let cur = ''
  let q = false
  for (const ch of line) {
    if (ch === '"') q = !q
    else if (ch === ',' && !q) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

export interface Item { osm: string; name: string; kind: string; lat: number; lon: number; height: number; levels: number; priority: number; stage: Stage }
export type Stage = 'manual' | 'haiku' | 'sonnet' | 'opus' | 'done'

/**
 * How much of our attention a building deserves, from geometry and place alone.
 *
 * Height is the strongest signal — ten storeys is where a building starts to be part of the skyline rather
 * than part of a street — and distance from a ride corridor is the discount, because a building nobody passes
 * is a building nobody sees. Civic standing is worth a lot wherever it stands. There is deliberately NO term
 * for having a name.
 */
export const priorityOf = (c: { kind: string; name?: string; height: number; levels: number; lat: number; lon: number }): number => {
  const h = c.height || c.levels * 3.4 || 12
  /*
   * A NAMED civic building is a landmark whatever its height — a museum, a theatre, a library, a church. The
   * National Maritime Museum is ten metres tall and is one of the most recognisable buildings on the
   * waterfront (user, 2026-09-22: "we really should model the Maritime Museum. Its priority should be high
   * enough to force modeling"). Height alone put it below the hand-modelled cut and a cheap pass gave it a
   * facade style, which is the wrong answer for a building shaped like a ship.
   */
  const civic = c.kind === 'civic' ? (c.name ? 95 : 40) : 0
  const d = distToRoutes(c.lat, c.lon)
  // the first 200 m costs nothing (a building one street back is still seen), then it falls away
  return h + civic - Math.max(0, d - 200) / 10
}

/*
 * The very top of the list is never handed to the ladder. A cheap model with one photograph is the right tool
 * for the nine hundredth building; it is the wrong tool for the one everybody recognises, and the cost of
 * getting that one wrong is not the tokens (user, 2026-09-22: "you're not going to get a good result from
 * Haiku for Notre Dame, and it's super important to get right. The ladder is for buildings that are below a
 * 10/10 on the priority list"). These are modelled by hand, with as many references as they take.
 */
const MANUAL = Number(arg('manual', '20'))

/*
 * A tall building is never refaced. There are only ten buildings over ninety metres still to do in the whole
 * city and thirty-five over sixty (user, 2026-09-22: "a 99m tower should always be high priority enough to be
 * modeled anyway. how many of those can there even be in sf?") — so the cheap stage buys almost nothing on
 * them, and they are the worst subjects for it: a ninety-metre tower will not fit in a street-level frame and
 * is the most likely thing to be standing behind something else.
 */
const TALL_MODEL = Number(arg('tall-model', '60'))

const MODEL_CUT = Number(arg('model-cut', '45'))   // at or above this a reface may escalate to a model
const OPUS_CUT = Number(arg('opus-cut', '75'))     // and at or above this, a bailed model escalates again

// ---- the register: everything already decided, and everything still to decide
const reg = readFileSync(resolve(ROOT, 'docs', 'sf-buildings.csv'), 'utf8').split('\n').slice(1).filter(Boolean).map(cells)

// ---- the log: what each stage has already finished with, last word per building
type Log = { stage: Stage; outcome: string }
const logFile = resolve(ROOT, 'docs', 'sf-queue-log.csv')
const log = new Map<string, Log>()
if (existsSync(logFile)) {
  for (const l of readFileSync(logFile, 'utf8').split('\n').slice(1).filter(Boolean)) {
    const c = cells(l)
    log.set(c[0], { stage: c[1] as Stage, outcome: c[3] })
  }
} else {
  writeFileSync(logFile, 'osm,stage,model,outcome,image,date\n')
}

const items: Item[] = []
/** ships and other landmarks that want modelling but have no facade: written to their own backlog below */
const vessels: { osm: string; name: string; lat: number; lon: number; height: number; priority: number }[] = []
for (const c of reg) {
  const [osm, name, kind, lat, lon, height, levels, status] = [c[0], c[1], c[2], Number(c[3]), Number(c[4]), Number(c[5]), Number(c[6]), c[7]]
  if (c[10] === 'part') continue
  // a row with no position is a landmark carried by its manifest entry (a pier, a bridge), not a candidate
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat === 0) continue
  if (['park', 'garden', 'playground'].includes(kind)) continue
  /*
   * A vessel is not a building, but it IS a landmark: the historic ships along the waterfront are tagged
   * `building=ship`, which swept USS Pampanito into a refacing queue — the photograph that came back was a
   * perfectly good picture of a submarine. They come out of the ladder, which has no facade style that means
   * anything for a hull, and go on their own list to be modelled by hand later.
   */
  const priority = priorityOf({ kind, name, height, levels, lat, lon })
  if (/building=(ship|boat)/.test(c[11] ?? '')) { vessels.push({ osm, name, lat, lon, height, priority }); continue }


  /*
   * Work already done is never offered again — that is the whole point of deriving this from the register
   * rather than keeping a list (user: "Without redoing ANY work - the current results are fine").
   */
  let stage: Stage
  if (status === 'model' || status === 'restyle') stage = 'done'
  else if (status === 'hard') stage = priority >= OPUS_CUT ? 'opus' : 'done'   // bailed out already; only the big ones go on
  else {
    const seen = log.get(osm)
    // tall means MODELLED; the top-priority pass above still pulls the important ones up to be done by hand
    if (height >= TALL_MODEL) stage = 'sonnet'
    else if (!seen) stage = 'haiku'
    else if (seen.outcome === 'model-worthy' || seen.outcome === 'bailed') {
      // an escalation happens only if the building is worth the next model's time
      const next: Stage = seen.stage === 'haiku' ? 'sonnet' : 'opus'
      const cut = next === 'sonnet' ? MODEL_CUT : OPUS_CUT
      stage = priority >= cut ? next : 'done'
    } else if (seen.outcome === 'wrong-image') {
      /*
       * A photograph of the wrong building is unfinished work, not a decision. The aiming tooling keeps
       * improving, so the building goes back in the queue to be tried again with a better picture — marking
       * it done would retire it on the strength of our own bug.
       */
      stage = 'haiku'
    } else stage = 'done'   // confirmed or restyled: the classifier keeps it, or the entry does
  }
  items.push({ osm, name, kind, lat, lon, height, levels, priority, stage })
}

vessels.sort((a, b) => b.priority - a.priority)
writeFileSync(resolve(ROOT, 'docs', 'sf-vessels.md'),
  ['# Landmarks that are not buildings\n',
    'Taken out of the refacing ladder by tools/sf-queue.ts: a facade style means nothing for a hull. These are',
    "modelled by hand, as their own shapes, when their turn comes — USS Pampanito and the Hyde Street Pier fleet",
    'are landmarks of the waterfront and worth real geometry.\n',
    '| name | osm | height | lat, lon | priority |', '|---|---|---|---|---|',
    ...vessels.map((v) => `| ${v.name || '(unnamed)'} | ${v.osm} | ${v.height} m | ${v.lat}, ${v.lon} | ${Math.round(v.priority)} |`)].join('\n') + '\n')

items.sort((a, b) => b.priority - a.priority)
// the highest-priority work still outstanding, whatever stage it would otherwise have fallen into
let n = 0
for (const i of items) {
  // a building the cheap stage has already been over is still eligible: its entry is at the bottom of the
  // manifest's precedence order, so a hand-made model simply supersedes it
  const cheap = log.get(i.osm)?.stage === 'haiku'
  if (i.stage === 'done' && !cheap) continue
  if (n++ < MANUAL) i.stage = 'manual'
}
const want = arg('stage')
const byStage = (s: Stage): Item[] => items.filter((i) => i.stage === s)

if (want) {
  const list = byStage(want as Stage)
  console.log(`${list.length} buildings for ${want}, highest priority first\n`)
  for (const i of list.slice(0, Number(arg('limit', '60')))) {
    console.log(`${String(Math.round(i.priority)).padStart(4)}  ${String(i.height).padStart(4)} m  ${i.kind.padEnd(6)} ${i.osm.padEnd(17)} ${i.lat.toFixed(5)},${i.lon.toFixed(5)}  ${i.name || '(unnamed)'}`)
  }
} else {
  writeFileSync(resolve(ROOT, 'docs', 'sf-queue.csv'),
    ['osm,name,kind,lat,lon,height,levels,priority,stage',
      ...items.map((i) => [i.osm, `"${i.name.replace(/"/g, '""')}"`, i.kind, i.lat, i.lon, i.height, i.levels, Math.round(i.priority), i.stage].join(','))].join('\n') + '\n')
  console.log(`${items.length} buildings → docs/sf-queue.csv`)
  for (const s of ['manual', 'haiku', 'sonnet', 'opus', 'done'] as Stage[]) {
    const l = byStage(s)
    if (l.length === 0) continue
    console.log(`  ${s.padEnd(7)} ${String(l.length).padStart(5)}   priority ${Math.round(l[l.length - 1]?.priority ?? 0)}–${Math.round(l[0]?.priority ?? 0)}`)
  }
  console.log(`\nthe top ${MANUAL} outstanding are modelled by hand, never by the ladder`)
  console.log(`cuts: a reface escalates to a model at ${MODEL_CUT}, a model escalates to the strong one at ${OPUS_CUT}`)
}

/** Record a stage's verdict. Called by the tooling that runs a batch, never edited by hand. */
export const record = (osm: string, stage: Stage, model: string, outcome: string, image: string): void => {
  appendFileSync(logFile, `${osm},${stage},${model},${outcome},"${image.replace(/"/g, '""')}",${new Date().toISOString().slice(0, 10)}\n`)
}
