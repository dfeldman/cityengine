/**
 * devmaps inspector: renders ANY bake object as a tree of every field, with decoders layered on the keys it knows
 * (dictionary indices, flag bits, centimetres, colours, refs → OSM). Unknown keys are still shown, raw.
 */
import { SF, RF, IT, ITEM_STRIDE } from '../map/format.ts'
import type { CityData } from './data.ts'

const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
export const fmt = (v: number, d = 2): string => (Number.isFinite(v) ? v.toFixed(d) : String(v))
const bits = (f: number, table: Record<string, number>): string => Object.entries(table).filter(([, b]) => f & b).map(([k]) => k).join('|') || '0'
const swatch = (c: number): string => `<i style="display:inline-block;width:10px;height:10px;background:#${c.toString(16).padStart(6, '0')}"></i> #${c.toString(16).padStart(6, '0')}`

export const osm = (type: string, id: number | string): string => `<a href="https://www.openstreetmap.org/${type}/${id}" target="_blank">${type}/${id}</a>`

/** OSM links for a bake ref (MAP-FORMAT §9): b<way>, s<nodeA>-<nodeB>, n<node>, x:authored */
export function refLinks(ref: string): string {
  let m = /^b(\d+)$/.exec(ref)
  if (m) return `${osm('way', m[1])} <span class="muted">or</span> ${osm('relation', m[1])}`
  m = /^s(-?\d+)-(-?\d+)/.exec(ref)
  if (m) return [m[1], m[2]].map((n) => (Number(n) > 0 ? osm('node', n) : `junction ${n}`)).join(' → ')
  m = /^[nt](\d+)$/.exec(ref)
  if (m) return osm('node', m[1])
  return ''
}

export interface Ctx { data: CityData; /** what the object is: picks dictionaries and flag tables */ what: string }

/** decorate one key's value; '' when there is nothing to add to the raw value */
function decode(k: string, v: unknown, c: Ctx): string {
  const d = c.data.meta.dict
  if (typeof v === 'number') {
    if (k === 'kind' && (c.what === 'way' || c.what === 'rail')) return d.kinds[v] ?? '?'
    if (k === 'name' && Number.isInteger(v)) return esc(d.names[v] ?? '?')
    if (k === 'style') return d.styles[v] ?? '?'
    if (k === 'archetype') return d.archetypes[v] ?? '?'
    if (k === 'flags' && c.what === 'way') return bits(v, SF)
    if (k === 'flags' && c.what === 'rail') return bits(v, RF)
    if (k === 'z' && (c.what === 'building' || c.what === 'part' || c.what === 'deck' || c.what === 'place' || c.what === 'area')) return `v2 ${fmt(c.data.v2(v))} m`
    if (k === 'level') return `v2 ${fmt(c.data.v2(v))} m`
    if (['h', 'minH', 'width', 'walk', 'len', 'wid'].includes(k) && c.what !== 'ride') return `${fmt(v / 100)} m`
    if (k === 'colour' || k === 'accent' || k === 'colour2') return v >= 0 ? swatch(v) : ''
    if (k === 'dir') return `${fmt(v / 100, 1)}°`
    if (k === 'heading') return `${fmt((v * 180) / Math.PI, 1)}°`
    if ((k === 'id' || k === 'seed') && v > 1000 && c.what !== 'ride' && c.what !== 'way') return osm('way', v)
  }
  if (typeof v === 'string' && k === 'ref') return refLinks(v)
  return ''
}

/** every field, recursively; long number arrays are folded */
export function tree(o: unknown, c: Ctx, depth = 0): string {
  if (o === null || typeof o !== 'object') return `<span class="v">${esc(JSON.stringify(o))}</span>`
  if (Array.isArray(o)) {
    if (o.length > 12 && o.every((x) => typeof x !== 'object')) return `<details><summary>[${o.length}]</summary><span class="v">${esc(JSON.stringify(o))}</span></details>`
    if (o.length > 30) return `<details><summary>[${o.length} objects]</summary>${o.slice(0, 300).map((x, i) => `<div class="kv"><span class="k">${i}</span>: ${tree(x, c, depth + 1)}</div>`).join('')}</details>`
    if (o.every((x) => typeof x !== 'object')) return `<span class="v">${esc(JSON.stringify(o))}</span>`
  }
  const rows = Object.entries(o as Record<string, unknown>).map(([k, v]) => {
    const sub = Array.isArray(o) ? c.what : ({ parts: 'part', roof: 'roof', props: 'props' } as Record<string, string>)[k] ?? c.what
    const dec = decode(k, v, c)
    return `<div class="kv"><span class="k">${esc(k)}</span>: ${tree(v, { ...c, what: sub }, depth + 1)}${dec ? ` <span class="dec">${dec}</span>` : ''}</div>`
  })
  return rows.join('')
}

