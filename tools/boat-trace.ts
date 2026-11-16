/**
 * Hand-placing Paris's moored boats from IGN aerials (owner, 2026-11-15: "place manually … use reference images and maps").
 * Three steps per tile of river:
 *
 *   tile    <name> [<lat> <lon> <half-m>] [--px=1400]   an ortho (of tiles.json's tile <name> when no place is given) (tools/ortho.ts's source) with a labelled pixel grid, for tracing
 *   check   <name>                                    the traced boats drawn back on the ortho, to judge the trace
 *   add     <name> [--up=<deg>]                       the trace into src/render/paris/hand-boats.json (replaces that tile's boats)
 *
 * A trace is tools/boat-traces/<name>.txt, a line per boat: `x1 y1 x2 y2 width kind` in the grid image's pixels — the two
 * ends of the boat's long axis and its width across. `--up` is the river's upstream bearing there (degrees clockwise from
 * north): each boat's bow is put at whichever end lies upstream (a line ending `flip` points the other way).
 * Images go to tools/cache/boat-trace/.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import sharp from 'sharp'

const ROOT = resolve(import.meta.dirname, '..')
const CACHE = resolve(ROOT, 'tools', 'cache')
const OUT = resolve(CACHE, 'boat-trace')
const TRACES = resolve(ROOT, 'tools', 'boat-traces')
const JSON_OUT = resolve(ROOT, 'src', 'render', 'paris', 'hand-boats.json')
const WMS = 'https://data.geopf.fr/wms-r/wms'
const LAYER = 'ORTHOIMAGERY.ORTHOPHOTOS'
/** grid spacing in pixels, and the check image's width */
const GRID = 100
const CHECK_PX = Number(process.argv.find((a) => a.startsWith('--w='))?.slice(4) ?? 700)
/** a tile's half-width, m (tiles are tools/boat-traces/tiles.json's centres, 330 m apart along the water) */
const HALF = 200
const tiles = (): { name: string; lat: number; lon: number; up: number }[] => JSON.parse(readFileSync(resolve(TRACES, 'tiles.json'), 'utf8'))
const KINDS = ['peniche', 'dutch', 'cruiser', 'venue', 'tourBoat', 'hotel', 'workBarge', 'pusher', 'pontoon', 'police', 'floatHome']

interface Frame { name: string; lat: number; lon: number; half: number; px: number; north: number; south: number; west: number; east: number }
export interface HandBoat { a: [number, number]; b: [number, number]; w: number; kind: string }
export interface HandTile { name: string; frame: [number, number, number, number]; up: number; boats: HandBoat[] }

const arg = (n: string): string | undefined => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3)
const [cmd, name, ...rest] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
mkdirSync(OUT, { recursive: true })
const framePath = (n: string): string => resolve(OUT, `${n}.frame.json`)

async function ortho(f: Frame): Promise<Buffer> {
  // the same URL and cache key as tools/ortho.ts, so a tile shot there is not fetched twice
  const url = `${WMS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${LAYER}&STYLES=&CRS=EPSG:4326`
    + `&BBOX=${f.south},${f.west},${f.north},${f.east}&WIDTH=${f.px}&HEIGHT=${f.px}&FORMAT=image/jpeg`
  const dir = resolve(CACHE, 'ortho')
  mkdirSync(dir, { recursive: true })
  const cached = resolve(dir, `${createHash('sha1').update(url).digest('hex').slice(0, 16)}.jpg`)
  if (!existsSync(cached)) {
    const r = await fetch(url)
    const type = r.headers.get('content-type') ?? ''
    if (!r.ok || !type.startsWith('image/')) throw new Error(`ortho: ${r.status} ${type}: ${(await r.text()).slice(0, 200)}`)
    writeFileSync(cached, Buffer.from(await r.arrayBuffer()))
  }
  return readFileSync(cached)
}

function traced(n: string): { x1: number; y1: number; x2: number; y2: number; w: number; kind: string; flip: boolean }[] {
  return readFileSync(resolve(TRACES, `${n}.txt`), 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean).map((l) => {
    const [x1, y1, x2, y2, w, kind, flip] = l.split(/[\s,]+/)
    if (!KINDS.includes(kind)) throw new Error(`${n}: unknown kind "${kind}" in "${l}"`)
    return { x1: +x1, y1: +y1, x2: +x2, y2: +y2, w: +w, kind, flip: flip === 'flip' }
  })
}

