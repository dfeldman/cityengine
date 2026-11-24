# Paris top-100 audit (2026-11-16)

The 100 largest or most important buildings in Paris proper (no La Défense, no Versailles), matched to manifest
entries, shot in the city and scored against real photographs by Sonnet reviewers (10 per batch).
Data: `docs/landmarks/paris-top100.json`. Shots: `npx tsx tools/top100-shots.ts --sites=docs/landmarks/paris-top100.json --out=<dir> --medres`
(resumes; `BUILD_WAIT=25000` for a slow machine). Reviewer brief: `docs/landmarks/PARIS-TOP100-REVIEW-BRIEF.md`.

## Summary
- **Coverage:** 96/100 have a custom procedural builder. No custom builder: **Hôtel Matignon**, **Hôtel de la Monnaie**,
  **Musée Picasso (Hôtel Salé)** — restyle only; **Ministère de l'Intérieur (Place Beauvau)** — nothing (generic OSM).
- **Partial builders:** Assemblée nationale (portico), École Militaire (portico only, scored 2), Gare du Nord (shed),
  Palais de Justice (Cour de Mai / Harlay pieces), Institut de France (dome + wings).
- **Scores (100 reviewed):** 5: 3 · 4: 53 · 3: 33 · 2: 11 · 1: 0 — mean 3.48. No building is missing.
- **After rebuild waves 1–3 (2026-11-16/18):** the eleven 2s are now nine 3s and two 2s (5: 3 · 4: 53 · 3: 42 · 2: 2, mean 3.57). Many of the gains come mostly from audit cameras moved onto the real fronts (58, 80, 95, 26, 94). See the "Rebuild wave" sections at the end; the table below is the original audit.
- **Common faults:** flat roofs where there should be mansards/dormers; wrong roof colour (teal/mint instead of slate/zinc);
  missing porticoes/pediments on classical façades; stone too dark, too white or too yellow.
- **Caveats:** shots are 700×400 from 150–500 m, so fine ornament can't be judged; about 15 landmarks had only an
  interior, old or partial reference photo and were judged partly from the reviewer's knowledge (marked in the reviews).

