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
 *   1940 on            the post-war fronts: cream, flat, regular (`bauhaus` in Paris's cream), towers past 11 storeys
 *   a hospital/clinic  glass after 1939 (`skyscraper`'s curtain wall), stone before; every other facility its period
 *   undated            the city's own mix, as before
 */
import type { BuildingFacts, Classifier } from '../building-types.ts'
import type { StyleId } from '../facade.ts'
import { frontZone } from './arrondissements.ts'

export const classifyParis: Classifier = (b: BuildingFacts) => {
  const rec = b.record
  const out = (archetype: string, style: StyleId, rule: string) => ({ archetype, style, district: 'paris', rule })
  const zone = frontZone(b.lat, b.lon)
  /*
   * NOT ALL CREAM (owner, 2026-10-30: "we also should have more variety of modern buildings. quite a few that we've rendered
   * as cream imitation hausmann are actually curtain wall"). APUR dates Paris proper only, so the suburbs in the box — Neuilly,
   * Levallois, Boulogne, round La Défense — had no record and took the default stone; and APUR leaves 7,794 of its own
   * undated, "most of them post-war" by its own note. So: an office or a shop block of no known age is modern glass; a
   * tower of no known age is a modern tower; a large undated footprint counts as post-war. Glass by a seeded share of
   * the rest, more of it the later and the larger the building. Only outside the cream districts (paris/arrondissements.ts).
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
   * exteriors"): a hospital or a clinic built after 1939 is glass; the old ones — the Hôtel-Dieu, the Salpêtrière — stone.
   */
  const t = b.tags
  const hospital = /^(hospital|clinic)$/.test(t.amenity ?? '') || /^(hospital|clinic)$/.test(t.building ?? '') || t.healthcare === 'hospital' || t.healthcare === 'clinic'
  // "every building has a hausmann facade even if it is modern"
  if (zone === 'haussmann') {
    if (dated && known <= 2) return out('old', 'marais', `period ${known}`)
    return out('haussmann', 'haussmann', 'the centre-west: a Haussmann front whatever its age')
  }
  if (!dated) {
    if (zone === 'cream') {
      if (business || tall) return tall && hash < 50 ? out('tower', 'towerblock', 'undated tower') : out('office', 'skyscraper', 'undated office or tower: glass')
      return b.area >= 400 ? out('postwar', 'bauhaus', 'undated, large: post-war') : null
    }
    if (business) return out('office', 'skyscraper', 'undated office or shops: glass')
    if (tall) return hash < 50 ? out('office', 'skyscraper', 'undated tower: glass') : out('tower', 'towerblock', 'undated tower')
    if (b.area >= 400) return hash < 30 ? out('office', 'skyscraper', 'undated, large: glass') : out('postwar', 'bauhaus', 'undated, large: post-war')
    return null
  }
  const period = known
  if (period >= 6) {
    // the later and the larger, the likelier the glass: 1968 on 20%, 1982 on 40%, offices and shops always from 1968
    const glassShare = zone === 'cream' ? 0 : period >= 9 ? 40 : period >= 7 ? 20 : 0
    if ((period >= 7 && business) || hash < glassShare + (zone !== 'cream' && b.area >= 1500 ? 25 : 0)) return out('office', 'skyscraper', `period ${period}: curtain wall`)
  }
  if (hospital) return period <= 5 ? out('civic', 'classical', `hospital, ${period}`) : out('hospital', 'skyscraper', `hospital, ${period}`)
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
    if (hash < share) return out('brick', 'brick', `period ${period}, ${zone}: one of the few in brick`)
    return period === 5 ? out('postwar', 'bauhaus', `period ${period}, cream`) : out('haussmann', 'haussmann', `period ${period}, cream`)
  }
  return (b.levels ?? 0) >= 12 ? out('tower', 'towerblock', `period ${period}, ${b.levels} levels`) : out('postwar', 'bauhaus', `period ${period}`)
}
