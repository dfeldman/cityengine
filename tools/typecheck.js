/**
 * `tsc --noEmit`, reporting only this project's own errors.
 *
 * `@dandyhorse/avatarkit` is a `file:` dependency, so TypeScript follows imports straight into its source
 * and reports its lint there as if it were ours. It is not ours to fix from here and it must not fail this
 * build; anything under our own `src/`, `tools/` or `tests/` still does.
 */
import { spawnSync } from 'node:child_process'

const run = spawnSync('npx', ['tsc', '--noEmit'], { encoding: 'utf8' })
const lines = (run.stdout + run.stderr).split('\n').filter(Boolean)
const ours = lines.filter((l) => !l.includes('avatarkit/src') && !l.startsWith('  '))

if (ours.length > 0) {
  console.error(ours.join('\n'))
  process.exit(1)
}
const theirs = lines.filter((l) => l.includes('avatarkit/src')).length
if (theirs > 0) console.log(`  typecheck clean (${theirs} pre-existing issue(s) inside avatarkit, ignored)`)
else console.log('  typecheck clean')
