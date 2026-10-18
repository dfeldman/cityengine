/**
 * Where Street Runner's shared and generated assets come from: the shared asset bucket, read over public HTTPS
 * with no key (assetmgr, github.com/dfeldman/assetmgr), or the old `public/` folders with `?assets=local`.
 *
 * The rest of the game still asks for the paths it always did: `trees/oak_003.glb`, `plants/index.json`,
 * `sftrees/sf_plane_01.glb`, `models/paris/henri-iv.glb`, `models/signs/ripleys.glb`. This maps each one to the
 * content-hashed file in the bucket, using the indexes that own them:
 *
 *   assetkit-trees, assetkit-plants, assetkit-rocks   Trail Trainer's libraries (`extra.trailtrainer.file`)
 *   assetkit-nature-textures                          their textures (only needed to name them for texture caps)
 *   assetkit-statues-paris                            the packed statues (`extra.streetrunner.packed`)
 *   streetrunner                                      this game's own: SF street trees, signs (`extra.streetrunner.path`)
 *   assetkit-models-sf                                the AI photogrammetry models of SF landmarks (ships…), one file
 *                                                     per LOD: `models/sf/<id>.lod<N>.glb`, and their `extra.model`
 *                                                     metadata (real size, front axis, draft) — `modelInfo(id)`
 *
 * and serves `trees/index.json`, `plants/index.json` and `sftrees/index.json` rebuilt from the entries those
 * indexes keep. Anything not in the bucket (palms, facades, roads, landmarks, the rock surfaces, the city bake)
 * is still read from `public/`. The avatar kit's assets come from the bucket through the kit itself
 * (`loadFromBucket`), set up here too, so every avatar (rider, crowds) is built after initAssets.
 *
 * If the bucket can't be read, the game falls back to `public/` and says so in the console.
 */
import { assetManifest, loadFromBucket, setAssetManifest, setAssetBase, setStudioHdri, STUDIO_HDRI } from 'avatarkit'

/** The shared asset bucket's public URL. */
export const ASSET_BUCKET = 'https://pub-32f6f3f21c18414cbeaf4bf0ac34ebe5.r2.dev'

const INDEXES = ['assetkit-trees', 'assetkit-plants', 'assetkit-rocks', 'assetkit-nature-textures', 'assetkit-statues-paris', 'streetrunner', 'assetkit-models-sf'] as const
/** Library folders whose index.json is rebuilt from the bucket (rocks/index.json is this game's own, committed). */
const LIBRARY: Record<string, string> = { 'assetkit-trees': 'trees', 'assetkit-plants': 'plants', 'assetkit-rocks': 'rocks' }

interface BucketFile { filename: string; isDeleted?: boolean; isProd?: boolean; isSource?: boolean; fileFormat?: string; lod?: number }
/** A landmark model's own facts (assetkit tools/modelpack, `extra.model`): what placing it needs, without opening it */
export interface ModelInfo {
  kind: string
  front: '+z' | '-z' | '+x' | '-x'
  scale: { axis: 'x' | 'y' | 'z'; metres: number }
  /** metres from the model's lowest point up to its waterline (ships) */
  draft?: number
  plinth?: [number, number, number]
  material: string
  /** the LOD files there are (0 = most detailed) */
  lods: { lod: number; triangles: number; tex: number }[]
}
const models = new Map<string, ModelInfo>()
/** The facts of an assetkit-models-sf model, once initAssets has read the bucket (null before, or without it). */
export const modelInfo = (id: string): ModelInfo | null => models.get(id) ?? null
interface BucketAsset {
  isDeleted?: boolean
  isTemp?: boolean
  assetFiles: BucketFile[]
  id?: string
  extra?: { trailtrainer?: { file?: string; [k: string]: unknown }; streetrunner?: { path?: string; packed?: string; entry?: { file?: string } }; model?: ModelInfo }
}

/** site-relative path (`trees/oak_003.glb`) → bucket URL */
const toBucket = new Map<string, string>()
/** bucket URL → site-relative path, for anything that decides by path (texture caps) */
const fromBucket = new Map<string, string>()
/** site-relative path of an index.json → its rebuilt contents */
const synthetic = new Map<string, unknown>()
let active = false

/** 'bucket' (the default) or 'local' (`?assets=local`). */
export function assetSource(): 'bucket' | 'local' {
  return new URLSearchParams(location.search).get('assets') === 'local' ? 'local' : 'bucket'
}

/** True once initAssets has mapped the bucket (false with ?assets=local, or when the bucket was unreachable). */
export const bucketActive = (): boolean => active

function map(path: string, url: string): void {
  toBucket.set(path, url)
  fromBucket.set(url, path)
}

