/**
 * BOATS UNDER WAY ON THE BAY (owner, 2026-10-02: "way too many trains, and no boats on the water … marinas and boats
 * are the whole identity"). San Francisco has no river line; its traffic runs on ROUTES — the real ferry runs out of
 * the Ferry Building and Pier 33, and the sailing water off the Marina and in Richardson Bay — each a line the shared
 * engine (render/river-traffic.ts) sends its boats along and back, keeping right, turning at the ends. Off the built
 * tiles, or more than 1.6 km from the rider, a boat is not drawn, so the long runs cost nothing until they are near.
 *
 * The fleet: the Golden Gate and SF Bay ferries' white catamarans, the Alcatraz boat, and sailboats.
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, prism, wedge, type Rgb } from '../models.ts'
import { DARK, F, GLASS, WHITE, bow, passengers, rnd, type BoatKind } from '../river-traffic.ts'

const NAVY: Rgb = [0.12, 0.2, 0.42]
const SAIL: Rgb = [0.95, 0.95, 0.92]
const SPAR: Rgb = [0.75, 0.76, 0.78]

/** A high-speed catamaran ferry: two white hulls, a two-deck cabin glazed all round, a navy band, an open top deck. */
function ferry(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 20
  const B = 5
  for (const s of [-1, 1]) {
    box(out, s * (B - 1.1), 0.6, -0.5, 1.1, 1.1, L - 1.5, WHITE, F)
    bow(out, L - 2, 1.1, 0.6, 1.0, WHITE, 0.7)
  }
  // the main deck's cabin and the upper deck's, set back
  box(out, 0, 2.6, -1, B, 1.1, L - 4, WHITE, F)
  box(out, 0, 2.5, -1, B + 0.03, 0.55, L - 4.2, GLASS, F)
  box(out, 0, 1.75, -1, B + 0.04, 0.22, L - 3.8, NAVY, F)
  box(out, 0, 4.5, -3, B - 0.6, 0.8, L - 9, WHITE, F)
  box(out, 0, 4.45, -3, B - 0.57, 0.45, L - 9.2, GLASS, F)
  // the wheelhouse forward on top, its windows raked
  wedge(out, 0, 5.8, L - 13, B - 2, 0.6, 1.6, 0.8, GLASS, F)
  box(out, 0, 5.8, L - 15.5, B - 2, 0.6, 1.2, WHITE, F)
  // the open top deck aft: people at the rail
  passengers(out, 5.3, -L + 4, -6, B - 1.4, r, 0.35, 1.4)
  return { L, B }
}

/** The Alcatraz boat: a slower monohull, white with a blue stripe, its upper deck open and crowded. */
function alcatrazBoat(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 15
  const B = 4.2
  box(out, 0, 0.8, -0.8, B, 1.3, L - 2.2, WHITE, F)
  box(out, 0, 1.4, -0.8, B + 0.03, 0.25, L - 2.2, [0.16, 0.4, 0.7], F)
  bow(out, L - 3, B, 0.8, 1.25, WHITE, 1.0)
  box(out, 0, 3.0, -1.5, B - 0.3, 0.9, L - 5, WHITE, F)
  box(out, 0, 3.0, -1.5, B - 0.27, 0.45, L - 5.2, GLASS, F)
  wedge(out, 0, 4.4, L - 8, B - 1.6, 0.5, 1.4, 0.6, GLASS, F)
  passengers(out, 3.9, -L + 3, L - 9, B - 0.8, r, 0.6)
  return { L, B }
}

/** A sailboat, 9-11 m, under main and jib: white hull, aluminium mast, sails leaning a little off the wind. */
function sailboat(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 4.6 + r() * 0.8
  const B = 1.5
  const hull: Rgb = r() < 0.75 ? WHITE : r() < 0.5 ? NAVY : [0.6, 0.12, 0.12]
  box(out, 0, 0.35, -0.4, B, 0.55, L - 0.8, hull, F)
  bow(out, L - 1.2, B, 0.35, 0.5, hull, 0.4)
  box(out, 0, 1.05, -1.2, B - 0.5, 0.25, 1.6, WHITE, F)
  box(out, 0, 0.92, -L + 1.6, B - 0.3, 0.05, 1.0, DARK, F)
  passengers(out, 0.9, -L + 1.0, -L + 2.4, B - 0.7, r, 0.8, 0.8)
  // the mast and boom
  const H = 11 + r() * 3
  prism(out, 0, 0.6, 0.9, H, 0.07, 6, SPAR, F, 0.06, true)
  box(out, 0, 2.0, -1.4, 0.05, 0.05, 2.3, SPAR, F)
  // the sails, both faces, heeled off the centre line
  const off = (r() < 0.5 ? -1 : 1) * 0.5
  const tri = (a: [number, number, number], b: [number, number, number], c: [number, number, number]): void => {
    out.quad([a, b, c, c], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], SAIL, F)
    out.quad([c, b, a, a], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], SAIL, F)
  }
  tri([0, 2.1, 0.6], [off, 2.1, -3.6], [0, H - 0.4, 0.55])
  tri([0, 1.2, 0.8], [0, H * 0.82, 0.75], [off * 0.6, 1.3, L - 0.6])
  return { L, B }
}

