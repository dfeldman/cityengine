/**
 * FLAGS (owner, 2026-10-03: "SF is festooned with many flags … not just US but city, county, state, other countries";
 * "flags will be important when we add other cities, to remind the rider where they are"). OSM's flagpoles, sorted
 * into designs by tools/flags.ts (public/flags/<city>.json), drawn here: a pole, a ball on top, and the flag flying
 * from it on the prevailing west wind, a little wave in the cloth. The designs are drawn on a canvas — national and
 * civic flags are public-domain designs, so nothing is fetched — once, into one atlas: the Stars and Stripes, the
 * California bear flag, San Francisco's phoenix, the rainbow, and the countries OSM names.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { MeshBuilder } from './buildings.ts'
import { prism } from './models.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import type { TileLayer } from './city.ts'
import type { Terrain } from '../city/terrain.ts'

export interface FlagPole {
  lat: number; lon: number; flag: string; pole: number; roof?: number; osm?: number
  /** more flags down the same pole, under the first (Pier 39's poles carry two) */
  more?: string[]
  /** long ribbon streamers flying from the pole: their colours, top down (`streamer_<colour>` cells) */
  streamers?: string[]
  /** a black pole, not a white one */
  black?: boolean
}

const KINDS = ['us', 'california', 'sanfrancisco', 'pride', 'taiwan', 'china', 'france', 'germany', 'italy', 'ireland',
  'japan', 'korea', 'uk', 'ukraine', 'un', 'india', 'uae', 'philippines', 'mexico', 'canada', 'banner', 'banner2', 'banner3', 'banner4',
  // (appended: Pier 39's own flag, and the plain colours its streamers are cut from)
  'pier39', 'streamer_orange', 'streamer_yellow', 'streamer_green', 'streamer_red', 'streamer_sky']
const COLS = 6
const ROWS = 5
const W = 240
const H = 150

type Ctx = CanvasRenderingContext2D
const stripes = (c: Ctx, x: number, y: number, colours: string[], vertical: boolean): void => {
  colours.forEach((col, i) => {
    c.fillStyle = col
    if (vertical) c.fillRect(x + (i * W) / colours.length, y, W / colours.length + 1, H)
    else c.fillRect(x, y + (i * H) / colours.length, W, H / colours.length + 1)
  })
}
const star = (c: Ctx, cx: number, cy: number, r: number, col: string): void => {
  c.fillStyle = col
  c.beginPath()
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5
    const rr = k % 2 === 0 ? r : r * 0.42
    c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
  }
  c.closePath()
  c.fill()
}

