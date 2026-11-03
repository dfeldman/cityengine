/**
 * The deterministic half of the score: what can be measured from an answer's parts without looking at it.
 *
 *   node --experimental-strip-types tools/benchmark/modeling/score.ts <run label>      → runs/<label>/scores.md, scores.json
 *
 * Per answer: did it build (and on which attempt), did it bail, how well its plan covers the footprint (IoU on a
 * grid), how close its top is to the given height, and which of the building's signature features its parts can
 * be shown to contain (buildings.json `check`: "a dome at least 10 m across", "40 columns"). That last is a floor,
 * not a judgement — a dome in the wrong place passes it — so the screening score below only sorts answers for the
 * render sheet (shoot.ts), where the deciding look happens. Every model that has judged its own output on this
 * project has graded it generously (MODELING_IMPROVEMENT_1.md); nothing here reads a model's own notes as evidence.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { compile, type PartInfo, type XZ } from './dsl.ts'
import { HERE, loadBuildings, type Building, type Feature } from './buildings.ts'
import type { RunRecord } from './run.ts'

export interface Score {
  building: string
  modelId: string
  sample: string
  status: RunRecord['final']['status']
  attempts: number
  /** built only after a repair turn (a feedback round is not a repair) */
  repaired: boolean
  parts: number
  triangles: number
  types: string[]
  /** footprint coverage, intersection over union, 0..1 */
  iou: number
  /** model area outside the footprint, as a share of the footprint */
  spill: number
  /** the model's top over the given height */
  heightRatio: number
  features: { label: string; pass: boolean | null }[]
  featureRate: number | null
  screen: number
  cost: number
  seconds: number
  input: number
  output: number
}

function inPoly(p: XZ, poly: XZ[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j]
    if ((zi > p[1]) !== (zj > p[1]) && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

/** plan coverage on a grid of about 150 cells across the footprint */
export function coverage(positions: number[], indices: number[], outline: XZ[]): { iou: number; spill: number } {
  const xs = outline.map((p) => p[0]), zs = outline.map((p) => p[1])
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs))
  const cell = span / 150
  const pad = span * 0.5
  const x0 = Math.min(...xs) - pad, z0 = Math.min(...zs) - pad
  const nx = Math.ceil((span + 2 * pad) / cell) + 1, nz = nx
  const model = new Uint8Array(nx * nz)
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t] * 3, b = indices[t + 1] * 3, c = indices[t + 2] * 3
    const ax = positions[a], az = positions[a + 2], bx = positions[b], bz = positions[b + 2], cx = positions[c], cz = positions[c + 2]
    const area = (bx - ax) * (cz - az) - (bz - az) * (cx - ax)
    if (Math.abs(area) < 1e-6) continue // a wall seen from above: its caps do the covering
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - x0) / cell)), i1 = Math.min(nx - 1, Math.ceil((Math.max(ax, bx, cx) - x0) / cell))
    const j0 = Math.max(0, Math.floor((Math.min(az, bz, cz) - z0) / cell)), j1 = Math.min(nz - 1, Math.ceil((Math.max(az, bz, cz) - z0) / cell))
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const px = x0 + (i + 0.5) * cell, pz = z0 + (j + 0.5) * cell
      const w0 = ((bx - px) * (cz - pz) - (bz - pz) * (cx - px)) / area
      const w1 = ((cx - px) * (az - pz) - (cz - pz) * (ax - px)) / area
      if (w0 >= 0 && w1 >= 0 && w0 + w1 <= 1) model[i * nz + j] = 1
    }
  }
  let both = 0, either = 0, planCells = 0, outside = 0
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const p = inPoly([x0 + (i + 0.5) * cell, z0 + (j + 0.5) * cell], outline), m = model[i * nz + j] === 1
    if (p) planCells++
    if (p && m) both++
    if (p || m) either++
    if (m && !p) outside++
  }
  return { iou: either ? both / either : 0, spill: planCells ? outside / planCells : 0 }
}

export function checkFeature(f: Feature, parts: PartInfo[]): boolean | null {
  const c = f.check
  if (!c) return null
  const match = parts.filter((p) =>
    (!c.types || c.types.includes(p.type)) &&
    (!c.material || p.material === c.material) &&
    (c.minTop === undefined || p.max[1] >= c.minTop) &&
    (c.maxTop === undefined || p.max[1] <= c.maxTop) &&
    (c.minRadius === undefined || (p.radius ?? 0) >= c.minRadius))
  if (c.minColumns !== undefined) return match.reduce((s, p) => s + p.columns, 0) >= c.minColumns
  if (c.minArches !== undefined) return match.reduce((s, p) => s + p.arches, 0) >= c.minArches
  return match.length >= (c.min ?? 1)
}

