/**
 * Rebuild just the ride graphs (`public/cities/<id>/ride-{bike,run}.json`) from the baked package, with the
 * city's overrides — seconds, where a full bake is minutes. For changes to src/city/ridegraph.ts rules.
 *   node --experimental-strip-types tools/rides.ts [city…]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CityPackage } from '../src/city/package.ts'
import { Terrain } from '../src/city/terrain.ts'
import { mapEdges, packRide, rideFor } from '../src/city/ridefile.ts'
import { rideStats } from '../src/city/ridegraph.ts'
const OUT = resolve(import.meta.dirname, '..', 'public', 'cities')
const ids = process.argv.slice(2).length ? process.argv.slice(2)
  : (JSON.parse(readFileSync(resolve(OUT, 'index.json'), 'utf8')) as { id: string }[]).map((c) => c.id)
for (const id of ids) {
  const pkg = JSON.parse(readFileSync(resolve(OUT, `${id}.json`), 'utf8')) as CityPackage
  const terrain = new Terrain(pkg.terrain)
  const edges = mapEdges(pkg.edges, terrain)
  for (const mode of ['bike', 'run'] as const) {
    const g = rideFor(pkg.id, pkg.origin, edges, mode, (x, z) => terrain.heightAt(x, z), pkg.region,
      pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring))
    writeFileSync(resolve(OUT, id, `ride-${mode}.json`), JSON.stringify(packRide(g, mode)))
    const st = rideStats(g)
    console.log(`${id} ${mode}: ${st.edges} edges over ${st.km.toFixed(1)} km, ${st.perKm.toFixed(1)} decisions/km, median ${st.medianSpacing.toFixed(0)} m`)
  }
}
