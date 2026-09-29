/**
 * The footprint-form scan, checked against known answers.
 *
 * `src/city/ring-forms.ts` runs inside the bake on every building in every city (tools/bake.ts) and flags
 * the ones the slot kit cannot express, so they are routed to from-scratch modelling instead of being
 * flattened into it (docs/LADDER.md §3c, PLAN.md §Soon.0). The sweep that justified it scored 621 downtown
 * San Francisco buildings and flagged four; three of those are in here, with five ordinary right-angled
 * blocks that must NOT flag.
 *
 * The rings are a FIXTURE (tests/fixtures/ring-forms.json), lifted from the Overpass cache once. Reading
 * `tools/cache` here would pass on this machine and fail on a clean checkout.
 *
 * The path under test is the BAKE's, not the tool's: lat/lon → `Projection.toLocal` → closing vertex
 * dropped → `ccw` → `ringForm`. Testing the tool's own lat/lon conversion would leave the thing that
 * actually runs in production unchecked.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'
import { RING_FORMS, ringForm, scoreRing, thresholds, type MetreRing } from '../src/city/ring-forms.ts'

type Fixture = Record<string, { name: string; height: number; geometry: [number, number][] }>
const fixtures = JSON.parse(
  readFileSync(resolve(import.meta.dirname, 'fixtures', 'ring-forms.json'), 'utf8')) as Fixture

// the bake's own origin for San Francisco (tools/cities.ts); any nearby origin gives the same metres
const proj = new Projection({ lat: 37.7929, lon: -122.4000 })

/** Exactly what tools/bake.ts does with an OSM way's geometry before it scores it. */
function bakeRing(geometry: [number, number][]): MetreRing {
  const ring = geometry.map(([lat, lon]) => proj.toLocal({ lat, lon }))
  // OSM closes the ring; the bake does not
  if (ring.length > 1 && ring[0].x === ring.at(-1)!.x && ring[0].z === ring.at(-1)!.z) ring.pop()
  // the bake scores the ring as OSM drew it (`ownerRing`), before `ccw()` is applied for packing
  return ring
}

const of = (id: string) => ringForm(bakeRing(fixtures[id].geometry), fixtures[id].height)

describe('the kit cannot express these', () => {
  it('101 California is a cylinder somebody drew as a hundred 1 m steps: `stair`, not `arc`', () => {
    const f = of('1279505488')
    expect(f).not.toBeNull()
    expect(f!.fired).toBe('stair')
    expect(f!.stair).toBeGreaterThanOrEqual(40)
    expect(f!.arc).toBe(0)
    // and the point of the whole exercise: `ortho` calls the roundest building downtown 75% orthogonal, so
    // counting vertices or trusting `ortho` alone would miss it entirely
    expect(f!.ortho).toBeGreaterThan(70)
  })

  it('555 California has its bays drawn, so the footprint is a square wave: `saw`', () => {
    const f = of('288511106')
    expect(f).not.toBeNull()
    expect(f!.fired).toBe('saw')
    expect(f!.saw).toBeGreaterThanOrEqual(60)
    expect(f!.stair).toBe(0)
  })

  it('388 Market is a genuine smooth curve: `arc`', () => {
    const f = of('1279504526')
    expect(f).not.toBeNull()
    expect(f!.fired).toBe('arc')
    expect(f!.arc).toBeGreaterThanOrEqual(RING_FORMS.curvedM)
  })
})

describe('ordinary right-angled blocks do not flag', () => {
  // four of them score 100% orthogonal on 23–38 vertices, which is the measured point that VERTEX COUNT IS
  // WORTHLESS: a 38-vertex outline of light wells and rear setbacks is perfectly kit-shaped
  for (const id of ['132125167', '260282389', '151185876', '32612608', '148712640']) {
    it(`${fixtures[id].name} (way/${id})`, () => {
      expect(of(id)).toBeNull()
      const s = scoreRing(bakeRing(fixtures[id].geometry))!
      expect(s.ortho).toBeGreaterThan(0.9)
      expect(s.arc + s.stair).toBeLessThan(RING_FORMS.curvedM)
      expect(s.saw).toBeLessThan(RING_FORMS.sawM)
    })
  }
})

describe('the gates and the knobs', () => {
  it('nothing under minHeight is scored at all — a curved bike shed is not worth a model', () => {
    expect(ringForm(bakeRing(fixtures['1279505488'].geometry), 9)).toBeNull()
    expect(ringForm(bakeRing(fixtures['1279505488'].geometry), undefined)).toBeNull()
  })

  /*
   * Reversing a ring gives the SAME verdict but not bit-identical metres: every run is found by walking
   * forward from each vertex, so a run's last tooth can fall in or out by one at its boundary (555
   * California: 22 teeth over 76.26 m one way, 21 over 76.19 m the other). Inherent to the original
   * algorithm and left alone — the flag is what is read, and it does not move.
   */
  it('winding order does not change the verdict', () => {
    const fwd = bakeRing(fixtures['288511106'].geometry)
    const rev = [...fwd].reverse()
    const a = scoreRing(fwd)!, b = scoreRing(rev)!
    expect(b.saw).toBeCloseTo(a.saw, 0)
    expect(ringForm(rev, 226)!.fired).toBe(ringForm(fwd, 226)!.fired)
  })

  it('the thresholds are per-city knobs, not constants buried in the scorer', () => {
    // a city whose mappers never digitise a curve as a staircase can turn `stair` off by raising its run
    const strict = thresholds({ stairMinRun: 500 })
    expect(ringForm(bakeRing(fixtures['1279505488'].geometry), 183, strict)).toBeNull()
    // and one whose mappers chamfer every corner can raise the curved cut past 388 Market's 10 m of arc
    const blunt = thresholds({ curvedM: 100 })
    expect(ringForm(bakeRing(fixtures['1279504526'].geometry), 118, blunt)).toBeNull()
  })

  it('carries all three values and which fired, so a later reader can re-threshold without a re-bake', () => {
    const f = of('288511106')!
    expect(Object.keys(f).sort()).toEqual(['arc', 'fired', 'ortho', 'saw', 'stair'])
    for (const k of ['arc', 'stair', 'saw', 'ortho'] as const) expect(Number.isInteger(f[k])).toBe(true)
  })
})