function draw(c: Ctx, kind: string, x: number, y: number): void {
  c.save()
  c.beginPath(); c.rect(x, y, W, H); c.clip()
  switch (kind) {
    case 'us': {
      for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#b22234'; c.fillRect(x, y + (i * H) / 13, W, H / 13 + 1) }
      c.fillStyle = '#3c3b6e'; c.fillRect(x, y, W * 0.4, (H * 7) / 13)
      c.fillStyle = '#ffffff'
      for (let r = 0; r < 9; r++) for (let k = 0; k < (r % 2 ? 5 : 6); k++) {
        c.beginPath(); c.arc(x + 8 + k * 15.5 + (r % 2 ? 7.7 : 0), y + 6 + r * 8.6, 2.2, 0, Math.PI * 2); c.fill()
      }
      break
    }
    case 'california': {
      c.fillStyle = '#ffffff'; c.fillRect(x, y, W, H)
      c.fillStyle = '#b22234'; c.fillRect(x, y + H * 0.84, W, H * 0.16)
      star(c, x + 30, y + 26, 16, '#b22234')
      // the grizzly, walking left on a green plot
      c.fillStyle = '#6b8e23'; c.fillRect(x + 58, y + 98, 124, 8)
      c.fillStyle = '#5b3a1e'
      c.beginPath(); c.ellipse(x + 125, y + 72, 52, 24, 0, 0, Math.PI * 2); c.fill()
      c.beginPath(); c.ellipse(x + 70, y + 62, 16, 13, -0.3, 0, Math.PI * 2); c.fill()
      for (const lx of [88, 108, 145, 165]) c.fillRect(x + lx, y + 84, 9, 16)
      c.fillStyle = '#5b3a1e'; c.font = '700 13px Georgia, serif'; c.textAlign = 'center'
      c.fillText('CALIFORNIA REPUBLIC', x + W / 2, y + 122)
      break
    }
    case 'sanfrancisco': {
      c.fillStyle = '#ffffff'; c.fillRect(x, y, W, H)
      c.strokeStyle = '#c9a227'; c.lineWidth = 8; c.strokeRect(x + 4, y + 4, W - 8, H - 8)
      // the phoenix rising from flames: gold wings up, a red-gold body, flames under it
      c.fillStyle = '#c9a227'
      c.beginPath(); c.moveTo(x + 120, y + 70); c.lineTo(x + 70, y + 22); c.lineTo(x + 92, y + 70); c.fill()
      c.beginPath(); c.moveTo(x + 120, y + 70); c.lineTo(x + 170, y + 22); c.lineTo(x + 148, y + 70); c.fill()
      c.fillStyle = '#b5482a'; c.beginPath(); c.ellipse(x + 120, y + 72, 14, 20, 0, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#e07a1f'
      for (const fx of [100, 112, 124, 136]) { c.beginPath(); c.moveTo(fx + x, y + 108); c.lineTo(fx + x + 6, y + 88); c.lineTo(fx + x + 12, y + 108); c.fill() }
      c.fillStyle = '#c9a227'; c.fillRect(x + 50, y + 114, 140, 14)
      c.fillStyle = '#5a3d0e'; c.font = '700 9px Georgia, serif'; c.textAlign = 'center'; c.fillText('ORO EN PAZ · FIERRO EN GUERRA', x + 120, y + 124)
      break
    }
    case 'pride': stripes(c, x, y, ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'], false); break
    case 'taiwan': {
      c.fillStyle = '#fe0000'; c.fillRect(x, y, W, H)
      c.fillStyle = '#000095'; c.fillRect(x, y, W / 2, H / 2)
      star(c, x + W / 4, y + H / 4, 22, '#ffffff'); c.fillStyle = '#000095'; c.beginPath(); c.arc(x + W / 4, y + H / 4, 12, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + W / 4, y + H / 4, 9, 0, Math.PI * 2); c.fill()
      break
    }
    case 'china': {
      c.fillStyle = '#de2910'; c.fillRect(x, y, W, H)
      star(c, x + 40, y + 38, 22, '#ffde00')
      for (const [sx, sy] of [[80, 15], [94, 30], [94, 52], [80, 66]]) star(c, x + sx, y + sy, 7, '#ffde00')
      break
    }
    case 'france': stripes(c, x, y, ['#0055a4', '#ffffff', '#ef4135'], true); break
    case 'germany': stripes(c, x, y, ['#000000', '#dd0000', '#ffce00'], false); break
    case 'italy': stripes(c, x, y, ['#009246', '#ffffff', '#ce2b37'], true); break
    case 'ireland': stripes(c, x, y, ['#169b62', '#ffffff', '#ff883e'], true); break
    case 'ukraine': stripes(c, x, y, ['#0057b7', '#ffd700'], false); break
    case 'japan': c.fillStyle = '#ffffff'; c.fillRect(x, y, W, H); c.fillStyle = '#bc002d'; c.beginPath(); c.arc(x + W / 2, y + H / 2, H * 0.3, 0, Math.PI * 2); c.fill(); break
    case 'korea': {
      c.fillStyle = '#ffffff'; c.fillRect(x, y, W, H)
      c.fillStyle = '#cd2e3a'; c.beginPath(); c.arc(x + W / 2, y + H / 2, 34, Math.PI, 0); c.fill()
      c.fillStyle = '#0047a0'; c.beginPath(); c.arc(x + W / 2, y + H / 2, 34, 0, Math.PI); c.fill()
      c.fillStyle = '#000000'
      for (const [tx, ty] of [[40, 30], [200, 30], [40, 120], [200, 120]]) for (let k = 0; k < 3; k++) c.fillRect(x + tx - 14, y + ty - 10 + k * 8, 28, 5)
      break
    }
    case 'uk': {
      c.fillStyle = '#012169'; c.fillRect(x, y, W, H)
      c.strokeStyle = '#ffffff'; c.lineWidth = 26
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + W, y + H); c.moveTo(x + W, y); c.lineTo(x, y + H); c.stroke()
      c.strokeStyle = '#c8102e'; c.lineWidth = 9; c.stroke()
      c.fillStyle = '#ffffff'; c.fillRect(x, y + H / 2 - 22, W, 44); c.fillRect(x + W / 2 - 22, y, 44, H)
      c.fillStyle = '#c8102e'; c.fillRect(x, y + H / 2 - 13, W, 26); c.fillRect(x + W / 2 - 13, y, 26, H)
      break
    }
    case 'un': {
      c.fillStyle = '#5b92e5'; c.fillRect(x, y, W, H)
      c.strokeStyle = '#ffffff'; c.lineWidth = 3
      for (const r of [12, 24, 36]) { c.beginPath(); c.arc(x + W / 2, y + H / 2 - 6, r, 0, Math.PI * 2); c.stroke() }
      c.beginPath(); c.moveTo(x + W / 2 - 36, y + H / 2 - 6); c.lineTo(x + W / 2 + 36, y + H / 2 - 6); c.stroke()
      break
    }
    case 'india': {
      stripes(c, x, y, ['#ff9933', '#ffffff', '#138808'], false)
      c.strokeStyle = '#000080'; c.lineWidth = 3; c.beginPath(); c.arc(x + W / 2, y + H / 2, 18, 0, Math.PI * 2); c.stroke()
      break
    }
    case 'uae': stripes(c, x, y, ['#00732f', '#ffffff', '#000000'], false); c.fillStyle = '#ff0000'; c.fillRect(x, y, W * 0.25, H); break
    case 'philippines': {
      stripes(c, x, y, ['#0038a8', '#ce1126'], false)
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + H * 0.87, y + H / 2); c.lineTo(x, y + H); c.fill()
      c.fillStyle = '#fcd116'; c.beginPath(); c.arc(x + 40, y + H / 2, 14, 0, Math.PI * 2); c.fill()
      break
    }
    case 'mexico': stripes(c, x, y, ['#006847', '#ffffff', '#ce1126'], true); c.fillStyle = '#8b5a2b'; c.beginPath(); c.arc(x + W / 2, y + H / 2, 16, 0, Math.PI * 2); c.fill(); break
    case 'canada': {
      stripes(c, x, y, ['#d52b1e', '#ffffff', '#ffffff', '#d52b1e'], true)
      star(c, x + W / 2, y + H / 2, 34, '#d52b1e')
      break
    }
    case 'pier39': {
      // PIER 39's own (Commons "Flags of Pier 39 (TK)"): blue over white over blue, the name in black serif capitals
      stripes(c, x, y, ['#2f63b8', '#ffffff', '#ffffff', '#2f63b8'], false)
      c.fillStyle = '#ffffff'; c.fillRect(x, y + H * 0.27, W, H * 0.46)
      c.fillStyle = '#17181a'; c.font = `bold ${Math.round(H * 0.3)}px Georgia, 'Times New Roman', serif`
      c.textAlign = 'center'; c.textBaseline = 'middle'
      c.fillText('PIER 39', x + W / 2, y + H / 2 + 2)
      break
    }
    case 'streamer_orange': c.fillStyle = '#f26a2e'; c.fillRect(x, y, W, H); break
    case 'streamer_yellow': c.fillStyle = '#f5c518'; c.fillRect(x, y, W, H); break
    case 'streamer_green': c.fillStyle = '#2bb24c'; c.fillRect(x, y, W, H); break
    case 'streamer_red': c.fillStyle = '#e0242c'; c.fillRect(x, y, W, H); break
    case 'streamer_sky': c.fillStyle = '#7fc4f0'; c.fillRect(x, y, W, H); break
    default: {
      // a banner — a team's, a hotel's, a shop's: bold colours and a band, by its number
      const n = kind === 'banner' ? 0 : Number(kind.slice(-1)) || 0
      const pal = [['#fdb927', '#1d428a'], ['#fd5a1e', '#27251f'], ['#aa0000', '#b3995d'], ['#006d75', '#ffffff']][n % 4]
      c.fillStyle = pal[0]; c.fillRect(x, y, W, H)
      c.fillStyle = pal[1]; c.fillRect(x, y + H * 0.38, W, H * 0.24); c.fillRect(x + W * 0.12, y, W * 0.1, H)
    }
  }
  c.restore()
}

