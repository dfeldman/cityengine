# Cité Internationale Universitaire — bespoke builders

Owner, 2026-11-04: custom renderers for the campus houses, one Opus subagent per building, one at a time; the
campus gardens after. The campus is already a detail region (`tools/regions/paris-extra.ts`); widen its ring/margin
there if a building or garden falls outside.

## Brief for each building agent
- Read CLAUDE.md and the memories it points to (landmark-model-routes, osm-parts-from-local-pbf, photos-via-chrome,
  headless-model-checks, shoot-landmark-dist, pale-faces-go-stone, model-choice, vitest-dir-tests).
- Follow the existing pattern: `src/render/landmarks/paris/batch2/` (see `fondationSuisse`, `maisonBresil`) and the
  entries in `public/landmarks/paris/batch2.json`. Put new builders in `src/render/landmarks/paris/citeu/<slug>.ts`,
  registered with the others; entries go in `public/landmarks/paris/citeu.json` (create it, wire it like batch2.json).
- Footprint from OSM (way id, outline, levels, parts) via osmium on the local pbf; refs from Commons/Wikidata.
- Photos are required (owner): research the web for several views (Commons, Wikidata, the house's own site,
  CIUP pages). Styles vary wildly — modern organic, Bauhaus, neo-medieval/collegiate, national vernacular — so model
  from the photos, not the name. If no usable photo turns up, STOP and say so in the report; the owner will find one.
- Commons is often mislabelled here; ciup.fr house pages have good exterior photos.
- In-city shot: compute world x,z with src/city/geo.ts `Projection` (never by hand), e.g.
  `CITY=paris-centre sh tools/shoot-landmark.sh <x> <z> <bearing> <dist> <h>`; confirm the target is in frame.
- Entries with an `osm` id must NOT carry `lat`/`lon`/`size`: together they place the model at a point and skip the
  OSM outline and `front` (src/render/landmarks.ts `atPoint`). Insert the entry in the file's 2-space JSON format.
- Direct TS builder, tunable constants at the top, madeBy: "opus".
- Verify with tools/shoot-landmark.sh (CITY=paris-centre, tinyres to frame, lowres to judge). Run only the
  relevant vitest files with `--dir tests`, filtered to your builder (`-t <name>`); known failures in palaisAlma,
  bourbonCourts, operaBastille, louvrePalace, maisonLoo are not ours. Keep within the triangle cap (~25k).
- Don't commit. Report in under 150 words: files touched, what's modelled, what's left.

## Roster (order; ✓ when done)
Maison Internationale ✓ · Fondation des États-Unis ✓ · Collège Franco-Britannique ✓ · Fondation Deutsch de la Meurthe
(+ Émile et Louise) ✓ · Maison du Japon ✓ · Fondation Biermans-Lapôtre ✓ · Maison des Provinces de France ✓ · Collège
d'Espagne ✓ · Maison de l'Italie ✓ · Fondation Avicenne ✓ · Maison du Mexique ✓ · Fondation Danoise ✓ · Maison des Étudiants
Suédois ✓ · Maison de Norvège ✓ · Fondation Hellénique ✓ · Maison des étudiants canadiens ✓ · Maison de l'Inde (+ annexe) ✓ ·
Maison du Maroc ✓ · Maison du Portugal ✓ · Maison du Cambodge ✓ · Maison de la Corée ✓ · Maison de l'Île-de-France ✓ · Maison
d'Égypte ✓ · Fondation argentine ✓ · Maison Heinrich Heine ✓ · Maison du Liban ✓ · Maison des Arts et Métiers ✓ · Maison des
Industries Agricoles ✓ · Maison Internationale AgroParisTech ✓ · Fondation Victor Lyon ✓ · Pavillon Administratif ✓ · Pavillons
Pasteur ✓, Liard ✓, Appell ✓, Gréard ✓, Pierre et Marie Curie ✓ · Maison des étudiants arméniens ✓ · Maison de Tunisie (both) ✓ ·
Fondation de Monaco ✓ · Fondation suisse / Maison du Brésil (review existing builders only) ✓.

Then: the gardens (the Parc of the Cité, the Maison Internationale parterre and roundabout, sports fields) ✓ — tools/gardens/paris-batch2.ts `miForecourt`; soccer/rugby/handball markings via the Paris region's `courtSports` (src/render/sports.ts `field`).
