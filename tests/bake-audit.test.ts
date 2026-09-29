/**
 * The bake's landmark gates (tools/bake-audit.ts).
 *
 * Two things are worth a test here, and neither is "does it find the 36". That number is a fact about
 * today's manifests and is recorded in docs/bake-audit-baseline.json, where lowering it is the fix and
 * raising it is a deliberate act. What must never regress is the SHAPE:
 *
 *  - a restyle entry whose OSM id the bake does not have is reported, and reported as `restyle:` work, not
 *    silently ignored. Nothing had ever checked restyles at all (BUGS.md #102: 36 of San Francisco's 600).
 *  - an entry naming a superseded outline DOES resolve, through the parts that replaced it — procedural
 *    since BUGS.md #100, restyle since #102 — so neither fix is undone by this check reporting it again.
 */
import { describe, expect, it } from 'vitest'
import { stage2 } from '../tools/bake-audit.ts'
import type { LandmarkEntry } from '../src/render/landmarks.ts'

type Sourced = LandmarkEntry & { __file: string }
const entry = (e: Partial<Sourced> & { name: string }): Sourced => ({ __file: 'test.json', ...e } as Sourced)

// way/100 survives; way/200 was replaced by its own building:parts; way/300 is not in the bake at all
const live = { ids: [100, 201, 202], partOf: [200] }

describe('stage 2 — the entries against the buildings that will exist', () => {
  const run = (entries: Sourced[]) => stage2('test-city', 'test', entries, live).misses

  it('a restyle naming an outline the bake replaced resolves through its parts (BUGS.md #102 fixed)', () => {
    expect(run([entry({ name: 'Grace Cathedral', osm: 'way/200', restyle: 'classical' })])).toHaveLength(0)
  })

  it('a PROCEDURAL entry naming the same outline resolves through its parts (BUGS.md #100 stays fixed)', () => {
    expect(run([entry({ name: 'Transamerica', osm: 'way/200', procedural: 'transamerica' })])).toHaveLength(0)
  })

  it('…but an `on` entry does not: it stands on a footprint, and a dropped outline has none', () => {
    const m = run([entry({ name: 'a statue', on: 'way/200', procedural: 'statue' })])
    expect(m).toHaveLength(1)
    expect(m[0].reason).toContain('`on` entry needs a footprint')
  })

  it('an id the bake has nothing at all for is reported, procedural or restyle', () => {
    expect(run([entry({ name: 'gone', osm: 'way/300', procedural: 'gone' })])).toHaveLength(1)
    const m = run([entry({ name: 'gone', osm: 'way/300', restyle: 'brick' })])
    expect(m).toHaveLength(1)
    expect(m[0].work).toBe('restyle:brick')
  })

  it('an entry on a building that exists, and one placed at its own lat/lon, are both fine', () => {
    expect(run([
      entry({ name: 'fine', osm: 'way/100', procedural: 'fine' }),
      entry({ name: 'standalone', lat: 1, lon: 2, osm: 'way/300', procedural: 'standalone' }),
      entry({ name: 'restyled', osm: 'way/100', restyle: 'brick' }),
    ])).toHaveLength(0)
  })

  it('a `within` restyle names no ids and cannot miss — it takes whatever it finds', () => {
    expect(run([entry({ name: 'a square', within: [[0, 0], [0, 1], [1, 1]], restyle: 'brick' })])).toHaveLength(0)
  })

  it('every finding says WHAT was developed, so A can never be read as a coverage gap', () => {
    for (const m of run([
      entry({ name: 'a', osm: 'way/300', procedural: 'a' }),
      entry({ name: 'b', osm: 'way/300', restyle: 'brick' }),
    ])) expect(m.work).toMatch(/^(procedural|restyle):/)
  })
})