## Scores, worst first
| Score | # | Building | Builder | Biggest problem |
|---|---|---|---|---|
| 2 | 17 | Petit Palais | `petitPalais` (custom) | Solid block with flat roof; no arch, colonnade or curved court |
| 2 | 24 | Quai d'Orsay (Affaires étrangères) | `quaiOrsay` (custom) | Short hip-roofed block; long parapet façade and pavilion missing |
| 2 | 26 | Hôtel de Brienne (Armées) | `hotelBrienne` (custom) | Unrecognisable; no pediment, blends with neighbours |
| 2 | 28 | Ministère de l'Intérieur (Beauvau) | `parisCivic` (generic) | Generic flat-roofed block (no builder; no photo found) |
| 2 | 29 | Banque de France (Hôtel de Toulouse) | `hotelToulouse` (custom) | One huge flat grey slab, no mansards |
| 2 | 39 | Hôtel de la Monnaie | `classical` (restyle) | Generic restyle block, no colonnade or rusticated base |
| 2 | 58 | École Militaire | `ecoleMilitairePortico` (custom) | Only tiny portico; no dome pavilion; dark shadow patch |
| 2 | 80 | Gare Montparnasse | `gareMontparnasse` (custom) | Station hall not visible after re-shot; only tower, slabs, garden deck |
| 2 | 86 | Musée Picasso (Hôtel Salé) | `classical` (restyle) | Restyle only; generic block with no hôtel features |
| 2 | 94 | Opéra-Comique | `operaComique` (custom) | Plain pale block under hipped roof; no portico or mansard (re-shot: renders, just simple) |
| 2 | 95 | Théâtre des Champs-Élysées | `theatreChampsElysees` (custom) | Plain white box; no frieze, cornice or rounded corner (re-shot: renders, just simple) |
| 3 | 4 | Louvre Pyramid | `louvrePyramid` (custom) | Dark solid look, no glass lattice |
| 3 | 7 | Musée d'Orsay | `museeOrsay` (custom) | Roof bright teal, should be grey zinc |
| 3 | 8 | Centre Pompidou | `pompidou` (custom) | No escalator tube; front lacks pipes |
| 3 | 16 | Grand Palais | `grandPalais` (custom) | Huge flat cream roof slab; glass vaults only thin strip |
| 3 | 20 | Palais Bourbon (Assemblée nationale) | `assembleePortico` (custom) | Mint-green roofs clash; portico very dark |
| 3 | 22 | Hôtel Matignon | `classical` (restyle) | Flat roofs, no curved gate wall or pediment (restyle only) |
| 3 | 30 | Cour des comptes (Palais Cambon) | `courComptes` (custom) | Flat roofs, rue Cambon columned portal missing |
| 3 | 31 | Palais d'Iéna (CESE) | `iena` (custom) | Flat cream roof, no stepped attic, wrong concrete colour |
| 3 | 32 | Préfecture de Police | `prefecturePolice` (custom) | Flat window grid, no balcony/string-course bands |
| 3 | 34 | Hôtel de la Marine & Crillon | `gabrielPalaces` (custom) | Colonnade not verifiable at range, reads as pale slabs |
| 3 | 37 | Opéra Bastille | `operaBastille` (custom) | Near-white walls, no warm glass tint or entrance volume |
| 3 | 44 | Saint-Germain-l'Auxerrois | `saintGermainAuxerrois` (custom) | Tall spire on main tower; real has none |
| 3 | 45 | Saint-Étienne-du-Mont | `saintEtienneDuMont` (custom) | Facade lacks three stacked pediments and rose window |
| 3 | 50 | Saint-Paul-Saint-Louis | `saintPaul` (custom) | Facade too narrow and tall; reads as belfry |
| 3 | 53 | Grande Mosquée de Paris | `grandeMosquee` (custom) | Minaret plain white; no zellige or gilt finial |
| 3 | 55 | La Sorbonne | `sorbonne` (custom) | Roofs flat pale blue-grey; chapel pediment weak |
| 3 | 60 | Tour Saint-Jacques | `tourSaintJacques` (custom) | Dark grey, plain, stubby; real is cream and ornate |
| 3 | 62 | Institut du monde arabe | `institutMondeArabe` (custom) | Facade plain white grid; no metallic apertures |
| 3 | 65 | Grande Halle de la Villette | `grandeHalle` (custom) | Missing taller central transept; reads as plain box |
| 3 | 67 | BnF François-Mitterrand | `bnfTower` (custom) | Towers dark speckled; real is pale glass with gold shutters |
| 3 | 68 | BnF Richelieu | `bnfRichelieu` (custom) | Generic block; Labrouste glass roof and facade not evident |
| 3 | 71 | Galeries Lafayette | `galeriesLafayette` (custom) | Giant arches and flat beige roof instead of Haussmann facade |
| 3 | 74 | Le Bon Marché | `bonMarche` (custom) | Corner rotunda dome missing; flat grey roofs, no dormers |
| 3 | 76 | Gare de l'Est | `gareDeLest` (custom) | Facade a flat grey slab; central arch and clock unclear |
| 3 | 78 | Gare Saint-Lazare | `gareSaintLazare` (custom) | Shed one huge pale sheet; no central pavilion or Terminus wing |
| 3 | 81 | Palais de Tokyo | `palaisTokyoWest` (custom) | Colonnade and bas-reliefs unreadable; solar-panel roofs |
| 3 | 83 | Archives nationales (Hôtel de Soubise) | `soubiseCourt` (custom) | Hemicycle colonnade and pedimented façade not distinct |
| 3 | 84 | Musée Carnavalet | `carnavaletCourt` (custom) | Central pavilion and arcade not recognisable |
| 3 | 87 | Musée de Cluny | `hotelDeCluny` (custom) | Gothic dormers missing; dark brown box artefact at court edge |
| 3 | 88 | Arts et Métiers (St-Martin-des-Champs) | `saintMartinChevet` (custom) | Chevet apse chapels indistinct; big grey flat roofs |
| 3 | 89 | École des Beaux-Arts | `beauxArts` (custom) | Court arcade, column and statue unreadable; generic roof |
| 3 | 92 | Cirque d'Hiver | `cirqueHiver` (custom) | Roof a tall white cone; colonnade and statues missing |
| 3 | 98 | Roland-Garros (Philippe-Chatrier) | `rgChatrier` (custom) | White retractable roof only covers one corner |
| 4 | 1 | Eiffel Tower | `eiffelTowerFull` (custom) | Pale grey instead of brown iron |
| 4 | 2 | Notre-Dame de Paris | `notreDameFull` (custom) | Towers squat, stone too dark |
| 4 | 3 | Louvre Palace | `louvrePalace` (custom) | Pavilions too low, facades plain |
| 4 | 9 | Palais Garnier | `palaisGarnier` (custom) | Gold statues and cornice missing |
| 4 | 11 | Hôtel des Invalides | `invalides` (custom) | Flat uniform dark roofs, no pavilion roofs or dormers |
| 4 | 12 | Panthéon | `pantheonFull` (custom) | Dome too dark; tricolour banner in portico |
| 4 | 13 | Sainte-Chapelle | `sainteChapelle` (custom) | Nave hidden, no pinnacles, plain spire |
| 4 | 14 | Conciergerie | `conciergerie` (custom) | Façade flat/dark, lacks Gothic dormers |
| 4 | 15 | Palais de Justice | `palaisJusticeMai` (custom) | Plain cream wings, no central pedimented pavilion |
| 4 | 18 | Hôtel de Ville | `hotelDeVille` (custom) | Façade dark grey, clock tower stubby |
| 4 | 19 | Palais de l'Élysée | `elysee` (custom) | White walls, roofs without dormers or chimneys |
| 4 | 21 | Palais du Luxembourg (Sénat) | `luxembourgPalace` (custom) | Central dome barely visible from garden side |
| 4 | 23 | Palais-Royal (Conseil d'État) | `palaisRoyal` (custom) | Flat grey roofs; Buren court not visible |
| 4 | 25 | Ministère de l'Économie (Bercy) | `bercyMinistry` (custom) | Generic facade bands, no dark glass cubes |
| 4 | 27 | Hexagone Balard | `hexagoneBalard` (custom) | Roof facets too regular, glazing bland |
| 4 | 33 | Tribunal de Paris | `tribunal` (custom) | Glass flat blue-grey, spine and fins missing |
| 4 | 35 | Palais de Chaillot | `palaisChaillot` (custom) | Wing stone low-contrast, no shaded colonnade |
| 4 | 36 | Tour Montparnasse | `montparnasseFull` (custom) | Uniform dark grey, no bronze tint (no usable photo) |
| 4 | 38 | Institut de France | `institutDome` (custom) | Dome flat blue-grey, drum windows and ribs missing |
| 4 | 40 | La Madeleine | `madeleine` (custom) | Stone too yellow, tympanum sculpture missing |
| 4 | 41 | Saint-Sulpice | `saintSulpice` (custom) | Near-white stone; towers blocky, colonnade lost |
| 4 | 42 | Saint-Eustache | `saintEustache` (custom) | Stone too dark and grey; roof reads blue-green |
| 4 | 43 | Saint-Germain-des-Prés | `saintGermainDesPres` (custom) | Tower grey-brown, lacks arcaded belfry stage |
| 4 | 46 | Saint-Augustin | `saintAugustin` (custom) | Facade lacks large arched rose-window recess |
| 4 | 47 | La Trinité | `laTrinite` (custom) | Tower tiers too plain; stone too yellow |
| 4 | 48 | Saint-Roch | `saintRoch` (custom) | Facade narrow and flush; no wide stair |
| 4 | 49 | Saint-Gervais | `saintGervais` (custom) | Facade grey; top pediment should be segmental |
| 4 | 51 | Sainte-Clotilde | `sainteClotilde` (custom) | Spires plain; no portal or crocket detail |
| 4 | 52 | Alexandre-Nevsky Cathedral | `saintAlexandreNevsky` (custom) | Stone too pale; side domes teal not gold |
| 4 | 54 | Grande Synagogue de la Victoire | `synagogueVictoire` (custom) | Rose window solid black; facade too yellow |
| 4 | 56 | Val-de-Grâce | `valDeGrace` (custom) | Dome squat; portico columns indistinct |
| 4 | 57 | Chapelle de la Salpêtrière | `chapelleSalpetriere` (custom) | Dome faceted flat; walls too dark grey |
| 4 | 59 | UNESCO | `unescoSiege` (custom) | Conference hall roof teal, should be concrete grey |
| 4 | 61 | Musée du quai Branly | `quaiBranly` (custom) | Cantilever boxes too small and uniform |
| 4 | 63 | Philharmonie de Paris | `philharmonie` (custom) | Roof and walls blue-grey, not reflective silver |
| 4 | 64 | Cité des Sciences | `citeDesSciences` (custom) | Facade pale and washed out; bays weak (no photo) |
| 4 | 66 | Fondation Louis Vuitton | `fondationLouisVuitton` (custom) | Glass sails too few and opaque |
| 4 | 69 | Bourse de Commerce | `bourseCommerce` (custom) | Portico and pediment missing; stone too pale |
| 4 | 70 | Palais Brongniart | `brongniart` (custom) | Too white; entrance steps and pediment weak (no photo) |
| 4 | 72 | Printemps Haussmann | `printempsMain` (custom) | Facade too plain; stray white-dot rooftop props |
| 4 | 73 | La Samaritaine | `samaritaine` (custom) | Glazing and attic steps simplified; Rivoli wing too teal |
| 4 | 75 | Gare du Nord | `gareDuNordShed` (custom) | Side pavilions plain white; shed glazing uneven |
| 4 | 77 | Gare de Lyon | `gareDeLyon` (custom) | Clock tower too slim, dome too blue |
| 4 | 79 | Gare d'Austerlitz | `gareDAusterlitz` (custom) | Clock gable missing; plain grey facade |
| 4 | 82 | Maison de la Radio | `maisonRadio` (custom) | Single flat ring; no drum step or dark glazing |
| 4 | 85 | Musée Rodin (Hôtel Biron) | `hotelBiron` (custom) | Façade smooth; tall arched windows and pediment missing |
| 4 | 90 | Observatoire de Paris | `observatoire` (custom) | Façade too white and flat; domes small |
| 4 | 91 | Hôtel-Dieu | `hotelDieu` (custom) | Flat slate slab roof, no pavilions or arcade |
| 4 | 93 | Moulin Rouge | `moulinRouge` (custom) | Windmill squat and broad; rear roof oversized and plain |
| 4 | 96 | Accor Arena | `accorArena` (custom) | Lime-green grass too bright; blue steel trusses missing |
| 4 | 97 | Parc des Princes | `parcDesPrinces` (custom) | Dark grey fins instead of beige; entrance hall missing |
| 4 | 99 | Palais des Congrès | `palaisCongres` (custom) | Rear mass is a plain grey slab |
| 4 | 100 | Forum des Halles / Canopée | `canopee` (custom) | Flat cream colour; no gold lattice or dark rim |
| 5 | 5 | Arc de Triomphe | `arcDeTriomphe` (custom) | None significant |
| 5 | 6 | Sacré-Cœur | `sacreCoeurFull` (custom) | Terrace/stairs unclear |
| 5 | 10 | Dôme des Invalides | `invalidesDome` (custom) | Wings slightly uniform |

## The list
| # | Building | Manifest entry | Builder | Status | Made by |
|---|---|---|---|---|---|
| 1 | Eiffel Tower | Tour Eiffel (paris.json) | `eiffelTowerFull` | custom |  |
| 2 | Notre-Dame de Paris | Notre-Dame (paris.json) | `notreDameFull` | custom |  |
| 3 | Louvre Palace | Palais du Louvre (paris.json) | `louvrePalace` | custom |  |
| 4 | Louvre Pyramid | Louvre Pyramid (paris.json) | `louvrePyramid` | custom |  |
| 5 | Arc de Triomphe | Arc de Triomphe (paris.json) | `arcDeTriomphe` | custom |  |
| 6 | Sacré-Cœur | Sacré-Cœur (monuments.json) | `sacreCoeurFull` | custom |  |
| 7 | Musée d'Orsay | Musée d'Orsay (paris.json) | `museeOrsay` | custom |  |
| 8 | Centre Pompidou | Centre Pompidou (paris.json) | `pompidou` | custom |  |
| 9 | Palais Garnier | Palais Garnier (paris.json) | `palaisGarnier` | custom |  |
| 10 | Dôme des Invalides | Dôme des Invalides (paris.json) | `invalidesDome` | custom |  |
| 11 | Hôtel des Invalides | Hôtel des Invalides (palaces.json) | `invalides` | custom |  |
| 12 | Panthéon | Panthéon (monuments.json) | `pantheonFull` | custom |  |
| 13 | Sainte-Chapelle | Sainte-Chapelle (paris.json) | `sainteChapelle` | custom |  |
| 14 | Conciergerie | La Conciergerie (paris.json) | `conciergerie` | custom |  |
| 15 | Palais de Justice | Palais de Justice — the Cour de Mai (paris.json) | `palaisJusticeMai` | custom |  |
| 16 | Grand Palais | Grand Palais (paris.json) | `grandPalais` | custom |  |
| 17 | Petit Palais | Petit Palais (paris.json) | `petitPalais` | custom |  |
| 18 | Hôtel de Ville | Hôtel de Ville (paris.json) | `hotelDeVille` | custom |  |
| 19 | Palais de l'Élysée | Palais de l'Élysée (palaces.json) | `elysee` | custom |  |
| 20 | Palais Bourbon (Assemblée nationale) | Assemblée nationale — portico (paris.json) | `assembleePortico` | custom |  |
| 21 | Palais du Luxembourg (Sénat) | Palais du Luxembourg (palaces.json) | `luxembourgPalace` | custom |  |
| 22 | Hôtel Matignon | Hôtel de Matignon (palaces.json) | `classical` | restyle |  |
| 23 | Palais-Royal (Conseil d'État) | Palais-Royal — the Conseil d'État and the Cour d'honneur (palaces.json) | `palaisRoyal` | custom |  |
| 24 | Quai d'Orsay (Affaires étrangères) | Ministère des Affaires étrangères — Quai d'Orsay (palaces.json) | `quaiOrsay` | custom |  |
| 25 | Ministère de l'Économie (Bercy) | Ministère de l'Économie et des Finances (Bercy) (palaces.json) | `bercyMinistry` | custom |  |
| 26 | Hôtel de Brienne (Armées) | Hôtel de Brienne (paris.json) | `hotelBrienne` | custom | claude-sonnet-5-5 |
| 27 | Hexagone Balard | Hexagone Balard (museums.json) | `hexagoneBalard` | custom |  |
| 28 | Ministère de l'Intérieur (Beauvau) | Ministère de l'Intérieur (civic.json) | `parisCivic` | generic |  |
| 29 | Banque de France (Hôtel de Toulouse) | Hôtel de Toulouse (Banque de France) (palaces.json) | `hotelToulouse` | custom |  |
| 30 | Cour des comptes (Palais Cambon) | Palais Cambon — Cour des comptes (palaces.json) | `courComptes` | custom |  |
| 31 | Palais d'Iéna (CESE) | Palais d'Iéna (palaces.json) | `iena` | custom |  |
| 32 | Préfecture de Police | Préfecture de police — Caserne de la Cité (museums.json) | `prefecturePolice` | custom |  |
| 33 | Tribunal de Paris | Tribunal de Paris (museums.json) | `tribunal` | custom |  |
| 34 | Hôtel de la Marine & Crillon | Hôtel de la Marine and Hôtel de Crillon (paris.json) | `gabrielPalaces` | custom |  |
| 35 | Palais de Chaillot | Palais de Chaillot (paris.json) | `palaisChaillot` | custom |  |
| 36 | Tour Montparnasse | Tour Montparnasse (monuments.json) | `montparnasseFull` | custom |  |
| 37 | Opéra Bastille | Opéra Bastille (paris.json) | `operaBastille` | custom | claude-fable-5-1 |
| 38 | Institut de France | Institut de France — dome (paris.json) | `institutDome` | custom |  |
| 39 | Hôtel de la Monnaie | Hôtel de la Monnaie (paris.json) | `classical` | restyle |  |
| 40 | La Madeleine | Église de la Madeleine (paris.json) | `madeleine` | custom |  |
| 41 | Saint-Sulpice | Église Saint-Sulpice (monuments.json) | `saintSulpice` | custom |  |
| 42 | Saint-Eustache | Église Saint-Eustache (monuments.json) | `saintEustache` | custom |  |
| 43 | Saint-Germain-des-Prés | Église Saint-Germain-des-Prés (monuments.json) | `saintGermainDesPres` | custom |  |
| 44 | Saint-Germain-l'Auxerrois | Église Saint-Germain-l'Auxerrois (monuments.json) | `saintGermainAuxerrois` | custom |  |
| 45 | Saint-Étienne-du-Mont | Église Saint-Étienne-du-Mont (monuments.json) | `saintEtienneDuMont` | custom |  |
| 46 | Saint-Augustin | Église Saint-Augustin (monuments.json) | `saintAugustin` | custom |  |
| 47 | La Trinité | Église de la Sainte-Trinité (monuments.json) | `laTrinite` | custom |  |
| 48 | Saint-Roch | Église Saint-Roch (monuments.json) | `saintRoch` | custom |  |
| 49 | Saint-Gervais | Église Saint-Gervais (paris.json) | `saintGervais` | custom |  |
| 50 | Saint-Paul-Saint-Louis | Église Saint-Paul-Saint-Louis (paris.json) | `saintPaul` | custom |  |
| 51 | Sainte-Clotilde | Basilique Sainte-Clotilde (monuments.json) | `sainteClotilde` | custom |  |
| 52 | Alexandre-Nevsky Cathedral | Cathédrale Saint-Alexandre-Nevsky (monuments.json) | `saintAlexandreNevsky` | custom |  |
| 53 | Grande Mosquée de Paris | Grande Mosquée de Paris (monuments.json) | `grandeMosquee` | custom |  |
| 54 | Grande Synagogue de la Victoire | Grande Synagogue de la Victoire (monuments.json) | `synagogueVictoire` | custom |  |
| 55 | La Sorbonne | La Sorbonne (museums.json) | `sorbonne` | custom |  |
| 56 | Val-de-Grâce | Église du Val-de-Grâce (monuments.json) | `valDeGrace` | custom |  |
| 57 | Chapelle de la Salpêtrière | Chapelle Saint-Louis de la Salpêtrière (monuments.json) | `chapelleSalpetriere` | custom |  |
| 58 | École Militaire | École Militaire — portico (paris.json) | `ecoleMilitairePortico` | custom |  |
| 59 | UNESCO | UNESCO: the Y and the Conference hall (batch2.json) | `unescoSiege` | custom | claude-opus-5-5 |
| 60 | Tour Saint-Jacques | Tour Saint-Jacques (paris.json) | `tourSaintJacques` | custom |  |
| 61 | Musée du quai Branly | Musée du quai Branly (museums.json) | `quaiBranly` | custom |  |
| 62 | Institut du monde arabe | Institut du monde arabe (museums.json) | `institutMondeArabe` | custom |  |
| 63 | Philharmonie de Paris | Philharmonie de Paris (museums.json) | `philharmonie` | custom | claude-fable-5-1 |
| 64 | Cité des Sciences | Cité des Sciences et de l'Industrie (museums.json) | `citeDesSciences` | custom |  |
| 65 | Grande Halle de la Villette | Grande Halle de la Villette (venues.json) | `grandeHalle` | custom |  |
| 66 | Fondation Louis Vuitton | Fondation Louis Vuitton (museums.json) | `fondationLouisVuitton` | custom |  |
| 67 | BnF François-Mitterrand | Bibliothèque nationale de France — Tour des Lettres (museums.json) | `bnfTower` | custom |  |
| 68 | BnF Richelieu | Bibliothèque nationale de France — Richelieu (museums.json) | `bnfRichelieu` | custom |  |
| 69 | Bourse de Commerce | Bourse de Commerce — Pinault Collection (museums.json) | `bourseCommerce` | custom |  |
| 70 | Palais Brongniart | Palais Brongniart (palaces.json) | `brongniart` | custom |  |
| 71 | Galeries Lafayette | Les Galeries Lafayette (batch3.json) | `galeriesLafayette` | custom | claude-opus-5-5 |
| 72 | Printemps Haussmann | Le Printemps: the main store (batch3.json) | `printempsMain` | custom | claude-opus-5-5 |
| 73 | La Samaritaine | La Samaritaine: Sauvage and Jourdain (batch3.json) | `samaritaine` | custom | claude-opus-5-5 |
| 74 | Le Bon Marché | Le Bon Marché (palaces.json) | `bonMarche` | custom |  |
| 75 | Gare du Nord | Gare du Nord — train shed (stations.json) | `gareDuNordShed` | custom |  |
| 76 | Gare de l'Est | Gare de l'Est (stations.json) | `gareDeLest` | custom |  |
| 77 | Gare de Lyon | Gare de Lyon (stations.json) | `gareDeLyon` | custom |  |
| 78 | Gare Saint-Lazare | Gare Saint-Lazare (stations.json) | `gareSaintLazare` | custom |  |
| 79 | Gare d'Austerlitz | Gare d'Austerlitz (stations.json) | `gareDAusterlitz` | custom |  |
| 80 | Gare Montparnasse | Gare Montparnasse (stations.json) | `gareMontparnasse` | custom |  |
| 81 | Palais de Tokyo | Palais de Tokyo: the west wing (batch4.json) | `palaisTokyoWest` | custom | claude-opus-5-5 |
| 82 | Maison de la Radio | Maison de la Radio (palaces.json) | `maisonRadio` | custom |  |
| 83 | Archives nationales (Hôtel de Soubise) | Hôtel de Soubise — the cour d’honneur (paris.json) | `soubiseCourt` | custom |  |
| 84 | Musée Carnavalet | Musée Carnavalet — the court (paris.json) | `carnavaletCourt` | custom |  |
| 85 | Musée Rodin (Hôtel Biron) | Musée Rodin — Hôtel Biron (museums.json) | `hotelBiron` | custom |  |
| 86 | Musée Picasso (Hôtel Salé) | Musée Picasso — Hôtel Salé (museums.json) | `classical` | restyle |  |
| 87 | Musée de Cluny | L'Hôtel de Cluny (batch4.json) | `hotelDeCluny` | custom | claude-opus-5-5 |
| 88 | Arts et Métiers (St-Martin-des-Champs) | Saint-Martin-des-Champs — Musée des Arts et Métiers (museums.json) | `saintMartinChevet` | custom |  |
| 89 | École des Beaux-Arts | École nationale supérieure des Beaux-Arts (museums.json) | `beauxArts` | custom |  |
| 90 | Observatoire de Paris | Observatoire de Paris (palaces.json) | `observatoire` | custom |  |
| 91 | Hôtel-Dieu | Hôtel-Dieu (museums.json) | `hotelDieu` | custom |  |
| 92 | Cirque d'Hiver | Cirque d'Hiver (paris.json) | `cirqueHiver` | custom |  |
| 93 | Moulin Rouge | Moulin Rouge (palaces.json) | `moulinRouge` | custom |  |
| 94 | Opéra-Comique | Opéra-Comique (Salle Favart) (palaces.json) | `operaComique` | custom |  |
| 95 | Théâtre des Champs-Élysées | Théâtre des Champs-Élysées (palaces.json) | `theatreChampsElysees` | custom |  |
| 96 | Accor Arena | Accor Arena (venues.json) | `accorArena` | custom |  |
| 97 | Parc des Princes | Parc des Princes (venues.json) | `parcDesPrinces` | custom |  |
| 98 | Roland-Garros (Philippe-Chatrier) | Roland-Garros: Philippe-Chatrier (venues.json) | `rgChatrier` | custom |  |
| 99 | Palais des Congrès | Palais des Congrès (venues.json) | `palaisCongres` | custom |  |
| 100 | Forum des Halles / Canopée | La Canopée — Forum des Halles (palaces.json) | `canopee` | custom |  |

## Reviews

### 1. Eiffel Tower — score 4/5
- Photo: dark brown iron, three-tier lattice, big arch under first platform. Render has the right taper, four legs and spire.
- Colour reads pale grey-white (haze plus light tint) vs brown; first-platform gallery and base arch not readable.
- Fix: tint lattice to brown ~#6b5040 and ensure haze doesn't wash it out.

### 2. Notre-Dame de Paris — score 4/5
- Photo shows twin towers with tall louvred openings, rose windows, flying buttresses, spire; all present in render.
- Towers read slightly squat/blocky and stone dark; transept rose and buttress arches coarse.
- Fix: taller louvred tower openings and warmer, lighter limestone.

### 3. Louvre Palace — score 4/5
- Wings, Cour Napoleon and Carree layout match; mansard slate roofs correct.
- Photo has tall domed/roofed pavilions (Denon, Richelieu) with warm cream stone and ornate dormers; render pavilions low and facades plain grey-cream.
- Fix: raise the pavilions with high pitched/domed roofs.

### 4. Louvre Pyramid — score 3/5
- Pyramid is present at the correct place with three small pyramids.
- Photo is a glass lattice (rhombus bars, transparent); render is a dark solid-looking pyramid with no lattice and a dark skirt.
- Fix: make glass transparent/light with a rhombic bar lattice.

### 5. Arc de Triomphe — score 5/5
- Matches photo: arch, attic with frieze, four-pier mass, relief groups on the piers, cream stone, roundabout.
- Back view dark from lighting only; the reliefs are only moderately detailed.
- Fix: none needed.

### 6. Sacré-Cœur — score 5/5
- Photo: white central dome and lantern, four small domes, portico arches, front terrace arcade; all in render.
- Terrace and staircases less clear; neighbour water tower and church generic.
- Fix: add the front terrace arcade/stair wall if missing.

### 7. Musée d'Orsay — score 3/5
- Long river facade, end pavilions and clock bays present, in the right place.
- Photo has a zinc-grey barrel roof behind the stone attic and arched glazed bays; render roof is a bright teal-blue/white slab that looks nothing like it, and the end domes are weak.
- Fix: recolour the roof to grey zinc and add the arched window bays on the Seine facade.

### 8. Centre Pompidou — score 3/5
- Photo: steel truss block with red/blue/green pipes along the rear and top; render has the block with blue roof vents and colour bands on one side.
- Front has only a plain glass grid, the escalator tube is missing, roof is bright white instead of a dark truss.
- Fix: add the diagonal escalator tube and the pipe layer on the main face.

### 9. Palais Garnier — score 4/5
- Photo: loggia with paired columns, gilded cornice, green dome, gold winged groups at the corners; render has the loggia, dome and side domes in cream stone.
- Gold statue groups, gilded cornice and the stage-house pediment are missing, stage house low.
- Fix: add gold statue groups at the pediment corners and a gilded cornice.

### 10. Dome des Invalides — score 5/5
- Photo: gold dome with drum and lantern over a cream church, grey-slate wings around courts; all match.
- Wings slightly uniform; fine.
- Fix: none needed.


### 11. Hôtel des Invalides — score 4/5
- Gilded dome on drum, the long cream wings, four-court plan, Esplanade axis and garden basin all read correctly; matches the Eiffel-tower aerial photo layout.
- Roofs are flat uniform dark grey (no slate pavilion roofs / dormer rhythm); dome slightly squat vs photo; wings a bit plain.
- Fix: add pavilion hip-roofs and dormers on the main wings, raise the dome lantern/spire slightly.

### 12. Panthéon — score 4/5
- Hexastyle portico with pediment, cruciform body, tall drum with colonnade and dome with lantern all present and well proportioned.
- Tricolour banner hung between portico columns (not in photo); drum colonnade/dome a little dark blue-grey against pale stone; no steps/railing visible.
- Fix: lighten dome lead colour toward pale grey and remove the banner.

### 13. Sainte-Chapelle — score 4/5
- (Photo: interior lead image + Commons east view of the spire.) Slender black flèche, steep gable with blue lancet windows and rose, tight inside the Palais courtyard; position and context right.
- Chapel nave is small and mostly hidden among Palais wings; roof reads grey rather than the light lead, no flying pinnacles/buttress spires; spire a plain needle without the open iron lantern base.
- Fix: add pinnacle buttresses along the nave and an open-framework base to the spire.

### 14. Conciergerie — score 4/5
- Quai de l'Horloge front matches the photo: Tour de l'Horloge at left, twin conical-roofed Bonbec/Tour d'Argent towers, long slate-roofed range along the Seine, Tour de César.
- Façade is flatter and darker than the pale limestone with Gothic dormers; lacks the stone quay-wall base; towers slightly short.
- Fix: lighten the stone and add the row of pointed dormers on the quai range.

### 15. Palais de Justice (Cour de Mai) — score 4/5
- (Photo is a Très Riches Heures miniature of the medieval Palais, useless as a façade ref; judged from knowledge.) Cream wings round the Cour de Mai with the gilded gates and blue/gold bays (seen in 014-back) and mansard roofs are plausible; the dome-roofed corner near Pont au Change is there.
- Wings read as plain cream blocks with a repeated window grid, no central pavilion pediment or rustication on the boulevard front; some wings look overly yellow.
- Fix: add the central pedimented pavilion and the stone-colour stringcourses on the Cour de Mai front.

### 16. Grand Palais — score 3/5
- Green-ribbed glass nave vault with the quadriga corner and colonnaded stone flank is there, and the building is clearly at the right place.
- Major massing error: most of the footprint is a huge pale-cream flat slab with grey rectangles (looks like a flat roof / low roof over the Palais de la Découverte side and court), so the glass-vault silhouette (central nave plus transept) is a thin strip instead of dominating the building; the colonnade facade on the Avenue Churchill side is plain.
- Fix: replace the flat cream roof slab with glass barrel vaults over the full nave/transept footprint and keep stone only for the perimeter pavilion rim.

### 17. Petit Palais — score 2/5
- Present with a small dome at the south-west pavilion, in the right spot facing Av. Winston Churchill.
- Biggest problem: a solid rectangular block with a huge flat grey roof; the real building is a "D" plan with a semicircular colonnaded garden court, a central arched porch with gilded gate, and two domed end pavilions. None of the signature arch, colonnade or curved court is visible. The builder comment admits a solid block ("court out of sight").
- Fix: model the porch arch + colonnade facade on the avenue front and give the building a courtyard hole (open semicircular garden court) with hipped slate roofs.

### 18. Hôtel de Ville — score 4/5
- Four-court Neo-Renaissance plan, corner and central pavilions with steep mansard roofs and the clock tower; faces the Place de l'Hôtel de Ville as in the photo.
- Façade reads dark grey and flat (photo: pale limestone with heavy statuary niches and arcaded ground floor); pavilion roofs smaller and the central clock tower stubby.
- Fix: lighten stone to cream and enlarge/raise the central clock tower and pavilions' roofs.

### 19. Palais de l'Élysée — score 4/5
- U-plan with central corps and side wings, slate hipped roof, garden façade facing the park; reasonable mass.
- Walls near-white instead of warm ochre limestone; roofs are plain slabs with no dormers or chimneys, so the courtyard façade lacks the character seen in the photo.
- Fix: warm the stone colour and add dormers and chimney stacks along the roof.

### 20. Palais Bourbon (Assemblée nationale) — score 3/5
- The Seine-front portico block with Corinthian colonnade exists near the Pont de la Concorde and the Cour d'Honneur / Place du Palais Bourbon wings are present.
- Bright mint-green roofs on the large courtyard buildings (and red-outlined green lawn rectangles) clash badly, and the portico mass reads very dark/near black from the back view, with the pediment hard to make out; the front-view camera only sees the rear courtyard side, not the portico.
- Fix: recolour those roofs to slate grey and lighten the portico stone/pediment material.

### 21. Palais du Luxembourg (Sénat) — score 4/5
- Cream stone, blue-grey slate pavilion roofs, garden front with pavilions all read well; basin and flowerbeds in place.
- Central dome/lantern hardly visible from the garden side; roofs are a bit uniform.
- Fix: raise/emphasise the central dome and its clock pediment on the garden façade.

### 22. Hôtel Matignon — score 3/5
- Cour d'honneur U-plan with cream façades exists, but roofs are flat brown/grey slabs (generic "restyle" classical).
- Missing the curved entrance screen wall, the central pedimented block and the zinc/slate roofs; reads as ordinary Haussmann block.
- Fix: give the courtyard wings pitched slate roofs and add the semicircular street gate wall.

### 23. Palais-Royal (Conseil d'État) — score 4/5
- Cour d'honneur, wings, arcaded façades and the long garden with flanking galleries are there.
- Roofs flat and grey; Colonnes de Buren court and gilded details not discernible.
- Fix: add mansard/pavilion roofs to the cour wings.

### 24. Quai d'Orsay (Affaires étrangères) — score 2/5
- Cream stone block with a hip roof sits at the right place on the quai.
- Real façade is a ~130 m long, flat-parapet building with a projecting central pavilion and oculi frieze; render is a short, single hip-roofed block, wings missing.
- Fix: lengthen to the full quai frontage with parapet roofline and a central pavilion.

### 25. Ministère de l'Économie (Bercy) — score 4/5
- Distinctive bridge-like block straddling the quai with its Seine-side piers is recognisable in both shots.
- Light/dark facade bands are generic; no dark glass cubes or blue gantries.
- Fix: add dark glazed oriels on the pier ends.

### 26. Hôtel de Brienne (Armées) — score 2/5
- Blue-roofed courtyard buildings in the right spot; plain Haussmann-like neighbours dominate.
- Not recognisable: no pedimented central façade, pale stone and low slate roof; blends into surroundings.
- Fix: make the garden/courtyard façade a stone block with central pediment and low hip slate roof.

### 27. Hexagone Balard — score 4/5
- Faceted dark-slate roofs, zigzag star plan and teal glass seams match the photo well.
- Roof facets slightly too regular and tall-looking; facade grey bands bland (no blue pixel glazing).
- Fix: add blue patterned glazing in the roof gables.

### 28. Ministère de l'Intérieur (Beauvau) — score 2/5 (no photo)
- Generic parisCivic: grey flat-roofed block with courtyards; not recognisable as the ministry.
- Missing Hôtel de Beauvau's pedimented garden front and mansarded wings; roofs flat grey.
- Fix: replace with a custom classical block with slate mansards and pavilion pediment.

### 29. Banque de France (Hôtel de Toulouse) — score 2/5
- Whole Banque block extruded as one huge flat grey slab with tiny courtyard holes.
- Real complex has mansard roofs, courtyards and the small Hôtel de Toulouse with a gallery; render has none of the roof articulation.
- Fix: break the slab into wings with slate mansards around real courtyards.

### 30. Cour des comptes (Palais Cambon) — score 3/5
- Courtyard block with stone façade and the domed corner/lantern behind are visible.
- Roofs flat grey; missing the rusticated columned portal and mansard cornice.
- Fix: add slate mansard roofs and the columned entrance portal on rue Cambon.


### 31. Palais d'Iéna (CESE) — score 3/5
- Photo (Commons, from the Eiffel Tower, 031-a) shows the Palais as a pale stepped block with a hemicycle toward Place d'Iéna; the render has a curved colonnaded front, which fits.
- Problems: a plain cream flat roof with no stepped upper storeys or roof structure, and a courtyard that looks too open. The cream colour is too warm for the real grey-white concrete.
- No obvious floating parts or z-fighting.
- Fix: recolour to cool pale grey concrete and add the stepped attic.

### 32. Préfecture de Police — score 3/5
- Photo (032-a) shows only the Haussmann-style quai front (zinc mansard, balconies). No photo of the full complex was found, so the rest is judged from knowledge.
- Render: a large courtyard complex with slate roofs and cream walls, sitting between the two Seine arms at about the right place and size.
- Problems: the façade is a flat grid of windows with no balcony lines or string courses. The courtyard floor is black, with no obvious relation to the real one.
- Fix: add the balcony and string-course bands on the quai front and use the real stone colour.

### 33. Tribunal de Paris — score 4/5
- Matches: the three-stage stack with set-backs, the long podium, the glass skin and the green terraces on the lower roofs.
- Problems: the glass is too uniformly blue-grey and flat. The real building has a dark vertical spine and a bright white-glass tone. The top block looks slightly boxy, and the red antenna line is odd.
- Fix: add the vertical spine and horizontal projecting fins, and use lighter glass.

### 34. Hôtel de la Marine & Crillon — score 3/5
- Photo (034-a): colonnaded Gabriel façade with 12 Corinthian columns, end pavilions with pediments and a rusticated arcade.
- In the shots the two palaces are present on the north side of Place de la Concorde at the right spacing, with slate roofs. At 300 m+ no columns or pediments can be made out; they read as pale slabs.
- Fix: a closer shot is needed to verify the colonnade. The colonnade and arcade textures look absent, so check the builder. This is not ABSENT.

### 35. Palais de Chaillot — score 4/5
- Photo (035-a) matches the render well: two curved wings, two pavilions, the central terrace and the basin with its fountains running down to the Seine.
- Problems: the shots are very hazy (fog), which makes the colour hard to judge. The wing colonnades are low-contrast pale blocks. The central terrace roof is brighter than the stone.
- Fix: darken the wing stone slightly and add the shaded colonnade recess.

### 36. Tour Montparnasse — score 4/5
- No usable photo (Commons returned a Champ de Mars view); judged from knowledge. The tower is a 210 m dark slab with bowed sides and notched ends, and the back shot shows exactly that.
- Problems: the front shot is end-on, so it is hard to read, and a wide dark slab in front of the tower looks like a generic neighbour. The facade is a uniform dark grey with no brown or bronze tone and little glass sheen. The flat roof with a small plant box is plausible.
- Fix: brown-bronze tint on the glass and a glossier material.

### 37. Opéra Bastille — score 3/5
- Photo (037-a) shows the curved glass-and-stone front, with a warm pink-gold tint on the glass and beige stone.
- Render: the stepped masses and rounded front are there, and the footprint matches.
- Problems: the walls are almost white-grey and the glass reads as flat blue-grey. There is no warm tint, and no big glazed volume at the main entrance. The roof is a plain white slab in the aerial view.
- Fix: warm stone and glass tint, plus the dark entrance volume.

### 38. Institut de France — score 4/5
- Photo (038-a, Commons) shows the dome on a drum with a pedimented portico and two curved wings reaching toward the Pont des Arts.
- Render: dome, portico and curved wings are all there and face the Seine and the Pont des Arts correctly. The end pavilions and the slate roofs are plausible.
- Problems: the dome is a flat blue-grey and the proportions look slightly squat. The drum has no windows. The facade stone is too grey and flat.
- Fix: taller drum with the three arched windows and ribbed dome.

### 39. Hôtel de la Monnaie — score 2/5
- Photo (039-a) shows a long Neoclassical stone façade with a giant Ionic colonnade on the central pavilion, a rusticated base and balustrades.
- Render: a generic restyled block with slate roofs. It occupies the right place on Quai de Conti but has none of the signature features (colonnade, rusticated base).
- Problems: nothing identifies it as the Monnaie, and the dark grey roof wraps the whole block.
- Fix: promote it to a custom builder with the central colonnaded pavilion and the long riverside façade (status is currently restyle with the classical builder).

### 40. La Madeleine — score 4/5
- Photo (040-a) shows a peristyle of 18 columns on the long sides and 8 on the front, a pedimented portico, a high podium with a broad stair and a grey roof.
- Render: 8-column front, full peristyle down the long side, the stair, and the pediment with a plain tympanum.
- Problems: the stone is a warmer yellow than the real grey-beige. The pediment has no sculpture (a plain tympanum). The roof reads blue-grey.
- Fix: neutral stone colour and a sculpted-looking tympanum texture.

### 41. Saint-Sulpice — score 4/5
- Matches: twin-tower west front, long gabled nave, transept and small dome; recognisable from the aerial and street shots.
- Problems: stone is near-white, real is warm grey-beige; towers read as blocky shafts with arched openings and lose the colonnaded two-storey front and the unequal north/south tower tops; the aerial shows the tower tops as plain boxes.
- Fix: warm the stone tint and add the two tower belfry stages (octagonal lantern on the south tower, square flat north tower).

### 42. Saint-Eustache — score 4/5
- Matches: Gothic nave with flying buttresses, rose window, steep slate roof and crossing flèche, set right on the Halles garden edge.
- Problems: stone is dark brown-grey where the real church is pale yellow-beige; roof reads blue-green; Renaissance west portal and the small clock turret on the south side are simplified.
- Fix: lighten the stone colour to pale limestone and make the roof dark slate grey.

### 43. Saint-Germain-des-Prés — score 4/5
- Matches: west bell tower with tall dark spire, low nave, apse and porch end in the right places.
- Problems: tower stone is grey-brown, real is pale cream with arcaded Romanesque belfry stages and corner pinnacles; spire slightly squat; no west porch/lean-to roofs at the tower foot.
- Fix: lighten tower stone and add the arcaded belfry stage under the spire.

### 44. Saint-Germain-l'Auxerrois — score 3/5
- Matches: right location beside the Louvre colonnade, porch of arches on the west front and a separate neo-Gothic belfry to the side.
- Problems: the main tower is drawn with a tall pointed spire; the real facade is a gabled front with a rose window and a flat-topped openwork belfry (Hôtel-de-Ville side), no big spire; nave roof is a plain grey box; facade is pale grey-white.
- Fix: remove the spire on the main tower and give the belfry a flat balustraded top with pinnacles.

### 45. Saint-Étienne-du-Mont — score 3/5
- Matches: east end/nave, lantern bell tower with small dome over the crossing area, location beside the Panthéon.
- Problems: the west facade is a flat gabled wall; the defining stacked triple pediments, big rose window and round bell turret are not legible; nave roof and walls look dark grey with generic arched windows; the conical roof in the foreground is a neighbour building, not the church.
- Fix: build the three superposed pediments and round rose window on the west front.

### 46. Saint-Augustin — score 4/5
- Matches: tall blue-grey ribbed dome with red lantern, corner domed turrets, long nave with arched windows, gabled west front; massing and dome height close to the photo.
- Problems: west facade lacks the large arched rose-window recess and statue frieze and reads as a plain gable; nave roofline slightly low and uniform; stone a touch yellow.
- Fix: add the big arched rose window with archivolt on the facade.

### 47. La Trinité — score 4/5
- Matches: tall central bell tower with lantern and cross, wide front with clock and rose window, flanking turrets, in the right square.
- Problems: tower tiers read thinner and plainer than the layered Second-Empire tower; side domed turrets small; stone too yellow versus pale cream; central porch arches hard to see.
- Fix: add stepped ornate tower stages with corner statues, lighten the stone.

### 48. Saint-Roch — score 4/5
- Matches: classical two-tier columned facade with pediment, tall steep nave roof running back along the street, dense surroundings fit.
- Problems: facade looks narrow and flush with the street; real has a broad stepped flight of stairs and wide lower storey with side bays; stone grey rather than warm; no cross at the apex or statues.
- Fix: widen the lower storey to the full width with side doors and add the stair.

### 49. Saint-Gervais — score 4/5
- Matches: three-order columned classical west facade with pediment, Gothic nave behind with buttresses and a square tower, facing the correct way onto the parvis (front 270).
- Problems: facade grey where the real one is warm cream; top pediment is a simple gable (real has a curved segmental top); Gothic nave sides lack the visible pinnacles; neighbouring generics crowd the flanks.
- Fix: switch the upper pediment to a segmental arch and warm the facade tint.

### 50. Saint-Paul-Saint-Louis — score 3/5
- Matches: grey lead-clad dome and lantern behind a columned Baroque front, on the rue Saint-Antoine axis.
- Problems: facade is too narrow and tall, reading as a belfry; the real front is wide with three stacked orders, balustrades, corner pinnacles and a central clock; dome relatively small and the nave roof plain.
- Fix: widen the facade to the real ~1:1 proportion and add the clock, balustrades and top pediment.

### 51. Sainte-Clotilde — score 4/5
- Twin spires, gabled nave, polygonal apse with chapels all present and well proportioned; stone colour good. (Ref photo is an interior; judged exteriors from knowledge.)
- Spires look slightly thin/plain; no west-portal or rose detail visible from range; apse roofs a flat slate grey.
- Fix: add spire crockets/gablets and west portal relief.

### 52. Alexandre-Nevsky Cathedral — score 4/5
- Central tent tower, two side towers, gold onions, mosaic arch and porch all present; recognisable.
- Tower stone is pale cream, photo is dark grey weathered stone; side domes read green/teal where photo shows gold-topped grey spires.
- Aerial: a large plain white-edged block next door (generic) is oversized but not part of entry.
- Fix: darken tower/spire stone to grey and gild the side onions.

### 53. Grande Mosquée de Paris — score 3/5
- Courtyard footprint, green-tile roofs and a corner minaret are present, recognisable as the complex.
- Minaret is plain white with green cap; real one is sandy stone with zellige mosaic bands and gilt balls on top. Prayer hall/courtyard arcades are blocky and lack the tilework.
- Fix: add zellige band texture and gilt ball finial to minaret.

### 54. Grande Synagogue de la Victoire — score 4/5
- Gable-fronted nave with big rose window, arcaded frieze and portal arch sits correctly in the street frontage; aerial nave roof good.
- Rose window renders solid black; facade pale yellow vs grey-beige stone; side rosettes/tower buttresses missing.
- Fix: give the rose window tracery/glass colour and stone tone.

### 55. La Sorbonne — score 3/5
- Cream facades, courtyard blocks and chapel dome with lantern present; dome shape matches photo.
- Huge roofs are a flat pale blue-grey, much lighter than slate/zinc, and read as a generic mass; chapel portico/pediment barely resolved; dome appears small against the long range.
- Fix: darken the roofs to slate and add dormers/chimneys, enlarge chapel pediment.

### 56. Val-de-Grâce — score 4/5
- Large lead-grey dome with lantern, drum with small domes, portico front and cross-plan roofs read clearly; hospital wings in front.
- Dome is slightly squat and the front portico columns are not distinct; facade stone a bit grey.
- Fix: raise dome/lantern ~10% and add the two-storey portico columns.

### 57. Chapelle de la Salpêtrière — score 4/5
- Octagonal slate dome with lantern on cross-plan chapel, flanked by long hospital wings; matches photo.
- Dome roof rendered as faceted flat panels with no curve; walls dark grey where photo shows pale limestone.
- Fix: lighten wall stone and smooth the dome profile.

### 58. École Militaire — score 2/5
- Only a tiny white portico patch shows at the central pavilion; the long main building with its slate roof is generic blocks and no dome pavilion is visible.
- Dark shadow patch beneath the portico in the back shot (floating/offset shadow geometry). Real: 9-bay pavilion with 6 Corinthian columns, tall slate dome with clock, ~40 m.
- Fix: build the central pavilion with dome and clock above the portico and cream stone wings (entry R=150 only covers the portico).

### 59. UNESCO — score 4/5
- Y-shaped glass/concrete slab on ground, conference hall with folded roof, and the separate tower block are all present and placed correctly. (Wikipedia ref was an unrelated archive scan; no usable photo, judged from knowledge.)
- Conference hall roof is bright teal/mint; the real folded concrete roof is grey-white. Y wing reads fairly plain, lacking the pilotis undercroft.
- Fix: recolour the hall roof to concrete grey.

### 60. Tour Saint-Jacques — score 3/5
- Square tower with paired lancet windows and corner pinnacles stands alone in its garden square, correct location and position.
- Tower is dark charcoal grey (photo: cream limestone, richly ornamented), plain with few tiers, top lacks the statues and the lantern crown detail; slightly too stubby/blocky.
- Fix: switch to warm cream stone and add mid-level pinnacles, tracery panels and top statues.

### 61. Musée du quai Branly — score 4/5
- Long raised bar with red/ochre/brown box cantilevers and glazed garden side reads right; Eiffel Tower context correct.
- Boxes are small and uniformly strung; real ones are chunkier, more varied in colour and project further over the garden; lower pilotis not visible.
- Fix: enlarge and vary the cantilevered boxes (size, depth, colour) on the garden side.

### 62. Institut du monde arabe — score 3/5
- Slab on the Seine bank with a grid facade and a tall companion block is present, but the photo-key feature (square diaphragm apertures, mirror-silver) reads as a plain grey/white window grid.
- Facade tone is too white/flat in the aerial; real one is dark silver-blue glass with a curved Seine face; the south tower is not distinct.
- Fix: stronger metallic dark-glass tint plus visible aperture squares on the grid.

### 63. Philharmonie de Paris — score 4/5
- Angular dark-metal mass with the faceted silver roof and white ribbon terraces matches the photo's silhouette well.
- Roof reads blue-grey speckle instead of reflective silver/dark bird-pattern cladding; red element at left is a stray pavilion.
- Fix: darken the walls and make roof cladding more silver-reflective.

### 64. Cité des Sciences — score 4/5 (no photo: logo only, Commons rate-limited; judged from knowledge)
- Long glass-and-white hall with four dark end/side blocks and the Géode sphere beside it are all present and sensibly placed.
- Facade looks pale and washed out; real building has strong greenhouse glass bays and a more clearly stepped roof with biosphere domes.
- Fix: darker glazing and visible bay articulation on the long facade.

### 65. Grande Halle de la Villette — score 3/5
- Long hall with grey roof and glazed sides is in the right place, with correct length and axis to the park.
- Missing the taller central transept with clock and the lower side-aisle roofs of the photo; reads as a single plain gabled box.
- Fix: add the raised central nave (taller gable) and the lower outer aisle shed roofs.

### 66. Fondation Louis Vuitton — score 4/5
- White "iceberg" core with curved glass sails clearly recognisable from all three angles.
- Sails are too few and opaque/blue-grey; real glass sails are larger, translucent and arch over the whole top, with timber trusses visible.
- Fix: larger, more translucent overlapping sail panels over the top.

### 67. BnF François-Mitterrand — score 3/5
- Four L-shaped corner towers around a large podium/plaza and correct location by the Seine.
- Towers are dark speckled grey; photo shows pale glass and gold-toned shutter facades; heights look a bit uneven.
- Fix: retint towers pale glass with gold timber-shutter bands, drop the dark noise texture.

### 68. BnF Richelieu — score 3/5 (photo was interior of Labrouste room only; exterior judged from knowledge)
- Stone-coloured courtyard block with slate roofs integrates plausibly with Rue de Richelieu / Rue Vivienne; courtyard layout visible.
- Reads as a generic Haussmann-style block; the reading-room glass-domed roofs and the Rue Vivienne facade details are not discernible, and part of a dark block draws over the foreground.
- Fix: add the visible oculus-domed Labrouste roof and a distinct pale stone Rue de Richelieu facade.

### 69. Bourse de Commerce — score 4/5
- Round drum with green glazed dome and cornice ring is clearly identifiable and in the right place beside Les Halles gardens.
- Stone is pale grey-white with a bright ring ledge; real facade is warm cream stone with a grand portico/pediment on the east front, which is not visible; drum windows hard to read.
- Fix: add the Corinthian portico with sculpted pediment and warm the stone.

### 70. Palais Brongniart — score 4/5 (no photo: searches rate-limited; judged from knowledge)
- Peristyle of columns on all sides around a rectangular block with central roof light is the right form.
- Rendered bright white and slightly too low; real stone is warm grey-cream with a prominent pedimented south steps front and stepped base; rooflight glows light blue.
- Fix: warm the stone tone and add the entrance staircase/pediment on the Place de la Bourse side.

### 71. Galeries Lafayette — score 3/5
- Photo is the interior dome (only available). Stained-glass dome present on a flat roof, with side skylights; corner chamfer correct.
- Facade is a row of giant ground-floor arches under a plain beige wall; the real building is a dense stepped Haussmann/Art Nouveau facade with shopfront bands. The roof is a plain flat beige slab, no mansard or terraces.
- The dome reads as teal metal, a bit large; the real exterior dome is mostly hidden behind the roof.
Fix: replace the arched colonnade with a banded Haussmann facade and add a setback mansard/terrace roof.

### 72. Printemps Haussmann — score 4/5
- Photo is only a view from the roof (no facade); judged from knowledge. Green copper domes on corner turrets and two central domes with a glass pyramid between them match Printemps' skyline.
- Massing is plausible: Haussmann block with arcaded ground floor, turrets at the corners.
- The facade is flatter and plainer than the real ornate stone. Rooftop has odd white dots and green patch (terrace props) that look like artefacts.
Fix: add pilasters, balconies and a mansard to the main facade; remove the white-dot props.

### 73. La Samaritaine — score 4/5
- The Pont-Neuf building has the right stepped, curved corner with horizontal balcony bands in cream stone, and sits correctly against the river.
- The glazed Rivoli (Jourdain) wing is teal-blue and bright, but the real one is a pale rippled glass facade; roof is a plain grey slab, with a bright blue skylight in the court.
- Pont-Neuf facade lacks the big glazed window grid and the top-floor attic steps; no SAMARITAINE lettering.
Fix: add recessed large glazed bays and a stepped attic with a dark mansard cap on the Pont-Neuf front.

### 74. Le Bon Marché — score 3/5
- Large block with mansard roofs and rounded corner pavilions matches the footprint and the continuous street frontage.
- The signature corner dome with oculi dormers and cream rotunda is missing or only a small round bump; upper floors are a plain white wall with grid windows.
- Ground floor is lime/teal trim and there is no awning or gold detail; roof surfaces are huge flat grey sheets with no dormers.
Fix: build the cream corner rotunda with a domed slate roof and dormers; add dormer rows to the mansard.

### 75. Gare du Nord — score 4/5
- Photo is the interior (Diliff). Front facade is good: central arched window, side arched bays, corner pavilions, grey stone. The hall roof is shown with glazed ridges and a long train shed behind.
- Statues and cornice are not visible at this distance; the side pavilions show as white boxes from the air.
- The shed spans look slightly too bright blue and uneven (one very dark span).
Fix: make the glazing a single consistent tone and add the statue row on the cornice.

### 76. Gare de l'Est — score 3/5
- Photo is a TGV locomotive (no building). The trainshed with two end barrel vaults and long platform sheds is present, and the platforms are modelled.
- The main facade is a flat grey slab; the central big arch window and the clock, and the big side pavilions, are hard to make out. From the track side the building is a big plain grey box.
- The modelled facade reads as a modern warehouse rather than a stone Second Empire front.
Fix: carve the central arched window with a stone surround and use cream stone with a mansard on the side pavilions.

### 77. Gare de Lyon — score 4/5
- Photo is the clock tower. The tower with a clock and blue dome is on the right of the facade as in reality; the mansard facade and the glazed train shed with ridged roof are present.
- The tower is a bit slim and the dome too saturated blue; the real tower has a stone belfry and a pale cupola.
- The Hall 1 vaults and the Hall Diderot arch on the left are present but plain; the chunky block at the front-left is plain white.
Fix: widen the tower and add a stone belfry with clock faces plus a lighter dome.

### 78. Gare Saint-Lazare — score 3/5
- Photo is a historical image of the facade; judged from knowledge. A big glazed multi-span shed rises behind a cream stone facade with mansard roofs and a small clock, which is the right composition.
- The glazed shed is a huge, uniform sheet of pale blue; the real shed is a set of lower, narrower iron vaults with visible ribs.
- The facade is long and plain; the real one has a projecting central pavilion over the Cour du Havre and the Hotel Terminus wing is missing. Streets do not clearly meet the front.
Fix: add the projecting central pavilion with a pediment and a distinct Hotel Terminus block on the side.

### 79. Gare d'Austerlitz — score 4/5
- Photo shows the Seine-side pavilion: arched windows under a clock gable and mansard. The model has a mansard facade with arched windows and a central entrance facing the river, with the long shed and the Galerie Nord behind.
- The clock gable on top of the central pavilion is missing; ornamental stone is absent so the facade is plain and the colour a bit grey.
- The big barrel vault behind the front is present with a dark glazed end; the long housing blocks on the right are generic.
Fix: add a gabled central pavilion with a clock and a brighter cream stone material.

### 80. Gare Montparnasse — score 2/5 (re-shot)
- Re-shot: front is still pressed against the Tour Montparnasse facade (only tower cladding visible); back and aerial show the tower, the Maine-Montparnasse slabs, the Jardin Atlantique deck with its pavilions, and a bare grey plaza.
- No recognisable station hall (low glazed concourse and platform roofs at the tower foot) or Rue du Départ facade is visible; it may be hidden under the deck or missing, so it counts as missing rather than a bad shot.
- Garden deck and tower are modelled, but they are not the station.
Fix: build the station concourse and platform roofs at the tower's base, or confirm the builder places it where the deck is.

### 81. Palais de Tokyo — score 3/5
- Two pale stone wings with flat roofs sit between avenue and Seine, right position and massing; colour fits.
- Signature colonnade and bas-relief panels of the central portico are not readable at 150+ m; roofs carry solar panels/blue skylights that look modern. Water basin at the sunken terrace is not obvious.
- Fix: strengthen the tall colonnade pylons (portico piers) facing the Seine terrace.

### 82. Maison de la Radio — score 4/5
- Ring building plus central square tower is clearly there, with horizontal banding and the right river-side position (Eiffel visible behind).
- Roof is a flat white disc with tower rising out of it; the real ring is a double concentric drum with a lower inner ring and a glazed dark lower storey; the dark vertical slab on the east side reads as a glitch.
- Fix: add the inner/outer ring step and darker ground-level glazing band.

### 83. Archives nationales (Hôtel de Soubise) — score 3/5
- Court of horseshoe-shaped wings with slate roofs and a formal garden behind is present in the aerial; cream stone and grey slate fit.
- Front shot is a roof/oblique, so the colonnade hemicycle and central pedimented block are not verifiable; wings read as generic mansard blocks, and neighbouring Marais fabric is visually identical.
- Fix: make the colonnaded hemicycle and pedimented main façade distinct (lighter stone, columns).

### 84. Musée Carnavalet — score 3/5
- Courtyard blocks with grey-slate mansards and a parterre garden are modelled; cluster fits the Marais fabric.
- Does not stand out from neighbours; the central pavilion with its tall dormer roof and arcaded loggia from the photo is not recognisable, and the parterre is a simple green patch.
- Fix: emphasise the central pavilion with high pyramidal mansard and arcade.

### 85. Musée Rodin (Hôtel Biron) — score 4/5
- Pale stone mansion with grey mansard, gravel/box-hedge garden and flowerbeds, correct sense of a main house facing the garden with an avenue of trees.
- Façade is a smooth block from distance; the tall arched windows, balcony and central pediment are not visible, and the back shot shows a dark, flat side.
- Fix: add the tall arched window bays and central pediment on the garden façade.

### 86. Musée Picasso (Hôtel Salé) — score 2/5
- Restyle only: a generic stone block among Marais buildings with a small formal garden; nothing marks it as a hôtel particulier.
- No pedimented central avant-corps, no sculpted courtyard façade, pale warm stone is not distinct; the aerial shows an L-shaped grey roof blending in. Not clearly identifiable.
- Fix: promote to a custom hôtel with the pedimented courtyard façade and tall mansard.

### 87. Musée de Cluny — score 3/5
- Stone building with court and garden exists, grey mansards, Notre-Dame visible behind in the front shot.
- Gothic dormer gables, ornate balustrade, and the round stair tower do not read; roofs are plain grey boxes. A dark brown open-box artefact sits at the court edge in the back/aerial shots (possible unfilled or inside-out part).
- Fix: check/remove the dark brown box and add the pointed dormer gables over the balustrade.

### 88. Arts et Métiers (St-Martin-des-Champs) — score 3/5
- Church with slate roof and a small tower plus the long cream refectory wing alongside are recognisable in the back shot; courtyard layout plausible.
- Apse/chevet semi-circular chapels with conical slate roofs are not distinct, and large grey flat roofs and a red/orange roof block dominate the front shot; stone colour in the museum wing is washed out.
- Fix: make the chevet apse chapels with conical roofs obvious on the court side.

### 89. École des Beaux-Arts — score 3/5
- Long, pale, arched-window block with low hipped slate roof faces the quai; correct scale and place near the river.
- The Palais des Études court façade with its two-storey arcade, central column and statue is not readable from the shots; roof reads generic grey, window rhythm is weak.
- Fix: strengthen the arched ground-floor arcade and darker slate roof on the court façade.

### 90. Observatoire de Paris — score 4/5
- Pale white-cream main block with corner domes, small observatories, surrounding garden paths and the long lawn axis, all correct.
- Main block is bright white and flat-roofed, not the warm stone of the photo; domes are small, and the south end of the axis shows stray grey blocks.
- Fix: warm the façade to limestone and enlarge/whiten the corner domes.

### 91. Hôtel-Dieu — score 4/5
- Long 1870s block with courtyards, pale stone, slate roofs, correct place on the Seine bank beside Notre-Dame; massing matches the old photo.
- Roofs are one flat grey slab with no chimneys or dormers, and the façade is flat, with no pavilion projections or arcaded ground floor.
- Fix: add the corner pavilions with their own roofs and the ground-floor arcade.
(Photo is a 19th-century print of the parvis façade.)

### 92. Cirque d'Hiver — score 3/5
- Polygonal drum with a pale base and a tent roof is in the right spot and recognisable as a circus.
- Roof is a tall white cone with a spike; the real roof is low and shallow behind a green cornice.
- The façade lacks the Corinthian colonnade, relief frieze and equestrian statues; the entrance block is dark and small.
- Fix: flatten the roof pitch by about half, grey-green it, and add a pilaster ring to the drum.

### 93. Moulin Rouge — score 4/5
- Red windmill with vanes, red "MOULIN ROUGE" sign and entrance, striped awning and the tall neighbour all present.
- Windmill tower is too squat and broad, and its vanes lack lattice detail.
- The big grey flat roof behind (theatre volume) is oversized and featureless.
- Fix: narrow the mill and give it a taller drum with lit windows.

### 94. Opéra-Comique — score 2/5
- Only a pale rectangular block with a hipped grey roof, in the right area, with no recognisable details (aerial only).
- No colonnaded portico, no mansard or dome roofs, no rich ornament; it reads as a generic Haussmann-scale block.
- Not visible from the front shot at all (ABSENT? probably just lost among neighbours).
- Fix: add the Place Boieldieu loggia columns and a mansard roof with curved copper roofs.
(Photo is the architect's elevation drawing.)

### 95. Théâtre des Champs-Élysées — score 2/5
- A white box with a lower grey base, in roughly the right place on Avenue Montaigne.
- Plain white attic and flat roof; the real building is a white marble façade with a deep relief frieze, tall gilded windows and a curved corner.
- No frieze, no rounded corner, no projecting cornice slab.
- Fix: give the main façade the cornice overhang, a relief panel band and the rounded corner tower.

### 96. Accor Arena — score 4/5
- Grass-covered truncated pyramid with a glazed band, a flat roof with skylight slots, concrete towers and the entry canopy; recognisable at a glance.
- The grass is far too bright lime green; the real slopes are dark turf.
- Blue steel trusses above the glazing and the round concrete stair-tower are missing or simplified.
- Fix: darken the grass colour and add a blue truss ring over the glass.

### 97. Parc des Princes — score 4/5
- Oval ribbed stadium with a coloured band and tiered bowl beside the correct neighbour (Jean-Bouin); fins and roof ring are suggested.
- Concrete is dark grey rather than warm beige, and the big roof ring is fine rather than a white open-truss rim.
- The curved white entry hall at the south end is missing.
- Fix: lighten the fin colour to beige and add the oval entrance hall.

### 98. Roland-Garros (Philippe-Chatrier) — score 3/5
- Stadium bowl with a clay court, green stands and a white roof corner; sits in the right place among the courts.
- Real roof is a wide white louvred sail covering most of the bowl; the render's roof is a thin rim on one corner only.
- Façade is a pale or grey louvre ring; the real one is glass and steel with outer stairs.
- Fix: extend the white retractable roof panels across the whole top.

### 99. Palais des Congrès — score 4/5
- Sloped glazed façade with the white swoosh logo, the low deck and the tall round tower behind are all present; layout reads right.
- Back mass is a plain grey slab with horizontal bands and a raised skylight; the real back is more varied.
- The photo found was not of the building, so this is judged from knowledge (no photo).
- Fix: break up the rear slab with the real stepped volumes.

### 100. Forum des Halles / Canopée — score 4/5
- Large pale-yellow wavy canopy with radial ribs, right size and position next to Saint-Eustache and the gardens; clearly the Canopée.
- Colour is a flat cream; the real one is golden glass with a leaf-vein lattice and a dark underside.
- Fix: add a darker rim and warm the cream to gold.
(Photo is an interior view of the patio under the canopy.)

## Rebuild wave 1 (2026-11-16)

Re-scored by a fresh Sonnet reviewer from the audit cameras (Monnaie front camera now 41°, the quai front).

| rank | building | before | after | work |
|---|---|---|---|---|
| 17 | Petit Palais | 2 | 3 | D plan, open court with peristyle, slate roofs |
| 24 | Quai d'Orsay | 2 | 2 | asymmetric Seine front, hip roof (78 m footprint disputed: reviewer expects ~18 bays) |
| 26 | Hôtel de Brienne | 2 | 2 | none (model fine, hidden by ministry blocks) |
| 28 | Beauvau | 2 | 2 | new hotelBeauvau at Place Beauvau, too small to read; plot still generic |
| 29 | Banque de France | 2 | 3 | pitched slate wings break the flat roof |
| 39 | Hôtel de la Monnaie | 2 | 3 | new hotelMonnaie builder (was restyle) |

### 17. Petit Palais — score 3/5
Horseshoe footprint around the semicircular garden court is right, cream stone and slate-grey roof with dark domed corner pavilions read as the building from the aerial and back views. Facade is a plain wall with arched ground-floor windows: no Ionic colonnade, no gilded entrance arch/ornate central dome, no balustrade. Front camera looks along the flank from the Grand Palais side, so the real front is not judged. Roof is a flat-looking grey slab; real roofline is lighter, with stone balustrade and ornate domes.
Fix: build the entrance bay (recessed arch with gilded gate, flanking colonnade, tall domed lantern above) and the Ionic colonnade along the Avenue Churchill front.

### 24. Quai d'Orsay — score 2/5
A stone block with a dark hipped cross-roof sits at the right place facing the Seine, flanked by a long wing, so the plot is occupied by something specific. But the real front is a long, low, uniform facade (roughly 18 bays) with oculi band, a taller pedimented central/side pavilion, and a fence/wall at the street; the model reads as a compact pavilion with a pyramid-ish roof and the long front is a plain brown box with a flat roof. Proportions and the symmetrical horizontal massing are wrong.
Fix: rebuild the Seine front as one long ~190 m low facade with the central pavilion and end pavilions, rusticated base, oculi band and balustraded flat roof.

### 26. Hôtel de Brienne — score 2/5
From the front/aerial shots there is no recognisable hôtel: the court is a generic block courtyard of beige slabs and grey boxes, and the street wall and the small main corps (pedimented, 9-bay, slate hip roof, in a cour d'honneur behind a wall) are not distinguishable from neighbours. Roof looks like generic flat-grey blocks; the garden and ministry annexes are huge flat boxes.
Fix: build the court front: a 9-bay two-storey stone facade with central projecting pedimented bay, arched ground windows, grey slate hip roof, closed by a blank street wall.

### 28. Hôtel de Beauvau — score 2/5
The ministry plot is still a large generic Haussmann-style block (flat grey roof with courtyards) with no signature. The new small model at Place Beauvau is only just visible in the close strip as a pale stone block with a darker slate roof beside the roundabout; it is too small and plain to identify as the hôtel, and from the standard shots it cannot be seen at all. The real hôtel has a recessed court front with colonnade/pediment that is absent.
Fix: make the Place Beauvau model clearly legible: pale stone, mansard slate roof, central pedimented pavilion and two wings, ideally taller than neighbours; and drop the box roof of the plot.

### 29. Banque de France — score 3/5
Massing is right in scale: a huge block with a large flat roof carrying skylight bands and gabled glazed ranges, and a long street front lined with regular windows and a white cornice. The facade is a uniform window grid, with none of the Galerie Dorée side, dressed stone detail, mansard or corner pavilions; roof is a flat grey sheet. Colour is plausible but flat. Recognisable as a large institutional block, not as the Banque.
Fix: add the mansard/slate roofline with chimneys and the carved portal on the rue de la Vrillière front, break the facade with pavilions and rusticated base.

### 39. Hôtel de la Monnaie — score 3/5
Camera now faces the quai: a long pale facade with dark window rows and a courtyard roof ring behind, correct length and height along the Seine and matching the real block shape in the aerial. Missing the signature central colossal order (six fluted columns on a rusticated arcaded base), the entablature and statues; windows read as a regular grid and the roof is a flat grey slab. The adjacent Institut dome on the right is a nice sanity check that the location is correct.
Fix: add the central six-column colossal order with rusticated arcade base and entablature on the quai front.

## Rebuild wave 2 (2026-11-17)

Re-scored by a fresh Sonnet reviewer. Audit cameras changed with reasons (see notes in paris-top100.json): 58 front=314, 80 moved to the Hall 1 front (R 85, front 10; its aerial lands inside Tour Montparnasse), 95 front=142.4.

| rank | building | before | after | work |
|---|---|---|---|---|
| 58 | École Militaire | 2 | 3 | new central pavilion builder (columns, pediment, square dome), placed on the pavilion; wings still restyle |
| 80 | Gare Montparnasse | 2 | 3 | right pylon moved 40 m; mostly the new camera. Slab is the city's dark glass |
| 86 | Musée Picasso (Hôtel Salé) | 2 | 2 | new hotelSale builder (was restyle); court front hidden by neighbours |
| 94 | Opéra-Comique | 2 | 2 | restyled from photo; front camera blocked |
| 95 | Théâtre des Champs-Élysées | 2 | 3 | camera only; a colour edit rendered identically (pale-face material saturates) |

### 58. École Militaire — score 3/5
The central pavilion reads at 300 m: a pediment-topped block with a dark dome and lantern on the Champ de Mars axis, with a long dark-roofed range either side. Detail is unreadable at this distance, so columns, clock and the statue are unverifiable. The wings are generic and the court wings are not distinct. Part of this score is the camera: it finally frames the right building from the right side.
Fix: shoot a 100 m close-up of the pavilion to confirm the colonnade and dome profile (the photo shows a tall square drum and a clock face), then tune those.

### 80. Gare Montparnasse — score 3/5
The front camera now shows the right composition: a low glazed hall with a white roof and two stone end towers, under a huge dark slab of office block. The slab is far too dark and uniform. The real one is pale grey with strong horizontal bands and a lighter upper storey, and its base is a lighter stone podium. Tour Montparnasse fills the left edge, which is accurate. The back view is odd: the hall roof is a big white wedge, and a separate dark tower rises from it.
Fix: lighten the slab glass and facade colour and add its horizontal banding.

### 86. Musée Picasso (Hôtel Salé) — score 2/5
The aerial shows a U-shaped mansard-roofed block around a lawn, on the right plot, with a cour d'honneur opening onto the street. That is a plausible mass, but the roof is generic blue-grey slate and the court front is a plain wall with a few windows. The photo's rusticated ashlar, pedimented central bays and sculpted dormers are absent, and the stone is an ordinary beige. It is not distinguishable from its neighbours.
Fix: model the garden-side and court facade bays (pediment, rusticated quoins, tall French windows) in warm grey stone.

### 94. Opéra-Comique — score 2/5
The front camera misses the building and shows ordinary Haussmann blocks, so the front score gets no credit. The aerial shows the building: a squarish block with a dark hipped roof and a light glass lantern. The photo shows a very ornate cream stone facade, with a first-floor loggia of three arches, caryatids and gilded details, and a rusticated base with steps. None of that shows. At this scale it looks like one more apartment block with a pyramid roof.
Fix: re-aim the front shot at Place Boieldieu, then add the three-arch loggia, rusticated base and balustrade to the facade.

### 95. Théâtre des Champs-Élysées — score 3/5
The camera now faces Avenue Montaigne and shows the right building: a flat-topped pale block with three tall gold-framed windows and a frieze band at the top, as in the photo. The stone is too white and glary, where the real facade is grey marble. The relief and gold lettering are absent, and the frieze is a row of tiny blobs. The side wings look like flat white masses, and the roof set-back is a plain box. Much of the improvement over the last score is the camera.
Fix: grey the marble, deepen the window reveals, and add the lettering and relief panel to the frieze.

## Rebuild wave 3: the five remaining 2s (2026-11-18)

Re-scored by a fresh Sonnet reviewer. Audit cameras moved onto the buildings, with reasons in paris-top100.json: 26 court front (dist 40, camH 30), 28 centred on the hôtel, 94 on Place Boieldieu (dist 24, camH 8). Quai d'Orsay measured at ~80 m (osmium + IGN ortho); the 190 m claim was wrong.

| rank | building | before | after | work |
|---|---|---|---|---|
| 24 | Quai d'Orsay | 2 | 3 | pale zinc run roof; judged against the measured 80 m front |
| 26 | Hôtel de Brienne | 2 | 3 | camera only |
| 28 | Beauvau | 2 | 2 | taller, darker slate, bigger pediment; ministry block kit p 99→3; court orientation unresolved |
| 86 | Musée Picasso (Hôtel Salé) | 2 | 2 | pedimented bays on both fronts, quoins, warm grey stone; fronts unseen from any camera |
| 94 | Opéra-Comique | 2 | 3 | recessed loggia, columns, gilt grilles, new camera |

### 24. Quai d'Orsay — score 3/5
Judged against an 80 m block: the Seine-side shot shows a pale stone block with a central pedimented pavilion and slate-grey hipped roofs, sitting in a lawn behind the quay. Massing and roofline are plausible and read as a ministry. The aerial shows a plain hip-roofed square with a central cupola-like lantern, with none of the photo's engaged-column order, round windows, balustrade or ochre stone. Part of the gain is the corrected 80 m footprint and the camera.
Fix: add the pilaster/column order and balustraded attic on the river face, and warm the stone to ochre.

### 26. Hôtel de Brienne — score 3/5
The court camera is a better view. It shows the corps de logis with a pedimented central bay, a ground-floor arcade, a central door and the two side wings enclosing a lawn. The layout matches the reference. The facade is cruder than the photo: no balconies or ironwork, no carved pediment, plain grey roof, and the stone is pale cream rather than honey. The gain is mostly the camera.
Fix: raise the first-floor windows to tall, balconied French windows, and give the roof slate-dark colour with a visible hip.

### 28. Hôtel de Beauvau — score 2/5
The new camera is on the hôtel, but the front shot shows mostly mansard roofs and chimneys, with almost no facade. The aerial shows the hôtel at the roundabout as a small cream mansard block, sitting against the large generic ministry. The real building has a garden front with a blue lattice pavilion and a stone wing, and none of that is present. It reads as a generic Haussmann block, and the better camera does not change that.
Fix: model the garden-side pavilion and a stone facade with real window proportions, and shoot the facade from street level.

### 86. Musée Picasso (Hôtel Salé) — score 2/5
From above, the roofs and the court are placed plausibly. The mass reads as an L of grey-roofed stone buildings around a gravel court, with a lawn and hedges to the west. The shot is still dominated by neighbours, and the pavilions' fronts are barely visible. The photo shows warm stone with rusticated quoins, pediments and sculpted dormers; the model has smooth flat grey/cream faces and no ornament. The roof is a flat dark-grey hip with no dormers.
Fix: add stone coursing with quoins, pedimented dormers and a carved central pavilion on the court front.

### 94. Opéra-Comique — score 3/5
The front camera is clearly better. The rusticated ground-floor arcade, the paired columns above the balcony and the balustrade all read as the photo's facade. It is missing the gilt framing and sculpture, and the coloured stone is flat cream. There are two thin cream slabs floating across the arcade at about mid-height, which look like a defect. The aerial roof is a plain grey hip with a pale-blue box on top, rather than the photo's glazed and mansard fly tower. The gain is partly camera.
Fix: remove the floating slabs, add gilt window frames and statues, and replace the roof box with the real stage-house shape.
