/**
 * Run contestants over the benchmark: one building per request (no batching), photographs attached, the reply
 * checked by dsl.ts and — when a run allows more than one attempt — sent back with the checker's errors.
 *
 *   node --experimental-strip-types tools/benchmark/modeling/run.ts --model=haiku
 *   node --experimental-strip-types tools/benchmark/modeling/run.ts --model=qwen-local --attempts=3 --only=pantheon,coit-tower
 *   node --experimental-strip-types tools/benchmark/modeling/run.ts --model=openrouter:google/gemini-2.5-flash-lite --parallel=4
 *   node --experimental-strip-types tools/benchmark/modeling/run.ts --model=http://localhost:1234/v1#some-model   any OpenAI-compatible server
 *   node --experimental-strip-types tools/benchmark/modeling/run.ts --dry --only=pantheon        the exact prompt, no call
 *   node --experimental-strip-types tools/benchmark/modeling/run.ts --list-openrouter              cheap vision models now
 *
 * --plan=plan-v1 adds a first call (prompt/plan-v1.md) that decides the parts, positions and settings; the build call
 * gets that plan in its user turn and is told to build it. --effort=high overrides a model's effort.
 *
 * Options: --attempts=N (default 1: a repair turn is a different, easier test, so it is opt-in and recorded),
 * --photos=N (default 3), --px=N (longest side sent, default 1024), --text-only, --samples=K (each building K
 * times, for variance), --label=<run name> (default <date>-<prompt version>), --force (redo finished files).
 *
 * Results: runs/<label>/<model id>/<building>[.s<k>].json — the exact user text, every reply, the checker's
 * findings, tokens, cost and time. A finished file is skipped on a re-run, so an interrupted run resumes; a call
 * that failed outright (no key, server down) writes nothing and is retried.
 * score.ts reads them; nothing here judges quality.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import type Anthropic from '@anthropic-ai/sdk'
import { resolve } from 'node:path'
import { compile, extractJson } from './dsl.ts'
import { HERE, loadBuildings, type Building } from './buildings.ts'
import { planFor } from './plan.ts'
import { PROMPT_VERSION, feedbackText, planText, repairText, systemPrompt, userText } from './prompt.ts'
import { closeRenderer, renderViews } from './render.ts'
import { photoBytes } from './photos.ts'

interface ModelCfg {
  id: string
  provider: 'anthropic' | 'openai'
  model: string
  baseUrl?: string
  keyEnv?: string
  effort?: string
  maxTokens?: number
  temperature?: number
  timeoutS?: number
  price?: [number, number]
}

/** a conversation in neutral form, converted per provider */
/** `raw` keeps a provider's own assistant content (Anthropic's thinking blocks), handed back unchanged on the next turn */
type Turn = { role: 'user'; text: string; images?: Buffer[] } | { role: 'assistant'; text: string; raw?: unknown }
interface Reply { text: string; raw?: unknown; stop: string; input: number; output: number; cacheRead?: number; cacheWrite?: number; cost?: number; ms: number }

// keys may live in a gitignored .env beside this file or at the repo root (ANTHROPIC_API_KEY=…, OPENROUTER_API_KEY=…,
// STRATA_API_KEY=…), so a run needs no exported variable; anything already in the environment wins
for (const f of [resolve(HERE, '.env'), resolve(HERE, '..', '..', '..', '.env')]) if (existsSync(f)) process.loadEnvFile(f)

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const flag = (n: string): boolean => process.argv.includes(`--${n}`)

