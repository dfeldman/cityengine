/**
 * `tsc --noEmit`, reporting only this project's own errors.
 *
 * `avatarkit` is a `file:` dependency, so TypeScript follows imports straight into its source and reports its lint
 * there as if it were ours. It is not ours to fix from here and it must not fail this build; anything under our own
 * `src/`, `tools/` or `tests/` still does.
 *
 * Dandyhorse's gamekit is not a dependency (see vite.config.ts): its location comes from DANDYHORSE_DIR (default
 * the dandyhorse checkout beside this repo). This writes a small tsconfig (gitignored) mapping
 * `@dandyhorse/gamekit` there, or, without a dandyhorse checkout, declaring the names the platform glue uses
 * loosely so the rest of the engine is still checked as usual.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const dandyhorse = resolve(process.env.DANDYHORSE_DIR || resolve(root, '..', 'dandyhorse'))
const gamekit = resolve(dandyhorse, 'libs', 'gamekit', 'src', 'index.ts')
const has = existsSync(gamekit)
const config = { extends: './tsconfig.json', include: ['src', 'tools', 'tests'], compilerOptions: {} }
if (has) config.compilerOptions.paths = { '@dandyhorse/gamekit': [gamekit] }
else {
  // the names src/platform.ts and main.ts take from gamekit, loosely typed: the platform glue is not really
  // checked without gamekit, but the rest of the engine is, exactly as usual
  writeFileSync(resolve(root, '.gamekit-absent.d.ts'), `declare module '@dandyhorse/gamekit' {
  interface SessionOptions {
    sessionId: any; buildTick?: () => any; sessionImage?: () => any
    onState?: (s: any) => void; onInput?: (a: any) => void; onPause?: (p: any) => void; onResume?: (secs: any) => void
    onEnded?: (e: any) => void; onError?: (ctx: any, err: any) => void; onTick?: (ok: any) => void
  }
  export class SessionClient { constructor(opts: SessionOptions); [key: string]: any }
  export function putSave(...args: any[]): any
  export function menuPrompt(...args: any[]): any
  export function readMenuAnswer(...args: any[]): any
  export function startSession(...args: any[]): Promise<any>
  export type EndInfo = any
  export type GameState = any
  export type InputAnswer = any
  export type Json = any
  export type StartPayload = any
  export type TickBody = any
}
`)
  config.include.push('.gamekit-absent.d.ts')
  console.log('  (no dandyhorse checkout at DANDYHORSE_DIR: the platform glue is only loosely checked)')
}
writeFileSync(resolve(root, '.tsconfig.typecheck.json'), JSON.stringify(config, null, 2))

const run = spawnSync('npx', ['tsc', '--noEmit', '-p', '.tsconfig.typecheck.json'], { encoding: 'utf8', cwd: root })
const lines = (run.stdout + run.stderr).split('\n').filter(Boolean)
const ours = lines.filter((l) => !l.includes('avatarkit/src') && !l.startsWith('  '))

if (ours.length > 0) {
  console.error(ours.join('\n'))
  process.exit(1)
}
const theirs = lines.filter((l) => l.includes('avatarkit/src')).length
if (theirs > 0) console.log(`  typecheck clean (${theirs} pre-existing issue(s) inside avatarkit, ignored)`)
else console.log('  typecheck clean')
