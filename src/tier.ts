/**
 * How much the device can hold (BUGS.md #242).
 *
 * The owner, 2026-10-01: the game runs in Xcode's iOS simulator, which enforces no memory limit, and crashes while
 * loading on a real iPhone — a Safari tab is killed at about a gigabyte, all of it counted: the JS heap, every
 * vertex buffer and texture, the canvases behind the sign pages, the framebuffer. The desktop's budget (a 3 GB heap,
 * #177) is not a phone's. `phone` holds less city round the rider and draws it at a lower resolution.
 *
 * `?tier=phone` / `?tier=desktop` override the guess.
 */
export type Tier = 'desktop' | 'phone' | 'ultra'

export interface TierSettings {
  /** render/city.ts VIEW and MID: the built ring (full tiles out to VIEW + 2) and the massing ring, in tiles */
  view: number
  mid: number
  /** the device pixel ratio the canvas is drawn at, at most (an iPhone's is 3: nine times the pixels of 1) */
  maxDpr: number
  /** screen-space ambient occlusion: two full-resolution render targets */
  ao: boolean
  /** the sign pages' resolution (render/signs.ts TextAtlas): 0.5 is a quarter of the memory */
  textScale: number
  /** the largest a texture from these places is uploaded at (render/texture-cap.ts) */
  textureCaps: { match: RegExp; max: number }[]
  /** how many walkers near the rider get a real avatar body (each its skin, clothes and morph targets) */
  bodies: number
  /** placed models keep a CPU copy of their vertices (only picking reads it: the debug probes) */
  keepGeometry: boolean
  /**
   * Babylon keeps every texture's source bytes (each glTF tree's PNGs, the avatars' morph data) to rebuild the
   * GPU state if the WebGL context is lost. Without it, a lost context reloads the page instead.
   */
  recoverContext: boolean
  /**
   * The memory GOVERNOR (game.ts): every few seconds the page's footprint is ESTIMATED — Safari tells a page
   * nothing about its memory — and the massing ring pulled in when it is over this many MB, grown back when
   * there is room. This one is the WHOLE footprint: the JS heap, every vertex buffer and texture, the
   * canvases, the framebuffer. Null: no governor (the desktop has 3 GB and Chrome's own numbers).
   */
  memoryBudget: number | null
  /**
   * And the JS heap on its own, which on iOS is a separate and much lower ceiling.
   *
   * Owner, 2026-10-20: *"it is very close to the edge already. Result is an instant crash when heap
   * exceeds 384mb."* That is the heap, not the footprint — the ~1 GB figure from 2026-10-01 is the other
   * limit, and both are real. They were being checked as one number, with the heap's 384 applied to an
   * estimate that included every GPU buffer, which is why the rings slammed shut the moment anything
   * loaded. Two limits, two comparisons, and whichever bites first wins.
   */
  heapBudget: number | null
  /** the smallest massing ring the governor may pull in to */
  minMid: number
  /** whole subsystems left out (game.ts `off`: the same names as `?without=`) */
  without: string[]
  /** the distant ground's and coarse occluder's grid, in terrain steps (render/city.ts `setGroundStride`) */
  groundStride: number
  /** the governor's model of the JS heap that does not shrink with the rings, MB (measured per tier, see below) */
  heapBase: number
  /**
   * Build the avatars' facial expression morph targets (avatarkit `AvatarOptions.expressions`).
   *
   * Babylon wants each expression as a whole set of vertex positions rather than the deltas the kit holds,
   * so every unit is another copy of the entire body — about forty of them, 20 MB measured on this tier,
   * for faces nobody sees from behind a rider on a phone.
   */
  expressions: boolean
}

