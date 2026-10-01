import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { checkSimple, roofZ, SIMPLE_LIMITS, simpleGeometry, type Simple } from '../src/map/simple.ts'
import { applyPatches, indexPatches } from '../src/map/patch.ts'
import type { MapTile } from '../src/map/format.ts'

/** 8 real lidar buildings from sf-mini (tools/lidar/patch.py --identity lidar): pitched, holes, steps, the biggest. */
const raw = JSON.parse(readFileSync(new URL('./fixtures/simple-sf-mini.json', import.meta.url), 'utf8')) as {
  buildings: { ref: string; z: number; h: number; covers?: string[]; simple: Simple }[]
  override: { ref: string; z: number; h: number; simple: Simple }
}
/** as a tile holds them: look styles interned (a patch names them; the loader turns names into indices) */
const STYLES: string[] = []
const interned = (s: Simple): Simple => ({ ...s, ...(s.l ? { l: s.l.map((k) => ({ ...k, style: typeof k.style === 'string'
  ? (STYLES.includes(k.style) ? STYLES.indexOf(k.style) : STYLES.push(k.style) - 1) : k.style })) } : {}) })
const fixture = { buildings: [...raw.buildings, raw.override].map((b) => ({ ...b, simple: interned(b.simple) })) }

type V3 = [number, number, number]
const tri = (p: V3, q: V3, r: V3): number =>        // signed volume of the tetrahedron with the origin, ×6
  p[0] * (q[1] * r[2] - q[2] * r[1]) - p[1] * (q[0] * r[2] - q[2] * r[0]) + p[2] * (q[0] * r[1] - q[1] * r[0])

/**
 * The building as a closed solid: roofs + walls + a floor at the foot. If the walls close every gap between
 * faces and everything faces outwards, the divergence theorem gives exactly the volume under the roofs.
 */
function volumes(s: Simple, foot: number): { closed: number; underRoof: number } {
  const g = simpleGeometry(s, foot, 0)
  const P = g.roof.positions
  const at = (i: number): V3 => [P[3 * i], P[3 * i + 1], P[3 * i + 2]]
  let six = 0, under = 0
  for (let t = 0; t < g.roof.indices.length; t += 3) {
    const [a, b, c] = [at(g.roof.indices[t]), at(g.roof.indices[t + 1]), at(g.roof.indices[t + 2])]
    six += tri(a, b, c)
    six += tri([c[0], c[1], foot], [b[0], b[1], foot], [a[0], a[1], foot])     // the floor, facing down
    const area = ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2
    under += area * ((a[2] + b[2] + c[2]) / 3 - foot)
  }
  for (const w of g.walls) {
    const A0: V3 = [w.ax, w.ay, w.a0], A1: V3 = [w.ax, w.ay, w.a1], B0: V3 = [w.bx, w.by, w.b0], B1: V3 = [w.bx, w.by, w.b1]
    six += tri(A0, B0, B1) + tri(A0, B1, A1)
  }
  return { closed: six / 6, underRoof: under }
}

