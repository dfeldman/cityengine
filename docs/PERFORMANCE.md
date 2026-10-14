# Cycle Dash performance (2026-10-14)

Measured on the owner's M4 MacBook Air: Playwright Chromium (ANGLE/Metal, vsync off), and WebKit 26.6 in a headed
window. San Francisco, Union Square (`?at=37.788,-122.4075`), production build (`npm run build`, `vite preview`).
The tools are in `tools/perf/` (end of this page). Nothing here was measured on a real phone.

## Summary

1. **The phone tiers were burning ~250 ms per frame on a bug, now fixed (c288eb2).** The skin's subsurface-scattering
   pre-pass (avatarkit) set `imageProcessingConfiguration.applyByPostProcess` back on before every camera pass. The
   rider (render/rider.ts) set it off every frame. Each flip marks every submesh of all ~520 materials dirty. This
   happens wherever AO is off: on the `phone` and `ultra` tiers (all of iOS) and with `?without=ao`.

   | tier, M4 Chromium | before | after |
   |---|---|---|
   | ultra (iPhone/iPad) | 55 ms | **9.4 ms** |
   | phone (Android) | 255 ms | **19.6 ms** |
   | `?without=ao` | 393 ms | 28.5 ms |
   | desktop (default) | 30 ms | 30 ms (unaffected) |

   The iPhone 15's 15 fps "even with plants and NPCs off" is probably mostly this bug. It still needs checking on
   the phone itself. A side effect: the no-AO city is no longer washed out. That was the "third too bright" look
   rider.ts warns about, and it now matches the AO-on colours.

2. **Load time is latency-bound, not bandwidth-bound.** A repeat visit with everything cached (5 MB on the wire)
   still took 10.5 s, because the 106 landmark-manifest files were fetched one after another. They are now
   fetched in parallel (ee674e4):

   | to first frame | before | after |
   |---|---|---|
   | 25 Mbps, 80 ms RTT | 20.2 s | **12.6 s** |
   | 100 Mbps, 40 ms RTT | 11.5 s | **7.1 s** |
   | repeat visit, 100/40 | 10.5 s | **6.1 s** |
   | live site before today (unthrottled, Worker build) | 40.7 s | — |

3. **The desktop frame is CPU-bound, by mesh count.** It costs the same 21–26 ms at 720×450 as at 2880×1800.
   About 13–18 ms is Babylon walking ~1,360 active meshes and issuing ~1,370 draw calls, about 6.5 µs per mesh.
   The rest is game logic. Fewer meshes is the lever, both for weaker machines and for room to add NPCs and statues.

4. **The HTML HUD costs nothing measurable.** HUD hidden 29.7 ms, shown 30.5 ms, within run-to-run noise
   (defaults ranged 29.7–30.7 ms). It is not a reason to go native.

5. **Native would not fix the main costs.** WebKit's render CPU equals Chromium's; its game logic is ~20% slower
   (desktop tier: 37 ms vs 31 ms per frame; ultra: 13 ms vs 9 ms of loop CPU). The big wins are mesh count and
   load structure, which any engine would face.

## Load

### Where the time goes now (cold, 25 Mbps / 80 ms, after the manifest fix)

| s | what |
|---|---|
| 0.1–0.9 | JS: the Babylon bundle is 1.95 MB gzipped |
| 1.0–3.1 | **10 asset-bucket indexes, 6 MB.** `main.ts` awaits `initAssets()` before anything else starts |
| 3.7 | v3 index.json (1.1 MB, 0.24 MB compressed) |
| 3.9–5.9 | **terrain.bin, 6.2 MB uncompressed** (gzip 2.3 MB, zstd 1.9 MB; served without compression) |
| 6.1–7.7 | patches, then the landmark manifests (now in parallel) |
| 7.7–8.5 | ride-bike.json (7.4 MB, 2.3 MB compressed), fetched after the manifests instead of with them |
| 8.6–10.8 | **City construction: one 2.25 s main-thread task**, plus 0.7 s and 0.45 s ones |
| 11–12.6 | first tiles, minimap (0.45 s), landmarks (0.5 s), first frame |

