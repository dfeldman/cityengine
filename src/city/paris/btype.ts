/**
 * Paris's building types, at bake time (src/city/building-types.ts), from the building's AGE (APUR's survey of every
 * front: tools/paris-apur.ts) and its ARRONDISSEMENT (paris/arrondissements.ts) — Paris is one cream city told apart by when
 * it was built and how near the centre-west (owner, 2026-10-29: "Essentially every building is cream, with an exception maybe once every few
 * blocks" — "There is some variation between modern cream hausmann-ish facades and real original ones" — "Most of the
 * others are brick with a cream first floor" — "The real exceptions are civic buildings. Museums schools hospitals
 * libraries government offices").
 *
 *   before 1851        the old houses of the Marais and the faubourgs: plastered, shuttered, lower (`marais`)
 *   1851–1914          Haussmann's Paris and its Belle Époque (`haussmann`, each front dressed its own way)
 *   1915–1939          the interwar blocks: cream stone, a few in brick over a cream ground floor (`brick`) outside the centre
 *   1940 on            the post-war fronts: cream or white, flat, regular (`bauhaus` in Paris's cream), towers past 11 storeys
 *   a hospital/clinic  stone before 1940, then like any modern building but likelier glass; every other facility its period
 *   undated            the city's own mix, as before
 */
import type { BuildingFacts, Classifier } from '../building-types.ts'
import type { StyleId } from '../facade.ts'
import { frontZone } from './arrondissements.ts'
import { wallKind } from './materials.ts'

export const classifyParis: Classifier = (b: BuildingFacts) => {
  const rec = b.record
  const out = (archetype: string, style: StyleId, rule: string) => ({ archetype, style, district: 'paris', rule })
  const zone = frontZone(b.lat, b.lon)
  /*
   * GLASS IS RARE. It was everything from 1968 on that was an office or a shop, and a share of the rest (owner, 2026-10-30: "more
   * variety of modern buildings"), which came to 8,200 dark curtain walls. But (2026-10-31): "we draw them all as dark curtain walls, which
   * made sense for san francisco. but in Paris many are cream or white - still modern styles but not the curtain wall style. but there are a
   * few curtain wall buildings around, especially in la defense". 13 street photographs of those buildings that could be read: one or two
   * of glass, the rest white render, cream panels, and stone. So glass where OSM says it, in La Défense, now and then on a late office
   * block, on some hospitals (ones "often glass or metal exteriors"), and the modern default is cream or white. APUR dates Paris proper only:
   * the suburbs in the box, and 7,794 of its own, count as post-war when large.
   */
  const hash = (Math.imul(b.id, 2654435761) >>> 0) % 100
  const kind = b.tags.building ?? ''
  const business = !!b.tags.office || /^(office|commercial|retail|supermarket)$/.test(kind)
  const tall = (b.levels ?? 0) >= 9 || (b.height ?? 0) >= 30
  const known = rec ? Number(rec.construction ?? 99) : 99
  const dated = known >= 1 && known <= 12
  /*
   * The one kind that is never Haussmann (owner, 2026-10-29, from street view: "the only buildings i've found that are not
   * really ever hausmann is hospitals and clinics, which of course are a more modern style, often glass or metal
   * exteriors"): the old ones — the Hôtel-Dieu, the Salpêtrière — stone; one built after 1939 likelier glass than its neighbours.
   */
  const t = b.tags
  const hospital = /^(hospital|clinic)$/.test(t.amenity ?? '') || /^(hospital|clinic)$/.test(t.building ?? '') || t.healthcare === 'hospital' || t.healthcare === 'clinic'
  const saysGlass = /glass|mirror/.test(`${t['building:material'] ?? ''} ${t.material ?? ''} ${t['building:facade:material'] ?? ''} ${t['building:cladding'] ?? ''}`)
  const defense = Math.hypot((b.lon - 2.24) * 73270, (b.lat - 48.8917) * 111320) < 1300
  /** the chance in 100 that a modern building of this period is a curtain wall */
  const glassShare = (period: number): number => {
    if (saysGlass) return 100
    if (defense) return business || tall ? 90 : b.area >= 1500 ? 50 : 10
    if (zone === 'beyond') return business ? 40 : tall ? 20 : b.area >= 1500 ? 15 : 3
    if (hospital) return zone === 'cream' ? 15 : 35
    if (zone === 'cream') return 0
    if (period < 7) return 0
    const late = period >= 9
    return business ? (late ? 20 : 8) : late ? (tall ? 10 : b.area >= 1500 ? 8 : 2) : 0
  }
  /*
   * The tax records' wall material (BD TOPO, tools/paris-bdtopo.ts; owner, 2026-11-05: "brick is likely red though, of course you can
   * paint it, but normally don't"). PURE brick is a brick front wherever it stands; a stone-and-brick mix is a stone front on a brick
   * back and stays cream. Where the records say anything else the old dice for brick are not rolled. Concrete says nothing about the
   * look (a 1990s neo-Haussmann block and a 1970s slab are both concrete), so it is left to the period.
   */
  const walls = wallKind(rec?.walls)
  if (walls === 'brick' && !saysGlass && !(tall && known >= 6)) return out('brick', 'brick', `BD TOPO: brick walls (${rec!.walls})`)
  const noBrickDice = walls !== undefined
  // "every building has a hausmann facade even if it is modern"
  if (zone === 'haussmann') {
    if (dated && known <= 2) return out('old', 'marais', `period ${known}`)
    return out('haussmann', 'haussmann', 'the centre-west: a Haussmann front whatever its age')
  }
  if (!dated) {
    if (hash < glassShare(7)) return out('office', 'skyscraper', 'undated: curtain wall')
    if (tall) return out('tower', 'towerblock', 'undated tower')
    return business || b.area >= 400 ? out('postwar', 'bauhaus', 'undated, large or offices: post-war') : null
  }
  const period = known
  if (period >= 6 && hash < glassShare(period)) return out(hospital ? 'hospital' : 'office', 'skyscraper', `period ${period}: curtain wall`)
  if (hospital && period <= 5) return out('civic', 'classical', `hospital, ${period}`)
  if (period <= 2) return out('old', 'marais', `period ${period}`)
  if (period <= 5) {
    /*
     * Brick, now and then, where the city has any: "maybe 1 per several blocks (often a post office or a clinic or a school, sometimes an
     * apartment building, rarely very large)". A block here is about ten buildings. It used to be everything from 1915 to 1967, which
     * photographs of the buildings so painted say was wrong far more often than right; those are cream.
     */
    const civic = /^(school|college|kindergarten|post_office|clinic|library)$/.test(t.amenity ?? '') || /^(school|college|kindergarten)$/.test(kind)
    const share = zone === 'beyond' ? (period === 3 ? 7 : 50)
      : zone === 'cream' ? 0
      : civic ? 40 : b.area >= 900 ? 1 : period === 3 ? 2 : 6
    if (!noBrickDice && hash < share) return out('brick', 'brick', `period ${period}, ${zone}: one of the few in brick`)
    return period === 5 ? out('postwar', 'bauhaus', `period ${period}, cream`) : out('haussmann', 'haussmann', `period ${period}, cream`)
  }
  // (punched windows on a third of the mid-rises, ribbons on the rest: both white or cream)
  const levels = b.levels ?? 0
  return levels >= 12 || (levels >= 5 && hash % 3 === 0) ? out('tower', 'towerblock', `period ${period}, ${levels} levels`) : out('postwar', 'bauhaus', `period ${period}`)
}
