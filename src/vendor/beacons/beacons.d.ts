export interface BeaconState {
  lat?: number; lon?: number; alt?: number; world?: string
  params?: Record<string, unknown>; options?: Record<string, unknown>
}
export interface BeaconsOptions {
  endpoint: string; appId: string; appVersion?: string; buildId?: string
  interval?: number; maxQueue?: number; captureErrors?: boolean; measureFps?: boolean
  canvas?: HTMLCanvasElement; gpu?: string; sessionKey?: string
  userId?: string | (() => string | undefined)
  getState?: () => BeaconState
  getFps?: () => { fps?: number; p95?: number }
  beforeScreenshot?: () => unknown
}
export interface BugOptions {
  screenshot?: boolean; category?: string; extra?: unknown
  at?: { lat: number; lon: number; alt?: number }
  quality?: number; maxWidth?: number
}
export interface BeaconsClient {
  sessionKey: string
  event(name: string, extra?: unknown): void
  ready(extra?: unknown): void
  error(name: string, extra?: unknown): void
  bug(text: string, opts?: BugOptions): Promise<number[]>
  setBuild(id: string | undefined): void
  flush(useBeacon?: boolean): Promise<void>
  stop(): void
}
export const Beacons: { init(opts: BeaconsOptions): BeaconsClient }
