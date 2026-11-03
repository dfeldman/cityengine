/**
 * Best of N: a cheap model looks at each building's N rendered answers beside the photographs and picks the one
 * most like the building. The pick becomes a run of its own, so it is scored and rendered like any other.
 *
 *   node --experimental-strip-types tools/benchmark/modeling/run.ts --model=haiku --prompt=v4 --plan=plan-v2 --samples=3 --label=<L>
 *   node --experimental-strip-types tools/benchmark/modeling/shoot.ts <L>
 *   node --experimental-strip-types tools/benchmark/modeling/select.ts <L> [--model=haiku] [--selector=claude-haiku-5-5]
 *        → runs/<L>-best/<model>/<building>.json (and its renders, copied)
 *
 * Choosing among candidates is a different task from grading one's own answer, which models on this project
 * have done generously: the selector sees only the photographs and the renders, never the notes, and its choice is
 * then judged like everything else. Its cost is added to the chosen record's totals.
 */
import Anthropic from '@anthropic-ai/sdk'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { HERE, loadBuildings } from './buildings.ts'
import { photoBytes } from './photos.ts'
import type { RunRecord } from './run.ts'

for (const f of [resolve(HERE, '.env'), resolve(HERE, '..', '..', '..', '.env')]) if (existsSync(f)) process.loadEnvFile(f)
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const label = process.argv[2]
if (!label) { console.error('usage: select.ts <run label> [--model=haiku]'); process.exit(1) }
const model = arg('model', 'haiku'), selector = arg('selector', 'claude-haiku-5-5')
const price: Record<string, [number, number]> = { 'claude-haiku-5-5': [0.1, 0.5], 'claude-sonnet-5-5': [2, 10] }
const src = resolve(HERE, 'runs', label, model), dst = resolve(HERE, 'runs', `${label}-best`, model)
const srcR = resolve(HERE, 'runs', label, 'renders', model), dstR = resolve(HERE, 'runs', `${label}-best`, 'renders', model)
mkdirSync(dst, { recursive: true }); mkdirSync(dstR, { recursive: true })

const SYSTEM = `You compare simple 3D models of a real building with photographs of it. The models are plain coloured blocks with no texture, each shown from the front-right and from above (the red line on the ground is the footprint). Judge which model is MOST LIKE THE BUILDING in the photographs: its overall shape and massing, its signature features (domes, towers, colonnades, courts, arches, roofs), their positions and proportions, and its colours. Ignore how detailed a model is unless the detail matches the photographs. Reply with JSON only: {"best": <number of the model>, "why": "one sentence"}`

const client = new Anthropic()
const img = (b: Buffer, media: 'image/jpeg' | 'image/png'): Anthropic.ImageBlockParam => ({ type: 'image', source: { type: 'base64', media_type: media, data: b.toString('base64') } })
let total = 0
for (const b of loadBuildings()) {
  const files = readdirSync(src).filter((f) => f.startsWith(`${b.id}.`) && f.endsWith('.json') || f === `${b.id}.json`).sort()
  const cands = files.map((f) => ({ f, rec: JSON.parse(readFileSync(resolve(src, f), 'utf8')) as RunRecord }))
    .map((c) => ({ ...c, stem: c.f.replace(/\.json$/, '') }))
  const ok = cands.filter((c) => c.rec.final.status === 'ok' && existsSync(resolve(srcR, `${c.stem}-front34.png`)))
  if (ok.length === 0) { if (cands[0]) writeFileSync(resolve(dst, `${b.id}.json`), JSON.stringify(cands[0].rec, null, 1)); console.log(`  ${b.id}: no valid candidate`); continue }
  let pick = 0, why = 'only one valid candidate', cost = 0
  if (ok.length > 1) {
    const photos = await photoBytes(b, 3, 900)
    const content: Anthropic.ContentBlockParam[] = [{ type: 'text', text: `${b.name}, ${b.city}. Photographs:` }, ...photos.map((p) => img(p, 'image/jpeg'))]
    ok.forEach((c, i) => content.push({ type: 'text', text: `Model ${i + 1}, from the front-right and from above:` },
      img(readFileSync(resolve(srcR, `${c.stem}-front34.png`)), 'image/png'), img(readFileSync(resolve(srcR, `${c.stem}-top.png`)), 'image/png')))
    content.push({ type: 'text', text: `Which of the ${ok.length} models is most like the building? Reply with JSON only.` })
    const res = await client.messages.create({ model: selector, max_tokens: 2000, output_config: { effort: 'low' }, system: SYSTEM, messages: [{ role: 'user', content }] })
    const text = res.content.filter((x): x is Anthropic.TextBlock => x.type === 'text').map((x) => x.text).join('')
    const [pin, pout] = price[selector] ?? [0, 0]
    cost = (res.usage.input_tokens * pin + res.usage.output_tokens * pout) / 1e6
    try {
      const j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
      pick = Math.max(0, Math.min(ok.length - 1, Number(j.best) - 1)); why = String(j.why ?? '')
    } catch { why = 'the selector reply did not parse; first candidate kept' }
  }
  total += cost
  // the pick, with the whole set's cost (every candidate was paid for, and the selector)
  const chosen = ok[pick]
  const all = cands.reduce((s, c) => s + c.rec.totals.cost, 0) + cost
  const rec = { ...chosen.rec, selected: { from: cands.length, valid: ok.length, pick: chosen.stem, why, selectorCost: cost }, totals: { ...chosen.rec.totals, cost: all } }
  writeFileSync(resolve(dst, `${b.id}.json`), JSON.stringify(rec, null, 1))
  for (const v of ['front34', 'rear34', 'top']) copyFileSync(resolve(srcR, `${chosen.stem}-${v}.png`), resolve(dstR, `${b.id}-${v}.png`))
  console.log(`  ${b.id.padEnd(24)} picked ${chosen.stem.padEnd(30)} of ${ok.length}  ${why.slice(0, 90)}`)
}
console.log(`selector cost $${total.toFixed(4)}`)
