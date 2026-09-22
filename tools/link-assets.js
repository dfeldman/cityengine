/**
 * Re-link the symlinked asset folders into a build.
 *
 * `public/mh` and `public/env` are symlinks into the avatar kit's 300 MB of MakeHuman assets, and
 * `public/trees` into Trail Trainer's tree library. Vite would dereference and copy all of it, so
 * `copyPublicDir` is off and everything in public/ is placed here instead: symlinks stay symlinks, real
 * folders are copied.
 */
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, rmSync, symlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'

const out = resolve(process.argv[2] ?? 'dist')
const pub = resolve('public')
mkdirSync(out, { recursive: true })

for (const name of readdirSync(pub)) {
  const from = join(pub, name)
  const to = join(out, name)
  if (existsSync(to)) rmSync(to, { recursive: true, force: true })
  if (lstatSync(from).isSymbolicLink()) {
    symlinkSync(resolve(pub, readlinkSync(from)), to)
    console.log(`  ${name} -> symlink`)
  } else {
    cpSync(from, to, { recursive: true })
    console.log(`  ${name} -> copied`)
  }
}
