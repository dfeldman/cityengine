/**
 * CANDIDATE SIGHTS ALONG A TOUR (owner, 2026-11-15: "add more sights"): routes each tour as tour mode does, then lists the
 * notable OSM features (a wikipedia/wikidata tag and a tourism/historic/worship/park/bridge/… tag) within `--near` metres
 * of the route, by distance along it — the raw list a ride-by sight (src/city/<city>/sights.ts) is written from. Features
 * already a tour stop or a sight are marked with *.
 *   osmium extract -b 2.08,48.78,2.45,48.93 tools/cache/osm/ile-de-france-latest.osm.pbf -o paris.pbf
 *   osmium tags-filter paris.pbf nwr/wikipedia nwr/wikidata -o wiki.pbf
 *   osmium tags-filter wiki.pbf nwr/tourism nwr/historic nwr/amenity=place_of_worship,theatre,fountain nwr/leisure=park,garden
 *     nwr/man_made nwr/bridge nwr/place=square nwr/railway=station nwr/building=church,cathedral,palace -o poi.pbf
 *   osmium export poi.pbf -f geojsonseq -o poi.geojsonseq
 *   node --experimental-strip-types tools/tour-sights.ts --city=paris-centre --poi=poi.geojsonseq [--tour=<id>] [--near=60]
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { shippedDir } from './bake-files.ts'
import { unpackRide, type RideFile } from '../src/city/ridefile.ts'
import { Projection } from '../src/city/geo.ts'
import { SF_TOURS } from '../src/city/sf/tours.ts'
import { PARIS_TOURS } from '../src/city/paris/tours.ts'
import { sightsFor } from '../src/city/sights.ts'
import { sameThing } from '../src/game/tour-same.ts'
const toursFor = (c: string) => c === 'san-francisco' ? SF_TOURS : PARIS_TOURS
import { isTunnel, nearestOnGraph, planRoute, tourEdgeCost } from '../src/sim/route.ts'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'paris-centre')
/** metres from the route a feature's centre may be */
const NEAR = Number(arg('near', '60'))
const index = JSON.parse(readFileSync(resolve(shippedDir(city), 'index.json'), 'utf8'))
const g = unpackRide(JSON.parse(readFileSync(resolve(shippedDir(city), 'ride-bike.json'), 'utf8')) as RideFile)
const proj = new Projection(index.origin)
type P = { x: number; z: number }

type Poi = { name: string; kind: string; p: P; r: number }
const pois = new Map<string, Poi>()
for (const l of readFileSync(arg('poi'), 'utf8').split('\n')) {
  const f = JSON.parse(l.replace(/^\x1e/, '') || 'null')
  const name = f?.properties?.name
  if (!name) continue
  const pr = f.properties
  const kind = pr.tourism ?? pr.historic ?? pr.amenity ?? pr.leisure ?? pr.man_made ?? (pr.bridge ? 'bridge' : undefined) ?? pr.place ?? pr.railway ?? pr.building
  const cs: number[][] = []
  const walk = (c: unknown): void => { if (typeof (c as number[])[0] === 'number') cs.push(c as number[]); else for (const k of c as unknown[]) walk(k) }
  walk(f.geometry.coordinates)
  const pts = cs.map(([lon, lat]) => proj.toLocal({ lat, lon }))
  const c = { x: pts.reduce((a, q) => a + q.x, 0) / pts.length, z: pts.reduce((a, q) => a + q.z, 0) / pts.length }
  const r = Math.max(0, ...pts.map((q) => Math.hypot(q.x - c.x, q.z - c.z)))
  const old = pois.get(name)
  if (!old || r > old.r) pois.set(name, { name, kind: String(kind), p: c, r })
}
// the landmark notes (public/landmarks/<city>-info.json), placed where the OSM feature of that name is
const notes: Record<string, { text: string }> = (() => { try { return JSON.parse(readFileSync(resolve(import.meta.dirname, '..', `public/landmarks/${city === 'san-francisco' ? 'sf' : 'paris'}-info.json`), 'utf8')) } catch { return {} } })()
const notePlaces = Object.keys(notes).map((k) => ({ name: k, p: pois.get(k)?.p })).filter((n): n is { name: string; p: P } => !!n.p)
const sights = sightsFor(city).map((s) => ({ name: s.name, p: proj.toLocal(s) }))
const known = [...toursFor(city).flatMap((t) => t.stops.filter((s) => s.text)).map((s) => proj.toLocal(s)), ...sights.map((s) => s.p), ...notePlaces.map((n) => n.p)]
/** game/tour.ts Sights and game.ts SIGHT_GAP/SIGHT_CLEAR, for the schedule */
const NEAR_SIGHT = 130, NEAR_NOTE = 190, SAME = 160, GAP = 250, CLEAR = 250
/** how far back along the route from the nearest point a candidate's roadside point is put, so its card comes up on the approach */
const LEAD = 60
const schedule = process.argv.includes('--schedule')