/**
 * The estimate's model, measured in Chromium at an iPhone viewport on the phone tier (BUGS.md #242): the JS heap is
 * a base that does not shrink with the rings (the index, the ride graphs, the code — 46 MB of it the dev server's
 * module source) plus a cost per tile held; the GPU side is Babylon's own record of every buffer and texture
 * (render/heap.ts `gpuMB`). Rings 1,3 held 99 tiles at 450 MB of heap, rings 1,6 255 tiles at 551 MB.
 *
 * `HEAP_PER_TILE_MB` was re-checked on the ultra tier on 2026-10-20 and still fits the near rings (0.69 MB a
 * tile measured, against 0.65 here); the far massing tiles are cheaper than that, so the model is
 * conservative out there, which is the right direction for something deciding what to drop.
 *
 * The per-tier `heapBase` figures for `desktop` and `phone` have NOT been re-measured since the morph
 * targets and Babylon's CPU vertex copies were dropped, so both are now overestimates — safe, but worth
 * re-fitting the same way `ultra` was if either tier ever needs the governor.
 */
export const HEAP_BASE_MB = 386
export const HEAP_PER_TILE_MB = 0.65
export const GPU_PER_TILE_MB = 0.47

export const TIERS: Record<Tier, TierSettings> = {
  desktop: { view: 3, mid: 6, maxDpr: Infinity, ao: true, textScale: 1, textureCaps: [], bodies: 10, keepGeometry: true, recoverContext: true, memoryBudget: null, heapBudget: null, minMid: 6, without: [], groundStride: 1, heapBase: 386, expressions: true },
  /*
   * ULTRA (owner, 2026-10-01: "iOS Safari only supports up to 384 MB"): every iPhone and iPad. The city is the
   * streets, the buildings of the rider's own tile in full, simple massing two tiles out, the landmarks' skyline,
   * the cars — no plants, no street trees, no crowd, no furniture, no signs; the canvas at 1x, the textures small,
   * the ground meshes on a 40 m grid. Substantial sacrifices, by design: a game that runs (BUGS.md #243).
   * The grade pass came back 2026-10-14 (owner: "aliasing on mobile is really bad"): it carries the FXAA, the only
   * antialiasing there is once anything draws off-screen, for ~10 MB and ~0.7 ms (docs/PERFORMANCE.md).
   */
  ultra: { view: 0, mid: 2, maxDpr: 1, ao: false, textScale: 0.35,
    textureCaps: [{ match: /\/(sftrees|trees|plants|palms|mh)\//, max: 256 }, { match: /\/facades\//, max: 1024 }], bodies: 0,
    keepGeometry: false, recoverContext: false, memoryBudget: 900, heapBudget: 300, minMid: 1,
    expressions: false,
    without: ['plants', 'trees', 'crowd', 'furniture', 'signs', 'fountains', 'courts', 'rain'], groundStride: 2,
    /*
     * Re-measured 2026-10-20, production build, Chromium at an iPhone viewport, retained after a forced
     * collection — which is the only number worth fitting to, since live heap wanders by a hundred
     * megabytes depending on when V8 last felt like collecting:
     *
     *     rings 0,1   217 MB        rings 0,2   228 MB        rings 0,4   242 MB
     *
     * So the part that does NOT shrink with the rings is about 210 MB, and the ring term sits on top.
     * The old figure here was 150, from before the morph targets and Babylon's CPU vertex copies were
     * dropped — stale in the dangerous direction: it had the governor believing there was 60 MB of room
     * that did not exist, on a device that is killed at 384.
     */
    heapBase: 210 },
  phone: { view: 1, mid: 5, maxDpr: 1.5, ao: false, textScale: 0.5,
    // the vegetation libraries' and the avatar kit's images: leaf atlases, barks, skins, clothes
    textureCaps: [{ match: /\/(sftrees|trees|plants|palms|mh)\//, max: 512 }, { match: /\/facades\//, max: 2048 }], bodies: 4, keepGeometry: false, recoverContext: false, memoryBudget: 1000, heapBudget: 600, minMid: 3, without: [], groundStride: 1, heapBase: 386, expressions: false },
}

/** The tier asked for, or the one this device looks like: phones and tablets are `phone`. */
export function detectTier(asked: string | null): Tier {
  if (asked === 'phone' || asked === 'desktop' || asked === 'ultra') return asked
  const ua = navigator.userAgent
  // an iPad asks for the desktop site and calls itself a Mac — but a Mac has no touch screen
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  // iOS Safari: 384 MB a tab (owner, 2026-10-01) — the ultra tier; Android's Chrome allows more
  return ios ? 'ultra' : /Android/.test(ua) ? 'phone' : 'desktop'
}
