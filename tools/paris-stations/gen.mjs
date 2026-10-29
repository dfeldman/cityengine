/*
 * Generates src/render/landmarks/paris/stations/data.ts: every station's OSM footprints and platforms in its manifest
 * entry's own frame (by the stations agent, 2026-10-29). Inputs beside this file: stations.json (the entries' frames), and
 * bld.geojson / rail.geojson, the station buildings and the rails round them cut from the local extract with osmium —
 *   osmium extract -b 2.218,48.820,2.410,48.898 tools/cache/osm/ile-de-france-latest.osm.pbf -o box.pbf
 *   osmium tags-filter box.pbf w/building w/railway -o st.pbf && osmium export st.pbf -o bld.geojson (and the rails)
 * then: node tools/paris-stations/gen.mjs
 */
// Offline: the stations' sheds and platforms from the OSM extract, in each shed entry's own frame.
// node gen.mjs  → writes stations/data.ts and preview.json (the front fits, for the showcase)
import fs from 'node:fs'
const g = JSON.parse(fs.readFileSync(new URL('./bld.geojson', import.meta.url), 'utf8'))
const O = { lat: 48.8605, lon: 2.332 }
const R = 6378137
const kx = (Math.PI / 180) * R * Math.cos((O.lat * Math.PI) / 180)
const kz = (Math.PI / 180) * R
const toL = ([lon, lat]) => ({ x: (lon - O.lon) * kx, z: (lat - O.lat) * kz })
const toLL = (p) => ({ lat: O.lat + p.z / kz, lon: O.lon + p.x / kx })
const byId = new Map()
for (const f of g.features) {
  const n = Number(f.id.slice(1))
  byId.set(n % 2 ? `r${(n - 1) / 2}` : `w${n / 2}`, f)
}
const area2 = (r) => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z } return a }
const ccw = (r) => (area2(r) < 0 ? r.slice().reverse() : r)
const outer = (id) => {
  const f = byId.get(id); if (!f) throw new Error('missing ' + id)
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  return polys.map((p) => ccw(p[0].slice(0, -1).map(toL)))
}
// render/landmarks.ts fitAt / fitSnug, exactly
function fitAt(ring, bearing) {
  const b = (bearing * Math.PI) / 180, rotation = b + Math.PI
  const rx = Math.cos(rotation), rz = -Math.sin(rotation), fx = Math.sin(rotation), fz = Math.cos(rotation)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) { const u = p.x * rx + p.z * rz, v = p.x * fx + p.z * fz; x0 = Math.min(x0, u); x1 = Math.max(x1, u); z0 = Math.min(z0, v); z1 = Math.max(z1, v) }
  const cu = (x0 + x1) / 2, cv = (z0 + z1) / 2
  return { cx: cu * rx + cv * fx, cz: cu * rz + cv * fz, rotation, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2 }
}
function fitSnug(ring, bearing) {
  const given = fitAt(ring, bearing); let best = given, worst = given.hx * given.hz
  for (let d = -40; d <= 40; d += 0.5) { const f = fitAt(ring, bearing + d); worst = Math.max(worst, f.hx * f.hz); if (f.hx * f.hz < best.hx * best.hz - 1e-6) best = f }
  return worst < best.hx * best.hz * 1.04 ? given : best
}
const inFrame = (ring, cx, cz, rot) => { const c = Math.cos(rot), s = Math.sin(rot); return ring.map((p) => ({ x: (p.x - cx) * c - (p.z - cz) * s, z: (p.x - cx) * s + (p.z - cz) * c })) }
// Sutherland–Hodgman against an axis-aligned box
function clip(ring, x0, x1, z0, z1) {
  let r = ring
  const edges = [[(p) => p.x >= x0, (a, b) => ({ x: x0, z: a.z + ((x0 - a.x) * (b.z - a.z)) / (b.x - a.x) })],
    [(p) => p.x <= x1, (a, b) => ({ x: x1, z: a.z + ((x1 - a.x) * (b.z - a.z)) / (b.x - a.x) })],
    [(p) => p.z >= z0, (a, b) => ({ x: a.x + ((z0 - a.z) * (b.x - a.x)) / (b.z - a.z), z: z0 })],
    [(p) => p.z <= z1, (a, b) => ({ x: a.x + ((z1 - a.z) * (b.x - a.x)) / (b.z - a.z), z: z1 })]]
  for (const [inside, cut] of edges) {
    const o = []
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length]
      if (inside(b)) { if (!inside(a)) o.push(cut(a, b)); o.push(b) } else if (inside(a)) o.push(cut(a, b))
    }
    r = o
    if (r.length < 3) return []
  }
  return r
}
// drop near-collinear and near-duplicate points (platform outlines carry hundreds): Douglas–Peucker on the closed
// ring, split at its first point and the point farthest from it (a greedy pass let a long gentle curve drift into a
// chord, and a platform's edge crossed its track by 2 m)
function rdp(pts, tol) {
  if (pts.length < 3) return pts
  const a = pts[0], b = pts[pts.length - 1]
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  let far = 0, at = -1
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]
    const d = L < 1e-9 ? Math.hypot(p.x - a.x, p.z - a.z) : Math.abs((b.x - a.x) * (a.z - p.z) - (a.x - p.x) * (b.z - a.z)) / L
    if (d > far) { far = d; at = i }
  }
  if (far <= tol) return [a, b]
  return [...rdp(pts.slice(0, at + 1), tol).slice(0, -1), ...rdp(pts.slice(at), tol)]
}
function thin(r, tol = 0.15) {
  if (r.length < 4) return r
  let k = 0, far = 0
  for (let i = 1; i < r.length; i++) { const d = Math.hypot(r[i].x - r[0].x, r[i].z - r[0].z); if (d > far) { far = d; k = i } }
  const one = rdp(r.slice(0, k + 1), tol), two = rdp([...r.slice(k), r[0]], tol)
  return [...one.slice(0, -1), ...two.slice(0, -1)]
}
const isPlatform = (p) => p.railway === 'platform' && p.location !== 'underground' && !(p.level && p.level.split(';').every((v) => parseFloat(v) < 0)) && !(parseFloat(p.layer ?? '0') < 0)
const round = (r) => r.map((p) => [Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10])

