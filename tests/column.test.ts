import { describe, expect, it } from 'vitest'
import { MeshBuilder } from '../src/render/buildings.ts'
import { classicalColumn, tierFor, type ColumnOrder, type ColumnTier } from '../src/render/landmarks/column.ts'

/**
 * The column is the one primitive that gets drawn thousands of times, so its cost is the thing to guard. These
 * caps are the budget PLAN.md item Z was written around; raising one is a decision, not a detail.
 */
const CAP: Record<ColumnTier, Record<ColumnOrder, number>> = {
  far: { tuscan: 32, doric: 32, ionic: 32, corinthian: 32 },
  mid: { tuscan: 130, doric: 130, ionic: 190, corinthian: 160 },
  near: { tuscan: 260, doric: 260, ionic: 320, corinthian: 400 },
}

describe('the classical column primitive', () => {
  for (const tier of ['far', 'mid', 'near'] as ColumnTier[]) {
    for (const order of ['tuscan', 'doric', 'ionic', 'corinthian'] as ColumnOrder[]) {
      it(`${tier}/${order} is finite and within budget`, () => {
        const out = new MeshBuilder()
        classicalColumn(out, 3, -2, 1, 16, 0.6, [0.8, 0.8, 0.75], { tier, order, heading: 0.7 })
        expect(out.positions.length).toBeGreaterThan(0)
        for (const v of out.positions) expect(Number.isFinite(v)).toBe(true)
        const fl = new MeshBuilder()
        classicalColumn(fl, 3, -2, 1, 16, 0.6, [0.8, 0.8, 0.75], { tier, order, heading: 0.7, flutes: true })
        if (process.env.COLUMN_COST) console.log(`${tier}/${order}\t${out.triangles} tris\tfluted ${fl.triangles}`)
        expect(out.triangles).toBeLessThanOrEqual(CAP[tier][order])
      })
    }
  }

  it('stays inside its own footprint and height', () => {
    const out = new MeshBuilder()
    classicalColumn(out, 0, 0, 0, 10, 0.5, [1, 1, 1], { tier: 'near', order: 'corinthian' })
    for (let i = 0; i < out.positions.length; i += 3) {
      expect(Math.abs(out.positions[i])).toBeLessThan(2)
      expect(out.positions[i + 1]).toBeGreaterThanOrEqual(-0.001)
      expect(out.positions[i + 1]).toBeLessThanOrEqual(10.001)
      expect(Math.abs(out.positions[i + 2])).toBeLessThan(2)
    }
  })

  it('picks a tier from the height when the caller says nothing', () => {
    expect(tierFor(20)).toBe('near')
    expect(tierFor(8)).toBe('mid')
    expect(tierFor(3)).toBe('far')
  })
})
