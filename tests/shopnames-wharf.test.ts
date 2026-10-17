import { describe, expect, it } from 'vitest'
import { inventShopNames } from '../src/city/shopnames.ts'

describe("Fisherman's Wharf shop names", () => {
  const names = inventShopNames('wharf', 60, 0x5eed).map((n) => n.name)
  it('invents a street of them, every one different', () => {
    expect(names.length).toBe(60)
    expect(new Set(names).size).toBe(60)
  })
  it('sells seafood and souvenirs, not a neighbourhood’s errands', () => {
    expect(names.some((n) => /Seafood|Crab|Chowder|Oyster|Fish/.test(n))).toBe(true)
    expect(names.some((n) => /Gifts|Souvenirs|T-Shirts|Candy|Fudge|Taffy/.test(n))).toBe(true)
    for (const n of names) expect(n).not.toMatch(/Pharmacy|Cleaners|Laundry|Liquor|Bank|Nails/)
  })
  it('names no real Wharf business', () => {
    for (const n of names) expect(n).not.toMatch(/Alioto|Scoma|Boudin|Castagnola|Sabella|Pompei|Tarantino|Ghirardelli/)
  })
})
