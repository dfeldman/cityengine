/**
 * OBSERVE FROM THE TOP, Paris (owner, 2026-11-18: "add the O for observe button to more tall structures in Paris, like the Eiffel
 * Tower but also other very large buildings like The Triangle or Grand Rocher"; "both balloons should have observe available").
 * game.ts offers the nearest within `reach` of the rider (default 150 m) and lifts the paused eye to `top` metres over the ground at
 * the point — or just over the placed model's own top within 40 m, whichever is higher, unless `exact` (the Eiffel Tower's antenna
 * is 330 m; the eye belongs on the top platform). Past ~30 m up the far massing (render/far-massing.ts) draws the city beyond the
 * streamed tiles, so a tower's view reaches the horizon.
 */
export interface ObservePoint {
  name: string
  lat: number
  lon: number
  /** the eye's level, metres over the ground at the point */
  top: number
  /** how near the rider must be, metres (default 150) */
  reach?: number
  /** the eye at `top`, never lifted to the model's own top */
  exact?: boolean
  /** a balloon: "observe from …, aloft" / "Aloft in …" */
  aloft?: boolean
  obscura?: string
  skyspace?: string
}

export const PARIS_OBSERVE: ObservePoint[] = [
  // over the antenna's tip: the model's third floor and lantern are solid from 276 to 300 m (eiffel-tower-full.ts), and beside the
  // antenna the eye looks at it from 3 m, a pillar filling the view; the tower's foot is 125 m square, so the Champ de Mars is in reach
  { name: 'the Eiffel Tower', lat: 48.85826, lon: 2.2945, top: 333, exact: true, reach: 220 },
  { name: 'Tour Montparnasse', lat: 48.842112, lon: 2.321979, top: 210 },
  { name: 'the Arc de Triomphe', lat: 48.873792, lon: 2.295028, top: 50, reach: 160 },
  { name: 'Sacré-Cœur', lat: 48.886796, lon: 2.343018, top: 84 },
  { name: 'the Panthéon', lat: 48.846202, lon: 2.346083, top: 83 },
  { name: 'Tour Triangle', lat: 48.831732, lon: 2.286038, top: 180 },
  { name: 'Le Grand Rocher', lat: 48.833805, lon: 2.419719, top: 65 },
  { name: 'the Tours Duo', lat: 48.824952, lon: 2.382775, top: 180 },
  { name: 'the Tribunal de Paris', lat: 48.894848, lon: 2.309563, top: 163 },
  // La Défense
  { name: 'the Grande Arche', lat: 48.892564, lon: 2.235875, top: 110 },
  { name: 'Tour First', lat: 48.888815, lon: 2.251592, top: 231 },
  { name: 'The Link', lat: 48.887268, lon: 2.2479, top: 242 },
  { name: 'Hekla', lat: 48.889033, lon: 2.235087, top: 221 },
  { name: 'Tour Majunga', lat: 48.888878, lon: 2.243601, top: 195 },
  // the two tethered balloons, at the height each goes to (render/paris/balloons.ts), wherever the balloon is in its cycle
  { name: 'the Ballon de Paris', lat: 48.841365, lon: 2.273985, top: 150, exact: true, aloft: true },
  { name: 'the Vasque', lat: 48.862889, lon: 2.3292925, top: 60, exact: true, aloft: true },
]
