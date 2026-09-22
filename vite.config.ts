import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// base './' so a build runs from any folder; on Dandyhorse it becomes '/games/streetrunner/'.
export default defineConfig({
  base: './',
  // the avatar kit builds bodies in a module worker, which rules out the default iife workers
  worker: { format: 'es' },
  server: {
    port: 5200,
    strictPort: true,
    /*
     * `NO_HMR=1 npm run dev` leaves an open page alone while the source changes underneath it, so the city can
     * be explored while someone else is editing (user, 2026-09-22). Reload by hand to pick the changes up.
     */
    hmr: process.env.NO_HMR ? false : undefined,
    // @dandyhorse/avatarkit is a file: dependency outside this app's folder, and its worker is fetched by path
    fs: { allow: [resolve(import.meta.dirname, '..')] },
  },
  preview: { port: 5201, strictPort: true },
  /*
   * Pre-bundle everything up front. Left to discover dependencies as the browser asks for them, Vite
   * found some only mid-session — the avatar kit is a linked package outside this folder, so its imports
   * are invisible to the startup scan — re-bundled, and invalidated the chunks an open page was still
   * loading. Babylon imports its shaders lazily, so the page then fetched a stale `pbr.fragment` chunk,
   * got a 504 ("Outdated Optimize Dep"), and compiled an EMPTY shader: "VERTEX SHADER ERROR: 1:1: '' :
   * syntax error". Scanning every source file and naming the barrels means one bundle, made once.
   */
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.ts', '../dandyhorse/libs/avatarkit/src/**/*.ts'],
    include: ['@babylonjs/core', '@babylonjs/loaders', '@babylonjs/loaders/glTF', 'earcut'],
  },
  // Babylon arrives through the @babylonjs/core barrel, as in the platform's other games
  // public/mh and public/env are symlinks into the avatar kit's 300 MB of MakeHuman assets, which Vite would
  // dereference and copy on build; they are relinked into dist/ afterwards instead.
  build: { chunkSizeWarningLimit: 7500, copyPublicDir: false },
})
