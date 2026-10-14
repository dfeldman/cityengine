// @ts-nocheck: R2Store comes from the assetmgr checkout outside this repo (see ASSETMGR below).
/**
 * Upload a baked city to the city bucket, as one unit, under a new bake number; then make it current and delete
 * the previous bake. Baked cities are derived data (`npm run bake <city>`), not shared assets, so they do not go
 * through assetmgr's indexes: no provenance, no history, just the latest bake.
 *
 * Layout in the bucket (cities.config.json names it; it is public, read with no key):
 *
 *   <city>/<bake>/<city>.json            the package
 *   <city>/<bake>/…                      everything under public/cities/<city>/ (tiles, terrain, ride graphs)
 *   <city>/current.json                  { city, bake, files, bytes, uploaded }: which bake is live
 *   cities.json                          every city and its current bake
 *
 * Order makes it safe to run while clients read: every file of the new bake first, then current.json, then the old
 * bake's objects are deleted. A client reads current.json and fetches from that bake's prefix.
 *
 *   node --experimental-strip-types tools/city-upload.ts san-francisco           what would happen
 *   node --experimental-strip-types tools/city-upload.ts san-francisco --yes     do it
 *   … --bake=7          a specific bake number (default: one more than the current one)
 *   … --keep-old        leave the previous bake in place
 *
 * Credentials: the bucket's S3 keys from the environment, a .env here, or $ASSETMGR_ENV_FILE (assetmgr's names
 * work: ASSETMGR_R2_ACCESS_KEY_ID / CLOUDFLARE_S3_ACCESS_KEY_ID …). assetmgr is found at $ASSETMGR_DIR.
 */
import { existsSync } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = join(import.meta.dirname, '..')
const ASSETMGR = process.env.ASSETMGR_DIR || join(ROOT, '..', 'assetmgr')
const { R2Store, credentialsFromEnv, accountFromEndpoint, loadEnvFiles, runPool } = await import(pathToFileURL(join(ASSETMGR, 'dist', 'node', 'index.js')).href)

const args = process.argv.slice(2)
const city = args.find((a) => !a.startsWith('--'))
const flag = (name: string) => args.includes(`--${name}`)
const opt = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
if (!city) { console.error('usage: city-upload.ts <city> [--yes] [--bake=N] [--keep-old]'); process.exit(2) }

const config = JSON.parse(await readFile(join(ROOT, 'cities.config.json'), 'utf8')) as { bucket: string; publicUrl: string; accountId?: string }
loadEnvFiles(ROOT)
const creds = credentialsFromEnv()
const accountId = config.accountId ?? process.env.ASSETMGR_R2_ACCOUNT_ID ?? accountFromEndpoint(process.env.CLOUDFLARE_S3_ENDPOINT ?? process.env.CLOUDFLARE_S3_ENPDOINT)
if (!creds || !accountId) { console.error('no bucket credentials: set ASSETMGR_ENV_FILE (see assetmgr README)'); process.exit(1) }
const store = new R2Store({ ...creds, accountId, bucket: config.bucket })

const PUB = join(ROOT, 'public', 'cities')
const pkg = join(PUB, `${city}.json`)
if (!existsSync(pkg)) { console.error(`${city} is not baked here (public/cities/${city}.json): run npm run bake ${city}`); process.exit(1) }

async function walk(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return []
  return ((await readdir(dir, { recursive: true, withFileTypes: true })) as { name: string; parentPath: string; isFile(): boolean }[])
    .filter((d) => d.isFile() && !d.name.startsWith('.')).map((d) => join(d.parentPath, d.name))
}
const files = [pkg, ...(await walk(join(PUB, city)))]
let bytes = 0
for (const f of files) bytes += (await stat(f)).size

const decode = (b: Uint8Array | null) => (b ? JSON.parse(new TextDecoder().decode(b)) : null)
const current = decode(await store.get(`${city}/current.json`)) as { bake: number } | null
const bake = Number(opt('bake') ?? (current ? current.bake + 1 : 1))
if (current && bake === current.bake) { console.error(`bake ${bake} is already current; pass a new --bake`); process.exit(1) }
const prefix = `${city}/${bake}/`
const keyOf = (f: string) => prefix + relative(PUB, f).split(sep).join('/')
const TYPES: Record<string, string> = { json: 'application/json', bin: 'application/octet-stream', png: 'image/png', jpg: 'image/jpeg', glb: 'model/gltf-binary' }
const typeOf = (f: string) => TYPES[f.split('.').pop() ?? ''] ?? 'application/octet-stream'

console.log(`${city}: ${files.length} files, ${(bytes / 1e6).toFixed(1)} MB → ${config.bucket}/${prefix}  (current: ${current ? `bake ${current.bake}` : 'none'})`)
if (!flag('yes')) {
  console.log(`dry run: would upload bake ${bake}, make it current${current && !flag('keep-old') ? `, and delete bake ${current.bake}` : ''}. Run again with --yes.`)
  process.exit(0)
}

let done = 0
const results = await runPool(files, 16, async (f) => {
  await store.put(keyOf(f), new Uint8Array(await readFile(f)), { contentType: typeOf(f), cacheControl: 'public, max-age=31536000, immutable' })
  if (++done % 500 === 0) console.log(`  ${done}/${files.length}`)
})
const failed = results.filter((r) => !r.ok)
if (failed.length) {
  console.error(`${failed.length} file(s) failed (e.g. ${String(failed[0].error)}); bake ${bake} is NOT current. Re-run to retry.`)
  process.exit(1)
}

const now = new Date().toISOString()
const live = { city, bake, files: files.length, bytes, uploaded: now }
await store.put(`${city}/current.json`, new TextEncoder().encode(JSON.stringify(live, null, 2) + '\n'), { contentType: 'application/json', cacheControl: 'no-cache' })
const all = (decode(await store.get('cities.json')) ?? { cities: {} }) as { cities: Record<string, unknown> }
all.cities[city] = live
await store.put('cities.json', new TextEncoder().encode(JSON.stringify(all, null, 2) + '\n'), { contentType: 'application/json', cacheControl: 'no-cache' })
console.log(`bake ${bake} is current: ${config.publicUrl}/${city}/current.json`)

if (current && !flag('keep-old')) {
  const old: string[] = []
  for await (const o of store.list(`${city}/${current.bake}/`)) old.push(o.key)
  await runPool(old, 16, (k) => store.delete(k))
  console.log(`deleted bake ${current.bake} (${old.length} objects)`)
}
