/**
 * Preplanned routes (PARIS_EXPAND §6 item 11, "later: scenic loops"): per region, a name and its waypoints.
 * The GPS takes the rider to each in turn by the shortest way on the ride graph, so a route is only its
 * places, not a hand-traced line — it survives any re-bake.
 */
export interface Scenic { name: string; waypoints: [number, number][] }

export const SCENIC: Record<string, Scenic[]> = {
  paris: [
    { name: 'The Seine, Hôtel de Ville to the Eiffel Tower', waypoints: [
      [48.85640, 2.35240], [48.85900, 2.34120], [48.86010, 2.33200], [48.86530, 2.32110],
      [48.86380, 2.31330], [48.86440, 2.30180], [48.86200, 2.28850], [48.85930, 2.29290], [48.85840, 2.29450]] },
    { name: 'The islands: Pont Neuf, Notre-Dame, Île Saint-Louis', waypoints: [
      [48.85710, 2.34120], [48.85320, 2.34820], [48.85190, 2.35220], [48.85250, 2.35710],
      [48.84950, 2.35700], [48.85270, 2.35420], [48.85780, 2.33725], [48.86060, 2.33760]] },
    { name: 'The great monuments', waypoints: [
      [48.87150, 2.33170], [48.86990, 2.32420], [48.86550, 2.32110], [48.87200, 2.29900],
      [48.86300, 2.28720], [48.85840, 2.29450], [48.85300, 2.30150], [48.85620, 2.31270], [48.86610, 2.31230]] },
    { name: 'The Marais', waypoints: [
      [48.85320, 2.36910], [48.85560, 2.36530], [48.85720, 2.36190], [48.85640, 2.35240],
      [48.86060, 2.35220], [48.86750, 2.36370]] },
  ],
}
