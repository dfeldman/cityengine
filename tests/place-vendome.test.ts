import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { MeshBuilder } from '../src/render/buildings.ts'
import { placeVendome, VENDOME_REFS } from '../src/render/landmarks/paris/place-vendome.ts'

describe('Place Vendôme', () => {
  const out = new MeshBuilder()
  placeVendome(out)
  it('builds finite, affordable geometry on the square', () => {
    console.log('place-vendome triangles', out.triangles)
    expect(out.triangles).toBeGreaterThan(8000)
    expect(out.triangles).toBeLessThan(30_000)
    for (const v of out.positions) expect(Number.isFinite(v)).toBe(true)
    // the square's own frame: nothing farther than the hôtels' depth from the column
    let r = 0
    for (let i = 0; i < out.positions.length; i += 3) r = Math.max(r, Math.hypot(out.positions[i], out.positions[i + 2]))
    expect(r).toBeLessThan(260)
  })
  it('claims every building it draws, once, and no civic entry shadows them', () => {
    const lm = JSON.parse(readFileSync('public/landmarks/paris.json', 'utf8')) as { landmarks?: { procedural?: string; osm?: string[]; madeBy?: string }[] } | { procedural?: string; osm?: string[]; madeBy?: string }[]
    const list = Array.isArray(lm) ? lm : lm.landmarks!
    const e = list.find((x) => x.procedural === 'placeVendome')
    expect(e).toBeTruthy()
    expect([...(e!.osm ?? [])].sort()).toEqual([...VENDOME_REFS].sort())
    expect(e!.madeBy).toBeTruthy()
    const civic = JSON.parse(readFileSync('public/landmarks/paris/civic.json', 'utf8')) as { osm?: string[] }[] | { landmarks: { osm?: string[] }[] }
    const claimed = new Set((Array.isArray(civic) ? civic : civic.landmarks).flatMap((x) => x.osm ?? []))
    for (const ref of VENDOME_REFS) expect(claimed.has(ref), ref).toBe(false)
  })
})
