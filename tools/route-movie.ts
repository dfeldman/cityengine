/**
 * A whole route as a two-minute film, so the city can be REVIEWED rather than spot-checked.
 *
 * Contact sheets (tools/shots.ts, tools/views.ts) show the places you already suspected. Most of what is
 * wrong with a city — a street that dives into the terrain, a block of grey boxes where the facades did not
 * arrive, a junction the rider takes at a crawl, a landmark that pops in ten metres away — is only visible
 * from the saddle, and nobody is going to sit through a forty-minute ride to find it. So: ride the route for
 * real, photograph it every couple of seconds of IN-GAME time, and hand back one file to watch.
 *
 *   npm run movie -- --city=san-francisco --route=Embarcadero
 *   npm run movie -- --city=san-francisco --route="Golden Gate Park" --mode=run --interval=3
 *   npm run movie -- --city=paris-centre --to=48.8584,2.2945          one destination instead of a route
 *
 * It is the REAL GAME. Not a camera flown along a line: the actual rider, on the actual ride graph, steered
 * by the game's own GPS, braking into the game's own corners, streaming the same tiles a player streams. The
 * route is picked from the game's own `select.sr-routes` menu (src/city/scenic.ts), which is the same thing a
 * player clicks. If the movie looks right, the ride is right; there is no second renderer to disagree with.
 *
 * WHY THE SECONDS ARE THE GAME'S, NOT THE CLOCK'S. `dt` in the render loop is clamped to 0.1 s, so whenever a
 * headless Chromium drops below ten frames a second the rider lives in slow motion and wall-clock time stops
 * being ride time. On the machine this was written on the two matched within seconds (14m15 of waiting for a
 * 14m18 ride), but that is a property of the machine, not of the tool. Frames are therefore taken on
 * `window.__clock()`, which counts the seconds the ride model was actually stepped (added to src/game.ts for
 * this tool) and so is the route's elapsed time in the sense a rider would mean it. Both are reported; only
 * the in-game one says anything about the city.
 *
 * THE CAPTION, AND WHY IT SAYS TWO NUMBERS. Every frame is captioned with the rider's lat/lon and BOTH clocks:
 * `t=365s` is in-game elapsed, `clip 24.3s` is where the mp4's own scrubber will be. They are different by the
 * time-lapse factor and there is no honest way to collapse them, so both are drawn. Report a bug by the
 * in-game number — that is the one `--at=` takes:
 *
 *     npm run movie …  →  frame captioned "t=365s · 37.802901, -122.448400"
 *     node --experimental-strip-types tools/ride-shot.ts --city=san-francisco --at=37.802901,-122.448400
 *
 * The same thing lands in the JSON sidecar beside the movie, one row per frame, which survives the frames
 * themselves: the JPEGs are deleted on success (a route is hundreds of megabytes of stills and the point
 * was to produce ONE file), so the sidecar is all that makes a position recoverable a week later.
 *
 * GOTCHAS, all of them paid for:
 *  - Playwright, never the desktop app's browser pane. That pane stops delivering animation frames while it
 *    is hidden and a WebGL canvas captured from it comes back blank or half-drawn — an entire movie of black
 *    rectangles, which is how this note got written.
 *  - Wait for `__cityIdle()` before the first frame or the film opens on the loading overlay and a city with
 *    no buildings in it.
 *  - ffmpeg: a system ffmpeg gives H.264 mp4. If there is none, Playwright ships one for its own video
 *    recording and we fall back to it — but that build is libvpx-only and has no image2 DEMUXER, so frames
 *    are piped in as image2pipe and the output is VP8 `.webm`. It also has no image ENCODER, so it cannot
 *    pull a still back out of the film; use `--keep-frames` when you want to look at one.
 *  - The pace is set through the GAME'S OWN keys. `src/controls.ts` starts a bike at 180 W and a treadmill
 *    belt at 2.8 m/s; the tool presses Arrow Up/Down to reach `--kmh` (20 riding, 11 running by default, both
 *    inside the owner's realistic window), so there is no new input path and the movie shows a rider a real
 *    machine could be driving, working harder up the hills (see `holdPace`). Note 180 W in this model is
 *    33 km/h, not the 16 km/h the HUD's own arrival estimate assumes — see `wattsFor` below.
 *  - Vite's HMR will reload the page out from under a long ride. The socket is stubbed; see below.
 *  - A route that cannot be ridden (an unreachable waypoint, a dead end the GPS will not leave) stalls. The
 *    stall guard gives up after 45 s of in-game time with no metres covered and KEEPS the frames, so you can
 *    see where it stopped.
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync, readdirSync, createReadStream, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { homedir } from 'node:os'
import sharp from 'sharp'
import { CRR, DEFAULTS } from '../src/sim/ride.ts'
import { SCENIC } from '../src/city/scenic.ts'
import { shippedDir } from './bake-files.ts'

const arg = (name: string, fallback = ''): string => {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const num = (name: string, fallback: number): number => {
  const v = arg(name)
  return v === '' ? fallback : Number(v)
}

const BASE = process.env.SHOTS_BASE ?? `http://localhost:${arg('port', '5200')}`
const city = arg('city', 'san-francisco')
const mode = arg('mode', 'bike') === 'run' ? 'run' : 'bike'
const device = mode === 'run' ? 'treadmill' : 'bike'
/** seconds of IN-GAME time between frames; the owner's window is 1–5 */
const interval = Math.max(0.25, num('interval', 2))
const fps = num('fps', 14)
const W = num('width', 1280)
const H = num('height', 720)
const maxMinutes = num('max', 90)
const keepFrames = process.argv.includes('--keep-frames')

