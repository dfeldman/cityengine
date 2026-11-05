import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { MeshBuilder } from '../src/render/buildings.ts'
import { hotelRohan, HOTEL_ROHAN_REFS, BLOCK, SWING, STREET, STRIP, NEWING, OSM_RING } from '../src/render/landmarks/paris/hotel-rohan.ts'

describe('Hôtel de Rohan', () => {
  const out = new MeshBuilder()
  hotelRohan(out)
  it('builds finite, affordable geometry on its block', () => {
    console.log('hotel-rohan triangles', out.triangles)
    expect(out.triangles).toBeGreaterThan(1_500)
    expect(out.triangles).toBeLessThan(12_000)
    for (const v of out.positions) expect(Number.isFinite(v)).toBe(true)
    let r = 0, top = 0
    for (let i = 0; i < out.positions.length; i += 3) { r = Math.max(r, Math.hypot(out.positions[i], out.positions[i + 2])); top = Math.max(top, out.positions[i + 1]) }
    expect(r).toBeLessThan(70)
    expect(top).toBeGreaterThan(16)
    expect(top).toBeLessThan(22)
  })
  it('its parts cover the claimed outline: no gap to see the ground through', () => {
    const inside = (p: [number, number], poly: [number, number][]): boolean => {
      let c = false
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, zi] = poly[i], [xj, zj] = poly[j]
        if ((zi > p[1]) !== (zj > p[1]) && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) c = !c
      }
      return c
    }
    let ring = 0, missed = 0
    for (let x = -45; x <= 22; x += 1) for (let z = -35; z <= 46; z += 1) {
      if (!inside([x, z], OSM_RING)) continue
      ring++
      if (![BLOCK, SWING, STREET, STRIP, NEWING].some((q) => inside([x, z], q))) missed++
    }
    console.log('hotel-rohan outline cells', ring, 'uncovered', missed)
    expect(missed / ring).toBeLessThan(0.08)
  })
  it('claims its OSM building once, with no civic entry shadowing it', () => {
    const lm = JSON.parse(readFileSync('public/landmarks/paris.json', 'utf8')) as { procedural?: string; osm?: string[]; madeBy?: string }[]
    const e = lm.find((x) => x.procedural === 'hotelRohan')
    expect(e).toBeTruthy()
    expect([...(e!.osm ?? [])].sort()).toEqual([...HOTEL_ROHAN_REFS].sort())
    expect(e!.madeBy).toBeTruthy()
    const civic = JSON.parse(readFileSync('public/landmarks/paris/civic.json', 'utf8')) as { osm?: string[] }[]
    for (const x of civic) for (const ref of x.osm ?? []) expect(HOTEL_ROHAN_REFS.includes(ref), ref).toBe(false)
  })
})
