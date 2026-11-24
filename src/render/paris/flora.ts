/**
 * Paris's plants (render/flora.ts; PARIS_PARITY.md §3). It had the default's maples and birches, which is a suburb
 * of anywhere. The city's own register ("Les arbres", ~200 000 trees) puts the LONDON PLANE first by far — about a
 * third of the street trees, down every boulevard and along the quais, many of them pollarded — then the horse
 * chestnut, the lime, the pagoda tree (Sophora) and the maples. The libraries have the plane, both ways
 * (public/sftrees, generated for San Francisco's own planes); there is no chestnut or lime, so the broad, round
 * beeches and elms stand in for them, and the ash for the pagoda tree. The parks and the Bois: oak and beech, the
 * planes and chestnuts of the formal gardens, a few pines.
 */
import type { Flora } from '../flora.ts'

export function parisFlora(): Flora {
  return {
    street: [['sf_plane', 6], ['sf_plane_pollard', 3], ['beech', 2], ['elm', 2], ['ash', 2], ['maple', 1]],
    park: [['oak', 4], ['beech', 3], ['sf_plane', 3], ['elm', 2], ['maple', 1], ['scots_pine', 1]],
    // (a row a landmark asks to be planes: the Jardin des Plantes' allées. Otherwise the park pool, oaks and pines among it)
    // (and a collection that asks for a kind of tree: the Arboretum de Paris, planted by family — tools/gardens/vincennes.ts.
    // Its firs and cunninghamias take the black and Scots pines; its larger cypresses the broad one; the columnar cypress
    // and the Lombardy poplar are its fastigiate trees; the Rosaceae its blossom; the magnolias the glossy laurel)
    forms: {
      plane: [['sf_plane', 3], ['sf_plane_pollard', 1]],
      pine: [['scots_pine', 2], ['black_pine', 1]],
      cypress: [['sf_cypress', 1], ['cypress', 1]],
      columnar: [['poplar', 1], ['cypress', 1]],
      weeping: [['sf_pepper', 1]],
      blossom: [['sf_blossom', 1]],
      laurel: [['sf_laurel', 1]],
      oak: [['oak', 2], ['beech', 1]],
      deciduous: [['maple', 2], ['birch', 1], ['ash', 1], ['elm', 1]],
    },
    formModels: { plane: 2, pine: 2, cypress: 2, columnar: 2, weeping: 2, blossom: 2, laurel: 2, oak: 2, deciduous: 3 },
    library: 'sftrees',
  }
}
