/**
 * Food and craft stands (owner, 2026-10-29: "food and craft stands"), which OSM does not map: the crêpe and ice-cream stands
 * and souvenir stalls where the visitors are, the painters of the Place du Tertre, and the Marché d'Aligre (mapped as a line
 * only, which the furniture query does not read). Read by the bake into the street furniture.
 */
export type StandKind = 'crepes' | 'glaces' | 'souvenirs' | 'painter' | 'market'

export const PARIS_STANDS: { lat: number; lon: number; kind: StandKind }[] = [
  // the Eiffel Tower and the Trocadéro
  { lat: 48.85790, lon: 2.29520, kind: 'crepes' }, { lat: 48.85775, lon: 2.29640, kind: 'souvenirs' },
  { lat: 48.85650, lon: 2.29750, kind: 'glaces' }, { lat: 48.86170, lon: 2.28800, kind: 'crepes' },
  { lat: 48.86195, lon: 2.28850, kind: 'souvenirs' },
  // the Champs-Élysées, the Concorde and the Tuileries
  { lat: 48.86910, lon: 2.31050, kind: 'glaces' }, { lat: 48.86400, lon: 2.32600, kind: 'crepes' },
  { lat: 48.86360, lon: 2.32850, kind: 'glaces' }, { lat: 48.86350, lon: 2.33550, kind: 'souvenirs' },
  // Notre-Dame and Saint-Michel
  { lat: 48.85400, lon: 2.34800, kind: 'souvenirs' }, { lat: 48.85300, lon: 2.34380, kind: 'crepes' },
  { lat: 48.85250, lon: 2.34700, kind: 'glaces' },
  // Montmartre
  { lat: 48.88580, lon: 2.34350, kind: 'crepes' }, { lat: 48.88380, lon: 2.34370, kind: 'souvenirs' },
  { lat: 48.88640, lon: 2.34150, kind: 'crepes' },
  // the Luxembourg and the Latin Quarter
  { lat: 48.84650, lon: 2.33950, kind: 'glaces' }, { lat: 48.84780, lon: 2.34110, kind: 'crepes' },
  // the Bastille and the Marais
  { lat: 48.85330, lon: 2.36850, kind: 'crepes' }, { lat: 48.85710, lon: 2.35500, kind: 'glaces' },
  // the Marché d'Aligre
  { lat: 48.84890, lon: 2.37740, kind: 'market' },
  // the Place du Tertre: its painters, in rows round the square's trees
  ...[-1, 0, 1].flatMap((a) => [-2, -1, 0, 1, 2].map((b) => ({ lat: 48.88650 + a * 0.000085, lon: 2.34075 + b * 0.0001, kind: 'painter' as const }))),
]
