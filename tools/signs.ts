/**
 * Generate a city's EXTRUDED sign lettering (tools/signgen) for every sign that needs it.
 *
 * Nearly every sign in the city is FLAT — one quad, a texture with an alpha channel, made in the browser with
 * no Blender and no asset (src/render/sign-plates.ts). Nothing here is needed for those. This builds the few
 * whose letters genuinely stand off the wall and catch the light.
 *
 * Signs whose LETTERING is the landmark get real letterforms from a real typeface rather than the 3x5 block
 * font — see tools/signgen/README.md for why, and for how to change the look. The recipes live in
 * tools/signgen/signs.json; the GLBs land under public/models/signs, which is gitignored, because the assets
 * are generated and the recipe is what is kept.
 *
 * The bake calls this, so a city build produces its own signs:
 *
 *   node --experimental-strip-types tools/signs.ts san-francisco
 *   node --experimental-strip-types tools/signs.ts san-francisco --force   (rebuild even if present)
 *
 * Needs Blender on the PATH. Without it the existing GLBs are left alone and a line is printed — a missing
 * sign costs one landmark, and is not worth failing a two-hour bake over.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import SIGNS from './signgen/signs.json' with { type: 'json' }

const ROOT = resolve(import.meta.dirname, '..')

interface Sign {
  out: string; text: string; font?: string; height?: number; depth?: number; bulbs?: number; bevel?: number
  /** the letters' own colour, #rrggbb, and what they are made of */
  colour?: string; metallic?: number; roughness?: number
  /** the `lit` of render/landmarks/signage.ts: only `self` changes the GLB (the letter faces emit) */
  lit?: 'none' | 'front' | 'back' | 'self'
}

export function buildSigns(city: string, force = false): void {
  const spec = SIGNS as { fonts: Record<string, string>; cities: Record<string, Sign[]> }
  const want = spec.cities[city] ?? []
  if (want.length === 0) return
  const missing = want.filter((s) => force || !existsSync(resolve(ROOT, 'public', 'models', s.out)))
  if (missing.length === 0) {
    console.log(`  signs: ${want.length} already built`)
    return
  }
  const blender = spawnSync('which', ['blender']).status === 0
  if (!blender) {
    console.log(`  signs: ${missing.length} to build but Blender is not on the PATH — skipping (npm run signs later)`)
    return
  }
  for (const s of missing) {
    const out = resolve(ROOT, 'public', 'models', s.out)
    mkdirSync(resolve(out, '..'), { recursive: true })
    const font = spec.fonts[s.font ?? 'serif'] ?? s.font ?? ''
    const args = ['-b', '-P', resolve(ROOT, 'tools', 'signgen', 'gen.py'), '--',
      `--text=${s.text}`, `--out=${out}`, `--height=${s.height ?? 5}`, `--depth=${s.depth ?? 0.35}`,
      ...(s.bulbs ? [`--bulbs=${s.bulbs}`] : []), ...(s.bevel ? [`--bevel=${s.bevel}`] : []),
      ...(s.colour ? [`--colour=${s.colour}`] : []), ...(s.metallic !== undefined ? [`--metallic=${s.metallic}`] : []),
      ...(s.roughness !== undefined ? [`--roughness=${s.roughness}`] : []), ...(s.lit ? [`--lit=${s.lit}`] : []),
      ...(font ? [`--font=${font}`] : [])]
    const r = spawnSync('blender', args, { encoding: 'utf8' })
    const line = (r.stdout ?? '').split('\n').find((l) => l.startsWith('signgen: "'))
    console.log(`  ${line ?? `signs: ${s.text} failed`}`)
  }
}

if (process.argv[1]?.endsWith('signs.ts')) {
  const city = process.argv[2] ?? 'san-francisco'
  buildSigns(city, process.argv.includes('--force'))
}
