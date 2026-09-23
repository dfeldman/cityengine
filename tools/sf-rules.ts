/**
 * What the bake's building classifier actually did, and where it was guessing.
 *
 * `docs/<city>-archetypes.csv` is written by tools/bake.ts: one row per building, with the archetype, the style
 * and the NAME OF THE RULE that chose them (src/city/sf/btype.ts). This reads it back (user, 2026-09-22: "I
 * hope we recorded which buildings were refaced and by which method so that we can fix ones that are
 * consistently wrong"). A style that is wrong is almost never wrong for one building — it is wrong for every
 * building one rule touched, so the fix is one edit to that rule, and this says which rule to edit and how many
 * buildings ride on it.
 *
 *   node --experimental-strip-types tools/sf-rules.ts                 every rule, by how many buildings it decided
 *   node --experimental-strip-types tools/sf-rules.ts --rule=tall     the buildings one rule decided, tallest first
 *   node --experimental-strip-types tools/sf-rules.ts --style=skyscraper   …or every building wearing one style
 *   node --experimental-strip-types tools/sf-rules.ts --guessing      the ones nothing was known about
 *
 * `--guessing` is the queue worth a photograph: no district record and no useful OSM tag, so the rule that
 * fired was a fallback. Those are where a cheap model with a picture earns its keep; everything else is a rule.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'san-francisco')
const file = resolve(ROOT, 'docs', `${city}-archetypes.csv`)
if (!existsSync(file)) {
  console.error(`no ${file} — it is written by a bake (npm run bake ${city}), so run one first`)
  process.exit(1)
}

interface Row { osm: string; lat: number; lon: number; height: number; area: number; district: string; archetype: string; rule: string; style: string; note: string }
const rows: Row[] = readFileSync(file, 'utf8').split('\n').slice(1).filter(Boolean).map((l) => {
  const c = l.split(',')
  return { osm: c[0], lat: Number(c[1]), lon: Number(c[2]), height: Number(c[3]), area: Number(c[4]),
    district: c[5], archetype: c[6], rule: c[7], style: c[8], note: c[9] ?? '' }
})

/*
 * Which buildings a rule change may safely re-decide. A manifest entry was PAID FOR — a model looked at a
 * photograph of that building — and the classifier never touches it: restyles are applied when the package is
 * loaded (src/render/landmarks.ts), over whatever the bake decided. So editing a rule affects exactly the
 * unclaimed buildings, and this hides the rest by default (user, 2026-09-22: "we should be able to go back and
 * change our deterministic rules, and only affect those buildings that were determined deterministically in
 * the first place, without overwriting any AI result that we paid for"). `--all` shows both.
 */
const claimed = new Set<string>()
const dir = resolve(ROOT, 'public', 'landmarks', city)
if (existsSync(dir)) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    try {
      for (const e of JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as { osm?: string | string[] }[]) {
        for (const id of Array.isArray(e.osm) ? e.osm : e.osm ? [e.osm] : []) claimed.add(id)
      }
    } catch { /* mid-write */ }
  }
}
const all = process.argv.includes('--all')
if (!all) {
  const before = rows.length
  for (let i = rows.length - 1; i >= 0; i--) if (claimed.has(rows[i].osm)) rows.splice(i, 1)
  if (before !== rows.length) console.log(`(${before - rows.length} buildings held by a manifest entry are not shown; --all includes them)\n`)
}

const show = (list: Row[], n = 40): void => {
  for (const r of list.sort((a, b) => b.height - a.height).slice(0, n)) {
    console.log(`${String(r.height).padStart(4)} m  ${r.style.padEnd(13)} ${r.archetype.padEnd(15)} ${r.district.padEnd(12)} ${r.lat.toFixed(5)},${r.lon.toFixed(5)}  ${r.osm}`)
  }
  if (list.length > n) console.log(`  …and ${list.length - n} more`)
}

const rule = arg('rule')
const style = arg('style')
if (rule) { const l = rows.filter((r) => r.rule === rule); console.log(`${l.length} buildings decided by rule "${rule}"`); show(l) }
else if (style) { const l = rows.filter((r) => r.style === style); console.log(`${l.length} buildings wearing "${style}"`); show(l) }
else if (process.argv.includes('--guessing')) {
  // a fallback rule is one that fired because nothing else did: the last resort in each branch of the classifier
  const FALLBACK = new Set(['default', 'residential-district', 'downtown-default', 'narrow-lot', 'chooseStyle', 'tall'])
  const l = rows.filter((r) => FALLBACK.has(r.rule))
  console.log(`${l.length} of ${rows.length} buildings fell through to a fallback rule — these are the ones a photograph would settle`)
  show(l, 60)
} else {
  const by = new Map<string, { n: number; tall: number; styles: Set<string> }>()
  for (const r of rows) {
    const e = by.get(r.rule) ?? { n: 0, tall: 0, styles: new Set<string>() }
    e.n++
    if (r.height >= 30) e.tall++
    e.styles.add(r.style)
    by.set(r.rule, e)
  }
  console.log(`${rows.length} buildings, ${by.size} rules\n`)
  console.log('     n   ≥30m  rule                  styles')
  for (const [k, v] of [...by].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`${String(v.n).padStart(6)} ${String(v.tall).padStart(6)}  ${k.padEnd(21)} ${[...v.styles].join(' ')}`)
  }
}
