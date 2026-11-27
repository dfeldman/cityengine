/**
 * The street-ad library's page layout (owner, 2026-11-26: "a library of these… a few different sizes and a wide
 * variety… prerendered so they're very fast"), shared by the generator (tools/affiches/render.ts, which paints every
 * ad of a set into one picture) and the game (render/affiches.ts, which maps the cells onto the furniture).
 *
 * Four families, one per kind of surface; each its own pixel density, for the distance it is read from:
 * - portrait  ≈ 0.68 — the "2 m²" sheet, 1.2 × 1.76 m: sucettes, bus shelters, poster boards, the Morris ring
 * - landscape 4:3   — Paris's "8 m²" panel, 3.2 × 2.4 m
 * - wide      3.4:1 — the American bulletin, 14.6 × 4.3 m, read from a block away
 * - flyer     ≈ 0.77 — a letter-size sheet stapled to a pole
 * (Sized so a set's ~150 ads fill one 2048 × 4096 page: 9 portraits a shelf, 6 landscapes, 4 wides, 16 flyers.)
 * Cells sit on shelves 2048 px wide, each family on its own shelves, every cell with a gutter its own colour bleeds
 * into (the mip levels of one ad must not pick up the next).
 *
 * (Never "ads"/"advert" in a path: ad blockers' lists match those, and the owner's Chrome would quietly drop the page.)
 */
export type AfficheFamily = 'portrait' | 'landscape' | 'wide' | 'flyer'
export const FAMILIES: AfficheFamily[] = ['portrait', 'landscape', 'wide', 'flyer']
/** the cell sizes in pixels, without the gutter */
export const CELL: Record<AfficheFamily, { w: number; h: number }> = {
  portrait: { w: 214, h: 315 },
  landscape: { w: 328, h: 246 },
  wide: { w: 500, h: 147 },
  flyer: { w: 112, h: 146 },
}
export const GUTTER = 6
export const PAGE_W = 2048

export interface AfficheRect { x: number; y: number; w: number; h: number }

/** Every cell of a set, by family in order of the set's entries, and the page's height. */
export function packAffiches(counts: Record<AfficheFamily, number>): { rects: Record<AfficheFamily, AfficheRect[]>; height: number } {
  const rects = { portrait: [], landscape: [], wide: [], flyer: [] } as Record<AfficheFamily, AfficheRect[]>
  let y = 0
  for (const f of FAMILIES) {
    const { w, h } = CELL[f]
    const per = Math.floor(PAGE_W / (w + GUTTER * 2))
    for (let i = 0; i < counts[f]; i++) {
      const c = i % per
      const r = Math.floor(i / per)
      rects[f].push({ x: c * (w + GUTTER * 2) + GUTTER, y: y + r * (h + GUTTER * 2) + GUTTER, w, h })
    }
    y += Math.ceil(counts[f] / per) * (h + GUTTER * 2)
  }
  // (a power of two tall: mipmaps on any GPU)
  return { rects, height: 2 ** Math.ceil(Math.log2(y)) }
}

/** the set a region's furniture wears: Paris its own, in French; every American region SF's */
export const afficheSet = (region: string | undefined): 'paris' | 'sf' => (region === 'paris' ? 'paris' : 'sf')