/** A system ffmpeg if there is one, else Playwright's bundled (VP8-only) build, else nothing. */
function findFfmpeg(): { bin: string; h264: boolean } | null {
  try {
    const bin = execFileSync('which', ['ffmpeg'], { encoding: 'utf8' }).trim()
    if (bin) return { bin, h264: true }
  } catch { /* no system ffmpeg */ }
  const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright')
  if (existsSync(cache)) {
    for (const d of readdirSync(cache).filter((n) => n.startsWith('ffmpeg-')).sort().reverse()) {
      for (const n of ['ffmpeg-mac', 'ffmpeg-linux', 'ffmpeg-win64.exe']) {
        const p = join(cache, d, n)
        if (existsSync(p)) return { bin: p, h264: false }
      }
    }
  }
  return null
}

/**
 * The target pace, and why it is a SPEED rather than the game's default watts. A bike left on `LocalControls`'
 * 180 W holds 33 km/h on the flat in this model (CdA 0.36 is a fairly slippery rider) — a racer, not the
 * 15–25 km/h the movie is meant to show. So the tool asks for a speed and solves the ride model's own
 * steady-state equation, with the ride model's own constants, for the watts that hold it:
 *
 *     P·η = ½·ρ·CdA·v³ + Crr·m·g·v          (flat, no wind: src/sim/ride.ts)
 *
 * That is the flat wattage only: hills are handled by `holdPace` below, which works the rider up them the way
 * a person would. `--watts=` pins a wattage instead, and turns the nudging off with it.
 */
const kmh = num('kmh', mode === 'bike' ? 20 : 11)
const wattsFor = (target: number): number => {
  const v = target / 3.6
  const m = DEFAULTS.riderMassKg + DEFAULTS.bikeMassKg
  return (0.5 * 1.225 * DEFAULTS.cdA * v ** 3 + CRR.asphalt * m * 9.81 * v) / DEFAULTS.drivetrain
}

/** `&at=` for the first stop of the route `--route` names, or null when nothing matches (the page will say). */
function firstWaypoint(): string | null {
  try {
    const index = JSON.parse(readFileSync(resolve(shippedDir(city), 'index.json'), 'utf8')) as { region?: string }
    const want = arg('route').toLowerCase()
    const r = (SCENIC[index.region ?? ''] ?? []).find((q) => q.name.toLowerCase().includes(want))
    return r ? `&at=${r.waypoints[0][0]},${r.waypoints[0][1]}` : null
  } catch { return null }
}

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

interface FrameRow { i: number; file: string; seconds: number; clip: number; lat: number; lon: number; km: number }