After the first frame, streaming continues to ~30–50 s. It brings about 1,050 requests and 100 MB on the wire: 98
tree/plant GLBs (~30 MB), 157 unique bucket textures (~38 MB), the 4.1 MB facade atlas.png, and 225 tile files
averaging 17 KB. It adds 5–7 s of long tasks, which is the tile-load stutter.

Duplicates: 466 bucket-texture requests for 157 URLs (bark_brown ×27). With the HTTP cache on (a real visit), 375
of them are served from cache, and on the GPU Babylon shares them: 330 texture objects use 142 GPU textures. So
duplicates cost request overhead only, not bytes or video memory.

### Hosting

`dash.dfeldman.org` already works as the owner wants: `/` is a 301 to `index.html`, and every other path comes
straight from the bucket's custom domain. The problem is that **nothing is edge-cached**. Every response is
`cf-cache-status: DYNAMIC` with no `Cache-Control`, and the time to first byte is 0.4–0.55 s per request. Cloudflare
does not cache `.json`, `.bin` or `.glb` by default.

The owner's constraint: **builds and bakes still change often and in big ways**, so a stale file must never be
served. Caching is therefore safe only where the URL changes when the content does:

- **Cache hard only what is content-hashed**: Vite's `assets/*` bundles (already hashed) and the asset bucket's
  `asset-<hash>-*` files (already `immutable` on r2.dev). A Cache Rule on dash.dfeldman.org for `/assets/*`
  (edge and browser, a year) is risk-free.
- **Put a version in the path of everything else** before caching it. Examples:
  `cities/san-francisco/<bake number>/…`, a hash in the manifest-bundle and terrain names, `index.json` naming
  the current bake. Then a new bake is a new URL and nothing can be stale. Until then, leave city data, landmarks
  and `index.html` uncached (as now) or use `no-cache` with ETags. That still costs a round trip per file, which is
  why fewer, bigger files (bundled manifest, packed tiles) matter more than caching.
- **Don't** add a blanket "cache everything" rule or day-long TTLs on unversioned paths. A deploy would show a
  mix of old and new files until a purge, and a half-old city looks like a bake bug.
- Turn on compression for `application/octet-stream`, or store terrain.bin pre-compressed. Cloudflare already
  serves JSON with zstd.
- The `cycle-dash.*.workers.dev` Worker reads R2 on every request (median TTFB 553 ms in the live test). Retire it,
  or have it use `caches.default`.
- Workers Static Assets is not a good fit: the dist is 23,667 files (SF alone 18,418), over the free plan's 20,000.

### Next load fixes, in order

1. **Don't block on the asset indexes** (~2 s). Start the city fetches (index, terrain, patches, manifest,
   ride graph) at the top of `main.ts`, alongside `initAssets()`. Or slim the indexes to a runtime path→URL map at
   build time: they carry license and provenance metadata the game never reads.
2. **Fetch ride-bike.json and terrain.bin alongside the manifests**, not after them (~1 s).
3. **Compress terrain.bin** (−4 MB; 2 s at 25 Mbps). Row-delta encoding before gzip would shrink it further.
4. **Bundle the landmark manifest at build time** into one file: one request instead of 107. On HTTP/1.1 (local
   preview) the parallel fetch is still limited to 6 at a time.
5. **Move City construction (2.25 s) off the main thread**, into a worker or into the bake. Build the ground
   occluder and distant ground from the terrain grid once, at bake time.
6. **Pack tiles**: one file per 3×3 block instead of 9 requests averaging 17 KB.
7. **Defer the trees.** ~70 GLBs (~30 MB) load right after the first frame. Load the nearest species first, with
   impostors meanwhile. KTX2 for the 2 MB PNG leaf/needle atlases.
8. **A loading screen with real progress.** `window.__marks` already names each stage with a time. Most of the
   first 3 s is fetching indexes with nothing to show. A stage list or progress bar is cheap, and so is a map of SF
   with the start point.

## Frame rate

### Desktop tier, Chromium, M4 (ms per frame, median)

| | frame | loop CPU | scene.render CPU | draw calls |
|---|---|---|---|---|
| 2880×1800 | 26–31 | 24–30 | 13–19 | 1,370 |
| 1440×900 | 22–23 | 21–22 | 13 | 1,364 |
| 720×450 | 21 | 20 | 12 | 1,363 |

