/**
 * Put public/ into a build. `copyPublicDir` is off because public/ holds things a build must not copy: the
 * folders the shared asset bucket serves (src/assets.ts) are skipped, and so is anything that is not a plain
 * file or folder. Everything else (the baked cities, the textures restored by assetmgr, the manifests) is copied.
 */
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** served from the asset bucket in a build (src/assets.ts), so not copied */
const FROM_BUCKET = new Set(['mh', 'env', 'trees', 'plants', 'sftrees', 'models'])

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
  cpSync(from, to, { recursive: true })
  console.log(`  ${name} -> copied`)
}
