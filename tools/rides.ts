/**
 * Rebuild just the ride graphs (`public/cities/<id>/v3/ride-{bike,run}.json`) from the bake-private package
 * (tools/bake-files.ts), with the city's overrides — seconds, where a full bake is minutes. For changes to
 * src/city/ridegraph.ts rules. The shipped files change, so the city gets a new bake number.
 *   node --experimental-strip-types tools/rides.ts [city…]
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import CITIES from '../src/cities.json' with { type: 'json' }
import { readPackage, recordBake, shippedDir } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { mapEdges, packRide, rideFor } from '../src/city/ridefile.ts'
import { rideStats } from '../src/city/ridegraph.ts'
import { gardenPaths } from './gardens/paths.ts'
const ids = process.argv.slice(2).length ? process.argv.slice(2) : CITIES.map((c) => c.id)
for (const id of ids) {
  const pkg = readPackage(id)
  const terrain = new Terrain(pkg.terrain)
  const edges = mapEdges(pkg.edges, terrain)
  const buildings = pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring)
  // as the bake's writeRides: Paris's garden walks, and the roundabouts it found
  if (pkg.region === 'paris') edges.push(...gardenPaths(pkg.origin, edges, (x, z) => terrain.heightAt(x, z), buildings).edges)
  for (const mode of ['bike', 'run'] as const) {
    const g = rideFor(pkg.id, pkg.origin, edges, mode, (x, z) => terrain.heightAt(x, z), pkg.region, buildings, pkg.roundabouts)
    writeFileSync(resolve(shippedDir(id), `ride-${mode}.json`), JSON.stringify(packRide(g, mode)))
    const st = rideStats(g)
    console.log(`${id} ${mode}: ${st.edges} edges over ${st.km.toFixed(1)} km, ${st.perKm.toFixed(1)} decisions/km, median ${st.medianSpacing.toFixed(0)} m`)
  }
  console.log(`${id}: bake ${recordBake(id)}`)
}