/** The Blue & Gold bay cruise: a long white two-deck monohull, blue hull band, its open top deck crowded at the rail. */
function cruiseBoat(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 22
  const B = 5.5
  box(out, 0, 0.9, -1, B, 1.5, L - 3, WHITE, F)
  box(out, 0, 0.5, -1, B + 0.03, 0.55, L - 3, NAVY, F)
  bow(out, L - 4, B, 0.9, 1.45, WHITE, 1.3)
  box(out, 0, 3.4, -2, B - 0.3, 1.1, L - 7, WHITE, F)
  box(out, 0, 3.3, -2, B - 0.27, 0.55, L - 7.2, GLASS, F)
  box(out, 0, 2.55, -2, B - 0.26, 0.12, L - 7.1, [0.85, 0.66, 0.2], F)
  wedge(out, 0, 5.2, L - 11, B - 2.2, 0.5, 1.5, 0.6, GLASS, F)
  passengers(out, 4.6, -L + 5, L - 13, B - 0.8, r, 0.75)
  return { L, B }
}

/** A container ship: a long dark hull with a red bottom showing, stacks of containers in colours, the white
 *  accommodation block and bridge aft, a funnel. Slow, and in the deep-water lane. */
function containerShip(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 120
  const B = 16
  box(out, 0, 1.5, 0, B, 3.5, L - 10, [0.12, 0.13, 0.15], F)
  box(out, 0, -0.6, 0, B + 0.02, 1.0, L - 10, [0.55, 0.12, 0.1], F)
  bow(out, L - 10, B, 1.5, 3.4, [0.12, 0.13, 0.15], 3.4)
  const COLS: Rgb[] = [[0.7, 0.2, 0.15], [0.15, 0.35, 0.6], [0.85, 0.6, 0.15], [0.2, 0.45, 0.3], [0.6, 0.6, 0.62], [0.45, 0.2, 0.4]]
  // the stacks: bays of 12 m along the deck, each a few tiers high
  for (let z = -L + 24; z < L - 18; z += 13) {
    const tiers = 2 + Math.floor(r() * 4)
    for (let x = -B + 3; x <= B - 3; x += 5.6) {
      for (let t = 0; t < tiers; t++) box(out, x, 5.6 + t * 2.6, z, 2.7, 1.25, 6.1, COLS[Math.floor(r() * COLS.length)], F)
    }
  }
  // the accommodation and bridge, aft
  box(out, 0, 12, -L + 14, B - 3, 9, 5, WHITE, F)
  box(out, 0, 20.5, -L + 14, B, 0.6, 5.5, WHITE, F)
  box(out, 0, 19.5, -L + 18.6, B - 4, 0.6, 0.1, GLASS, F)
  box(out, 0, 16, -L + 6, 2.5, 7, 2.5, [0.7, 0.2, 0.15], F)
  return { L, B }
}

/** A harbour tug: a short, high, beamy red-and-black hull, a tall white wheelhouse, fendering at the bow. */
function tug(out: MeshBuilder, _seed: number): { L: number; B: number } {
  const L = 9
  const B = 3.6
  box(out, 0, 0.9, -0.5, B, 1.4, L - 1.5, [0.62, 0.12, 0.1], F)
  box(out, 0, 0.1, -0.5, B + 0.02, 0.6, L - 1.5, DARK, F)
  bow(out, L - 2, B, 0.9, 1.35, [0.62, 0.12, 0.1], 0.8)
  box(out, 0, 1.2, L - 0.6, B * 0.7, 0.9, 0.5, DARK, F)
  box(out, 0, 3.6, 1, 2.2, 1.3, 2.6, WHITE, F)
  box(out, 0, 5.7, 1.6, 2.0, 0.8, 1.6, WHITE, F)
  box(out, 0, 5.75, 3.25, 1.8, 0.45, 0.05, GLASS, F)
  box(out, 0, 6.8, -0.6, 0.35, 1.3, 0.35, DARK, F)
  return { L, B }
}