function modelConfig(id: string): ModelCfg {
  // any OpenAI-compatible server by address: --model=http://host:port/v1#model-id (no #: the first it lists)
  if (/^https?:\/\//.test(id)) {
    const [baseUrl, model = 'auto'] = id.split('#')
    return { id: `${new URL(baseUrl).host.replace(/[:.]/g, '_')}_${model}`.replace(/[/:]/g, '_'), provider: 'openai', model, baseUrl: baseUrl.replace(/\/$/, ''), timeoutS: 1800 }
  }
  if (id.startsWith('openrouter:')) {
    const slug = id.slice('openrouter:'.length)
    return { id: slug.replace(/[/:]/g, '_'), provider: 'openai', model: slug, baseUrl: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY' }
  }
  const all = JSON.parse(readFileSync(resolve(HERE, 'models.json'), 'utf8')).models as ModelCfg[]
  const m = all.find((x) => x.id === id)
  if (!m) throw new Error(`no model "${id}" in models.json (have: ${all.map((x) => x.id).join(', ')})`)
  return m
}

// ———————————————————————————————————————————————— providers

async function callAnthropic(cfg: ModelCfg, system: string, turns: Turn[]): Promise<Reply> {
  // loaded only when an Anthropic model runs, so the OpenAI-compatible path needs no install
  const { default: AnthropicClient } = await import('@anthropic-ai/sdk')
  const client = new AnthropicClient({ timeout: (cfg.timeoutS ?? 600) * 1000 })
  const messages: Anthropic.MessageParam[] = turns.map((t) => t.role === 'assistant'
    ? { role: 'assistant', content: (t.raw as Anthropic.ContentBlockParam[] | undefined) ?? t.text }
    : { role: 'user', content: [
      ...(t.images ?? []).map((b): Anthropic.ImageBlockParam => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b.toString('base64') } })),
      { type: 'text', text: t.text },
    ] })
  const t0 = Date.now()
  const res = await client.messages.create({
    model: cfg.model,
    max_tokens: cfg.maxTokens ?? 16000,
    // the system prompt is identical for every building: cached when it is long enough for the model's minimum
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    ...(cfg.effort ? { output_config: { effort: cfg.effort as 'low' | 'medium' | 'high' } } : {}),
    messages,
  })
  const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('')
  const u = res.usage
  const [pin, pout] = cfg.price ?? [0, 0]
  const cost = (pin * (u.input_tokens + (u.cache_creation_input_tokens ?? 0) * 1.25 + (u.cache_read_input_tokens ?? 0) * 0.1) + pout * u.output_tokens) / 1e6
  return { text, raw: res.content, stop: res.stop_reason ?? '', input: u.input_tokens, output: u.output_tokens, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0, cost, ms: Date.now() - t0 }
}

