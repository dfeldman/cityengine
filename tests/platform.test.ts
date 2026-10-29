import { describe, expect, it } from 'vitest'
import type { GameState, StartPayload } from '@dandyhorse/gamekit'
import { Platform, clip, type GameLink } from '../src/platform.ts'
import { endScreenHtml, clockWords } from '../src/ui/end-screen.ts'

const start = (over: Partial<StartPayload> = {}): StartPayload => ({
  sessionId: 's1', gameId: 'citydash', variant: 'bike', gameVersion: '0.1.0', seed: 1, requestedDuration: 1800,
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

  it('shows an offered delivery on the phone as a menu beside the d-pad, and puts the d-pad back after', () => {
    const p = new Platform(start(), () => {}) as unknown as Inside & {
      offer: Platform['offer']; endOffer: Platform['endOffer']; client: { prompt: { layout?: string; items?: { id: string }[]; countdown?: number | null } | null; requestTick(): Promise<void> }
    }
    p.client.requestTick = async () => {}
    p.link = link()
    let took = 0, skipped = 0
    p.offer('📦 here → there', 12, () => took++, () => skipped++)
    expect(p.client.prompt?.layout).toBe('menu')
    expect(p.client.prompt?.countdown).toBe(12)
    expect(p.client.prompt?.items?.length).toBe(2)
    // the items do what they say; the d-pad still steers while the offer is up
    p.onAnswer({ promptId: 'steer', choice: p.client.prompt!.items![1].id, t: 1, source: 'bridge:x' })
    p.onAnswer({ promptId: 'steer', choice: 'left', t: 2, source: 'bridge:x' })
    expect(skipped).toBe(1)
    expect(took).toBe(0)
    expect(p.steering()).toEqual(['left'])
    p.endOffer()
    expect(p.client.prompt?.layout).toBe('dpad')
    // a late tap on the closed offer does nothing
    p.onAnswer({ promptId: 'steer', choice: 'take', t: 3, source: 'bridge:x' })
    expect(took).toBe(0)
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

  it('offers what can be done now as buttons under the d-pad, and does it by its label (#304)', () => {
    const p = new Platform(start(), () => {}) as unknown as Inside & {
      offer: Platform['offer']; frame: Platform['frame']; refreshPrompt(): void; actions: { id: string; label: string }[]
      client: { prompt: { layout?: string; choices: string[]; items?: { id: string; label: string }[] } | null; requestTick(): Promise<void> }
    }
    p.client.requestTick = async () => {}
    const done: string[] = []
    let acts = [{ id: 'transit', label: '🚋 Board the Powell–Hyde cable car' }, { id: 'map', label: '🗺️ Map' }, { id: 'bad', label: 'left' }]
    p.link = { ...link(), actions: () => acts, act: (id) => done.push(id) }
    p.actions = (p as unknown as { currentActions(): { id: string; label: string }[] }).currentActions()
    p.refreshPrompt()
    expect(p.client.prompt?.layout).toBe('dpad')
    // a d-pad button's name is never an action's label (it would steer)
    expect(p.client.prompt?.choices).toEqual(['left', 'up', 'right', 'down', '🚋 Board the Powell–Hyde cable car', '🗺️ Map'])
    p.onAnswer({ promptId: 'steer', choice: '🗺️ Map', t: 1, source: 'bridge:x' })
    p.onAnswer({ promptId: 'steer', choice: '🚋 Board the Powell–Hyde cable car', t: 2, source: 'bridge:x' })
    p.onAnswer({ promptId: 'steer', choice: 'left', t: 3, source: 'bridge:x' })
    expect(done).toEqual(['map', 'transit'])
    expect(p.steering()).toEqual(['left'])
    // while a delivery is on offer the actions follow its two items in the menu
    p.offer('📦 here → there', 12, () => {}, () => {})
    expect(p.client.prompt?.items?.map((i) => i.id)).toEqual(['take', 'skip', 'act:transit', 'act:map'])
    const rev = (p.client.prompt as unknown as { rev: number }).rev
    p.onAnswer({ promptId: 'steer', choice: 'act:map', rev, t: 4, source: 'bridge:x' })
    // …and a tap aimed at an older list does nothing
    p.onAnswer({ promptId: 'steer', choice: 'act:map', rev: rev - 1, t: 5, source: 'bridge:x' })
    expect(done).toEqual(['map', 'transit', 'map'])
    // the buttons follow what is on offer
    acts = [{ id: 'map', label: '🗺️ Close the map' }]
    ;(p as unknown as { actionsAt: number }).actionsAt = 0
    p.frame()
    expect(p.client.prompt?.items?.map((i) => i.label)).toEqual(['✅ Take it', '⏭️ Skip', '🗺️ Close the map'])
  })

  it('keeps an action short enough for the server, an emoji never cut in half', () => {
    expect(Array.from(clip('🔭 Observe from Transamerica Pyramid, the tall one')).length).toBe(40)
    expect(clip('🗺️ Map')).toBe('🗺️ Map')
  })

  it('draws the end screen: the distance, every job with its stars and dollars, the totals (#303)', () => {
    const html = endScreenHtml({
      travelled: 5230, seconds: 1805, imperial: false, place: 'San Francisco', deliveries: [
        { emoji: '🥟', what: 'Dim sum', from: 'Golden Lantern', to: 'Pine & Taylor', stars: 5, dollars: 9.5, seconds: 300, outcome: 'delivered' },
        { emoji: '🍕', what: 'Pizza', from: 'Slice', to: 'Hyde & Bay', stars: 3, dollars: 6, seconds: 500, outcome: 'delivered' },
        { emoji: '🍰', what: 'Cake', from: 'Tartine', to: '18th & Dolores', stars: 0, dollars: 0, seconds: 0, outcome: 'spoiled' },
      ],
    })
    expect(html).toContain('5.23 km')
    expect(html).toContain('30:05')
    expect(html).toContain('$15.50')          // the session's own earnings
    expect(html).toContain('4.0 ★')           // the average of the rated ones
    expect(html).toContain('Golden Lantern → Pine &amp; Taylor')
    expect(html).toContain('did not survive')
    expect(html.match(/<li/g)?.length).toBe(3)
    expect(endScreenHtml({ travelled: 1609.344, seconds: 60, imperial: true, deliveries: [] })).toContain('1.00 mi')
    expect(clockWords(3725)).toBe('1:02:05')
  })

  it('ends the session from the game (End ride), once, with the tours it finished on the timeline', async () => {
    const p = new Platform(start(), () => {}) as unknown as Inside & {
      endSession: Platform['endSession']
      client: { requestTick(): Promise<void>; end(status: string, reason?: string, extra?: { message?: string }): Promise<void> }
    }
    const ends: { status: string; message?: string }[] = []
    p.client.requestTick = async () => {}
    p.client.end = async (status, _r, extra) => { ends.push({ status, message: extra?.message }) }
    // (before the rider is on the street there is nothing to end from)
    p.endSession()
    p.link = { ...link(), record: () => ({ travelled: 4200, deliveries: [], imperial: false, tours: [{ name: 'Golden Gate Park', stops: 9 }] }) }
    p.endSession()
    p.endSession()
    await new Promise((r) => setTimeout(r, 0))
    expect(ends).toEqual([{ status: 'complete', message: 'Golden Gate Park, toured. 0.3 km of pedalling.' }])
  })

  it('draws a tour session\'s end screen with its tours and no talk of deliveries', () => {
    const html = endScreenHtml({ travelled: 13400, seconds: 2400, imperial: false, deliveries: [], tours: [{ name: 'Golden Gate Park', stops: 9 }] })
    expect(html).toContain('Golden Gate Park')
    expect(html).toContain('9 stops')
    expect(html).not.toContain('deliveries')
    expect(html).not.toContain('earned')
    expect(endScreenHtml({ travelled: 100, seconds: 60, imperial: false, deliveries: [], tours: [] })).toContain('No tour finished')
  })
})
