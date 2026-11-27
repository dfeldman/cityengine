/**
 * THE TAG ATLAS for render/litter-glsl.ts (owner, 2026-11-26: "over 16 tags, and different graffiti in SF vs Paris").
 *
 * Drawn once on a canvas when the first wall material asks, for the city being ridden only: TAG_ATLAS.cols × rows cells of
 * cellW × cellH px, transparent between the paint. No file to fetch, no mips (the shader draws tags only within LT.tagNear,
 * and spray paint is soft anyway), about 1 MB of GPU memory. Seeded, so a wall carries the same tag on every ride.
 *
 * All names are invented: none is a real writer's tag or a real artist's piece.
 *   San Francisco: marker handstyles, bubble throw-ups in Mission colours, two-colour pieces with highlights, slap stickers,
 *     drippy scribbles.
 *   Paris: black and red handstyles, silver "chrome" throw-ups with a black line, stencils (a bird, a heart, a cat, a face, a
 *     hand), slogans in marker capitals.
 */
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import type { Scene } from '@babylonjs/core/scene'

export const TAG_ATLAS = { cols: 4, rows: 8, cellW: 128, cellH: 64 }

type Style = 'hand' | 'throw' | 'piece' | 'sticker' | 'scribble' | 'chrome' | 'stencil' | 'slogan'
interface CityTags { words: string[]; slogans: string[]; palette: string[]; mix: [Style, number][] }

const CITIES: Record<string, CityTags> = {
  'san-francisco': {
    words: ['KRUSH', 'SLOE', 'MYTH', 'OKAY', 'DREAM', 'TWIST', 'RAKE', 'NERVE', 'BLAZE', 'SEKT', 'VOID', 'FOGS', 'HYPE', 'ZORK',
      'DUSK', 'TWEAK', 'OMEN', 'LURK', 'GRIM', 'SPAZ', 'FLEX', 'KAOS', 'WAVY', 'BONE', 'MUNI', 'TACO', 'RIOT', 'SKEW'],
    slogans: [],
    palette: ['#ff3c8e', '#19b3b1', '#ffd21f', '#ff7a1a', '#7b3fd0', '#111111', '#c9ccd1', '#f4f4f0', '#2b6ee0', '#46c24a'],
    mix: [['hand', 11], ['throw', 9], ['piece', 5], ['sticker', 4], ['scribble', 3]],
  },
  paris: {
    words: ['KOSM', 'ZONE', 'RIZE', 'SKRO', 'LOUP', 'VRAC', 'NUIT', 'FLOU', 'KRIM', 'BRUT', 'ZAPP', 'OUPS', 'DEZ', 'NEON', 'PIKS',
      'TAKE', 'MOKA', 'SOUK', 'ROZE', 'VNR', 'BLEU', 'KAZ'],
    slogans: ['RÉSISTE', 'AMOUR', 'NON', 'LIBRE', 'POÉSIE', 'ICI', 'RÊVE', 'À QUOI BON', 'ENCORE'],
    palette: ['#111111', '#c8102e', '#f2f2ee', '#c9ccd1', '#2a4c8f', '#d4a72c', '#1f6b45', '#6a2c70'],
    mix: [['hand', 10], ['chrome', 9], ['stencil', 5], ['slogan', 5], ['throw', 3]],
  },
}

const FONTS = {
  hand: ['italic 700 {s}px "Marker Felt", "Segoe Print", "Comic Sans MS", cursive', 'italic 600 {s}px "Brush Script MT", "Segoe Script", cursive'],
  block: ['900 {s}px "Arial Black", Impact, sans-serif', '{s}px Impact, "Arial Black", sans-serif'],
  plain: ['700 {s}px "Helvetica Neue", Arial, sans-serif'],
}

function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

const atlases = new Map<string, Texture>()

