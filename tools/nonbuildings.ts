/**
 * NONBUILDINGS — the landmarks that are not buildings, and the checks that are theirs alone.
 *
 * The owner, 2026-09-23: "There will be GLB art, plazas, vessels (the submarine museum), unique plants,
 * bridges, fountains etc, more in the future. We can call this category `nonbuildings`."
 *
 * ## What the category IS
 *
 * A nonbuilding is a landmark **that has no facade** — nothing a rider could walk into, nothing the slot kit
 * (LADDER §2) could ever say, and nothing a street photograph can settle. That is the definition, and it is
 * about WHAT THE THING IS, not how it is positioned:
 *
 *   - `parks.json` and `piers.json` entries carry OSM ways and are still nonbuildings (a pier shed, a pagoda).
 *   - `art.json` entries carry `lat`/`lon` and no `osm`, and so do several *buildings* elsewhere.
 *   - "no OSM id" is therefore NOT the definition. The owner's 71 entries with no `osm` reconcile exactly:
 *     **52 `include` stubs**, which are not entries at all, and **19 genuine standalone entries** — 10 in
 *     `art.json`, 4 in `san-francisco.json` itself (the two wharf signs and two more), 2 in `market-mid.json`
 *     (Lotta's Fountain among them), and one each in `manual-1.json`, `stations.json` and `union-square.json`.
 *
 * `parks.json` is the proof that the manifest FILE cannot be the marker either: the Conservatory of Flowers
 * and the California Academy of Sciences are buildings with fronts and facades, and the Japanese Tea Garden
 * pagoda, the gate and the Dutch Windmill in the same file are not.
 *
 * ## How it is MARKED, without re-tagging anything by hand
 *
 * Three sources, in order, and none of them needs an edit to an existing manifest:
 *
 *   1. **An entry's own `kind`** (`LandmarkEntry.kind`, optional, new). Nothing sets it today. It exists so a
 *      new entry can declare itself and so a wrong default can be overridden in the data rather than here.
 *   2. **The builder's own module.** `ART` (`sf/art.ts`) and `PIERS` (`sf/piers.ts`) are whole records of
 *      nonbuildings, so their `Object.keys()` ARE the marking — imported, not regexed, and a builder added to
 *      either is categorised the day it is written. This is the part that scales.
 *   3. **`EXPLICIT` below.** Everything else: bridges, towers, signs, plazas, gardens, columns, the pyramid,
 *      the parvis, the station head houses. These live inside mixed district records (`PARKS` holds the
 *      Conservatory AND the windmill) and there is no honest way to derive them.
 *
 * **So yes — part of this is an explicit list, and it always will be**, because "is this a building" is a
 * judgement about the real world that no key in the data carries. The list is small (≈40 names), it is in one
 * place, and `tests/nonbuildings.test.ts` fails when a builder named by a manifest is neither classified nor
 * on the `BUILDINGS_OK` exemption list — so a new nonbuilding cannot be added silently.
 *
 * Two further populations are nonbuildings WHOLESALE, by the file they live in:
 *
 *   - `landmarks/<region>-statues.json` (`src/render/statues.ts`): GLB models with `model`, `front`, `height`,
 *     a `lat`/`lon` or an `attach` to a host landmark. Twelve in Paris. These are not `LandmarkEntry` at all
 *     and the manifest audit has never seen them.
 *   - `landmarks/<region>-fountains.json` (`src/render/fountains.ts`): moving-water pieces keyed by the NAME
 *     of a landmark. Not entries either; checked here only for "does the host it names exist".
 *
 * ## Why they need their own validation
 *
 * The review page (`tools/review-page.ts`) pairs a street photograph with a render. There is no Mapillary
 * frame of a fountain, a plaza or a submarine, and there is no "is this the right building" question to ask,
 * so every nonbuilding falls straight out of the one human check this project has. They also fail in ways a
 * building does not — see the check list below, every one of which is a defect that actually happened.
 *
 * ## Mechanical vs human
 *
 * MECHANICAL (here, and in tests/nonbuildings.test.ts — no GPU, no dev server):
 *   `geometry` `height` `ground` `intersects` `coplanar` `duplicate` `asset` `skyline` `host`
 * HUMAN (a contact sheet; `--seed-views` then `npm run views -- --city=<c> --group=nonbuilding`):
 *   does it look like the thing; is the GLB the right way round; is the z-fighting actually visible; is the
 *   plaza at the right height above the street. `coplanar` is a HEURISTIC and flags candidates for the sheet;
 *   it can neither prove nor disprove z-fighting, which depends on the depth buffer at a real camera.
 *
 *   npx vite-node tools/nonbuildings.ts --city=san-francisco
 *   npx vite-node tools/nonbuildings.ts --city=paris-centre --seed-views
 *   npx vite-node tools/nonbuildings.ts                       # every city in AUDITED
 *
 * Run through vite-node for the same reason `audit-builders.ts` is: plain node cannot import Babylon's
 * extensionless paths. The report is gated on `!VITEST` so the test can import the library half.
 */
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROCEDURAL } from '../src/render/landmarks/procedural.ts'
import { MeshBuilder } from '../src/render/buildings.ts'
import { ART } from '../src/render/landmarks/sf/art.ts'
import { PIERS } from '../src/render/landmarks/sf/piers.ts'
import { entryKind, packedIds, type LandmarkEntry } from '../src/render/landmarks.ts'
import type { StatueEntry } from '../src/render/statues.ts'
import { expandIncludes } from '../src/city/manifest.ts'
import { CITIES } from './cities.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LANDMARKS = resolve(ROOT, 'public/landmarks')

/*
 * The cities checked, and the manifest join — the same values as `tools/audit-builders.ts`, DELIBERATELY not
 * imported from it: that module runs its own report at import time (it is gated on `!VITEST`, not on being
 * the entry point), so importing it here printed the whole builder audit before this one had said a word.
 * Its API is also being changed by another agent this session.
 */
export const AUDITED = ['paris-centre', 'san-francisco']

/**
 * The manifest the GAME would load for a city — `landmarks/<city>.json`, else `landmarks/<region>.json`. The
 * join that was missing when Paris went unchecked: the bake is `paris-centre`, the manifest is `paris.json`.
 */
