/**
 * What is in a GLB: its nodes' transforms, meshes (triangles, vertices, the POSITION bounds), materials and
 * images (type and bytes). Reads the JSON chunk only; changes nothing.
 *   node --experimental-strip-types tools/glb/inspect.ts <file.glb>…
 */
import { readFileSync, statSync } from 'node:fs'
for (const file of process.argv.slice(2)) {
  const b = readFileSync(file)
  if (b.readUInt32LE(0) !== 0x46546c67) { console.log(file, ': not a GLB'); continue }
  const jsonLen = b.readUInt32LE(12)
  const j = JSON.parse(b.subarray(20, 20 + jsonLen).toString('utf8'))
  let tris = 0
  let verts = 0
  const lo = [Infinity, Infinity, Infinity]
  const hi = [-Infinity, -Infinity, -Infinity]
  for (const m of j.meshes ?? []) {
    for (const p of m.primitives) {
      const pos = j.accessors[p.attributes.POSITION]
      verts += pos.count
      tris += p.indices !== undefined ? j.accessors[p.indices].count / 3 : pos.count / 3
      if (pos.min) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], pos.min[k]); hi[k] = Math.max(hi[k], pos.max[k]) }
    }
  }
  const imgs = (j.images ?? []).map((im: { mimeType?: string; bufferView?: number }) => `${im.mimeType ?? '?'} ${im.bufferView !== undefined ? Math.round(j.bufferViews[im.bufferView].byteLength / 1024) + 'kB' : 'uri'}`)
  console.log(`\n${file.split('/').pop()}  ${Math.round(statSync(file).size / 1024)} kB`)
  console.log(`  ${j.meshes?.length ?? 0} meshes, ${Math.round(tris)} tris, ${verts} verts, ${j.materials?.length ?? 0} materials; bounds ${lo.map((v) => v.toFixed(2))} .. ${hi.map((v) => v.toFixed(2))} (size ${hi.map((v, k) => (v - lo[k]).toFixed(2))})`)
  console.log(`  nodes: ${(j.nodes ?? []).map((n: { name?: string; mesh?: number; scale?: number[]; rotation?: number[]; translation?: number[] }) => `${n.name ?? '-'}${n.mesh !== undefined ? '[m]' : ''}${n.scale ? ' s' + n.scale.map((v) => +v.toFixed(3)) : ''}${n.rotation ? ' r' + n.rotation.map((v) => +v.toFixed(3)) : ''}${n.translation ? ' t' + n.translation.map((v) => +v.toFixed(2)) : ''}`).join('; ')}`)
  console.log(`  images: ${imgs.join(', ') || 'none'}; extensions: ${(j.extensionsUsed ?? []).join(', ') || 'none'}; generator: ${j.asset?.generator ?? '?'}`)
  for (const m of j.materials ?? []) console.log(`  material ${m.name ?? '-'}: ${JSON.stringify(m.pbrMetallicRoughness ?? {}).slice(0, 160)}`)
}
