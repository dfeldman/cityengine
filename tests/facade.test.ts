/**
 * What these pin is not "the code runs" but the three properties that decide whether a street looks real.
 * Every one of them is a thing that, when it breaks, makes a city look generated — and none of them is
 * visible in a screenshot of a single building.
 */
import { describe, expect, it } from 'vitest'
import { MIN_BAY, STYLES, chooseStyle, planFacade, planWall, style } from '../src/city/facade.ts'

/** a street wall of a building whose dressing (facade.ts Dress) puts shops all along it, where the style dresses at all */
const STREET = { pavement: 3 }
const allShops = (p: ReturnType<typeof planFacade>): ReturnType<typeof planFacade> =>
  p.dress ? { ...p, dress: { ...p.dress, shops: 'all' } } : p

const CITY = [
  { id: 'brick' as const, weight: 3 },
  { id: 'brownstone' as const, weight: 2 },
  { id: 'haussmann' as const, weight: 1 },
]

describe('the style table', () => {
  it('has every style the game names, each with palettes and a sane level range', () => {
    expect(STYLES.map((s) => s.id).sort()).toEqual(
      ['bauhaus', 'brick', 'brownstone', 'brutalist', 'chicago', 'classical', 'haussmann', 'marais', 'opera', 'operaGlass', 'presidio', 'presidioBrick', 'presidioStucco', 'capecod', 'skyscraper', 'stucco', 'sfapartment', 'chinatown', 'edwardian', 'tenement', 'towerblock', 'victorian', 'vosges', 'wharf', 'shopflats', 'storefront', 'aptclassical', 'aptbrick', 'aptmed', 'aptmodern', 'aptluxe'].sort(),
    )
    for (const s of STYLES) {
      expect(s.palettes.length, `${s.id} needs more than one palette or every one of them is identical`)
        .toBeGreaterThan(1)
      expect(s.levels[0]).toBeGreaterThan(0)
      expect(s.levels[1]).toBeGreaterThanOrEqual(s.levels[0])
      expect(s.bayWidth[0]).toBeGreaterThanOrEqual(MIN_BAY)
    }
  })
})

describe('rule 1: bays line up vertically', () => {
  it('puts every storey’s bays at the same x, because windows that wander are the giveaway', () => {
    const plan = planFacade('haussmann', 12345, { levels: 6 })
    const wall = planWall(plan, 18.4, 12345)
    const byStorey = new Map<number, number[]>()
    for (const c of wall.cells) {
      if (!byStorey.has(c.y0)) byStorey.set(c.y0, [])
      byStorey.get(c.y0)!.push(c.x0)
    }
    const rows = [...byStorey.values()].map((xs) => xs.sort((a, b) => a - b))
    for (const row of rows) expect(row).toEqual(rows[0])
  })

  it('never cuts a bay narrower than a window can live in', () => {
    for (const s of STYLES) {
      for (const len of [3, 4.5, 7, 11.4, 23, 60]) {
        const plan = planFacade(s.id, 7, { levels: 4 })
        const wall = planWall(plan, len, 7)
        for (const c of wall.cells) {
          if (c.element.endsWith('/wall')) continue
          expect(c.x1 - c.x0, `${s.id} at ${len} m`).toBeGreaterThanOrEqual(MIN_BAY - 1e-6)
        }
      }
    }
  })

  it('fills the wall exactly, leaving no gap and no overlap at any storey', () => {
    const plan = planFacade('brick', 99, { levels: 3 })
    const wall = planWall(plan, 14.2, 99)
    const ground = wall.cells.filter((c) => c.y0 === plan.storeys[0].y0).sort((a, b) => a.x0 - b.x0)
    expect(ground[0].x0).toBeCloseTo(0)
    expect(ground[ground.length - 1].x1).toBeCloseTo(14.2)
    for (let i = 1; i < ground.length; i++) expect(ground[i].x0).toBeCloseTo(ground[i - 1].x1)
  })
})

