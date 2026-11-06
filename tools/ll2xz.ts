// lat,lon pairs → the baked city's x,z: node --experimental-strip-types tools/ll2xz.ts <city> lat,lon ...
import { readFileSync } from 'node:fs'
import { Projection } from '../src/city/geo.ts'
const [city, ...pts] = process.argv.slice(2)
const { origin } = JSON.parse(readFileSync(`public/cities/${city}/v3/index.json`, 'utf8'))
const p = new Projection(origin)
for (const s of pts) { const [lat, lon] = s.split(',').map(Number); const q = p.toLocal ? p.toLocal({ lat, lon }) : (p as any).project({ lat, lon }); console.log(s, Math.round(q.x), Math.round(q.z)) }