export function manifestFor(city: string): string | null {
  const spec = CITIES.find((c) => c.id === city)
  for (const base of spec?.region ? [city, spec.region] : [city]) {
    if (existsSync(resolve(LANDMARKS, `${base}.json`))) return base
  }
  return null
}

/**
 * The sub-kinds. Not a taxonomy for its own sake: each one says what SHAPE of defect to expect — a `plaza` is
 * the coplanar/z-fighting family, a `bridge` is the skyline family, a `statue` is the GLB family.
 */
export type NonbuildingKind =
  | 'art' | 'fountain' | 'plaza' | 'garden' | 'pier' | 'bridge' | 'statue' | 'monument'
  | 'sign' | 'tower' | 'station' | 'vessel' | 'plant' | 'structure'

/** The union, at run time, so a `kind` in the JSON can be checked against it. */
export const KINDS: NonbuildingKind[] = [
  'art', 'fountain', 'plaza', 'garden', 'pier', 'bridge', 'statue', 'monument',
  'sign', 'tower', 'station', 'vessel', 'plant', 'structure',
]

/** Whole records that are nonbuildings top to bottom — the part of the marking that needs no maintenance. */
const BY_MODULE: [Record<string, unknown>, NonbuildingKind][] = [
  [ART, 'art'],
  [PIERS, 'pier'],
]

/**
 * The rest, named. Every one of these sits inside a record that also holds real buildings, so it cannot be
 * derived. Keep it sorted by kind; add a name here the day a nonbuilding builder is written.
 */
export const EXPLICIT: Record<string, NonbuildingKind> = {
  // bridges — these bind through the city SKYLINE (tools/cities.ts), not through any manifest
  goldenGateBridge: 'bridge', bayBridge: 'bridge', bayBridgeNear: 'bridge',
  // masts and lattices: a tower with no floors is not a building
  sutroTower: 'tower', eiffelTower: 'tower', eiffelTowerFull: 'tower', tourSaintJacques: 'tower',
  // signs and lettering
  wharfSign: 'sign', ghirardelliSign: 'sign',
  // monuments, columns, arches: solid, no interior a rider can read
  colonneDeJuillet: 'monument', colonneVendome: 'monument', monumentRepublique: 'monument',
  arcDeTriomphe: 'monument', operaArch: 'monument', saintDenysPortico: 'monument',
  burenColumns: 'monument',
  // San Francisco's figure monuments (sf/monuments.ts, 2026-10-04)
  pioneerMonument: 'monument', mckinleyMonument: 'monument', goetheSchiller: 'monument', figureOnPedestal: 'monument', emptyPedestal: 'monument',
  // the deck of Ferry Plaza on its piles (sf/marina.ts)
  plazaDeck: 'plaza',
  // the two equestrian statues that are built rather than modelled (paris/equestrian.ts)
  louisXIV: 'statue', fochTrocadero: 'statue',
  // plazas, parvises, courts, gardens — the flat ones, and the z-fighting family
  placeConcorde: 'plaza', trocaderoParvis: 'plaza', vosgesGarden: 'garden',
  louvrePyramid: 'plaza',
  sullyCourt: 'plaza', soubiseCourt: 'plaza', carnavaletCourt: 'plaza',
  // San Francisco's park furniture, inside the mixed PARKS record (which also holds the Conservatory of
  // Flowers and the Academy of Sciences — real buildings, on BUILDINGS_OK)
  goldenGatePavilion: 'structure', huntingtonFalls: 'structure', musicConcourse: 'plaza', japantownYagura: 'tower', unPlazaFountain: 'fountain', yodaFountain: 'fountain',
  teaGardenPagoda: 'structure', teaGardenSouthGate: 'structure', teaGardenTempleGate: 'structure', teaGardenGrounds: 'garden',
  dutchWindmill: 'structure', murphyWindmill: 'structure', spreckelsTempleOfMusic: 'structure',
  // station head houses and canopies: a mouth in the pavement with a roof over it, not a building
  unionSquareHeadhouse: 'station', powellStreetCanopy: 'station',
  // free-standing glass pavilions and kiosks in plazas, inside district records
  plazaKiosk: 'structure', bushPlazaPavilion: 'structure',
  // the Legion of Honor's glass pyramid skylight, a hospital's entrance canopy (2026-10-04)
  legionPyramid: 'structure', ucsfMbCanopy: 'structure',
  // the squares themselves, and a raised garden deck
  unionSquarePlaza: 'plaza', operaPlazaCourtyard: 'garden', civicCenterPlaza: 'plaza', bartPlaza24thSW: 'plaza', bartPlaza24thNE: 'plaza', bartPlaza16thNE: 'plaza', bartPlaza16thSW: 'plaza',
  // its own geometry, no OSM building at all: the bronze column at Market/Geary/Kearny/Third
  lottasFountain: 'fountain',
  // a ballpark open to the sky: no facade the kit could say, and nothing a street photograph settles
  oraclePark: 'structure',
}

/**
 * Builders a manifest names that are NOT nonbuildings and are known not to be — the exemption that makes the
 * "everything is classified" test meaningful. Only needed for names that look like nonbuildings and are not.
 */
