/**
 * The user's statue models, repacked for the game: from `incoming_models/` (never modified) to
 * `public/models/<region>/<id>.glb` (gitignored, like the originals). Per model:
 *
 * - geometry welded and de-duplicated; vertex data QUANTIZED (KHR_mesh_quantization, which Babylon reads with
 *   no decoder — the game must run offline, so no Draco or meshopt decoders fetched from a CDN). KTX2 textures
 *   (KHR_texture_basisu) are fine too: their transcoder is bundled offline (src/render/ktx2.ts), and assetkit's
 *   tools/img2glb packs with them;
 * - textures resized to at most `TEX` px and re-encoded as WebP (EXT_texture_webp, read natively);
 * - the exporter's extras dropped (FB_ngon_encoding; KHR_materials_volume, which only asks for transmission);
 * - `mirror: true` makes a true MIRROR IMAGE (x negated in every position and normal, triangle winding
 *   reversed) — the Cirque d'Hiver's second horseman, not the first turned round (user, 2026-09-22).
 *
 * The originals are the user's own new work: this reads them and writes new files, nothing else.
 *   node --experimental-strip-types tools/glb/pack.ts [id…]
 */
import { NodeIO, type Document } from '@gltf-transform/core'
import { ALL_EXTENSIONS, KHRTextureBasisu } from '@gltf-transform/extensions'
import { dedup, prune, quantize, textureCompress, weld } from '@gltf-transform/functions'
import sharp from 'sharp'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..', '..')
const IN = resolve(ROOT, 'incoming_models')
/** the largest texture side: a statue is seen from the road, and three of them at 2048 were 150 MB of GPU */
const TEX = 1024

/**
 * KTX2 (`ktx2: true`): the textures encoded with KTX-Software's `toktx` ($TOKTX, or on the PATH) instead of WebP, so
 * they stay compressed on the GPU — a quarter of the memory, which is what a phone runs out of first (owner, 2026-11-02;
 * src/render/ktx2.ts decodes them offline). The colour as ETC1S, the smallest; a normal map as UASTC at half the size,
 * which ETC1S would smear.
 */
export const MODELS: { id: string; file: string; region: string; mirror?: boolean; ktx2?: boolean }[] = [
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
  // the Wallace fountain (owner, 2026-11-03: "a decent wallace glb"): one model, thin-instanced at every one of the
  // city's fountain points (render/paris/wallace.ts); its normal map is kept, its colour at 1024
  { id: 'wallace', file: 'wallace.glb', region: 'paris', ktx2: true },
]

const TOKTX = process.env.TOKTX ?? 'toktx'

/** Every texture of `doc` re-encoded as KTX2 through toktx: its image written out as PNG, the .ktx2 read back in. */
async function toKtx2(doc: Document): Promise<void> {
  doc.createExtension(KHRTextureBasisu).setRequired(true)
  const dir = mkdtempSync(join(tmpdir(), 'pack-ktx2-'))
  try {
    const normals = new Set(doc.getRoot().listMaterials().flatMap((m) => (m.getNormalTexture() ? [m.getNormalTexture()!] : [])))
    let i = 0
    for (const t of doc.getRoot().listTextures()) {
      const image = t.getImage()
      if (!image) continue
      const normal = normals.has(t)
      const side = normal ? TEX / 2 : TEX
      const png = join(dir, `${i}.png`)
      const out = join(dir, `${i++}.ktx2`)
      // (toktx reads PNG; sized here, a power of two, so the mip chain is whole)
      writeFileSync(png, await sharp(Buffer.from(image)).resize(side, side, { fit: 'fill' }).png().toBuffer())
      const args = normal
        ? ['--t2', '--genmipmap', '--encode', 'uastc', '--uastc_quality', '2', '--zcmp', '18', '--assign_oetf', 'linear', out, png]
        : ['--t2', '--genmipmap', '--encode', 'etc1s', '--clevel', '2', '--qlevel', '160', '--assign_oetf', 'srgb', out, png]
      execFileSync(TOKTX, args, { stdio: 'pipe' })
      t.setImage(readFileSync(out)).setMimeType('image/ktx2')
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

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
    ...(m.ktx2 ? [] : [textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [TEX, TEX], quality: 86 })]),
    quantize(),
  )
  if (m.ktx2) await toKtx2(doc)
  const outDir = resolve(ROOT, 'public', 'models', m.region)
  mkdirSync(outDir, { recursive: true })
  const out = resolve(outDir, `${m.id}.glb`)
  await io.write(out, doc)
  console.log(`  ${m.id}: ${Math.round(statSync(src).size / 1024)} kB → ${Math.round(statSync(out).size / 1024)} kB${m.mirror ? ' (mirrored)' : ''}`)
}
