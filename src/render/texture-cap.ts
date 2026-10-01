/**
 * A smaller ceiling on some textures' size, by where they come from (BUGS.md #242, src/tier.ts).
 *
 * On a phone the trees', plants', palms' and walkers' images — dozens of 1024² leaf atlases, barks and skins, ~400 MB
 * of GPU memory in San Francisco — are drawn a few hundred pixels across at most. Babylon already shrinks any image
 * larger than `caps.maxTextureSize` as it uploads it, reading the cap synchronously inside `_prepareWebGLTexture`; so
 * the cap is lowered for exactly that call, for the textures whose URL matches, and put back. Nothing else — the
 * facade atlas, the sign pages, the render targets — sees a different cap.
 *
 * `_prepareWebGLTexture` is Babylon's (thinEngine), not public API: if a Babylon upgrade renames it this does
 * nothing, and the phone simply gets full-size textures again — measure with the scratch `mem.mjs`.
 */
import type { Engine } from '@babylonjs/core/Engines/engine'

export function capTextures(engine: Engine, rules: { match: RegExp; max: number }[]): void {
  type Prep = (texture: { url?: string | null }, ...rest: unknown[]) => unknown
  const e = engine as unknown as { _prepareWebGLTexture?: Prep; getCaps(): { maxTextureSize: number } }
  const prep = e._prepareWebGLTexture
  if (!prep || rules.length === 0) return
  e._prepareWebGLTexture = function (texture, ...rest) {
    const url = texture?.url ?? ''
    const rule = rules.find((r) => r.match.test(url))
    if (!rule) return prep.call(this, texture, ...rest)
    const caps = e.getCaps()
    const was = caps.maxTextureSize
    caps.maxTextureSize = Math.min(was, rule.max)
    try {
      return prep.call(this, texture, ...rest)
    } finally {
      caps.maxTextureSize = was
    }
  }
}