export const BUILDINGS_OK: string[] = [
  // churches and a funeral chapel whose names carry "Memorial" or "Chapel" (sf/churches-5.ts, 2026-10-03)
  'hamiltonMemorialChurchOfGodInChrist', 'jonesMemorialUnitedMethodistChurch', 'sinaiMemorialChapel',
  // a HOTEL whose proper name contains "Plaza": Hotel Riu Plaza Fisherman's Wharf. The pattern is
  // matching a word inside a brand name, not a public plaza.
  'hotelRiuPlazaFishermansWharf',
  // in PARKS, and buildings: glasshouses, a tea house, a clubhouse, a restaurant
  'conservatoryOfFlowers', 'californiaAcademyOfSciences', 'teaGardenTeaHouse', 'teaGardenGiftShop', 'sparkTent', 'sparkUmbrella', 'sparkTruck', 'beachChalet',
  'presidioOfficersClub',
  // a 1924 gymnasium named "Pavilion" (kezar.ts)
  'kezarPavilion',
  // named after a plaza, a park or a tower and emphatically a building
  'foxPlaza', 'mintPlaza', 'oneMaritimePlaza', 'unPlazaFederal', 'operaPlazaTower', 'operaPlazaBlock',
  'kensingtonPark', 'marinesMemorial', 'ghirardelliClockTower', 'carillonTower', 'clockTowerBuilding',
  'montgomeryWashingtonTower', 'goldenGateTheatre', 'warMemorialOperaHouse', 'warMemorialVeterans',
  'hamiltonSquareBaptistChurch', 'goldenGateValleyLibrary', 'stockExchangeTower', 'martinLutherTower',
  'mcallisterTower', 'chaseCenter', 'oneHundredFirstPlaza', 'h4_oneMarketPlaza', 'h4_unionSquarePlazaHotel',
  // a BUILDING named after Harvey Milk (Treasure Island's Job Corps administration building), not a memorial
  'h3_harveyMilkMemorial_34313513',
  // it is a pyramid and it is 260 m of offices
  'transamericaPyramid',
  // way/1458363734, building=pagoda: a real freestanding building, not a park pavilion
  'peacePagoda',
  /*
   * And the one that matters most: Salesforce Park (BUGS.md #66, #67) is NOT its own builder. It is drawn
   * inside `salesforceTransitCenter` (sf/districts/transbay.ts), whose entry is the Transit Center — a
   * building. The motivating defect of this whole category therefore lives inside a BUILDING's builder, and
   * no per-entry marking can reach it. That is a real limit of the scheme and is written down rather than
   * papered over: the park is checked only by the contact sheet.
   */
  'salesforceTransitCenter',
  // named after "monumental" (the size of the flight, docs/MOSCONE-SOUTH.md), not a monument — a stair
  'msFolsomMonumentalStair',
]

/** Builder name → kind, from all three sources. `undefined` means "a building, as far as anyone has said". */
export function kindOfBuilder(name: string): NonbuildingKind | undefined {
  if (EXPLICIT[name]) return EXPLICIT[name]
  for (const [rec, kind] of BY_MODULE) if (name in rec) return kind
  return undefined
}

/** Every classified builder name, for the test's coverage assertion. */
export function classifiedBuilders(): Record<string, NonbuildingKind> {
  const out: Record<string, NonbuildingKind> = {}
  for (const [rec, kind] of BY_MODULE) for (const k of Object.keys(rec)) out[k] = kind
  return { ...out, ...EXPLICIT }
}

/** One nonbuilding, whichever of the three paths it arrives by. */
export interface Nonbuilding {
  name: string
  kind: NonbuildingKind
  /** manifest = a LandmarkEntry; skyline = tools/cities.ts; statue = <region>-statues.json */
  path: 'manifest' | 'skyline' | 'statue'
  file: string
  procedural?: string
  /** a GLB, relative to public/models/ (statues) or public/ (a `file` entry) */
  model?: string
  lat?: number
  lon?: number
  size?: [number, number]
  height?: number
  osm: number[]
  /** its lat/lon and size came from the BAKED building it names, not from the entry */
  fromBake?: boolean
  entry: LandmarkEntry | StatueEntry
}

export interface Issue {
  /** the check that raised it */
  check: 'geometry' | 'height' | 'ground' | 'intersects' | 'coplanar' | 'duplicate' | 'asset' | 'skyline' | 'host' | 'unclassified'
  name: string
  kind: string
  detail: string
  /** an intended, legitimate state — "declared, asset not modelled yet" — not a defect */
  pending?: boolean
}

export interface CityNonbuildings {
  city: string
  manifest: string | null
  items: Nonbuilding[]
  issues: Issue[]
  counts: Record<string, number>
}

type Sourced = LandmarkEntry & { __file: string }

async function loadManifest(base: string): Promise<Sourced[]> {
  const top = JSON.parse(readFileSync(resolve(LANDMARKS, `${base}.json`), 'utf8')) as Sourced[]
  const entries = await expandIncludes<Sourced>(top, async (p) => {
    const f = resolve(LANDMARKS, p)
    if (!existsSync(f)) return null
    return (JSON.parse(readFileSync(f, 'utf8')) as Record<string, unknown>[]).map((e) => ({ ...e, __file: p }))
  })
  for (const e of entries) if (!e.__file) e.__file = `${base}.json`
  return entries
}

/** The statues file for a city, by the same city-then-region rule `statueManifest()` uses at run time. */
function statueFile(city: string): { file: string; entries: StatueEntry[] } | null {
  const spec = CITIES.find((c) => c.id === city)
  for (const n of spec?.region ? [city, spec.region] : [city]) {
    const f = resolve(LANDMARKS, `${n}-statues.json`)
    if (existsSync(f)) return { file: `${n}-statues.json`, entries: JSON.parse(readFileSync(f, 'utf8')) as StatueEntry[] }
  }
  return null
}

/** The fountain-piece overlay, which names its host landmark rather than standing on its own. */
function fountainFile(city: string): { file: string; entries: { landmark?: string }[] } | null {
  const spec = CITIES.find((c) => c.id === city)
  for (const n of spec?.region ? [city, spec.region] : [city]) {
    const f = resolve(LANDMARKS, `${n}-fountains.json`)
    if (existsSync(f)) return { file: `${n}-fountains.json`, entries: JSON.parse(readFileSync(f, 'utf8')) as { landmark?: string }[] }
  }
  return null
}

// ---------------------------------------------------------------- the baked city

interface Baked {
  terrain: { x0: number; z0: number; step: number; cols: number; rows: number; heights: number[] }
  origin: { lat: number; lon: number }
  /** every building's ring, in local metres, with its id */
  buildings: { id: number; ring: number[]; height: number }[]
}

function loadBake(city: string): Baked | null {
  const dir = resolve(ROOT, 'public/cities', city)
  if (!existsSync(resolve(dir, 'tiles'))) return null
  const index = JSON.parse(readFileSync(resolve(dir, 'index.json'), 'utf8')) as
    { origin: Baked['origin']; terrain: Baked['terrain'] }
  const buildings: Baked['buildings'] = []
  for (const f of readdirSync(resolve(dir, 'tiles'))) {
    if (!f.endsWith('.json')) continue
    const t = JSON.parse(readFileSync(resolve(dir, 'tiles', f), 'utf8')) as
      { buildings?: { id: number; ring: number[]; height: number }[]; fringe?: { id: number; ring: number[]; height: number }[] }
    for (const b of [...(t.buildings ?? []), ...(t.fringe ?? [])]) buildings.push({ id: b.id, ring: b.ring, height: b.height })
  }
  return { terrain: index.terrain, origin: index.origin, buildings }
}

