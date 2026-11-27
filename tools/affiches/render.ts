/**
 * Paints a set of street ads (src/city/affiches/<set>.json) into its atlas page, public/affiches/<set>.webp, cell by
 * cell where src/render/affiches-layout.ts puts them: each ad an HTML card — real type in the Mac's own faces,
 * gradients, the pictograms of tools/affiches/art.ts — laid out by one of eleven templates, photographed once by
 * headless Chromium. The game only ever samples the picture.
 *
 *   npx vite-node tools/affiches/render.ts -- [paris|sf ...]        (no argument: every set)
 *   AFFICHE_PREVIEW=1 also writes a half-size PNG beside it, to look at
 */
import { readFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import sharp from 'sharp'
import { CELL, FAMILIES, GUTTER, PAGE_W, packAffiches, type AfficheFamily, type AfficheRect } from '../../src/render/affiches-layout.ts'
import { artSvg } from './art.ts'

interface Entry {
  id: string; family: AfficheFamily; kind: string; layout: string; brand: string; headline: string; sub?: string; small?: string
  art: string; palette: [string, string, string]; font: string
}

const FONTS: Record<string, string> = {
  sans: `'Helvetica Neue', Helvetica, Arial, sans-serif`,
  condensed: `'Avenir Next Condensed', 'Helvetica Neue', 'Arial Narrow', sans-serif`,
  serif: `Georgia, Baskerville, serif`,
  didone: `Didot, 'Bodoni 72', Georgia, serif`,
  slab: `Rockwell, 'American Typewriter', Georgia, serif`,
  script: `'Snell Roundhand', 'Brush Script MT', cursive`,
  mono: `Menlo, 'Courier New', monospace`,
  hand: `'Marker Felt', Noteworthy, 'Chalkboard SE', cursive`,
  black: `'Arial Black', Impact, 'Helvetica Neue', sans-serif`,
}
/** the heavy face a template's headline falls back on when the entry's own is a light one */
const WEIGHT: Record<string, number> = { sans: 900, condensed: 800, serif: 700, didone: 400, slab: 700, script: 400, mono: 700, hand: 700, black: 900 }

/** the set being painted (its quotation marks) */
let LANG = 'paris'
const esc = (s = ''): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const hash = (s: string): number => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }

/** a box in percent of the card, its text fitted into it by the page script (`fit`, `max` in card-height %) */
function bx(l: number, t: number, w: number, h: number, inner: string, style = '', max = 0): string {
  return `<div class="b${max ? ' fit' : ''}" data-max="${max}" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%;${style}">${inner}</div>`
}
const art = (e: Entry, l: number, t: number, w: number, h: number, colour: string, flip = false): string =>
  bx(l, t, w, h, artSvg(e.art), `color:${colour};${flip ? 'transform:scaleX(-1);' : ''}`)

