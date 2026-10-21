/**
 * A smaller ceiling on some textures' size, by where they come from (BUGS.md #242, src/tier.ts).
 *
 * On a phone the trees', plants', palms' and walkers' images — dozens of 1024² leaf atlases, barks and skins, ~400 MB
 * of GPU memory in San Francisco — are drawn a few hundred pixels across at most. Babylon already shrinks any image
 * larger than `caps.maxTextureSize` as it uploads it, reading the cap synchronously inside `_prepareWebGLTexture`; so
 * the cap is lowered for exactly that call, for the textures whose URL matches, and put back. Nothing else — the
 * facade atlas, the sign pages, the render targets — sees a different cap.
 *
 * AND A CEILING ON EVERYTHING ELSE (2026-10-20). Matching on the URL only caps what we thought to name,
 * and a texture that arrives inside a model file has no URL to match, so nothing was holding it to
 * anything. `fallbackMax` is that general ceiling; the rules stay for the places that need holding
 * tighter still.
 *
 * Worth knowing what this did NOT fix, so nobody re-measures it hoping: the 110 MB of oversized textures
 * found on the iOS tier that sent me looking here were the buildings' name plates, and a plate is a
 * DynamicTexture drawn from a canvas, which never passes through `_prepareWebGLTexture` at all. Those
 * were fixed by not making them (render/sign-plates.ts, and 'signplates' in the ultra tier's `without`).
 * With them gone, one texture on the whole phone tier is over 1024, worth 5.5 MB — so this ceiling is
 * insurance against the next uncapped asset, not a measured saving today.
 *
 * `_prepareWebGLTexture` is Babylon's (thinEngine), not public API: if a Babylon upgrade renames it this does
 * nothing, and the phone simply gets full-size textures again — measure with the scratch `mem.mjs`.
 */
import type { Engine } from '@babylonjs/core/Engines/engine'
import { logicalUrl } from '../assets.ts'

export function capTextures(engine: Engine, rules: { match: RegExp; max: number }[],
                            fallbackMax = 0): void {
  type Prep = (texture: { url?: string | null }, ...rest: unknown[]) => unknown
  const e = engine as unknown as { _prepareWebGLTexture?: Prep; getCaps(): { maxTextureSize: number } }
  const prep = e._prepareWebGLTexture
  if (!prep || (rules.length === 0 && fallbackMax <= 0)) return
  e._prepareWebGLTexture = function (texture, ...rest) {
    // (a bucket URL is matched by the public/ path it stands for: src/assets.ts)
    const url = logicalUrl(texture?.url ?? '')
    const rule = rules.find((r) => r.match.test(url))
    // No rule claims it — including everything that arrived inside a model file and has no URL at all —
    // so it gets the tier's general ceiling rather than none.
    const max = rule ? rule.max : fallbackMax
    if (max <= 0) return prep.call(this, texture, ...rest)
    const caps = e.getCaps()
    const was = caps.maxTextureSize
    caps.maxTextureSize = Math.min(was, max)
    try {
      return prep.call(this, texture, ...rest)
    } finally {
      caps.maxTextureSize = was
    }
  }
}
