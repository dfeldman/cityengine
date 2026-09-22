/**
 * Add (or replace) a stored view aimed at a point: the camera `dist` metres away on compass bearing `from`
 * (the direction FROM the target TO the camera), `h` metres above the ground, looking at `look` metres above
 * the target. Saves guessing the camera's lat/lon by hand.
 *   node --experimental-strip-types tools/aim-view.ts --city=paris-centre --name="Madeleine — front" \
 *     --at=48.8700,2.3245 --from=165 --dist=90 --h=3 --look=18
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'paris-centre')
const [lat, lon] = arg('at').split(',').map(Number)
const b = (Number(arg('from', '180')) * Math.PI) / 180
const d = Number(arg('dist', '80'))
const mLat = 111_320
const mLon = 111_320 * Math.cos((lat * Math.PI) / 180)
const from = [Math.round((lat + (Math.cos(b) * d) / mLat) * 1e6) / 1e6, Math.round((lon + (Math.sin(b) * d) / mLon) * 1e6) / 1e6, Number(arg('h', '3'))]
const to = [lat, lon, Number(arg('look', '10'))]
const file = resolve(import.meta.dirname, '..', 'views', `${city}.json`)
const name = arg('name')
const views = (JSON.parse(readFileSync(file, 'utf8')) as { name: string }[]).filter((v) => v.name !== name)
views.push({ name, group: arg('group', 'landmark'), from, to } as never)
writeFileSync(file, JSON.stringify(views, null, 1) + '\n')
console.log(`${name}: from ${from.join(', ')} to ${to.join(', ')}`)