describe('simple buildings (MAP-FORMAT §5.3.1)', () => {
  it('every fixture building passes the checker', () => {
    for (const b of fixture.buildings) expect(checkSimple(b.simple, b.z), b.ref).toBeNull()
  })

  it('roofs + walls + floor close: the solid has exactly the volume under the roofs', () => {
    for (const b of fixture.buildings) {
      const { closed, underRoof } = volumes(b.simple, b.z)
      expect(underRoof, b.ref).toBeGreaterThan(0)
      expect(Math.abs(closed - underRoof) / underRoof, b.ref).toBeLessThan(1e-9)
    }
  })

  it('h is the highest roof above the foot', () => {
    for (const { simple: s, z, h, ref } of fixture.buildings) {
      let top = -Infinity
      for (const f of s.f) for (const r of [f.r, ...(f.h ?? [])]) for (const k of r) top = Math.max(top, roofZ(s, f, k))
      expect(Math.abs(top - z - h), ref).toBeLessThanOrEqual(1)
    }
  })

  it('outside walls face out and step walls face down the step', () => {
    for (const b of fixture.buildings) {
      const s = b.simple
      const g = simpleGeometry(s, b.z)
      const roofAt = (x: number, y: number): number | null => {     // highest roof over a point, or null outside
        let best: number | null = null
        for (const f of s.f) {
          const rings = [f.r, ...(f.h ?? [])]
          let inside = false
          for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
            const xi = s.x + s.v[2 * r[i]], yi = s.y + s.v[2 * r[i] + 1], xj = s.x + s.v[2 * r[j]], yj = s.y + s.v[2 * r[j] + 1]
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
          }
          if (inside) {
            const z = f.s ? f.z + (f.s[0] * (x - s.x) + f.s[1] * (y - s.y)) / 10000 : f.z
            best = best === null ? z : Math.max(best, z)
          }
        }
        return best
      }
      for (const w of g.walls) {
        const mx = (w.ax + w.bx) / 2, my = (w.ay + w.by) / 2
        const L = Math.hypot(w.bx - w.ax, w.by - w.ay)
        const nx = (w.by - w.ay) / L, ny = -(w.bx - w.ax) / L          // the front: right of a→b
        const front = roofAt(mx + nx * 2, my + ny * 2), back = roofAt(mx - nx * 2, my - ny * 2)
        expect(back, `${b.ref}: a wall with nothing behind it`).not.toBeNull()
        if (w.outer) expect(front, `${b.ref}: an outside wall with roof in front`).toBeNull()
        else expect(front!, `${b.ref}: a step wall facing up the step`).toBeLessThan(back! + 3)   // probes are 2 cm off the edge, on sloped roofs
      }
    }
  })

  it('a look table is checked: indices in range, styles interned, colours 24-bit', () => {
    const b = fixture.buildings[0]
    expect(b.simple.l?.length).toBe(1)                               // an add carries its generated look
    expect(raw.override.simple.l).toBeUndefined()                     // an OSM override wears its building's own
    for (const r of raw.buildings) expect(r.covers?.every((c) => /^b\d+$/.test(c)), r.ref).toBe(true)   // and an add names the OSM buildings it covers
    expect(checkSimple({ ...b.simple, f: b.simple.f.map((f) => ({ ...f, l: 1 })) }, b.z)).toMatch(/look index/)
    expect(checkSimple({ ...b.simple, l: [{ style: 'victorian' }] }, b.z)).toMatch(/interned/)
    expect(checkSimple({ ...b.simple, l: [{ style: 0, wall: 0x1000000 }] }, b.z)).toMatch(/colour/)
  })

  it('every wall and roof triangle says which face (so which look) it wears', () => {
    for (const b of fixture.buildings) {
      const g = simpleGeometry(b.simple, b.z)
      expect(g.roof.faces.length).toBe(g.roof.indices.length / 3)
      for (const w of g.walls) {
        expect(w.face).toBeGreaterThanOrEqual(0)
        expect(w.face).toBeLessThan(b.simple.f.length)
        // a step wall wears the higher face: its top is that face's roof along the edge
        if (!w.outer) {
          const f = b.simple.f[w.face]
          const zAt = (x: number, y: number): number => (f.s ? f.z + (f.s[0] * (x - b.simple.x) + f.s[1] * (y - b.simple.y)) / 10000 : f.z)
          expect(Math.abs(zAt(w.ax, w.ay) - w.a1) + Math.abs(zAt(w.bx, w.by) - w.b1)).toBeLessThan(1e-6)
        }
      }
    }
  })

  it('refuses what is over a limit, and the Python encoder uses the same limits', () => {
    const s = fixture.buildings[0].simple
    expect(checkSimple({ ...s, f: Array(SIMPLE_LIMITS.faces + 1).fill(s.f[0]) }, fixture.buildings[0].z)).toMatch(/faces/)
    expect(checkSimple({ ...s, v: s.v.map((c, i) => (i === 0 ? SIMPLE_LIMITS.half + 1 : c)) }, fixture.buildings[0].z)).toMatch(/offset/)
    expect(checkSimple({ ...s, f: [{ ...s.f[0], r: [...s.f[0].r].reverse() }] }, fixture.buildings[0].z)).toMatch(/counter-clockwise/)
    const py = readFileSync(new URL('../tools/lidar/simple.py', import.meta.url), 'utf8')
    for (const [k, v] of Object.entries(SIMPLE_LIMITS)) expect(py, k).toMatch(new RegExp(`\\b${k}=${v},`))
  })

  it('a patch\'s city-cm origin lands tile-local, for an override and for an add', () => {
    const tile = 200, ox = 2 * tile * 100, oy = -1 * tile * 100
    const m = {
      v: 3, key: '2,-1', tx: 2, ty: -1, nodes: [0, 0, 100, 1000, 0, 100, 1000, 1000, 100],
      ways: [{ role: 'footprint', nodes: [0, 1, 2] }],
      buildings: [{ ref: 'b1', kind: 'generic', way: 0, cx: 600, cy: 300, z: 100, h: 900, seed: 1, parts: [] }],
    } as unknown as MapTile
    const { simple: s, z, h } = raw.buildings[0]
    const city = { ...s, x: ox + 5000, y: oy + 7000 }
    const ops = [
      { op: 'override' as const, ref: 'b1', set: { kind: 'simple', z, h, simple: city, parts: [] } },
      { op: 'add' as const, type: 'building' as const, record: { ref: 'x:lidar-1', kind: 'simple' as const, seed: 2, z, h,
        pts: [ox + 4000, oy + 6000, ox + 6000, oy + 6000, ox + 6000, oy + 8000], simple: city } },
    ]
    const styles = ['victorian']
    const out = applyPatches(m, indexPatches([{ v: 1, city: 'test', ops }], tile), { dict: { names: [], styles, kinds: [], items: [], archetypes: [] }, tile })
    const [over, add] = out.buildings
    // the look's style name is interned into the city dictionary, as a top-level `style` would be
    for (const k of add.simple!.l ?? []) expect(styles[k.style as number]).toBe((raw.buildings[0].simple.l![0]).style)
    expect(checkSimple(add.simple!, add.z)).toBeNull()
    expect(over.kind).toBe('simple')
    expect(over.parts).toEqual([])
    for (const b of [over, add]) {
      expect(b.simple!.x).toBe(5000)
      expect(b.simple!.y).toBe(7000)
      expect(b.simple!.v).toBe(s.v)                       // the table is shared, not copied
    }
    expect(city.x).toBe(ox + 5000)                       // and the patch itself is untouched
  })
})
