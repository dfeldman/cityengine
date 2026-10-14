import { existsSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { configDefaults } from 'vitest/config'
import { defineConfig, type Plugin } from 'vite'

/*
 * The sibling repos this one uses, from environment variables, defaulting to checkouts beside this one (no
 * symlinks, no submodules): AVATARKIT_DIR (avatarkit) and ASSETKIT_DIR (assetkit). Only the dev server's
 * local-assets mode (?assets=local) reads files from them by path; normally everything comes from the bucket.
 */
const sibling = (name: string, env: string): string => resolve(process.env[env] || resolve(import.meta.dirname, '..', name))
const AVATARKIT_DIR = sibling('avatarkit', 'AVATARKIT_DIR')
const ASSETKIT_DIR = sibling('assetkit', 'ASSETKIT_DIR')

/*
 * Dandyhorse's game client library (@dandyhorse/gamekit), for running as a game on the platform (?session=, see
 * src/platform.ts). It is NOT a dependency: the engine and the standalone game work without Dandyhorse. When a
 * dandyhorse checkout is found (DANDYHORSE_DIR, default the one beside this repo) its gamekit source is used;
 * otherwise the import resolves to a module that explains, so the standalone build still succeeds.
 */
const DANDYHORSE_DIR = sibling('dandyhorse', 'DANDYHORSE_DIR')
const GAMEKIT = resolve(DANDYHORSE_DIR, 'libs', 'gamekit', 'src', 'index.ts')
const HAS_GAMEKIT = existsSync(GAMEKIT)
const gamekit: Plugin = {
  name: 'dandyhorse-gamekit',
  enforce: 'pre',
  resolveId: (id) => (id === '@dandyhorse/gamekit' ? (HAS_GAMEKIT ? GAMEKIT : '\0gamekit-absent') : null),
  load: (id) => id === '\0gamekit-absent'
    ? { code: "throw new Error('This build has no Dandyhorse platform library: set DANDYHORSE_DIR to a dandyhorse checkout and rebuild')\nexport default {}", syntheticNamedExports: true }
    : null,
}

// base './' so a build runs from any folder; on Dandyhorse it becomes '/games/streetrunner/'.
export default defineConfig({
  base: './',
  plugins: [gamekit],
  define: { __AVATARKIT_DIR__: JSON.stringify(AVATARKIT_DIR), __ASSETKIT_DIR__: JSON.stringify(ASSETKIT_DIR) },
  /*
   * ONE BABYLON for the app and every linked kit (carkit, avatarkit). In a production build a `file:` kit's
   * `@babylonjs/core` import resolves to the kit's OWN copy, so carkit registered its shaders with a Babylon the
   * engine never asks, and the engine fetched them by URL — and got index.html (BUGS.md #243). The dev server's
   * pre-bundling happened to hide it.
   */
  resolve: { dedupe: ['@babylonjs/core', '@babylonjs/loaders'] },
  /*
   * A DEV SERVER STARTED FOR TESTING MUST NOT SHARE THE LIVE SERVER'S DEP CACHE.
   *
   * `node_modules/.vite` is shared by every Vite in this folder. A second server — an agent's test run, a
   * `--force` — rewrites the pre-bundled deps underneath the server the owner has open, and the live page
   * then fetches chunk URLs that no longer exist: `504 (Outdated Optimize Dep)`, or an uncaught "Failed to
   * fetch dynamically imported module". Babylon imports its shaders lazily, so what breaks is whatever
   * happened to be loading — a missing avatar, missing trees — and never the code being blamed for it.
   * This has now cost two separate days (BUGS.md #184, and 2026-09-21's phantom shader error).
   *
   * So: `VITE_CACHE=<name> npm run dev` gives that server its own cache and leaves the owner's alone.
   * The CLI has no --cacheDir flag; it has to come from here.
   */
  cacheDir: process.env.VITE_CACHE ? `node_modules/.vite-${process.env.VITE_CACHE}` : 'node_modules/.vite',
  // the avatar kit builds bodies in a module worker, which rules out the default iife workers
  worker: { format: 'es' },
  server: {
    port: 5200,
    strictPort: false,
    /*
     * HMR IS OFF, ALWAYS (user, 2026-09-23: "we just never want hot reloading in this entire streetrunner
     * app, it takes way too long to reload and we make tons of tiny changes"). Reload by hand to pick changes
     * up. `HMR=1 npm run dev` restores it if it is ever wanted.
     *
     * Two reasons, and the second is the expensive one:
     *
     *  - A city takes seconds to load and stream its tiles, so an automatic reload on every keystroke-sized
     *    edit costs far more than it saves.
     *  - **It silently destroys offline render batches.** `tools/review-page.ts`, `tools/views.ts` and the
     *    shot tools hold one page open and jump the camera across hundreds of buildings. Any edit under
     *    `src/` by anyone — and several agents edit this repo at once — reloads that page mid-batch and every
     *    subsequent shot fails with `window.__view is not a function`. That cost 178 renders on 2026-09-23
     *    before it was diagnosed, and the render loops now carry a re-wait guard because of it.
     */
    hmr: process.env.HMR ? undefined : false,
    // avatarkit is a file: dependency outside this app's folder, and its worker is fetched by path; local-assets
    // mode reads avatarkit's and assetkit's public/ through /@fs/
    fs: { allow: [resolve(import.meta.dirname, '..'), AVATARKIT_DIR, ASSETKIT_DIR, resolve(DANDYHORSE_DIR, 'libs', 'gamekit')] },
  },
  preview: { port: 5201, strictPort: false },
  /*
   * Pre-bundle everything up front. Left to discover dependencies as the browser asks for them, Vite
   * found some only mid-session — the avatar kit is a linked package outside this folder, so its imports
   * are invisible to the startup scan — re-bundled, and invalidated the chunks an open page was still
   * loading. Babylon imports its shaders lazily, so the page then fetched a stale `pbr.fragment` chunk,
   * got a 504 ("Outdated Optimize Dep"), and compiled an EMPTY shader: "VERTEX SHADER ERROR: 1:1: '' :
   * syntax error". Scanning every source file and naming the barrels means one bundle, made once.
   */
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.ts', `${relative(import.meta.dirname, AVATARKIT_DIR)}/src/**/*.ts`],
    include: ['@babylonjs/core', '@babylonjs/loaders', '@babylonjs/loaders/glTF', 'earcut'],
  },
  // Babylon arrives through the @babylonjs/core barrel, as in the platform's other games
  // public/ is copied into dist/ by tools/link-assets.js, which skips what the asset bucket serves
  build: { chunkSizeWarningLimit: 7500, copyPublicDir: false },
  // the platform glue's tests need gamekit; without a dandyhorse checkout they are left out
  test: { exclude: [...configDefaults.exclude, ...(HAS_GAMEKIT ? [] : ['tests/platform.test.ts'])] },
})