let atlas: StandardMaterial | null = null
function flagMaterial(scene: Scene): StandardMaterial {
  if (atlas) return atlas
  const tex = new DynamicTexture('flags', { width: COLS * W, height: ROWS * H }, scene, true)
  const ctx = tex.getContext() as unknown as Ctx
  KINDS.forEach((k, i) => draw(ctx, k, (i % COLS) * W, Math.floor(i / COLS) * H))
  tex.update(true)
  const mat = new StandardMaterial('flags', scene)
  mat.diffuseTexture = tex
  mat.emissiveColor = new Color3(0.6, 0.6, 0.6)
  mat.disableLighting = true
  // (both faces: a flag reads from behind, mirrored, as a real one does)
  mat.backFaceCulling = false
  atlas = mat
  return mat
}
const cellOf = (kind: string): [number, number, number, number] => {
  let i = KINDS.indexOf(kind)
  if (i < 0) i = KINDS.indexOf('us')
  const c = i % COLS, r = Math.floor(i / COLS)
  return [c / COLS, 1 - (r + 1) / ROWS, (c + 1) / COLS, 1 - r / ROWS]
}

/**
 * The flags of a city as a tile layer: each tile's poles and cloth, built when its tile is. `toLocal` is the city's
 * projection; the poles stand on the terrain, or on the roof height tools/flags.ts found under them.
 */