const railFeatures = JSON.parse(fs.readFileSync(new URL('./rail.geojson', import.meta.url), 'utf8')).features
  .filter((f) => f.properties.railway === 'rail' && f.geometry.type === 'LineString')
const surface = (f) => !f.properties.tunnel && !(parseFloat(f.properties.layer ?? '0') < 0)
let rails = railFeatures.filter(surface).map((f) => f.geometry.coordinates.map(toL))
// (Montparnasse's tracks under the Jardin Atlantique are mapped as a tunnel: its platforms come from those)
const allRails = railFeatures.map((f) => f.geometry.coordinates.map(toL))
const surfaceRails = rails
/*
 * Platforms from the TRACKS: most termini map their platforms under the shed as nothing at all (the Gare du Nord has
 * one polygon for thirty platforms), but every track is mapped. Across the shed at every few metres, the gaps between
 * neighbouring tracks wide enough for a platform (a track pair is 4–5 m apart; a platform between two tracks makes it
 * 8–16) hold one, 1.65 m clear of each track's centre; slices whose intervals overlap are one platform.
 */
function platformsFromRails(cx, cz, rot, x0, x1, z0, z1, o = {}) {
  const lines = rails.map((l) => inFrame(l, cx, cz, rot))
  const step = o.step ?? 4
  const slices = []
  for (let z = z0; z <= z1; z += step) {
    const xs = []
    for (const l of lines) for (let i = 0; i < l.length - 1; i++) {
      const a = l[i], b = l[i + 1]
      if ((a.z - z) * (b.z - z) > 0 || a.z === b.z) continue
      const x = a.x + ((z - a.z) * (b.x - a.x)) / (b.z - a.z)
      if (x >= x0 - 3 && x <= x1 + 3) xs.push(x)
    }
    xs.sort((p, q) => p - q)
    const iv = []
    for (let i = 0; i < xs.length - 1; i++) {
      const g = xs[i + 1] - xs[i]
      if (g >= (o.min ?? 7) && g <= (o.max ?? 17)) iv.push([xs[i] + 1.65, xs[i + 1] - 1.65])
    }
    slices.push({ z, iv })
  }
  // chain the intervals slice to slice
  const open = []
  const done = []
  for (const { z, iv } of slices) {
    const used = new Set()
    for (const p of open.splice(0)) {
      const last = p.pts[p.pts.length - 1]
      const k = iv.findIndex((v, j) => !used.has(j) && v[0] < last.b && v[1] > last.a)
      if (k >= 0) { used.add(k); p.pts.push({ z, a: iv[k][0], b: iv[k][1] }); open.push(p) } else done.push(p)
    }
    iv.forEach((v, j) => { if (!used.has(j)) open.push({ pts: [{ z, a: v[0], b: v[1] }] }) })
  }
  done.push(...open)
  return done.filter((p) => p.pts.length >= 3).map((p) => {
    // smoothed edges (a switch's diverging leg makes one slice jump), as a ring: down the left side, back up the right
    const P = p.pts
    const left = P.map((q) => ({ x: q.a, z: q.z })), right = P.map((q) => ({ x: q.b, z: q.z })).reverse()
    return ccw([...left, ...right])
  })
}
const STATIONS = JSON.parse(fs.readFileSync(new URL('./stations.json', import.meta.url), 'utf8'))
const preview = {}
let ts = `/**
 * GENERATED from the OSM extract (tools/cache/osm/ile-de-france-latest.osm.pbf, 2026-10-29) — the termini's footprints
 * and platforms, each in its manifest entry's own frame (public/landmarks/paris/stations.json): the entry's lat/lon is
 * the frame's origin and its \`front\` the bearing local −z faces (the city's projection, origin 48.8605, 2.332,
 * R = 6378137). Metres, [x, z] pairs, anticlockwise. Checked against the paris-centre package of 2026-10-29: every
 * claimed outline lands within 0.1 m, and no rail runs inside any platform.
 *
 * How it was made (the generator is a one-off script, not in tools/):
 *   osmium extract -b 2.31,48.83,2.39,48.886 --strategy complete_ways <pbf> -o box.pbf
 *   osmium tags-filter box.pbf w/building w/building:part w/railway=platform w/public_transport a/building -o bld.pbf
 *   osmium tags-filter box.pbf w/railway=rail,platform -o rail.pbf; osmium export … -f geojson --add-unique-id=type_id
 * Per station: the frame is the box round the named ways, turned to the given bearing (Nord's shed takes the snug turn
 * render/landmarks.ts fitSnug gives its front, 197.5°, so the two entries agree); rings are thinned by Douglas–Peucker
 * (5 cm for outlines, 15 cm for platforms). PLATFORMS come from the TRACKS, because most termini map none under their
 * sheds: across the frame every 4 m, each gap of 7–17 m between neighbouring surface tracks (not tunnel, not layer < 0;
 * Montparnasse's, mapped as a tunnel under its deck, included) holds a platform 1.65 m clear of each track's centre,
 * and overlapping intervals slice to slice chain into one outline — clipped to the frame and a throat margin.
 */
export interface ShedData {
  /** the shed's OSM outline(s) */
  sheds: [number, number][][]
  /** the platforms under and just beyond it, clipped to the shed's box and the throat margin */
  platforms: [number, number][][]
  /** the frame: half-sizes of the box round the sheds */
  hx: number
  hz: number
}

`
const manifest = []
const partsPlot = {}
for (const s of STATIONS) {
  // the front: fitted as the city fits it (the first id, snug to its bearing)
  if (s.front) {
    const ring = outer(s.front.ids[0])[0]
    const f = fitSnug(ring, s.front.bearing)
    const local = inFrame(ring, f.cx, f.cz, f.rotation)
    preview[s.front.builder] = { hx: f.hx, hz: f.hz, height: s.front.height, ring: local, cx: f.cx, cz: f.cz, rotation: f.rotation, bearing: (f.rotation * 180) / Math.PI - 180 }
    console.log(s.key, 'front fit', f.hx.toFixed(1), f.hz.toFixed(1), 'bearing', ((f.rotation * 180) / Math.PI - 180).toFixed(1))
  }
  if (!s.shed) continue
  const shedRings = s.shed.ids.flatMap(outer)
  // the shed frame: turned like the front (so the two agree), centred on the sheds' box in that frame — or on
  // the box round every part named in \`frame\`, for a station drawn as one model
  const bearing = s.frame?.bearing ?? s.shed.bearing ?? (s.front ? preview[s.front.builder].bearing : 0)
  const rot = ((bearing + 180) * Math.PI) / 180
  const all = s.frame ? s.frame.ids.flatMap(outer).flat() : shedRings.flat()
  const tmp = inFrame(all, 0, 0, rot)
  const xs = tmp.map((p) => p.x), zs = tmp.map((p) => p.z)
  const mu = (Math.max(...xs) + Math.min(...xs)) / 2, mv = (Math.max(...zs) + Math.min(...zs)) / 2
  // back to world: the box centre
  const c = Math.cos(rot), sn = Math.sin(rot)
  const cx = mu * c + mv * sn, cz = -mu * sn + mv * c
  const sheds = shedRings.map((r) => inFrame(r, cx, cz, rot))
  const hx = (Math.max(...xs) - Math.min(...xs)) / 2, hz = (Math.max(...zs) - Math.min(...zs)) / 2
  // platforms: every surface platform polygon near the shed, clipped to its box and the margin past its throat (+z)
  rails = s.shed.tunnels ? allRails : surfaceRails
  const plats = s.shed.fromRails ? platformsFromRails(cx, cz, rot, -hx, hx, -hz - (s.shed.head ?? 0), hz + (s.shed.throat ?? 40), s.shed.fromRails).map((r) => thin(r)) : []
  for (const f of s.shed.fromRails ? [] : g.features) {
    const p = f.properties
    if (!isPlatform(p) || !f.geometry.type.endsWith('Polygon')) continue
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    for (const poly of polys) {
      const r = inFrame(ccw(poly[0].slice(0, -1).map(toL)), cx, cz, rot)
      const cl = clip(r, -hx - (s.shed.side ?? 2), hx + (s.shed.side ?? 2), -hz - (s.shed.head ?? 0), hz + (s.shed.throat ?? 40))
      if (cl.length >= 3 && Math.abs(area2(cl)) / 2 > 15) plats.push(thin(ccw(cl)))
    }
  }
  const ll = toLL({ x: cx, z: cz })
  console.log(s.key, 'shed', 'lat', ll.lat.toFixed(7), 'lon', ll.lon.toFixed(7), 'front', bearing.toFixed(2), 'size', (2 * hx).toFixed(1), (2 * hz).toFixed(1), 'platforms', plats.length,
    'pts', plats.reduce((a, r) => a + r.length, 0))
  manifest.push({ key: s.key, lat: +ll.lat.toFixed(7), lon: +ll.lon.toFixed(7), front: +bearing.toFixed(2), size: [Math.ceil(2 * hx), Math.ceil(2 * hz)] })
  if (s.parts) {
    const tagsOf = (id) => byId.get(id).properties
    const parts = Object.fromEntries(Object.entries(s.parts).map(([name, ids]) => [name, ids.map((id) => {
      const t = tagsOf(id)
      return { id, ring: round(thin(inFrame(outer(id)[0], cx, cz, rot), 0.05)), h: parseFloat(t.height ?? '0') || undefined, min: parseFloat(t.min_height ?? '0') || undefined }
    })]))
    ts += `export const ${s.key.toUpperCase()}_PARTS: Record<string, { id: string; ring: [number, number][]; h?: number; min?: number }[]> = ${JSON.stringify(parts)}\n\n`
    partsPlot[s.key] = parts
  }
  ts += `export const ${s.key.toUpperCase()}_SHED: ShedData = {\n  sheds: ${JSON.stringify(sheds.map((r) => round(thin(r, 0.05))))},\n  platforms: ${JSON.stringify(plats.map(round))},\n  hx: ${hx.toFixed(1)},\n  hz: ${hz.toFixed(1)},\n}\n\n`
  // where the front sits in the shed's frame, for a combined preview
  if (s.front) {
    const pf = preview[s.front.builder]
    preview[s.front.builder].inShed = inFrame([{ x: pf.cx, z: pf.cz }], cx, cz, rot)[0]
    preview[s.key + 'Shed'] = { hx, hz, height: 30, cx, cz, rotation: rot }
  }
}
fs.writeFileSync('/Users/dfeldman/cityengine/src/render/landmarks/paris/stations/data.ts', ts)
fs.writeFileSync(new URL('./preview.json', import.meta.url), JSON.stringify(preview))
fs.writeFileSync(new URL('./manifest-frames.json', import.meta.url), JSON.stringify(manifest, null, 1))
// a check picture of each shed frame: sheds, platforms, tracks (−z, the front, at the BOTTOM)
import sharp from '/Users/dfeldman/cityengine/node_modules/sharp/dist/index.mjs'
for (const m of manifest) {
  const src = fs.readFileSync('/Users/dfeldman/cityengine/src/render/landmarks/paris/stations/data.ts', 'utf8')
  const block = src.split(`export const ${m.key.toUpperCase()}_SHED: ShedData = {`)[1].split('\n}\n')[0]
  const sheds = JSON.parse(block.match(/sheds: (.*),\n/)[1]), plats = JSON.parse(block.match(/platforms: (.*),\n/)[1])
  const W = Math.max(m.size[0], m.size[1] + 100) / 2 + 20, S = 1000 / (2 * W)
  const X = (x) => (x + W) * S, Y = (z) => (W - z) * S
  const cx = (m.lon - O.lon) * kx, cz = (m.lat - O.lat) * kz, rot = ((m.front + 180) * Math.PI) / 180
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000"><rect width="1000" height="1000" fill="white"/>`
  for (const [nm, ps] of Object.entries(partsPlot[m.key] ?? {})) for (const p of ps) { svg += `<path d="M${p.ring.map(([x, z]) => X(x) + ',' + Y(z)).join('L')}Z" fill="none" stroke="#090" stroke-width="1.5"/>`
    const c = p.ring.reduce((a, [x, z]) => [a[0] + x / p.ring.length, a[1] + z / p.ring.length], [0, 0]); svg += `<text x="${X(c[0])}" y="${Y(c[1])}" font-size="11">${nm} ${p.id} h${p.h ?? ''}</text>` }
  for (let v = -400; v <= 400; v += 50) svg += `<line x1="${X(v)}" y1="0" x2="${X(v)}" y2="1000" stroke="#eee"/><line x1="0" y1="${Y(v)}" x2="1000" y2="${Y(v)}" stroke="#eee"/>`
  for (const r of sheds) svg += `<path d="M${r.map(([x, z]) => X(x) + ',' + Y(z)).join('L')}Z" fill="#fdd" stroke="#c00"/>`
  for (const r of plats) svg += `<path d="M${r.map(([x, z]) => X(x) + ',' + Y(z)).join('L')}Z" fill="#9cf" stroke="#36c" stroke-width="0.5"/>`
  for (const l of rails) { const q = inFrame(l, cx, cz, rot); if (!q.some((p) => Math.abs(p.x) < W && Math.abs(p.z) < W)) continue
    svg += `<path d="M${q.map((p) => X(p.x).toFixed(1) + ',' + Y(p.z).toFixed(1)).join('L')}" fill="none" stroke="#333" stroke-width="0.6"/>` }
  await sharp(Buffer.from(svg + '</svg>')).png().toFile(new URL(`./frame-${m.key}.png`, import.meta.url).pathname)
}