describe('rule 2: the ground floor and the roofline are not just more wall', () => {
  it('gives every style a distinct ground storey', () => {
    for (const s of STYLES) {
      const plan = allShops(planFacade(s.id, 3, { levels: 5 }))
      const wall = planWall(plan, 16, 3, STREET)
      const ground = wall.cells.filter((c) => c.y0 === plan.storeys[0].y0 && !c.element.endsWith('/wall'))
      const mid = wall.cells.filter((c) => c.y0 === plan.storeys[1].y0 && !c.element.endsWith('/wall'))
      expect(ground.length, `${s.id} has no ground cells`).toBeGreaterThan(0)
      expect(ground[0].element, `${s.id} ground floor is just another row of windows`).not.toBe(mid[0].element)
    }
  })

  it('makes the ground storey taller than the ones above it', () => {
    for (const s of STYLES) {
      const plan = planFacade(s.id, 8, { levels: 5 })
      const [g, first] = plan.storeys
      expect(g.y1 - g.y0, `${s.id}`).toBeGreaterThan(first.y1 - first.y0)
    }
  })

  it('always closes the top with something proud of the wall', () => {
    for (const s of STYLES) {
      const plan = planFacade(s.id, 4, { levels: 4 })
      const wall = planWall(plan, 15, 4)
      const top = wall.features.filter((f) => f.kind === 'cornice' || f.kind === 'parapet')
      // (one, or two where a dressed building's parapet is raised and carries its own coping)
      expect(top.length, `${s.id} has no roofline`).toBeGreaterThanOrEqual(1)
      expect(top.length).toBeLessThanOrEqual(plan.dress?.parapet ? 2 : 1)
      expect(top[0].depth).toBeGreaterThan(0)
    }
  })

  it('gives Haussmann its continuous balconies and Brutalism its slab bands', () => {
    const h = planWall(planFacade('haussmann', 1, { levels: 6 }), 20, 1)
    const balconies = h.features.filter((f) => f.kind === 'balcony')
    expect(balconies.length).toBe(2)
    for (const b of balconies) expect(b.x0, 'a Haussmann balcony runs the whole wall').toBeUndefined()

    const b = planWall(planFacade('brutalist', 1, { levels: 8 }), 20, 1)
    expect(b.features.filter((f) => f.kind === 'slabBand').length).toBe(7)
  })
})

describe('rule 3: seeded, so a re-bake changes nothing and neighbours differ', () => {
  it('produces the identical plan for the identical seed', () => {
    const a = planWall(planFacade('classical', 4242, { levels: 6 }), 22.5, 4242)
    const b = planWall(planFacade('classical', 4242, { levels: 6 }), 22.5, 4242)
    expect(a).toEqual(b)
  })

  it('does not give two neighbouring buildings the same facade', () => {
    const plans = [11, 12, 13, 14, 15, 16].map((s) => planFacade('brownstone', s, {}))
    const signature = (p: ReturnType<typeof planFacade>) =>
      `${p.palette.wall}|${p.levels}|${p.bayWidth.toFixed(2)}`
    expect(new Set(plans.map(signature)).size).toBeGreaterThan(3)
  })

  it('varies the windows within one wall', () => {
    const plan = planFacade('brick', 77, { levels: 4 })
    const wall = planWall(plan, 24, 77)
    const mid = wall.cells.filter((c) => c.element === 'brick/window')
    expect(new Set(mid.map((c) => c.variant.toFixed(3))).size).toBeGreaterThan(4)
  })
})

describe('reading OSM', () => {
  it('never calls a tall building a row house, or a short one a tower', () => {
    expect(chooseStyle({ levels: 30 }, CITY, 1)).toBe('skyscraper')
    for (let seed = 0; seed < 40; seed++) {
      const s = chooseStyle({ levels: 3 }, CITY, seed)
      expect(s).not.toBe('skyscraper')
      const [lo] = style(s).levels
      expect(lo).toBeLessThanOrEqual(4)
    }
  })

  it('believes a tagged material over the neighbourhood', () => {
    expect(chooseStyle({ levels: 5, material: 'brick' }, [{ id: 'haussmann', weight: 1 }], 9)).toBe('brick')
    expect(chooseStyle({ levels: 6, material: 'concrete' }, [{ id: 'haussmann', weight: 1 }], 9)).toBe('brutalist')
  })

  it('follows the city’s own mix when OSM says nothing useful', () => {
    const counts = new Map<string, number>()
    for (let seed = 0; seed < 300; seed++) {
      const s = chooseStyle({ levels: 4 }, CITY, seed)
      counts.set(s, (counts.get(s) ?? 0) + 1)
    }
    expect(counts.get('brick')!).toBeGreaterThan(counts.get('haussmann')!)
  })

  it('derives a level count from a bare height tag', () => {
    const plan = planFacade('brick', 5, { height: 14 })
    expect(plan.levels).toBeGreaterThanOrEqual(3)
    expect(plan.levels).toBeLessThanOrEqual(5)
  })
})

