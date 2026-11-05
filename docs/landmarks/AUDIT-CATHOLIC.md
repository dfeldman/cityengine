# Catholic churches and related buildings — Paris audit

Source: OSM ile-de-france pbf, box 48.79–48.91 N, 2.20–2.42 E: amenity=place_of_worship/monastery, building=church/chapel/cathedral/basilica/presbytery/monastery, historic=church/chapel/monastery/abbey. Kept: denomination containing "catholic" (incl. greek_catholic, liberal_catholic), plus untagged-denomination church/chapel/convent buildings (Denom. "?", almost all Catholic in Paris but check). Dropped: Protestant denominations (AUDIT-PROTESTANT.md), Orthodox/Apostolic/Coptic and other religions (AUDIT-WORSHIP.md), Notre-Dame de Paris (done). Points take the area of their containing building; duplicates <40 m merged. Status: **custom** = bespoke builder, **general** = parisCivic kit, **nothing** — matched by OSM id or by the entry's lat/lon falling in the footprint / within 30 m. m² is the OSM area — for convents it is often the whole walled compound, not the chapel. Script: tools/catholic-audit.py. Rows outside the bake's DETAIL box (tools/cities.ts: lat 48.8197–48.8983, lon 2.2180–2.4100) are dropped (92 of them: suburbs, and Versailles which is a detail region only along the ride).

Cross-checked by position (<40 m) against AUDIT-PROTESTANT.md and AUDIT-WORSHIP.md. Removed as theirs: #218 and #341 (Protestant churches in Clamart), #269 (Paroisse de Plaisance), #249 (Centre Hatikva, Vincennes). Shared, left to resolve: #294 Notre-Dame des Pauvres (next to “Les portes de la paix”), #314 Notre-Dame-Auxiliatrice de Clichy (also hosts a Romanian Orthodox parish). Eastern Catholic, kept in scope: #305 (Russian Greek-Catholic), #198 (Maronite).

Note: PARIS-WORSHIP.md marks several of these “model” by loose name match (e.g. Notre-Dame-de-la-Croix); no landmark entry exists for them — this audit's status is the one to trust.