const autoModel = new Map<string, string>()
async function callOpenAI(cfg: ModelCfg, system: string, turns: Turn[]): Promise<Reply> {
  const key = cfg.keyEnv ? process.env[cfg.keyEnv] : undefined
  if (cfg.keyEnv && !key) throw new Error(`set ${cfg.keyEnv} for ${cfg.id}`)
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) }
  let model = cfg.model
  if (model === 'auto') {
    if (!autoModel.has(cfg.baseUrl!)) {
      const r = await fetch(`${cfg.baseUrl}/models`, { headers })
      if (!r.ok) throw new Error(`${cfg.baseUrl}/models: ${r.status} ${await r.text()}`)
      autoModel.set(cfg.baseUrl!, (await r.json()).data[0].id)
    }
    model = autoModel.get(cfg.baseUrl!)!
  }
  const openrouter = cfg.baseUrl?.includes('openrouter.ai')
  const body = {
    model,
    max_tokens: cfg.maxTokens ?? 16000,
    ...(cfg.temperature !== undefined ? { temperature: cfg.temperature } : {}),
    ...(openrouter ? { usage: { include: true } } : {}),
    // streamed: Node's fetch drops a request whose headers take over 300 s, which a slow local model's long answer does
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      { role: 'system', content: system },
      ...turns.map((t) => t.role === 'assistant' ? { role: 'assistant', content: t.text } : {
        role: 'user',
        content: [
          ...(t.images ?? []).map((b) => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b.toString('base64')}` } })),
          { type: 'text', text: t.text },
        ],
      }),
    ],
  }
  const t0 = Date.now()
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), (cfg.timeoutS ?? 600) * 1000)
  try {
    const r = await fetch(`${cfg.baseUrl}/chat/completions`, { method: 'POST', headers, body: JSON.stringify(body), signal: ctl.signal })
    if (!r.ok) throw new Error(`${r.status}: ${(await r.text()).slice(0, 500)}`)
    // server-sent events: one JSON chunk per `data:` line, the usage (and OpenRouter's cost) in the last one
    let text = '', stop = '', buf = ''
    let u: { prompt_tokens?: number; completion_tokens?: number; cost?: number } = {}
    const dec = new TextDecoder()
    for await (const piece of r.body as unknown as AsyncIterable<Uint8Array>) {
      buf += dec.decode(piece, { stream: true })
      let nl: number
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1)
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') continue
        const j = JSON.parse(data)
        if (j.error) throw new Error(JSON.stringify(j.error).slice(0, 500))
        const c = j.choices?.[0]
        if (typeof c?.delta?.content === 'string') text += c.delta.content
        if (c?.finish_reason) stop = c.finish_reason
        if (j.usage) u = j.usage
      }
    }
    const [pin, pout] = cfg.price ?? [0, 0]
    const input = u.prompt_tokens ?? 0, output = u.completion_tokens ?? 0
    return { text, stop, input, output, cost: typeof u.cost === 'number' ? u.cost : (pin * input + pout * output) / 1e6, ms: Date.now() - t0 }
  } finally { clearTimeout(timer) }
}

const call = (cfg: ModelCfg, system: string, turns: Turn[]): Promise<Reply> =>
  cfg.provider === 'anthropic' ? callAnthropic(cfg, system, turns) : callOpenAI(cfg, system, turns)

// ———————————————————————————————————————————————— one building

export interface Attempt { kind?: 'answer' | 'repair' | 'feedback'; reply: string; stop: string; input: number; output: number; cacheRead?: number; cost: number; ms: number; parseError?: string; errors: string[]; warnings: string[]; callError?: string }
export interface RunRecord {
  building: string
  modelId: string
  model: string
  provider: string
  promptVersion: string
  photos: number
  px: number
  textOnly: boolean
  maxAttempts: number
  /** a feedback round was allowed: the model saw its first valid answer rendered, and revised it */
  feedback?: boolean
  /** checked leniently (v3 onwards): near-misses clamped, broken parts dropped with a warning */
  lenient?: boolean
  startedAt: string
  userText: string
  /** the footprint and height exactly as given, so a record can be rendered and scored on its own */
  plan: { size: [number, number]; outline: [number, number][]; height: number; turn: number }
  attempts: Attempt[]
  final: { status: 'ok' | 'bail' | 'invalid' | 'error'; json?: unknown; notes?: string; bail?: string; triangles?: number; parts?: number; feedbackFailed?: boolean }
  /** with feedback: the first valid answer, before the model saw it rendered */
  draft?: { json: unknown; notes?: string; triangles: number; parts: number }
  /** with --plan: the planning call that chose the parts before the build, and what it chose */
  planner?: { prompt: string; reply: string; json?: unknown; parseError?: string; input: number; output: number; cost: number; ms: number; callError?: string }
  totals: { input: number; output: number; cost: number; ms: number }
}

async function runOne(cfg: ModelCfg, b: Building, o: { photos: number; px: number; textOnly: boolean; attempts: number; feedback: boolean; prompt: string; lenient: boolean; plan: string }): Promise<RunRecord> {
  const plan = await planFor(b)
  const count = o.textOnly ? 0 : Math.min(o.photos, b.photos.length)
  const text = userText(b, plan, count, o.textOnly)
  const images = count ? await photoBytes(b, count, o.px) : []
  const system = systemPrompt(o.prompt)
  // --plan: a first call decides the parts and their settings; the build call is held to that plan
  let planned: RunRecord['planner'] | undefined
  let buildText = text
  if (o.plan) {
    planned = { prompt: o.plan, reply: '', input: 0, output: 0, cost: 0, ms: 0 }
    try {
      const r = await call(cfg, systemPrompt(o.plan), [{ role: 'user', text, images }])
      Object.assign(planned, { reply: r.text, input: r.input, output: r.output, cost: r.cost ?? 0, ms: r.ms })
      const pj = extractJson(r.text)
      if (pj.error) planned.parseError = pj.error
      else {
        planned.json = pj.value
        buildText = `${text}\n\n${planText(pj.value)}`
      }
    } catch (e) { planned.callError = (e as Error).message }
  }
  const turns: Turn[] = [{ role: 'user', text: buildText, images }]
  const rec: RunRecord = {
    building: b.id, modelId: cfg.id, model: cfg.model, provider: cfg.provider, promptVersion: o.prompt, photos: count, px: o.px,
    textOnly: o.textOnly, maxAttempts: o.attempts, feedback: o.feedback, lenient: o.lenient, startedAt: new Date().toISOString(), userText: text,
    plan: { size: plan.size, outline: plan.outline, height: b.height, turn: plan.turn }, attempts: [],
    final: { status: 'error' }, totals: { input: planned?.input ?? 0, output: planned?.output ?? 0, cost: planned?.cost ?? 0, ms: planned?.ms ?? 0 },
    ...(planned ? { planner: planned } : {}),
  }
  // `attempts` bounds the answer and its repairs; the one feedback round comes on top, after the first valid answer
  let repairsLeft = o.attempts - 1
  let kind: Attempt['kind'] = 'answer'
  for (;;) {
    let r: Reply
    try { r = await call(cfg, system, turns) } catch (e) {
      rec.attempts.push({ kind, reply: '', stop: 'error', input: 0, output: 0, cost: 0, ms: 0, errors: [], warnings: [], callError: (e as Error).message })
      break
    }
    const a: Attempt = { kind, reply: r.text, stop: r.stop, input: r.input, output: r.output, cacheRead: r.cacheRead, cost: r.cost ?? 0, ms: r.ms, errors: [], warnings: [] }
    rec.attempts.push(a)
    rec.totals.input += r.input; rec.totals.output += r.output; rec.totals.cost += a.cost; rec.totals.ms += r.ms
    turns.push({ role: 'assistant', text: r.text, raw: r.raw })
    const parsed = extractJson(r.text)
    let problems: string[]
    if (parsed.error) { a.parseError = parsed.error; problems = [parsed.error + (r.stop === 'max_tokens' || r.stop === 'length' ? ' (the reply was cut off at the token limit: use fewer parts and "repeat")' : '')] } else {
      const c = compile(parsed.value, { lenient: o.lenient })
      a.errors = c.errors; a.warnings = c.warnings
      if (c.ok && c.bail) { rec.final = { status: 'bail', bail: c.bail, json: parsed.value }; return rec }
      if (c.ok && o.feedback && !rec.draft) {
        // the feedback round: the answer drawn from the judging views, beside the photographs already in the conversation
        rec.draft = { json: parsed.value, notes: c.notes, triangles: c.triangles, parts: c.parts.length }
        const renders = await renderViews(parsed.value, plan.outline, b.height, ['front34', 'rear34', 'top'], 640, 480)
        turns.push({ role: 'user', text: feedbackText(), images: renders })
        kind = 'feedback'
        continue
      }
      if (c.ok) { rec.final = { status: 'ok', json: parsed.value, notes: c.notes, triangles: c.triangles, parts: c.parts.length }; return rec }
      problems = c.errors
    }
    if (repairsLeft-- <= 0) break
    turns.push({ role: 'user', text: repairText(problems) })
    kind = 'repair'
  }
  const last = rec.attempts[rec.attempts.length - 1]
  if (rec.draft) {
    // the revision broke and could not be repaired: the draft stands, and the record says so
    rec.final = { status: 'ok', json: rec.draft.json, notes: rec.draft.notes, triangles: rec.draft.triangles, parts: rec.draft.parts, feedbackFailed: true }
  } else if (rec.attempts.every((x) => x.callError)) rec.final = { status: 'error' }
  else {
    const p = extractJson(last?.reply ?? '')
    rec.final = p.value ? { status: 'invalid', json: p.value } : { status: 'invalid' }
  }
  return rec
}

// ———————————————————————————————————————————————— the CLI

async function listOpenRouter(): Promise<void> {
  const j = await (await fetch('https://openrouter.ai/api/v1/models')).json()
  type M = { id: string; context_length: number; pricing: { prompt: string; completion: string }; architecture?: { input_modalities?: string[] } }
  const rows = (j.data as M[])
    .filter((m) => m.architecture?.input_modalities?.includes('image') && Number(m.pricing.prompt) >= 0 && Number(m.pricing.prompt) * 1e6 <= Number(arg('max-in', '0.5')))
    .sort((a, b) => Number(a.pricing.prompt) + Number(a.pricing.completion) / 4 - (Number(b.pricing.prompt) + Number(b.pricing.completion) / 4))
  for (const m of rows) console.log(`${m.id.padEnd(56)} $${(Number(m.pricing.prompt) * 1e6).toFixed(3)} in  $${(Number(m.pricing.completion) * 1e6).toFixed(3)} out  ${Math.round(m.context_length / 1000)}k`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (flag('list-openrouter')) { await listOpenRouter(); process.exit(0) }
  const only = arg('only').split(',').filter(Boolean)
  const buildings = loadBuildings().filter((b) => only.length === 0 || only.includes(b.id))
  const o = { photos: Number(arg('photos', '3')), px: Number(arg('px', '1024')), textOnly: flag('text-only'), attempts: Math.max(1, Number(arg('attempts', '1'))), feedback: flag('feedback'), prompt: arg('prompt', PROMPT_VERSION), lenient: false, plan: arg('plan') }
  // v3 onwards is checked leniently: a near-miss is clamped or dropped with a warning rather than failing the answer
  o.lenient = flag('lenient') || !['v1', 'v2'].includes(o.prompt)
  if (flag('dry')) {
    const b = buildings[0]
    console.log(systemPrompt(o.prompt), '\n——— user ———\n', userText(b, await planFor(b), Math.min(o.photos, b.photos.length), o.textOnly))
    process.exit(0)
  }
  const missing = buildings.filter((b) => !o.textOnly && b.photos.length === 0)
  if (missing.length) { console.error(`no photographs chosen for: ${missing.map((b) => b.id).join(', ')} (or pass --text-only)`); process.exit(1) }
  // --effort=high overrides the models' own effort (Anthropic models)
  const models = arg('model', 'haiku').split(',').map(modelConfig).map((m) => (arg('effort') ? { ...m, effort: arg('effort') } : m))
  const label = arg('label', `${new Date().toISOString().slice(0, 10)}-${o.prompt}${o.plan ? `-${o.plan}` : ''}${o.feedback ? '-fb' : ''}${o.textOnly ? '-text' : ''}`)
  const samples = Math.max(1, Number(arg('samples', '1')))
  const parallel = Math.max(1, Number(arg('parallel', '1')))
  for (const cfg of models) {
    const dir = resolve(HERE, 'runs', label, cfg.id)
    mkdirSync(dir, { recursive: true })
    const jobs: { b: Building; s: number; file: string }[] = []
    for (const b of buildings) for (let s = 1; s <= samples; s++) {
      const file = resolve(dir, `${b.id}${samples > 1 ? `.s${s}` : ''}.json`)
      if (!existsSync(file) || flag('force')) jobs.push({ b, s, file })
    }
    console.log(`${cfg.id}: ${jobs.length} to run → ${dir}`)
    let next = 0
    await Promise.all(Array.from({ length: Math.min(parallel, jobs.length) }, async () => {
      while (next < jobs.length) {
        const j = jobs[next++]
        const rec = await runOne(cfg, j.b, o)
        // a call that never got an answer (no key, server down) is not a result: left unwritten, so a re-run retries it
        if (rec.final.status !== 'error') writeFileSync(j.file, JSON.stringify(rec, null, 1))
        const last = rec.attempts[rec.attempts.length - 1]
        console.log(`  ${j.b.id.padEnd(24)} ${rec.final.status.padEnd(7)}${rec.final.feedbackFailed ? '*' : ' '}${rec.attempts.length} try  ${String(rec.final.parts ?? '-').padStart(4)} parts  ${(rec.totals.ms / 1000).toFixed(0).padStart(4)} s  $${rec.totals.cost.toFixed(4)}${last?.callError ? `  ${last.callError.slice(0, 120)}` : ''}${rec.final.status === 'invalid' ? `  ${(last?.parseError ?? last?.errors[0] ?? '').slice(0, 100)}` : ''}`)
      }
    }))
  }
  await closeRenderer()
}
