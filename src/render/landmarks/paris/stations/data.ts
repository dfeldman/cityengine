/**
 * GENERATED from the OSM extract (tools/cache/osm/ile-de-france-latest.osm.pbf, 2026-10-29) — the termini's train
 * sheds and their platforms, in each shed entry's own frame (public/landmarks/paris/stations.json: its lat/lon is the
 * frame's origin, its `front` the bearing local −z faces). Metres, [x, z] pairs, anticlockwise. The bake does not draw
 * `railway=platform`, so the platforms the standing trains stand at are here; the shed outlines are OSM's own ways.
 */
export interface ShedData {
  /** the shed's OSM outline(s) */
  sheds: [number, number][][]
  /** the platforms under and just beyond it, clipped to the shed's box and the throat margin */
  platforms: [number, number][][]
  /** the frame: half-sizes of the box round the sheds */
  hx: number
  hz: number
}

export const NORD_SHED: ShedData = {
  sheds: [[[-67,-81.6],[-44.3,-81.5],[-44.3,-81.2],[-42.2,-81.2],[-42.2,-82.4],[26.9,-82.6],[26.9,-81.5],[27.3,-81.4],[27.4,-81.2],[28.3,-81.2],[28.5,-92.2],[50.2,-92.2],[50.3,-87],[55.3,-86.8],[55.6,-86.2],[55.9,-85.8],[56.6,-85.5],[57,-85.4],[67.1,-85.3],[68.2,-84],[68.2,-83.5],[67.9,-83.5],[68,-82.7],[67.8,-82.7],[67.8,-81.9],[68,-81.9],[68,-81.4],[68.7,-81.3],[68,-11.2],[67.3,89.5],[28.5,89.3],[28.4,91.1],[26.2,91.1],[25.8,90.3],[-31.7,90.1],[-33.5,91.5],[-40.6,91.2],[-40.7,92.2],[-44,92.1],[-44.1,89.6],[-66.8,89.3],[-66.7,90.5],[-67.6,89.5],[-68.1,9.9],[-67.5,10],[-67.4,7.9],[-67.9,7.8],[-67.9,7.2],[-68.7,7.2],[-68.6,-0.6],[-67.8,-0.7],[-67.8,-1.1],[-67.4,-1.1],[-67.3,-3.3],[-67.7,-3.3]]],
  platforms: [[[-53.8,-48.2],[-54.4,87.8],[-53,123.8],[-52.2,131.8],[-59.7,131.8],[-60.7,119.8],[-60.9,-48.2]],[[-36.5,-48.2],[-37,123.8],[-36.5,131.8],[-45.8,131.8],[-47.5,87.8],[-47,-48.2]],[[-19.1,-48.2],[-20.2,131.8],[-29.8,131.8],[-29.7,-48.2]],[[-2,-48.2],[-2.6,131.8],[-12.5,131.8],[-12.2,-48.2]],[[14.9,-48.2],[14,131.8],[4.2,131.8],[4.9,-48.2]],[[31.9,-48.2],[31,131.8],[20.8,131.8],[21.7,-48.2]],[[42.5,-48.2],[41.7,131.8],[34.3,131.8],[35.2,-48.2]],[[56.8,-48.2],[55.9,131.8],[48.7,131.8],[49.4,-48.2]]],
  hx: 68.7,
  hz: 92.2,
}

