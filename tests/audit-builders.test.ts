/**
 * A builder that never reaches a building.
 *
 * Salesforce Tower had a good hand-written model — superellipse plan, taper, lattice crown — exported and
 * registered, and it rendered as a plain glass box. The model was never the problem; nothing connected it to
 * a building, and nothing said so. This is that check, run on every `npm test`.
 *
 * The audit itself is tools/audit-builders.ts, which imports the REAL registry and replicates the REAL
 * selection code rather than reading the source with a regex (that gave three different answers).
 *
 * Two cities, because the audit's unit is a BAKE and not a manifest: `landmarks/paris.json` serves
 * `public/cities/paris-centre/`, and looked up by the name "paris" it found no tiles and silently checked
 * nothing while printing green. Every assertion here therefore also proves the check RAN.
 */
import { describe, expect, it } from 'vitest'
import {
  AUDITED, auditBuilders, allowedUnreferenced, bakeKey, NOT_IN_BAKE_KNOWN, UNREFERENCED_OK,
} from '../tools/audit-builders.ts'

const audit = await auditBuilders()
const city = (id: string) => audit.cities.find((c) => c.city === id)!
const list = (rows: { procedural: string; name: string; file: string; detail?: string }[]): string =>
  rows.map((r) => `${r.procedural} "${r.name}" [${r.file}]${r.detail ? ` ${r.detail}` : ''}`).join('\n')

describe.each(AUDITED)('landmark builders reach a building — %s', (id) => {
  const c = city(id)

  /*
   * FIRST, and before any finding is believed: the audit ran at all. A city whose manifest or bake cannot be
   * located used to come back as an empty list, which reads exactly like a clean run — that is how Paris went
   * unchecked. `bake.ok` is a discriminated union precisely so this cannot be skipped by accident.
   */
  it('the audit resolved this city, and list 5 actually ran', () => {
    expect(c.bake.ok ? null : c.bake.reason).toBe(null)
    expect(c.manifest).not.toBe(null)
    expect(c.entries).toBeGreaterThan(0)
  })

  /*
   * The worst case: the manifest names a builder that does not exist. `place()` finds nothing in PROCEDURAL
   * and draws nothing — but the entry has ALREADY had its OSM building taken out of the massing, so the
   * result is bare ground with a name plate on it. There is no console warning for this.
   */
  it('every builder a manifest or skyline names is registered', () => {
    expect(list(c.referencedUnregistered)).toBe('')
  })

  /*
   * The manifest's precedence is FIRST ENTRY WINS (docs/LADDER.md, and the Landmarks constructor): two
   * districts modelled in parallel can both claim a building on their boundary, and the second is dropped.
   * A builder can be registered AND named AND still never run.
   */
  it('no entry with a builder is shadowed by an earlier claim on the same building', () => {
    expect(list(c.referencedShadowed)).toBe('')
  })

  /** An entry in a file no include reaches is never loaded at all. */
  it('every manifest file beside the city manifest is included', () => {
    expect(c.unreached).toEqual([])
    expect(list(c.inUnreachedFile)).toBe('')
  })

  /*
   * The failure that produced the report this audit was written for, and three times before it (the Federal
   * Reserve Bank, the Transit Center, Salesforce Tower): the entry is registered, named and unshadowed, and
   * the building it names is NOT IN THE BAKE. `addTile` waits for it forever; nothing is removed from the
   * massing; the classifier's plain box stands there instead.
   *
   * Asserted as an exact set against the known list, so a new one fails AND a known one silently going away
   * fails — which is how the sixty-nine of BUGS.md #100 were noticed to have been fixed.
   */
  it('no entry names a building this bake does not contain, beyond the known ones', () => {
    const got = c.bake.ok ? c.bake.notInBake.map(bakeKey).sort() : ['LIST 5 DID NOT RUN']
    expect(got).toEqual([...(NOT_IN_BAKE_KNOWN[id] ?? [])].sort())
  })
})

describe('the audit covers what it claims to', () => {
  /*
   * A bake nobody audits is a bake nobody is checking. `AUDITED` is deliberately not every directory under
   * public/cities — paris-marais is superseded by paris-centre, and Chicago and Brooklyn are unfinished and
   * have no landmark manifest — but the set must be a decision, so it is asserted rather than assumed.
   */
  it('audits exactly the cities it means to', () => {
    expect(audit.cities.map((c) => c.city)).toEqual([...AUDITED])
    expect(audit.unchecked).toEqual([])
  })

  /*
   * Dead builders, across the WHOLE registry: a builder belongs to no city in particular (`PROCEDURAL` is one
   * flat keyspace), so this is only meaningful once every city that owns builders has had its say — which is
   * what AUDITED guarantees. Allowed only by an explicit rule in UNREFERENCED_OK: the kit catalogue and the
   * modelling experiments, which tools build straight out of the registry, and a named list kept against
   * BUGS.md #98. A new builder that nothing places fails here.
   */
  it('every registered builder is named by some city, or is allowed for', () => {
    expect(audit.registeredUnreferenced.filter((k) => !allowedUnreferenced(k))).toEqual([])
  })

  /*
   * And the allowlists have to stay honest: a name on one that has since been placed, or deleted, is stale
   * and would hide the next real one. (The patterns are not checked this way — they are open-ended by design.)
   */
  it('nothing on the known-dead list has been fixed or removed without being taken off it', () => {
    expect(UNREFERENCED_OK.known.filter((k) => !audit.registeredUnreferenced.includes(k))).toEqual([])
  })

  it('the known not-in-bake lists name only audited cities', () => {
    expect(Object.keys(NOT_IN_BAKE_KNOWN).filter((k) => !AUDITED.includes(k))).toEqual([])
  })
})