/** The bake's own projection, as `src/city/geo.ts` does it: metres east and north of the origin. */
function toLocal(o: { lat: number; lon: number }, lat: number, lon: number): { x: number; z: number } {
  const mLat = 111_320
  const mLon = 111_320 * Math.cos((o.lat * Math.PI) / 180)
  return { x: (lon - o.lon) * mLon, z: (lat - o.lat) * mLat }
}

/** Bilinear height off the baked terrain grid — the same surface `terrain.heightAt` samples at run time. */
function heightAt(t: Baked['terrain'], x: number, z: number): number {
  const fx = Math.min(t.cols - 1, Math.max(0, (x - t.x0) / t.step))
  const fz = Math.min(t.rows - 1, Math.max(0, (z - t.z0) / t.step))
  const i = Math.min(t.cols - 2, Math.floor(fx))
  const j = Math.min(t.rows - 2, Math.floor(fz))
  const u = fx - i
  const v = fz - j
  const h = (a: number, b: number): number => t.heights[b * t.cols + a] ?? 0
  return h(i, j) * (1 - u) * (1 - v) + h(i + 1, j) * u * (1 - v) + h(i, j + 1) * (1 - u) * v + h(i + 1, j + 1) * u * v
}

/** Axis-aligned rectangle overlap of two rings — cheap, and a superset of true polygon overlap. */
function bbox(pts: { x: number; z: number }[]): { x0: number; x1: number; z0: number; z1: number } {
  return {
    x0: Math.min(...pts.map((p) => p.x)), x1: Math.max(...pts.map((p) => p.x)),
    z0: Math.min(...pts.map((p) => p.z)), z1: Math.max(...pts.map((p) => p.z)),
  }
}

/** Does a point fall inside a ring (even-odd)? The precise half of the intersection test. */
function inRing(r: { x: number; z: number }[], x: number, z: number): boolean {
  let hit = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) hit = !hit
  }
  return hit
}

const unpack = (ring: number[]): { x: number; z: number }[] => {
  const out: { x: number; z: number }[] = []
  for (let i = 0; i < ring.length; i += 2) out.push({ x: ring[i], z: ring[i + 1] })
  return out
}

// ---------------------------------------------------------------- the checks

/**
 * Build the model headless. Every builder writes into a `MeshBuilder` — plain arrays, no Babylon, no GPU —
 * so "does it produce geometry, is it finite, how big is it" is answerable in a unit test. That is the whole
 * reason the geometry half of this is mechanical.
 */
export function buildIt(procedural: string, size?: [number, number], height?: number):
  { tris: number; minY: number; maxY: number; hx: number; hz: number; finite: boolean } | null {
  const build = PROCEDURAL[procedural]
  if (!build) return null
  const mb = new MeshBuilder()
  build(mb, { hx: (size?.[0] ?? 20) / 2, hz: (size?.[1] ?? 20) / 2, height: height ?? 20 })
  const p = mb.positions
  if (p.length === 0) return { tris: 0, minY: 0, maxY: 0, hx: 0, hz: 0, finite: true }
  let minY = Infinity; let maxY = -Infinity; let mx = 0; let mz = 0; let finite = true
  for (let i = 0; i < p.length; i += 3) {
    if (!Number.isFinite(p[i]) || !Number.isFinite(p[i + 1]) || !Number.isFinite(p[i + 2])) { finite = false; continue }
    minY = Math.min(minY, p[i + 1]); maxY = Math.max(maxY, p[i + 1])
    mx = Math.max(mx, Math.abs(p[i])); mz = Math.max(mz, Math.abs(p[i + 2]))
  }
  return { tris: mb.indices.length / 3, minY, maxY, hx: mx, hz: mz, finite }
}

/**
 * The z-fighting HEURISTIC. Coplanar horizontal surfaces are this category's recurring defect (#67, Salesforce
 * Park), and they are recognisable in the built geometry: two large horizontal facets at almost the same
 * height. This cannot prove z-fighting — that depends on the depth buffer at a real camera — so a hit is a
 * CANDIDATE FOR THE CONTACT SHEET, never a verdict.
 */
export function coplanarSlabs(procedural: string, size?: [number, number], height?: number):
  { y: number; area: number; faces: number }[] {
  const build = PROCEDURAL[procedural]
  if (!build) return []
  const mb = new MeshBuilder()
  build(mb, { hx: (size?.[0] ?? 20) / 2, hz: (size?.[1] ?? 20) / 2, height: height ?? 20 })
  const p = mb.positions
  const n = mb.normals
  // horizontal triangles, bucketed to the centimetre: a bucket with several square metres in it is a slab
  const bucket = new Map<number, { area: number; faces: number; cells: Set<number> }>()
  for (let t = 0; t < mb.indices.length; t += 3) {
    const [a, b, c] = [mb.indices[t], mb.indices[t + 1], mb.indices[t + 2]]
    if (Math.abs(n[a * 3 + 1]) < 0.98) continue
    const ys = [p[a * 3 + 1], p[b * 3 + 1], p[c * 3 + 1]]
    if (Math.max(...ys) - Math.min(...ys) > 0.01) continue
    const ax = p[b * 3] - p[a * 3]; const az = p[b * 3 + 2] - p[a * 3 + 2]
    const bx = p[c * 3] - p[a * 3]; const bz = p[c * 3 + 2] - p[a * 3 + 2]
    const area = Math.abs(ax * bz - az * bx) / 2
    const key = Math.round(ys[0] * 100)
    const got = bucket.get(key) ?? { area: 0, faces: 0, cells: new Set<number>() }
    got.area += area
    got.faces++
    // the 2 m cells it covers (its bounding box), so a pair must also share ground in plan to count
    const xs = [p[a * 3], p[b * 3], p[c * 3]], zs = [p[a * 3 + 2], p[b * 3 + 2], p[c * 3 + 2]]
    for (let i = Math.floor(Math.min(...xs) / 2); i <= Math.floor(Math.max(...xs) / 2); i++) {
      for (let j = Math.floor(Math.min(...zs) / 2); j <= Math.floor(Math.max(...zs) / 2); j++) got.cells.add(i * 100003 + j)
    }
    bucket.set(key, got)
  }
  // two slabs within 2 cm of each other, each over 4 m² — the shape of the Salesforce Park defect
  // 30 m² is about the size at which a coplanar pair is visible as shimmer from a bike rather than a seam
  const slabs = [...bucket.entries()].filter(([, v]) => v.area > 30).sort((a, b) => a[0] - b[0])
  const out: { y: number; area: number; faces: number }[] = []
  for (let i = 1; i < slabs.length; i++) {
    if (slabs[i][0] - slabs[i - 1][0] > 2) continue
    // (two levels 2 cm apart at opposite ends of a plaza do not fight: they must overlap)
    const [small, big] = slabs[i][1].cells.size < slabs[i - 1][1].cells.size ? [slabs[i][1].cells, slabs[i - 1][1].cells] : [slabs[i - 1][1].cells, slabs[i][1].cells]
    let shared = 0
    for (const k of small) if (big.has(k)) shared++
    if (shared > 0) out.push({ y: slabs[i][0] / 100, area: slabs[i][1].area, faces: slabs[i][1].faces })
  }
  return out
}

