/**
 * For laying out a garden: puts this checkout's gardens into the bake on disk (its index.json's `garden`), without a bake, so they can
 * be photographed. Only what the tile draws changes: a plan's rows of trees and its clearings wait for the next real bake, which makes
 * the same `garden` from the same code.
 *
 *   node --experimental-strip-types tools/gardens/patch.ts [paris-centre]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../../src/city/geo.ts'
import { CITIES, detailBboxOf } from '../cities.ts'
import { gardenPartsQuery, overpassTiled } from '../overpass.ts'
import { bakeGardens } from './index.ts'

const id = process.argv[2] ?? 'paris-centre'
const spec = CITIES.find((c) => c.id === id)
if (!spec) throw new Error(`no city ${id}`)
const proj = new Projection(spec.centre)
const got = await overpassTiled(gardenPartsQuery, detailBboxOf(spec))
const g = bakeGardens(got.ways, (q) => proj.toLocal(q))
const f = resolve(import.meta.dirname, '..', '..', 'public', 'cities', id, 'v3', 'index.json')
const index = JSON.parse(readFileSync(f, 'utf8'))
index.legacy.garden = g.garden
writeFileSync(f, JSON.stringify(index))
console.log(`${id}: ${g.counts.hedges} hedges, ${g.counts.beds} beds, ${g.counts.plans} plans; ${g.garden.hedges.length} rows and ${g.garden.flats.length} flats in index.json`)