/** the atlas for a region, made on first use; other cities get San Francisco's */
export function tagAtlas(scene: Scene, region: string): Texture {
  const key = CITIES[region] ? region : 'san-francisco'
  const had = atlases.get(key)
  if (had && had.getScene() === scene) return had
  const { cols, rows, cellW, cellH } = TAG_ATLAS
  const tex = new DynamicTexture(`tags:${key}`, { width: cols * cellW, height: rows * cellH }, scene, false, Texture.BILINEAR_SAMPLINGMODE)
  tex.hasAlpha = true
  tex.wrapU = Texture.CLAMP_ADDRESSMODE
  tex.wrapV = Texture.CLAMP_ADDRESSMODE
  const ctx = tex.getContext() as CanvasRenderingContext2D
  ctx.clearRect(0, 0, cols * cellW, rows * cellH)
  const city = CITIES[key]
  const styles: Style[] = city.mix.flatMap(([s, n]) => Array<Style>(n).fill(s))
  const r = rng(key === 'paris' ? 75001 : 94110)
  for (let i = 0; i < cols * rows; i++) {
    const x = (i % cols) * cellW, y = Math.floor(i / cols) * cellH
    ctx.save()
    ctx.beginPath(); ctx.rect(x, y, cellW, cellH); ctx.clip()
    ctx.translate(x + cellW / 2, y + cellH / 2)
    drawTag(ctx, styles[i % styles.length], city, r, cellW, cellH)
    ctx.restore()
  }
  tex.update(false)
  atlases.set(key, tex)
  return tex
}

const pick = <T>(r: () => number, a: T[]): T => a[Math.floor(r() * a.length) % a.length]
const font = (r: () => number, set: string[], size: number): string => pick(r, set).replace('{s}', String(Math.round(size)))

/** fits a word to the cell's width at this font */
function fit(ctx: CanvasRenderingContext2D, word: string, f: (s: number) => string, w: number, h: number): number {
  let s = h * 0.8
  ctx.font = f(s)
  const m = ctx.measureText(word).width
  if (m > w) { s *= w / m; ctx.font = f(s) }
  return s
}

function spray(ctx: CanvasRenderingContext2D, colour: string, blur: number): void {
  ctx.shadowColor = colour
  ctx.shadowBlur = blur
}

function drips(ctx: CanvasRenderingContext2D, r: () => number, colour: string, w: number, top: number, n: number): void {
  ctx.strokeStyle = colour
  ctx.lineCap = 'round'
  for (let i = 0; i < n; i++) {
    const dx = (r() - 0.5) * w, len = 4 + r() * 14
    ctx.lineWidth = 1 + r() * 1.5
    ctx.beginPath(); ctx.moveTo(dx, top); ctx.lineTo(dx, top + len); ctx.stroke()
  }
}

