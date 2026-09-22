/**
 * The user's statue models, repacked for the game: from `incoming_models/` (never modified) to
 * `public/models/<region>/<id>.glb` (gitignored, like the originals). Per model:
 *
 * - geometry welded and de-duplicated; vertex data QUANTIZED (KHR_mesh_quantization, which Babylon reads with
 *   no decoder — the game must run offline, so no Draco or meshopt decoders fetched from a CDN);
 * - textures resized to at most `TEX` px and re-encoded as WebP (EXT_texture_webp, read natively);
 * - the exporter's extras dropped (FB_ngon_encoding; KHR_materials_volume, which only asks for transmission);
 * - `mirror: true` makes a true MIRROR IMAGE (x negated in every position and normal, triangle winding
 *   reversed) — the Cirque d'Hiver's second horseman, not the first turned round (user, 2026-09-22).
 *
 * The originals are the user's own new work: this reads them and writes new files, nothing else.
 *   node --experimental-strip-types tools/glb/pack.ts [id…]
 */
import { NodeIO, type Document } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, quantize, textureCompress, weld } from '@gltf-transform/functions'
import sharp from 'sharp'
import { mkdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..', '..')
const IN = resolve(ROOT, 'incoming_models')
/** the largest texture side: a statue is seen from the road, and three of them at 2048 were 150 MB of GPU */
const TEX = 1024

export const MODELS: { id: string; file: string; region: string; mirror?: boolean }[] = [
  { id: 'genie-liberte', file: 'streetrunner - bastille collone statue.glb', region: 'paris' },
  { id: 'cirque-horseman-left', file: 'streetrunner - cirque dhivers left horseman.glb', region: 'paris' },
  { id: 'cirque-horseman-right', file: 'streetrunner - cirque dhivers left horseman.glb', region: 'paris', mirror: true },
  { id: 'charlemagne', file: 'streetrunner - charlemagne at notre-dame.glb', region: 'paris' },
  { id: 'de-gaulle', file: 'streetrunner - charles de gaulle striding champs elysee.glb', region: 'paris' },
  { id: 'clemenceau', file: 'streetrunner - clemenceau champs elysee.glb', region: 'paris' },
  { id: 'etienne-marcel', file: 'streetrunner - etienne marcel.glb', region: 'paris' },
  { id: 'jeanne-darc-pyramides', file: 'streetrunner - jean darc place d pyramides.glb', region: 'paris' },
  { id: 'marianne', file: 'streetrunner - marianne place de la republique - marianne part.glb', region: 'paris' },
  { id: 'marianne-lion', file: 'streetrunner - marianne monument la republique - lion part.glb', region: 'paris' },
  { id: 'henri-iv', file: 'streetrunner -henry iv equestrian at pont neuf.glb', region: 'paris' },
  { id: 'danton', file: 'streetrunner- danton.glb', region: 'paris' },
]

/** A true mirror image in x: positions and normals negated in x, tangents too, winding reversed. */
function mirrorX(doc: Document): void {
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      for (const semantic of ['POSITION', 'NORMAL', 'TANGENT']) {
        const acc = prim.getAttribute(semantic)
        if (!acc) continue
        const arr = acc.getArray()!.slice()
        const size = acc.getElementSize()
        for (let i = 0; i < arr.length; i += size) arr[i] = -arr[i]
        // a mirrored tangent frame flips handedness as well
        if (semantic === 'TANGENT' && size === 4) for (let i = 3; i < arr.length; i += 4) arr[i] = -arr[i]
        acc.setArray(arr)
      }
      const idx = prim.getIndices()
      if (idx) {
        const a = idx.getArray()!.slice()
        for (let i = 0; i + 2 < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t }
        idx.setArray(a)
      }
    }
  }
}

const want = process.argv.slice(2)
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ sharp })
for (const m of MODELS.filter((q) => want.length === 0 || want.includes(q.id))) {
  const src = resolve(IN, m.file)
  const doc = await io.read(src)
  for (const ext of doc.getRoot().listExtensionsUsed()) {
    if (ext.extensionName === 'FB_ngon_encoding' || ext.extensionName === 'KHR_materials_volume') ext.dispose()
  }
  if (m.mirror) mirrorX(doc)
  await doc.transform(
    dedup(), weld(), prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [TEX, TEX], quality: 86 }),
    quantize(),
  )
  const outDir = resolve(ROOT, 'public', 'models', m.region)
  mkdirSync(outDir, { recursive: true })
  const out = resolve(outDir, `${m.id}.glb`)
  await io.write(out, doc)
  console.log(`  ${m.id}: ${Math.round(statSync(src).size / 1024)} kB → ${Math.round(statSync(out).size / 1024)} kB${m.mirror ? ' (mirrored)' : ''}`)
}
