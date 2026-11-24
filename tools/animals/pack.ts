/**
 * The user's Tripo animals, packed for the game: from `animal_experiments/` (gitignored, never modified) to
 * `public/models/common/<id>.glb` (gitignored, like the statues). Per animal:
 *
 * - cut down to `tris` triangles by Blender's decimator (tools/animals/decimate.py; a Tripo animal is ~2 M);
 * - turned to face +z, the way every body in the game faces at heading 0 (`front` names the axis the head is on);
 * - its coat made NEUTRAL: the texture greyscaled and lifted so the coat's mean is `COAT` — each breed's colour is
 *   multiplied in per instance (render/dogs.ts), so one golden retriever can be a black lab or a white terrier;
 * - texture down to `TEX` px WebP. Not quantized: render/dogs.ts reads the positions back to rig the body, and a
 *   quantized mesh keeps them in a scaled integer space.
 *
 *   node --experimental-strip-types tools/animals/pack.ts [id…]
 */
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, textureCompress, weld } from '@gltf-transform/functions'
import sharp from 'sharp'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..', '..')
const IN = resolve(ROOT, 'animal_experiments')
const TEX = 256
/** the coat's mean brightness after neutralising: high, so a pale breed can still be pale */
const COAT = 0.86

/**
 * `tris`: decimate to this many (omit to keep the mesh). `neutral`: grey the coat for per-instance tinting.
 * `clips`: a Blender script (tools/animals/) that writes the animal's clips onto its rig before packing.
 * `front`: turn the vertices to face +z — ONLY for unrigged meshes; a rigged one (Tripo's skin and bones) keeps its
 * vertices as they are, since turning them would break the skin's inverse bind matrices; render/zoo.ts turns it.
 */
export const ANIMALS: { id: string; file: string; tris?: number; front?: '-x' | '+x' | '-z' | '+z'; neutral?: boolean; tex?: number; clips?: string }[] = [
  { id: 'dog-retriever', file: 'goldenretriever.glb', tris: 3000, front: '-x', neutral: true },
  { id: 'giraffe', file: 'giraffe.glb', tex: 1024, clips: 'giraffe-clips.py' },
  { id: 'bison', file: 'bison.glb', tex: 1024, clips: 'bison-clips.py' },
  { id: 'peacock', file: 'peacock.glb', tex: 1024, clips: 'peacock-clips.py' },
  { id: 'flamingo', file: 'flamingo 3d model.glb', tex: 1024, clips: 'flamingo-clips.py' },
  { id: 'swan', file: 'swan.glb', tex: 512, clips: 'swan-clips.py' },
  { id: 'goose', file: 'goose.glb', tex: 512, clips: 'goose-clips.py' },
  { id: 'rabbit', file: 'rabbit.glb', tex: 512, clips: 'rabbit-clips.py' },
  { id: 'elephant', file: 'elephant.glb', tex: 1024, clips: 'elephant-clips.py' },
  { id: 'lion', file: 'lion.glb', tex: 1024, clips: 'lion-clips.py' },
  { id: 'bear', file: 'bear.glb', tex: 1024, clips: 'bear-clips.py' },
  { id: 'deer', file: 'buck.glb', tex: 1024, clips: 'deer-clips.py' },
  { id: 'doe', file: 'doe.glb', tex: 1024, clips: 'doe-clips.py' },
  { id: 'fawn', file: 'fawn.glb', tex: 1024, clips: 'fawn-clips.py' },
]

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ sharp })
const want = process.argv.slice(2)
for (const a of ANIMALS.filter((q) => want.length === 0 || want.includes(q.id))) {
  const src = resolve(IN, a.file)
  let doc
  if (a.tris) {
    const tmp = mkdtempSync(join(tmpdir(), 'animal-'))
    const dec = join(tmp, 'dec.glb')
    execFileSync(process.env.BLENDER ?? 'blender', ['-b', '-P', resolve(import.meta.dirname, 'decimate.py'), '--', src, dec, String(a.tris)], { stdio: 'pipe' })
    doc = await io.read(dec)
    rmSync(tmp, { recursive: true })
  } else if (a.clips) {
    // the motion: a Blender script writes the clips onto the rig (and repairs it), tools/animals/<clips>
    const tmp = mkdtempSync(join(tmpdir(), 'animal-'))
    const anim = join(tmp, 'anim.glb')
    execFileSync(process.env.BLENDER ?? 'blender', ['-b', '-P', resolve(import.meta.dirname, a.clips), '--', src, anim], { stdio: 'pipe' })
    doc = await io.read(anim)
    rmSync(tmp, { recursive: true })
  } else doc = await io.read(src)
  for (const ext of doc.getRoot().listExtensionsUsed()) {
    if (ext.extensionName === 'FB_ngon_encoding' || ext.extensionName === 'KHR_materials_volume') ext.dispose()
  }
  // face +z: (x, z) → the rotation that takes `front` onto +z (a proper rotation, so no winding change)
  if (a.front) {
  const front = a.front
  const rot: Record<NonNullable<typeof a.front>, (x: number, z: number) => [number, number]> = {
    '+z': (x, z) => [x, z], '-z': (x, z) => [-x, -z], '-x': (x, z) => [z, -x], '+x': (x, z) => [-z, x],
  }
  for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
    for (const sem of ['POSITION', 'NORMAL']) {
      const acc = prim.getAttribute(sem)
      if (!acc) continue
      const arr = acc.getArray()!.slice()
      for (let i = 0; i < arr.length; i += 3) { const [x, z] = rot[front](arr[i], arr[i + 2]); arr[i] = x; arr[i + 2] = z }
      acc.setArray(arr)
    }
  }
  for (const node of doc.getRoot().listNodes()) { node.setTranslation([0, 0, 0]); node.setRotation([0, 0, 0, 1]); node.setScale([1, 1, 1]) }
  }
  // the coat neutral: greyscale, then scaled so its mean is COAT (the dark nose and eyes stay dark)
  if (a.neutral) for (const tex of doc.getRoot().listTextures()) {
    const img = tex.getImage()
    if (!img) continue
    const grey = sharp(Buffer.from(img)).greyscale()
    const mean = (await grey.clone().stats()).channels[0].mean / 255
    tex.setImage(new Uint8Array(await grey.linear(COAT / Math.max(0.05, mean), 0).toColourspace('srgb').png().toBuffer()))
    tex.setMimeType('image/png')
  }
  await doc.transform(dedup(), weld(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [a.tex ?? TEX, a.tex ?? TEX], quality: 82 }))
  const outDir = resolve(ROOT, 'public', 'models', 'common')
  mkdirSync(outDir, { recursive: true })
  const out = resolve(outDir, `${a.id}.glb`)
  await io.write(out, doc)
  console.log(`  ${a.id}: ${Math.round(statSync(src).size / 1024)} kB → ${Math.round(statSync(out).size / 1024)} kB`)
}
