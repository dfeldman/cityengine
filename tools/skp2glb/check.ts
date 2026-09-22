/**
 * Check a converted landmark before it goes in a manifest: size in metres, triangles, textures, up axis.
 *
 *   node --experimental-strip-types tools/skp2glb/check.ts out.glb [--footprint=34x58] [--height=46]
 *
 * glTF is Y-up, so the model's height is its y extent. With --footprint (the OSM building's two plan
 * dimensions, either order) and/or --height it says whether the model agrees within 15% — a model that does
 * not is wrong in units (SketchUp's inches) or in axis (Z-up exported as Y-up), not merely a bit off.
 */
import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) { console.error('usage: check.ts model.glb [--footprint=WxD] [--height=H]'); process.exit(2) }
const opt = (n: string): string | undefined => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1]

const buf = readFileSync(file)
if (buf.readUInt32LE(0) !== 0x46546c67) { console.error(`${file}: not a .glb`); process.exit(1) }
const jsonLen = buf.readUInt32LE(12)
const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8')) as {
  accessors: { count: number; min?: number[]; max?: number[] }[]
  meshes: { primitives: { attributes: Record<string, number>; indices?: number }[] }[]
  nodes?: { matrix?: number[]; scale?: number[]; rotation?: number[]; mesh?: number }[]
  images?: { name?: string; mimeType?: string }[]
}

let lo = [Infinity, Infinity, Infinity]
let hi = [-Infinity, -Infinity, -Infinity]
let tris = 0
for (const m of gltf.meshes) {
  for (const p of m.primitives) {
    const acc = gltf.accessors[p.attributes.POSITION]
    if (acc.min && acc.max) {
      lo = lo.map((v, i) => Math.min(v, acc.min![i]))
      hi = hi.map((v, i) => Math.max(v, acc.max![i]))
    }
    tris += p.indices !== undefined ? gltf.accessors[p.indices].count / 3 : acc.count / 3
  }
}
const size = hi.map((v, i) => v - lo[i])
// the exporter can leave a scale or rotation on a node; the numbers above would then be wrong
const transformed = (gltf.nodes ?? []).filter((n) => n.mesh !== undefined && (n.matrix || n.scale || n.rotation))
console.log(`${file}`)
console.log(`  size: ${size[0].toFixed(1)} × ${size[2].toFixed(1)} m in plan (x × z), ${size[1].toFixed(1)} m tall (y)`)
console.log(`  base at y = ${lo[1].toFixed(2)}  (0 means it stands on the ground)`)
console.log(`  triangles: ${Math.round(tris)}`)
console.log(`  textures: ${(gltf.images ?? []).length}`)
if (transformed.length > 0) console.log(`  WARNING: ${transformed.length} mesh node(s) carry a transform; sizes above ignore it`)

let ok = true
const within = (got: number, want: number): boolean => Math.abs(got - want) <= 0.15 * want
const fp = opt('footprint')
if (fp) {
  const [w, d] = fp.split('x').map(Number)
  const plan = [size[0], size[2]].sort((a, b) => a - b)
  const want = [w, d].sort((a, b) => a - b)
  const good = within(plan[0], want[0]) && within(plan[1], want[1])
  console.log(`  footprint ${want[0]}×${want[1]} m: ${good ? 'matches' : 'DOES NOT MATCH'} within 15%`)
  ok &&= good
}
const h = opt('height')
if (h) {
  const good = within(size[1], Number(h))
  console.log(`  height ${h} m: ${good ? 'matches' : 'DOES NOT MATCH'} within 15%`
    + (!good && size[1] / Number(h) > 30 ? ' (about ×39: inches?)' : '')
    + (!good && within(size[2], Number(h)) ? ' (the z extent matches: exported Z-up?)' : ''))
  ok &&= good
}
process.exit(ok ? 0 : 1)
