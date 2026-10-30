/**
 * An aerial photograph of a place, from IGN's public orthophotos (the Géoplateforme's WMS-R, no key; about 20 cm a pixel in
 * Paris), north up and square in the city's local metres, so what is traced from it lands where it is. Downloads are kept in
 * tools/cache/ortho/.
 *
 *   node --experimental-strip-types tools/ortho.ts <lat> <lon> <half-width-m> <out.jpg> [--px=1400]
 *
 * It prints the frame: a pixel (px, py) of the image is lat = north - py / px_per_deg_lat, lon = west + px / px_per_deg_lon.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

const WMS = 'https://data.geopf.fr/wms-r/wms'
const LAYER = 'ORTHOIMAGERY.ORTHOPHOTOS'
const DIR = resolve(import.meta.dirname, 'cache', 'ortho')

const [lat, lon, half] = process.argv.slice(2, 5).map(Number)
const out = process.argv[5]
const px = Number(process.argv.find((a) => a.startsWith('--px='))?.slice(5) ?? 1400)
if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(half) || !out) {
  console.error('usage: tools/ortho.ts <lat> <lon> <half-width-m> <out.jpg> [--px=1400]')
  process.exit(1)
}
const dLat = half / 111320
const dLon = half / (111320 * Math.cos((lat * Math.PI) / 180))
const [south, north, west, east] = [lat - dLat, lat + dLat, lon - dLon, lon + dLon]
const url = `${WMS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${LAYER}&STYLES=&CRS=EPSG:4326`
  + `&BBOX=${south},${west},${north},${east}&WIDTH=${px}&HEIGHT=${px}&FORMAT=image/jpeg`
mkdirSync(DIR, { recursive: true })
const cached = resolve(DIR, `${createHash('sha1').update(url).digest('hex').slice(0, 16)}.jpg`)
if (!existsSync(cached)) {
  const r = await fetch(url)
  const type = r.headers.get('content-type') ?? ''
  if (!r.ok || !type.startsWith('image/')) throw new Error(`ortho: ${r.status} ${type}: ${(await r.text()).slice(0, 200)}`)
  writeFileSync(cached, Buffer.from(await r.arrayBuffer()))
}
copyFileSync(cached, out)
console.log(`${out}: ${px}px, ${((half * 2) / px).toFixed(3)} m/px, north ${north.toFixed(6)} west ${west.toFixed(6)} south ${south.toFixed(6)} east ${east.toFixed(6)}`)