export function flagsLayer(scene: Scene, poles: FlagPole[], toLocal: (lat: number, lon: number) => { x: number; z: number }, terrain: Terrain): TileLayer {
  const placed = poles.map((p, i) => ({ ...p, ...toLocal(p.lat, p.lon), i }))
  return {
    name: 'flags',
    range: 3,
    build(_near, rect) {
      const here = placed.filter((p) => p.x >= rect.x0 && p.x < rect.x1 && p.z >= rect.z0 && p.z < rect.z1)
      if (here.length === 0) return []
      const posts = new MeshBuilder()
      const cloth = new MeshBuilder()
      for (const p of here) {
        const y0 = terrain.heightAt(p.x, p.z) + (p.roof ?? 0)
        const top = y0 + p.pole
        const poleC: [number, number, number] = p.black ? [0.12, 0.12, 0.13] : [0.86, 0.86, 0.84]
        prism(posts, p.x, p.z, y0, top, p.black ? 0.09 : 0.07, 6, poleC)
        prism(posts, p.x, p.z, top, top + 0.22, 0.13, 6, p.black ? [0.15, 0.15, 0.16] : [0.82, 0.68, 0.3])
        // the flag, flying east on the west wind, give or take
        const a = (((p.i * 37) % 41) - 20) * (Math.PI / 180)
        const dx = Math.cos(a), dz = Math.sin(a)
        const L = Math.max(1.4, Math.min(3.2, p.pole * 0.2))
        const Hf = L * 0.62
        const N = 8
        const phase = p.i * 1.7
        const flags = [p.flag, ...(p.more ?? [])]
        // (each flag hangs under the last, a streamer's width apart when there are streamers between them)
        const gap = p.streamers?.length ? 1.3 : 0.35
        const flagTop = (k: number): number => top - (p.streamers?.length ? 1.1 : 0) - k * (Hf + gap)
        flags.forEach((kind, f) => {
          const [u0, v0, u1, v1] = cellOf(kind)
          const ft = flagTop(f)
          const ph = phase + f * 2.1
          const at = (s: number, y: number): [number, number, number] => {
            const w = Math.sin(s * Math.PI * 1.6 + ph) * 0.14 * L * s
            return [p.x + dx * L * s - dz * w, y, p.z + dz * L * s + dx * w]
          }
          for (let k = 0; k < N; k++) {
            const s0 = k / N, s1 = (k + 1) / N
            cloth.quad([at(s0, ft - Hf), at(s1, ft - Hf), at(s1, ft), at(s0, ft)], [-dz, 0, dx],
              [[u0 + (u1 - u0) * s0, v0], [u0 + (u1 - u0) * s1, v0], [u0 + (u1 - u0) * s1, v1], [u0 + (u1 - u0) * s0, v1]], [1, 1, 1], 0)
          }
        })
        /*
         * The streamers: long tapering ribbons, one over the top flag and one between each pair, rippling more than the
         * flags do and drooping toward their tails, each a little off the flags' line (Commons "Pier 39 01 Flags").
         */
        ;(p.streamers ?? []).forEach((colour, k) => {
          const [u0, v0, u1, v1] = cellOf(`streamer_${colour}`)
          const yA = k === 0 ? top - 0.1 : flagTop(k) + gap * 0.75
          const SL = L * 1.6, sw = 0.32
          const turn = (k % 2 ? 0.35 : -0.3)
          const ex = Math.cos(a + turn), ez = Math.sin(a + turn)
          const ph = phase + k * 1.3
          const M = 12
          const at = (s: number, off: number): [number, number, number] => {
            const w = Math.sin(s * Math.PI * 2.6 + ph) * 0.35 * s
            return [p.x + ex * SL * s - ez * w, yA - s * s * 0.9 + off, p.z + ez * SL * s + ex * w]
          }
          for (let m = 0; m < M; m++) {
            const s0 = m / M, s1 = (m + 1) / M
            const w0 = sw * (1 - s0 * 0.85), w1 = sw * (1 - s1 * 0.85)
            cloth.quad([at(s0, -w0), at(s1, -w1), at(s1, 0), at(s0, 0)], [-ez, 0, ex],
              [[u0 + 0.1 * (u1 - u0), v0 + 0.1 * (v1 - v0)], [u0 + 0.9 * (u1 - u0), v0 + 0.1 * (v1 - v0)], [u0 + 0.9 * (u1 - u0), v0 + 0.9 * (v1 - v0)], [u0 + 0.1 * (u1 - u0), v0 + 0.9 * (v1 - v0)]], [1, 1, 1], 0)
          }
        })
      }
      const out: Mesh[] = []
      const pm = new Mesh(`flagpoles:${rect.x0},${rect.z0}`, scene)
      posts.toVertexData().applyToMesh(pm)
      pm.material = cartoonMaterial(scene, 'cartoonStatic', false)
      pm.renderingGroupId = 3
      pm.isPickable = false
      out.push(pm)
      const cm = new Mesh(`flags:${rect.x0},${rect.z0}`, scene)
      cloth.toVertexData().applyToMesh(cm)
      cm.material = flagMaterial(scene)
      cm.renderingGroupId = 3
      cm.isPickable = false
      out.push(cm)
      return out
    },
  }
}

/** The city's flagpoles (public/flags/<city>.json), or none. */
export async function flagPoles(base: string, city: string): Promise<FlagPole[]> {
  // OSM's (tools/flags.ts writes it), and the poles placed by hand that OSM does not map (`<city>-placed.json`, edited
  // directly: Pier 39's flags, 2026-10-16)
  const one = async (name: string): Promise<FlagPole[]> => {
    try {
      const r = await fetch(new URL(`flags/${name}.json`, base).href)
      const text = await r.text()
      return r.ok && text.trimStart().startsWith('[') ? JSON.parse(text) as FlagPole[] : []
    } catch { return [] }
  }
  const [osm, placed] = await Promise.all([one(city), one(`${city}-placed`)])
  return [...osm, ...placed]
}