async function main(): Promise<void> {
  const ff = findFfmpeg()
  if (!ff) {
    console.error('No ffmpeg. Install one (`brew install ffmpeg`) — the frames cannot be made into a movie without it.')
    process.exit(2)
  }
  if (!ff.h264) console.warn(`No system ffmpeg; using Playwright's bundled build (${ff.bin}) — the output will be VP8 .webm, not H.264 .mp4.`)

  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.error('  page threw:', e.message))
  /*
   * HMR OFF, or the film ends after a minute. Vite pre-bundles dependencies LAZILY: the first time the ride
   * reaches weather, or water, or a shader Babylon imports on demand, Vite optimizes the new dep and sends a
   * full-reload — which drops the rider back at the start of the city with no route, and takes `__clock` with
   * it ("window.__clock is not a function", twice, before this was understood). Stubbing out the socket the
   * Vite client opens leaves the page exactly as it loaded, for as long as the route takes.
   */
  await page.addInitScript(`(() => {
    const W = window.WebSocket
    window.WebSocket = function (url, protocols) {
      const p = Array.isArray(protocols) ? protocols : protocols ? [protocols] : []
      if (p.includes('vite-hmr')) return { addEventListener() {}, removeEventListener() {}, send() {}, close() {}, readyState: 3 }
      return new W(url, protocols)
    }
  })()`)

  /*
   * START AT THE ROUTE'S FIRST STOP. The game drops the rider at the city's own start, and picking a route
   * from the menu makes the GPS ride them to stop 1 from wherever they happen to be — 845 m of Marais, 1964 m
   * of getting to the Ferry Building — which is film nobody asked for and, worse, minutes of "route time"
   * that are not the route. So the first waypoint is looked up here (the same way tools/check-scenic.ts does
   * it: the region from the baked index, the route from src/city/scenic.ts) and handed to `?at=`, which puts
   * the rider on the rideable street nearest it. The game's own `route.length < 20` check then advances to
   * stop 2 straight away, and the clock starts on the route proper.
   */
  const first = arg('route') && !arg('at') ? firstWaypoint() : null
  const url = `${BASE}/?city=${city}&device=${device}${first ?? (arg('at') ? `&at=${arg('at')}` : '')}${arg('extra')}`
  console.log(`opening ${url}`)
  await page.goto(url)
  await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 240_000 })
  await page.waitForFunction('window.treesReady === true', null, { timeout: 180_000 }).catch(() => console.warn('(vegetation still loading)'))
  // the streets round the rider built: otherwise the film opens on an empty plain
  await page.waitForFunction('window.__cityIdle && window.__cityIdle() === true', null, { timeout: 180_000 }).catch(() => console.warn('(city never went idle)'))
  await page.waitForTimeout(1500)

  // the pace, set through the game's own keys (src/controls.ts): each ArrowUp/Down is 15 W or 0.15 m/s
  let watts = arg('watts') ? num('watts', 180) : Math.round(wattsFor(kmh) / 15) * 15
  const steps = mode === 'bike' ? Math.round((watts - 180) / 15) : Math.round((kmh / 3.6 - 2.8) / 0.15)
  for (let i = 0; i < Math.abs(steps); i++) await page.keyboard.press(steps > 0 ? 'ArrowUp' : 'ArrowDown')
  watts = 180 + steps * 15
  const pace = mode === 'bike' ? `${watts} W on the flat, harder uphill (target ${kmh} km/h)` : `${kmh} km/h belt`
  console.log(`pace: ${pace}`)
  /**
   * A rider who WORKS UP THE HILLS. The flat wattage that holds 20 km/h is about 60 W in this model, and 60 W
   * does not climb: on a 12.5% ramp out of the Marais the first version of this tool sat at 0.0 km/h until the
   * stall guard gave up on it, which is not a bug in the city and is not what a player would do either. So the
   * tool nudges the game's own arrow keys the way a rider changes effort — up when the hill is winning, back
   * down once the speed is there — between a lazy 45 W and a hard 330 W. It is deliberately slow and coarse
   * (one press per frame): a tight controller would hold a suspiciously constant speed and hide exactly the
   * gradient bugs the film is meant to expose. `--watts=` pins it and turns the nudging off.
   */
  const holdPace = async (speedKmh: number): Promise<void> => {
    if (mode !== 'bike' || arg('watts')) return
    if (speedKmh < kmh * 0.8 && watts < 330) { await page.keyboard.press('ArrowUp'); watts += 15 }
    else if (speedKmh > kmh * 1.15 && watts > 45) { await page.keyboard.press('ArrowDown'); watts -= 15 }
  }

  // the route: the game's own menu, or a single destination through the GPS hook
  let routeName = ''
  if (arg('route')) {
    const want = arg('route').toLowerCase()
    const options = await page.evaluate('[...document.querySelectorAll("select.sr-routes option")].map((o) => o.value).filter(Boolean)') as string[]
    const hit = options.find((o) => o.toLowerCase().includes(want))
    if (!hit) {
      console.error(`no route matching "${arg('route')}" in ${city}. It has:\n${options.map((o) => '  ' + o).join('\n') || '  (none — src/city/scenic.ts has no entry for this region)'}`)
      await browser.close(); process.exit(2)
    }
    await page.selectOption('select.sr-routes', hit)
    routeName = hit
  } else if (arg('to')) {
    const [lat, lon] = arg('to').split(',').map(Number)
    const r = await page.evaluate(`window.__route(${lat}, ${lon})`) as { length: number } | null
    if (!r) { console.error(`nowhere to route to at ${lat}, ${lon}`); await browser.close(); process.exit(2) }
    routeName = `to ${lat}, ${lon}`
  } else {
    console.error('give a route: --route=<part of its name in src/city/scenic.ts> or --to=lat,lon')
    await browser.close(); process.exit(2)
  }
  await page.waitForTimeout(500)
  const startLeft = await page.evaluate('window.__routeLeft()') as number | null
  console.log(`route: ${routeName} — ${mode}, first leg ${startLeft ?? '?'} m`)

  const out = resolve(import.meta.dirname, '..', 'docs', 'shots', 'routes')
  const name = `${city}-${mode}-${slug(routeName)}`
  const frames = resolve(out, `${name}-frames`)
  await mkdir(frames, { recursive: true })

  const rows: FrameRow[] = []
  const wallStart = Date.now()
  let next = 0
  let stallAt = 0
  let stallKm = -1
  let ended = ''
  for (let i = 0; ; i++) {
    // the NEXT frame's moment, in the ride's own seconds
    await page.waitForFunction(`window.__clock().seconds >= ${next}`, null, { timeout: 300_000 })
    const at = await page.evaluate(`(() => { const c = window.__clock(), h = window.__here().split(","); return { s: c.seconds, km: c.travelled / 1000, speed: c.speed, lat: +h[0], lon: +h[1], left: window.__routeLeft() } })()`) as
      { s: number; km: number; speed: number; lat: number; lon: number; left: number | null }
    const clip = i / fps
    const shot = await page.screenshot({ type: 'jpeg', quality: 86 })
    const file = `f${String(i).padStart(5, '0')}.jpg`
    await writeFile(resolve(frames, file), await caption(shot, at.s, clip, at.lat, at.lon, at.km, at.speed, routeName))
    rows.push({ i, file, seconds: +at.s.toFixed(2), clip: +clip.toFixed(3), lat: at.lat, lon: at.lon, km: +at.km.toFixed(3) })
    if (i % 25 === 0) console.log(`  ${i} frames · t=${Math.round(at.s)}s · ${at.km.toFixed(2)} km · ${(at.speed * 3.6).toFixed(1)} km/h · ${at.left ?? '—'} m left`)
    next = at.s + interval
    await holdPace(at.speed * 3.6)

    // done: the GPS dropped the route (the last stop was reached and cleared)
    if (i > 2 && at.left === null) { ended = 'route complete'; break }
    if (at.s > maxMinutes * 60) { ended = `--max=${maxMinutes} min reached`; break }
    // stalled: no ground covered for 45 s of riding
    if (at.km > stallKm + 0.005) { stallKm = at.km; stallAt = at.s }
    else if (at.s - stallAt > 45) { ended = 'STALLED — the rider stopped covering ground'; break }
  }
  const last = rows[rows.length - 1]
  const wall = (Date.now() - wallStart) / 1000
  await browser.close()

  const mmss = (s: number): string => `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`
  console.log(`\n${ended}`)
  console.log(`  route time (in game): ${mmss(last.seconds)} over ${last.km.toFixed(2)} km — ${(last.km / (last.seconds / 3600)).toFixed(1)} km/h average`)
  console.log(`  render time (wall clock): ${mmss(wall)} — this says nothing about the city`)
  console.log(`  ${rows.length} frames every ${interval}s of ride time → ${(rows.length / fps).toFixed(1)}s of film at ${fps} fps`)

  const movie = resolve(out, `${name}.${ff.h264 ? 'mp4' : 'webm'}`)
  await encode(ff, frames, rows, movie)

  await writeFile(resolve(out, `${name}.json`), JSON.stringify({
    city, mode, route: routeName, movie: movie.split('/').pop(),
    pace,
    intervalSeconds: interval, fps,
    routeSeconds: last.seconds, routeKm: last.km, averageKmh: +(last.km / (last.seconds / 3600)).toFixed(2),
    wallClockSeconds: +wall.toFixed(1), endedBecause: ended,
    note: 'seconds = in-game elapsed (the caption\'s t=); clip = seconds into the movie file',
    frames: rows,
  }, null, 1) + '\n')

  if (ended.startsWith('STALLED') || keepFrames) console.log(`  frames kept in ${frames}`)
  else { await rm(frames, { recursive: true, force: true }); console.log('  frames deleted') }
  console.log(`\n${movie}`)
  if (ended.startsWith('STALLED')) process.exit(1)
}