if (cmd === 'tile') {
  // a tile of tools/boat-traces/tiles.json by its name alone, or anywhere by lat lon half
  const t = tiles().find((t) => t.name === name)
  const [lat, lon, half] = rest.length ? rest.map(Number) : [t!.lat, t!.lon, HALF]
  const px = Number(arg('px') ?? 1400)
  const dLat = half / 111320, dLon = half / (111320 * Math.cos((lat * Math.PI) / 180))
  const f: Frame = { name, lat, lon, half, px, south: lat - dLat, north: lat + dLat, west: lon - dLon, east: lon + dLon }
  const img = await ortho(f)
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}">`
  for (let g = GRID; g < px; g += GRID) {
    svg += `<line x1="${g}" y1="0" x2="${g}" y2="${px}" stroke="#ff0" stroke-opacity="0.45" stroke-width="1"/>`
    svg += `<line x1="0" y1="${g}" x2="${px}" y2="${g}" stroke="#ff0" stroke-opacity="0.45" stroke-width="1"/>`
    svg += `<text x="${g + 2}" y="14" font-size="14" font-family="sans-serif" fill="#ff0" stroke="#000" stroke-width="0.6">${g}</text>`
    svg += `<text x="2" y="${g - 3}" font-size="14" font-family="sans-serif" fill="#ff0" stroke="#000" stroke-width="0.6">${g}</text>`
  }
  svg += '</svg>'
  await sharp(img).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 85 }).toFile(resolve(OUT, `${name}.grid.jpg`))
  writeFileSync(framePath(name), JSON.stringify(f))
  console.log(`${resolve(OUT, `${name}.grid.jpg`)}  ${((half * 2) / px).toFixed(3)} m/px`)
} else if (cmd === 'check') {
  const f = JSON.parse(readFileSync(framePath(name), 'utf8')) as Frame
  const bs = traced(name)
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${f.px}" height="${f.px}">`
  for (const b of bs) {
    const L = Math.hypot(b.x2 - b.x1, b.y2 - b.y1)
    const nx = -(b.y2 - b.y1) / L * b.w / 2, ny = (b.x2 - b.x1) / L * b.w / 2
    const pts = [[b.x1 + nx, b.y1 + ny], [b.x2 + nx, b.y2 + ny], [b.x2 - nx, b.y2 - ny], [b.x1 - nx, b.y1 - ny]].map((p) => p.join(',')).join(' ')
    svg += `<polygon points="${pts}" fill="none" stroke="#f0f" stroke-width="3"/>`
  }
  svg += '</svg>'
  const img = await ortho(f)
  const drawn = await sharp(img).composite([{ input: Buffer.from(svg) }]).toBuffer()
  await sharp(drawn).resize(CHECK_PX).jpeg({ quality: 80 }).toFile(resolve(OUT, `${name}.check.jpg`))
  console.log(`${resolve(OUT, `${name}.check.jpg`)}  ${bs.length} boats`)
} else if (cmd === 'add') {
  const f = JSON.parse(readFileSync(framePath(name), 'utf8')) as Frame
  const up = Number(arg('up') ?? tiles().find((t) => t.name === name)?.up)
  if (!Number.isFinite(up)) throw new Error('add needs --up=<upstream bearing, degrees>')
  const mPerPx = (f.half * 2) / f.px
  const ll = (x: number, y: number): [number, number] => [
    +(f.north - (y / f.px) * (f.north - f.south)).toFixed(7), +(f.west + (x / f.px) * (f.east - f.west)).toFixed(7)]
  const ux = Math.sin((up * Math.PI) / 180), uy = -Math.cos((up * Math.PI) / 180)
  // a boat is the tile's whose centre is nearest its centre, so a boat in two tiles' overlap is placed once
  const others = tiles().filter((t) => t.name !== name)
  const C = Math.cos((f.lat * Math.PI) / 180)
  const mine = (b: { x1: number; y1: number; x2: number; y2: number }): boolean => {
    const [la, lo] = ll((b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2)
    const d = (t: { lat: number; lon: number }): number => Math.hypot(la - t.lat, (lo - t.lon) * C)
    return others.every((t) => d(t) >= d(f))
  }
  const all0 = traced(name)
  const boats: HandBoat[] = all0.filter(mine).map((b) => {
    // b is the bow: the upstream end (image y grows south)
    let fwd = (b.x2 - b.x1) * ux + (b.y2 - b.y1) * uy >= 0
    if (b.flip) fwd = !fwd
    const [s, e] = fwd ? [[b.x1, b.y1], [b.x2, b.y2]] : [[b.x2, b.y2], [b.x1, b.y1]]
    return { a: ll(s[0], s[1]), b: ll(e[0], e[1]), w: +(b.w * mPerPx).toFixed(2), kind: b.kind }
  })
  const all: HandTile[] = existsSync(JSON_OUT) ? JSON.parse(readFileSync(JSON_OUT, 'utf8')) : []
  const tile: HandTile = { name, frame: [f.lat, f.lon, f.half, f.px], up, boats }
  const i = all.findIndex((t) => t.name === name)
  if (i >= 0) all[i] = tile
  else all.push(tile)
  writeFileSync(JSON_OUT, `[\n${all.map((t) => JSON.stringify(t)).join(',\n')}\n]\n`)
  console.log(`${name}: ${boats.length} of ${all0.length} boats → ${JSON_OUT} (${all.reduce((n, t) => n + t.boats.length, 0)} in all)`)
} else {
  console.error('usage: tools/boat-trace.ts tile|check|add <name> …')
  process.exit(1)
}
