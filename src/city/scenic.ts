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
  /*
   * San Francisco. Chosen to cover the city rather than to be short: between them these seven reach every
   * part of the box worth riding — the whole waterfront, both big parks, the hills, and the two bridges'
   * ends. That is deliberate, because the point of a route here is not only to be a nice ride but to be a
   * SWEEP: riding one end to end is how a whole quarter of the city gets looked at in one go.
   *
   * Waypoints are places, not a traced line (see above), so they survive a re-bake. They are kept inside the
   * DETAIL box (tools/cities.ts) — roughly 37.760-37.815 N, 122.523-122.385 W — because outside it there are
   * roads and shoreline but no buildings, and a route that leaves it rides through an empty field. The one
   * exception is the Golden Gate Bridge, which is modelled beyond the detail box on purpose.
   */
  'san-francisco': [
    { name: 'The Embarcadero: the Ferry Building to the Marina', waypoints: [
      [37.79550, -122.39370], [37.79950, -122.39800], [37.80430, -122.40230], [37.80870, -122.40980],
      [37.80700, -122.42100], [37.80650, -122.43000], [37.80600, -122.44000], [37.80290, -122.44840]] },
    { name: 'Crissy Field and the Golden Gate', waypoints: [
      [37.80290, -122.44840], [37.80400, -122.45700], [37.80500, -122.46600], [37.81060, -122.47700],
      [37.80850, -122.47530], [37.81990, -122.47830]] },
    { name: 'Golden Gate Park, the Panhandle to Ocean Beach', waypoints: [
      [37.77260, -122.44000], [37.77240, -122.46020], [37.77150, -122.46860], [37.77000, -122.47530],
      [37.77230, -122.48900], [37.77030, -122.49300], [37.76990, -122.51000]] },
    { name: 'The Presidio and Lands End', waypoints: [
      [37.79950, -122.44600], [37.79750, -122.45700], [37.79000, -122.46000], [37.78550, -122.46900],
      [37.79360, -122.48360], [37.78700, -122.50600]] },
    { name: 'The hills: Chinatown, Nob Hill, Lombard and Coit Tower', waypoints: [
      [37.79550, -122.39370], [37.79080, -122.40560], [37.79200, -122.41300], [37.80210, -122.41870],
      [37.80240, -122.40580], [37.80000, -122.40900], [37.78800, -122.40750]] },
    { name: 'Market Street, Civic Center and the Painted Ladies', waypoints: [
      [37.79550, -122.39370], [37.77930, -122.41770], [37.77640, -122.43460], [37.76990, -122.44690],
      [37.77260, -122.44000]] },
    { name: 'The south waterfront: the ballpark and Mission Bay', waypoints: [
      [37.79550, -122.39370], [37.78550, -122.39000], [37.77860, -122.38930], [37.76800, -122.38780]] },
  ],
}