function drawTag(ctx: CanvasRenderingContext2D, style: Style, city: CityTags, r: () => number, W: number, H: number): void {
  const word = pick(r, city.words)
  const col = pick(r, city.palette)
  const w = W * 0.9, h = H * 0.85
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.rotate((r() - 0.5) * 0.25)
  switch (style) {
    case 'hand': {
      // a marker or spray handstyle: an outline-less stroke, skewed, with an underline swoosh or a crown
      ctx.transform(1, 0, -0.25 - r() * 0.2, 1, 0, 0)
      const s = fit(ctx, word, (z) => font(r, FONTS.hand, z), w * 0.95, h)
      spray(ctx, col, 2)
      ctx.fillStyle = col
      ctx.strokeStyle = col
      ctx.lineWidth = 1.2
      ctx.fillText(word, 0, 0)
      ctx.strokeText(word, 0, 0)
      ctx.lineWidth = 2
      ctx.beginPath()
      const m = ctx.measureText(word).width / 2
      if (r() < 0.6) { ctx.moveTo(-m, s * 0.42); ctx.quadraticCurveTo(0, s * 0.62, m * 1.1, s * 0.3); ctx.stroke() }
      else { ctx.moveTo(-8, -s * 0.45); ctx.lineTo(-4, -s * 0.65); ctx.lineTo(0, -s * 0.48); ctx.lineTo(4, -s * 0.65); ctx.lineTo(8, -s * 0.45); ctx.stroke() }
      if (r() < 0.4) drips(ctx, r, col, m * 2, s * 0.3, 3)
      break
    }
    case 'throw':
    case 'chrome': {
      // bubble letters: a fat outline, a fill, sometimes a drop shadow; chrome is silver on a black line, the Paris favourite
      const chrome = style === 'chrome'
      fit(ctx, word, (z) => font(r, FONTS.block, z), w * 0.85, h * 0.9)
      const line = chrome ? '#0d0d0d' : pick(r, ['#111111', '#f4f4f0', col === '#111111' ? '#ff3c8e' : '#111111'])
      const fill = chrome ? '#d7d9dc' : col
      if (r() < 0.6) { ctx.fillStyle = chrome ? pick(r, ['#2a4c8f', '#c8102e', '#111111']) : '#111111'; ctx.lineWidth = 9; ctx.strokeStyle = ctx.fillStyle; ctx.strokeText(word, 3, 3) }
      spray(ctx, line, 2)
      ctx.strokeStyle = line
      ctx.lineWidth = 7
      ctx.strokeText(word, 0, 0)
      if (chrome) {
        const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
        g.addColorStop(0, '#f6f7f8'); g.addColorStop(0.5, '#a9adb3'); g.addColorStop(0.55, '#e8eaec'); g.addColorStop(1, '#8d9197')
        ctx.fillStyle = g
      } else ctx.fillStyle = fill
      ctx.shadowBlur = 0
      ctx.fillText(word, 0, 0)
      break
    }
    case 'piece': {
      // two-colour fill, black line, white highlights
      fit(ctx, word, (z) => font(r, FONTS.block, z), w * 0.88, h)
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
      g.addColorStop(0, col); g.addColorStop(1, pick(r, city.palette.filter((c) => c !== col)))
      spray(ctx, '#111111', 3)
      ctx.strokeStyle = '#111111'; ctx.lineWidth = 8; ctx.strokeText(word, 0, 0)
      ctx.shadowBlur = 0
      ctx.fillStyle = g; ctx.fillText(word, 0, 0)
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5
      const m = ctx.measureText(word).width / 2
      for (let i = 0; i < 4; i++) { const sx = -m + r() * m * 2; ctx.beginPath(); ctx.moveTo(sx, -h * 0.25); ctx.lineTo(sx + 4, -h * 0.3); ctx.stroke() }
      break
    }
    case 'sticker': {
      // a slap: a small paper rectangle with a scribbled name
      const sw = W * (0.35 + r() * 0.15), sh = H * (0.35 + r() * 0.15)
      ctx.fillStyle = pick(r, ['#f4f4f0', '#f4f4f0', '#ffd21f', '#e23b3b'])
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh)
      ctx.fillStyle = '#111111'
      fit(ctx, word, (z) => font(r, FONTS.hand, z), sw * 0.85, sh * 0.9)
      ctx.fillText(word, 0, 0)
      break
    }
    case 'scribble': {
      // a fast looping one-line tag with drips
      spray(ctx, col, 3)
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'
      ctx.beginPath()
      let px = -w / 2
      ctx.moveTo(px, 0)
      while (px < w / 2) { const nx = px + 6 + r() * 12; ctx.quadraticCurveTo((px + nx) / 2, (r() - 0.5) * h, nx, (r() - 0.5) * h * 0.4); px = nx }
      ctx.stroke()
      drips(ctx, r, col, w, h * 0.15, 5)
      break
    }
    case 'stencil': {
      // a flat black stencil figure, sometimes with a red accent
      ctx.fillStyle = '#121212'
      spray(ctx, '#121212', 1.5)
      stencilFigure(ctx, Math.floor(r() * 5), H * 0.42)
      if (r() < 0.5) { ctx.fillStyle = '#c8102e'; ctx.beginPath(); ctx.arc(H * 0.5, -H * 0.2, 4, 0, Math.PI * 2); ctx.fill() }
      break
    }
    case 'slogan': {
      // marker capitals, one line, sometimes underlined
      const text = pick(r, city.slogans)
      fit(ctx, text, (z) => font(r, FONTS.plain, z), w * 0.95, h * 0.55)
      ctx.fillStyle = col === '#f2f2ee' ? '#111111' : col
      spray(ctx, ctx.fillStyle, 1.5)
      ctx.fillText(text, 0, 0)
      if (r() < 0.5) { ctx.fillRect(-w * 0.4, h * 0.25, w * 0.8, 2) }
      break
    }
  }
}