/** A kayak: a narrow bright hull, one paddler. */
function kayak(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 2.2
  const B = 0.35
  const c: Rgb = ([[0.9, 0.5, 0.1], [0.85, 0.15, 0.15], [0.95, 0.85, 0.2], [0.2, 0.6, 0.35]] as Rgb[])[Math.floor(r() * 4)]
  box(out, 0, 0.12, 0, B, 0.12, L - 0.4, c, F)
  bow(out, L - 0.5, B, 0.12, 0.11, c, 0.15)
  box(out, 0, 0.5, -0.2, 0.18, 0.28, 0.14, ([[0.2, 0.3, 0.6], [0.8, 0.2, 0.2], [0.15, 0.15, 0.18]] as Rgb[])[Math.floor(r() * 3)], F)
  box(out, 0, 0.88, -0.2, 0.1, 0.1, 0.1, [0.85, 0.66, 0.52], F)
  box(out, 0, 0.62, -0.1, 1.1, 0.03, 0.06, DARK, F)
  return { L, B }
}

/** A model yacht on Spreckels Lake (the San Francisco Model Yacht Club, since 1898): a metre-long hull under a tall
 *  white sail, sailed from the bank. */
function modelYacht(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 0.6
  const B = 0.13
  const hull: Rgb = r() < 0.5 ? WHITE : r() < 0.5 ? NAVY : [0.6, 0.12, 0.12]
  box(out, 0, 0.05, 0, B, 0.06, L - 0.12, hull, F)
  bow(out, L - 0.15, B, 0.05, 0.05, hull, 0.05)
  prism(out, 0, 0.05, 0.1, 1.7, 0.012, 4, SPAR, F, 0.01, true)
  const tri = (a: [number, number, number], b: [number, number, number], c: [number, number, number]): void => {
    out.quad([a, b, c, c], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], SAIL, F)
    out.quad([c, b, a, a], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], SAIL, F)
  }
  tri([0, 0.2, 0.04], [0.08, 0.2, -0.45], [0, 1.6, 0.04])
  tri([0, 0.15, 0.08], [0, 1.3, 0.07], [0.05, 0.16, L - 0.08])
  return { L, B }
}

/** An open-water swimmer of the Dolphin and South End clubs in Aquatic Park: a bright cap, shoulders, one arm over. */
function swimmer(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const cap: Rgb = ([[0.95, 0.5, 0.1], [0.95, 0.9, 0.2], [0.9, 0.2, 0.2], [0.95, 0.95, 0.95]] as Rgb[])[Math.floor(r() * 4)]
  box(out, 0, 0.02, -0.3, 0.2, 0.06, 0.55, [0.12, 0.13, 0.15], F)
  box(out, 0, 0.1, 0.32, 0.11, 0.1, 0.12, cap, F)
  box(out, 0.22, 0.25, 0.15, 0.05, 0.25, 0.05, [0.82, 0.62, 0.5], F)
  return { L: 0.6, B: 0.25 }
}

/** A small motor launch going in and out of the Marina: white, a windscreen, a canvas top. */
function motorboat(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 4.5
  const B = 1.5
  box(out, 0, 0.35, -0.3, B, 0.5, L - 0.4, WHITE, F)
  bow(out, L - 0.8, B, 0.35, 0.48, WHITE, 0.4)
  wedge(out, 0, 1.1, 0.6, B - 0.25, 0.3, 0.6, 0.3, GLASS, F)
  box(out, 0, 1.6, -0.6, B - 0.2, 0.05, 1.1, r() < 0.5 ? NAVY : [0.75, 0.72, 0.6], F)
  passengers(out, 0.55, -L + 1.2, -0.2, B - 0.6, r, 0.6)
  return { L, B }
}

const FERRY: BoatKind = { name: 'ferry', build: ferry, speed: 11, lane: 45 }
const ALCATRAZ: BoatKind = { name: 'alcatraz', build: alcatrazBoat, speed: 6, lane: 30 }
const SAILBOAT: BoatKind = { name: 'sailboat', build: sailboat, speed: 3.2, lane: 60 }
const CRUISE: BoatKind = { name: 'cruise', build: cruiseBoat, speed: 7, lane: 40 }
const SHIP: BoatKind = { name: 'container ship', build: containerShip, speed: 6, lane: 120, hideEnds: 450 }
const TUG: BoatKind = { name: 'tug', build: tug, speed: 5, lane: 30 }
const KAYAK: BoatKind = { name: 'kayak', build: kayak, speed: 1.4, lane: 5 }
const MODEL_YACHT: BoatKind = { name: 'model yacht', build: modelYacht, speed: 0.7, lane: 4 }
const SWIMMER: BoatKind = { name: 'swimmer', build: swimmer, speed: 0.8, lane: 3 }
const LAUNCH_SF: BoatKind = { name: 'motorboat', build: motorboat, speed: 4, lane: 8 }

export interface BayRoute { name: string; points: [number, number][]; fleet: BoatKind[] }