/** The caption bar: where the rider is and when, burnt in, so a bug seen in the film can be gone back to. */
async function caption(jpeg: Buffer, seconds: number, clip: number, lat: number, lon: number, km: number, speed: number, route: string): Promise<Buffer> {
  const esc = (t: string): string => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const left = `t=${Math.round(seconds)}s  ·  clip ${clip.toFixed(1)}s  ·  ${lat.toFixed(6)}, ${lon.toFixed(6)}`
  const right = `${km.toFixed(2)} km  ·  ${(speed * 3.6).toFixed(0)} km/h`
  const bar = 34
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`
    + `<rect x="0" y="${H - bar}" width="${W}" height="${bar}" fill="#000" fill-opacity="0.62"/>`
    + `<text x="12" y="${H - 11}" font-family="monospace" font-size="17" fill="#fff">${esc(left)}</text>`
    + `<text x="${W - 12}" y="${H - 11}" text-anchor="end" font-family="monospace" font-size="15" fill="#cfcfcf">${esc(right)}</text>`
    + `<text x="${W / 2}" y="${H - 11}" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#9fd3ff">${esc(route.length > 46 ? route.slice(0, 45) + '…' : route)}</text>`
    + '</svg>'
  return await sharp(jpeg).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 86 }).toBuffer()
}

