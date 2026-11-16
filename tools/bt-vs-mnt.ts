/** BD TOPO sol-0 road vertex z vs lidar MNT, per box: npx tsx tools/bt-vs-mnt.ts name:lat,lon ... (half-size D deg, default 0.004) */
import { ignLidar } from './ign-lidar.ts'
import { fetchBdTopo, btSol } from './bdtopo-zones.ts'
const D = Number(process.env.D ?? 0.004), SR = Number(process.env.SR ?? 4)
const q = (a: number[], p: number) => a[Math.min(a.length - 1, Math.floor(a.length * p))]
for (const s of process.argv.slice(2)) {
  const [name, ll] = s.split(':'), [lat, lon] = ll.split(',').map(Number)
  const box = { south: lat - D, north: lat + D, west: lon - D * 1.5, east: lon + D * 1.5 }
  const mnt = await ignLidar(box, 1024), fs = await fetchBdTopo('troncon_de_route', box.south, box.west, box.north, box.east)
  const by: Record<string, number[]> = {}; let bad = 0, shifted = 0, underBr = 0, below = 0; const brPts = fs.filter((f) => btSol(f) !== '0').flatMap((f) => f.coords.flat())
  for (const f of fs) {
    const sol = btSol(f), meth = String(f.props.methode_d_acquisition_altimetrique ?? '')
    for (const line of f.coords) for (const v of line) {
      if (!(v[2] > -100)) continue
      const m = mnt.at(v[1], v[0]); if (m === null) continue
      const k = `sol${sol} ${meth.slice(0, 22)}`; (by[k] ??= []).push(v[2] - m)
      if (sol === '0' && Math.abs(v[2] - m) > 1.5) { // within R m of the vertex, does the MNT reach the BD TOPO z (a shift, not a height error)?
        let best = Infinity; const dl = 1 / 111320, dlo = dl / Math.cos(lat * Math.PI / 180)
        for (let dy = -SR; dy <= SR; dy += 1) for (let dx = -SR; dx <= SR; dx += 1) { if (dx * dx + dy * dy > SR * SR) continue; const mm = mnt.at(v[1] + dy * dl, v[0] + dx * dlo); if (mm !== null) best = Math.min(best, Math.abs(v[2] - mm)) }
        bad++; if (best < 0.5) shifted++
        const nearBr = brPts.some(([bx, by2]) => Math.hypot((bx - v[0]) * 73000, (by2 - v[1]) * 111320) < 20); if (nearBr) underBr++
        if (v[2] - m < 0) below++
      }
    }
  }
  console.log(`${name}: sol0 vertices off >1.5 m: ${bad}, of which the MNT within ${SR} m reaches BD TOPO z (±0.5): ${shifted} (${(100 * shifted / Math.max(bad, 1)).toFixed(0)}%); within 20 m of a bridge/tunnel troncon vertex: ${underBr}; BD TOPO below MNT: ${below}`)
  for (const [k, a] of Object.entries(by).sort((x, y) => y[1].length - x[1].length)) { a.sort((x, y) => x - y); if (a.length >= 10) console.log(`  ${k.padEnd(32)} n${String(a.length).padStart(5)}  p10 ${q(a, .1).toFixed(2)} p50 ${q(a, .5).toFixed(2)} p90 ${q(a, .9).toFixed(2)}  |d|>1.5: ${(100 * a.filter((x) => Math.abs(x) > 1.5).length / a.length).toFixed(0)}%`) }
}