7,370 meshes, 524 materials, 990 textures, ~30 M active indices. Defaults varied 29.7–30.7 ms between runs, so read
per-subsystem deltas of 1–4 ms below as rough.

### What each subsystem costs (`?without=`, 2880×1800, default 29.7 ms)

| off | frame | Δ | draw calls |
|---|---|---|---|
| life (traffic and people sim) | 22.8 | **−7** | 1,251 |
| crowd | 26.3 | −3.4 | 1,302 |
| trees, plants | 27.0 | −2.7 | 1,210 |
| landmarks | 28.4 | −1.3 (render −2.4) | 1,153 |
| carkit / `cars=0` | 28.2 / 28.4 | −1.5 | 1,330 |
| HUD shown (vs hidden) | 30.5 | +0.8 (noise) | — |

### CPU profile (dev build, ~30 ms per frame)

- Babylon ~18 ms: `_renderForCamera` 5.2 self (per-draw overhead), `_evaluateActiveMeshes` 3.6 (culling 7,370
  meshes), `isReady`/`isReadyForSubMesh`, `thinInstanceRefreshBoundingInfo` 0.3.
- Game ~9 ms: render/life.ts `update` 3.3 inclusive; sim/traffic.ts 1.8; street-fleet/fleet `place` 2.2
  (`wheelDrops` → `terrain.heightAt` → **`grade.nearest` 1.5 self**); **ui/minimap.ts `draw` 1.9**, a full
  canvas-2D redraw every frame; crowd-baked 1.1.

### Fixes, in order of payoff

1. **Fewer meshes and materials.** At ~6.5 µs per mesh, 1,360 → 500 meshes saves ~6 ms on the M4 and more on a
   weak CPU. Ways to get there:
   - Merge harder per tile across materials, using texture arrays or atlases instead of separate materials; the
     524 materials stop meshes from merging.
   - Use thin instances for repeated props.
   - `scene.freezeActiveMeshes()` on the static city, unfrozen when a tile changes.
   - `blockMaterialDirtyMechanism` while building tiles.
   - Drop `alwaysSelectAsActiveMesh` where it isn't needed.
   - Rasterise the ground depth occluder once, not three times (groups 1–3).
2. **Minimap**: draw the street layer once into an offscreen canvas and redraw the markers at ~10 Hz (−1.5 ms).
3. **Traffic and people**: step the sim at 30 Hz with interpolation, or in a worker. Cache `grade.nearest` per
   vehicle (it barely moves between frames). Remove the per-walker allocations in BakedCrowd and life.ts.
4. **city.update**: stop sorting `[...tiles.keys()]` and splitting keys every frame.

### Headroom for more NPCs and statues

NPCs cost mainly through the sim (life −7 ms for everything) and their meshes. The cheap path is thin instances or
baked/vertex-animated crowds, plus the sim fixes above. A GLB statue is a mesh (or a few) and a material: cheap on
its own, but every one counts against the same ~6.5 µs per mesh. Merge statues per tile, or LOD them out early.
On the phone tiers, the budget is now about 9 ms of CPU on an M4, so the ultra tier has room for some of what it
currently leaves out.

## Not yet measured

- A real iPhone 15. The fix should be checked there first. A `?profile=1` overlay would make phone numbers easy
  to read off.
- WebKit with iPhone emulation (it never completed headless), and WebKit runs longer than ~40 frames: the headed
  window stops drawing once it is covered.
- A CPU-throttled run (`--cpu=4`) for the "older PC" case. The terms that scale are the ~10 s of long tasks during
  load and the ~30 ms frame.

## Tools

```bash
npm run build && npx vite preview --port 5201                    # what is measured
node tools/perf/profile-load.mjs --cache --net=25 --rtt=80        # cold load: requests, marks, long tasks
node tools/perf/profile-load.mjs --cache --warm --net=100 --rtt=40   # a repeat visit
node tools/perf/profile-frame.mjs --scales=0.5,1,2 [--q=without=life] [--hud] [--browser=webkit --headed]
node tools/perf/cpu-profile.mjs --url=http://localhost:5200       # dev server: top functions by self/inclusive time
```

Load numbers need `--cache`. Without it the HTTP cache is off, and every duplicate texture counts against the
wire (188 MB instead of 100 MB).
