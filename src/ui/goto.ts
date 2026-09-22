/**
 * Go to a place: paste "48.854774, 2.362375" (what Google Street View and Maps copy) and ride from the
 * nearest street to it — in whichever baked city it falls in. Reached by G (asks for the coordinates) or
 * by simply pasting them anywhere on the page.
 *
 * It reloads with `?city=…&at=lat,lon` rather than moving the rider in place: a reload is the one path that
 * already puts everything (crowd, traffic, the minimap, a different city) in order, and the URL it leaves is
 * a link back to the same spot.
 */

export interface CityRef { id: string; name: string; lat?: number; lon?: number; radius?: number }

/** "48.854774, 2.362375", "48.854774 2.362375", "(48.85, 2.36)" — or null. */
export function parseLatLon(text: string): { lat: number; lon: number } | null {
  const m = /(-?\d{1,3}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)/.exec(text.trim())
  if (!m) return null
  const lat = Number(m[1])
  const lon = Number(m[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return { lat, lon }
}

/** Metres between two points, near enough at city scale. */
function metres(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const k = Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180))
  return Math.hypot((a.lat - b.lat) * 110_574, (a.lon - b.lon) * 111_320 * k)
}

/**
 * The baked city a point falls in, nearest first — within one and a half radii, because the rider starts
 * on the nearest rideable street anyway, and the landmarks just outside the box (the Pompidou, the Tour
 * Saint-Jacques, the Hôtel de Ville) are exactly the places someone will paste.
 */
export function cityFor(ll: { lat: number; lon: number }, cities: CityRef[]): CityRef | null {
  let best: { c: CityRef; d: number } | null = null
  for (const c of cities) {
    if (c.lat === undefined || c.lon === undefined) continue
    const d = metres(ll, { lat: c.lat, lon: c.lon })
    if (d <= (c.radius ?? 700) * 1.5 && (!best || d < best.d)) best = { c, d }
  }
  return best?.c ?? null
}

/**
 * Go there, or say why not. Returns the message to show when it cannot. `here` keeps the current city
 * whatever the distance — the landmark menu, whose places are all in or beside it.
 */
export function goTo(text: string, cities: CityRef[], here?: string): string | null {
  const ll = parseLatLon(text)
  if (!ll) return `not a "lat, lon": ${text.slice(0, 60)}`
  const city = here ? { id: here, name: here } : cityFor(ll, cities)
  if (!city) return `${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)} is not in any baked city`
  const q = new URLSearchParams(location.search)
  q.set('city', city.id)
  q.set('at', `${ll.lat.toFixed(6)},${ll.lon.toFixed(6)}`)
  q.delete('start')
  // the comma left readable, so the URL is itself a pasteable place
  location.search = `?${q}`.replace(/%2C/g, ',')
  return null
}
