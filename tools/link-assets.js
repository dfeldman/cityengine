/**
 * Put public/ into a build. `copyPublicDir` is off because public/ holds things a build must not copy. What a build
 * holds is only what the game loads, and each of it is one of three things (owner, 2026-10-14): a file of this repo,
 * an assetmgr asset (restored into public/), or a file of a city's shipped bake. So:
 *   - the folders the shared asset bucket serves (src/assets.ts) are skipped;
 *   - of the cities, only those on src/cities.json, and of each only its shipped bake, `v3/` (tools/bake-files.ts);
 *   - files in public/ that are managed but not for the game (NOT_SHIPPED: the generators' contact sheets) are left out;
 *   - and anything that is not a plain file or folder.
 * Everything else (the textures restored by assetmgr, the manifests, the landmarks) is copied.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

/**
 * Managed but not for the game: the generators' contact sheets (tools/facadegen, palmgen, roadgen write a sheet.png
 * beside their pages, "not shipped, just for looking at"). Kept in the asset index so a checkout has them to look at;
 * left out of a build.
 */
const NOT_SHIPPED = /^(facades|palms|roads)\/sheet\.png$/
/** served from the asset bucket in a build (src/assets.ts), so not copied */
const FROM_BUCKET = new Set(['mh', 'env', 'trees', 'plants', 'sftrees', 'models'])
const LIVE = JSON.parse(readFileSync(resolve('src', 'cities.json'), 'utf8')).map((c) => c.id)
/**
 * WHAT MAY SHIP: a file of this repo (tracked by git) or an asset of this repo's assetmgr index (restored by
 * `npm run assets`). Anything else under public/ is unmanaged — a fresh checkout would not have it, and nothing keeps
 * it current — and the build stops on it rather than publish it (owner, 2026-10-14). The cities are the bake's,
 * checked separately: each live city's shipped bake, with its bake number.
 */
const tracked = new Set(execFileSync('git', ['ls-files', 'public'], { encoding: 'utf8' }).split('\n').filter(Boolean).map((f) => f.slice('public/'.length)))
const indexed = new Set()
for (const f of readdirSync('indexes').filter((n) => n.endsWith('.json'))) {
  const j = JSON.parse(readFileSync(join('indexes', f), 'utf8'))
  for (const a of Array.isArray(j.assets) ? j.assets : Object.values(j.assets ?? {})) {
    const p = a?.extra?.streetrunner?.path
    // (an asset marked deleted is on its way out of the bucket: a copy of it in public/ is no longer managed)
    if (p && !a.isDeleted && !(a.assetFiles ?? []).every((f) => f.isDeleted)) indexed.add(p)
  }
}
const unmanaged = []
const managed = (abs) => {
  const rel = relative(pub, abs).split(sep).join('/')
  if (lstatSync(abs).isDirectory() || tracked.has(rel) || indexed.has(rel) || rel.endsWith('.DS_Store')) return true
  unmanaged.push(rel)
  return false
}

const out = resolve(process.argv[2] ?? 'dist')
const pub = resolve('public')
mkdirSync(out, { recursive: true })

for (const name of readdirSync(pub)) {
  const from = join(pub, name)
  const to = join(out, name)
  if (FROM_BUCKET.has(name) || lstatSync(from).isSymbolicLink()) {
    console.log(`  ${name} -> skipped (from the asset bucket)`)
    continue
  }
  if (existsSync(to)) rmSync(to, { recursive: true, force: true })
  if (name === 'cities') {
    for (const id of LIVE) {
      const v3 = join(from, id, 'v3')
      if (!existsSync(v3)) throw new Error(`${id} is on src/cities.json but has no shipped bake (${v3}): npm run bake -- ${id}`)
      if (!JSON.parse(readFileSync(join(v3, 'index.json'), 'utf8')).bake) throw new Error(`${id}'s shipped bake has no bake number: re-bake it (npm run bake -- ${id})`)
      cpSync(v3, join(to, id, 'v3'), { recursive: true })
    }
    console.log(`  cities -> ${LIVE.join(', ')} (their v3/ only)`)
    continue
  }
  cpSync(from, to, { recursive: true, filter: (f) => !f.endsWith('.DS_Store') && !NOT_SHIPPED.test(relative(pub, f).split(sep).join('/')) && managed(f) })
  console.log(`  ${name} -> copied`)
}
if (unmanaged.length) {
  console.error(`\npublic/ has ${unmanaged.length} file(s) neither tracked by git nor in an asset index — commit them, record them `
    + `(npm run assets:upload), or remove them:\n  ${unmanaged.slice(0, 20).join('\n  ')}${unmanaged.length > 20 ? '\n  …' : ''}`)
  process.exit(1)
}