/**
 * A GLB, read as a file rather than rendered: does it exist, and is its root transform MIRRORED?
 *
 * Mirroring is this category's specific trap (the memory note: a glTF `__root__` carries a z-flip and
 * thin-instance matrices are in PARENT space). A negative determinant in a node's own matrix or an odd number
 * of negative scale components means the asset is mirrored IN THE FILE, which no thumbnail reveals — a
 * mirrored statue looks like a statue. The loader's own `__root__` z-flip is import-time and is NOT visible
 * here; that half stays human.
 */
export function inspectGlb(abs: string): { ok: boolean; reason?: string; mirroredNodes?: number; nodes?: number } {
  if (!existsSync(abs)) return { ok: false, reason: 'file does not exist' }
  const buf = readFileSync(abs)
  if (buf.length < 20 || buf.readUInt32LE(0) !== 0x46546c67) return { ok: false, reason: 'not a GLB (bad magic)' }
  const jsonLen = buf.readUInt32LE(12)
  if (buf.readUInt32LE(16) !== 0x4e4f534a) return { ok: false, reason: 'first chunk is not JSON' }
  let gltf: { nodes?: { scale?: number[]; matrix?: number[] }[]; meshes?: unknown[] }
  try { gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8')) } catch (e) { return { ok: false, reason: `unparseable JSON chunk: ${String(e)}` } }
  if (!gltf.meshes?.length) return { ok: false, reason: 'no meshes' }
  let mirrored = 0
  for (const n of gltf.nodes ?? []) {
    if (n.scale && n.scale.filter((s) => s < 0).length % 2 === 1) mirrored++
    else if (n.matrix) {
      const m = n.matrix
      const det = m[0] * (m[5] * m[10] - m[6] * m[9]) - m[1] * (m[4] * m[10] - m[6] * m[8]) + m[2] * (m[4] * m[9] - m[5] * m[8])
      if (det < 0) mirrored++
    }
  }
  return { ok: true, mirroredNodes: mirrored, nodes: (gltf.nodes ?? []).length }
}

// ---------------------------------------------------------------- the audit

export async function nonbuildingsOf(city: string): Promise<CityNonbuildings> {
  const spec = CITIES.find((c) => c.id === city)
  const base = manifestFor(city)
  const items: Nonbuilding[] = []
  const issues: Issue[] = []

  const entries: Sourced[] = base ? await loadManifest(base) : []

  // ---- unclassified: a manifest builder that is neither classified nor exempted is a judgement nobody made
  for (const e of entries) {
    if (!e.procedural || entryKind(e) === 'restyle' || entryKind(e) === 'placeholder') continue
    /*
     * `LandmarkEntry.kind` is a plain `string` — the manifests are JSON and nothing validates them — so a
     * typo (`"fountian"`) would otherwise become a nonbuilding of an unknown kind and pass every check. It
     * is validated against the union here, and a bad value is a finding rather than a silent acceptance.
     */
    const declared = e.kind as NonbuildingKind | undefined
    if (declared !== undefined && !KINDS.includes(declared)) {
      issues.push({ check: 'unclassified', name: e.name, kind: String(e.kind), detail: `entry declares kind "${String(e.kind)}", which is not one of ${KINDS.join(', ')}` })
    }
    const k = (declared !== undefined && KINDS.includes(declared) ? declared : undefined) ?? kindOfBuilder(e.procedural)
    if (k) {
      items.push({
        name: e.name, kind: k, path: 'manifest', file: e.__file, procedural: e.procedural, model: e.file,
        lat: e.lat, lon: e.lon, size: e.size as [number, number] | undefined, height: e.height,
        osm: packedIds(e), entry: e,
      })
    }
  }

  // ---- the skyline: the path no manifest check can see at all
  for (const s of spec?.skyline ?? []) {
    const k = kindOfBuilder(s.procedural)
    if (!k) continue
    items.push({
      name: s.name, kind: k, path: 'skyline', file: 'tools/cities.ts (skyline)', procedural: s.procedural,
      lat: s.lat, lon: s.lon, height: s.heightM, osm: [], entry: { name: s.name, procedural: s.procedural },
    })
  }

  // ---- the statues: a whole manifest of GLB nonbuildings that nothing has ever audited
  const st = statueFile(city)
  for (const e of st?.entries ?? []) {
    items.push({
      name: e.name, kind: 'statue', path: 'statue', file: st!.file, model: e.model,
      lat: e.lat, lon: e.lon, height: e.height, osm: [], entry: e,
    })
  }

  const bake = loadBake(city)
  /*
   * An entry positioned by OSM id has no lat/lon of its own, and half this category is positioned that way
   * (all sixteen SF piers). Its position IS knowable — the bake holds the building's ring — so resolve it
   * here, or the positional checks and the contact sheet silently cover only the standalone half.
   */
  if (bake) {
    const byId = new Map(bake.buildings.map((b) => [b.id, b]))
    const mLat = 111_320
    const mLon = 111_320 * Math.cos((bake.origin.lat * Math.PI) / 180)
    for (const it of items) {
      if (it.lat !== undefined || it.osm.length === 0) continue
      const b = it.osm.map((id) => byId.get(id)).find((q) => q !== undefined)
      if (!b) continue
      const r = unpack(b.ring)
      const cx = r.reduce((a, q) => a + q.x, 0) / r.length
      const cz = r.reduce((a, q) => a + q.z, 0) / r.length
      it.lat = bake.origin.lat + cz / mLat
      it.lon = bake.origin.lon + cx / mLon
      // and its true extent, so the intersection test and the camera distance are not a guess
      const bb = bbox(r)
      it.size = it.size ?? [bb.x1 - bb.x0, bb.z1 - bb.z0]
      it.fromBake = true
    }
  }
  if (!bake) {
    issues.push({ check: 'ground', name: city, kind: '-', detail: `no baked tiles: public/cities/${city}/tiles does not exist — every positional check SKIPPED` })
  }

  // ---------------- per item
  for (const it of items) {
    const label = { name: it.name, kind: it.kind }

    // geometry: exists, finite, a sane triangle count
    if (it.procedural) {
      const g = buildIt(it.procedural, it.size, it.height)
      if (!g) issues.push({ ...label, check: 'geometry', detail: `no builder "${it.procedural}" in PROCEDURAL` })
      else if (g.tris === 0) issues.push({ ...label, check: 'geometry', detail: `builder "${it.procedural}" produced NO geometry` })
      else if (!g.finite) issues.push({ ...label, check: 'geometry', detail: `builder "${it.procedural}" produced non-finite vertices` })
      else {
        if (g.tris > 120_000) issues.push({ ...label, check: 'geometry', detail: `${g.tris} triangles — heavy for a ${it.kind}` })
        // the local frame's contract (procedural.ts): origin at the base centre, +y up. A model whose lowest
        // vertex is well above 0 is FLOATING; well below, it is SUNK, since `place()` puts y at the ground.
        if (g.minY > 0.5) issues.push({ ...label, check: 'height', detail: `lowest vertex is +${g.minY.toFixed(2)} m in the model's own frame — floats above the ground it is placed on` })
        /*
         * …except where going below the ground is the model: a pier stands on legs in the water, a bridge's
         * piers go down to the bed, a vessel floats in it. All sixteen SF piers build to exactly −4.00 m,
         * which is a decision, not a defect.
         */
        if (g.minY < -1.5 && !['pier', 'bridge', 'vessel'].includes(it.kind)) issues.push({ ...label, check: 'height', detail: `lowest vertex is ${g.minY.toFixed(2)} m — sunk below the ground it is placed on` })
        if (it.height !== undefined && g.maxY > 0 && (g.maxY > it.height * 2.5 || g.maxY < it.height * 0.4)) {
          issues.push({ ...label, check: 'height', detail: `declares height ${it.height} m, builds ${g.maxY.toFixed(1)} m` })
        }
      }

      /*
       * One line per model, the worst pair only. Every coplanar pair in a bridge deck is the same defect seen
       * forty times, and a list that long is a list nobody reads — which is how #67 survived.
       */
      const slabs = coplanarSlabs(it.procedural, it.size, it.height).sort((a, b) => b.area - a.area)
      if (slabs.length) {
        const s = slabs[0]
        issues.push({ ...label, check: 'coplanar', detail: `${slabs.length} pair(s) of horizontal surfaces within 2 cm; the largest ${s.area.toFixed(0)} m² at y=${s.y.toFixed(2)} m — z-fighting CANDIDATE, confirm on the contact sheet` })
      }
    }

    // GLB assets: missing is a LEGITIMATE state (MODELS_NEEDED.md), mirrored is a defect
    if (it.model) {
      const abs = it.path === 'statue' ? resolve(ROOT, 'public/models', it.model) : resolve(ROOT, 'public', it.model)
      const g = inspectGlb(abs)
      if (!g.ok && g.reason === 'file does not exist') {
        issues.push({ ...label, check: 'asset', pending: true, detail: `declared but not modelled yet: ${it.model} (MODELS_NEEDED.md)` })
      } else if (!g.ok) {
        issues.push({ ...label, check: 'asset', detail: `${it.model}: ${g.reason}` })
      } else if (g.mirroredNodes) {
        issues.push({ ...label, check: 'asset', detail: `${it.model}: ${g.mirroredNodes} of ${g.nodes} nodes carry a NEGATIVE-determinant transform — the asset is mirrored in the file` })
      }
    }

    // where it says it is: ground under it, and what it stands in
    /*
     * Only for an entry that declares its own point. One whose position came from the bake stands on the
     * footprint it names, so "does it overlap a building" and "how much relief is under it" are questions
     * about OSM's outline rather than about the entry, and every one of them would report itself.
     */
    if (bake && !it.fromBake && it.lat !== undefined && it.lon !== undefined && it.path !== 'skyline') {
      const p = toLocal(bake.origin, it.lat, it.lon)
      const hx = (it.size?.[0] ?? 8) / 2
      const hz = (it.size?.[1] ?? 8) / 2
      const corners = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz], [0, 0]].map(([dx, dz]) => ({ x: p.x + dx, z: p.z + dz }))
      const hs = corners.map((c) => heightAt(bake.terrain, c.x, c.z))
      const relief = Math.max(...hs) - Math.min(...hs)
      /*
       * `place()` sinks the model to the LOWEST ground under its footprint minus 0.5 m, so relief across the
       * footprint is exactly how far the far side floats. San Francisco has 122 m of it; a flat plaza on a
       * 10% street is a metre of daylight under one edge.
       */
      if (relief > 1.5) issues.push({ ...label, check: 'ground', detail: `${relief.toFixed(1)} m of terrain relief across its ${(hx * 2).toFixed(0)}×${(hz * 2).toFixed(0)} m footprint — the high side is buried or the low side floats` })

      // what it intersects: buildings the entry does NOT claim, whose footprint its own overlaps
      const own = new Set(it.osm)
      const mine = [
        { x: p.x - hx, z: p.z - hz }, { x: p.x + hx, z: p.z - hz },
        { x: p.x + hx, z: p.z + hz }, { x: p.x - hx, z: p.z + hz },
      ]
      const mb = bbox(mine)
      const hits: string[] = []
      for (const b of bake.buildings) {
        if (own.has(b.id)) continue
        const r = unpack(b.ring)
        const rb = bbox(r)
        if (rb.x1 < mb.x0 || rb.x0 > mb.x1 || rb.z1 < mb.z0 || rb.z0 > mb.z1) continue
        // precise: a corner of one inside the other, either way round
        const overlap = mine.some((q) => inRing(r, q.x, q.z)) || r.some((q) => inRing(mine, q.x, q.z))
        if (overlap) hits.push(String(b.id))
      }
      if (hits.length) issues.push({ ...label, check: 'intersects', detail: `its footprint overlaps ${hits.length} baked building(s) it does not claim: ${hits.slice(0, 6).join(', ')}${hits.length > 6 ? ' …' : ''}` })
    }
  }

  // ---------------- duplicates
  const byBuilder = new Map<string, Nonbuilding[]>()
  const byName = new Map<string, Nonbuilding[]>()
  for (const it of items) {
    if (it.procedural) byBuilder.set(it.procedural, [...(byBuilder.get(it.procedural) ?? []), it])
    byName.set(it.name, [...(byName.get(it.name) ?? []), it])
  }
  for (const [k, v] of byBuilder) {
    if (v.length > 1) issues.push({ check: 'duplicate', name: k, kind: v[0].kind, detail: `builder named by ${v.length} entries: ${v.map((x) => `"${x.name}" [${x.file}]`).join(', ')} — manifest precedence is FIRST WINS, so the rest are dead` })
  }
  for (const [k, v] of byName) {
    if (v.length > 1 && v.every((x) => x.path === v[0].path)) {
      issues.push({ check: 'duplicate', name: k, kind: v[0].kind, detail: `${v.length} entries share this name: ${v.map((x) => x.file).join(', ')}` })
    }
  }
  /*
   * Two standalone nonbuildings within 15 m of each other. This is the hole the foxPlaza / lottasFountain
   * duplicates fell through: `shadowed()` in audit-builders.ts says outright that "a standalone entry has no
   * ids, so it can neither shadow nor be shadowed" — the claim loop cannot see a duplicate that is positioned
   * by lat/lon, and two copies of the same fountain stand inside each other.
   */
  const pts = items.filter((i) => i.lat !== undefined && i.lon !== undefined && i.path !== 'skyline')
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot((pts[i].lat! - pts[j].lat!) * 111_320, (pts[i].lon! - pts[j].lon!) * 111_320 * Math.cos((pts[i].lat! * Math.PI) / 180))
      if (d < 15) issues.push({ check: 'duplicate', name: `${pts[i].name} / ${pts[j].name}`, kind: pts[i].kind, detail: `two standalone nonbuildings ${d.toFixed(1)} m apart (${pts[i].file}, ${pts[j].file}) — the claim loop cannot see this, neither has OSM ids` })
    }
  }

  // ---------------- the skyline path, which the manifest audit does not reach
  for (const s of spec?.skyline ?? []) {
    if (!(s.procedural in PROCEDURAL)) {
      issues.push({ check: 'skyline', name: s.name, kind: kindOfBuilder(s.procedural) ?? 'building', detail: `procedural "${s.procedural}" is not in the registry — the constructor's \`if (!build) continue\` drops it in silence` })
      continue
    }
    const g = buildIt(s.procedural, undefined, s.heightM)
    if (!g || g.tris === 0) { issues.push({ check: 'skyline', name: s.name, kind: 'bridge', detail: `builds no geometry at the skyline's fit (hx=20, hz=20, height=${s.heightM})` }); continue }
    /*
     * A skyline stand-in is drawn in rendering group 0, WITH THE SKY DOME: "every solid thing in the city
     * draws over it, so it shows only where there is sky". That is right for a tower five kilometres out and
     * wrong for anything INSIDE the city box, where the city's own ground, water and buildings are drawn over
     * it — and a long low thing near the horizon is exactly what they cover.
     */
    const ext = {
      west: (spec!.box?.west ?? spec!.radius), east: (spec!.box?.east ?? spec!.radius),
      north: (spec!.box?.north ?? spec!.radius), south: (spec!.box?.south ?? spec!.radius),
    }
    const p = bake ? toLocal(bake.origin, s.lat, s.lon) : toLocal(spec!.centre, s.lat, s.lon)
    const inBox = p.x > -ext.west && p.x < ext.east && p.z > -ext.south && p.z < ext.north
    /*
     * Inside the box is only a problem when NOTHING ELSE draws the thing. `update()` disables a stand-in once
     * the landmark's own model is placed within 1300 m of the eye, matched BY NAME — so the Panthéon, Notre-
     * Dame and the Tour Eiffel, which all have manifest entries of the same name, hand over correctly and are
     * fine. A skyline entry with no manifest twin has nothing to hand over to: it stays a stand-in at every
     * distance, in renderingGroupId 0 with the sky dome, behind every solid thing in the city. That is right
     * for a tower on the far horizon and wrong for a long low structure inside the box, which the city's own
     * ground, water and buildings draw straight over.
     */
    const twin = entries.some((e) => e.name === s.name && e.procedural)
    if (inBox && !twin) {
      issues.push({
        check: 'skyline', name: s.name, kind: kindOfBuilder(s.procedural) ?? 'building',
        detail: `stands INSIDE the city box (${Math.round(p.x)} E, ${Math.round(p.z)} N of the origin; the box reaches `
          + `${ext.east} E / ${ext.west} W / ${ext.north} N / ${ext.south} S) and NO manifest entry shares its name, so `
          + `\`update()\`'s hand-over to a real model never fires. It is drawn for ever as a stand-in in `
          + `renderingGroupId 0 — behind every solid thing in the city, including the ground and water between the `
          + `rider and it. Model top ${g.maxY.toFixed(0)} m of a declared ${s.heightM} m`,
      })
    }
  }

  // ---------------- the fountain overlay: does the landmark it names exist
  const fo = fountainFile(city)
  if (fo) {
    const names = new Set([...entries.map((e) => e.name), ...(spec?.skyline ?? []).map((s) => s.name)])
    for (const f of new Set(fo.entries.map((e) => e.landmark).filter(Boolean) as string[])) {
      if (!names.has(f)) issues.push({ check: 'host', name: f, kind: 'fountain', detail: `${fo.file} attaches water to a landmark no manifest entry or skyline names — the pieces are never placed` })
    }
  }
  // ---------------- statue attachments: the host must be a landmark that is actually placed
  for (const e of st?.entries ?? []) {
    const to = (e as StatueEntry).attach?.to
    if (!to) continue
    const host = entries.find((x) => x.name === to)
    if (!host) issues.push({ check: 'host', name: e.name, kind: 'statue', detail: `attaches to "${to}", which no manifest entry names — the statue never resolves a position and never loads` })
  }

  const counts: Record<string, number> = {}
  for (const it of items) counts[it.kind] = (counts[it.kind] ?? 0) + 1
  return { city, manifest: base, items, issues, counts }
}