/** the extra tables a raw tile object earns: a way's nodes with heights and levels, an item's decoded row */
export function wayTable(tile: Record<string, unknown>, way: { nodes: number[]; z?: number[] }, c: Ctx, levels?: { d: (number | null)[]; lv: number[] }): string {
  const N = tile.nodes as number[], ids = (tile.nodeIds ?? {}) as Record<string, number>
  const T = c.data.meta.index.tile, ox = (tile.tx as number) * T, oy = (tile.ty as number) * T
  const lvName = ['grade', 'raised', 'buried', 'bridge', 'tunnel', 'trench', '?']
  const rows = way.nodes.map((n, j) => {
    const x = ox + N[3 * n] / 100, z = oy + N[3 * n + 1] / 100, ll = c.data.proj.toLatLon({ x, z })
    const own = c.data.v2(N[3 * n + 2]), wz = way.z ? c.data.v2(way.z[j]) : null
    const d = levels?.d[j]
    return `<tr><td>${j}</td><td>${n}</td><td>${ids[n] ? osm('node', ids[n]) : ''}</td><td class="ll" data-ll="${ll.lat.toFixed(6)},${ll.lon.toFixed(6)}" title="click: copy lat,lon">${fmt(x, 1)},${fmt(z, 1)}</td>`
      + `<td>${fmt(own)}</td><td${wz != null ? ' class="warn"' : ''}>${wz != null ? fmt(wz) : ''}</td><td>${d == null ? '' : fmt(d)}</td><td>${j && levels ? lvName[levels.lv[j - 1]] : ''}</td></tr>`
  })
  return `<details open><summary>nodes (${way.nodes.length})${way.z ? ' <span class="warn">— this way overrides its nodes\' z</span>' : ''}</summary>`
    + `<table><tr><th>#</th><th>idx</th><th>osm</th><th>x,z</th><th>node z</th><th>way z</th><th>Δground</th><th>seg→</th></tr>${rows.join('')}</table></details>`
}

export function itemRow(tile: Record<string, unknown>, i: number, c: Ctx): Record<string, unknown> {
  const it = tile.items as { data: number[]; flags?: number[]; refs?: Record<number, string> }
  const D = it.data, o = i * ITEM_STRIDE, T = c.data.meta.index.tile
  return {
    index: i, type: c.data.meta.dict.items[D[o + IT.type]] ?? D[o + IT.type], typeIndex: D[o + IT.type],
    x: (tile.tx as number) * T + D[o + IT.x] / 100, z: (tile.ty as number) * T + D[o + IT.y] / 100,
    heightV2: c.data.v2(D[o + IT.z]), rot: D[o + IT.rot], size: D[o + IT.size], colour: D[o + IT.colour], colour2: D[o + IT.colour2],
    ...(it.flags ? { flags: it.flags[i], park: !!(it.flags[i] & 1) } : {}), ...(it.refs?.[i] ? { ref: it.refs[i] } : {}),
    raw: D.slice(o, o + ITEM_STRIDE),
  }
}

/** px size of the inline elevation profiles */
const PROFILE_W = 360, PROFILE_H = 110
/** the profile's steepest grade is measured over at least this run (m) */
const PROFILE_SLOPE_M = 5
/**
 * An elevation profile as inline SVG: distance along (m) against height (v2 m). Each series is drawn as a line (NaN = gap);
 * the first is the subject (the way, the route), the others its references (the ground). Also returns climb / descent.
 */
export function profileSvg(dist: number[], series: { v: number[]; col: string; label: string }[]): string {
  const all = series.flatMap((s) => s.v).filter(Number.isFinite)
  if (dist.length < 2 || !all.length) return ''
  let lo = Math.min(...all), hi = Math.max(...all)
  if (hi - lo < 2) { const m = (hi + lo) / 2; lo = m - 1; hi = m + 1 }
  const L = dist[dist.length - 1] || 1, pl = 34, pb = 14
  const X = (d: number): number => pl + (d / L) * (PROFILE_W - pl - 4), Y = (v: number): number => 4 + (1 - (v - lo) / (hi - lo)) * (PROFILE_H - pb - 6)
  const lines = series.map((s) => {
    let d = '', pen = false
    s.v.forEach((v, i) => { if (!Number.isFinite(v)) { pen = false; return } d += `${pen ? 'L' : 'M'}${X(dist[i]).toFixed(1)},${Y(v).toFixed(1)}`; pen = true })
    return `<path d="${d}" fill="none" stroke="${s.col}" stroke-width="${s === series[0] ? 2 : 1.2}"${s === series[0] ? '' : ' stroke-dasharray="3,2"'}/>`
  }).join('')
  let up = 0, down = 0, steep = 0
  const v0 = series[0].v
  for (let i = 1; i < v0.length; i++) {
    const dv = v0[i] - v0[i - 1]
    if (!Number.isFinite(dv)) continue
    if (dv > 0) up += dv; else down -= dv
  }
  // steepest grade over at least PROFILE_SLOPE_M (two pointers, so dense samples and long segments both work)
  for (let i = 0, j = 0; i < v0.length; i++) {
    while (j < v0.length && dist[j] - dist[i] < PROFILE_SLOPE_M) j++
    if (j >= v0.length) break
    const g = Math.abs(v0[j] - v0[i]) / (dist[j] - dist[i]); if (Number.isFinite(g)) steep = Math.max(steep, g)
  }
  const ax = `<text x="2" y="10" fill="#aaa" font-size="9">${hi.toFixed(1)}</text><text x="2" y="${PROFILE_H - pb}" fill="#aaa" font-size="9">${lo.toFixed(1)}</text><text x="${PROFILE_W - 40}" y="${PROFILE_H - 2}" fill="#aaa" font-size="9">${L.toFixed(0)} m</text>`
  const legend = series.map((s) => `<span style="color:${s.col}">— ${s.label}</span>`).join(' ')
  return `<div><svg width="${PROFILE_W}" height="${PROFILE_H}" style="background:#111;display:block">${ax}${lines}</svg>`
    + `<div class="muted">${legend} · ↑${up.toFixed(1)} m ↓${down.toFixed(1)} m · steepest ${(steep * 100).toFixed(0)}% over ${PROFILE_SLOPE_M} m</div></div>`
}
/** cumulative distance along a flat [x,z,…] polyline */
export const along = (p: number[]): number[] => { const d = [0]; for (let i = 2; i < p.length; i += 2) d.push(d[d.length - 1] + Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1])); return d }
