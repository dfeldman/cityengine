/**
 * Paris's building types, at bake time (src/city/building-types.ts), from the building's AGE (APUR's survey of every
 * front: tools/paris-apur.ts) — not its height or its neighbourhood, because Paris is one cream city told apart by when
 * it was built (owner, 2026-10-29: "Essentially every building is cream, with an exception maybe once every few
 * blocks" — "There is some variation between modern cream hausmann-ish facades and real original ones" — "Most of the
 * others are brick with a cream first floor" — "The real exceptions are civic buildings. Museums schools hospitals
 * libraries government offices").
 *
 *   before 1851        the old houses of the Marais and the faubourgs: plastered, shuttered, lower (`marais`)
 *   1851–1914          Haussmann's Paris and its Belle Époque (`haussmann`, each front dressed its own way)
 *   1915–1939          the interwar blocks and the HBM rings: brick over a cream stone ground floor (`brick`, Paris's
 *                      palette with the cream ground)
 *   1940 on            the post-war fronts: cream, flat, regular (`bauhaus` in Paris's cream), towers past 11 storeys
 *   a hospital/clinic  glass after 1939 (`skyscraper`'s curtain wall), stone before; every other facility its period
 *   undated            the city's own mix, as before
 */
import type { BuildingFacts, Classifier } from '../building-types.ts'
import type { StyleId } from '../facade.ts'

export const classifyParis: Classifier = (b: BuildingFacts) => {
  const rec = b.record
  const period = Number(rec?.construction ?? 99)
  if (!rec || !(period >= 1 && period <= 12)) return null
  const out = (archetype: string, style: StyleId, rule: string) => ({ archetype, style, district: 'paris', rule })
  /*
   * The one kind that is never Haussmann (owner, 2026-10-29, from street view: "the only buildings i've found that are not
   * really ever hausmann is hospitals and clinics, which of course are a more modern style, often glass or metal
   * exteriors"): a hospital or a clinic built after 1939 is glass; the old ones — the Hôtel-Dieu, the Salpêtrière — stone.
   * Every other facility, the schools and libraries and town halls among them, wears its period like its neighbours.
   */
  const t = b.tags
  const hospital = /^(hospital|clinic)$/.test(t.amenity ?? '') || /^(hospital|clinic)$/.test(t.building ?? '') || t.healthcare === 'hospital' || t.healthcare === 'clinic'
  if (hospital) return period <= 5 ? out('civic', 'classical', `hospital, ${period}`) : out('hospital', 'skyscraper', `hospital, ${period}`)
  if (period <= 2) return out('old', 'marais', `period ${period}`)
  if (period === 3) return out('haussmann', 'haussmann', 'period 3')
  if (period <= 5) return out('interwar', 'brick', `period ${period}`)
  return (b.levels ?? 0) >= 12 ? out('tower', 'towerblock', `period ${period}, ${b.levels} levels`) : out('postwar', 'bauhaus', `period ${period}`)
}