/**
 * Every builder that a manifest entry or a city skyline NAMES, across the audited cities. The scope for the
 * "nobody classified this" guard: the registry also holds the kit catalogue and the modelling experiments,
 * which no manifest places and for which the question does not arise.
 */
export function namedBuilders(cities: string[] = AUDITED): string[] {
  const out = new Set<string>()
  for (const city of cities) {
    const spec = CITIES.find((c) => c.id === city)
    for (const s of spec?.skyline ?? []) out.add(s.procedural)
    const base = manifestFor(city)
    if (!base) continue
    const seen = new Set<string>()
    const walk = (file: string): void => {
      if (seen.has(file)) return
      seen.add(file)
      const f = resolve(LANDMARKS, file)
      if (!existsSync(f)) return
      for (const e of JSON.parse(readFileSync(f, 'utf8')) as { procedural?: string; include?: string }[]) {
        if (e.procedural) out.add(e.procedural)
        if (e.include) walk(e.include)
      }
    }
    walk(`${base}.json`)
  }
  return [...out].sort()
}

/** A stable key for a finding, so the test can list known ones and fail in both directions. */
export const issueKey = (i: Issue): string => `${i.check} | ${i.name}`

/** The nonbuildings of every audited city. */
export async function allNonbuildings(cities: string[] = AUDITED): Promise<CityNonbuildings[]> {
  const out: CityNonbuildings[] = []
  for (const c of cities) out.push(await nonbuildingsOf(c))
  return out
}