/**
 * One file out of the stills. A system ffmpeg reads the numbered files directly; the bundled Playwright build
 * has no image2 demuxer, so the JPEGs are concatenated into its stdin as an image2pipe stream instead.
 */
async function encode(ff: { bin: string; h264: boolean }, frames: string, rows: FrameRow[], movie: string): Promise<void> {
  const args = ff.h264
    ? ['-y', '-framerate', String(fps), '-i', join(frames, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-movflags', '+faststart', movie]
    : ['-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', 'pipe:0', '-c:v', 'libvpx', '-b:v', '2M', '-crf', '28', movie]
  const p = spawn(ff.bin, args, { stdio: ['pipe', 'ignore', 'pipe'] })
  // ffmpeg giving up mid-stream closes the pipe; without this the EPIPE is an unhandled 'error' event and
  // the whole tool dies after the ride, which is the most expensive moment to die at
  p.stdin!.on('error', () => {})
  let err = ''
  p.stderr.on('data', (d: Buffer) => { err += d.toString() })
  if (!ff.h264) {
    for (const r of rows) {
      await new Promise<void>((ok, no) => createReadStream(join(frames, r.file)).on('end', () => ok()).on('error', no).pipe(p.stdin!, { end: false }))
    }
    p.stdin!.end()
  } else p.stdin!.end()
  const code = await new Promise<number>((ok) => p.on('close', ok))
  if (code !== 0) { console.error(err.slice(-2000)); throw new Error(`ffmpeg exited ${code} — frames kept in ${frames}`) }
}

await main()