export function scoreRecord(rec: RunRecord, b: Building, sample = ''): Score {
  const base = {
    building: rec.building, modelId: rec.modelId, sample, status: rec.final.status, attempts: rec.attempts.length,
    repaired: rec.attempts.some((a) => a.kind === 'repair') || (!rec.feedback && rec.attempts.length > 1),
    cost: rec.totals.cost, seconds: rec.totals.ms / 1000, input: rec.totals.input, output: rec.totals.output,
  }
  const empty = { parts: 0, triangles: 0, types: [], iou: 0, spill: 0, heightRatio: 0, features: b.features.map((f) => ({ label: f.label, pass: f.check ? false : null })), featureRate: b.features.some((f) => f.check) ? 0 : null, screen: 0 }
  if (rec.final.status !== 'ok') return { ...base, ...empty }
  // lenient for drawing and scoring: an answer that was valid strictly compiles identically, a v3 answer as it was accepted
  const c = compile(rec.final.json, { lenient: true })
  const top = c.parts.reduce((m, p) => Math.max(m, p.max[1]), 0)
  const { iou, spill } = coverage(c.mesh.positions, c.mesh.indices, rec.plan.outline)
  const features = b.features.map((f) => ({ label: f.label, pass: checkFeature(f, c.parts) }))
  const checked = features.filter((f) => f.pass !== null)
  const featureRate = checked.length ? checked.filter((f) => f.pass).length / checked.length : null
  const heightRatio = top / rec.plan.height
  const heightScore = 1 - Math.min(1, Math.abs(heightRatio - 1) / 0.5)
  const screen = Math.round(100 * (0.4 * (featureRate ?? 0.5) + 0.3 * iou + 0.2 * heightScore + 0.1 * (1 - Math.min(1, spill))))
  return { ...base, parts: c.parts.length, triangles: c.triangles, types: [...new Set(c.parts.map((p) => p.type))].sort(), iou, spill, heightRatio, features, featureRate, screen }
}

export function loadRun(label: string): { rec: RunRecord; sample: string }[] {
  const dir = resolve(HERE, 'runs', label)
  if (!existsSync(dir)) throw new Error(`no run ${dir}`)
  const out: { rec: RunRecord; sample: string }[] = []
  for (const m of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()))
    for (const f of readdirSync(resolve(dir, m.name)).filter((f) => f.endsWith('.json')))
      out.push({ rec: JSON.parse(readFileSync(resolve(dir, m.name, f), 'utf8')), sample: f.match(/\.s(\d+)\.json$/)?.[1] ?? '' })
  return out
}

const pct = (x: number | null): string => (x === null ? '—' : `${Math.round(x * 100)}%`)
const mean = (xs: number[]): number => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)

if (import.meta.url === `file://${process.argv[1]}`) {
  const label = process.argv[2]
  if (!label) { console.error('usage: score.ts <run label>  (a folder under runs/)'); process.exit(1) }
  const byId = new Map(loadBuildings().map((b) => [b.id, b]))
  const scores = loadRun(label).map(({ rec, sample }) => scoreRecord(rec, byId.get(rec.building)!, sample))
  const models = [...new Set(scores.map((s) => s.modelId))].sort()
  const md: string[] = [`# Scores: ${label}`, '', 'Screening numbers from the parts alone (score.ts); the verdict is the render sheet (shoot.ts).', '',
    '| model | built | bailed | invalid | features found | footprint IoU | height ratio | screen | $/building | s/building | part types used |', '|---|---|---|---|---|---|---|---|---|---|---|']
  for (const m of models) {
    const s = scores.filter((x) => x.modelId === m), ok = s.filter((x) => x.status === 'ok')
    const fr = s.map((x) => x.featureRate).filter((x): x is number => x !== null)
    md.push(`| ${m} | ${ok.length}/${s.length}${ok.some((x) => x.repaired) ? ` (${ok.filter((x) => x.repaired).length} after repair)` : ''} | ${s.filter((x) => x.status === 'bail').length} | ${s.filter((x) => x.status === 'invalid' || x.status === 'error').length} | ${pct(mean(fr))} | ${mean(ok.map((x) => x.iou)).toFixed(2)} | ${mean(ok.map((x) => x.heightRatio)).toFixed(2)} | ${mean(s.map((x) => x.screen)).toFixed(0)} | $${mean(s.map((x) => x.cost)).toFixed(4)} | ${mean(s.map((x) => x.seconds)).toFixed(0)} | ${new Set(ok.flatMap((x) => x.types)).size} |`)
  }
  md.push('', '## Per building', '', `| building | ${models.join(' | ')} |`, `|---|${models.map(() => '---').join('|')}|`)
  for (const b of byId.values()) {
    const cells = models.map((m) => {
      const s = scores.filter((x) => x.modelId === m && x.building === b.id)
      if (!s.length) return ''
      return s.map((x) => x.status === 'ok' ? `${x.screen} (${x.features.filter((f) => f.pass).length}/${x.features.filter((f) => f.pass !== null).length}f)` : x.status).join(', ')
    })
    md.push(`| ${b.id} | ${cells.join(' | ')} |`)
  }
  md.push('', '## Features never found', '')
  for (const b of byId.values()) for (const f of b.features.filter((f) => f.check)) {
    const s = scores.filter((x) => x.building === b.id && x.status === 'ok')
    const found = s.filter((x) => x.features.find((y) => y.label === f.label)?.pass).map((x) => x.modelId)
    if (s.length && found.length === 0) md.push(`- **${b.id}**: ${f.label}`)
  }
  writeFileSync(resolve(HERE, 'runs', label, 'scores.json'), JSON.stringify(scores, null, 1))
  writeFileSync(resolve(HERE, 'runs', label, 'scores.md'), md.join('\n') + '\n')
  console.log(md.slice(0, 6 + models.length).join('\n'))
  console.log(`\n→ runs/${label}/scores.md`)
}