/** simple silhouettes, all filled shapes (a stencil has no outline) */
function stencilFigure(ctx: CanvasRenderingContext2D, k: number, s: number): void {
  ctx.beginPath()
  if (k === 0) {        // a bird in flight
    ctx.moveTo(-s * 1.2, -s * 0.1); ctx.quadraticCurveTo(-s * 0.5, -s * 0.9, 0, 0); ctx.quadraticCurveTo(s * 0.5, -s * 0.9, s * 1.2, -s * 0.1)
    ctx.quadraticCurveTo(s * 0.5, -s * 0.4, 0, s * 0.25); ctx.quadraticCurveTo(-s * 0.5, -s * 0.4, -s * 1.2, -s * 0.1)
  } else if (k === 1) { // a heart
    ctx.moveTo(0, s * 0.8); ctx.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.6, -s * 1.1, 0, -s * 0.35); ctx.bezierCurveTo(s * 0.6, -s * 1.1, s * 1.4, -s * 0.1, 0, s * 0.8)
  } else if (k === 2) { // a sitting cat
    ctx.ellipse(0, s * 0.35, s * 0.45, s * 0.55, 0, 0, Math.PI * 2)
    ctx.moveTo(s * 0.32, -s * 0.35); ctx.arc(0, -s * 0.35, s * 0.32, 0, Math.PI * 2)
    ctx.moveTo(-s * 0.3, -s * 0.5); ctx.lineTo(-s * 0.22, -s * 0.85); ctx.lineTo(-s * 0.05, -s * 0.6)
    ctx.moveTo(s * 0.3, -s * 0.5); ctx.lineTo(s * 0.22, -s * 0.85); ctx.lineTo(s * 0.05, -s * 0.6)
    ctx.moveTo(s * 0.4, s * 0.8); ctx.quadraticCurveTo(s * 1.1, s * 0.8, s * 0.9, s * 0.1); ctx.lineTo(s * 0.98, s * 0.1); ctx.quadraticCurveTo(s * 1.2, s * 0.9, s * 0.4, s * 0.9)
  } else if (k === 3) { // a face in profile with a cap
    ctx.moveTo(-s * 0.4, s * 0.9); ctx.lineTo(-s * 0.45, -s * 0.2); ctx.quadraticCurveTo(-s * 0.4, -s * 0.8, s * 0.15, -s * 0.75)
    ctx.lineTo(s * 0.75, -s * 0.6); ctx.lineTo(s * 0.2, -s * 0.45); ctx.lineTo(s * 0.35, -s * 0.1); ctx.lineTo(s * 0.5, s * 0.1)
    ctx.lineTo(s * 0.35, s * 0.2); ctx.lineTo(s * 0.38, s * 0.45); ctx.lineTo(s * 0.1, s * 0.6); ctx.lineTo(s * 0.1, s * 0.9)
  } else {              // an open hand
    ctx.ellipse(0, s * 0.35, s * 0.42, s * 0.45, 0, 0, Math.PI * 2)
    for (let i = 0; i < 4; i++) { const fx = -s * 0.32 + i * s * 0.21; ctx.rect(fx, -s * 0.75 + Math.abs(i - 1.5) * s * 0.1, s * 0.15, s * 0.9) }
    ctx.moveTo(s * 0.4, s * 0.3); ctx.ellipse(s * 0.55, s * 0.05, s * 0.12, s * 0.35, -0.6, 0, Math.PI * 2)
  }
  ctx.fill()
}
