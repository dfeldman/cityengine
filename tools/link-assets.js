/**
 * Put public/ into a build. `copyPublicDir` is off because public/ holds things a build must not copy. What a build
 * holds is only what the game loads, and each of it is one of three things (owner, 2026-10-14): a file of this repo,
 * an assetmgr asset (restored into public/), or a file of a city's shipped bake. So:
 *   - the folders the shared asset bucket serves (src/assets.ts) are skipped;
 *   - of the cities, only those on src/cities.json, and of each only its shipped bake, `v3/` (tools/bake-files.ts);
 *   - files in public/ that nothing loads, or that only a fallback would (STRAY), are left out;
 *   - and anything that is not a plain file or folder.
 * Everything else (the textures restored by assetmgr, the manifests, the landmarks) is copied.
 */
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

/** served from the asset bucket in a build (src/assets.ts), so not copied */
const FROM_BUCKET = new Set(['mh', 'env', 'trees', 'plants', 'sftrees', 'models'])
/**
 * In public/ but not for a build: rocks/*.glb are the bucket's (assetkit-rocks; these local copies were made by hand
 * and are in no index), and roads/roads.json is read by nothing.
 */
const STRAY = (rel) => /^rocks\/[^/]+\.glb$/.test(rel) || rel === 'roads/roads.json'
const LIVE = JSON.parse(readFileSync(resolve('src', 'cities.json'), 'utf8')).map((c) => c.id)

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
      cpSync(v3, join(to, id, 'v3'), { recursive: true })
    }
    console.log(`  cities -> ${LIVE.join(', ')} (their v3/ only)`)
    continue
  }
  cpSync(from, to, { recursive: true, filter: (f) => !STRAY(relative(pub, f)) })
  console.log(`  ${name} -> copied`)
}