/** Read the bucket's indexes. Call once, before anything loads a model; safe to await more than once. */
let initing: Promise<void> | null = null
export function initAssets(): Promise<void> {
  return (initing ??= (async () => {
    // The avatar kit's base must be ABSOLUTE: it builds bodies in a worker, where './mh/' would resolve against
    // the worker's script and quietly fetch index.html.
    const localAvatars = () => {
      setAssetBase(siblingUrl(AVATARKIT, 'public/mh/'))
      setStudioHdri(siblingUrl(AVATARKIT, `public/${STUDIO_HDRI}`))
    }
    if (assetSource() === 'local') return localAvatars()
    const base = ASSET_BUCKET
    let indexes: { name: string; assets: BucketAsset[] }[]
    try {
      ;[indexes] = await Promise.all([
        Promise.all(INDEXES.map(async (name) => {
          const r = await fetch(`${base}/asset-index-${name}.json`)
          if (!r.ok) throw new Error(`asset index ${name}: HTTP ${r.status}`)
          return { name, ...(await r.json()) as { assets: BucketAsset[] } }
        })),
        loadFromBucket(base),
      ])
    } catch (e) {
      console.warn('assets: the shared bucket could not be read; using public/ instead', e)
      setAssetManifestOff()
      return localAvatars()
    }
    const libs = new Map<string, unknown[]>([['trees', []], ['plants', []], ['sftrees', []]])
    for (const idx of indexes) {
      for (const a of idx.assets) {
        if (a.isDeleted || a.isTemp) continue
        const live = a.assetFiles.filter((f) => !f.isDeleted)
        const glb = live.find((f) => f.fileFormat === 'glb' && f.isProd) ?? live.find((f) => f.fileFormat === 'glb')
        const tt = a.extra?.trailtrainer
        const sr = a.extra?.streetrunner
        const lib = LIBRARY[idx.name]
        if (lib && tt?.file && glb) {
          map(`${lib}/${tt.file}`, `${base}/${glb.filename}`)
          libs.get(lib)?.push(tt)
        } else if (idx.name === 'assetkit-nature-textures' && tt?.file && live[0]) {
          map(tt.file, `${base}/${live[0].filename}`) // e.g. trees/textures/bark_oak_diff_512_….jpg
        } else if (idx.name === 'assetkit-statues-paris' && sr?.packed) {
          const prod = live.find((f) => f.isProd)
          if (prod) map(sr.packed.replace(/^public\//, ''), `${base}/${prod.filename}`)
        } else if (idx.name === 'assetkit-models-sf' && a.id && a.extra?.model) {
          // one file per LOD, asked for as models/sf/<id>.lod<N>.glb (render/statues.ts)
          for (const f of live) if (f.isProd && f.lod !== undefined) map(`models/sf/${a.id}.lod${f.lod}.glb`, `${base}/${f.filename}`)
          models.set(a.id, a.extra.model)
        } else if (idx.name === 'streetrunner' && sr?.path && live[0]) {
          map(sr.path, `${base}/${(glb ?? live[0]).filename}`)
          if (sr.entry && sr.path.startsWith('sftrees/')) libs.get('sftrees')!.push(sr.entry)
        }
      }
    }
    for (const [lib, trees] of libs) if (trees.length) synthetic.set(`${lib}/index.json`, { trees })
    active = true
  })())
}

/** After a failed bucket read, make sure the kit isn't left half-pointed at the bucket. */
function setAssetManifestOff(): void {
  setAssetManifest(null)
}

/*
 * Local-assets mode (?assets=local, or no bucket): the shared libraries are read from the sibling repos'
 * public/ folders through the dev server's /@fs/ route, at the paths vite.config.ts takes from AVATARKIT_DIR and
 * ASSETKIT_DIR. Nothing is symlinked into this repo.
 */
const AVATARKIT = typeof __AVATARKIT_DIR__ === 'string' ? __AVATARKIT_DIR__ : ''
const ASSETKIT = typeof __ASSETKIT_DIR__ === 'string' ? __ASSETKIT_DIR__ : ''
const siblingUrl = (dir: string, rel: string): string => new URL(`/@fs${dir}/${rel}`, location.origin).href

/** In local mode: where a path the game asks for lives in a sibling repo (trees, plants, rock models), or as given. */
function localAsset(url: string): string {
  const p = relPath(url)
  if (!p || !ASSETKIT) return url
  if (p.startsWith('trees/') || p.startsWith('plants/') || (p.startsWith('rocks/') && p.endsWith('.glb'))) return siblingUrl(ASSETKIT, `public/${p}`)
  return url
}

/** The site-relative path of an absolute URL under the page, or null. */
function relPath(url: string): string | null {
  const root = new URL('./', document.baseURI).href
  return url.startsWith(root) ? decodeURI(url.slice(root.length).split(/[?#]/)[0]) : null
}

/** Where to fetch an asset from: its bucket URL when the bucket has it, else the URL as given. */
export function resolveAsset(url: string): string {
  if (!active) return localAsset(url)
  const p = relPath(url)
  return (p && toBucket.get(p)) || url
}

/** A resolved URL as SceneLoader wants it: [rootUrl, fileName]. */
export function assetRootAndFile(root: string, file: string): [string, string] {
  const url = resolveAsset(new URL(file, root).href)
  const cut = url.lastIndexOf('/') + 1
  return [url.slice(0, cut), url.slice(cut)]
}

/** A library index (`trees/index.json`…): rebuilt from the bucket when the bucket owns it, else fetched. */
export async function fetchAssetJson<T>(url: string): Promise<T> {
  const p = active ? relPath(url) : null
  const hit = p ? synthetic.get(p) : undefined
  if (hit) return structuredClone(hit) as T
  const r = await fetch(active ? url : localAsset(url))
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`)
  return (await r.json()) as T
}

let mhReverse: Map<string, string> | null = null
let mhFrom: Record<string, string> | null = null
/**
 * The page-relative URL an asset WOULD have had in public/, for code that decides by path (the phone tier's
 * texture caps match `/trees/`, `/mh/`…). URLs that aren't bucket files come back unchanged.
 */
export function logicalUrl(url: string): string {
  if (!url.startsWith(ASSET_BUCKET)) return url
  const p = fromBucket.get(url)
  if (p) return new URL(p, document.baseURI).href
  const m = assetManifest()
  if (m) {
    if (m !== mhFrom) {
      mhReverse = new Map(Object.entries(m).map(([path, u]) => [u, path]))
      mhFrom = m
    }
    const mp = mhReverse!.get(url)
    if (mp) return new URL(`mh/${mp}`, document.baseURI).href
  }
  return url
}
