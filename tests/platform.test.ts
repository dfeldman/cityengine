import { describe, expect, it } from 'vitest'
import type { GameState, StartPayload } from '@dandyhorse/gamekit'
import { Platform, type GameLink } from '../src/platform.ts'

const start = (over: Partial<StartPayload> = {}): StartPayload => ({
  sessionId: 's1', gameId: 'streetrunner', variant: 'bike', gameVersion: '0.1.0', seed: 1, requestedDuration: 1800,
  username: 'u', uid: 1, debug: false, deviceType: 'bike', unitSystem: 'metric', timeZone: 'UTC', bodyData: {},
  achievements: {}, options: { city: 'paris-marais', traffic: 'busy' }, preferences: { global: {}, device: {}, game: {} },
  saveState: { cities: { 'paris-marais': { at: { lat: 48.857, lon: 2.362 }, travelled: 1200, visited: [5, 6] } } },
  serverTime: 0, ...over,
})
const metric = (actual: number | null) => ({ requested: null, commanded: null, actual })
const state = (over: Partial<GameState> = {}): GameState => ({
  sessionId: 's1', sessionStatus: 'active', endReason: null, seq: 1, serverTime: 0, elapsed: 10, requestedDuration: 1800,
  pause: null, pausedSeconds: 0, activeSeconds: 10, position: null, distance: null, energy: null, work: null, input: null,
  inputs: [], requestedInput: null, bridges: [], owner: { fitness: null, hrm: null }, devicePreferences: {}, custom: null,
  speed: metric(8.1), incline: metric(null), cadence: metric(88), power: metric(212), grade: metric(null), wind: metric(null),
  crr: metric(null), cw: metric(null), heartRate: metric(141), ...over,
} as GameState)
const link = (): GameLink => ({
  city: 'paris-marais', streets: 100, grade: () => 0.04, speed: () => 7.5, travelled: () => 300,
  where: () => ({ x: 10, y: 35, z: -20, lat: 48.8571, lon: 2.3621, edge: 7, street: 'Rue Pavée' }),
  screenshot: async () => null,
})
// the parts under test are private: the tick body and the answer handler, as the SessionClient calls them
type Inside = {
  buildTick(): Record<string, unknown>; onAnswer(a: unknown): void; latest: GameState | null; receivedAt: number; client: { paused: boolean }; link: GameLink | null
  measured: Platform['measured']; steering: Platform['steering']; request: Platform['request']
}

describe('Street Runner on Dandyhorse (src/platform.ts)', () => {
  it('reads the launch: city, options, device, and where the rider left off', () => {
    const p = new Platform(start(), () => {})
    expect(p.city).toBe('paris-marais')
    expect(p.traffic).toBe('busy')
    expect(p.time).toBe('day')
    expect(p.device).toBe('bike')
    expect(p.resumeAt('paris-marais')).toEqual({ lat: 48.857, lon: 2.362 })
    expect(p.resumeAt('chicago-loop')).toBeNull()
  })

  it('measures what the machine measured, and nothing once the reading is stale', () => {
    const p = new Platform(start(), () => {}) as unknown as Inside
    expect(p.measured().power).toBeNull()
    p.latest = state()
    p.receivedAt = Date.now()
    expect(p.measured()).toEqual({ power: 212, speed: 8.1, cadence: 88, heartRate: 141 })
    p.receivedAt = Date.now() - 5000
    expect(p.measured().power).toBeNull()
  })

  it('turns the d-pad into steering: left, right, up = straight, down = turn round', () => {
    const p = new Platform(start(), () => {}) as unknown as Inside
    for (const choice of ['left', 'up', 'right', 'down', 'select']) p.onAnswer({ promptId: 'steer', choice, t: 1, source: 'bridge:x' })
    p.onAnswer({ promptId: 'other', choice: 'left', t: 2, source: 'bridge:x' })
    expect(p.steering()).toEqual(['left', 'straight', 'right', 'back'])
    expect(p.steering()).toEqual([])
  })

  it('asks a bike for the grade with its virtual speed, and a treadmill for incline only, never below flat', () => {
    const bike = new Platform(start(), () => {}) as unknown as Inside
    bike.link = link()
    bike.request(6)
    let b: Record<string, unknown> = {}
    for (let i = 0; i < 12; i++) b = bike.buildTick()
    expect(b.grade).toBeCloseTo(6, 0)
    expect(b.speed).toBe(7.5)
    expect(b.incline).toBeUndefined()
    expect([b.x, b.y, b.z]).toEqual([10, 35, -20])
    expect(b.route).toBe('paris-marais')

    const run = new Platform(start({ deviceType: 'treadmill', variant: 'run' }), () => {}) as unknown as Inside
    run.link = link()
    run.request(-5)
    for (let i = 0; i < 12; i++) b = run.buildTick()
    expect(b.incline).toBe(0)
    expect(b.grade).toBeUndefined()
    expect(b.speed).toBeUndefined()
  })

  it('eases the request to nothing while paused', () => {
    const p = new Platform(start(), () => {}) as unknown as Inside
    p.link = link()
    p.request(8)
    for (let i = 0; i < 12; i++) p.buildTick()
    Object.defineProperty(p.client, 'paused', { get: () => true })
    let b: Record<string, unknown> = {}
    for (let i = 0; i < 20; i++) b = p.buildTick()
    expect(b.grade as number).toBeLessThan(0.3)
  })

  it('earns "your own way" on the first turn asked for, once', () => {
    const p = new Platform(start(), () => {}) as unknown as Inside
    p.link = link()
    p.onAnswer({ promptId: 'steer', choice: 'left', t: 1, source: 'game' })
    p.onAnswer({ promptId: 'steer', choice: 'right', t: 2, source: 'game' })
    expect(p.buildTick().achievements).toEqual(['first-turn'])
    expect(p.buildTick().achievements).toBeUndefined()
  })
})
