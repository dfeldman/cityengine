/**
 * Screenshots of the showcase, so a change to the facade generator can be judged rather than guessed at.
 *
 *   npm run shots                     every style, plus the whole street, into docs/shots/<date>/
 *   npm run shots -- --style=brick    eight of one style, to see whether they vary enough
 *   npm run shots -- --out=before     a named folder rather than today's date
 *
 * Playwright rather than the app's own browser pane, because that pane stops delivering animation frames
 * while it is hidden and a WebGL canvas captured from it comes back blank or half-drawn.
 *
 * It drives a dev server that is already running (`npm run dev`), so it photographs whatever is on screen.
 */
import { chromium } from 'playwright'
import { loadCity, spotsFor } from './spots.ts'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
const STYLES = ['haussmann', 'brownstone', 'classical', 'brick', 'bauhaus', 'brutalist', 'skyscraper', 'marais', 'tenement', 'chicago', 'victorian']

const arg = (name: string, fallback = ''): string => {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}

async function main(): Promise<void> {
  const out = resolve(import.meta.dirname, '..', 'docs', 'shots',
    arg('out') || new Date().toISOString().slice(0, 10))
  await mkdir(out, { recursive: true })

  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=metal', '--enable-unsafe-webgpu', '--ignore-gpu-blocklist'],
  })
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
  page.on('console', (m) => { if (m.type() === 'error') console.error('  page error:', m.text()) })
  page.on('pageerror', (e) => console.error('  page threw:', e.message))

  const only = arg('style')
  const ride = arg('city')
  // --spots samples the awkward places: junctions, forks, dead ends — where road rendering actually fails
  const spots = arg('spots') ? spotsFor(loadCity(ride || 'paris-marais'), Number(arg('spots'))) : []
  // --edge=12,345 shoots exactly those edges, for coming back to a place that went wrong
  const edges = arg('edge') ? arg('edge').split(',').map((e) => `spot:${ride || 'paris-marais'}:${e}:edge ${e}`) : []
  const shots = edges.length > 0 ? edges : spots.length > 0
    ? spots.map((s) => `spot:${ride || 'paris-marais'}:${s.edgeId}:${s.why}`)
    : ride ? [`city:${ride}`] : only ? [only] : ['', ...STYLES]
  const stats: Record<string, unknown>[] = []

  for (const style of shots) {
    const isSpot = style.startsWith('spot:')
    const isCity = style.startsWith('city:') || isSpot
    const without = arg('without')
    let url: string
    if (isSpot) {
      const [, city, edge] = style.split(':')
      // frozen: the same frame every time, so two shots differ only by what changed
      url = `${BASE}/?city=${city}&start=${edge}&freeze=1${without ? `&without=${without}` : ''}`
        + (arg('view') ? `&view=${arg('view')}` : '') + (arg('time') ? `&time=${arg('time')}` : '')
        + (arg('weather') ? `&weather=${arg('weather')}` : '') + (arg('q') ? `&q=${arg('q')}` : '')
        + (arg('advance') ? `&advance=${arg('advance')}` : '') + (arg('turn') ? `&turn=${arg('turn')}` : '')
    } else if (isCity) {
      url = `${BASE}/?city=${style.slice(5)}${without ? `&without=${without}` : ''}`
        + (arg('view') ? `&view=${arg('view')}` : '') + (arg('time') ? `&time=${arg('time')}` : '')
        + (arg('weather') ? `&weather=${arg('weather')}` : '') + (arg('q') ? `&q=${arg('q')}` : '')
    } else {
      url = `${BASE}/?showcase=1${style ? `&style=${style}` : ''}`
    }
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(
      isCity ? 'window.gameReady === true' : 'window.showcaseReady === true', null, { timeout: 60_000 })
    // long enough for the tiles AND the avatar: the kit builds a MakeHuman body off the main thread and
    // takes several seconds, and a shot taken before it lands photographs a city with nobody on the bike
    if (isCity) {
      // the rider's own body first, then a few seconds for the tiles, trees and the strangers' bodies
      await page.waitForFunction('window.riderReady === true', null, { timeout: 60_000 }).catch(() =>
        console.error('  rider never became ready'))
      if (!(arg('without') || '').includes('life')) {
        await page.waitForFunction('window.crowdReady === true', null, { timeout: 90_000 }).catch(() =>
          console.error('  crowd never became ready'))
      }
      await page.waitForTimeout(4_000)
    }
    // let textures finish decoding and the first frames settle before capturing
    await page.waitForTimeout(1500)
    const name = isSpot
      ? `spot-${style.split(':')[2]}`
      : (style || 'street').replace(':', '-')
    await page.screenshot({ path: resolve(out, `${name}.png`) })
    const info = await page.evaluate(() => ({
      label: document.getElementById('label')?.textContent ?? '',
      gl: (() => {
        const c = document.createElement('canvas').getContext('webgl2')
        return c ? c.getParameter(c.VERSION) as string : 'none'
      })(),
    }))
    stats.push({ name, ...info })
    console.log(`  ${name}.png — ${isSpot ? style.split(':').slice(3).join(':') : info.label}`)
  }

  await writeFile(resolve(out, 'stats.json'), JSON.stringify(stats, null, 1))
  await browser.close()
  console.log(`\n  ${shots.length} shots in ${out}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