/**
 * The routes, [lat, lon], each drawn over open water (checked against the baked water: `tools/` probe in the
 * improvements log, 2026-10-03). The ferries leave from the Ferry Building's gates and Pier 41/33; the sailing water
 * is where it is on a summer afternoon — the Cityfront between the Marina and Alcatraz, and Richardson Bay.
 */
export const SF_ROUTES: BayRoute[] = [
  { name: 'Sausalito ferry', fleet: [FERRY, FERRY], points: [
    [37.7952, -122.3897], [37.8010, -122.3920], [37.8120, -122.4030], [37.8150, -122.4150], [37.8185, -122.4400],
    [37.8280, -122.4580], [37.8400, -122.4690], [37.8500, -122.4735], [37.8560, -122.4772]] },
  { name: 'Larkspur ferry (east of Angel Island)', fleet: [FERRY, FERRY], points: [
    [37.7958, -122.3893], [37.8060, -122.3880], [37.8200, -122.3960], [37.8420, -122.4130], [37.8560, -122.4110]] },
  { name: 'Oakland and Alameda ferry', fleet: [FERRY, FERRY], points: [
    [37.7945, -122.3893], [37.7930, -122.3800], [37.7960, -122.3600], [37.7990, -122.3400], [37.7985, -122.3300]] },
  { name: 'Alcatraz boat', fleet: [ALCATRAZ, ALCATRAZ], points: [
    [37.8095, -122.4040], [37.8140, -122.4080], [37.8200, -122.4150], [37.8255, -122.4205]] },
  { name: 'Cityfront sailing', fleet: [SAILBOAT, SAILBOAT, SAILBOAT, SAILBOAT, SAILBOAT, SAILBOAT, SAILBOAT, SAILBOAT], points: [
    [37.8110, -122.4700], [37.8120, -122.4550], [37.8150, -122.4380], [37.8190, -122.4250], [37.8240, -122.4350],
    [37.8230, -122.4550], [37.8170, -122.4680]] },
  { name: 'Richardson Bay sailing', fleet: [SAILBOAT, SAILBOAT, SAILBOAT, SAILBOAT], points: [
    [37.8530, -122.4700], [37.8600, -122.4640], [37.8610, -122.4620], [37.8580, -122.4560], [37.8540, -122.4600]] },
  { name: 'Bay cruise: Pier 39, under the Golden Gate, round Alcatraz', fleet: [CRUISE, CRUISE], points: [
    [37.8110, -122.4100], [37.8135, -122.4300], [37.8120, -122.4600], [37.8125, -122.4760], [37.8140, -122.4840],
    [37.8200, -122.4780], [37.8260, -122.4500], [37.8300, -122.4300], [37.8290, -122.4180], [37.8215, -122.4140]] },
  { name: 'Deep-water lane: the Golden Gate to the Oakland bar', fleet: [SHIP, SHIP], points: [
    [37.8040, -122.5200], [37.8080, -122.4990], [37.8140, -122.4780], [37.8195, -122.4500], [37.8195, -122.4300], [37.8150, -122.4030],
    [37.8050, -122.3870], [37.8000, -122.3700], [37.8010, -122.3450], [37.8050, -122.3300]] },
  { name: 'Tugs along the Cityfront', fleet: [TUG, TUG], points: [
    [37.7830, -122.3822], [37.7900, -122.3832], [37.7990, -122.3885], [37.8095, -122.3985], [37.8120, -122.4150]] },
  { name: 'Kayaks in McCovey Cove', fleet: [KAYAK, KAYAK, KAYAK, KAYAK, KAYAK], points: [
    [37.7770, -122.3902], [37.7771, -122.3890], [37.7773, -122.3879], [37.7778, -122.3879], [37.7773, -122.3886]] },
  { name: 'Treasure Island ferry (OSM way/1036802523)', fleet: [FERRY], points: [
    [37.7968, -122.3925], [37.8004, -122.3897], [37.8080, -122.3820], [37.8161, -122.3736]] },
  { name: 'Model yachts on Spreckels Lake', fleet: [MODEL_YACHT, MODEL_YACHT, MODEL_YACHT, MODEL_YACHT], points: [
    [37.77125, -122.49520], [37.77135, -122.49420], [37.77100, -122.49360], [37.77070, -122.49430], [37.77090, -122.49500]] },
  { name: 'Swimmers in Aquatic Park', fleet: [SWIMMER, SWIMMER, SWIMMER, SWIMMER], points: [
    [37.80780, -122.42450], [37.80860, -122.42400], [37.80900, -122.42500], [37.80820, -122.42550]] },
  { name: 'Motorboats out of the Marina', fleet: [LAUNCH_SF, LAUNCH_SF], points: [
    [37.80749, -122.44114], [37.80775, -122.43960], [37.80901, -122.43960], [37.81200, -122.43900], [37.81450, -122.43850]] },
]
