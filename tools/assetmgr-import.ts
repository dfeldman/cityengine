// @ts-nocheck: assetmgr's types come from a checkout outside this repo (see ASSETMGR below).
/**
 * Record Street Runner's OWN generated assets in its assetmgr index (indexes/asset-index-streetrunner.json), for
 * upload to the shared bucket: the SF street trees (public/sftrees, tools/sftrees) and the extruded signs
 * (public/models/signs, tools/signs.ts). Everything else Street Runner draws is owned elsewhere and read from the
 * bucket by src/assets.ts: trees, plants and rocks from assetkit, the Paris statues from assetkit, avatars from
 * avatarkit.
 *
 * The street trees reference their textures by relative URI, as Trail Trainer's do. Textures whose bytes are
 * already in assetkit-nature-textures are used from there (the GLB is pointed at assetkit's file, and the asset
 * `requires` it); the rest become assets here. All of them share assetkit's `nature/` folder, so a checkout that
 * downloads both indexes has every GLB beside its textures.
 *
 * Re-runnable: unchanged files are skipped; a rebuilt file replaces the old one (which stays in the index as
 * isDeleted, so `assetmgr delete --yes` can clear it from the bucket). Reads public/, never changes it.
 *
 *   node --experimental-strip-types tools/assetmgr-import.ts
 *   npx assetmgr upload            (credentials: ASSETMGR_ENV_FILE; see ~/assetmgr/README.md)
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = join(import.meta.dirname, '..')
// the assetmgr checkout: $ASSETMGR_DIR, or the one beside this repo
const ASSETMGR = process.env.ASSETMGR_DIR || join(ROOT, '..', 'assetmgr')
const { addFile, emptyIndex, indexFileName, loadRepo, makeFilename, saveIndex, serializeIndex, sha256Bytes, slugify } = await import(
  pathToFileURL(join(ASSETMGR, 'dist', 'node', 'index.js')).href
)

const INDEX = 'streetrunner'
const INDEX_DIR = 'indexes'
const PUB = join(ROOT, 'public')
const SCRATCH = join(ROOT, '.assetmgr', 'import-scratch')
const DEFAULTS = { project: 'cycledash', projectName: 'Cycle Dash', repo: 'https://github.com/dfeldman/streetrunner' }

/** Latin names where the generator models one tree (tools/sftrees/species/*.json `about`); mixes are left out. */
const LATIN = {
  sf_plane: 'Platanus × acerifolia', sf_plane_pollard: 'Platanus × acerifolia', sf_brisbane: 'Lophostemon confertus',
  sf_cypress: 'Hesperocyparis macrocarpa', sf_ficus: 'Ficus microcarpa', sf_gum: 'Eucalyptus', sf_mpine: 'Pinus radiata',
  sf_myrtle: 'Metrosideros excelsa', sf_pear: 'Pyrus calleryana', sf_pepper: 'Schinus molle', sf_plum: 'Prunus cerasifera',
  sf_bottlebrush: 'Callistemon', sf_blossom: 'Prunus', sf_jacaranda: 'Jacaranda mimosifolia', sf_mayten: 'Maytenus boaria',
  sf_olive: 'Olea europaea',
}

async function codeHash(dir) {
  const h = createHash('sha256')
  const files = (await readdir(dir, { recursive: true })).filter((f) => /\.(py|json)$/.test(f) && !f.includes('__pycache__')).sort()
  for (const f of files) h.update(f).update(await readFile(join(dir, f)))
  return h.digest('hex')
}

function rewriteGlb(bytes, map) {
  const jsonLen = bytes.readUInt32LE(12)
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLen).toString('utf8'))
  const uris = []
  for (const img of gltf.images ?? []) if (img.uri) { img.uri = map(img.uri); uris.push(img.uri) }
  let json = Buffer.from(JSON.stringify(gltf), 'utf8')
  if (json.length % 4) json = Buffer.concat([json, Buffer.alloc(4 - (json.length % 4), 0x20)])
  const rest = bytes.subarray(20 + jsonLen)
  const head = Buffer.alloc(20)
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(20 + json.length + rest.length, 8)
  head.writeUInt32LE(json.length, 12); head.writeUInt32LE(0x4e4f534a, 16)
  return { out: Buffer.concat([head, json, rest]), uris }
}

