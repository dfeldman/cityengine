/**
 * Hand-written answers (examples/<building>.json) put through the whole pipeline as a contestant's would be:
 * checked, scored and rendered. A check of the tools, and a picture of what an answer can look like.
 *
 *   node --experimental-strip-types tools/benchmark/modeling/examples.ts
 *   node --experimental-strip-types tools/benchmark/modeling/shoot.ts examples
 *
 * They are never shown to contestants: a worked example of a set building would be the answer.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compile } from './dsl.ts'
import { HERE, loadBuildings } from './buildings.ts'
import { planFor } from './plan.ts'
import { PROMPT_VERSION } from './prompt.ts'
import type { RunRecord } from './run.ts'

const dir = resolve(HERE, 'runs', 'examples', 'hand')
mkdirSync(dir, { recursive: true })
const byId = new Map(loadBuildings().map((b) => [b.id, b]))
for (const f of readdirSync(resolve(HERE, 'examples')).filter((f) => f.endsWith('.json'))) {
  const b = byId.get(f.replace('.json', ''))
  if (!b) { console.error(`  ${f}: not a benchmark building`); continue }
  const json = JSON.parse(readFileSync(resolve(HERE, 'examples', f), 'utf8'))
  const c = compile(json, { lenient: true })
  const plan = await planFor(b)
  const rec: RunRecord = {
    building: b.id, modelId: 'hand', model: 'hand', provider: 'none', promptVersion: PROMPT_VERSION, photos: 0, px: 0, textOnly: false,
    maxAttempts: 1, startedAt: new Date().toISOString(), userText: '', plan: { size: plan.size, outline: plan.outline, height: b.height, turn: plan.turn },
    attempts: [], final: c.ok ? { status: 'ok', json, notes: c.notes, triangles: c.triangles, parts: c.parts.length } : { status: 'invalid', json },
    totals: { input: 0, output: 0, cost: 0, ms: 0 },
  }
  writeFileSync(resolve(dir, f), JSON.stringify(rec, null, 1))
  console.log(`  ${b.id.padEnd(24)} ${c.ok ? 'ok' : 'INVALID'}  ${c.triangles} triangles  ${c.errors.slice(0, 3).join('; ')}`)
}
