/**
 * Which named places matter, shared by `npm run landmarks` (the list for sourcing models) and the bake (the
 * name plates and totems on the buildings themselves, item K).
 */
import { bboxOf, type CitySpec } from './cities.ts'

export function landmarkQuery(c: CitySpec): string {
  const b = bboxOf(c)
  const box = `${b.south},${b.west},${b.north},${b.east}`
  return `[out:json][timeout:120];
(
  nwr["historic"~"^(monument|memorial|castle|palace|church|cathedral|city_gate|tower|fort|manor|ruins|archaeological_site)$"]["name"](${box});
  nwr["tourism"~"^(attraction|museum|artwork|viewpoint)$"]["name"](${box});
  nwr["amenity"="place_of_worship"]["name"](${box});
  nwr["man_made"~"^(tower|obelisk|lighthouse|column|bridge)$"]["name"](${box});
  nwr["building"~"^(cathedral|church|chapel|basilica|palace|castle|mosque|synagogue|temple|government|civic)$"]["name"](${box});
  nwr["building"]["wikidata"](${box});
  nwr["memorial"](${box});
);
out center tags qt;`
}

/** Rough importance: what a person riding past would most want to see done properly — or named. */
export function score(t: Record<string, string>): number {
  let s = 0
  if (t.wikidata) s += 4
  if (t.wikipedia) s += 3
  if (t.heritage) s += 2
  if (/^(monument|castle|palace|cathedral|city_gate|tower)$/.test(t.historic ?? '')) s += 3
  else if (t.historic) s += 1
  if (t.memorial === 'column' || t.memorial === 'obelisk' || t.man_made === 'column' || t.man_made === 'obelisk') s += 3
  if (t.tourism === 'attraction') s += 2
  if (t.tourism === 'museum' || t.amenity === 'museum') s += 3
  if (t.amenity === 'place_of_worship') s += 2
  if (/^(school|college|university|townhall|library|theatre|courthouse|hospital)$/.test(t.amenity ?? '')) s += 2
  if (t.shop === 'department_store') s += 2
  if (/^(cathedral|basilica|palace|church|chapel|synagogue|mosque|temple|school|university|civic|government)$/.test(t.building ?? '')) s += 2
  if (t.height || t['building:levels']) s += 1
  return s
}

export function kindOf(t: Record<string, string>): string {
  return t.memorial ? `memorial (${t.memorial})` : t.historic ? `historic ${t.historic}`
    : t.man_made ? t.man_made : t.amenity === 'place_of_worship' ? `place of worship${t.religion ? ` (${t.religion})` : ''}`
    : t.tourism ? t.tourism : t.building ? `building=${t.building}` : 'landmark'
}

export type LandmarkKind = 'church' | 'school' | 'museum' | 'civic' | 'shop' | 'historic' | 'other'

/** What sort of place, for the colour of its plate's marker. */
export function landmarkKind(t: Record<string, string>): LandmarkKind {
  if (t.amenity === 'place_of_worship' || /^(cathedral|basilica|church|chapel|synagogue|mosque|temple)$/.test(t.building ?? '')) return 'church'
  if (/^(school|college|university|kindergarten)$/.test(t.amenity ?? '') || /^(school|university)$/.test(t.building ?? '')) return 'school'
  if (t.tourism === 'museum' || t.amenity === 'museum' || t.tourism === 'gallery') return 'museum'
  if (/^(townhall|library|theatre|courthouse|hospital|post_office)$/.test(t.amenity ?? '') || /^(civic|government)$/.test(t.building ?? '')) return 'civic'
  if (t.shop) return 'shop'
  if (t.historic || t.heritage) return 'historic'
  return 'other'
}
