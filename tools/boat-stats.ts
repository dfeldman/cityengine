/**
 * Why the port boats (render/boats.ts, render/paris/ports.ts) were or were not placed round a point: loads the
 * city there and prints window.__boatStats (slots, placed, and each reason one was skipped).
 *   node --experimental-strip-types tools/boat-stats.ts --city=paris-centre --at=1649,-1117
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { Projection } from '../src/city/geo.ts'

const arg = (n: string, f = ''): string => process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? f
const city = arg('city', 'paris-centre')
const [x, z] = arg('at', '0,0').split(',').map(Number)
const { origin } = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'public', 'cities', city, 'v3', 'index.json'), 'utf8')) as { origin: { lat: number; lon: number } }
const { lat, lon } = new Projection(origin).toLatLon({ x, z })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 400, height: 300 } })
await page.goto(`${process.env.SHOTS_BASE ?? 'http://localhost:5200'}/?city=${city}&at=${lat.toFixed(7)},${lon.toFixed(7)}&freeze=1&dev=1`)
await page.waitForFunction('!!window.__cityIdle && window.__cityIdle()', null, { timeout: 180_000 }).catch(() => {})
await page.waitForTimeout(3000)
console.log(JSON.stringify(await page.evaluate('window.__boatStats')))
await browser.close()