describe('the new capabilities', () => {
  it('gives a Victorian a bay window on every storey of its street wall, all at the same x', () => {
    const plan = planFacade('victorian', 4242, { levels: 3 })
    const wall = planWall(plan, 7.5, 9)
    const bays = wall.features.filter((f) => f.kind === 'bay')
    expect(bays.length).toBe(plan.storeys.length)
    for (const b of bays) {
      expect(b.x0).toBe(bays[0].x0)
      expect(b.x1).toBe(bays[0].x1)
      expect(b.x0!).toBeGreaterThanOrEqual(0)
      expect(b.x1!).toBeLessThanOrEqual(7.5)
      expect(b.x1! - b.x0!).toBeGreaterThan(2 * b.depth)       // room for the two 45° cheeks
    }
    // a long side wall is a party wall: no bays on it
    expect(planWall(plan, 20, 9).features.some((f) => f.kind === 'bay')).toBe(false)
  })

  it('hangs a tenement fire escape on every storey above the ground, on the centre bays', () => {
    const plan = planFacade('tenement', 77, { levels: 6 })
    const wall = planWall(plan, 14, 3)
    const esc = wall.features.filter((f) => f.kind === 'fireEscape')
    expect(esc.length).toBe(plan.storeys.length - 1)
    const mid = (esc[0].x0! + esc[0].x1!) / 2
    expect(Math.abs(mid - 7)).toBeLessThan(wall.bays > 0 ? 14 / wall.bays : 3)
  })
})

describe('a building with no shops', () => {
  it('draws the style\'s own windows on the ground floor where the style would put shopfronts', () => {
    const shops = planWall(allShops(planFacade('brick', 7, { levels: 3 })), 30, 7, STREET)
    expect(shops.cells.some((c) => c.element === 'brick/shopfront')).toBe(true)
    const plan = planFacade('brick', 7, { levels: 3, noShops: true })
    expect(plan.ground).toBe('plain')
    const wall = planWall(plan, 30, 7)
    expect(wall.cells.some((c) => c.element.endsWith('/shopfront'))).toBe(false)
    expect(wall.cells.filter((c) => c.y0 === 0 && c.element === 'brick/window').length).toBeGreaterThan(0)
    // and a style whose ground floor is not shops keeps it
    expect(planFacade('victorian', 7, { levels: 3, noShops: true }).ground).toBe('stoop')
  })
})

describe('an institution', () => {
  it('has no fire escapes', () => {
    const tenement = planWall(planFacade('tenement', 3, { levels: 6 }), 30, 3)
    const hospital = planWall(planFacade('tenement', 3, { levels: 6, noShops: true }), 30, 3)
    expect(tenement.features.some((f) => f.kind === 'fireEscape')).toBe(true)
    expect(hospital.features.some((f) => f.kind === 'fireEscape')).toBe(false)
  })
})

describe('a dressed commercial building', () => {
  const plans = Array.from({ length: 600 }, (_, i) => planFacade('brick', 1000 + i, { levels: 3 }))

  it('is dressed per building, from its own seed, and only in the styles that dress', () => {
    expect(planFacade('brick', 5, { levels: 3 }).dress).toEqual(planFacade('brick', 5, { levels: 3 }).dress)
    expect(planFacade('victorian', 5, { levels: 3 }).dress).toBeUndefined()
    expect(new Set(plans.map((p) => p.dress!.cap)).size).toBe(4)
  })

  it('has all its shops, one, or none — not a shop in every bay of every building', () => {
    const n = (k: string) => plans.filter((p) => p.dress!.shops === k).length / plans.length
    for (const k of ['all', 'one', 'none']) expect(n(k), k).toBeGreaterThan(0.2)
    const shopBays = (p: ReturnType<typeof planFacade>) =>
      planWall(p, 30, 9, STREET).cells.filter((c) => c.element === 'brick/shopfront').length
    const one = plans.find((p) => p.dress!.shops === 'one')!
    const none = plans.find((p) => p.dress!.shops === 'none')!
    expect(shopBays(one)).toBeGreaterThanOrEqual(1)
    expect(shopBays(one)).toBeLessThanOrEqual(2)
    expect(shopBays(none)).toBe(0)
  })

  it('keeps shops and ornament off the walls that do not face a street', () => {
    const p = allShops(plans.find((q) => q.dress!.cap === 'bracket')!)
    const side = planWall(p, 30, 9)
    const front = planWall(p, 30, 9, STREET)
    expect(side.cells.some((c) => c.element.endsWith('/shopfront'))).toBe(false)
    expect(side.features.some((f) => f.kind === 'bracket')).toBe(false)
    expect(front.features.some((f) => f.kind === 'bracket')).toBe(true)
  })
})

