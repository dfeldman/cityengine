/**
 * The bar: the game's own model of each benchmark building, drawn in the benchmark's renderer from the judging views.
 *
 *   node --experimental-strip-types tools/benchmark/modeling/reference.ts [id…]
 *   node --experimental-strip-types tools/benchmark/modeling/sidebyside.ts reference:game 2026-11-02-v3 2026-11-02-v3:sonnet
 *
 * Each builder (buildings.json `reference`, most of them Opus-made) is built on its own footprint exactly as
 * tools/model-shots.ts builds it (`fitForEntry`), in reference.html through the dev server, then drawn in
 * viewer.html with flat vertex colours: the game's textures and lit windows are left out on purpose, so the bar and
 * the contestants are seen through the same renderer.
 *
 * The game's frame is not the benchmark's: both are x east, z north in the world (src/city/geo.ts), but each turns
 * the footprint by its own bearing. So the mesh is fitted onto the benchmark outline by turning it, never mirroring:
 * the turn that best covers the outline, by the same footprint IoU score.ts uses. Near-ties (a symmetric plan) go to
 * the turn that brings the game's street front, which its `front` camera looks at (alpha π/2 − spin in
 * tools/model-shots.ts), round to −z. Results:
 * runs/reference/game/<id>.json (with the fit) and runs/reference/renders/game/<id>-<view>.png.
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fitForEntry } from '../../model-shots.ts'
import { HERE, loadBuildings } from './buildings.ts'
import { planFor } from './plan.ts'
import { coverage } from './score.ts'

const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
interface RawMesh { positions: number[]; normals: number[]; colors: number[]; indices: number[]; error?: string }

/** the mesh turned by `deg` (counter-clockwise from above, dsl.ts's sense), mirrored in x first if asked, then centred on its plan */
function place(m: RawMesh, deg: number, mirror: boolean): RawMesh {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a)
  const pos = m.positions.slice(), nrm = m.normals.slice()
  for (let i = 0; i < pos.length; i += 3) {
    const x = mirror ? -pos[i] : pos[i], z = pos[i + 2]
    pos[i] = x * c - z * s; pos[i + 2] = x * s + z * c
    if (nrm.length) { const nx = mirror ? -nrm[i] : nrm[i], nz = nrm[i + 2]; nrm[i] = nx * c - nz * s; nrm[i + 2] = nx * s + nz * c }
  }
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (let i = 0; i < pos.length; i += 3) { x0 = Math.min(x0, pos[i]); x1 = Math.max(x1, pos[i]); z0 = Math.min(z0, pos[i + 2]); z1 = Math.max(z1, pos[i + 2]) }
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
  for (let i = 0; i < pos.length; i += 3) { pos[i] -= cx; pos[i + 2] -= cz }
  // a mirror reverses the winding: swap two corners of every triangle so the faces still face out
  const idx = mirror ? m.indices.map((_, k, arr) => (k % 3 === 1 ? arr[k + 1] : k % 3 === 2 ? arr[k - 1] : arr[k])) : m.indices
  return { positions: pos, normals: nrm, colors: m.colors, indices: idx }
}

const ids = process.argv.slice(2).filter((x) => !x.startsWith('--'))
const buildings = loadBuildings().filter((b) => ids.length === 0 || ids.includes(b.id))
const recDir = resolve(HERE, 'runs', 'reference', 'game'), renDir = resolve(HERE, 'runs', 'reference', 'renders', 'game')
mkdirSync(recDir, { recursive: true }); mkdirSync(renDir, { recursive: true })

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const builder = await browser.newPage()
builder.on('pageerror', (e) => console.log('  builder page error:', e.message.slice(0, 200)))
await builder.goto(`${BASE}/tools/benchmark/modeling/reference.html`)
await builder.waitForFunction('window.__ready === true', null, { timeout: 180_000 })
const viewer = await browser.newPage({ viewport: { width: 640, height: 480 } })
await viewer.goto(`${BASE}/tools/benchmark/modeling/viewer.html`)
await viewer.waitForFunction('window.__ready === true', null, { timeout: 120_000 })

for (const b of buildings) {
  const plan = await planFor(b)
  let got: Awaited<ReturnType<typeof fitForEntry>>
  try { got = await fitForEntry(b.referenceEntry.name, b.referenceEntry.city) } catch (e) { console.log(`  ${b.id}: ${(e as Error).message}`); continue }
  if (got.model !== b.reference) console.log(`  ${b.id}: the entry builds "${got.model}", buildings.json says "${b.reference}"`)
  const mesh = await builder.evaluate(([m, f]) => (window as unknown as { __build: (a: string, b: unknown) => unknown }).__build(m, f), [got.model, got.fit] as const) as RawMesh
  if (mesh.error || !mesh.indices.length) { console.log(`  ${b.id}: ${mesh.error ?? 'empty model'}`); continue }
  // coarse turn search on both handednesses, then a fine one round the best
  const score = (deg: number, mirror: boolean): number => { const p = place(mesh, deg, mirror); return coverage(p.positions, p.indices, plan.outline).iou }
  let best = { deg: 0, mirror: false, iou: -1 }
  const cands: { deg: number; mirror: boolean; iou: number }[] = []
  for (let deg = 0; deg < 360; deg += 5) { const iou = score(deg, false); cands.push({ deg, mirror: false, iou }); if (iou > best.iou) best = { deg, mirror: false, iou } }
  // a symmetric plan scores alike at several turns: of those within 0.02 of the best, take the one that turns the
  // game's street front (at angle 90° − spin in its own frame) round to −z (270°): a turn of 180° + spin
  const target = 180 + (got.spin * 180) / Math.PI
  const near = cands.filter((c) => c.iou >= best.iou - 0.02)
  const dist = (d: number): number => Math.abs((((d - target) % 360) + 540) % 360 - 180)
  best = near.sort((p, q) => dist(p.deg) - dist(q.deg) || q.iou - p.iou)[0]
  for (let d = best.deg - 4; d <= best.deg + 4; d++) { const iou = score(d, best.mirror); if (iou > best.iou) best = { deg: d, mirror: best.mirror, iou } }
  const placed = place(mesh, best.deg, best.mirror)
  await viewer.evaluate(([m, o, h]) => (window as unknown as { __showMesh: (a: unknown, b: unknown, c: unknown) => unknown }).__showMesh(m, o, h), [placed, plan.outline, b.height] as const)
  for (const v of ['front34', 'rear34', 'top']) {
    const url = await viewer.evaluate((view) => (window as unknown as { __shoot: (v: string) => Promise<string> }).__shoot(view), v) as string
    writeFileSync(resolve(renDir, `${b.id}-${v}.png`), Buffer.from(url.split(',')[1], 'base64'))
  }
  const triangles = mesh.indices.length / 3
  writeFileSync(resolve(recDir, `${b.id}.json`), JSON.stringify({ building: b.id, modelId: 'game', model: got.model, fit: { turn: best.deg, mirror: best.mirror, iou: Math.round(best.iou * 100) / 100 }, final: { status: 'ok', caption: `game: ${got.model}, ${triangles} tris, fit IoU ${best.iou.toFixed(2)}` } }, null, 1))
  console.log(`  ${b.id.padEnd(24)} ${got.model.padEnd(28)} ${String(triangles).padStart(6)} tris  turn ${best.deg}°${best.mirror ? ' mirrored' : ''}  IoU ${best.iou.toFixed(2)}`)
}
await browser.close()