| # | Name | Denom. | m² | Lat,lon | OSM | Status (file) | Wikipedia (fr; distance = matched by position) |
|---|---|---|---|---|---|---|---|
| 1 | Congrégation des Augustines du Saint-Cœur de Marie | ? | 25316 | 48.8360,2.3428 | way/548087855 way/1448049765 | nothing |  |
| 2 | Monastère de la Visitation | catholic | 21636 | 48.8386,2.3351 | way/87334027 | nothing | Monastère de la Visitation de l'avenue Denfert-Rochereau (51m) |
| 3 | Chapelle Saint-Bernard | catholic | 15931 | 48.8409,2.3211 | way/410503747 way/80292544 | nothing | Chapelle Saint-Bernard-de-Montparnasse (8m) |
| 4 | Monastère de la Visitation | catholic | 15768 | 48.8353,2.3388 | way/87334025 | nothing | fr:Sœurs de Saint-Joseph de Cluny |
| 5 | Couvent des Chanoinesses de Picpus | ? | 14579 | 48.8442,2.3984 | way/1567482841 way/78006860 | nothing |  |
| 6 | Religieuses de l’Assomption | roman_catholic | 12191 | 48.8529,2.2734 | way/173655240 way/84198252 | general (civic.json) |  |
| 7 | Sœurs de Saint-Vincent-de-Paul | ? | 11860 | 48.8512,2.3219 | way/219379001 | nothing |  |
| 8 | Prieuré Sainte-Bathilde | roman_catholic | 8711 | 48.8220,2.2829 | way/1409766410 relation/1305902 | nothing | Prieuré Sainte-Bathilde de Vanves (53m) |
| 9 | Petites Sœurs de l'Agneau | ? | 7275 | 48.8464,2.3221 | way/173657215 way/64314828 | nothing |  |
| 10 | Abbaye Sainte-Geneviève de Paris | ? | 6927 | 48.8460,2.3475 | relation/721757 node/3041928034 | nothing | fr:Abbaye Sainte-Geneviève de Paris |
| 12 | Église Saint-Sulpice | roman_catholic | 6040 | 48.8512,2.3340 | way/16077204 way/16077204 | custom (monuments.json) | fr:Église Saint-Sulpice de Paris |
| 13 | Panthéon | catholic | 5909 | 48.8465,2.3454 | way/16407465 way/16407465 | custom (monuments.json) | fr:Panthéon (Paris) |
| 14 | Noviciat des Dominicains | ? | 5781 | 48.8562,2.3285 | relation/1002118 | nothing | fr:Noviciat des Dominicains |
| 15 | Église de la Madeleine | catholic | 5520 | 48.8699,2.3243 | way/54180046 | custom (paris.json) | fr:Église de la Madeleine |
| 16 | Église Saint-Eustache | catholic | 4177 | 48.8635,2.3452 | way/53762963 | custom (monuments.json) | fr:Église Saint-Eustache de Paris |
| 17 | Carmel de Montmartre | catholic | 3880 | 48.8876,2.3428 | way/556130784 relation/1070132 | nothing | fr:Carmel de Montmartre |
| 18 | Basilique du Sacré-Cœur | catholic | 3788 | 48.8865,2.3428 | way/23762981 way/23762981 | custom (monuments.json) | fr:Basilique du Sacré-Cœur de Montmartre |
| 19 | Église Saint-Roch | catholic | 3756 | 48.8650,2.3321 | way/42722202 way/42722202 | custom (monuments.json) | fr:Église Saint-Roch (Paris) |
| 20 | Abbaye de Port-Royal | ? | 3513 | 48.8386,2.3386 | relation/3732320 node/1015543378 | custom (batch1.json) | fr:Abbaye de Port-Royal de Paris |
| 21 | Saint Jean de Dieu | catholic | 3511 | 48.8394,2.2943 | way/1057104817 way/105535530 | nothing | Chapelle des Frères hospitaliers de Saint-Jean-de-Dieu de Paris (16m) |
| 22 | Chapelle de l'Agneau de Dieu | catholic | 3455 | 48.8446,2.3775 | node/428049815 way/78158526 | nothing |  |
| 23 | Chapelle Sainte-Marie | catholic | 3221 | 48.8853,2.2811 | node/2608271092 way/81248181 | general (civic.json) |  |
| 24 | Église du Dôme | roman_catholic | 3074 | 48.8551,2.3125 | way/112452790 way/64955027 | custom (paris.json) | fr:Cathédrale Saint-Louis-des-Invalides |
| 25 | Église Saint-Pierre du Gros Caillou | catholic | 3031 | 48.8604,2.3047 | way/69072238 way/69072238 | general (civic.json) | fr:Église Saint-Pierre-du-Gros-Caillou |
| 26 | Église Notre-Dame-de-la-Croix | catholic | 3017 | 48.8685,2.3869 | way/70001850 way/70001850 | custom (catholic.json) | fr:Église Notre-Dame-de-la-Croix de Ménilmontant |
| 27 | Église Saint-Nicolas-des-Champs | catholic | 2970 | 48.8654,2.3545 | way/56290843 | custom (monuments.json) | fr:Église Saint-Nicolas-des-Champs |
| 28 | Chapelle Saint-Louis de la Salpêtrière | catholic | 2947 | 48.8391,2.3638 | way/78535716 way/78535716 way/377136997 | custom (monuments.json) | Chapelle Saint-Louis de la Salpêtrière (36m) |
| 29 | Église de la Sainte-Trinité | catholic | 2873 | 48.8775,2.3311 | way/49872150 way/49872150 | custom (monuments.json) | fr:Église de la Sainte-Trinité de Paris |
| 30 | Église Saint-Germain l'Auxerrois | catholic | 2860 | 48.8595,2.3413 | way/53770908 | custom (monuments.json) | fr:Église Saint-Germain-l'Auxerrois (Paris) |
| 31 | Chapelle Saint-Joseph-de-Cluny | catholic | 2823 | 48.8352,2.3382 | way/137884625 way/79611341 | nothing | Chapelle Saint-Joseph-de-Cluny (17m) |
| 32 | Église Saint-Vincent-de-Paul | catholic | 2807 | 48.8791,2.3520 | way/63197162 | custom (monuments.json) | fr:Église Saint-Vincent-de-Paul de Paris |
| 33 | Église Saint-Gervais | catholic | 2753 | 48.8555,2.3546 | way/55477164 | custom (paris.json) | fr:Église Saint-Gervais-Saint-Protais de Paris |
| 34 | Église Saint-François-Xavier | catholic | 2677 | 48.8505,2.3129 | way/68893289 way/68893289 | custom (monuments.json) | fr:Église Saint-François-Xavier (Paris) |
| 35 | Couvent des Dominicains | catholic | 2660 | 48.8761,2.3037 | way/281767628 way/68991281 way/68991281 | general (civic.json) |  |
| 36 | Église Saint-Germain des Prés | catholic | 2639 | 48.8541,2.3338 | way/62287173 way/62287173 way/495635817 | custom (monuments.json) | fr:Abbaye de Saint-Germain-des-Prés |
| 37 | Basilique Sainte-Clotilde | catholic | 2557 | 48.8583,2.3192 | way/64952290 | custom (monuments.json) | fr:Basilique Sainte-Clotilde de Paris |
| 38 | Église Saint-Augustin | catholic | 2545 | 48.8759,2.3192 | way/67501490 way/67501490 | custom (monuments.json) | fr:Église Saint-Augustin (Paris) |
| 39 | Église du Val-de-Grâce | catholic | 2545 | 48.8405,2.3420 | way/59846865 | custom (monuments.json) | fr:Église Notre-Dame du Val-de-Grâce |
| 40 | Couvent Saint-François d'Assise | catholic | 2543 | 48.8261,2.3301 | way/37642473 way/112263440 | nothing | Couvent Saint-François de Paris (19m) |
| 41 | Église Saint-Ambroise | catholic | 2504 | 48.8613,2.3765 | way/63638108 way/63638108 way/63643779 | custom (monuments.json) | fr:Église Saint-Ambroise (Paris) |
| 42 | Église Saint-Joseph des nations | catholic | 2338 | 48.8690,2.3735 | relation/1589962 | custom (catholic.json) | fr:Église Saint-Joseph-des-Nations |
| 43 | Église Saint-Laurent | roman_catholic | 2284 | 48.8748,2.3583 | way/63200612 | custom (monuments.json) | fr:Église Saint-Laurent (Paris) |
| 44 | Église Saint-Benoît | catholic | 2239 | 48.8290,2.2812 | way/184156452 way/53655954 | general (civic.json) | fr:Église Saint-Benoît d'Issy-les-Moulineaux |
| 45 | Église du Bon Pasteur | catholic | 2197 | 48.8565,2.3921 | way/145591022 way/63640471 | nothing | Église du Bon-Pasteur de Paris (11m) |
| 46 | (unnamed) | ? | 2194 | 48.8737,2.3230 | relation/1068013 way/67557301 | custom (monuments.json) | fr:Chapelle expiatoire |
| 47 | Église Saint-Jean des Deux Moulins | catholic | 2192 | 48.8308,2.3605 | way/962298895 way/79083142 | custom (catholic.json) | Église Saint-Jean-des-Deux-Moulins (28m) |
| 48 | Église Saint-Pierre de Montrouge | catholic | 2185 | 48.8288,2.3271 | way/16929093 | general (civic.json) | fr:Église Saint-Pierre de Montrouge |
| 49 | Église du Saint-Esprit | catholic | 2174 | 48.8380,2.3976 | way/130906379 | general (civic.json) | fr:Église du Saint-Esprit de Paris |
| 50 | Église Saint-Pierre de Chaillot | catholic | 2125 | 48.8677,2.2985 | way/79276832 | general (civic.json) | fr:Église Saint-Pierre-de-Chaillot |
| 52 | Église Notre-Dame des Champs | catholic | 2100 | 48.8435,2.3271 | way/64121803 | custom (catholic.json) | fr:Église Notre-Dame-des-Champs de Paris |
| 53 | Maison des prêtres de Saint-Sulpice | ? | 2093 | 48.8488,2.3262 | way/1213662289 | nothing |  |
| 54 | (unnamed) | catholic | 2076 | 48.8869,2.2774 | node/3080110540 way/81203728 node/3080122533 | nothing |  |
| 55 | Église Saint-Étienne-du-Mont | catholic | 2037 | 48.8466,2.3476 | way/55343672 way/55343672 | custom (monuments.json) | fr:Église Saint-Étienne-du-Mont |
| 56 | Église Saint-Merri | catholic | 2025 | 48.8592,2.3509 | way/55742120 way/55742120 | custom (paris.json) | fr:Église Saint-Merri |
| 57 | Église Notre-Dame de Clignancourt | catholic | 1992 | 48.8928,2.3448 | way/36855293 way/36855293 | custom (civic.json) | fr:Église Notre-Dame de Clignancourt |
| 58 | Église Saint-Pierre | catholic | 1981 | 48.8843,2.2713 | way/62090852 | general (civic.json) | Église Saint-Pierre de Neuilly-sur-Seine (26m) |
| 59 | Église Notre-Dame-de-Lorette | catholic | 1931 | 48.8762,2.3387 | way/25688622 way/25688622 | custom (monuments.json) | fr:Église Notre-Dame-de-Lorette (Paris) |
| 61 | Église Sainte-Anne de la Butte-aux-Cailles | catholic | 1900 | 48.8261,2.3501 | way/78470232 | general (civic.json) | fr:Église Sainte-Anne de la Butte-aux-Cailles |
| 62 | Église Saint-Michel des Batignolles | catholic | 1848 | 48.8890,2.3247 | way/75748771 | general (civic.json) | fr:Église Saint-Michel des Batignolles |
| 63 | Sœurs du Bon Secours | catholic | 1838 | 48.8462,2.3270 | way/64302354 way/64302354 way/1057101878 | nothing |  |
| 64 | Église Saint-Séverin | catholic | 1814 | 48.8521,2.3456 | way/19740659 | custom (monuments.json) | fr:Église Saint-Séverin |
| 65 | (unnamed) | catholic | 1809 | 48.8414,2.2568 | way/366321119 way/87954443 | nothing |  |
| 66 | Église Notre-Dame-du-Travail | ? | 1806 | 48.8361,2.3167 | way/79687825 way/79687825 | custom (catholic.json) | fr:Église Notre-Dame-du-Travail (Paris) |
| 67 | Cathédrale Saint-Louis des Invalides | catholic | 1781 | 48.8555,2.3126 | way/64955027 | custom (palaces.json) | fr:Cathédrale Saint-Louis-des-Invalides |
| 68 | Église Saint-Jacques-du-Haut-Pas | catholic | 1774 | 48.8436,2.3412 | way/60279510 way/1457837352 | custom (catholic.json) | fr:Église Saint-Jacques-du-Haut-Pas |
| 69 | Église Saint-Philippe du Roule | catholic | 1772 | 48.8735,2.3104 | way/68831257 way/68831257 way/68831265 | general (civic.json) | fr:Église Saint-Philippe-du-Roule |
| 70 | Église Saint-Ferdinand des Ternes | catholic | 1761 | 48.8789,2.2906 | way/84325824 way/84325824 | general (civic.json) | fr:Église Saint-Ferdinand-des-Ternes |
| 71 | Église Saint-Médard | catholic | 1740 | 48.8399,2.3500 | way/24406636 way/24406636 | general (civic.json) | fr:Église Saint-Médard (Paris) |
| 72 | Église Saint-Nicolas du Chardonnet | roman_catholic | 1730 | 48.8491,2.3503 | way/43877261 way/55501040 | general (civic.json) | fr:Église Saint-Nicolas-du-Chardonnet |
| 73 | Église Saint-Louis-d'Antin | catholic | 1716 | 48.8744,2.3279 | way/69226577 way/69226711 | custom (civic.json) | fr:Église Saint-Louis-d'Antin |
| 74 | Basilique Sainte-Jeanne-d’Arc | catholic | 1707 | 48.8916,2.3603 | way/112358505 way/84153309 | general (civic.json) | fr:Basilique Sainte-Jeanne-d'Arc de Paris |
| 75 | Saint-Joseph du Parchamp | catholic | 1692 | 48.8469,2.2376 | way/72055903 way/398058959 | general (civic.json) |  |
| 76 | Église Sainte-Jeanne-de-Chantal | catholic | 1679 | 48.8388,2.2562 | way/87959071 | custom (catholic.json) | Église Sainte-Jeanne-de-Chantal de Paris (12m) |
| 77 | Église Notre-Dame-de-Lourdes | catholic | 1678 | 48.8707,2.3995 | way/112461793 way/70001481 | nothing | Église Notre-Dame-de-Lourdes de Paris (5m) |
| 78 | Église Sainte-Marguerite | catholic | 1675 | 48.8529,2.3813 | way/115804138 way/115804163 | general (civic.json) | fr:Église Sainte-Marguerite (Paris) |
| 79 | Église Saint-Louis-en-l'Île | catholic | 1663 | 48.8513,2.3575 | way/55314295 | custom (paris.json) | fr:Église Saint-Louis-en-l'Île |
| 81 | Basilique Notre-Dame du Perpétuel Secours | catholic | 1628 | 48.8617,2.3868 | way/63640725 way/63638905 | general (civic.json) | fr:Basilique Notre-Dame-du-Perpétuel-Secours |
| 82 | Église Saint-Jean-Baptiste de Belleville | catholic | 1611 | 48.8756,2.3893 | way/63212231 | custom (catholic.json) | fr:Église Saint-Jean-Baptiste de Belleville |
| 83 | Chapelle | catholic | 1594 | 48.8827,2.3394 | way/164853780 way/164853781 | general (civic.json) |  |
| 84 | Église Saint-Léon | catholic | 1588 | 48.8510,2.2962 | way/15912913 way/15912913 | general (civic.json) | Église Saint-Léon de Paris (26m) |
| 85 | Église Saint-Bernard-de-La-Chapelle | catholic | 1577 | 48.8861,2.3554 | way/78005074 way/78005074 | general (civic.json) | fr:Église Saint-Bernard de la Chapelle |
| 86 | Église Saint-François-de-Sales (ancienne église) | catholic | 1540 | 48.8847,2.3050 | way/84317434 way/84326196 | general (civic.json) | Ancienne église Saint-François-de-Sales de Paris (24m) |
| 87 | Église Saint-Denis du Saint-Sacrement | catholic | 1539 | 48.8600,2.3650 | way/58150045 | custom (paris.json) | fr:Église Saint-Denys-du-Saint-Sacrement |
| 88 | Église nouvelle Saint-Honoré d'Eylau | catholic | 1524 | 48.8686,2.2866 | way/112237139 way/112237139 | custom (catholic.json) | fr:Église Saint-Honoré-d'Eylau (église nouvelle) |
| 89 | Ancienne Église Saint-Martin des Champs | catholic | 1507 | 48.8661,2.3552 | way/56301534 way/56301534 | custom (museums.json) | fr:Prieuré Saint-Martin-des-Champs |
| 90 | Église Saint-Paul-Saint-Louis | catholic | 1495 | 48.8547,2.3615 | way/56046786 | custom (paris.json) | fr:Église Saint-Paul-Saint-Louis |
| 91 | Église Sainte-Odile | catholic | 1486 | 48.8870,2.2930 | way/84324632 | general (civic.json) | fr:Église Sainte-Odile (Paris) |
| 92 | Chapelle Notre-Dame de Sainte-Croix | catholic | 1478 | 48.8826,2.2808 | node/2605056283 way/875238765 | general (civic.json) |  |
| 93 | Église de Saint-Antoine de Padoue | catholic | 1471 | 48.8298,2.2944 | way/80144693 | general (civic.json) | Église Saint-Antoine-de-Padoue de Paris (5m) |
| 95 | Église Saint-Thomas d'Aquin | catholic | 1435 | 48.8567,2.3277 | way/63536576 way/63536576 | custom (catholic.json) | fr:Église Saint-Thomas-d'Aquin de Paris |
| 96 | Basilique Notre-Dame-des-Victoires | catholic | 1424 | 48.8668,2.3409 | way/54661742 | general (civic.json) | fr:Basilique Notre-Dame-des-Victoires de Paris |
| 97 | Église de l'Immaculée-Conception | catholic | 1416 | 48.8316,2.2481 | relation/3926538 | custom (catholic.json) | Église de l'Immaculée-Conception de Boulogne-Billancourt (9m) |
| 98 | Église Saint-Jean-Baptiste de Grenelle | catholic | 1408 | 48.8432,2.2926 | way/23811420 | general (civic.json) | fr:Église Saint-Jean-Baptiste de Grenelle |
| 100 | Église Saint-Eugène Sainte-Cécile | catholic | 1396 | 48.8733,2.3471 | way/50371917 way/69221062 | general (civic.json) | fr:Église Saint-Eugène-Sainte-Cécile |
| 101 | Chapelle du Sacré-Cœur | catholic | 1390 | 48.8827,2.2441 | way/199708465 way/68851478 | general (civic.json) | Chapelle de l’Œuvre-du-Sacré-Cœur de Puteaux (15m) |
| 102 | Église Notre-Dame-de-Bonne-Nouvelle | catholic | 1361 | 48.8695,2.3500 | way/55178129 way/55178115 | general (civic.json) | fr:Église Notre-Dame-de-Bonne-Nouvelle de Paris |
| 103 | Église Notre-Dame de la Gare | catholic | 1353 | 48.8298,2.3683 | way/79084116 | custom (catholic.json) | fr:Église Notre-Dame de la Gare (Paris) |
| 104 | Chapelle Saint-Martin de Porrès | catholic | 1347 | 48.8870,2.2870 | node/2516318631 way/112358518 | nothing | Chapelle Saint-Martin-de-Porrès de Paris (0m) |
| 105 | Maison Ozanam | catholic | 1337 | 48.8917,2.3167 | node/9439245513 way/426157110 | nothing |  |
| 106 | Église du Cœur-Immaculé-de-Marie | catholic | 1337 | 48.8717,2.2277 | way/132043603 | general (civic.json) | fr:Église du Cœur-Immaculé-de-Marie de Suresnes |
| 107 | Église Notre-Dame de Grâce de Passy | catholic | 1331 | 48.8566,2.2803 | way/83830759 way/104904040 way/104904040 | general (civic.json) | fr:Église Notre-Dame-de-Grâce-de-Passy |
| 108 | Église Saint-Antoine des Quinze-Vingts | catholic | 1323 | 48.8488,2.3737 | way/94236417 | custom (catholic.json) | Église Saint-Antoine-des-Quinze-Vingts (33m) |
| 109 | Chapelle Sainte-Ursule | catholic | 1310 | 48.8484,2.3432 | way/95860808 | custom (museums.json) | fr:Chapelle de la Sorbonne |
| 110 | Église Notre-Dame d'Auteuil | catholic | 1304 | 48.8471,2.2696 | way/85615121 | general (civic.json) | fr:Église Notre-Dame-d'Auteuil |
| 111 | Église Saint-Justin | catholic | 1304 | 48.8944,2.2899 | way/62089113 | general (civic.json) | Église Saint-Justin de Levallois-Perret (8m) |
| 112 | Église Saint-Éloi | catholic | 1301 | 48.8448,2.3887 | way/78019585 way/78018988 way/78018988 | general (civic.json) | fr:Église Saint-Éloi (Paris) |
| 113 | Église Saint-Jean-Baptiste-de-La-Salle | catholic | 1300 | 48.8413,2.3124 | way/80266257 way/80265859 | general (civic.json) | fr:Église Saint-Jean-Baptiste-de-La-Salle |
| 114 | Fraternités Monastiques de Jérusalem | catholic | 1297 | 48.8552,2.3571 | node/5295293307 way/55626689 | nothing |  |
| 116 | Église Saint-Georges de la Villette | catholic | 1273 | 48.8794,2.3747 | way/63239488 | general (civic.json) | Église Saint-Georges de la Villette (8m) |
| 117 | Église Saint-Dominique | catholic | 1273 | 48.8321,2.3351 | way/79626601 way/79626680 | general (civic.json) | fr:Église Saint-Dominique (Paris) |
| 118 | Église Sainte-Thérèse | catholic | 1271 | 48.8373,2.2339 | way/73019064 | general (civic.json) | Église Sainte-Thérèse-de-l'Enfant-Jésus de Boulogne-Billancourt (10m) |
| 119 | Église Saint-Christophe de Javel | catholic | 1266 | 48.8447,2.2792 | way/53400775 | general (civic.json) | fr:Église Saint-Christophe-de-Javel |
| 120 | Église Notre-Dame-du-Rosaire | catholic | 1263 | 48.8292,2.3079 | way/79717909 way/79719735 | general (civic.json) | fr:Église Notre-Dame-du-Rosaire (Paris) |
| 121 | Église Notre-Dame-de-l'Assomption de Passy | catholic | 1257 | 48.8556,2.2665 | way/83715715 | general (civic.json) | fr:Église Notre-Dame-de-l'Assomption-de-Passy |
| 122 | Église Saint-François-d'Assise | catholic | 1241 | 48.8803,2.3916 | way/63233916 | general (civic.json) | fr:Église Saint-François-d'Assise (Paris) |
| 124 | Église Saint-Gabriel | catholic | 1234 | 48.8488,2.4061 | way/70147593 way/70147593 | general (civic.json) | fr:Église Saint-Gabriel (Paris) |
| 125 | Église Saint-Clodoald | catholic | 1225 | 48.8434,2.2193 | way/132283371 | general (civic.json) | fr:Église Saint-Clodoald de Saint-Cloud |
| 126 | Église Notre-Dame-des-Blancs-Manteaux | catholic | 1217 | 48.8589,2.3577 | way/55984117 way/55848909 | custom (wall-fountains.json) | fr:Église Notre-Dame-des-Blancs-Manteaux |
| 127 | Église Saint-Jacques Saint-Christophe | catholic | 1214 | 48.8892,2.3794 | way/64037954 way/64037954 way/137692733 | general (civic.json) | fr:Église Saint-Jacques-Saint-Christophe de la Villette |
| 128 | Église Sainte-Hélène | catholic | 1213 | 48.8965,2.3423 | way/48974965 | general (civic.json) | Église Sainte-Hélène de Paris (14m) |
| 129 | Église Sainte-Marie-des-Batignolles | catholic | 1210 | 48.8868,2.3179 | way/75750389 | custom (catholic.json) | fr:Église Sainte-Marie des Batignolles |
| 130 | Église Saint-Hippolyte | catholic | 1195 | 48.8214,2.3632 | way/79084388 | general (civic.json) | fr:Église Saint-Hippolyte (Paris) |
| 131 | Cathédrale Sainte-Croix de Paris des Arméniens | catholic | 1194 | 48.8607,2.3601 | way/57403533 way/57403533 | general (civic.json) | fr:Cathédrale Sainte-Croix de Paris des Arméniens |
| 132 | Maison d'accueil Ephrem | catholic | 1191 | 48.8869,2.3435 | way/67699838 way/67699838 | custom (catholic.json) | Basilique du Sacré-Cœur de Montmartre (51m) |
| 133 | Église Notre-Dame-de-Fatima | catholic | 1184 | 48.8792,2.4026 | way/63233599 | general (civic.json) | fr:Église de Marie-Médiatrice-de-Toutes-les-Grâces |
| 134 | Église Saint-Ignace | catholic | 1171 | 48.8507,2.3260 | way/24310193 way/24310193 | general (civic.json) | Église Saint-Ignace de Paris (26m) |
| 135 | Église Saint-Joseph des Carmes | catholic | 1170 | 48.8487,2.3301 | way/63370983 way/63370983 | custom (batch2.json) | fr:Église Saint-Joseph-des-Carmes |
| 137 | Église Notre-Dame-Réconciliatrice | catholic | 1160 | 48.8338,2.3002 | way/80152077 way/304186825 way/80152025 | nothing | fr:Église Notre-Dame-de-la-Salette (Paris) |
| 138 | Église Sainte-Elisabeth | catholic | 1144 | 48.8661,2.3606 | way/56457505 | general (civic.json) | fr:Église Sainte-Élisabeth-de-Hongrie |
| 141 | Église Saint-Lambert de Vaugirard | catholic | 1142 | 48.8397,2.2980 | way/14349317 way/14349317 | general (civic.json) | fr:Église Saint-Lambert de Vaugirard |
| 142 | Église Saint-Joseph-Artisan | catholic | 1139 | 48.8814,2.3674 | way/63203063 way/63203063 | general (civic.json) | fr:Église Saint-Joseph-Artisan (Paris) |
| 143 | Salésiens de Don Bosco | catholic | 1129 | 48.8733,2.3869 | node/12097151763 way/70002699 | nothing |  |
| 144 | Église Saint-Jean-Baptiste | catholic | 1127 | 48.8847,2.2623 | way/81234177 | general (civic.json) | Église Saint-Jean-Baptiste de Neuilly-sur-Seine (7m) |
| 147 | Couvent Saint-Jacques | catholic | 1110 | 48.8332,2.3458 | way/559104799 | general (civic.json) | Couvent des Anglaises (51m) |
| 149 | Église Saint-Pierre de Montmartre | catholic | 1088 | 48.8867,2.3421 | way/23884336 | custom (monuments.json) | fr:Église Saint-Pierre de Montmartre |
| 152 | Église Saint-Joseph des Épinettes | catholic | 1052 | 48.8936,2.3205 | way/75747135 | general (civic.json) | fr:Église Saint-Joseph-des-Épinettes |
| 153 | Église Saint-Jean de Montmartre | catholic | 1048 | 48.8842,2.3379 | way/77807770 | custom (monuments.json) | fr:Église Saint-Jean de Montmartre |
| 154 | Église Saint-Honoré d'Eylau | catholic | 1041 | 48.8691,2.2844 | way/80853671 way/80853671 | general (civic.json) | fr:Église Saint-Honoré-d'Eylau (église ancienne) |
| 155 | Église Saint-Charles-de-Monceau | catholic | 1033 | 48.8827,2.3127 | way/84324974 way/84329729 | general (civic.json) | fr:Église Saint-Charles-de-Monceau |
| 156 | Église Sainte-Geneviève des Grandes-Carrières | catholic | 1030 | 48.8949,2.3340 | way/77670243 | general (civic.json) | Église Sainte-Geneviève des Grandes-Carrières (22m) |
| 157 | Notre-Dame sous Terre | roman_catholic | 1000 | 48.8457,2.3274 | node/3294531294 way/50376102 | nothing |  |
| 158 | Église Saints-Pierre-et-Paul | catholic | 994 | 48.8966,2.2574 | way/82322935 way/133432154 | general (civic.json) | fr:Église Saint-Pierre-Saint-Paul de Courbevoie |
| 159 | Chapelle de l'Institut Saint-Pie X | roman_catholic | 972 | 48.8507,2.3288 | node/2808787632 way/63381989 | nothing | Couvent des Bénédictines de Notre-Dame-de-Consolation (49m) |
| 160 | Église Saint-Marcel | catholic | 970 | 48.8375,2.3592 | way/78534351 way/78534214 | general (civic.json) | fr:Église Saint-Marcel de Paris |
| 161 | Église Saint-Jean-Bosco | catholic | 969 | 48.8553,2.3977 | way/70148329 way/70148329 | general (civic.json) | fr:Église Saint-Jean-Bosco (Paris) |
| 162 | Chapelle de Conflans | catholic | 967 | 48.8213,2.4053 | way/149268044 way/149268044 | custom (catholic.json) | Chapelle de Conflans (23m) |
| 164 | Église Saint-Leu - Saint-Gilles | catholic | 954 | 48.8629,2.3497 | way/53933240 way/53933240 relation/540557 | general (civic.json) | fr:Église Saint-Leu-Saint-Gilles (Paris) |
| 165 | Église Sainte-Mathilde | catholic | 954 | 48.8832,2.2369 | way/133432152 way/68851700 way/68851700 | general (civic.json) | Église Sainte-Mathilde de Puteaux (4m) |
| 166 | Chapelle Saint-André | catholic | 949 | 48.8459,2.3509 | node/3030132441 way/55597738 | general (civic.json) | Couvent des Filles-Anglaises (fossés Saint-Victor) (34m) |
| 167 | Église de l'Immaculée Conception | catholic | 946 | 48.8459,2.4034 | way/77385186 | general (civic.json) | fr:Église de l'Immaculée-Conception (Paris) |
| 171 | Grande Chapelle | catholic | 918 | 48.8255,2.2778 | way/184127778 way/184127778 way/114654286 | nothing |  |
| 172 | Église Notre-Dame-de-Nazareth | catholic | 915 | 48.8359,2.2842 | way/105535815 way/105535815 | general (civic.json) | Église Notre-Dame-de-Nazareth de Paris (37m) |
| 174 | (unnamed) | catholic | 903 | 48.8516,2.3622 | way/1056837790 way/261732187 | nothing |  |
| 176 | Église Saint-Martin des Champs | catholic | 900 | 48.8702,2.3630 | way/63201579 way/63201579 | general (civic.json) | fr:Église Saint-Martin-des-Champs (Paris) |
| 178 | Église Saint-Cyrille et Saint-Méthode | catholic | 890 | 48.8603,2.4046 | way/70152156 way/70152156 way/70147142 | general (civic.json) | fr:Église Saint-Germain de Charonne |
| 179 | Chapelle Ozanam | catholic | 875 | 48.8446,2.3253 | node/8369663675 way/50376094 | nothing |  |
| 180 | Chapelle Notre-Dame de la Salette | catholic | 871 | 48.8671,2.2182 | way/70966275 way/70958567 way/70958567 | general (civic.json) | Chapelle Notre-Dame-de-la-Salette de Suresnes (1m) |
| 182 | Basilique Notre-Dame de Boulogne | catholic | 858 | 48.8459,2.2365 | way/64304966 | general (civic.json) | fr:Basilique Notre-Dame de Boulogne |
| 185 | Église Saint-Albert le Grand | catholic | 836 | 48.8279,2.3419 | way/78469927 way/78469927 | general (civic.json) | Église Saint-Albert-le-Grand de Paris (14m) |
| 186 | Maison Saint-François-de-Sales | roman_catholic | 828 | 48.8260,2.2396 | way/287679339 way/287679339 | general (civic.json) | fr:Maison Saint-François-de-Sales |
| 187 | Chapelle Notre-Dame de Grâce | catholic | 824 | 48.8485,2.2911 | way/54118568 way/54118568 | general (civic.json) | Chapelle Notre-Dame-de-Grâce de Grenelle (35m) |
| 190 | Immeuble de la Société théosophique | ? | 816 | 48.8585,2.3011 | way/69073401 | general (civic.json) | fr:Immeuble de la Société théosophique |
| 191 | Chapelle Saint-Joseph Artisan | roman_catholic | 814 | 48.8497,2.2222 | way/132284446 | general (civic.json) | Église Saint-Joseph-Artisan de Saint-Cloud (9m) |
| 192 | Crypte Notre-Dame des Champs | catholic | 803 | 48.8416,2.3399 | node/4579195553 way/60215199 | nothing | Couvent des Carmélites du faubourg Saint-Jacques (34m) |
| 193 | Église Notre-Dame des Foyers | catholic | 799 | 48.8869,2.3700 | way/64038747 way/64039306 | general (civic.json) | fr:Église Notre-Dame-des-Foyers |
| 194 | Église de la Sainte-Famille | catholic | 798 | 48.8860,2.4028 | way/73249060 | general (civic.json) | Église de la Sainte-Famille du Pré-Saint-Gervais (4m) |
| 195 | Église Notre-Dame-de-l'Assomption | catholic | 793 | 48.8674,2.3256 | way/54168792 | custom (catholic.json) | fr:Église Notre-Dame-de-l'Assomption (Paris) |
| 198 | Chapelle Saint-Sauveur | catholic | 784 | 48.8286,2.2781 | way/42268952 | custom (catholic.json) | Église Maronite Saints-Sauveur-et-Maroun d'Issy-les-Moulineaux (1m) |
| 199 | Église Notre-Dame d'Espérance | catholic | 783 | 48.8557,2.3745 | way/63646922 | custom (civic.json) | fr:Église Notre-Dame-d'Espérance de Paris |
| 201 | (unnamed) | catholic | 781 | 48.8467,2.3200 | way/1076545934 way/65756696 | nothing | fr:Chapelle des Sœurs auxiliatrices |
| 203 | Chapelle Sainte-Bernadette | catholic | 768 | 48.8478,2.2688 | way/85616170 | general (civic.json) | fr:Chapelle Sainte-Bernadette de Paris |
| 204 | Chapelle Sainte-Jeanne-d'Arc | catholic | 755 | 48.8256,2.3392 | way/118528607 way/118528607 | custom (catholic.json) | Chapelle Sainte-Jeanne-d'Arc de Paris (24m) |
| 205 | Chapelle Notre-Dame de la Paix | catholic | 754 | 48.8442,2.3973 | way/78006792 | general (civic.json) | fr:Chapelle Notre-Dame-de-la-Paix de Picpus |
| 206 | Chapelle Sainte-Thérèse | catholic | 752 | 48.8517,2.2710 | way/84262198 | general (civic.json) | Chapelle Sainte-Thérèse (Paris) (0m) |
| 208 | Franciscaines Réparatrices de Jésus Hostie | catholic | 733 | 48.8850,2.2943 | relation/1261004 node/2604947288 | nothing |  |
| 210 | Chapelle Laennec | catholic | 718 | 48.8499,2.3218 | way/105220265 | nothing | Chapelle de l'hôpital Laennec (5m) |
| 213 | Aumônerie des Grands Moulins | catholic | 712 | 48.8280,2.3804 | node/913121651 way/62377965 | nothing |  |
| 214 | Église Notre-Dame de Bercy | catholic | 708 | 48.8363,2.3872 | way/78271179 | general (civic.json) | fr:Église Notre-Dame-de-la-Nativité de Bercy |
| 215 | Église Saint-André de l'Europe | catholic | 705 | 48.8815,2.3258 | way/68256672 way/68256643 | general (civic.json) | Église Saint-André-de-l'Europe (1m) |
| 216 | Église Sainte-Rosalie | ? | 697 | 48.8301,2.3497 | way/78407279 | custom (catholic.json) | Église Sainte-Rosalie (7m) |
| 217 | Église Notre-Dame-de-l'Assomption des Buttes-Chaumont | catholic | 696 | 48.8840,2.3785 | way/63213611 | general (civic.json) | Église Notre-Dame-de-l'Assomption des Buttes-Chaumont (11m) |
| 219 | Chapelle Notre-Dame-de-Consolation | roman_catholic | 694 | 48.8656,2.3059 | way/69332061 way/69332061 | nothing | fr:Chapelle Notre-Dame-de-Consolation de Paris |
| 220 | Église Notre-Dame du Bon Conseil | catholic | 693 | 48.8951,2.3501 | way/78020496 | general (civic.json) | fr:Église Notre-Dame-du-Bon-Conseil (Paris) |
| 221 | Eglise Evangélique de Puteaux | ? | 684 | 48.8862,2.2347 | way/68852381 way/390830252 | general (civic.json) |  |
| 222 | Paroisse Saint-Michel | liberal_catholic | 684 | 48.8712,2.3720 | node/8355173129 way/63198227 | nothing |  |
| 223 | Église Notre-Dame-des-Otages | catholic | 681 | 48.8742,2.4027 | way/70001758 way/69999756 way/1189904513 | general (civic.json) | fr:Église Notre-Dame-des-Otages |
| 226 | Cathédrale Ukrainienne Saint-Vladimir-le-Grand | greek_catholic | 663 | 48.8547,2.3309 | way/62296389 | general (civic.json) | fr:Cathédrale Saint-Vladimir-le-Grand |
| 227 | Église Saint-Jacques | catholic | 654 | 48.8914,2.2690 | relation/1221234 | custom (catholic.json) | Église Saint-Jacques de Neuilly-sur-Seine (8m) |
| 228 | Église Saint-François d'Assise | catholic | 648 | 48.8244,2.2950 | way/88058402 | general (civic.json) | Église Saint-François-d'Assise de Vanves (6m) |
| 231 | Église Saint-Étienne | catholic | 628 | 48.8229,2.2767 | way/199694468 way/111826151 | general (civic.json) | fr:Église Saint-Étienne d'Issy-les-Moulineaux |
| 232 | Chapelle Notre-Dame de la Confiance | catholic | 625 | 48.8903,2.3069 | node/2606289749 way/122617822 | nothing |  |
| 234 | Abbaye Sainte-Marie de Paris | catholic | 616 | 48.8512,2.2686 | way/85427345 way/337382904 way/337382904 | general (civic.json) | fr:Abbaye Sainte-Marie de Paris |
| 235 | Église Sainte-Cécile | catholic | 598 | 48.8414,2.2452 | relation/1074310 | custom (catholic.json) | fr:Église Sainte-Cécile de Boulogne-Billancourt |
| 236 | Chapelle Notre-Dame de la Médaille Miraculeuse | catholic | 595 | 48.8507,2.3230 | way/244749667 way/68730206 | nothing | fr:Chapelle Notre-Dame-de-la-Médaille-Miraculeuse de Paris |
| 237 | Chapelle | catholic | 595 | 48.8297,2.3119 | way/137692720 | nothing |  |
| 238 | Église espagnole du Coeur Immaculé de Marie | catholic | 588 | 48.8623,2.2757 | way/462398675 | general (civic.json) | Église du Cœur-Immaculé-de-Marie de Paris (11m) |
| 239 | Chapelle Notre-Dame d'Espérance | roman_catholic | 586 | 48.8361,2.2986 | node/9193827761 way/304104266 | nothing |  |
| 240 | Crypte du Martyrium de Saint-Denis | catholic | 584 | 48.8840,2.3401 | way/1056870587 way/77806608 | nothing | fr:Crypte du martyrium de saint Denis |
| 243 | Chapelle du Corpus-Christi | catholic | 552 | 48.8743,2.3018 | way/70185807 way/70185807 | general (civic.json) |  |
| 244 | Sainte-Chapelle | roman_catholic | 549 | 48.8554,2.3450 | relation/3344870 | custom (paris.json) | fr:Sainte-Chapelle |
| 245 | Église du Cœur Eucharistique de Jésus | catholic | 548 | 48.8678,2.4064 | way/70003069 way/70003069 | general (civic.json) | fr:Église du Cœur Eucharistique de Jésus |
| 247 | (unnamed) | catholic | 538 | 48.8868,2.2665 | way/249618645 | general (civic.json) |  |
| 248 | Chapelle Saint-Louis | catholic | 537 | 48.8662,2.4019 | way/212269821 way/212269821 | custom (batch2.json) |  |
| 251 | Église Saint-François de Molitor | catholic | 523 | 48.8455,2.2600 | way/86277623 | general (civic.json) | fr:Église Saint-François-de-Molitor |
| 252 | Église Saint-Rémy | catholic | 523 | 48.8210,2.2862 | way/87376851 | general (civic.json) | fr:Église Saint-Rémy de Vanves |
| 254 | Église Sainte-Claire d'Assise | catholic | 517 | 48.8888,2.3949 | way/63234079 | general (civic.json) | fr:Église Sainte-Claire (Paris) |
| 255 | Église Bienheureuse-Isabelle-de-France | catholic | 497 | 48.8768,2.2513 | way/81234227 | general (civic.json) | Église Bienheureuse-Isabelle-de-France de Neuilly-sur-Seine (8m) |
| 256 | Chapelle Sainte-Anne | catholic | 496 | 48.8288,2.3378 | way/79626475 | general (civic.json) | fr:Chapelle de l'hôpital Sainte-Anne |
| 258 | Chapelle Notre-Dame-du-Saint-Sacrement | catholic | 494 | 48.8620,2.2797 | way/112461792 way/112461792 | general (civic.json) | fr:Chapelle Notre-Dame du Saint Sacrement de Paris |
| 259 | Chapelle Notre-Dame-du-Lys | catholic | 488 | 48.8436,2.3086 | way/80237236 way/80237236 | general (civic.json) | fr:Chapelle Notre-Dame-du-Lys |
| 261 | Communauté Chrétienne du Point du jour | catholic | 485 | 48.8404,2.2304 | node/3383403938 way/72859506 | nothing |  |
| 262 | Église Saint-Germain-de-Charonne | catholic | 483 | 48.8605,2.4040 | way/70147142 way/70150155 | general (civic.json) | fr:Église Saint-Germain de Charonne |
| 263 | Séminaire Polonais de Paris | catholic | 481 | 48.8219,2.2769 | relation/1442432 | nothing |  |
| 264 | Église Notre-Dame-de-la-Médaille-Miraculeuse | catholic | 476 | 48.8201,2.3052 | way/83795285 | general (civic.json) | Église Notre-Dame de Malakoff (16m) |
| 265 | Aumonerie | catholic | 471 | 48.8776,2.3417 | node/6857202472 way/69417405 | nothing |  |
| 267 | Église Notre-Dame-des-Coptes | ? | 468 | 48.8712,2.3938 | way/70000860 | general (civic.json) | fr:Église Notre-Dame-des-Coptes |
| 268 | Chapelle Saint-Pierre | catholic | 467 | 48.8331,2.2550 | way/74005541 way/74005541 | general (civic.json) | Chapelle Saint-Pierre de Boulogne-Billancourt (16m) |
| 270 | Église Notre-Dame-de-Chine | catholic | 456 | 48.8215,2.3626 | way/79084032 way/206006738 | general (civic.json) | fr:Église Notre-Dame-de-Chine (Paris) |
| 271 | Église Polonaise Sainte-Geneviève | catholic | 454 | 48.8415,2.2614 | way/87841263 way/137884639 | nothing | Chapelle Sainte-Geneviève d'Auteuil (5m) |
| 272 | (unnamed) | ? | 454 | 48.8332,2.3379 | way/79611359 way/79611359 | general (civic.json) |  |
| 275 | Église Saint-Adrien | catholic | 441 | 48.8978,2.2392 | way/617370148 way/366458287 way/366458287 | general (civic.json) | fr:Église Saint-Adrien de Courbevoie |
| 279 | (unnamed) | ? | 431 | 48.8529,2.3169 | way/386197186 way/68568712 | nothing |  |
| 280 | Église luthérienne de la Résurrection | catholic | 430 | 48.8443,2.2980 | way/53262890 way/53262890 | general (civic.json) | fr:Église luthérienne de la Résurrection de Paris |
| 281 | Chapelle | catholic | 427 | 48.8834,2.3531 | way/146912739 | general (civic.json) |  |
| 282 | Chapelle | ? | 420 | 48.8438,2.3921 | way/78019375 | nothing |  |
| 284 | Notre-Dame-de-Belleville | catholic | 418 | 48.8732,2.3794 | way/328240241 way/328240250 | general (civic.json) |  |
| 285 | Église Notre-Dame-de-Pentecôte | catholic | 417 | 48.8920,2.2409 | way/68850845 | custom (civic.json) | fr:Notre-Dame de Pentecôte |
| 286 | Chapelle Saint-Charles | catholic | 414 | 48.8542,2.4078 | way/205699441 | general (civic.json) | fr:Chapelle Saint-Charles de la Croix-Saint-Simon |
| 287 | Église Notre-Dame du Perpétuel Secours | catholic | 410 | 48.8874,2.2339 | way/68853455 way/68853455 | general (civic.json) | Église Notre-Dame-du-Perpétuel-Secours de Puteaux (6m) |
| 288 | Église Saint-Julien-le-Pauvre | catholic | 410 | 48.8520,2.3472 | way/19741083 | custom (batch5.json) | fr:Église Saint-Julien-le-Pauvre (Paris) |
| 289 | (unnamed) | ? | 409 | 48.8740,2.4022 | way/1189904513 | general (civic.json) |  |
| 291 | Chapelle de l'Épiphanie | catholic | 402 | 48.8518,2.3231 | way/104339971 way/104339971 | general (civic.json) | Chapelle de l'Épiphanie (13m) |
| 292 | Chapelle de la congrégation du Saint-Esprit | catholic | 401 | 48.8428,2.3465 | way/56771095 way/56771095 | general (civic.json) | Couvent des Dames Bénédictines du Saint-Sacrement (39m) |
| 293 | Chapelle des petites sœurs de l'Assomption | catholic | 400 | 48.8461,2.2923 | way/320707523 way/320707523 | general (civic.json) |  |
| 294 | Église Notre-Dame des Pauvres | catholic | 397 | 48.8272,2.2678 | way/54047170 way/54047170 | general (civic.json) | fr:Église Notre-Dame-des-Pauvres d'Issy-les-Moulineaux |
| 295 | chapelle de Saint-Jean de Passy | ? | 394 | 48.8550,2.2776 | way/1553569328 | general (civic.json) |  |
| 296 | Chapelle | ? | 387 | 48.8542,2.3613 | way/56159605 way/56159604 | custom (civic.json) | Église Saint-Paul-Saint-Louis (51m) |
| 298 | Chapelle Sainte-Bathilde | catholic | 386 | 48.8224,2.2830 | way/198765990 | general (civic.json) | Prieuré Sainte-Bathilde de Vanves (35m) |
| 299 | Chapelle Notre-Dame-des-Anges | catholic | 385 | 48.8463,2.3235 | way/219378497 | general (civic.json) |  |
| 300 | Chapelle Notre-Dame de la Sagesse | catholic | 385 | 48.8357,2.3733 | way/62379741 way/62379741 | nothing | fr:Chapelle Notre-Dame-de-la-Sagesse |
| 301 | Chapelle Saint-Leufroy | catholic | 384 | 48.8640,2.2233 | way/446918532 way/446918532 | general (civic.json) | Chapelle Saint-Leufroy de Suresnes (22m) |
| 303 | (unnamed) | catholic | 374 | 48.8493,2.3410 | way/426995607 | nothing |  |
| 304 | Chapelle rose | roman_catholic | 369 | 48.8226,2.2752 | way/111797202 way/111797225 | general (civic.json) |  |
| 305 | Église grecque catholique russe de la Trinité | greek_catholic | 363 | 48.8486,2.2711 | node/2763883283 way/86424787 | nothing | fr: Église catholique russe de la Très-Sainte-Trinité de Paris |
| 306 | Église Notre-Dame de l'Arche d'Alliance | catholic | 342 | 48.8366,2.3084 | way/24303512 way/24303512 | custom (catholic.json) | fr:Église Notre-Dame-de-l'Arche-d'Alliance de Paris |
| 307 | Chapelle des Catéchismes | catholic | 334 | 48.8590,2.3183 | way/65104255 | general (civic.json) | fr:Chapelle de Jésus-Enfant |
| 308 | Chapelle Saint-Vincent-de-Paul | catholic | 331 | 48.8588,2.3056 | way/69884667 | general (civic.json) |  |
| 310 | Église Notre-Dame-de-Pitié | catholic | 321 | 48.8795,2.2429 | way/68850662 way/68850662 | general (civic.json) | Église Notre-Dame-de-Pitié de Puteaux (15m) |
| 312 | Chapelle de l'hôpital Saint-Louis | catholic | 319 | 48.8741,2.3662 | way/63200644 | general (civic.json) |  |
| 313 | Saint-Joseph's Church (mission anglophone) | catholic | 319 | 48.8755,2.2984 | way/70223975 | general (civic.json) |  |
| 315 | Chapelle Notre-Dame de Valmy | catholic | 316 | 48.8277,2.4020 | way/149268034 way/149268034 | general (civic.json) | fr:Chapelle Notre-Dame de Valmy (Charenton-le-Pont) |
| 317 | Chapelle de la Visitation | catholic | 309 | 48.8385,2.3356 | way/93664894 way/93664894 | general (civic.json) | Monastère de la Visitation de l'avenue Denfert-Rochereau (12m) |
| 318 | (unnamed) | ? | 309 | 48.8909,2.2197 | way/58243829 way/58243829 way/58243831 | nothing | fr:Chapelle Saint-Joseph-des-Fontenelles de Nanterre |
| 321 | Chapelle Notre-Dame-de-Joye | catholic | 300 | 48.8367,2.3354 | way/356802944 way/356802951 | nothing |  |
| 322 | Climbing District Saint-Lazare | catholic | 299 | 48.8818,2.3262 | way/1144467565 | nothing | Église Saint-André-de-l'Europe (42m) |
| 325 | Chapelle des Catéchismes | catholic | 285 | 48.8465,2.3488 | way/255080046 | general (civic.json) | Presbytère de l'église Saint-Étienne-du-Mont (11m) |
| 326 | Chapelle Sainte-Bernadette | catholic | 282 | 48.8944,2.2782 | way/64623191 way/64623191 | general (civic.json) | Église Sainte-Bernadette de Levallois-Perret (10m) |
| 328 | (unnamed) | catholic | 280 | 48.8491,2.3235 | way/146938295 way/146938295 | general (civic.json) |  |
| 329 | Chapelle Saint-Yves | catholic | 275 | 48.8255,2.3330 | way/155071057 | general (civic.json) | fr:Chapelle Saint-Yves (Paris) |
| 330 | Communauté assomptionniste Saint-Vincent-de-Paul | catholic | 274 | 48.8658,2.3087 | node/3111840468 way/680378609 | nothing | fr:Adveniat Paris |
| 332 | Église Sainte-Rita | ? | 273 | 48.8446,2.3062 | way/77743146 | general (civic.json) | fr:Église Sainte-Rita de Paris |
| 335 | (unnamed) | ? | 256 | 48.8892,2.3801 | way/137692730 | general (civic.json) | Église Saint-Jacques-Saint-Christophe de la Villette (33m) |
| 336 | Chapelle | catholic | 253 | 48.8474,2.2358 | way/692063557 | general (civic.json) |  |
| 338 | Chapelle Saint-Louis | ? | 250 | 48.8782,2.2244 | way/70962743 | general (civic.json) | Chapelle Saint-Louis de Suresnes (11m) |
| 343 | Chapelle Saint-Jean-XXIII | catholic | 239 | 48.8949,2.3460 | node/4375606406 way/48965845 | nothing |  |
| 344 | Chapelle du lycée Janson-de-Sailly | catholic | 239 | 48.8648,2.2806 | way/154001554 way/154001554 | nothing |  |
| 345 | Chapelle de la Trinité | ? | 238 | 48.8379,2.3354 | way/439916874 | general (civic.json) |  |
| 348 | Chapelle Saint-Paul | catholic | 229 | 48.8242,2.3224 | way/399204077 way/399204076 | general (civic.json) |  |
| 349 | (unnamed) | ? | 229 | 48.8380,2.2971 | relation/535059 node/10171939851 | nothing |  |
| 350 | Chapelle Sainte-Reine | catholic | 225 | 48.8983,2.2938 | way/64790625 | general (civic.json) | Église Sainte-Reine de Levallois-Perret (4m) |
| 351 | Chapelle de l'Est | ? | 222 | 48.8612,2.3929 | way/70148655 | general (civic.json) | Chapelle du Père-Lachaise (4m) |
| 352 | (unnamed) | ? | 213 | 48.8528,2.3492 | way/53657341 | nothing | Cathédrale primitive Notre-Dame de Paris (45m) |
| 353 | Chapelle Notre-Dame-Réconciliatrice de la Salette | catholic | 211 | 48.8698,2.3789 | way/63638499 | nothing |  |
| 354 | Église Saint-Luc | catholic | 209 | 48.8938,2.3754 | way/259039017 | general (civic.json) | fr:Église Saint-Luc (Paris) |
| 356 | Chapelle Notre-Dame de Bonne Délivrance | catholic | 206 | 48.8898,2.2630 | way/1479606357 way/1479606357 | nothing |  |
| 359 | Centre Saint-Paul | catholic | 195 | 48.8686,2.3444 | node/2606259280 way/54753703 | nothing |  |
| 361 | Prieuré Saint-Benoît | catholic | 185 | 48.8875,2.3421 | way/137884617 | general (civic.json) | Carmel de Montmartre (52m) |
| 362 | Chapelle Saint-Patrick | catholic | 183 | 48.8440,2.3460 | way/1056864734 | general (civic.json) | Cathédrale Notre-Dame-du-Liban de Paris (51m) |
| 363 | Chapelle du Sacré-Cœur-de-Jésus-Roi-de-France | roman_catholic | 179 | 48.8389,2.2988 | way/166684921 way/53774509 | general (civic.json) |  |
| 364 | Église Saint-Éphrem-le-Syriaque | catholic | 173 | 48.8483,2.3477 | way/55359253 way/55359253 | general (civic.json) | fr:Église Saint-Éphrem-le-Syriaque |
| 365 | Chapelle de la compassion | catholic | 168 | 48.8814,2.2833 | way/48433146 way/48433146 | general (civic.json) | fr:Église Notre-Dame-de-Compassion (Paris) |
| 367 | Communauté catholique coréenne de Paris | catholic | 167 | 48.8394,2.3338 | node/13968549088 way/79616713 | nothing |  |
| 370 | Chapelle de la Congrégation Notre-Dame de Fidélité | ? | 158 | 48.8438,2.3266 | way/64302310 | general (civic.json) | Église Notre-Dame-des-Champs de Paris (56m) |
| 373 | Chapelle de la clinique Blomet | catholic | 148 | 48.8396,2.2962 | way/137884646 way/137884646 | general (civic.json) |  |
| 375 | (unnamed) | ? | 128 | 48.8829,2.2322 | way/68852568 way/68852568 | general (civic.json) |  |
| 376 | Chapelle Sainte-Rita | catholic | 128 | 48.8838,2.3317 | way/112331902 | general (civic.json) | fr:Chapelle Sainte-Rita de Paris |
| 377 | Église Saint-Albert le Grand | catholic | 125 | 48.8688,2.2773 | way/80892490 way/80892490 | general (civic.json) |  |
| 378 | Chapelle Saint-Rémi | catholic | 118 | 48.8514,2.3716 | way/55465649 way/55465649 | nothing |  |
| 379 | (unnamed) | ? | 117 | 48.8413,2.2841 | way/53379271 | nothing |  |
| 381 | Maison Saint-Pie X | roman_catholic | 103 | 48.8676,2.2200 | way/70964313 | nothing |  |
| 382 | Fraternités Monastiques de Jérusalem | catholic | 94 | 48.8550,2.3557 | node/5295293309 way/55620188 | custom (monuments.json) |  |
| 383 | La Solitude | ? | 93 | 48.8231,2.2772 | way/111826152 way/111826152 | nothing | Église Saint-Étienne d'Issy-les-Moulineaux (44m) |
| 385 | Église Passage National | ? | 81 | 48.8238,2.3694 | way/79083459 | nothing |  |
| 387 | Chapelle Ricord | ? | 76 | 48.8385,2.3402 | way/79611249 | nothing | Couvent des capucins du faubourg Saint-Jacques (4m) |
| 388 | (unnamed) | ? | 62 | 48.8464,2.3481 | way/255080058 way/255080058 | custom (monuments.json) | Église Saint-Étienne-du-Mont de Paris (19m) |
| 389 | (unnamed) | ? | 50 | 48.8629,2.3504 | way/53933242 | nothing | Église Saint-Leu-Saint-Gilles de Paris (22m) |
| 391 | Chapelle Notre-Dame-de-Toutes-Grâces | catholic | 36 | 48.8234,2.2786 | way/114654265 | nothing |  |
| 393 | (unnamed) | ? | 17 | 48.8895,2.3798 | way/64040816 | nothing | Église Saint-Jacques-Saint-Christophe de la Villette (38m) |
| 394 | Chapelle des douze apotres... | ? | 10 | 48.8387,2.3266 | way/1197824759 | nothing |  |
| 395 | La mémoire nécropolitaine | ? | 0 | 48.8604,2.3934 | way/1211895428 way/1211895428 | nothing |  |
| 396 | Chapelle Saint-Vincent de Paul | catholic | 0 | 48.8488,2.3218 | node/257082085 | nothing | Chapelle Saint-Vincent-de-Paul de Paris (7m) |
| 397 | Paroisse Saint Jean Bosco | catholic | 0 | 48.8550,2.3981 | node/1981236443 | nothing | Église Saint-Jean-Bosco de Paris (28m) |
| 398 | Chapelle Marie-Antoinette | catholic | 0 | 48.8440,2.2182 | node/2588825923 | nothing |  |
| 399 | (unnamed) | catholic | 0 | 48.8530,2.3648 | node/2605036743 | nothing |  |
| 400 | Église Sainte-Colette des Buttes-Chaumont | catholic | 0 | 48.8839,2.3866 | node/2675730793 | nothing | Église Sainte-Colette des Buttes-Chaumont (1m) |
| 401 | (unnamed) | catholic | 0 | 48.8825,2.2782 | node/2792153924 | nothing |  |
| 402 | Chapelle Saint-Louis | catholic | 0 | 48.8527,2.3036 | node/3032793634 | custom (paris.json) |  |
| 403 | Dupanloup | catholic | 0 | 48.8448,2.2496 | node/3383408841 | nothing |  |
| 404 | Chapelle Saint-Joseph des Épinettes | catholic | 0 | 48.8962,2.3237 | node/4501056845 | nothing |  |
| 406 | Missionnaires de la Charité | ? | 0 | 48.8648,2.3713 | node/10130759044 | nothing |  |
| 407 | Maison d'Accueil de l'Assomption | ? | 0 | 48.8534,2.2733 | node/13248258699 | nothing |  |
