import { describe, expect, it } from 'vitest'
import { Sights } from '../src/game/tour.ts'
import { sameThing } from '../src/game/tour-same.ts'

// a flat frame: 1 "degree" = 1 metre, so points read as metres
const toLocal = (ll: { lat: number; lon: number }) => ({ x: ll.lon, z: ll.lat })
const rideBy = [{ lat: 0, lon: 0, name: 'Pont Royal', text: 'A bridge.' }, { lat: 0, lon: 1000, name: 'Far', text: 'Far.' }]

describe('Sights', () => {
  it('a ride-by sight comes up in range', () => {
    const s = new Sights([], toLocal, () => [], rideBy)
    expect(s.update({ x: 0, z: 50 })?.name).toBe('Pont Royal')
    expect(s.update({ x: 0, z: 40 })).toBeNull()
  })
  it('waits while canShow says no, rather than being lost', () => {
    const s = new Sights([], toLocal, () => [], rideBy)
    expect(s.update({ x: 0, z: 100 }, [], () => false)).toBeNull()
    expect(s.update({ x: 0, z: 90 }, [], () => true)?.name).toBe('Pont Royal')
  })
  it('once: not again after riding away and back', () => {
    const s = new Sights([], toLocal, () => [], rideBy)
    s.update({ x: 0, z: 50 }, [], () => true, true)
    s.update({ x: 500, z: 500 }, [], () => true, true)
    expect(s.update({ x: 0, z: 50 }, [], () => true, true)).toBeNull()
    // free ride: it comes back
    const f = new Sights([], toLocal, () => [], rideBy)
    f.update({ x: 0, z: 50 }); f.update({ x: 500, z: 500 })
    expect(f.update({ x: 0, z: 50 })?.name).toBe('Pont Royal')
  })
  it('a tour stop\'s own sight is marked seen, not shown', () => {
    const s = new Sights([], toLocal, () => [], rideBy)
    expect(s.update({ x: 0, z: 50 }, [{ x: 10, z: 10 }])).toBeNull()
  })
  it('a landmark note for the same thing as a sight is not shown twice', () => {
    const s = new Sights([], toLocal, () => [{ name: 'Le Pont Royal', x: 30, z: 0, text: 'x' }], rideBy)
    expect(s.update({ x: 0, z: 50 })?.name).toBe('Pont Royal')
    expect(s.update({ x: 30, z: 40 })).toBeNull()
  })
})

describe('sameThing', () => {
  it('matches names sharing a word, near each other', () => {
    expect(sameThing({ name: 'The Eiffel Tower', x: 0, z: 0 }, { name: 'Tour Eiffel', x: 190, z: 0 })).toBe(true)
    expect(sameThing({ name: 'Pont de la Concorde', x: 0, z: 0 }, { name: 'Place de la Concorde', x: 380, z: 0 })).toBe(false)
    expect(sameThing({ name: 'Place Vendôme', x: 0, z: 0 }, { name: 'Place de la Bastille', x: 10, z: 0 })).toBe(false)
  })
})
