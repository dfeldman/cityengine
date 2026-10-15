/**
 * WHICH SHIPPED FILES ARE USED (owner, 2026-10-14: files only from the repo, assetmgr or the versioned bake; 2026-10-15:
 * "finish cleaning up the asset paths that are uploaded and used"). tools/link-assets.js refuses a build any file under
 * public/ that is neither tracked nor indexed; this is the other direction — a file tracked or indexed that the game
 * never asks for. A static search cannot answer it (tree models are chosen from the index by species, facade walls
 * by style id, rock pages by name), so this RUNS the game: it loads it at each of SPOTS, rides a little, and records
 * every request, then lists the inventory nobody asked for. That list is a lead, not a verdict: a file used only far
 * from the spots (a landmark's model, a style no spot shows) appears in it — check each by its loader before removing.
 * 2026-10-15 it found: nine rock pages duplicated from the shared rock library (removed), the old Dandyhorse card
 * (removed), the generators' contact sheets (kept, not shipped: link-assets NOT_SHIPPED).
 *   node tools/asset-audit.ts            (the dev server on 5200)
 */
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const pw = require('playwright')
const BASE = process.env.BASE ?? 'http://localhost:5200'
const SPOTS = ['37.7880,-122.4075', '37.7694,-122.4862', '37.8030,-122.4370', '37.7599,-122.4148', '37.7955,-122.3937',
  '37.7955,-122.4130', '37.8080,-122.4180', '37.7340,-122.4500', '37.7875,-122.5050']
const seen = new Set<string>()
const b = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal'] })
for (const at of SPOTS) {
  const p = await (await b.newContext({ viewport: { width: 1100, height: 700 } })).newPage()
  p.on('request', (r: { url(): string }) => seen.add(r.url()))
  await p.goto(`${BASE}/?city=san-francisco&at=${at}`)
  await p.waitForFunction('window.gameReady === true', null, { timeout: 240000 }).catch(() => {})
  await p.keyboard.press('Space').catch(() => {})
  await p.evaluate(() => window.dispatchEvent(new CustomEvent('sr-watts', { detail: 250 })))
  await p.waitForTimeout(25000)
  await p.close()
}
await b.close()
const paths = new Set<string>(), names = new Set<string>()
for (const u of seen) { const p = decodeURIComponent(new URL(u).pathname).replace(/^\//, ''); paths.add(p); names.add(p.split('/').pop()!) }
const tracked = execFileSync('git', ['ls-files', 'public'], { encoding: 'utf8' }).split('\n').filter(Boolean).map((f) => f.slice(7))
const index = JSON.parse(readFileSync('indexes/asset-index-streetrunner.json', 'utf8'))
const unused: string[] = []
for (const f of tracked) if (!f.startsWith('cities/') && !paths.has(f) && !names.has(f.split('/').pop()!)) unused.push(`tracked  ${f}`)
for (const a of Array.isArray(index) ? index : index.assets) {
  const file = a.assetFiles[0]
  if (a.isDeleted || file.isDeleted) continue
  const p: string = a.extra.streetrunner.path
  if (!paths.has(p) && !names.has(file.filename) && !names.has(p.split('/').pop()!)) unused.push(`indexed  ${p}`)
}
console.log(`${seen.size} requests at ${SPOTS.length} spots; ${unused.length} files of the inventory not asked for:`)
for (const u of unused) console.log('  ' + u)
