/**
 * Is a city baked in this checkout? Baked cities (public/cities/) are derived data, not in git: a fresh clone has
 * none until `npm run bake <city>` (docs/ASSETS.md). Tests that read a bake skip without one, saying so.
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function baked(id: string): boolean {
  const ok = existsSync(resolve(import.meta.dirname, '..', 'public', 'cities', `${id}.json`))
  if (!ok && !warned.has(id)) {
    warned.add(id)
    console.warn(`(skipping tests that need the ${id} bake: run \`npm run bake ${id}\`)`)
  }
  return ok
}
const warned = new Set<string>()
