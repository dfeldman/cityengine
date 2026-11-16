/**
 * La Défense, the third pass (2026-11-16): EVERY remaining building of the core gets its own builder — the unnamed
 * and lesser ones that defense2 (named towers ≥37 m) left to the generic bake.
 *
 * CONVENTION for cluster agents:
 *  - one file per cluster: cluster1.ts, cluster2.ts, … (lists in docs/landmarks/defense3-clusterN.tsv);
 *  - one exported builder per building (camelCase name, unique across the whole landmark registry — prefix with
 *    `d3` + a short street/name, e.g. `d3Belvedere`), mostly a short `d3({...})` look from ./kit.ts set from that
 *    building's own photo (tools/panoramax.py frame or Commons) — no copy-paste defaults;
 *  - add the builders to PARIS_DEFENSE3 below (spread the cluster's record: `...CLUSTER1`);
 *  - one entry per building in public/landmarks/paris/defense3.json: osm ["way/…"], name
 *    "La Défense: <name or street address>", procedural (the export name), height (BD TOPO h from the tsv),
 *    note (sources: photo file/URL, height source), madeBy (the model id).
 * defense3.json is already included from public/landmarks/paris.json and listed in tools/paris-claims.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { CLUSTER1 } from './cluster1.ts'
import { SMALL1 } from './small1.ts'
import { CLUSTER5 } from './cluster5.ts'
import { CLUSTER6 } from './cluster6.ts'
import { CLUSTER3 } from './cluster3.ts'
import { CLUSTER4 } from './cluster4.ts'
import { CLUSTER2 } from './cluster2.ts'
import { TIERC } from './tierc.ts'
import { SMALL2 } from './small2.ts'
import { NAMED } from './named.ts'
import { D3G } from './generic.ts'

export const PARIS_DEFENSE3: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  ...CLUSTER1,
  ...SMALL1,
  ...CLUSTER5,
  ...CLUSTER6,
  ...CLUSTER3,
  ...CLUSTER4,
  ...CLUSTER2,
  ...TIERC,
  ...SMALL2,
  ...NAMED,
  ...D3G,
}