async function main() {
  const path = join(ROOT, INDEX_DIR, indexFileName(INDEX))
  if (!existsSync(path)) {
    await mkdir(join(ROOT, INDEX_DIR), { recursive: true })
    await writeFile(path, serializeIndex({ ...emptyIndex(INDEX, DEFAULTS), description: "Cycle Dash's own generated assets: San Francisco street trees and extruded signs" }))
  }
  const repo = await loadRepo(ROOT)
  const mine = () => repo.indexes.find((l) => l.name === INDEX).index
  const find = (id) => mine().assets.find((a) => a.id === id)
  /**
   * Add a file as asset `id`, or, when `id` exists with different bytes (a rebuilt tree), retire its old files
   * (isDeleted: kept in the index, removed from the bucket by `assetmgr delete`) and add the new one. Same bytes:
   * nothing to do. Returns false when nothing changed.
   */
  const upsert = async (id, opts, bytes) => {
    const a = find(id)
    const hash = sha256Bytes(bytes)
    if (a?.assetFiles.some((f) => !f.isDeleted && f.hash === hash)) return false
    if (a) for (const f of a.assetFiles) f.isDeleted = true
    // (the same bytes under two names happen: public/rocks/textures has full and _512 copies of one surface)
    await addFile(repo, { index: INDEX, indexDir: INDEX_DIR, assetId: id, allowDuplicate: true, ...opts })
    return true
  }
  await mkdir(SCRATCH, { recursive: true })

  // assetkit's textures, by content, from the public bucket
  const bucket = repo.config.publicUrl.replace(/\/+$/, '')
  const nature = await (await fetch(`${bucket}/asset-index-assetkit-nature-textures.json`)).json()
  const shared = new Map() // sha256 → { filename, id }
  for (const a of nature.assets) for (const f of a.assetFiles) shared.set(f.hash, { filename: f.filename, id: `assetkit-nature-textures/${a.id}` })

  // ---- the street trees' textures
  const tex = new Map() // "textures/<name>" → { filename, require }
  let texAdded = 0, texShared = 0
  for (const name of (await readdir(join(PUB, 'sftrees', 'textures'))).sort()) {
    const src = join(PUB, 'sftrees', 'textures', name)
    const bytes = await readFile(src)
    const hash = sha256Bytes(bytes)
    const hit = shared.get(hash)
    if (hit) { tex.set(`textures/${name}`, { filename: hit.filename, require: hit.id }); texShared++; continue }
    const stem = name.replace(/\.[^.]+$/, '')
    const words = stem.replace(/_[0-9a-f]{8}$/, '').replace(/_/g, ' ')
    const id = slugify(`texture-${stem}`)
    const filename = makeFilename(hash, name.split('.').pop(), [words])
    tex.set(`textures/${name}`, { filename, require: id })
    const changed = await upsert(id, {
      src,
      asset: {
        id, name: words, type: '2d', subtype: 'texture', folder: 'nature', assetKeywords: [words],
        generator: { script: 'streetrunner/tools/sftrees/pages.py' },
        notes: 'Bark and leaf pages for the SF street trees, built by tools/sftrees from Poly Haven CC0 sources and the library\'s own pages.',
        extra: { streetrunner: { path: `sftrees/textures/${name}` } },
      },
      file: { isProd: true },
    }, bytes)
    if (changed) texAdded++
  }
  console.log(`textures: ${texShared} shared with assetkit, ${texAdded} added or replaced`)

  // ---- the street trees
  const lib = JSON.parse(await readFile(join(PUB, 'sftrees', 'index.json'), 'utf8'))
  const genHash = await codeHash(join(ROOT, 'tools', 'sftrees'))
  let trees = 0
  for (const e of lib.trees) {
    const id = slugify(e.file.replace(/\.glb$/, ''))
    const src = join(PUB, 'sftrees', e.file)
    const { out, uris } = rewriteGlb(await readFile(src), (uri) => {
      const t = tex.get(uri)
      if (!t) throw new Error(`${e.file}: texture ${uri} not found`)
      return t.filename
    })
    const tmp = join(SCRATCH, e.file)
    await writeFile(tmp, out)
    const requires = [...new Set(uris.map((u) => [...tex.values()].find((t) => t.filename === u).require))]
    const b = e.bounds
    const changed = await upsert(id, {
      src: tmp, move: true,
      asset: {
        id,
        name: `${e.species.replace(/^sf_/, '').replace(/_/g, ' ')} ${e.file.match(/_(\d+)\.glb$/)?.[1] ?? ''}`.trim(),
        type: '3d', subtype: 'tree', folder: 'nature',
        ...(LATIN[e.species] ? { species: LATIN[e.species] } : {}),
        creationDate: (await stat(src)).mtime.toISOString().slice(0, 10),
        ...(b ? { height: +(b.top - b.bottom).toFixed(2), width: +(2 * b.radius).toFixed(2), length: +(2 * b.radius).toFixed(2) } : {}),
        assetKeywords: ['san francisco', 'street tree', e.species.replace(/^sf_/, '').replace(/_/g, ' ')],
        generator: { script: 'streetrunner/tools/sftrees/gen.py', hash: genHash, params: { species: e.species } },
        seed: e.seed,
        requires,
        notes: 'Generated by tools/sftrees (Trail Trainer\'s deciduousgen/conifergen with SF species). generator.hash is of the code at import. Texture URIs rewritten to assetmgr names on import.',
        extra: { streetrunner: { path: `sftrees/${e.file}`, entry: e } },
      },
      file: { isProd: true, multiLod: (e.lods?.length ?? 1) > 1 },
    }, out)
    if (changed) trees++
  }
  console.log(`street trees: ${lib.trees.length} in library, ${trees} added or replaced`)

  // ---- extruded signs
  let signs = 0
  for (const name of (await readdir(join(PUB, 'models', 'signs'))).filter((n) => n.endsWith('.glb')).sort()) {
    const id = slugify(`sign-${name.replace(/\.glb$/, '')}`)
    const src = join(PUB, 'models', 'signs', name)
    const changed = await upsert(id, {
      src,
      asset: {
        id, name: `${name.replace(/\.glb$/, '')} sign`, type: '3d', subtype: '3dsign', folder: 'signs',
        assetKeywords: ['sign', name.replace(/\.glb$/, '')],
        generator: { script: 'streetrunner/tools/signs.ts', params: { recipe: 'tools/signgen/signs.json' } },
        notes: 'Extruded lettering generated by tools/signs.ts (Blender) from tools/signgen/signs.json.',
        extra: { streetrunner: { path: `models/signs/${name}` } },
      },
      file: { isProd: true },
    }, await readFile(src))
    if (changed) signs++
  }
  console.log(`signs: ${signs} added or replaced`)

  // ---- files the game reads from public/ by fixed name (and two screenshots): kept out of git, put back by
  // `npx assetmgr restore` through their localPath. Bytes are uploaded as they are (no renaming inside).
  const FIXED = [
    { dir: 'public/facades', match: /\.png$/, subtype: 'texture', generator: 'tools/facadegen/paint.py', what: 'facade texture atlas' },
    { dir: 'public/facades/walls', match: /\.png$/, subtype: 'texture', generator: 'tools/facadegen/paint.py', what: 'facade wall texture' },
    { dir: 'public/palms', match: /\.png$/, subtype: 'texture', generator: 'tools/palmgen', what: 'palm texture' },
    { dir: 'public/roads', match: /\.png$/, subtype: 'texture', generator: 'tools/roadgen', what: 'road surface texture' },
    { dir: 'public/rocks/textures', match: /\.jpg$/, subtype: 'texture', polyHaven: true, what: 'rock surface (Poly Haven, via assetkit rockgen)' },
    { dir: 'public', match: /^og\.jpg$/, subtype: 'screenshot', what: 'social preview image' },
    { dir: '.', match: /^gondola-ride\.png$/, subtype: 'screenshot', what: 'screenshot for the docs' },
    { dir: 'platform', match: /^screenshot\.jpg$/, subtype: 'screenshot', what: 'the game\'s screenshot on Dandyhorse' },
  ]
  let fixed = 0
  for (const group of FIXED) {
    for (const name of (await readdir(join(ROOT, group.dir))).filter((n) => group.match.test(n)).sort()) {
      const rel = join(group.dir, name).replace(/^\.\//, '')
      const src = join(ROOT, rel)
      const stem = name.replace(/\.[a-z]+$/, '')
      const id = slugify(rel.replace(/^public\//, '').replace(/\.[a-z]+$/, ''))
      const changed = await upsert(id, {
        src,
        asset: {
          id, name: `${stem.replace(/[-_]/g, ' ')}`, type: '2d', subtype: group.subtype,
          folder: dirname(rel.replace(/^public\//, '')) === '.' ? 'cityengine' : `cityengine/${dirname(rel.replace(/^public\//, ''))}`,
          assetKeywords: [group.what, stem.replace(/[-_]/g, ' ')],
          ...(group.polyHaven ? { attribution: 'Poly Haven (polyhaven.com), CC0', sourceUrl: 'https://polyhaven.com', notes: 'See public/rocks/textures/CREDITS.md for the asset each came from.' } : {}),
          ...(group.generator ? { generator: { script: `cityengine/${group.generator}` } } : {}),
          extra: { streetrunner: { path: rel.replace(/^public\//, '') } },
        },
        file: { isProd: true, localPath: rel },
      }, await readFile(src))
      if (changed) fixed++
    }
  }
  console.log(`fixed-path files: ${fixed} added or replaced`)
  for (const l of repo.indexes) await saveIndex(l)
}

main().catch((e) => { console.error(e); process.exit(1) })