// ---------------------------------------------------------------- the human half: views

/**
 * One view per nonbuilding, appended to `views/<city>.json` in the group `nonbuilding`, so the existing
 * contact-sheet tool shoots the whole category in one browser session:
 *
 *   npx vite-node tools/nonbuildings.ts --city=san-francisco --seed-views
 *   node --experimental-strip-types tools/views.ts --city=san-francisco --group=nonbuilding --batch=12
 *
 * Deliberately NOT a new renderer. `tools/views.ts` already loads the real city on the dev server, waits for
 * the tiles and the models, and lays the shots out four across. A nonbuilding is small and low, so the camera
 * stands at 2.2× its size and a third of its height — close enough to see a mirrored statue or a floating
 * slab, far enough to see the ground it stands on and the buildings it may be cutting through.
 */
function seedViews(city: string, items: Nonbuilding[]): void {
  const file = resolve(ROOT, 'views', `${city}.json`)
  const have: { name: string; group: string }[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []
  const known = new Set(have.map((v) => v.name))
  const mLat = 111_320
  const fresh = []
  for (const it of items) {
    if (it.lat === undefined || it.lon === undefined) continue
    const name = `NB — ${it.name}`
    if (known.has(name)) continue
    const size = Math.max(it.size?.[0] ?? 12, it.size?.[1] ?? 12)
    const h = it.height ?? 8
    const d = Math.max(22, size * 2.2, h * 1.6)
    const mLon = mLat * Math.cos((it.lat * Math.PI) / 180)
    fresh.push({
      // NOT `seeded: true`: `views.ts --seed` keeps only `!v.seeded` views and then regenerates from
      // `window.__placed()`, which does not know these names — so a later --seed run would delete every one.
      name, group: 'nonbuilding',
      // from the south-west, which is where San Francisco's and Paris's light comes from in the middle of the day
      from: [Math.round((it.lat - (d * 0.7) / mLat) * 1e6) / 1e6, Math.round((it.lon - (d * 0.7) / mLon) * 1e6) / 1e6, Math.max(3, h * 0.6)],
      to: [it.lat, it.lon, Math.max(1.5, h * 0.35)],
      note: `${it.kind} · ${it.path} · ${it.procedural ?? it.model ?? ''}`,
    })
  }
  mkdirSync(resolve(ROOT, 'views'), { recursive: true })
  writeFileSync(file, `${JSON.stringify([...have, ...fresh], null, 1)}\n`)
  console.log(`seeded ${fresh.length} nonbuilding views → views/${city}.json (${have.length + fresh.length} in all)`)
}

// ---------------------------------------------------------------- the report

if (!process.env.VITEST) {
  const named = process.argv.filter((a) => a.startsWith('--city=')).map((a) => a.slice(7))
  const cities = named.length ? named : AUDITED
  const all = await allNonbuildings(cities)
  for (const c of all) {
    console.log(`\n======== ${c.city}  (manifest ${c.manifest ? `landmarks/${c.manifest}.json` : 'NONE'})`)
    console.log(`  ${c.items.length} nonbuildings: ${Object.entries(c.counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${k}`).join(', ')}`)
    const paths: Record<string, number> = {}
    for (const i of c.items) paths[i.path] = (paths[i.path] ?? 0) + 1
    console.log(`  by path: ${Object.entries(paths).map(([k, v]) => `${v} ${k}`).join(', ')}`)
    const order = ['geometry', 'skyline', 'intersects', 'duplicate', 'asset', 'host', 'height', 'ground', 'coplanar']
    for (const check of order) {
      const rows = c.issues.filter((i) => i.check === check)
      if (!rows.length) continue
      console.log(`\n  -- ${check} — ${rows.length}`)
      for (const r of rows) console.log(`     ${r.pending ? '(pending) ' : ''}[${r.kind}] ${r.name}: ${r.detail}`)
    }
    if (c.issues.length === 0) console.log('  no findings')
    if (process.argv.includes('--seed-views')) seedViews(c.city, c.items)
  }
}