for (const t of toursFor(city).filter((t) => !arg('tour') || t.id === arg('tour'))) {
  const line: P[] = []
  const stopAt: number[] = []
  const pts = t.stops.map((s) => proj.toLocal(s))
  for (let i = 1; i < pts.length; i++) {
    const s0 = nearestOnGraph(g, pts[i - 1], isTunnel)!
    const r = planRoute(g, { edgeId: s0.edgeId, s: s0.s, reversed: false }, pts[i], nearestOnGraph(g, pts[i], isTunnel), tourEdgeCost)
    if (r) line.push(...r.line)
    stopAt.push(line.length - 1)
  }
  const cum = [0]
  for (let k = 1; k < line.length; k++) cum.push(cum[k - 1] + Math.hypot(line[k].x - line[k - 1].x, line[k].z - line[k - 1].z))
  const total = cum[cum.length - 1]
  if (process.argv.includes('--trace')) {
    // the route itself every 500 m, for placing sights the OSM tags miss
    for (let s = 0, k = 0; s < total; s += 500) {
      while (cum[k + 1] < s) k++
      const ll = proj.toLatLon(line[k])
      console.log(`${(s / 1000).toFixed(1)} ${ll.lat.toFixed(5)},${ll.lon.toFixed(5)}`)
    }
    continue
  }
  if (schedule) {
    // ride it in 10 m steps through the same rules as the game: every card, stop or sight, by km
    const own = pts.filter((_, i) => t.stops[i].text)
    const places = [...toursFor(city).flatMap((u) => u.stops.filter((s) => s.text && s.name).map((s) => ({ name: s.name!, p: proj.toLocal(s), near: NEAR_SIGHT }))),
      ...sights.map((s) => ({ ...s, near: NEAR_SIGHT })), ...notePlaces.filter((n) => !sights.some((q) => sameThing({ name: q.name, ...q.p }, { name: n.name, ...n.p })) && !toursFor(city).some((u) => u.stops.some((s) => s.name && s.text && sameThing({ name: s.name, ...proj.toLocal(s) }, { name: n.name, ...n.p })))).map((n) => ({ ...n, near: NEAR_NOTE }))]
    const shown = new Set<string>()
    const cards: string[] = []
    let last = -Infinity, k = 0, si = 0
    for (let s = 0; s < total; s += 10) {
      while (cum[k + 1] < s) k++
      const at = line[k]
      const nextStop = stopAt.findIndex((j) => j >= k)
      if (nextStop >= 0 && t.stops[nextStop + 1]?.text && cum[stopAt[nextStop]] - s < 140 && si <= nextStop) {
        si = nextStop + 1; last = s; cards.push(`${(s / 1000).toFixed(1)} STOP ${t.stops[nextStop + 1].name}`)
      }
      const toNext = nextStop >= 0 ? cum[stopAt[nextStop]] - s : Infinity
      for (const p of places) {
        const d = Math.hypot(p.p.x - at.x, p.p.z - at.z)
        if (d >= p.near || shown.has(p.name)) continue
        if (own.some((q) => Math.hypot(q.x - p.p.x, q.z - p.p.z) < SAME)) { shown.add(p.name); continue }
        if (toNext > CLEAR && s - last > GAP) { shown.add(p.name); last = s; cards.push(`${(s / 1000).toFixed(1)}   ${p.name}`) }
      }
    }
    const gaps = cards.map((c, i) => i ? Number(c.split(' ')[0]) - Number(cards[i - 1].split(' ')[0]) : Number(c.split(' ')[0]))
    console.log(`\n## ${t.id} (${(total / 1000).toFixed(1)} km): ${cards.length} cards, longest gap ${Math.max(...gaps, total / 1000 - Number(cards.at(-1)?.split(' ')[0] ?? 0)).toFixed(1)} km`)
    if (!process.argv.includes('--brief')) for (const c of cards) console.log(c)
    continue
  }
  const hits: { s: number; d: number; q: Poi; road: P }[] = []
  for (const q of pois.values()) {
    // (a big feature — a park, a palace — counts from its edge, roughly)
    const reach = NEAR + Math.min(q.r, 150)
    let best = Infinity, at = 0, bk = 0
    for (let k = 0; k < line.length; k++) {
      const d = Math.hypot(line[k].x - q.p.x, line[k].z - q.p.z)
      if (d < best) { best = d; at = cum[k]; bk = k }
    }
    let j = bk
    while (j > 0 && cum[bk] - cum[j] < LEAD) j--
    if (best < reach) hits.push({ s: at, d: best, q, road: line[j] })
  }
  hits.sort((a, b) => a.s - b.s)
  console.log(`\n## ${t.id} (${(total / 1000).toFixed(1)} km)`)
  for (const h of hits) {
    const k = known.some((p) => Math.hypot(p.x - h.q.p.x, p.z - h.q.p.z) < SAME) || notes[h.q.name] ? '*' : ' '
    const ll = proj.toLatLon(h.road)
    console.log(`${k}${(h.s / 1000).toFixed(2)} ${h.q.name} [${h.q.kind}] d${Math.round(h.d)} road ${ll.lat.toFixed(5)},${ll.lon.toFixed(5)}`)
  }
}
