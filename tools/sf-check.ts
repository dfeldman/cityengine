/**
 * Check refacing entries against the things a machine can check, before anyone trusts them.
 *
 * A model writing manifest entries is writing permanent overrides of the classifier, and a wrong one is never
 * re-examined. Some of what makes an entry wrong needs an eye on a photograph — but a surprising amount does
 * not: a `tenement` is a five-storey walk-up and cannot be sixty-eight metres tall, a height of zero flattens
 * the building, and a colour has to be a colour. Those are caught here, every time, for nothing.
 *
 *   node --experimental-strip-types tools/sf-check.ts                  every reface-*.json
 *   node --experimental-strip-types tools/sf-check.ts --file=reface-haiku.json
 *   node --experimental-strip-types tools/sf-check.ts --strip          …and remove the entries that fail
 *
 * `--strip` moves the failures to docs/sf-batches/<file>-rejected.json rather than deleting them: they cost
 * money to produce, they are evidence about how a stage behaves, and a rejected entry is often right about the
 * colour while wrong about the style.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import STYLES from '../src/city/styles.json' with { type: 'json' }

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const dir = resolve(ROOT, 'public', 'landmarks', 'san-francisco')

const range = new Map<string, [number, number]>()
// styles.json types `levels` as number[]; the schema guarantees a pair, so assert it through unknown
for (const s of (STYLES as unknown as { styles: { id: string; levels: [number, number] }[] }).styles) range.set(s.id, s.levels)

interface Entry { osm?: string | string[]; name?: string; restyle?: string; procedural?: string; height?: number; levels?: number; wall?: string; trim?: string; accent?: string; image?: string; by?: string; lat?: number; lon?: number; size?: [number, number] }

/*
 * Heights come from the queue, never from the model. A model looking at a photograph cannot know how tall a
 * building is — it has no scale — and asking it to copy a number off a list only invents a way to get it wrong
 * (one entry came back as height 0, which would have flattened the building). So we fill it in here, from the
 * same data the list was cut from, and the brief no longer asks for it.
 */
const heights = new Map<string, number>()
try {
  for (const l of readFileSync(resolve(ROOT, 'docs', 'sf-queue.csv'), 'utf8').split('\n').slice(1)) {
    const c: string[] = []
    let cur = ''
    let q = false
    for (const ch of l) {
      if (ch === '"') q = !q
      else if (ch === ',' && !q) { c.push(cur); cur = '' }
      else cur += ch
    }
    c.push(cur)
    if (c[0] && Number(c[5]) > 0) heights.set(c[0], Number(c[5]))
  }
} catch { /* no queue yet */ }

