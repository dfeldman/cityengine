/**
 * What BD TOPO's material codes (tools/paris-bdtopo.ts; the tax records' fichiers fonciers) mean for a building's look.
 * One digit a material, two a mix: 1 stone, 2 millstone, 3 concrete, 4 brick, 5 breeze block, 6 wood, 9 other, 0 unknown.
 */

/** what a wall code means for the look: pure brick, millstone (alone or with brick), or nothing the classifier uses */
export function wallKind(code: string | undefined): 'brick' | 'millstone' | 'stone' | 'concrete' | undefined {
  const c = (code ?? '').replace(/0/g, '')
  if (!c) return undefined
  const set = new Set(c)
  if ([...set].every((d) => d === '4')) return 'brick'
  if (set.has('2') && [...set].every((d) => d === '2' || d === '4')) return 'millstone'
  if ([...set].every((d) => d === '3')) return 'concrete'
  if (set.has('1')) return 'stone'
  return undefined
}

/** a roof code's colour, where it says one material: tiles, slate, zinc, concrete (flat) */
export function roofKind(code: string | undefined): 'tile' | 'slate' | 'zinc' | 'concrete' | undefined {
  const c = (code ?? '').replace(/0/g, '')
  if (c.length !== 1 && !(c.length === 2 && c[0] === c[1])) return undefined
  return ({ 1: 'tile', 2: 'slate', 3: 'zinc', 4: 'concrete' } as Record<string, 'tile' | 'slate' | 'zinc' | 'concrete'>)[c[0]]
}

/** the roof colours a known roof material gives a pitched roof (a flat one keeps its style's); tune here */
export const ROOF_RGB: Record<'tile' | 'slate' | 'zinc', [number, number, number]> = {
  tile: [0.6, 0.32, 0.23], slate: [0.27, 0.29, 0.33], zinc: [0.56, 0.59, 0.61],
}
