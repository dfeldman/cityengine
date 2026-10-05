/**
 * TRAVEL BY FERRY AND MUNI METRO (owner, 2026-10-03: "it would be amazing if the ferries to Sausalito and Treasure
 * Island really worked … just a fade to black and instant travel … display: Where do you want to go? and show a list of
 * destinations … ferries and metros outside the box are not supported. There should be a cost - maybe $1 for metro and
 * $5 for ferry"; and of the Metro: "a ton of stops inside SF. maybe just do select ones. remember our rider mostly wants
 * to avoid hills").
 *
 * A station is a point the rider rides up to; from it, its line's other stations are offered. The Metro stops are the
 * ones that carry a rider UNDER the hills: down Market in the subway, through the Twin Peaks tunnel's mouth at
 * Castro, through the Sunset Tunnel under Buena Vista to Cole Valley, and out along the flat T-Third and N-Judah
 * ends — all inside San Francisco's box (its south edge is about 37.7606°).
 */
export interface Station {
  name: string
  line: 'ferry' | 'metro'
  lat: number
  lon: number
  /** for a ferry: the terminals it sails to from here (the boats all run from the Ferry Building) */
  to?: string[]
}

export const FARES: Record<Station['line'], number> = { ferry: 5, metro: 1 }

export const SF_STATIONS: Station[] = [
  // the ferries (OSM: the Ferry Building's gates, the Sausalito terminal, the Treasure Island terminal)
  { name: 'Ferry Building', line: 'ferry', lat: 37.79560, lon: -122.39320, to: ['Sausalito', 'Treasure Island'] },
  { name: 'Sausalito', line: 'ferry', lat: 37.85600, lon: -122.47790, to: ['Ferry Building'] },
  { name: 'Treasure Island', line: 'ferry', lat: 37.81616, lon: -122.37320, to: ['Ferry Building'] },
  // Alcatraz (BUGS.md #263, owner 2026-10-04: "we should add a (fictional) ferry route to Alcatraz and a tiny bike
  // circuit"): from the real Alcatraz Landing at Pier 33 to the island's dock; the island's paths are kept for it
  // (region `ferryIslands`) and opened to bikes (the `alcatraz` zone's `trails: 'bike'`)
  { name: 'Pier 33 (Alcatraz Landing)', line: 'ferry', lat: 37.80770, lon: -122.40540, to: ['Alcatraz'] },
  { name: 'Alcatraz', line: 'ferry', lat: 37.82690, lon: -122.42280, to: ['Pier 33 (Alcatraz Landing)'] },
  // Muni Metro: select stops, chosen to take a rider round or under the hills
  { name: 'Embarcadero', line: 'metro', lat: 37.79290, lon: -122.39690 },
  { name: 'Montgomery', line: 'metro', lat: 37.78890, lon: -122.40180 },
  { name: 'Powell', line: 'metro', lat: 37.78440, lon: -122.40790 },
  { name: 'Civic Center', line: 'metro', lat: 37.77920, lon: -122.41390 },
  { name: 'Church & Market', line: 'metro', lat: 37.76750, lon: -122.42910 },
  { name: 'Castro', line: 'metro', lat: 37.76250, lon: -122.43520 },
  { name: 'Carl & Cole (Cole Valley)', line: 'metro', lat: 37.76580, lon: -122.44990 },
  { name: '9th Ave & Irving (Inner Sunset)', line: 'metro', lat: 37.76420, lon: -122.46640 },
  { name: '4th & King (Caltrain)', line: 'metro', lat: 37.77640, lon: -122.39410 },
  { name: 'Chase Center', line: 'metro', lat: 37.76860, lon: -122.38960 },
]

/** where a station's line goes from it */
export function destinations(from: Station, all: Station[]): Station[] {
  if (from.line === 'ferry') return all.filter((s) => s.line === 'ferry' && (from.to ?? []).includes(s.name))
  return all.filter((s) => s.line === 'metro' && s !== from)
}
