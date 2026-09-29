/**
 * The terrain model (src/map/ground.ts, docs/MAP-FORMAT.md §5.7): fine ground only in zoned tiles, coarse
 * elsewhere, and no seam where they meet.
 */
import { describe, expect, it } from 'vitest'
import { GroundModel, type Grid } from '../src/map/ground.ts'
import { localZones, zoneTouchesRect } from '../src/map/zones.ts'

// a 1 km square: a smooth coarse hill, and fine ground carrying 2 m ripples the coarse grid cannot
const coarse: Grid = { x0: -200, z0: -200, step: 20, cols: 71, rows: 71, h: [] as number[] }
for (let r = 0; r < coarse.rows; r++) for (let c = 0; c < coarse.cols; c++) (coarse.h as number[]).push((c * 20 - 200) * 0.05)
const fine: Grid = { x0: 0, z0: 0, step: 4, cols: 251, rows: 251, h: [] as number[] }
for (let r = 0; r < fine.rows; r++) for (let c = 0; c < fine.cols; c++) (fine.h as number[]).push(c * 4 * 0.05 + 2 * Math.sin(c) * Math.cos(r))

const tiles: [number, number][] = []
for (let tx = 0; tx < 5; tx++) for (let tz = 0; tz < 5; tz++) tiles.push([tx, tz])
// the middle tile and the one east of it are "park"
const model = new GroundModel({ coarse, fine, fineTiles: new Set(['2,2', '3,2']), tiles, fineStep: 4 })

describe('the terrain model', () => {
  it('ships fine blocks only where a zone asked, coarse everywhere else', () => {
    expect(model.block(2, 2)!.step).toBe(4)
    expect(model.block(3, 2)!.step).toBe(4)
    expect(model.block(1, 2)!.step).toBe(20)
    expect(model.block(1, 2)!.cols).toBe(11)
  })

  it('has no seam where a fine tile meets a coarse one — nor between two fine ones', () => {
    for (let z = 400; z <= 600; z += 0.5) {
      // west edge of the fine tile, against the coarse tile beyond it
      expect(Math.abs(model.heightAt(400 - 1e-6, z) - model.heightAt(400 + 1e-6, z))).toBeLessThan(1e-3)
      // between the two fine tiles
      expect(Math.abs(model.heightAt(600 - 1e-6, z) - model.heightAt(600 + 1e-6, z))).toBeLessThan(1e-3)
    }
  })

  it('carries the fine detail in the middle of a zone, and none outside it', () => {
    // the ripple: at the centre of the fine tile the model departs from the smooth hill by up to 2 m
    let most = 0
    for (let x = 440; x <= 560; x += 4) for (let z = 440; z <= 560; z += 4) most = Math.max(most, Math.abs(model.heightAt(x, z) - x * 0.05))
    expect(most).toBeGreaterThan(1)
    // in a coarse tile it is the hill, to the decimetre it ships at
    for (let x = 20; x <= 180; x += 7) expect(Math.abs(model.heightAt(x, 100) - x * 0.05)).toBeLessThan(0.06)
  })
})

describe('zones', () => {
  const toLocal = (lat: number, lon: number) => ({ x: lon * 1000, z: lat * 1000 })
  const [zn] = localZones([{ ref: 'p', ring: [[0.1, 0.1], [0.1, 0.3], [0.3, 0.3], [0.3, 0.1]], props: { terrain: 'fine' } }], toLocal)
  it('touch a tile they overlap, by corner, by edge, or by containing it', () => {
    expect(zoneTouchesRect(zn, 0, 0, 200, 200)).toBe(true)       // corner inside
    expect(zoneTouchesRect(zn, 150, 150, 250, 250)).toBe(true)   // tile inside the zone
    expect(zoneTouchesRect(zn, 50, 150, 350, 160)).toBe(true)    // a strip crossing it, no corner inside either
    expect(zoneTouchesRect(zn, 400, 400, 600, 600)).toBe(false)
  })
})
