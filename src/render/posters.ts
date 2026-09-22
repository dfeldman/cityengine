/**
 * Posters (PARIS_EXPAND §6 item 9): a library of poster designs per region, drawn once into one texture page
 * at a STANDARD size (the 2:3 poster; Paris's Morris column wrap is a ring of them), and pasted onto the
 * furniture that carries them — for now every Morris column, a ring of posters round its drum.
 *
 * The designs are invented, never anyone's real campaign: an event word (EXPOSITION, CONCERT, THÉÂTRE…),
 * a run of dates, and a bold geometric image in a strong palette, the look of a Paris column in any season.
 * A region with its own words (and one day its own library of images) gets its own page.
 */
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import type { TileLayer } from './city.ts'
import type { Terrain } from '../city/terrain.ts'

const COLS = 8
const ROWS = 2
const CELL_W = 256
const CELL_H = 384

const WORDS: Record<string, string[]> = {
  paris: ['EXPOSITION', 'CONCERT', 'THÉÂTRE', 'OPÉRA', 'CINÉMA', 'FESTIVAL', 'DANSE', 'JAZZ', 'BALLET', 'CIRQUE', 'SALON', 'RÉCITAL', 'COMÉDIE', 'MUSÉE', 'LIVRES', 'NUIT BLANCHE'],
  default: ['CONCERT', 'EXHIBIT', 'THEATER', 'JAZZ', 'FESTIVAL', 'BALLET', 'CINEMA', 'OPERA', 'COMEDY', 'CIRCUS', 'BOOK FAIR', 'MUSEUM', 'RECITAL', 'DANCE', 'GALA', 'SHOW'],
}
const PALETTES: [string, string, string][] = [
  ['#e63946', '#f1faee', '#1d3557'], ['#ffb703', '#023047', '#fb8500'], ['#2a9d8f', '#e9c46a', '#264653'],
  ['#8338ec', '#ffbe0b', '#ffffff'], ['#ef476f', '#ffd166', '#073b4c'], ['#003049', '#fcbf49', '#d62828'],
  ['#1b1b1e', '#f5f3f5', '#e4572e'], ['#f4f1de', '#e07a5f', '#3d405b'],
]
const MONTHS = { paris: ['JANV', 'FÉVR', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUIL', 'SEPT', 'OCT', 'NOV', 'DÉC'], default: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'SEP', 'OCT', 'NOV', 'DEC'] }

let atlas: { tex: DynamicTexture; mat: StandardMaterial } | null = null

/** The poster page: sixteen designs, drawn once. */
export function posterMaterial(scene: Scene, region: string | undefined): StandardMaterial {
  if (atlas) return atlas.mat
  const words = WORDS[region ?? ''] ?? WORDS.default
  const months = MONTHS[region === 'paris' ? 'paris' : 'default']
  const tex = new DynamicTexture('posters', { width: COLS * CELL_W, height: ROWS * CELL_H }, scene, true)
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D
  for (let i = 0; i < COLS * ROWS; i++) {
    const x0 = (i % COLS) * CELL_W
    const y0 = Math.floor(i / COLS) * CELL_H
    const [bg, fg, ink] = PALETTES[i % PALETTES.length]
    ctx.fillStyle = bg
    ctx.fillRect(x0, y0, CELL_W, CELL_H)
    // the image: one of four bold figures, in the poster's second colour
    ctx.fillStyle = fg
    const cx = x0 + CELL_W / 2
    const cy = y0 + CELL_H * 0.42
    const kind = (i * 7) % 4
    ctx.beginPath()
    if (kind === 0) ctx.arc(cx, cy, CELL_W * 0.32, 0, Math.PI * 2)
    else if (kind === 1) { ctx.moveTo(cx, cy - 110); ctx.lineTo(cx + 100, cy + 80); ctx.lineTo(cx - 100, cy + 80) }
    else if (kind === 2) for (let k = 0; k < 5; k++) ctx.rect(x0 + 24 + k * 44, cy - 90 + (k % 2) * 40, 28, 150)
    else { ctx.ellipse(cx - 30, cy, 70, 110, 0.4, 0, Math.PI * 2); ctx.moveTo(cx + 110, cy); ctx.arc(cx + 60, cy + 20, 50, 0, Math.PI * 2) }
    ctx.fill()
    // the event, its dates, a line of small print
    ctx.fillStyle = ink
    ctx.textAlign = 'center'
    const word = words[i % words.length]
    ctx.font = `900 ${word.length > 9 ? 30 : 40}px Helvetica, Arial, sans-serif`
    ctx.fillText(word, cx, y0 + CELL_H * 0.8)
    ctx.font = '700 22px Helvetica, Arial, sans-serif'
    const d = 3 + ((i * 11) % 20)
    ctx.fillText(`${d} — ${d + 7 + (i % 9)} ${months[i % months.length]}`, cx, y0 + CELL_H * 0.89)
    ctx.fillRect(x0 + 40, y0 + CELL_H * 0.93, CELL_W - 80, 3)
  }
  tex.update(true)
  const mat = new StandardMaterial('posters', scene)
  mat.diffuseTexture = tex
  mat.emissiveColor = new Color3(0.62, 0.6, 0.56)
  mat.disableLighting = true
  mat.backFaceCulling = true
  atlas = { tex, mat }
  return mat
}

/** The UV rectangle of design `i`. */
function cell(i: number): [number, number, number, number] {
  const c = i % COLS
  const r = Math.floor(i / COLS) % ROWS
  // DynamicTexture's v runs bottom-up
  return [c / COLS, 1 - (r + 1) / ROWS, (c + 1) / COLS, 1 - r / ROWS]
}

/**
 * The posters of the Morris columns in a tile: twelve round each drum, in two staggered tiers, each design
 * picked by the column's place so a column always wears the same.
 */
export function postersLayer(scene: Scene, terrain: Terrain, region: string | undefined): TileLayer {
  return {
    name: 'posters',
    range: 2,
    build(near, rect) {
      const cols = near.tile.furniture.filter((f) => f.kind === 'column' && f.x >= rect.x0 && f.x < rect.x1 && f.z >= rect.z0 && f.z < rect.z1)
      if (cols.length === 0) return []
      const out = new MeshBuilder()
      for (const f of cols) {
        const g = terrain.heightAt(f.x, f.z) + 0.15
        const seed = Math.abs(Math.round(f.x * 13 + f.z * 7))
        // six a tier, two tiers staggered: each 0.62 m by 0.93 m, the poster's own 2:3
        const n = 6
        for (let k = 0; k < n * 2; k++) {
          const tier = Math.floor(k / n)
          const a0 = ((k % n + tier * 0.5) / n) * Math.PI * 2
          const a1 = ((k % n + tier * 0.5 + 0.94) / n) * Math.PI * 2
          const r = 0.625
          const y0 = g + 0.5 + tier * 1.0
          const y1 = y0 + 0.93
          const [u0, v0, u1, v1] = cell(seed + k * 5)
          // bent round the drum in four facets: one flat chord over a sixth of the circle cut into the column
          const F = 4
          for (let q = 0; q < F; q++) {
            const b0 = a0 + ((a1 - a0) * q) / F
            const b1 = a0 + ((a1 - a0) * (q + 1)) / F
            const bm = (b0 + b1) / 2
            const ua = u1 + ((u0 - u1) * q) / F
            const ub = u1 + ((u0 - u1) * (q + 1)) / F
            out.quad([[f.x + Math.sin(b0) * r, y0, f.z + Math.cos(b0) * r], [f.x + Math.sin(b1) * r, y0, f.z + Math.cos(b1) * r],
              [f.x + Math.sin(b1) * r, y1, f.z + Math.cos(b1) * r], [f.x + Math.sin(b0) * r, y1, f.z + Math.cos(b0) * r]],
            [Math.sin(bm), 0, Math.cos(bm)], [[ua, v0], [ub, v0], [ub, v1], [ua, v1]], [1, 1, 1], 0)
          }
        }
      }
      const m = new Mesh(`posters:${near.key}`, scene)
      out.toVertexData().applyToMesh(m)
      m.material = posterMaterial(scene, region)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}
