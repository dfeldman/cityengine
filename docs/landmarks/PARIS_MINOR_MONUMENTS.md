# Paris minor monuments to model one by one

Fountains, columns, obelisks, arches, memorials, pavilions and tombs that the city doesn't draw yet, and that the photo-to-GLB
pipeline (assetkit tools/img2glb) can't make well alone: they are architecture, several pieces, water and basins, or
fixed to a site (owner, 2026-11-22). Each wants its own model: procedural for the architecture (src/render/landmarks),
with img2glb or Tripo for the sculpted parts on it (a statue on a column, a fountain's figures), from photos picked for it.
Recent sculptures and figures built into façades (reliefs, cherubs) are left out on purpose.

**Making one**: the architecture (basins, shafts, steps, arches) as a procedural landmark entry; the sculpted parts with
assetkit's tools/img2glb/guided, run from the Mac. It takes photos picked by hand (files or Commons URLs), each cropped to
the piece (`photo.jpg@x0,y0,x1,y1`, fractions), makes the model on ml1 at once and brings back the GLB and a look sheet:

    tools/img2glb/guided louvois-goddesses 'https://upload.wikimedia.org/…/FontaineLouvois09.jpg@0.41,0.04,0.63,0.48' --height 3.5

Crop away running water: the jets are cut out with the figures and become slabs (the Louvois test, 2026-11-22).

Made 2026-11-22 from two sources:

- the sculptures list (docs/landmarks/PARIS-STATUES.md): its fountains and monuments, and works whose names say column,
  obelisk, arch, gate, memorial, basin, temple, pavilion or tomb;
- Wikidata: items in the box 2.05–2.47 E, 48.78–48.92 N with two or more Wikipedia articles, of the classes fountain,
  column, obelisk, triumphal arch, memorial, monument, war memorial, pavilion, folly, tollgate, tomb, mausoleum and the
  like. Destroyed ones, the Louvre's pavilions and museum pieces are dropped.

A work is dropped as already modelled when a landmark entry (public/landmarks/paris*.json) lies within 60 m with a shared name word, within 12 m, or names its Wikidata id: 42 were. The match is loose, so check before modelling.

Columns: **Links** is the number of Wikipedia articles (a rough fame score); **List** is the sculptures-list section (A/B/C ranks, D–G hand-written, V Versailles; W only on Wikidata); **Photos** the photos in its img2glb folder; **GLB** whether img2glb made a model of it (likely the sculpted part only). **In** is the OSM building it stands in, when it does: often itself (a pavilion), sometimes a courtyard or cemetery chapel.

## Fountains and basins (100)

| # | Work | Kind | lat, lon | Wikidata | Links | List | Photos | GLB | In |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Les Deux Plateaux | fountain,work of art,installation artwor | 48.86361, 2.33778 | Q3232046 | 9 | W |  |  | Palais Royal |
| 2 | fontaine de Léda | fountain | 48.84800, 2.33930 | Q3076156 | 9 | W |  |  |  |
| 3 | Bassin d'Apollon | fountain | 48.80737, 2.11072 | Q2887454 | 8 | V | 3 |  |  |
| 4 | fontaine Louvois | fountain | 48.86797, 2.33758 | Q3076038 | 8 | W |  |  |  |
| 5 | Fontaine Molière | fountain | 48.86550, 2.33662 | Q3076047 | 7 | B | 4 |  |  |
| 6 | Bassin de Latone | fountain | 48.80551, 2.11769 | Q14626964 | 6 | V | 3 |  |  |
| 7 | La Danse de la fontaine émergente | fountain,sculpture,installation artwork | 48.83917, 2.37056 | Q747835 | 5 | W |  |  |  |
| 8 | fontaine Gaillon | fountain | 48.86900, 2.33431 | Q579833 | 5 | W |  |  |  |
| 9 | fontaine du Château d'eau | fountain | 48.88956, 2.39228 | Q3076267 | 5 | W |  |  |  |
| 10 | fontaine du Château d'eau de Montmartre | fountain | 48.88703, 2.33914 | Q945052 | 5 | W |  |  | Fontaine du Château d'eau de Montmartre |
| 11 | fontaine du Marché-aux-Carmes | fountain,sculpture | 48.85690, 2.33680 | Q3076266 | 5 | W |  |  |  |
| 12 | Fontaine Dejean | fountain | 48.86296, 2.36706 | Q3076013 | 4 | A | 4 | made |  |
| 13 | Fontaine Gavarni | fountain | 48.87840, 2.33756 | Q3076026 | 4 | B | 3 |  |  |
| 14 | Fontaine de Jarente | fountain | 48.85574, 2.36346 | Q1435786 | 4 | B | 4 | made |  |
| 15 | Fontaine du Vert Bois | fountain | 48.86763, 2.35500 | Q3076291 | 4 | B | 3 |  |  |
| 16 | Fontaine du puits de Grenelle | fountain | 48.84688, 2.31002 | Q3076301 | 4 | B | 1 |  |  |
| 17 | Miroir d'eau, la Seine et ses affluents | fountain | 48.86681, 2.31167 | Q3076034 | 4 | W |  |  |  |
| 18 | fontaine Childebert | fountain | 48.84778, 2.35028 | Q3076004 | 4 | W |  |  |  |
| 19 | fontaine Colbert | fountain | 48.86810, 2.33887 | Q3076011 | 4 | W |  |  |  |
| 20 | fontaine de Joyeuse | fountain | 48.85730, 2.36433 | Q3076142 | 4 | W |  |  | (unnamed) |
| 21 | fontaine de la Petite-Halle | fountain | 48.85040, 2.38311 | Q3076204 | 4 | W |  |  |  |
| 22 | fontaine du Parvis Notre-Dame | fountain | 48.85343, 2.34864 | Q3076270 | 4 | W |  |  |  |
| 23 | Fontaine du Bassin Soufflot | fountain | 48.84740, 2.34059 | Q3076290 | 3 | A | 3 | made |  |
| 24 | Fontaine de Diane | fountain | 48.86592, 2.31696 | Q3076128 | 3 | B | 3 | made |  |
| 25 | Fontaine de la Paix | fountain | 48.84951, 2.33289 | Q3076202 | 3 | B | 4 |  |  |
| 26 | Fontaine des Ambassadeurs | fountain | 48.86735, 2.31800 | Q3076221 | 3 | B | 3 |  |  |
| 27 | Fontaine du Cirque | fountain | 48.86896, 2.31295 | Q3076259 | 3 | B | 4 |  |  |
| 28 | Fontaine du Théâtre Français - Nymphe marine | fountain | 48.86367, 2.33501 | Q3076333 | 3 | B | 1 |  |  |
| 29 | L'Embâcle | fountain,sculpture | 48.85330, 2.33306 | Q3076308 | 3 | W |  |  | (unnamed) |
| 30 | bassins du Petit et Grand Palais | fountain | 48.86517, 2.31401 | Q2887588 | 3 | W |  |  |  |
| 31 | fontaine de Birague | fountain | 48.85508, 2.36188 | Q3076115 | 3 | W |  |  |  |
| 32 | fontaine de Paradis | fountain | 48.86000, 2.35700 | Q3076159 | 3 | W |  |  |  |
| 33 | fontaine de la Grille du Coq | fountain | 48.86740, 2.31800 | Q3076190 | 3 | W |  |  |  |
| 34 | fontaine de la Halle aux Blés | fountain | 48.86250, 2.34298 | Q3076191 | 3 | W |  |  |  |
| 35 | fontaine de la Reine | fountain | 48.86528, 2.35056 | Q15948824 | 3 | W |  |  | (unnamed) |
| 36 | fontaine de la pointe Saint-Eustache | fountain | 48.86322, 2.34617 | Q3076223 | 3 | W |  |  |  |
| 37 | fontaine des Invalides | fountain | 48.85996, 2.31307 | Q3076236 | 3 | W |  |  |  |
| 38 | fontaine du Coq | fountain | 48.87520, 2.32990 | Q41621277 | 3 | W |  |  |  |
| 39 | fontaine du square Lamartine | fountain,drinking fountain | 48.86520, 2.27530 | Q3076297 | 3 | W |  |  |  |
| 40 | puits artésien de la Butte-aux-Cailles | fountain,drinking fountain | 48.82770, 2.35270 | Q16671566 | 3 | W |  |  |  |
| 41 | Fontaine Sainte-Geneviève | fountain | 48.84730, 2.34850 | Q3076089 | 2 | B | 4 |  |  |
| 42 | Fontaine de l'Avril | fountain | 48.86529, 2.29671 | Q3076179 | 2 | B | 3 | made |  |
| 43 | Fontaine de la cour du 15 rue du Louvre | fountain | 48.86360, 2.34158 | Q3076213 | 2 | B | 4 | made |  |
| 44 | fontaine d'Hébé | fountain | 48.85863, 2.31317 | Q131717404 | 2 | E | 1 |  |  |
| 45 | fontaine de la Porte Dorée | fountain | 48.83528, 2.40729 | Q3076201 | 2 | E | 4 |  |  |
| 46 | Bassin du Miroir | fountain | 48.80399, 2.11276 | Q2887544 | 2 | V | 4 |  |  |
| 47 | Château d'eau du Palais-Royal | fountain | 48.86236, 2.33686 | Q58125588 | 2 | W |  |  |  |
| 48 | Fontaine-labyrinthe | fountain,sculpture | 48.87674, 2.39389 | Q635634 | 2 | W |  |  |  |
| 49 | bain des Nymphes | fountain | 48.80669, 2.12118 | Q2879916 | 2 | W |  |  |  |
| 50 | bassin de Bacchus | fountain,sculpture | 48.80417, 2.11528 | Q2887459 | 2 | W |  |  |  |
| 51 | bassin de Cérès | fountain,sculpture | 48.80750, 2.11722 | Q2887473 | 2 | W |  |  |  |
| 52 | bassin de Flore | fountain,sculpture | 48.80806, 2.11472 | Q2887478 | 2 | W |  |  |  |
| 53 | bassin de Saturne | fountain,sculpture | 48.80500, 2.11278 | Q2887493 | 2 | W |  |  |  |
| 54 | bassin de la Pyramide | fountain,sculpture | 48.80649, 2.12107 | Q2887514 | 2 | W |  |  |  |
| 55 | fontaine Octave Gréard | fountain,sculpture | 48.85000, 2.34420 | Q2372689 | 2 | W |  |  |  |
| 56 | fontaine Pastorale | fountain | 48.85380, 2.33408 | Q3076051 | 2 | W |  |  |  |
| 57 | fontaine aux lions (Jardin des plantes de Paris) | fountain | 48.84366, 2.35551 | Q137838758 | 2 | W |  |  |  |
| 58 | fontaine de la place François-Ier | fountain | 48.86620, 2.30781 | Q3076214 | 2 | W |  |  |  |
| 59 | fontaine de la rue Cherche-Midi | statue,fountain | 48.84820, 2.32280 | Q16928450 | 2 | W |  |  | (unnamed) |
| 60 | fontaine des arts et métiers | fountain | 48.86730, 2.35388 | Q3076248 | 2 | W |  |  |  |
| 61 | fontaine du Marché-aux-Chevaux | fountain | 48.83972, 2.35644 | Q125451260 | 2 | W |  |  |  |
| 62 | fontaine du Point du Jour | fountain | 48.80470, 2.11814 | Q15940457 | 2 | W |  |  |  |
| 63 | fontaine du Pré-Saint-Gervais | fountain | 48.88310, 2.40361 | Q3076279 | 2 | W |  |  |  |
| 64 | fontaine du jardin Villemin | fountain,sculpture | 48.87510, 2.36163 | Q3076294 | 2 | W |  |  |  |
| 65 | fontaine du marché Saint-Martin | fountain | 48.86590, 2.35651 | Q16636596 | 2 | W |  |  |  |
| 66 | fontaine du square Tolstoï | fountain | 48.85310, 2.26080 | Q3076299 | 2 | W |  |  |  |
| 67 | monument funéraire de La Fontaine | tomb | 48.86111, 2.39489 | Q3323385 | 2 | W |  |  |  |
| 68 | nymphée de Chatou | nymphaeum | 48.89235, 2.16102 | Q22923336 | 2 | W |  |  |  |
| 69 | Fontaine Eugène Delacroix | fountain | 48.84821, 2.33554 |  |  | A | 4 | made |  |
| 70 | Fontaine des Polypores | fountain | 48.83839, 2.27864 |  |  | A | 1 | made |  |
| 71 | Fontaine du Théâtre Français - Nymphe fluviale | fountain | 48.86375, 2.33556 |  |  | A | 2 | made |  |
| 72 | Fontaine Marta Pan | fountain | 48.87674, 2.39389 |  |  | B | 1 |  |  |
| 73 | Fontaine aux Lions | fountain | 48.88957, 2.39227 |  |  | B | 4 | made |  |
| 74 | Fontaine de Neptune | fountain | 48.84855, 2.32203 |  |  | B | 3 |  |  |
| 75 | Fontaine de Place d'Italie (Huge on a Building) | fountain | 48.83143, 2.35558 |  |  | B | 0 |  |  |
| 76 | Fontaine de la Grille du Coq | fountain | 48.86838, 2.31478 |  |  | B | 3 |  |  |
| 77 | Fontaine des Fleuves | fountain | 48.86599, 2.32151 |  |  | B | 4 |  |  |
| 78 | Fontaine des Mers | fountain | 48.86496, 2.32075 |  |  | B | 4 |  |  |
| 79 | La Grande Fontaine | fountain | 48.89840, 2.37030 | Q23638021 |  | E | 0 |  |  |
| 80 | Les Poings d'eau | fountain | 48.85154, 2.41119 | Q3234796 |  | E | 1 |  |  |
| 81 | fontaine aux roseaux d'argent | fountain | 48.85100, 2.34400 | Q18146923 |  | E | 4 |  |  |
| 82 | Bassin des Couronnes | fountain | 48.80610, 2.12149 |  |  | V | 0 |  |  |
| 83 | Bassin des Couronnes | fountain | 48.80640, 2.12035 |  |  | V | 0 |  |  |
| 84 | Bassin des Lézards | fountain | 48.80534, 2.11674 |  |  | V | 4 |  |  |
| 85 | Bassin des Lézards | fountain | 48.80605, 2.11717 |  |  | V | 4 |  |  |
| 86 | Bassin du Midi | fountain | 48.80486, 2.11902 |  |  | V | 4 |  |  |
| 87 | Bassin du Nord | fountain | 48.80536, 2.11934 |  |  | V | 4 |  |  |
| 88 | Fontaine Saint-Louis | fountain | 48.79898, 2.12424 |  |  | V | 3 |  |  |
| 89 | Fontaine de la rue de l'Ermitage | fountain | 48.81632, 2.12174 |  |  | V | 3 |  |  |
| 90 | Fontaine de l’Amour assis sur un dauphin | fountain | 48.81508, 2.10558 |  |  | V | 2 |  |  |
| 91 | Fontaine des Quatre Pavés | fountain | 48.79654, 2.12655 |  |  | V | 3 |  |  |
| 92 | Fontaine | fountain | 48.82324, 2.27520 |  |  | C | 0 |  |  |
| 93 | Fontaine Alfred Stevens | fountain | 48.88174, 2.33856 |  |  | C | 0 |  |  |
| 94 | Fontaine Ephrésienne | fountain | 48.88412, 2.36925 |  |  | C | 0 |  |  |
| 95 | Fontaine Guy Lartigue | fountain | 48.83933, 2.35007 |  |  | C | 0 |  |  |
| 96 | Fontaine Saussure | fountain | 48.88860, 2.30752 |  |  | C | 0 |  |  |
| 97 | Fontaine de Trévise | fountain | 48.87491, 2.34684 |  |  | C | 4 |  |  |
| 98 | Fontaine de la Baleine Bleue | fountain | 48.84472, 2.38753 |  |  | C | 0 |  |  |
| 99 | Fontaine des Mers | fountain | 48.86570, 2.32110 |  |  | C | 4 |  |  |
| 100 | Mosaïque et bassin d'André Baudoin | sculpture | 48.84764, 2.35699 |  |  | C | 0 |  |  |

## Columns, obelisks, arches and gates (14)

| # | Work | Kind | lat, lon | Wikidata | Links | List | Photos | GLB | In |
|---|---|---|---|---|---|---|---|---|---|
| 101 | colonne Médicis | victory column | 48.86250, 2.34299 | Q1110974 | 9 | W |  |  |  |
| 102 | statue équestre de Jeanne d'Arc | sculpture,monument | 48.86382, 2.33203 | Q3497617 | 8 | W |  |  |  |
| 103 | mire du Nord | obelisk,level staff,meridian marker | 48.88760, 2.33654 | Q2385048 | 3 | W |  |  |  |
| 104 | mire du Sud | obelisk,level staff,meridian marker | 48.82070, 2.33816 | Q3315941 | 3 | W |  |  |  |
| 105 | pyramide du bois de Vincennes | obelisk | 48.83390, 2.44519 | Q3411287 | 3 | W |  |  |  |
| 106 | pyramide de Cassini | obelisk,sculpture,level staff,meridian m | 48.79840, 2.36614 | Q3411268 | 2 | W |  |  | (unnamed) |
| 107 | Colonne de la Paix armée | statue | 48.82367, 2.33638 |  |  | B | 4 | made |  |
| 108 | Statue équestre de Jeanne D'Arc | statue | 48.87545, 2.31945 |  |  | B | 3 |  |  |
| 109 | Les Bancs et la Pyramide noire | sculpture | 48.89140, 2.24028 | Q3230943 |  | E | 0 |  |  |
| 110 | statue équestre de Jeanne d'Arc | sculpture | 48.88630, 2.34318 | Q3497612 |  | E | 4 |  |  |
| 111 | Arc déplacé | sculpture | 48.89070, 2.24160 |  |  | F | 0 |  |  |
| 112 | Jeanne d'Arc 1412-1431 | sculpture | 48.83832, 2.35703 |  |  | C | 0 |  |  |
| 113 | L'Arc | sculpture | 48.83446, 2.37031 |  |  | C | 0 |  |  |
| 114 | La Porte de l'Enfer | sculpture | 48.85547, 2.31673 |  |  | C | 4 |  |  |

## Memorials and monuments (62)

| # | Work | Kind | lat, lon | Wikidata | Links | List | Photos | GLB | In |
|---|---|---|---|---|---|---|---|---|---|
| 115 | mur des Fédérés | war memorial,memorial wall | 48.85967, 2.40006 | Q910923 | 15 | W |  |  |  |
| 116 | mémorial de la France combattante | war memorial,memorial | 48.87160, 2.21383 | Q3333148 | 13 | W |  |  |  |
| 117 | Monument des Droits de l'Homme | monument | 48.85524, 2.30111 | Q3323344 | 8 | B | 0 |  |  |
| 118 | Monument aux fusillés de la cascade du bois de Boulogne | monument | 48.86170, 2.24470 | Q3091182 | 5 | E | 4 |  |  |
| 119 | mur pour la Paix | monument | 48.85340, 2.30199 | Q3327987 | 5 | W |  |  |  |
| 120 | monument aux morts du Père-Lachaise | war memorial | 48.86092, 2.39194 | Q3323309 | 4 | W |  |  | (unnamed) |
| 121 | monument aux soldats noirs morts pour la France | war memorial | 48.83320, 2.46610 | Q17745972 | 4 | W |  |  |  |
| 122 | monument à Komitas | sculpture,monument,Armenian Genocide mem | 48.86441, 2.30981 | Q3323366 | 4 | W |  |  | Hommage à Komitas et aux victimes du Génocide arménien |
| 123 | mur des Noms | monument | 48.85486, 2.35625 | Q3327981 | 4 | W |  |  |  |
| 124 | place du Bataillon-Français-de-l'ONU-en-Corée | square,war memorial | 48.85390, 2.35667 | Q3390564 | 4 | W |  |  |  |
| 125 | monument aux morts parisiens de la Première guerre mondiale | monument | 48.86186, 2.38824 | Q95124483 | 3 | E | 1 |  |  |
| 126 | monument funéraire d'Héloïse et Abélard | grave,sculpture,sepulchral monument | 48.85921, 2.39189 | Q3323370 | 3 | W |  |  | Héloïse et Abélard |
| 127 | monument à la mémoire du corps expéditionnaire russe | war memorial,sculpture | 48.86440, 2.31080 | Q18168657 | 3 | W |  |  |  |
| 128 | mémorial national de la guerre d'Algérie et des combats du Maroc et de la Tunisie | war memorial,place of national remembran | 48.86060, 2.29500 | Q3333171 | 3 | W |  |  |  |
| 129 | pièce d'eau des Suisses | monument | 48.79794, 2.11570 | Q3389524 | 3 | W |  |  |  |
| 130 | monument aux victimes de l'Opéra-Comique | monument | 48.85922, 2.39846 | Q15156006 | 2 | E | 4 |  |  |
| 131 | monument aux victimes non reconnues de l'incendie du Bazar de la Charité | monument | 48.86098, 2.39676 | Q29650332 | 2 | E | 3 |  |  |
| 132 | Monument aux Volontaires américains | memorial | 48.86775, 2.29503 | Q19945167 | 2 | W |  |  | Monument aux Volontaires Américains |
| 133 | Q31885098 | sepulchral monument | 48.84834, 2.34346 | Q31885098 | 2 | W |  |  | Chapelle Sainte-Ursule |
| 134 | jardin mémorial des enfants du Vél' d'hiv' | urban park,memorial | 48.85354, 2.28859 | Q39075133 | 2 | W |  |  |  |
| 135 | monument Pershing - Lafayette | monument | 48.81350, 2.15542 | Q3323243 | 2 | W |  |  |  |
| 136 | monument aux morts de Charenton-le-Pont | war memorial | 48.82140, 2.41446 | Q88324001 | 2 | W |  |  | (unnamed) |
| 137 | monument aux morts pour la France en Afrique du Nord de 1952 à 1962 | war memorial | 48.86281, 2.39761 | Q96091551 | 2 | W |  |  |  |
| 138 | monument aux morts pour la France en opérations extérieures | war memorial,place of national remembran | 48.83815, 2.27698 | Q74555507 | 2 | W |  |  |  |
| 139 | monument aux soldats tchécoslovaques | war memorial | 48.86334, 2.39687 | Q96035892 | 2 | W |  |  |  |
| 140 | monument aux victimes de Juin | tomb,war memorial | 48.85908, 2.39373 | Q15156018 | 2 | W |  |  |  |
| 141 | monument de l'Assistance publique | tomb,memorial | 48.85984, 2.39060 | Q15155995 | 2 | W |  |  |  |
| 142 | monument des travailleurs municipaux | tomb,war memorial | 48.86271, 2.39276 | Q15156042 | 2 | W |  |  |  |
| 143 | monument du souvenir de Bagneux | memorial | 48.80904, 2.31143 | Q109375782 | 2 | W |  |  |  |
| 144 | monument funéraire de Dantan | tomb | 48.85870, 2.39230 | Q3323375 | 2 | W |  |  |  |
| 145 | monument funéraire de Legru et Lhenoret | tomb | 48.86010, 2.38933 | Q3323384 | 2 | W |  |  |  |
| 146 | monument à la Gloire de l'expansion coloniale française | statue,monument | 48.83470, 2.46870 | Q20055095 | 2 | W |  |  |  |
| 147 | monument à la mission Marchand | sculpture,monument | 48.83450, 2.40877 | Q3323421 | 2 | W |  |  |  |
| 148 | monument à la mémoire des défenseurs de Belfort 1870-1871 | war memorial | 48.86182, 2.39229 | Q94997851 | 2 | W |  |  |  |
| 149 | monument à la mémoire des soldats morts pendant le siège de Paris de 1870-1871 | tomb,war memorial | 48.86339, 2.39082 | Q94696967 | 2 | W |  |  |  |
| 150 | mémorial de l'Escadrille La Fayette | cemetery,memorial | 48.83660, 2.17180 | Q3333144 | 2 | W |  |  | (unnamed) |
| 151 | mémorial de la Shoah à Drancy | Holocaust museum,memorial | 48.91880, 2.45197 | Q85854201 | 2 | W |  |  |  |
| 152 | mémorial des victimes de la catastrophe aérienne de Charm el-Cheikh | war memorial | 48.86129, 2.39914 | Q96099792 | 2 | W |  |  |  |
| 153 | mémorial des victimes de la catastrophe aérienne du vol Air France 447 | memorial | 48.86322, 2.39618 | Q96106655 | 2 | W |  |  |  |
| 154 | mémorial du génocide arménien d'Issy-les-Moulineaux | monument,memorial,Armenian Genocide memo | 48.81908, 2.25980 | Q20508662 | 2 | W |  |  |  |
| 155 | statue du général Daumesnil | statue,monumental sculpture,bronze objec | 48.84672, 2.43955 | Q77894919 | 2 | W |  |  |  |
| 156 | stèle à la mémoire des victimes du génocide des Tutsi au Rwanda | war memorial | 48.86291, 2.39744 | Q96080492 | 2 | W |  |  |  |
| 157 | Casimir Périer | monument | 48.86003, 2.39363 |  |  | A | 4 | made |  |
| 158 | Monument aux combattants polonais pour la défense et la libération de la France | statue | 48.86131, 2.29178 |  |  | A | 1 |  |  |
| 159 | Alphand | monument | 48.87367, 2.28986 |  |  | B | 2 | made |  |
| 160 | Au Gagne Petit | monument | 48.86661, 2.33378 |  |  | B | 3 | made |  |
| 161 | Folie Titon | monument | 48.85053, 2.38584 |  |  | B | 1 | made |  |
| 162 | La Petite Mairie | monument | 48.84887, 2.37822 |  |  | B | 4 |  |  |
| 163 | Monument aux Morts de Port-Vendres | sculpture | 48.86181, 2.33072 |  |  | B | 4 |  |  |
| 164 | Monument à Barye | monument | 48.85007, 2.35968 |  |  | B | 2 |  |  |
| 165 | Aux plus jeunes combattants volontaires de la Résistance | monument | 48.86402, 2.39478 | Q96117713 |  | E | 4 |  |  |
| 166 | Barry chien sauveteur | monument | 48.90999, 2.29762 | Q65938073 |  | E | 4 |  |  |
| 167 | Monument aux agents du chemin de fer métropolitain de Paris morts pour la France | monument | 48.87200, 2.33910 | Q56844152 |  | E | 4 |  |  |
| 168 | Monument aux combattants de la campagne de Tunisie | monument | 48.86250, 2.30450 | Q23639904 |  | E | 4 |  |  |
| 169 | Monument de Solidarność | monument | 48.85887, 2.31446 | Q112865915 |  | E | 2 |  |  |
| 170 | monument aux morts de Levallois-Perret | monument | 48.90197, 2.28831 | Q96602263 |  | E | 2 |  |  |
| 171 | monument du Général Henrion Bertier | monument | 48.88110, 2.26522 | Q96601813 |  | E | 1 |  |  |
| 172 | monument à Boussingault | monument | 48.91490, 2.36000 | Q28086367 |  | E | 3 |  |  |
| 173 | Abbaye Notre-Dame-des-Anges (ancienne) | monument | 48.80358, 2.06270 |  |  | V | 4 |  |  |
| 174 | Site historique de l'Hôpital Richaud | monument | 48.80798, 2.13398 |  |  | V | 4 |  |  |
| 175 | École spéciale militaire (ancienne maison royale de Saint-Louis) | monument | 48.80025, 2.06604 |  |  | V | 3 |  |  |
| 176 | Regard des Maussins | monument | 48.87750, 2.40698 |  |  | C | 4 |  |  |

## Pavilions, follies, tollgates, temples (19)

| # | Work | Kind | lat, lon | Wikidata | Links | List | Photos | GLB | In |
|---|---|---|---|---|---|---|---|---|---|
| 177 | pavillon frais | folly | 48.81460, 2.10774 | Q3373111 | 6 | W |  |  | Pavillon Frais |
| 178 | pavillon français | building,folly | 48.81520, 2.10747 | Q15311040 | 6 | W |  |  | Pavillon Français |
| 179 | barrière Saint-Martin | tollgate | 48.88333, 2.36944 | Q1240015 | 5 | W |  |  | Rotonde de la Villette |
| 180 | tour de l'Horloge | clock tower | 48.85610, 2.34567 | Q3533566 | 3 | W |  |  | Palais de Justice de Paris |
| 181 | Barrière Saint-Jacques | tollgate | 48.83347, 2.33625 | Q124628027 | 2 | W |  |  |  |
| 182 | Grotte du Petit Trianon | folly,grotto | 48.81490, 2.10900 | Q139624494 | 2 | W |  |  | (unnamed) |
| 183 | Pavillon de la Nouvelle-Calédonie et dépendances à l'Exposition coloniale internationale de 1931 | pavilion,public building | 48.83172, 2.40464 | Q130870360 | 2 | W |  |  |  |
| 184 | Pavillon du Roi | pavilion | 48.85995, 2.33729 | Q107980596 | 2 | W |  |  | (unnamed) |
| 185 | barrière de Bercy | tollgate | 48.84099, 2.37813 | Q111207469 | 2 | W |  |  |  |
| 186 | barrière de Passy | tollgate | 48.85793, 2.28792 | Q58049819 | 2 | W |  |  |  |
| 187 | barrière de la Chapelle | tollgate | 48.88478, 2.35942 | Q21426962 | 2 | W |  |  |  |
| 188 | barrière des Deux-Moulins | tollgate | 48.83656, 2.35926 | Q30739206 | 2 | W |  |  |  |
| 189 | logements d'Électricité de France | pavilion | 48.81458, 2.40485 | Q22980855 | 2 | W |  |  |  |
| 190 | pavillon Saint-Vigor | pavilion | 48.79919, 2.16761 | Q22924053 | 2 | W |  |  | Pavillon Saint-Vigor |
| 191 | pavillon de la Réunion | pavilion | 48.83364, 2.46715 | Q3373069 | 2 | W |  |  |  |
| 192 | pavillon de musique | pavilion,pavilion | 48.86860, 2.12310 | Q3373091 | 2 | W |  |  | (unnamed) |
| 193 | pavillon de musique de la comtesse de Provence | pavilion | 48.80010, 2.15687 | Q3373094 | 2 | W |  |  | Pavillon de musique de la comtesse de Provence |
| 194 | pavillons d'octroi | pavilion | 48.79840, 2.15310 | Q22924036 | 2 | W |  |  |  |
| 195 | Le Kiosque des Noctambules - Bouche de Métro | sculpture | 48.86313, 2.33606 |  |  | B | 4 |  |  |

## Tombs (7)

| # | Work | Kind | lat, lon | Wikidata | Links | List | Photos | GLB | In |
|---|---|---|---|---|---|---|---|---|---|
| 196 | cénotaphe de Baudelaire | cenotaph,sculpture | 48.83740, 2.32856 | Q3010223 | 3 | W |  |  |  |
| 197 | mausolée de Gaspard Monge | mausoleum | 48.86031, 2.39366 | Q5526576 | 3 | W |  |  | Gaspard Monge |
| 198 | Tombeau du maréchal Foch | tomb | 48.85518, 2.31278 | Q138551188 | 2 | W |  |  | (unnamed) |
| 199 | dolmen de Ker-Han | dolmen,tomb | 48.81440, 2.23900 | Q30739575 | 2 | W |  |  |  |
| 200 | mausolée du Prince Impérial | mausoleum | 48.86940, 2.16678 | Q3301853 | 2 | W |  |  |  |
| 201 | tombe de l'abbé Delille | grave,tomb,sculpture | 48.86049, 2.39294 | Q3323390 | 2 | W |  |  | (unnamed) |
| 202 | tombe du Dragon | cenotaph,sculpture | 48.85906, 2.39588 | Q3531119 | 2 | W |  |  |  |

## Already modelled (dropped above)

Arc de Triomphe du Carrousel (as Arc de Triomphe du Carrousel), Barrière du Trône - Philippe Auguste (as Barrière du Trône — Saint Louis), Barrière du Trône - Saint-Louis (as Barrière du Trône — Saint Louis), Bassin d'Encelade (as Versailles: the treillage of the Bosquet de l'Encelade), Bassin de Neptune (as Versailles: the Bassin de Neptune), Bassin de l'Encelade (as Versailles: the treillage of the Bosquet de l'Encelade), Bassin du Dragon (as Versailles: the Bassin de Neptune), Canyoneaustrate (as Canyoneaustrate), Chapelle Saint-Louis de la Salpêtrière (as Chapelle Saint-Louis de la Salpêtrière), Colonne Vendôme (as Colonne Vendôme), Colonne Vendôme statue of Napoleon (as Colonne Vendôme), Colonne de Juillet (as Colonne de Juillet), Colonnes de Buren (as Colonnes de Buren), Fontaine Boucherat (as Fontaine Boucherat), Fontaine Charlemagne (as Fontaine Charlemagne), Fontaine Médicis (as Fontaine Médicis), Fontaine Saint Julien Le Pauvre (as Église Saint-Julien-le-Pauvre), Fontaine Saint-Michel (as Fontaine Saint-Michel), Fontaine Trogneux (as Fontaine de Charonne), Fontaine de Mars (as Fontaine de Mars), Fontaine de la Croix du Trahoir (as Fontaine de la Croix-du-Trahoir), Fontaine de la Roquette (as Fontaine de la Roquette), Fontaine de la place Gambetta (as Fontaine de la place Gambetta), Fontaine des Innocents (as Fontaine des Innocents), Fontaine des Quatre Saisons (as Fontaine des Quatre-Saisons), Fontaine des Quatre Évêques (as Fontaine Saint-Sulpice), Fontaine des Quatre-Parties-du-Monde (as Fontaine de l'Observatoire), Fontaine du Château d'eau (as Fontaine du Château-d'Eau), Fontaine du Fellah (as Fontaine du Fellah), Fontaine du Palmier (as Fontaine du Palmier), Fontaine du Pot-de-Fer (as Fontaine du Pot-de-Fer), Fontaines de Pol Bury (as Les Sphérades (ouest)), Grotte (as Versailles: the grotto of the Bains d'Apollon), Jeanne d'Arc (as Basilique Sainte-Jeanne-d’Arc), L'amour se taillant un arc dans la massue d'Hercule (as Temple de l'Amour), Le Bassin (Bassin Takis) (as Bassin Takis), Monument aux mères du 14e arrondissement (as Mairie Annexe du 14e arrondissement), Obélisque de Louxor (as Place de la Concorde), Temple de l'Amour (as Temple de l'Amour), Temple de l'Amour (as Temple de l'Amour), Tour Eiffel (as Tour Eiffel), monument à Charles Garnier (as Palais Garnier)

