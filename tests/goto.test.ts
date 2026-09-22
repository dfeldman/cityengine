import { describe, expect, it } from 'vitest'
import { cityFor, parseLatLon } from '../src/ui/goto.ts'

const CITIES = [
  { id: 'paris-marais', name: 'Paris', lat: 48.8577, lon: 2.3622, radius: 700 },
  { id: 'san-francisco', name: 'SF', lat: 37.793, lon: -122.412, radius: 650 },
]

describe('go to a pasted place', () => {
  it('reads what Street View and Google Maps copy', () => {
    expect(parseLatLon('48.854774, 2.362375')).toEqual({ lat: 48.854774, lon: 2.362375 })
    expect(parseLatLon('  37.7955 -122.4180 ')).toEqual({ lat: 37.7955, lon: -122.418 })
    expect(parseLatLon('(48.85,2.36)')).toEqual({ lat: 48.85, lon: 2.36 })
    expect(parseLatLon('Rue de Rivoli')).toBeNull()
    expect(parseLatLon('148.5, 2.3')).toBeNull()
  })

  it('finds the baked city a point is in, and none for a point in no city', () => {
    expect(cityFor({ lat: 48.854774, lon: 2.362375 }, CITIES)?.id).toBe('paris-marais')
    expect(cityFor({ lat: 37.7955, lon: -122.418 }, CITIES)?.id).toBe('san-francisco')
    expect(cityFor({ lat: 48.8584, lon: 2.2945 }, CITIES)).toBeNull()   // the Eiffel Tower: 5 km out
  })
})