const files = arg('file') ? [arg('file')] : readdirSync(dir).filter((f) => f.startsWith('reface-') && f.endsWith('.json'))
let bad = 0
let seen = 0
let fixed = 0
let noHeight = 0
let droppedLevels = 0
const unusual: string[] = []
for (const f of files) {
  const path = resolve(dir, f)
  const entries = JSON.parse(readFileSync(path, 'utf8')) as Entry[]
  const keep: Entry[] = []
  const drop: (Entry & { why: string })[] = []
  for (const e of entries) {
    seen++
    const id = Array.isArray(e.osm) ? e.osm[0] : e.osm
    const why: string[] = []
    // a STANDALONE entry stands on its own coordinates rather than on a building: a statue, a sign, a station
    // canopy, the courtyard of a complex mapped as several ways. Those carry lat/lon and size instead.
    const standalone = e.lat !== undefined && e.lon !== undefined && Array.isArray((e as { size?: unknown }).size)
    if (!id && !standalone) why.push('no osm id, and no lat/lon+size to stand on')
    if (e.restyle && !range.has(e.restyle)) why.push(`unknown style "${e.restyle}"`)
    // a height of zero flattens the building; a restyle without one leaves OSM's storeys, which is usually wrong
    // the queue's height always wins; an entry only keeps its own if we have nothing better
    const known = id ? heights.get(id) : undefined
    if (known !== undefined && e.height !== known) { e.height = known; fixed++ }
    /*
     * A missing height is not a reason to throw an entry away. OSM simply does not record one for a lot of
     * buildings — churches, halls, the cable car barn — and the queue has nothing better. The entry's style
     * and colours are still right, and without a height the building keeps the storeys OSM gave it, which is
     * what would have happened anyway. Worth saying, not worth rejecting.
     */
    if (e.restyle && (e.height === undefined || !(e.height > 2))) {
      delete e.height
      noHeight++
    }
    // storeys counted off a photograph are only wanted where OSM surveyed none; elsewhere the survey wins
    if (e.levels !== undefined && known !== undefined) { delete e.levels; droppedLevels++ }
    if (e.restyle && e.height && range.has(e.restyle)) {
      /*
       * The storey range is what is TYPICAL, and typical is not a rule. The model has looked at a photograph
       * and we have not (user, 2026-09-22: "a 10-story classical building is unusual, not impossible"), so an
       * unusual height is reported and kept, not rejected — its judgement about what the building looks like
       * is better evidence than our table of what buildings usually look like. Only the absurd is refused:
       * three times a style's ceiling is not an unusual example of that style, it is a mistake — and in
       * practice it is usually a mistake about WHICH BUILDING. Checked by eye, both of the first two: one
       * described the tenement-looking brick block in the foreground instead of the tower behind it, the
       * other read a brick mid-rise across the junction. So this is an aim alarm as much as a style check,
       * and a building that trips it wants re-photographing, not discarding.
       */
      const [, hi] = range.get(e.restyle)!
      const st = e.height / 3.1
      if (st > hi * 3) why.push(`${e.height} m is ~${st.toFixed(0)} storeys; ${e.restyle} tops out around ${hi} — probably a different building in the photograph`)
      else if (st > hi * 1.4 + 2) { unusual.push(`${e.name ?? id}: ${e.restyle} at ~${st.toFixed(0)} storeys (usually up to ${hi})`) }
    }
    for (const [k, v] of [['wall', e.wall], ['trim', e.trim], ['accent', e.accent]] as [string, string | undefined][]) {
      if (v !== undefined && !/^#[0-9a-fA-F]{6}$/.test(v)) why.push(`${k} "${v}" is not a hex colour`)
    }
    if (why.length > 0) { bad++; drop.push({ ...e, why: why.join('; ') }); console.log(`${f}  ${id}  ${e.name ?? ''}\n    ${why.join('\n    ')}`) } else keep.push(e)
  }
  if (fixed > 0 && !process.argv.includes('--strip')) writeFileSync(path, JSON.stringify([...keep, ...drop.map(({ why, ...e }) => e)], null, 2) + '\n')
  if (drop.length > 0 && process.argv.includes('--strip')) {
    const rej = resolve(ROOT, 'docs', 'sf-batches', `${f.replace(/\.json$/, '')}-rejected.json`)
    const had = existsSync(rej) ? JSON.parse(readFileSync(rej, 'utf8')) as unknown[] : []
    writeFileSync(rej, JSON.stringify([...had, ...drop], null, 2) + '\n')
    writeFileSync(path, JSON.stringify(keep, null, 2) + '\n')
    console.log(`  → ${drop.length} moved to ${rej}`)
  }
}
if (fixed > 0) console.log(`\n${fixed} heights set from the queue`)
if (noHeight > 0) console.log(`${noHeight} entries have no surveyed height — their counted storeys stand in`)
if (droppedLevels > 0) console.log(`${droppedLevels} counted storey-counts dropped: OSM had surveyed a height`)
if (unusual.length > 0) {
  console.log(`\n${unusual.length} unusually tall for their style — kept, but worth a look in the game:`)
  for (const u of unusual) console.log(`  ${u}`)
}
console.log(`\n${seen} entries, ${bad} failed`)
if (bad > 0 && !process.argv.includes('--strip')) console.log('run again with --strip to set them aside')