## Status

- mur des Fédérés: modelled (src/render/landmarks/paris/monuments/minor/mur-des-federes.ts, public/landmarks/paris/monuments.json; Modly pieces: none)
- mémorial de la France combattante (Q3333148): skipped: Mont Valérien (lon 2.2138) lies west of the baked Paris box (lon 2.218–2.410)
- Les Deux Plateaux (Q3232046): already modelled as src/render/landmarks/paris/buren-columns.ts
- colonne Médicis (Q1110974): already modelled as medicisColumn in src/render/landmarks/paris/museums/bourse-commerce.ts (Bourse de Commerce entry)
- fontaine de Léda (Q3076156): modelled (back of medicisFountain, src/render/landmarks/paris/palaces/medicis-fountain.ts `ledaFountain`, public/landmarks/paris/palaces.json "Fontaine Médicis" entry unchanged; Modly pieces: none, the Léda-and-swan relief is a flat procedural stand-in)
- Monument des Droits de l'Homme (Q3323344): modelled (src/render/landmarks/paris/monuments/minor/droits-de-l-homme.ts, public/landmarks/paris/monuments.json; Modly pieces: droits-group, droits-toga, published in assetkit-models-paris, placed in public/landmarks/paris-statues.json)
- fontaine Louvois (Q3076038): modelled (src/render/landmarks/paris/monuments/minor/fontaine-louvois.ts, public/landmarks/paris/monuments.json; Modly pieces: louvois-group, louvois-triton, published in assetkit-models-paris, placed in public/landmarks/paris-statues.json; new monument-kit routines fountainBowl, jetRing)
- statue équestre de Jeanne d'Arc (Q3497617): already modelled as statue entry jeanne-darc-pyramides (public/landmarks/paris-statues.json)
- fontaine Molière (Q3076047): modelled (src/render/landmarks/paris/monuments/minor/fontaine-moliere.ts, public/landmarks/paris/monuments.json; Modly pieces: moliere-seated, moliere-muse (placed twice as moliere-muse-1/2), published in assetkit-models-paris, placed in public/landmarks/paris-statues.json)
- Monument aux fusillés de la cascade du bois de Boulogne (Q3091182): modelled (src/render/landmarks/paris/monuments/minor/fusilles-cascade.ts, public/landmarks/paris/monuments.json; Modly pieces: none, a plain round stele with shallow crosses)
- La Danse de la fontaine émergente (Q747835): modelled (src/render/landmarks/paris/monuments/minor/danse-fontaine-emergente.ts, public/landmarks/paris/monuments.json; Modly pieces: none, nothing figurative visible in the one photo; new kit routines sweptTube, hoop, finPlate)
- fontaine Gaillon (Q579833): modelled (src/render/landmarks/paris/monuments/minor/fontaine-gaillon.ts, public/landmarks/paris/monuments.json; Modly pieces: gaillon-dauphin)
- fontaine du Marché-aux-Carmes (Q3076266): modelled (src/render/landmarks/paris/monuments/minor/fontaine-marche-carmes.ts, public/landmarks/paris/monuments.json; Modly pieces: carmes-head)
- fontaine du Château d'eau de Montmartre (Q945052): modelled (src/render/landmarks/paris/monuments/minor/fontaine-reservoir-montmartre.ts, public/landmarks/paris/monuments.json; Modly piece reservoir-vase NOT yet made well: attempt 1 gave spiky slabs from the water jet, attempt 2 (trellis2) hung on ml1; no statues entry added)
- fontaine du Château d'eau de Montmartre (Q945052), update 2026-11-22: vase now made (Modly reservoir-vase, hunyuan21, published; jet painted out of the Commons photo) and attached in paris-statues.json; the niche is flush on the ring's front wall (the earlier niche was inside the claimed building wall and hid the vase)
- fontaine du Château d'eau / fontaine aux Lions de Nubie (Q3076267): modelled (src/render/landmarks/paris/monuments/minor/fontaine-lions-nubie.ts, public/landmarks/paris/monuments.json; Modly pieces: nubie-lion x8 in paris-statues.json, published)
- mur pour la Paix (Q3327987): skipped: dismantled June 2020 (frwiki); not on site, relocation to avenue de Breteuil annulled 2023
- barrière Saint-Martin (Q1240015): already modelled as rotondeVillette (src/render/landmarks/paris/museums/rotonde-villette.ts, museums.json "Rotonde de la Villette")
- Fontaine Dejean (Q3076013): modelled (src/render/landmarks/paris/monuments/minor/fontaine-dejean.ts, public/landmarks/paris/monuments.json; Modly pieces: dejean-pelican, published, placed in public/landmarks/paris-statues.json)
- fontaine de Jarente (Q1435786): modelled (src/render/landmarks/paris/monuments/minor/fontaine-jarente.ts, public/landmarks/paris/monuments.json; Modly pieces: none, the shell cartouche is shallow relief kept procedural)
- Fontaine du puits de Grenelle (Q3076301): modelled (src/render/landmarks/paris/monuments/minor/fontaine-grenelle.ts, public/landmarks/paris/monuments.json; Modly pieces: none, the mascaron is a procedural stand-in after three failed attempts grenelle-mascaron (flat slabs from a ~140 px crop), unpublished)
- Fontaine du Vert Bois (Q3076291): modelled (src/render/landmarks/paris/monuments/minor/fontaine-vert-bois.ts, public/landmarks/paris/monuments.json; Modly pieces: vertbois-crown, vertbois-mascaron, published, placed in public/landmarks/paris-statues.json)
- Fontaine Gavarni (Q3076026): modelled (src/render/landmarks/paris/monuments/minor/fontaine-gavarni.ts, public/landmarks/paris/monuments.json "Monument à Gavarni"; Modly pieces: gavarni-statue, published, placed in public/landmarks/paris-statues.json; the carnival figures in relief (gavarni-group, 3 failed attempts, unpublished) and the two bronze masks are procedural stand-ins)
- fontaine du Parvis Notre-Dame (Q3076270): skipped: Wikidata calls it an "ancienne fontaine" (a lost fountain; only a historic print on Commons), nothing to ride past today
- fontaine Childebert (Q3076004): modelled (src/render/landmarks/paris/monuments/minor/fontaine-childebert.ts, public/landmarks/paris/monuments.json; Modly pieces: childebert-mascaron2 (trellis2, published, placed in public/landmarks/paris-statues.json; chin texture dark; attempt 1 childebert-mascaron was a flat slab, unpublished))
- fontaine de la Petite-Halle (Q3076204): modelled (src/render/landmarks/paris/monuments/minor/fontaine-petite-halle.ts, public/landmarks/paris/monuments.json; Modly pieces: montreuil-mascaron, published; attach bearing 180 (faces out of the north niche))
- Miroir d'eau, la Seine et ses affluents (Q3076034): modelled (src/render/landmarks/paris/monuments/minor/fontaine-miroir-eau.ts, public/landmarks/paris/monuments.json; Modly pieces: miroir-sud, published, placed in public/landmarks/paris-statues.json; north groups and end putti not modelled)
- fontaine Colbert (Q3076011): skipped: a wall fountain that is only the street front of a house at 6 rue Colbert (BnF-owned; round windows, door, pediment, grille are the house's own facade, a 0.3 m mascaron the only fountain part), nothing separable to model
- fontaine de Joyeuse (Q3076142): modelled, NOT visually checked and Modly piece NOT published (src/render/landmarks/paris/monuments/minor/fontaine-joyeuse.ts, public/landmarks/paris/monuments.json; Modly pieces: joyeuse-enfant made and in paris-statues.json, upload to assetkit-models-paris failed with R2 RequestTimeTooSkewed: rerun `tools/img2glb/guided joyeuse-enfant --publish --no-make` once the Mac clock is right; two shots failed because the :5200 dev server timed out on page load under machine load ~50)
- mur des Noms (Q3327981): already modelled as memorialShoah (src/render/landmarks/paris/monuments/memorial-shoah.ts, monuments.json "Mémorial de la Shoah" includes the Mur des Noms court)
- place du Bataillon-Français-de-l'ONU-en-Corée (Q3390564): NOT REACHED/not modelled: a small Marais square (4e) whose "war memorial" tag is only a plaque (Commons shows plaques only), nothing to ride past; skip unless the coordinator disagrees
- monument aux soldats noirs morts pour la France (Q17745972): modelled (src/render/landmarks/paris/monuments/minor/monument-soldats-noirs.ts, public/landmarks/paris/monuments.json; Modly pieces: soldatsnoirs-femme, published)
- monument à Komitas (Q3323366): modelled (src/render/landmarks/paris/monuments/minor/monument-komitas.ts, public/landmarks/paris/monuments.json; Modly pieces: komitas-statue2 (trellis2), published, placed in paris-statues.json)
- monument aux morts du Père-Lachaise (Q3323309): modelled (src/render/landmarks/paris/monuments/minor/monument-morts-pere-lachaise.ts, public/landmarks/paris/monuments.json; Modly pieces: pere-couple, pere-gauche, pere-droite, all published, placed in public/landmarks/paris-statues.json)
- Fontaine du Bassin Soufflot (Q3076290): modelled (src/render/landmarks/paris/monuments/minor/fontaine-bassin-soufflot.ts, public/landmarks/paris/monuments.json; Modly pieces: soufflot-triton, published; only seen in one overview shot)
- Bassin d'Apollon (Q2887454): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Bassin de Latone (Q14626964): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Bassin du Miroir (Q2887544): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- bain des Nymphes (Q2879916): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- bassin de Bacchus (Q2887459): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- bassin de Cérès (Q2887473): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- bassin de Flore (Q2887478): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- bassin de Saturne (Q2887493): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- bassin de la Pyramide (Q2887514): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- fontaine du Point du Jour (Q15940457): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Bassin des Couronnes (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Bassin des Couronnes (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Bassin des Lézards (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Bassin des Lézards (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Bassin du Midi (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Bassin du Nord (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Fontaine Saint-Louis (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Fontaine de la rue de l'Ermitage (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Fontaine de l’Amour assis sur un dauphin (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Fontaine des Quatre Pavés (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- pièce d'eau des Suisses (Q3389524): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Abbaye Notre-Dame-des-Anges (ancienne) (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Site historique de l'Hôpital Richaud (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- École spéciale militaire (ancienne maison royale de Saint-Louis) (): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- pavillon frais (Q3373111): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- pavillon français (Q15311040): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- Grotte du Petit Trianon (Q139624494): skipped: Versailles estate (Château, Trianon, park or Marly side), out of scope for now
- mémorial de la Shoah à Drancy (Q85854201): skipped: lat 48.919, north of the paris-centre box (z1 ≈ lat 48.898)
- Barry chien sauveteur (Q65938073): skipped: lat 48.910 (Asnières dog cemetery), north of the paris-centre box
- monument aux morts de Levallois-Perret (Q96602263): skipped: lat 48.902, north of the paris-centre box
- monument à Boussingault (Q28086367): skipped: lat 48.915, north of the paris-centre box
- Fontaine de la Paix (Q3076202): modelled (monuments/minor/fontaine-paix.ts, monuments.json; Modly pieces: none, the four reliefs are shallow panels)
- Fontaine de Diane (Q3076128): modelled (src/render/landmarks/paris/monuments/minor/fontaine-diane.ts + kit hittorffFountain, public/landmarks/paris/monuments.json; Modly pieces: diane-diane, published)
- Fontaine des Ambassadeurs: modelled (monuments/minor/fontaine-ambassadeurs.ts, monuments.json; Modly pieces: ambassadeurs-nymphe)
- L'Embâcle (Q3076308): modelled (monuments/minor/fontaine-embacle.ts, monuments.json, kit tiltedSlab; Modly pieces: none, bronze plates are flat slabs; the list's coordinate was 28 m south inside a block, position taken from OSM way 664223075)
- bassins du Petit et Grand Palais (Q2887588): modelled (monuments/minor/fontaine-bassins-palais.ts, monuments.json: 4 round basins + the two Champs-Élysées ovals (ways 66768655, 66768634); Larche's Miroir d'eau beside them was already fontaineMiroirEau; Modly pieces: none attempted, the reeds, vase and dolphins are small procedural stand-ins)
- fontaine du Cirque (Q3076259): modelled (src/render/landmarks/paris/monuments/minor/fontaine-cirque.ts, public/landmarks/paris/monuments.json; Modly pieces: cirque-saisons (trellis2, published))
- fontaine de Birague (Q3076115): skipped: destroyed in 1856 (fr.wikipedia: reconstructed twice, definitively demolished; Wikidata "former fountain"), nothing stands at rue Saint-Antoine/rue de Birague today
- fontaine de la pointe Saint-Eustache (Q3076223): skipped: lost (Wikidata 2026-11-23: "former …" and/or state of conservation destroyed / dissolved date); nothing to ride past
- fontaine des Invalides (Q3076236): skipped: lost (Wikidata 2026-11-23: "former …" and/or state of conservation destroyed / dissolved date); nothing to ride past
- Château d'eau du Palais-Royal (Q58125588): skipped: lost (Wikidata 2026-11-23: "former …" and/or state of conservation destroyed / dissolved date); nothing to ride past
- fontaine du Marché-aux-Chevaux (Q125451260): skipped: lost (Wikidata 2026-11-23: "former …" and/or state of conservation destroyed / dissolved date); nothing to ride past
- fontaine du marché Saint-Martin (Q16636596): skipped: lost (Wikidata 2026-11-23: "former …" and/or state of conservation destroyed / dissolved date); nothing to ride past
- Barrière Saint-Jacques (Q124628027): skipped: lost (Wikidata 2026-11-23: "former …" and/or state of conservation destroyed / dissolved date); nothing to ride past
- Pavillon de la Nouvelle-Calédonie et dépendances à l'Exposition coloniale internationale de 1931 (Q130870360): skipped: lost (Wikidata 2026-11-23: "former …" and/or state of conservation destroyed / dissolved date); nothing to ride past
- barrière de Bercy (Q111207469): skipped: lost (Wikidata 2026-11-23: "former …" and/or state of conservation destroyed / dissolved date); nothing to ride past
- barrière de Passy (Q58049819): skipped: lost (Wikidata 2026-11-23: "former …" and/or state of conservation destroyed / dissolved date); nothing to ride past
- barrière de la Chapelle (Q21426962): skipped: lost (Wikidata 2026-11-23: "former …" and/or state of conservation destroyed / dissolved date); nothing to ride past
- barrière des Deux-Moulins (Q30739206): skipped: lost (Wikidata 2026-11-23: "former …" and/or state of conservation destroyed / dissolved date); nothing to ride past
- Fontaine du Théâtre Français - Nymphe marine (Q3076333): modelled (src/render/landmarks/paris/monuments/minor/fontaine-theatre-francais.ts `fontaineTheatreFrancaisMarine`, public/landmarks/paris/monuments.json; Modly pieces: theatre-marine-nymphe, published; the four putti are not modelled)
- Fontaine du Théâtre Français - Nymphe fluviale: modelled (same builder `fontaineTheatreFrancaisFluviale`, public/landmarks/paris/monuments.json; Modly pieces: theatre-fluviale-nymphe, published; the four putti are not modelled)
- fontaine de la Grille du Coq (Q3076190): modelled (src/render/landmarks/paris/monuments/minor/fontaine-grille-coq.ts, public/landmarks/paris/monuments.json "Fontaine de la Grille du Coq"; Modly pieces: none, the only Hittorff fountain without sculpture; a different fountain from the Ambassadeurs: real place is OSM way 67092064 at 48.86838, 2.31478 (list row 76), the row-33 Wikidata/frwiki point copies the Ambassadeurs; kit hittorffFountain got an optional jetH)
- fontaine de Paradis (Q3076159): modelled (src/render/landmarks/paris/monuments/minor/fontaine-paradis.ts, public/landmarks/paris/monuments.json "Fontaine de Paradis"; Modly pieces: none, the dry scallop niche in the Hôtel de Soubise's SW corner pavilion is architecture; placed on the chamfer of OSM way 6742329, which is not claimed)
- Fontaine de la Grille du Coq (row 76, no Wikidata id): the same fountain as fontaine de la Grille du Coq (Q3076190), modelled above at this row's (correct) point
- fontaine de la Halle aux Blés (Q3076191): skipped: the 1812 fountain (Pajou design) against the colonne Médicis is lost; frwiki says only the commemorative plaque and the Paris coat of arms above it survive, on the column's base, which medicisColumn (museums/bourse-commerce.ts) already draws as its pedestal
- fontaine du square Lamartine (Q3076297): modelled (src/render/landmarks/paris/monuments/minor/fontaine-square-lamartine.ts `fontaineSquareLamartine`, public/landmarks/paris/monuments.json "Fontaine du square Lamartine"; Modly pieces: none, a plain 1950s travertine block with plaque and tap, no sculpture)
- fontaine de la Reine (Q15948824): modelled (src/render/landmarks/paris/monuments/minor/fontaine-reine.ts `fontaineReine`, public/landmarks/paris/monuments.json "Fontaine de la Reine"; Modly pieces: reine-mascaron, published, placed twice via paris-statues.json reine-mascaron-e/-w; placed on the OSM house SW corner, 10 m from Wikidata's point)
- mire du Nord (Q2385048): skipped: a 3 m stone pyramid (Cassini, 1736) standing in the private garden of the Moulin de la Galette residence (1-3 rue Girardon / 77-81 rue Lepic / 1-5 avenue Junot, Montmartre); closed to the public and not a thing to ride past
- fontaine du Coq (Q41621277): modelled (src/render/landmarks/paris/monuments/minor/fontaine-du-coq.ts `fontaineDuCoq`, public/landmarks/paris/monuments.json "Fontaine du Coq"; Modly pieces: coq-fontaine, published; real place is the south dead end of the avenue du Coq at 48.87520, 2.32988, the Wikidata point is right; fish relief and shell frieze procedural)
- mire du Sud (Q3315941): already modelled as "Parc Montsouris: the Mire du Sud" (public/landmarks/paris/batch1.json, builder mireDuSud in src/render/landmarks/paris/batch1/parks.ts, placed on OSM node/3588040118 at 48.82095, 2.33701; Wikidata's 48.82070, 2.33816 is ~88 m east, a rougher point)
- puits artésien de la Butte-aux-Cailles (Q16671566): modelled (src/render/landmarks/paris/monuments/minor/fontaine-puits-butte-aux-cailles.ts `fontainePuitsButteAuxCailles`, public/landmarks/paris/monuments.json "Puits artésien de la Butte-aux-Cailles"; Modly pieces: none, a plain stone trough under a stainless-steel arched pipe, no sculpture)
- Fontaine aux Lions (no Wikidata id): already modelled as fontaineLionsNubie (monuments.json "Fontaine aux Lions de Nubie", 1 m away)
- pyramide du bois de Vincennes (Q3411287): modelled (src/render/landmarks/paris/monuments/minor/obelisque-pyramide-vincennes.ts, public/landmarks/paris/monuments.json; Modly pieces: none, only shallow cartouche reliefs)
- Arc de Triomphe (major-sculpture pass): the four pillar groups replaced (src/render/landmarks/paris/arc-de-triomphe.ts MODLY_GROUPS, public/landmarks/paris-statues.json; Modly pieces: arctriomphe-depart, arctriomphe-triomphe, arctriomphe-resistance, arctriomphe-paix); high reliefs, spandrels, frieze, shields kept procedural
- Arc de Triomphe du Carrousel (major-sculpture pass): quadriga, Victories and the eight soldiers replaced (src/render/landmarks/paris/monuments/gates.ts CARROUSEL_MODLY_*, public/landmarks/paris-statues.json; Modly pieces: carrousel-quadriga, carrousel-victoire, carrousel-artilleur, -carabinier-infanterie, -carabinier-cheval, -chasseur, -cuirassier, -dragon, -grenadier, -sapeur); attic and side reliefs kept as plain panels
- monument aux morts parisiens de la Première guerre mondiale (Q95124483): modelled (src/render/landmarks/paris/monuments/minor/monument-morts-parisiens-ww1.ts, public/landmarks/paris/monuments.json; Modly pieces: none, a 280 m x 1.3 m dark blue steel lettered wall with no sculpture; seen from the boulevard de Ménilmontant along the Père-Lachaise wall, placed along OSM way 13859706)
- mémorial national de la guerre d'Algérie (Q3333171): modelled (src/render/landmarks/paris/monuments/minor/monument-memorial-algerie.ts, public/landmarks/paris/monuments.json; Modly pieces: none, all structure, the displays are lit procedural panels)
- monument funéraire d'Héloïse et Abélard (Q3323370): modelled (src/render/landmarks/paris/monuments/minor/tombe-heloise-abelard.ts, public/landmarks/paris/monuments.json "Tombe d'Héloïse et Abélard"; claims OSM way 313811735; Modly pieces: none, 3 attempts at the effigy pair failed, so the gisants are procedural blocks)
- tour de l'Horloge (Q3533566): already modelled as part of the Conciergerie's quai de l'Horloge front (public/landmarks/paris.json "La Conciergerie": the Horloge, César, Argent and Bonbec towers)
- monument à la mémoire du corps expéditionnaire russe (Q18168657): modelled (src/render/landmarks/paris/monuments/minor/monument-corps-expeditionnaire-russe.ts `monumentCorpsExpeditionnaireRusse`, public/landmarks/paris/monuments.json "Monument du corps expéditionnaire russe"; Modly pieces: russe-soldat-cheval, published, placed via paris-statues.json; not in the img2glb pool; black granite plinth procedural, plaque side guessed)
- Fontaine Sainte-Geneviève (Q3076089): modelled (src/render/landmarks/paris/monuments/minor/fontaine-sainte-genevieve.ts, public/landmarks/paris/monuments.json; Modly pieces: sainte-genevieve-lion, published, placed 3x)
- cénotaphe de Baudelaire (Q3010223): modelled (src/render/landmarks/paris/monuments/minor/tombe-cenotaphe-baudelaire.ts, public/landmarks/paris/monuments.json "Cénotaphe de Baudelaire"; Modly pieces: baudelaire-poete, baudelaire-gisant, both published)
- Fontaine de la cour du 15 rue du Louvre (Q3076213): skipped: stands in the private Cour des Fermes (OSM access=private), enclosed by apartment/office buildings, ~10 m from the nearest courtyard path and ~34 m from the nearest public street (rue du Bouloi); not visible from any street or public passage, so it cannot be ridden past
- fontaine d'Hébé (Q131717404): skipped: a faience fountain made for the 1900 Exposition universelle (Esplanade des Invalides), "ancien monument" per frwiki, no longer standing
- Fontaine de l'Avril (Q3076179): modelled (src/render/landmarks/paris/monuments/minor/fontaine-avril.ts `fontaineAvril`, public/landmarks/paris/monuments.json "Fontaine de l'Avril"; claims OSM way 262367200; Modly pieces: avril-fillette, published)
- mausolée de Gaspard Monge (Q5526576): modelled (src/render/landmarks/paris/monuments/minor/tombe-gaspard-monge.ts, public/landmarks/paris/monuments.json; Modly pieces: tombe-monge-buste, published)
- Fontaine-labyrinthe (Q635634): modelled (src/render/landmarks/paris/monuments/minor/fontaine-labyrinthe.ts `fontaineLabyrinthe`, public/landmarks/paris/monuments.json "Fontaine-labyrinthe (place des Fêtes)"; Marta Pan 1986, five eccentric granite rings, dry; Modly pieces: none, all structural)
- fontaine de la Porte Dorée (Q3076201): modelled (src/render/landmarks/paris/monuments/minor/fontaine-porte-doree.ts `fontainePorteDoree`, public/landmarks/paris/monuments.json "Fontaine de la Porte Dorée"; claims OSM way 130888780; Modly pieces: porte-doree-athena, published, placed via paris-statues.json; not in the img2glb pool (checked); cascade of 7 steps + top pool and column procedural, cheeks/column size guessed)
- fontaine Octave Gréard (Q2372689): modelled (src/render/landmarks/paris/monuments/minor/fontaine-octave-greard.ts `fontaineOctaveGreard`, public/landmarks/paris/monuments.json "Monument à Octave Gréard"; Modly pieces: greard-buste, published; the relief stays procedural; placed on OSM node n9426205207, 6 m from Wikidata's point)
- Trocadéro (major-sculpture pass): parvis figures moved to OSM's spots and drawn by the statue pool, Varsovie river-end pylons replaced by the carved groups, Hercule and Taureau et daim added (src/render/landmarks/paris/trocadero-parvis.ts, monuments/fontaine-varsovie.ts, public/landmarks/paris-statues.json, data/statues/paris-img2glb-overrides.json; Modly pieces: trocadero-jeunesse, trocadero-drapee, trocadero-nue, trocadero-hercule, trocadero-taureau, trocadero-jeunesse-poisson)
- fontaine aux lions (Jardin des plantes de Paris) (Q137838758): modelled (src/render/landmarks/paris/monuments/minor/fontaine-lions-jardin-plantes.ts `fontaineLionsJardinPlantes`, public/landmarks/paris/monuments.json "Fontaine aux lions du Jardin des plantes"; claims OSM way 97183056; Modly pieces: jdp-lion, published, placed 2x via paris-statues.json jdp-lions-west/-east)
- fontaine de la rue Cherche-Midi (Q16928450): skipped: it is the Fontaine de Neptune, a small (~2.5 m) out-of-service wall niche with a Neptune statue in the enclosed courtyard of 86 rue du Cherche-Midi (ancienne cour des Vieilles-Tuileries), surrounded by buildings and not visible from the street or ridable (Commons photos 'Fontaine Neptune 7eme', 'P1240800 ... n86 fontaine Neptune')
- fontaine du Pré-Saint-Gervais (Q3076279): modelled (src/render/landmarks/paris/monuments/minor/fontaine-pre-saint-gervais.ts `fontainePreSaintGervais`, public/landmarks/paris/monuments.json "Regard de la fontaine du Pré-Saint-Gervais"; it is the 1899-listed regard of the Prise des Eaux, OSM way 73248961, in Le Pré-Saint-Gervais at the east edge of the paris-centre box; Modly pieces: none)
- fontaine Pastorale (Q3076051): modelled (src/render/landmarks/paris/monuments/minor/fontaine-pastorale.ts `fontainePastorale`, public/landmarks/paris/monuments.json "Fontaine Pastorale"; Modly pieces: pastorale-group (the shepherd only), pastorale-girl, pastorale-sheep, all published; attach positions and bearings guessed, lowres shot shows only some figures)
- monument funéraire de La Fontaine (Q3323385): modelled (src/render/landmarks/paris/monuments/minor/tombe-la-fontaine-moliere.ts `tombeLaFontaineMoliere`, public/landmarks/paris/monuments.json "Tombes de La Fontaine et de Molière"; Q3323385 is actually Molière's tomb, La Fontaine's is Q3323381 at the same coordinates, so both sarcophagi are in one builder; Modly pieces: none, shallow bronze panel and plaque only)
- fontaine du jardin Villemin (Q3076294): modelled (src/render/landmarks/paris/monuments/minor/fontaine-jardin-villemin.ts `fontaineJardinVillemin`, public/landmarks/paris/monuments.json "Fontaine du jardin Villemin"; Modly pieces: villemin-fontaine, published)
- nymphée de Chatou (Q22923336): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -12528, z 3542): no streets or buildings are drawn there
- pyramide de Cassini (Q3411268): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x 2501, z -6906): no streets or buildings are drawn there
- monument Pershing - Lafayette (Q3323243): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -12938, z -5226): no streets or buildings are drawn there
- monument aux morts de Charenton-le-Pont (Q88324001): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x 6042, z -4348): no streets or buildings are drawn there
- monument du souvenir de Bagneux (Q109375782): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -1507, z -5722): no streets or buildings are drawn there
- mémorial de l'Escadrille La Fayette (Q3333144): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -11738, z -2658): no streets or buildings are drawn there
- mémorial du génocide arménien d'Issy-les-Moulineaux (Q20508662): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -5290, z -4606): no streets or buildings are drawn there
- statue du général Daumesnil (Q77894919): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x 7880, z -1532): no streets or buildings are drawn there
- logements d'Électricité de France (Q22980855): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x 5338, z -5106): no streets or buildings are drawn there
- pavillon Saint-Vigor (Q22924053): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -12045, z -6818): no streets or buildings are drawn there
- pavillon de musique (Q3373091): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -15306, z 901): no streets or buildings are drawn there
- pavillon de musique de la comtesse de Provence (Q3373094): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -12832, z -6716): no streets or buildings are drawn there
- pavillons d'octroi (Q22924036): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -13108, z -6906): no streets or buildings are drawn there
- dolmen de Ker-Han (Q30739575): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -6814, z -5126): no streets or buildings are drawn there
- mausolée du Prince Impérial (Q3301853): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -12106, z 990): no streets or buildings are drawn there
- Les Poings d'eau (Q3234796): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x 5802, z -996): no streets or buildings are drawn there
- La Grande Fontaine (Q23638021): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x 2806, z 4214): no streets or buildings are drawn there
- mémorial de la France combattante (Q3333148): skipped: outside the modelled city (paris-centre detail box x −8355…5715, z −4510…4175, and its detail regions; this is at x -8658, z 1234): no streets or buildings are drawn there
- monument aux victimes non reconnues de l'incendie du Bazar de la Charité (Q29650332): modelled (minor/monument-bazar-charite.ts, monuments.json; Modly pieces: none)
- fontaine de la place François-Ier (Q3076214): modelled (src/render/landmarks/paris/monuments/minor/fontaine-place-francois-ier.ts `fontainePlaceFrancoisIer`, public/landmarks/paris/monuments.json "Fontaine de la place François-Ier"; claims OSM way 553172931; Modly pieces: francois-ier-fut, francois-ier-griffon, both published, placed via paris-statues.json, griffon 4x)
- monument aux victimes de l'Opéra-Comique (Q15156006): modelled (minor/monument-victimes-opera-comique.ts, monuments.json; Modly pieces: none, plain stepped grave with inscribed stele)
- Q31885098 (unlabelled sepulchral monument): skipped: Wikidata places it in the Chapelle de la Sorbonne (P276 Q2957340; creator Q712497, apparently Girardon's tomb of Richelieu), indoors
- fontaine du square Tolstoï (Q3076299): modelled (src/render/landmarks/paris/monuments/minor/fontaine-square-tolstoi.ts `fontaineSquareTolstoi`, public/landmarks/paris/monuments.json "Fontaine du square Tolstoï"; three nested hexagonal basins, sizes by eye; placed on OSM node 6943355178; Modly pieces: tolstoi-femme-enfant, published, placed via paris-statues.json)
- monument aux morts pour la France en Afrique du Nord de 1952 à 1962 (Q96091551): modelled (minor/monument-morts-afrique-du-nord.ts `monumentMortsAfriqueDuNord`, monuments.json "Monument aux morts pour la France en Afrique du Nord (Père-Lachaise)"; Modly pieces: none, paved court, two-tier panel wall, wings and inscribed stele all procedural; sizes and facing by eye)
- fontaine des arts et métiers (Q3076248): modelled (src/render/landmarks/paris/monuments/minor/fontaine-arts-metiers.ts `fontaineArtsMetiers`, public/landmarks/paris/monuments.json "Fontaine des Arts-et-Métiers"; both basins, OSM water ways 30612728/9 claimed; Modly pieces: arts-metiers-agriculture, arts-metiers-travail, (+ arts-metiers-euterpe), all published; Mercure is a STAND-IN: the Travail model reused, three Modly attempts at Mercure failed)
- monument aux morts pour la France en opérations extérieures (Q74555507): modelled (minor/monument-opex.ts `monumentOpex`, monuments.json; claims OSM way 672001632; plaza, ring wall with name rows, flagpole procedural, sizes by eye; Modly pieces: opex-soldats, published, one model of the six-figure group)
- monument aux victimes de Juin (Q15156018): modelled (minor/monument-victimes-juin.ts `monumentVictimesJuin`, monuments.json "Monument aux victimes de Juin (Père-Lachaise)"; no OSM way; Modly pieces: none, the relief is shallow)
- Monument aux Volontaires américains (Q19945167): modelled (minor/monument-volontaires-americains.ts `monumentVolontairesAmericains`, monuments.json; claims OSM way 79657347; Modly pieces: volontaires-soldat, volontaires-groupe, both published, placed via paris-statues.json)
- jardin mémorial des enfants du Vél' d'hiv' (Q39075133): modelled (minor/memorial-vel-d-hiv.ts `jardinMemorialVelDHiv`, monuments.json "Jardin mémorial des enfants du Vél' d'Hiv'"; Modly pieces: none; gravel court, concave limestone name wall, steel street screen, trellis, stone blocks; plan from OSM)
- monument de la rafle du Vél' d'Hiv' (Walter Spitzer, 1994; not a list row, 100 m west of the garden; same file `monumentVelDHiv`, monuments.json "Monument de la rafle du Vél' d'Hiv' (Spitzer)"): modelled (steps, pedestal, concave slab; Modly pieces: vel-dhiv-spitzer-groupe, published, placed via paris-statues.json)
- monument de l'Assistance publique (Q15155995): modelled (minor/monument-assistance-publique.ts `monumentAssistancePublique`, monuments.json "Monument de l'Assistance publique (Père-Lachaise)"; no OSM way; stele, pillar, palm pylons, name panels and bronze wreath ring procedural, shallow relief; Modly pieces: none)
- monument des travailleurs municipaux (Q15156042): modelled (minor/monument-travailleurs-municipaux.ts `monumentTravailleursMunicipaux`, monuments.json "Monument aux travailleurs municipaux (Père-Lachaise)"; no OSM way; obelisk, pedestal, door base, piers and curved wall procedural; Modly pieces: travailleurs-figure, published, in paris-statues.json)
- monument funéraire de Dantan (Q3323375): modelled (minor/tombe-dantan.ts `tombeDantan`, monuments.json "Monument funéraire de Dantan (Père-Lachaise)"; no OSM way; slab, plinth, ledge, stele with medallions, cornice, attic procedural, corner figures stand-in blocks; Modly pieces: dantan-pleureuse-g, published, placed twice (right mourner reuses it; dantan-pleureuse-d failed twice and was rejected))
- monument à la mémoire des défenseurs de Belfort 1870-1871 (Q94997851): modelled (minor/monument-defenseurs-belfort.ts `monumentDefenseursBelfort`, monuments.json "Monument aux défenseurs de Belfort 1870-1871 (Père-Lachaise)"; no OSM way; Modly pieces: belfort-figure, belfort-buste, both published)
- monument à la mission Marchand (Q3323421): modelled (minor/monument-mission-marchand.ts `monumentMissionMarchand`, monuments.json "Monument à la mission Marchand"; claims OSM memorial way 62819232; stepped base, wall, cornice, map panel, bronze shield with inscription procedural; the 12-figure relief frieze is blocky procedural stand-in because Commons has no photo of it (only the shield end); Modly pieces: none)
- monument aux soldats tchécoslovaques (Q96035892): modelled (minor/monument-soldats-tchecoslovaques.ts, monuments.json; Modly pieces: monument-soldats-tchecoslovaques-groupe, published)
- monument funéraire de Legru et Lhenoret (Q3323384): modelled (minor/tombe-legru-lhenoret.ts `tombeLegruLhenoret`, monuments.json "Monument funéraire de Legru et Lhenoret (Père-Lachaise)"; no OSM way; Modly pieces: legru-femme-gauche (trellis2), legru-femme-droite, both published, placed via paris-statues.json; plinth, drums, stele, slab, chain procedural; sizes and facing by eye)
- monument à la mémoire des soldats morts pendant le siège de Paris de 1870-1871 (Q94696967): modelled (minor/monument-siege-paris-1870.ts `monumentSiegeParis1870`, monuments.json "Monument aux soldats morts pendant le siège de Paris 1870-1871 (Père-Lachaise)"; no OSM way; Modly pieces: none, all relief is shallow; Wikidata's label is the Buzenval 1877 memorial; sizes and facing by eye)
- mémorial des victimes de la catastrophe aérienne du vol Air France 447 (Q96106655): modelled (minor/memorial-af447.ts `memorialAf447`, monuments.json "Mémorial du vol Air France 447 (Père-Lachaise)"; no OSM way; Modly pieces: none, no sculpture)
- Pavillon du Roi (Q107980596): already modelled as part of the Palais du Louvre (public/landmarks/paris.json "Palais du Louvre"; the pavilion of the Cour Carrée's south wing at this point; the place des Vosges' Pavillon du Roi is in place-vosges-plan.ts)
- Tombeau du maréchal Foch (Q138551188): skipped: inside the Dôme des Invalides (Landowski's tomb in a side chapel), indoors
- mémorial des victimes de la catastrophe aérienne de Charm el-Cheikh (Q96099792): modelled (minor/memorial-charm-el-cheikh.ts `memorialCharmElCheikh`, monuments.json "Mémorial des victimes des catastrophes aériennes (Père-Lachaise, div. 77)"; it is the Vol 708 West Caribbean stele of division 77; all procedural; Modly pieces: none; facing direction guessed)
- stèle à la mémoire des victimes du génocide des Tutsi au Rwanda (Q96080492): modelled (minor/stele-genocide-tutsi.ts `steleGenocideTutsi`, monuments.json "Stèle du génocide des Tutsi au Rwanda (Père-Lachaise)"; division 88, no OSM way; pale arched-top stele with capped shoulders and tan plaque, all procedural; Modly pieces: none; sizes estimated, facing guessed)
- tombe de l'abbé Delille (Q3323390): modelled (minor/tombe-abbe-delille.ts `tombeAbbeDelille`, monuments.json "Tombe de l'abbé Delille (Père-Lachaise)"; claims OSM way 1210797358; plain gabled stone tomb house in a railed plot on a kerb, all procedural; Modly pieces: none; sizes estimated, facing guessed)
