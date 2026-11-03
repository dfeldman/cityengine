/**
 * An advisory judge: a stronger model looks at each answer's renders beside the photographs and marks the
 * building's signature features present or absent, then rates the likeness 1–5.
 *
 *   node --experimental-strip-types tools/benchmark/modeling/judge.ts <run label> [--judge=claude-sonnet-5-5]
 *
 * Run shoot.ts first (it writes runs/<label>/renders/). Writes runs/<label>/judged.json and judged.md.
 *
 * ADVISORY. The owner's eyes on the sheets are the verdict: models judging renders have been generous on this
 * project, and a judge that is also a contestant (Haiku) is never used. The judge sees the renders and the photos
 * — not the contestant's notes, which describe what it meant to build rather than what it built.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { HERE, loadBuildings } from './buildings.ts'
import { photoBytes } from './photos.ts'
import { loadRun } from './score.ts'

for (const f of [resolve(HERE, '.env'), resolve(HERE, '..', '..', '..', '.env')]) if (existsSync(f)) process.loadEnvFile(f)

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const label = process.argv[2]
if (!label) { console.error('usage: judge.ts <run label> [--judge=<model>]'); process.exit(1) }
const JUDGE = arg('judge', 'claude-sonnet-5-5')
if (JUDGE.includes('haiku')) { console.error('the judge must not be a contestant: pick a model other than Haiku'); process.exit(1) }

const SYSTEM = `You judge 3D models of real buildings. You see photographs of the building, then three renders of a simple model of it: from the front-right, from the back-left, and straight down (the red line is the footprint; the front is at the bottom of that view). The renders are flat-coloured blocks with no texture — judge FORM, PLACEMENT and COLOUR, not realism or detail.

For each listed feature, say whether the MODEL shows it: present, or absent. A feature in the wrong place, or too small to read from the street, is absent. Then rate the whole likeness:
1 = not this building (a generic box, or the wrong shape)
2 = right size and rough massing, but no signature features
3 = recognisable to someone who knows the building, with clear errors
4 = clearly this building; minor errors
5 = as good as simple blocks can make it

Reply with JSON only: {"features": [{"label": "...", "present": true}], "likeness": 3, "worst": "the single biggest thing wrong, one sentence"}`

const client = new Anthropic()
const byId = new Map(loadBuildings().map((b) => [b.id, b]))
const out: { building: string; modelId: string; sample: string; likeness: number | null; features: { label: string; present: boolean }[]; worst: string; cost: number }[] = []
let total = 0
for (const { rec, sample } of loadRun(label)) {
  const b = byId.get(rec.building)!
  if (rec.final.status !== 'ok') { out.push({ building: b.id, modelId: rec.modelId, sample, likeness: rec.final.status === 'bail' ? null : 1, features: b.features.map((f) => ({ label: f.label, present: false })), worst: rec.final.status, cost: 0 }); continue }
  const base = resolve(HERE, 'runs', label, 'renders', rec.modelId, `${b.id}${sample ? `.s${sample}` : ''}`)
  const renders = ['front34', 'rear34', 'top'].map((v) => `${base}-${v}.png`)
  if (!renders.every(existsSync)) { console.error(`  ${rec.modelId}/${b.id}: no renders — run shoot.ts ${label} first`); continue }
  const photos = await photoBytes(b, 2, 900)
  const img = (data: Buffer, media: 'image/jpeg' | 'image/png'): Anthropic.ImageBlockParam => ({ type: 'image', source: { type: 'base64', media_type: media, data: data.toString('base64') } })
  const res = await client.messages.create({
    model: JUDGE,
    max_tokens: 4000,
    output_config: { effort: 'low' },
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: [
      { type: 'text', text: `${b.name}, ${b.city}. Photographs:` },
      ...photos.map((p) => img(p, 'image/jpeg')),
      { type: 'text', text: 'The model, from the front-right, the back-left, and above:' },
      ...renders.map((f) => img(readFileSync(f), 'image/png')),
      { type: 'text', text: `Features:\n${b.features.map((f) => `- ${f.label}`).join('\n')}` },
    ] }],
  })
  const text = res.content.filter((x): x is Anthropic.TextBlock => x.type === 'text').map((x) => x.text).join('')
  const cost = (res.usage.input_tokens * 2 + res.usage.output_tokens * 10) / 1e6
  total += cost
  try {
    const j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
    out.push({ building: b.id, modelId: rec.modelId, sample, likeness: j.likeness, features: j.features, worst: j.worst, cost })
    console.log(`  ${rec.modelId.padEnd(20)} ${b.id.padEnd(24)} likeness ${j.likeness}  ${j.worst}`)
  } catch {
    console.error(`  ${rec.modelId}/${b.id}: the judge's reply did not parse`)
  }
}
const models = [...new Set(out.map((o) => o.modelId))].sort()
const md = [`# Judged: ${label} (advisory, by ${JUDGE})`, '', '| model | mean likeness | ≥3 (recognisable) | features present |', '|---|---|---|---|']
for (const m of models) {
  const s = out.filter((o) => o.modelId === m), rated = s.filter((o) => o.likeness !== null)
  const feats = s.flatMap((o) => o.features)
  md.push(`| ${m} | ${(rated.reduce((a, o) => a + (o.likeness ?? 0), 0) / Math.max(1, rated.length)).toFixed(2)} | ${rated.filter((o) => (o.likeness ?? 0) >= 3).length}/${s.length} | ${Math.round((100 * feats.filter((f) => f.present).length) / Math.max(1, feats.length))}% |`)
}
md.push('', `Judging cost about $${total.toFixed(3)}.`)
writeFileSync(resolve(HERE, 'runs', label, 'judged.json'), JSON.stringify(out, null, 1))
writeFileSync(resolve(HERE, 'runs', label, 'judged.md'), md.join('\n') + '\n')
console.log(md.join('\n'))
