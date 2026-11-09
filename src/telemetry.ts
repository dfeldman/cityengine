/**
 * TELEMETRY to beacons (~/beacons, its own repo; the client is copied into src/vendor/beacons). Heartbeats with where the
 * rider is and the frame rate, every loading stage (ui/loading.ts), `ready` once the rider is on the street, uncaught
 * errors, and the B-key bug reports (ui/bugs.ts) with a screenshot. Separate from Dandyhorse: nothing here goes to it.
 *
 * Endpoint: `?beacons=<url>`, else `VITE_BEACONS_URL` at build time, else (dev server only) the local beacons ingest on
 * this host, port 5310. Production builds without VITE_BEACONS_URL send nothing. `?beacons=1` forces the local one;
 * `?beacons=0` turns any endpoint off.
 */
import { Beacons, type BeaconsClient } from './vendor/beacons/beacons.js'

/** heartbeat period, ms (beacons randomises it ±20%) */
export const BEACON_INTERVAL = 15000
/** the dev server's ingest port (beacons src/config.ts BEACONS_INGEST_PORT) */
const DEV_PORT = 5310
/** bug screenshots: width cap and JPEG quality */
const SHOT_WIDTH = 1280
const SHOT_QUALITY = 0.7

type Where = { lat: number; lon: number; alt?: number; street?: string }
let client: BeaconsClient | null = null
let where: (() => Where | null) | null = null
let world = ''
let render: (() => void) | null = null
const options: Record<string, unknown> = {}

function endpoint(params: URLSearchParams): string | null {
  const p = params.get('beacons')
  if (p === '0') return null
  if (p === '1') return `${location.protocol}//${location.hostname}:${DEV_PORT}/v1/beacon`
  if (p && /^https?:\/\//.test(p)) return p
  const built = import.meta.env.VITE_BEACONS_URL as string | undefined
  if (built) return built
  // dev builds default to the local beacons server (UI on :5311), so local debugging needs no flag
  return import.meta.env.DEV ? `${location.protocol}//${location.hostname}:${DEV_PORT}/v1/beacon` : null
}

/** At page start, so the boot's own stages and errors are caught. */
export function startTelemetry(canvas: HTMLCanvasElement, params: URLSearchParams): void {
  const url = endpoint(params)
  if (!url || client) return
  client = Beacons.init({
    endpoint: url, appId: 'cityengine', appVersion: typeof __GIT_REV__ === 'string' ? __GIT_REV__ : 'dev', interval: BEACON_INTERVAL, canvas,
    beforeScreenshot: () => render?.(),
    getState: () => {
      let w: Where | null = null
      try { w = where?.() ?? null } catch { /* a position is a nicety; a heartbeat without one still says the page lives */ }
      return { lat: w?.lat, lon: w?.lon, alt: w?.alt, world, options: { ...options, street: w?.street } }
    },
  })
}

/** What the session is: city, mode, tour or delivery, device, tier, Dandyhorse or not. Merged. */
export function telemetryOptions(o: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null) options[k] = v
  if (typeof o.city === 'string') world = o.city
}

/** the bake stamp, once the city's index has loaded */
export const telemetryBake = (bake: string | undefined): void => { if (bake) client?.setBuild(bake) }
/** where the rider is (game.ts, once the street exists), and how to draw a frame for a screenshot */
export function telemetryWorld(w: () => Where | null, draw: () => void): void { where = w; render = draw }

export const telemetryEvent = (name: string, extra?: unknown): void => client?.event(name, extra)
export const telemetryReady = (extra?: unknown): void => client?.ready(extra)

/** a bug report, pinned to the spot it is about rather than the rider */
export function telemetryBug(text: string, at: { lat: number; lon: number; alt?: number }, extra: unknown): void {
  client?.bug(text, { screenshot: true, category: 'owner', at, extra, maxWidth: SHOT_WIDTH, quality: SHOT_QUALITY })
    .catch((e: unknown) => console.warn('beacons: bug not sent', e))
}
