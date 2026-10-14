/**
 * Is a city baked in this checkout — its shipped bake and its bake-private files, of the same bake number
 * (tools/bake-files.ts)? Bakes are derived data, not in git: a fresh clone has none until `npm run bake <city>`
 * (docs/ASSETS.md). Tests that read a bake skip without one, saying so.
 */
import { isBaked } from '../tools/bake-files.ts'

export function baked(id: string): boolean {
  const ok = isBaked(id)
  if (!ok && !warned.has(id)) {
    warned.add(id)
    console.warn(`(skipping tests that need the ${id} bake: run \`npm run bake ${id}\`)`)
  }
  return ok
}
const warned = new Set<string>()