function card(e: Entry): string {
  const wide = CELL[e.family].w > CELL[e.family].h
  const f = FONTS[e.font] ?? FONTS.sans
  const fw = WEIGHT[e.font] ?? 800
  const H = `font-family:${f};font-weight:${fw};`
  const r = hash(e.id)
  const lum = (c: string): number => { const n = parseInt(c.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) }
  const onSky = Math.abs(lum(e.palette[1]) - lum(e.palette[2])) >= Math.abs(lum(e.palette[0]) - lum(e.palette[2])) ? 'var(--ink)' : 'var(--bg)'
  const flip = (r & 1) === 1
  const brandBar = (t: number, h: number): string => bx(0, t, 100, h,
    `<span class="fitx" style="${H}letter-spacing:.04em">${esc(e.brand)}</span><span class="sm">${esc(e.small)}</span>`,
    'background:var(--ink);color:var(--bg);display:flex;align-items:center;justify-content:space-between;padding:0 5%;box-sizing:border-box;gap:4%')
  const skyAngle = 160 + (r % 40)
  const sky = (l: number, t: number, w: number, h: number): string => bx(l, t, w, h, '',
    `background:linear-gradient(${skyAngle}deg, color-mix(in srgb, var(--acc) 35%, white), var(--acc) 70%, color-mix(in srgb, var(--acc) 70%, black))`)
  switch (e.layout) {
    case 'photo': return wide
      ? sky(0, 0, 100, 80) + art(e, flip ? 64 : 3, 6, 32, 70, onSky, flip) +
        bx(flip ? 4 : 38, 8, 58, 46, esc(e.headline), `${H}color:${onSky}`, 34) +
        bx(flip ? 4 : 38, 56, 58, 20, esc(e.sub), `color:${onSky};font-weight:600`, 14) + brandBar(80, 20)
      : sky(0, 0, 100, 70) + bx(0, 56, 100, 16, '<svg viewBox="0 0 100 20" preserveAspectRatio="none" style="width:100%;height:100%"><path d="M0 12 Q30 0 60 8 T100 6 V20 H0Z" fill="var(--bg)"/></svg>') +
        bx(0, 70, 100, 14, '', 'background:var(--bg)') + art(e, 18, 20, 64, 40, onSky, flip) +
        bx(6, 3, 88, 17, esc(e.headline), `${H}color:${onSky}`, 9) +
        bx(8, 70, 84, 13, esc(e.sub), 'color:var(--ink);font-weight:600', 4.2) + brandBar(85, 15)
    case 'type': return wide
      ? bx(4, 8, 72, 64, esc(e.headline), `${H}line-height:.95`, 40) + art(e, 80, 12, 16, 52, 'var(--acc)') +
        bx(4, 76, 56, 18, esc(e.sub || e.small), 'color:var(--acc);font-weight:700', 12) +
        bx(62, 74, 34, 20, esc(e.brand), `${H}text-align:right;color:var(--acc)`, 16)
      : bx(6, 5, 88, 60, esc(e.headline), `${H}line-height:.95`, 15) +
        bx(6, 67, 66, 12, esc(e.sub), 'color:var(--acc);font-weight:700', 4.5) + art(e, 74, 66, 20, 16, 'var(--acc)') +
        bx(6, 84, 88, 8, esc(e.brand), `${H}color:var(--acc);letter-spacing:.03em`, 6) +
        bx(6, 93, 88, 5, esc(e.small), 'opacity:.8;font-weight:500', 2.6)
    case 'minimal': return wide
      ? art(e, 8, 20, 22, 60, 'var(--acc)') +
        bx(36, 20, 58, 28, esc(e.brand), `font-family:${f};font-weight:400;letter-spacing:.35em`, 22) +
        bx(36, 54, 58, 18, esc(e.headline), 'font-family:Didot,Georgia,serif;font-style:italic', 12) +
        bx(36, 78, 58, 10, esc(e.small), 'letter-spacing:.2em;opacity:.7;font-size:8px', 6)
      : art(e, 36, 26, 28, 22, 'var(--acc)') +
        bx(5, 56, 90, 8, esc(e.brand), `font-family:${f};font-weight:400;letter-spacing:.35em`, 5.5) +
        bx(10, 68, 80, 10, esc(e.headline), 'font-family:Didot,Georgia,serif;font-style:italic', 3.6) +
        bx(10, 91, 80, 4, esc(e.small), 'letter-spacing:.2em;opacity:.7', 2)
    case 'split': return wide
      ? bx(flip ? 58 : 0, 0, 42, 100, '', 'background:var(--acc)') + art(e, flip ? 64 : 6, 14, 30, 72, 'var(--bg)', flip) +
        bx(flip ? 4 : 46, 8, 50, 52, esc(e.headline), H, 30) +
        bx(flip ? 4 : 46, 62, 50, 14, esc(e.sub), 'font-weight:600', 11) +
        bx(flip ? 4 : 46, 78, 50, 16, esc(e.brand), `${H}color:var(--acc)`, 14)
      : bx(0, 0, 100, 48, '', 'background:var(--acc)') + art(e, 24, 6, 52, 38, 'var(--bg)', flip) +
        bx(6, 51, 88, 24, esc(e.headline), H, 8) +
        bx(6, 75, 88, 10, esc(e.sub), 'font-weight:600', 3.8) +
        bx(6, 86, 88, 8, esc(e.brand), `${H}color:var(--acc)`, 5.5) +
        bx(6, 94.5, 88, 4, esc(e.small), 'opacity:.75;font-weight:500', 2.4)
    case 'event': {
      const g = r % 3
      const geo = g === 0 ? bx(-20, -8, 140, 62, '', 'border-radius:50%;background:var(--acc)')
        : g === 1 ? [0, 1, 2, 3, 4].map((i) => bx(-10, 4 + i * 8, 120, 4, '', `background:var(--acc);transform:rotate(-12deg)`)).join('')
        : bx(0, 0, 100, 44, '', 'background:var(--acc);clip-path:polygon(0 0,100% 0,100% 40%,0 100%)')
      return geo + art(e, 34, 12, 32, 26, 'var(--ink)') +
        bx(6, 3, 88, 5, esc(e.brand), 'letter-spacing:.18em;font-weight:700', 2.8) +
        bx(5, 43, 90, 25, esc(e.headline).toUpperCase(), `${H}line-height:.92`, 11) +
        bx(6, 69, 88, 10, esc(e.sub), 'font-style:italic;font-weight:500', 3.6) +
        bx(0, 81, 100, 14, `<span class="fitx" style="${H}">${esc(e.small)}</span>`, 'background:var(--ink);color:var(--bg);display:flex;align-items:center;justify-content:center')
    }
    case 'hero': { // one giant picture, the words kept small (luxury, tech)
      const glow = (cx: number, cy: number): string => bx(0, 0, 100, 100, '', `background:radial-gradient(circle at ${cx}% ${cy}%, color-mix(in srgb, var(--acc) 28%, var(--bg)), var(--bg) 62%)`)
      const quiet = `font-family:${f};font-weight:400;letter-spacing:.3em`
      return wide
        ? glow(flip ? 75 : 25, 50) + art(e, flip ? 56 : 4, 5, 40, 90, 'var(--acc)', flip) +
          bx(flip ? 5 : 49, 18, 46, 38, esc(e.headline), H, 24) + bx(flip ? 5 : 49, 58, 46, 16, esc(e.sub), 'font-weight:500;opacity:.85', 10) +
          bx(flip ? 5 : 49, 78, 46, 14, esc(e.brand), quiet, 10)
        : glow(50, 38) + art(e, 9, 5, 82, 62, 'var(--acc)', flip) +
          bx(8, 69, 84, 11, esc(e.headline), `${H}text-align:center`, 5.5) + bx(8, 80, 84, 7, esc(e.sub), 'font-weight:500;opacity:.85;text-align:center', 3) +
          bx(8, 89, 56, 7, esc(e.brand), quiet, 3.6) + bx(66, 89, 28, 7, esc(e.small), 'text-align:right;opacity:.7', 2.2)
    }
    case 'quote': { // a testimonial, big, in a serif, between the set's own quotation marks
      // (the copy sometimes brings its own marks: off, so there is one pair)
      const bare = e.headline.replace(/^[\s«»“”"']+|[\s«»“”"']+$/g, '')
      const [lq, rq] = LANG === 'paris' ? ['« ', ' »'] : ['“', '”']
      const q = `font-family:Georgia,Baskerville,serif;font-style:italic;font-weight:400;line-height:1.08`
      const mark = (l: number, t: number, sz: number): string => bx(l, t, 30, 30, LANG === 'paris' ? '«' : '“', `font-family:Georgia,serif;font-size:${sz}em;color:var(--acc);line-height:1;opacity:.22`)
      return wide
        ? mark(2, -12, 70) + bx(14, 8, 62, 58, esc(lq + bare + rq), q, 30) + bx(14, 68, 62, 14, esc(e.sub), 'font-weight:600;color:var(--acc)', 10) +
          bx(78, 0, 22, 100, '', 'background:var(--acc)') + art(e, 80, 14, 18, 44, 'var(--bg)') + bx(79, 64, 20, 30, esc(e.brand), `${H}color:var(--bg);text-align:center`, 10)
        : mark(4, -4, 40) + bx(8, 14, 84, 50, esc(lq + bare + rq), q, 11) + bx(8, 65, 84, 9, esc(e.sub), 'font-weight:600;color:var(--acc)', 3.6) +
          art(e, 8, 76, 18, 14, 'var(--acc)') + bx(30, 76, 64, 14, esc(e.brand), `${H}text-align:right`, 6) +
          bx(0, 93, 100, 7, esc(e.small), 'background:var(--acc);color:var(--bg);text-align:center;font-weight:600', 2.4)
    }
    case 'gig': { // a xeroxed show bill on loud paper: the venue in a black band, the act huge and askew, the art in coarse dots
      const tilt = ((r % 7) - 3) * 1.2
      return bx(0, 0, 100, 100, '', 'box-shadow:inset 0 0 14px rgba(0,0,0,.35)') +
        bx(0, 3, 100, 11, esc(e.brand).toUpperCase(), `${H}background:var(--ink);color:var(--bg);text-align:center;letter-spacing:.05em`, 7) +
        bx(4, 15, 92, 28, esc(e.headline).toUpperCase(), `font-family:${FONTS.black};font-weight:900;line-height:.9;text-align:center;transform:rotate(${tilt}deg)`, 16) +
        art(e, 22, 43, 56, 28, 'var(--ink)', flip) +
        bx(22, 43, 56, 28, '', 'background:radial-gradient(var(--bg) 28%, transparent 32%) 0 0/3px 3px;mix-blend-mode:screen;opacity:.55') +
        bx(5, 72, 90, 13, esc(e.sub), `font-family:${FONTS.condensed};font-weight:700;text-align:center;color:var(--acc)`, 5.5) +
        bx(5, 86, 90, 11, esc(e.small), `font-family:${FONTS.black};font-weight:900;text-align:center`, 7)
    }
    case 'lost': { // LOST / PERDU: the word in red, the snapshot in its frame, the name, the plea
      return bx(46, -2, 10, 6, '', 'background:#bbb;transform:rotate(3deg)') +
        bx(4, 3, 92, 19, esc(e.headline).toUpperCase(), `font-family:${FONTS.black};font-weight:900;color:var(--acc);text-align:center;line-height:.95`, 16) +
        bx(16, 23, 68, 34, '', 'background:color-mix(in srgb, var(--ink) 12%, var(--bg));border:2px solid var(--ink)') +
        art(e, 22, 25, 56, 30, 'var(--ink)', flip) +
        bx(6, 58, 88, 10, esc(e.brand).toUpperCase(), `${H}text-align:center`, 7) +
        bx(7, 68, 86, 19, esc(e.sub), `font-family:${f};text-align:center`, 4.6) +
        bx(6, 88, 88, 9, esc(e.small), 'font-weight:800;text-align:center;border-top:1px dashed var(--ink)', 4.4)
    }
    case 'notice': { // a typed notice in its ruled frame, a strip of tape across the head
      return bx(4, 4, 92, 92, '', 'border:1.5px double var(--ink)') +
        bx(34, -3, 32, 8, '', 'background:rgba(255,250,210,.6);transform:rotate(-5deg)') +
        bx(9, 7, 82, 8, esc(e.brand), `font-family:${FONTS.mono};letter-spacing:.06em;text-align:center;opacity:.8`, 3.4) +
        bx(9, 16, 82, 15, esc(e.headline).toUpperCase(), `font-family:${FONTS.mono};font-weight:800;text-align:center;text-decoration:underline;color:var(--acc)`, 8) +
        bx(10, 33, 80, 50, esc(e.sub), `font-family:${FONTS.mono};line-height:1.15`, 5.5) +
        bx(10, 84, 80, 8, esc(e.small), `font-family:${FONTS.mono};font-style:italic;text-align:right`, 3.4)
    }
    default: { // the flyer: a photocopied sheet, hand-lettered, tear-off tabs along the foot
      const tabs = Array.from({ length: 7 }, (_, i) => bx(i * (100 / 7), 76, 100 / 7, 24,
        `<span style="writing-mode:vertical-rl;font-size:7px;font-family:Menlo,monospace">${esc(e.small)}</span>`,
        `border-left:${i ? '1px dashed #999' : 'none'};display:flex;justify-content:center;overflow:hidden;transform:translateY(${(hash(e.id + i) % 3)}px) rotate(${(hash(e.id + i) % 5) - 2}deg)`)).join('')
      return bx(-5, -5, 110, 110, '', `background:radial-gradient(circle at ${r % 100}% ${(r >> 8) % 100}%, transparent 40%, rgba(0,0,0,.08));`) +
        `<div class="b" style="left:0;top:0;width:100%;height:100%;transform:rotate(${((r % 5) - 2) * 0.6}deg)">` +
        bx(6, 4, 88, 18, esc(e.headline), `font-family:${FONTS.hand};font-weight:700;color:#141414;text-align:center;justify-content:safe center`, 9) +
        art(e, 32, 23, 36, 25, e.palette[2]) +
        bx(7, 50, 86, 25, esc(e.sub), `font-family:${FONTS.hand};color:#222;text-align:center;justify-content:safe center`, 5.5) + tabs + '</div>'
    }
  }
}

function page(entries: Entry[], rects: Record<AfficheFamily, AfficheRect[]>, height: number): string {
  const seen: Record<AfficheFamily, number> = { portrait: 0, landscape: 0, wide: 0, flyer: 0 }
  const cards = entries.map((e) => {
    const rc = rects[e.family][seen[e.family]++]
    // (the tear-off sheet is always the copier's white; the other flyers bring their own paper)
    const [bg, ink, acc] = e.layout === 'flyer' ? ['#f2f0e6', '#151515', e.palette[2]] : e.palette
    // (the card drawn over its gutter too, so the gutter is its own ground; the content keeps to the cell)
    return `<div class="card" style="left:${rc.x - GUTTER}px;top:${rc.y - GUTTER}px;padding:${GUTTER}px;--bg:${bg};--ink:${ink};--acc:${acc};background:${bg};color:${ink}">
      <div class="in" style="width:${rc.w}px;height:${rc.h}px;font-size:${rc.h / 100}px;font-family:${FONTS[e.font] ?? FONTS.sans}">${card(e)}</div></div>`
  }).join('\n')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:${PAGE_W}px;height:${height}px;background:#777;overflow:hidden}
    .card{position:absolute;overflow:hidden}
    .in{position:relative;overflow:hidden}
    .b{position:absolute;display:flex;flex-direction:column;justify-content:safe center;overflow:hidden;line-height:1.05;word-break:normal;overflow-wrap:normal;hyphens:none}
    .b svg{width:100%;height:100%}
    .sm{font-size:max(7px,2.4em);opacity:.85;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:clip;flex:1}
    .fitx{white-space:nowrap;font-size:6em}
  </style></head><body>${cards}</body></html>`
}

/** each fitted box: from its largest size down until the text fits the box (the page's own script) */
const FIT = `(() => {
  for (const el of document.querySelectorAll('.fit')) {
    const unit = parseFloat(getComputedStyle(el.closest('.in')).fontSize)
    let s = parseFloat(el.dataset.max) * unit
    el.style.fontSize = s + 'px'
    while (s > 5 && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) { s *= 0.94; el.style.fontSize = s + 'px' }
    // (words never break mid-word unless even the smallest size cannot hold one)
    if (el.scrollWidth > el.clientWidth + 1) el.style.overflowWrap = 'anywhere'
  }
  for (const el of document.querySelectorAll('.fitx')) {
    const box = el.parentElement
    let s = box.clientHeight * 0.6
    el.style.fontSize = s + 'px'
    const room = () => box.clientWidth * (el.nextElementSibling ? 0.62 : 0.92)
    while (s > 5 && el.scrollWidth > room()) { s *= 0.94; el.style.fontSize = s + 'px' }
  }
})()`

const sets = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const out = resolve('public/affiches')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
for (const set of sets.length ? sets : ['paris', 'sf']) {
  LANG = set
  const entries = JSON.parse(readFileSync(resolve(`src/city/affiches/${set}.json`), 'utf8')) as Entry[]
  const counts = Object.fromEntries(FAMILIES.map((f) => [f, entries.filter((e) => e.family === f).length])) as Record<AfficheFamily, number>
  const { rects, height } = packAffiches(counts)
  const pg = await browser.newPage({ viewport: { width: PAGE_W, height } })
  await pg.setContent(page(entries, rects, height))
  await pg.evaluate(() => document.fonts.ready)
  await pg.evaluate(FIT)
  const png = await pg.screenshot({ type: 'png' })
  await pg.close()
  await sharp(png).webp({ quality: 90 }).toFile(`${out}/${set}.webp`)
  if (process.env.AFFICHE_PREVIEW) await sharp(png).resize(Math.round(PAGE_W / 2)).png().toFile(`${out}/${set}-preview.png`)
  console.log(`${set}: ${entries.length} ads, ${JSON.stringify(counts)}, page ${PAGE_W}×${height}`)
}
await browser.close()
