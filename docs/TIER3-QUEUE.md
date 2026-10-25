# Tier 3 of the Market/FiDi list: the custom-model queue (2026-10-24)

Owner, 2026-10-24: "We were supposed to custom model every building on market in downtown … Prioritize and start working on the 310. Just do one subagent at a time though so as not to exhaust my allocation of tokens. Buildings that are especially prominent or unusual or important should go first."

Source: Tier 3 of [GENERIC-MARKET-FIDI.md](GENERIC-MARKET-FIDI.md) (310), less the 4 modelled since (306). Rank = that list's score (height × √footprint ÷ 10, +named, +notable, +Market) **+60** a DataSF historic resource (CEQA A), **+20** in a historic district, **+40** OSM heritage/wikidata, **+15** built before 1930, **+25** a corner, **+30** on Market, **−60** a back-of-block piece (under 5 m of street frontage), and a hand bump for the ones a photo check showed to be distinctive (Market 6th–7th, 2026-10-24: the International Art Museum front at 1023–1035, the grey stone corner at 6th, 1067, 1000 Market). Grouped into batches of up to three neighbours (within 45 m) so one subagent models a stretch of street together.

One subagent at a time, brief [sf-batches/BRIEF-TIER3.md](sf-batches/BRIEF-TIER3.md); each batch is reviewed (photo vs render) before the next starts. Mark a batch done here with its commit.

**Re-ranked from batch 20 (2026-10-25):** the first ranking let small historic alley buildings in the FiDi outrank big Market Street buildings. From batch 20 the rank is size (height × √footprint ÷ 10) **+90 on Market**, +30 historic resource, +10 district, +15 corner, +40 notable, +10 named, +80 photo-checked distinctive, −60 back-of-block.

| batch | rank | buildings (OSM, name, height, now) | status |
|---:|---:|---|---|
| 1 | 294 | `way/35115849` (unnamed) · 19 m · generic<br>`way/136100941` (unnamed) · ? · generic<br>`way/136100939` 1009;1011 Market Street · 11 m · generic | done |
| 2 | 250 | `way/256035270` (unnamed) · 11 m · reface brick<br>`way/136100937` 1023 Market Street · 13 m · reface brick<br>`way/136100936` (unnamed) · 9 m · reface brick || done |
| 3 | 239 | `way/165480949` Station J · ? · generic<br>`way/308339610` Wayfare Tavern — 558 Sacramento Street · ? · generic<br>`way/256067736` 215 Leidesdorff Street · 14 m · generic || done |
| 4 | 231 | `way/942303806` Anglo Bank Building · ? · generic<br>`way/942303807` Station J · ? · generic<br>`way/942303804` (unnamed) · ? · generic || done |
| 5 | 213 | `way/148741774` Cafe Tiramisu — 28 Belden Place · 8 m · generic<br>`way/148741780` (unnamed) · 27 m · generic<br>`way/148741783` (unnamed) · 8 m · generic || 148741780 done; 148741774 and 148741783 have no photographs (a pedestrian lane) |
| 6 | 213 | `way/260280334` (unnamed) · 34 m · generic<br>`way/151195278` (unnamed) · 30 m · generic<br>`way/474354577` (unnamed) · 13 m · generic || done |
| 7 | 209 | `way/151195270` (unnamed) · 21 m · generic<br>`way/151195275` 260 Kearny Street · 17 m · generic || done |
| 8 | 201 | `way/260286448` Buich Building — 240;242 California Street · 11 m · generic<br>`way/260286441` 244;252;256 California Street · 32 m · generic<br>`way/260286442` 200;210 California Street · 18 m · generic || done |
| 9 | 196 | `way/260924232` Clayton · ? · generic<br>`way/260924222` (unnamed) · 15 m · generic<br>`way/260924242` (unnamed) · ? · generic || done |
| 10 | 195 | `way/148285580` 28 2nd Street · 27 m · generic<br>`way/79377209` (unnamed) · 25 m · generic<br>`way/79377219` 44 2nd Street · 11 m · generic || done |
| 11 | 192 | `way/32858943` (unnamed) · 19 m · generic<br>`way/32858908` (unnamed) · 12 m · generic<br>`way/32858912` 530;532 Jackson Street · ? · generic || done |
| 12 | 189 | `way/149837286` 16 Elim Street · 18 m · generic<br>`way/260298023` 40 Jessie Street · 24 m · generic || done |
| 13 | 184 | `way/151195280` 200;220 Kearny Street · 19 m · generic<br>`way/151195276` 154;160;168;170;176 Sutter Street · 26 m · generic<br>`way/260280331` 215;217 Kearny Street · 12 m · generic || done |
| 14 | 182 | `way/256072716` Clay Street · 15 m · generic<br>`way/256072720` 660;662;664;668;670 Clay Street · 11 m · generic<br>`way/260924226` 643;645;647 Clay Street · 12 m · generic || 256072716 and 260924226 done; 256072720 has no photographs |
| 15 | 178 | `way/260282395` (unnamed) · 25 m · generic<br>`way/32859888` (unnamed) · 40 m · reface chicago<br>`way/260282393` 77 Battery Street · 17 m · generic || done |
| 16 | 178 | `way/165480948` 407;411 Sansome Street · 17 m · generic<br>`way/32947521` (unnamed) · 16 m · generic<br>`way/165480946` 415;429 Sansome Street · ? · generic || done |
| 17 | 176 | `way/255716896` 123;125;127;133 Kearny Street · 22 m · generic<br>`way/333823795` 153 Kearny Street · 39 m · reface chicago<br>`way/255716898` 126 Post Street · 28 m · reface classical || done |
| 18 | 175 | `way/151683977` (unnamed) · 30 m · generic<br>`way/151683979` 353;355;357;359 Kearny Street · 18 m · generic<br>`way/148741772` (unnamed) · 14 m · generic || done |
| 19 | 175 | `way/260286870` 301 Sacramento Street · 16 m · generic<br>`way/260286867` 333 Sacramento Street · 13 m · generic<br>`way/260286872` 325 Sacramento Street · 11 m · generic || done |
| 20 | 222 | `way/35174707` 1000;1010;1020 Market Street · 15 m · reface sfapartment || done |
| 21 | 205 | `way/256035272` 1067;1071 Market Street · ? · reface brick<br>`way/256035269` 1059;1061 Market Street · 25 m · reface chicago<br>`way/256035275` 1063 Market Street · ? · reface brick || done |
| 22 | 173 | `way/32946667` 650 Market Street · 22 m · reface classical || done |
| 23 | 171 | `way/256035267` 1049;1051 Market Street · 26 m · reface chicago<br>`way/256035271` (unnamed) · ? · reface brick<br>`way/939440533` (unnamed) · ? · reface brick || done |
| 24 | 161 | `way/35176126` 944 Market Street · 29 m · reface chicago<br>`way/42640325` 934;936 Market Street · 8 m · reface brick || done |
| 25 | 151 | `way/35174751` (unnamed) · 19 m · reface brick<br>`way/941560580` (unnamed) · 11 m · reface brick || done |
| 26 | 149 | `way/148712645` 576;578;580 Market Street · 25 m · reface chicago<br>`way/148712646` (unnamed) · 11 m · reface chicago || done |
| 27 | 145 | `way/151183777` Market Street · 47 m · reface bauhaus || done |
| 28 | 143 | `way/35176494` 1278 Market Street · 16 m · reface sfapartment || done |
| 29 | 138 | `way/35111929` (unnamed) · 17 m · reface sfapartment<br>`way/35111933` 1438;1440;1442;1444 Market Street · 17 m · reface chicago<br>`way/35111927` (unnamed) · 9 m · reface brick || done |
| 30 | 137 | `way/35176510` 1242 Market Street · 18 m · reface chicago<br>`way/35112065` 1234 Market Street · ? · reface brick<br>`way/35112032` 1220 Market Street · 9 m · reface brick || done |
| 31 | 137 | `way/332517080` 969 Market Street · 14 m · reface brick || done |
| 32 | 128 | `way/256037014` 931 Market Street · 13 m · reface brick<br>`way/173725079` 923 Market Street · 18 m · reface chicago<br>`way/256037012` (unnamed) · 21 m · reface chicago || done (with 31) |
| 33 | 126 | `way/260318172` (unnamed) · 14 m · reface brick || done (with 42) |
| 34 | 124 | `way/939440535` (unnamed) · 14 m · reface brick || done |
| 35 | 124 | `way/1288526233` (unnamed) · 7 m · reface brick || done (with 34) |
| 36 | 123 | `way/149332500` 711 Market Street · 11 m · reface brick<br>`way/149332499` 721 Market Street · ? · reface chicago || done |
| 37 | 121 | `way/256035263` 1089 Market Street · 8 m · reface brick || done (with 34) |
| 38 | 119 | `way/256049055` Crazy Horse Gentlemen's Club — 980 Market Stre · 8 m · reface brick || done |
| 39 | 119 | `way/35176266` 1201 Market Street · 8 m · reface brick || done (with 38) |
| 40 | 119 | `way/173725095` 925 Market Street · 13 m · reface brick || done (with 38) |
| 41 | 118 | `way/35112006` 1200 Market Street · 11 m · reface brick || done (with 38) |
| 42 | 113 | `way/148712647` (unnamed) · 14 m · reface chicago<br>`way/148712642` (unnamed) · 15 m · reface chicago<br>`way/148712643` (unnamed) · 10 m · reface chicago || done |
| 43 | 106 | `way/941650784` (unnamed) · ? · generic || done (with 42) |
| 44 | 105 | `way/332516647` 993 Market Street · 4 m · reface brick || done (with 36) |
| 45 | 101 | `way/35537113` 499 Jackson Street · 19 m · generic<br>`way/148666785` (unnamed) · 13 m · reface brick<br>`way/35537118` 463;473 Jackson Street · 14 m · reface brick || done |
| 46 | 100 | `way/256088136` 435;437 Pacific Avenue · ? · generic<br>`way/253609537` Pacific Avenue · ? · generic<br>`way/256088155` 731 Sansome Street · 18 m · reface brick || done |
| 47 | 98 | `way/256066239` 333 Pine Street · 22 m · generic || done |
| 48 | 98 | `way/417216803` (unnamed) · 5 m · reface brick || done (with 36) |
| 49 | 96 | `way/260288458` 234;236 Front Street · 20 m · generic<br>`way/260288447` 222 Front Street · 23 m · generic || 222 Front done (with 47); 234-236 Front has no photographs |
| 50 | 95 | `way/149757917` (unnamed) · 28 m · reface classical<br>`way/149757918` 49 Kearny Street · 34 m · generic<br>`way/149757923` 45;47 Kearny Street · 34 m · reface towerblock || done |
| 51 | 95 | `way/436484312` (unnamed) · 25 m · reface skyscraper || done |
| 52 | 94 | `way/256068384` (unnamed) · 39 m · reface chicago<br>`way/256068383` (unnamed) · 16 m · generic<br>`way/256068367` 554;556 Commercial Street · 11 m · generic || done (with 51) |
| 53 | 90 | `way/256067718` 231 Sansome Street · 24 m · generic<br>`way/256067716` 217;221 Sansome Street · 15 m · generic || 231 Sansome done; 217-221 Sansome has no photographs |
| 54 | 89 | `way/256067721` 358;360 Pine Street · 29 m · generic<br>`way/944039727` (unnamed) · 4 m · generic || 358-360 Pine has no photographs; 944039727 is a part of 300 Montgomery (modelled), skipped |
| 55 | 88 | `way/260925341` 660 Sacramento Street · ? · generic<br>`way/260925347` 653 Commercial Street · 12 m · generic<br>`way/1229790537` (unnamed) · ? · generic || 660 Sacramento and 1229790537 done; 653 Commercial has no photographs |
| 56 | 85 | `relation/3492879` 20;26 California Street · 25 m · generic<br>`way/260288448` (unnamed) · 31 m · generic<br>`way/260288456` (unnamed) · 14 m · generic || done |
| 57 | 79 | `way/260924234` 632;634 Commercial Street · 21 m · generic<br>`way/260924231` 635;637;639 Clay Street · 12 m · generic<br>`way/260924225` 667;669;675 Clay Street · 13 m · generic || 635 and 667 Clay done; 632-634 Commercial has no photographs |
| 58 | 79 | `way/148710881` 32 Battery Street · 20 m · reface chicago || done (with 57) |
| 59 | 78 | `way/35537088` 708;710 Montgomery Street · 11 m · generic<br>`way/148668302` (unnamed) · ? · generic<br>`way/35537108` (unnamed) · 9 m · generic || 708 Montgomery and 35537108 done; 148668302 has no photographs |
| 60 | 78 | `way/149840698` 96 Jessie Street · 14 m · generic<br>`way/149840695` 79 Stevenson Street · 11 m · generic<br>`way/149840696` (unnamed) · 9 m · generic || done |
| 61 | 78 | `way/942665598` 130 Montgomery Street · 22 m · generic || done |
| 62 | 76 | `way/148668309` 520;522;524;526;528;530;532;550 Washington Str · 9 m · generic<br>`way/148668322` (unnamed) · ? · generic<br>`way/148668312` (unnamed) · 13 m · reface brick || done (with 61) |
| 63 | 75 | `way/260280333` 219;225 Kearny Street · 20 m · generic<br>`way/260280329` 237;239;241 Kearny Street · 13 m · generic<br>`way/260280332` 243;245 Kearny Street · 13 m · generic | |
| 64 | 74 | `way/148741776` 22 Belden Place · 8 m · generic<br>`way/148741778` 364 Bush Street · 9 m · generic<br>`way/148741775` (unnamed) · ? · generic | |
| 65 | 73 | `way/148285582` 30 2nd Street · 9 m · generic | |
| 66 | 71 | `way/942303810` (unnamed) · ? · generic<br>`way/256068366` 559 Clay Street · ? · generic<br>`way/256068369` 564;566 Commercial Street · ? · generic | |
| 67 | 70 | `way/260286447` 212;214 California Street · 10 m · generic<br>`way/940149659` 227 Front Street · 7 m · generic<br>`way/260286866` (unnamed) · 7 m · generic | |
| 68 | 70 | `way/148666782` 42 Columbus Avenue · 4 m · generic<br>`way/35537150` (unnamed) · 19 m · reface brick | |
| 69 | 70 | `way/149840697` (unnamed) · 22 m · reface brick<br>`way/149840693` 55 Stevenson Street · ? · generic | |
| 70 | 69 | `way/256087383` (unnamed) · 24 m · reface chicago<br>`way/256087379` 350;368 Jackson Street · 18 m · generic<br>`way/256087384` 710 Sansome Street · 15 m · reface brick | |
| 71 | 68 | `way/165480947` 529;531 Commercial Street · ? · generic<br>`way/942303809` (unnamed) · ? · generic | |
| 72 | 68 | `way/256067704` 130 Battery Street · 25 m · generic | |
| 73 | 65 | `way/148741782` (unnamed) · 10 m · generic<br>`way/148741781` 318;320;322 Kearny Street · 8 m · generic<br>`way/148741771` 334;336 Kearny Street · 13 m · generic | |
| 74 | 65 | `way/151683978` 325;327;329 Kearny Street · 13 m · generic<br>`way/151683980` 321;323 Kearny Street · 13 m · generic<br>`way/151683981` 315;319 Kearny Street · 13 m · generic | |
| 75 | 65 | `way/260280335` 227;229;231 Kearny Street · 13 m · generic<br>`way/1020483120` (unnamed) · ? · generic<br>`way/260280330` (unnamed) · 26 m · reface classical | |
| 76 | 65 | `way/260924237` 671;677 Clay Street · 13 m · generic<br>`way/260924229` 670;674 Commercial Street · 12 m · generic<br>`way/260925350` 681;683;687 Commercial Street · ? · generic | |
| 77 | 65 | `way/260925351` 610;612 Kearny Street · ? · generic<br>`way/260925343` 685 Commercial Street · ? · generic<br>`way/260925338` (unnamed) · ? · generic | |
| 78 | 63 | `way/260924236` 689 Clay Street · ? · generic<br>`way/260924239` (unnamed) · ? · generic<br>`way/260924235` 683;685 Clay Street · ? · generic | |
| 79 | 63 | `way/260282397` 140;142 Sansome Street · 28 m · generic | |
| 80 | 62 | `way/256068374` 563;565 Clay Street · 9 m · generic | |
| 81 | 62 | `way/401129772` (unnamed) · ? · generic | |
| 82 | 61 | `way/148741785` (unnamed) · 14 m · generic<br>`way/148741784` 342;344 Kearny Street · 9 m · generic<br>`way/148741773` (unnamed) · 14 m · generic | |
| 83 | 61 | `way/260925346` (unnamed) · 17 m · generic<br>`way/1229790674` (unnamed) · ? · generic<br>`way/260925337` San Francisco Evangelical Free Church — 648;65 · 14 m · reface stucco | |
| 84 | 61 | `way/255716897` 100 Kearny Street · 19 m · reface classical<br>`way/149757924` 101 Post Street · 16 m · reface classical | |
| 85 | 60 | `way/256088651` 515;517 Pacific Avenue · ? · generic<br>`way/256088648` 535 Pacific Avenue · 17 m · reface brick<br>`way/256088656` 843;845 Montgomery Street · 18 m · reface brick | |
| 86 | 55 | `way/942303805` (unnamed) · ? · generic<br>`way/942303808` (unnamed) · ? · generic | |
| 87 | 55 | `way/256086591` (unnamed) · 12 m · generic<br>`way/32947588` 220 Jackson Street · 12 m · generic<br>`way/256086590` (unnamed) · 18 m · generic | |
| 88 | 53 | `way/148741779` (unnamed) · 13 m · generic<br>`way/148741777` (unnamed) · 10 m · generic<br>`way/151185873` 471;473;475 Pine Street · 19 m · generic | |
| 89 | 52 | `way/260924241` (unnamed) · ? · generic<br>`way/260924240` (unnamed) · ? · generic<br>`way/260925348` Canton Bazaar — 686 Sacramento Street · ? · generic | |
| 90 | 52 | `way/939455049` (unnamed) · ? · generic | |
| 91 | 51 | `way/940149660` (unnamed) · 7 m · generic | |
| 92 | 51 | `way/1316030009` (unnamed) · 4 m · generic | |
| 93 | 51 | `way/260286444` (unnamed) · ? · generic | |
| 94 | 49 | `way/151183781` 451 Montgomery Street · 11 m · generic<br>`way/942288403` (unnamed) · ? · generic | |
| 95 | 48 | `way/149757920` (unnamed) · 28 m · reface classical | |
| 96 | 45 | `way/151195273` (unnamed) · ? · generic | |
| 97 | 45 | `way/256084916` (unnamed) · 13 m · generic<br>`way/260927794` (unnamed) · 13 m · generic<br>`way/260927792` (unnamed) · 13 m · generic | |
| 98 | 43 | `way/256088142` 412;414 Jackson Street · 17 m · reface brick<br>`way/260937912` 40 Gold Street · 12 m · reface brick<br>`way/256088146` 705;727;729 Sansome Street · 13 m · reface brick | |
| 99 | 42 | `way/1010864204` (unnamed) · ? · generic | |
| 100 | 42 | `way/32946057` 850;888 Montgomery Street · ? · reface brick<br>`way/256088141` Montgomery Street · ? · reface brick<br>`way/256088156` 836 Montgomery Street · 6 m · reface brick | |
| 101 | 41 | `way/256072724` 53;55 Columbus Avenue · 11 m · generic<br>`way/256072713` 646 Washington Street · 14 m · generic<br>`way/392852707` (unnamed) · ? · generic | |
| 102 | 39 | `way/260282391` 65;75 Battery Street · 14 m · generic | |
| 103 | 38 | `way/35266543` San Francisco Fire Station 13 — 530 Sansome St · 10 m · reface brick<br>`way/256072718` (unnamed) · 12 m · generic<br>`way/256072708` (unnamed) · 8 m · generic | |
| 104 | 37 | `way/256086588` 607;611 Front Street · 10 m · generic | |
| 105 | 32 | `way/941854099` (unnamed) · ? · generic<br>`way/588363944` (unnamed) · ? · generic<br>`way/588363945` (unnamed) · ? · generic | |
| 106 | 29 | `way/260288452` (unnamed) · 8 m · generic<br>`way/260288460` 119;129 Sacramento Street · 10 m · generic<br>`way/260288454` 41;43 Drumm Street · 11 m · generic | |
| 107 | 29 | `way/148668323` (unnamed) · ? · reface brick<br>`way/148668306` (unnamed) · ? · reface brick<br>`way/148668314` 617;619 Sansome Street · 9 m · reface brick | |
| 108 | 29 | `way/260288453` 17 Drumm Street · 14 m · generic<br>`way/260288450` 47;49 Drumm Street · 7 m · generic<br>`way/260288455` (unnamed) · 11 m · generic | |
| 109 | 29 | `way/256087385` (unnamed) · ? · reface brick<br>`way/256087378` 712;714 Sansome Street · 10 m · reface brick | |
| 110 | 29 | `way/260930249` (unnamed) · 13 m · reface victorian<br>`way/260930243` (unnamed) · 13 m · reface victorian<br>`way/260930246` (unnamed) · ? · reface victorian | |
| 111 | 28 | `way/256088657` 807 Montgomery Street · 10 m · reface brick<br>`way/256088655` 809 Montgomery Street · 11 m · reface brick<br>`way/256088653` 853;855;857 Montgomery Street · 11 m · reface brick | |
| 112 | 27 | `way/260927793` (unnamed) · 13 m · generic | |
| 113 | 25 | `way/256088154` 56 Gold Street · 9 m · reface brick<br>`way/256088144` 457 Pacific Avenue · 6 m · reface brick<br>`way/256088143` Gold Street · 7 m · reface brick | |
| 114 | 25 | `way/1279452199` 235 Front Street · 7 m · generic | |
| 115 | 24 | `way/260930239` (unnamed) · 13 m · reface victorian<br>`way/260930241` (unnamed) · 13 m · reface victorian<br>`way/260930244` (unnamed) · 13 m · reface victorian | |
| 116 | 23 | `way/260925339` 672;674 Sacramento Street · ? · generic<br>`way/260925340` 666;668 Sacramento Street · ? · generic | |
| 117 | 23 | `way/260930252` (unnamed) · ? · reface victorian<br>`way/260930236` (unnamed) · 13 m · reface victorian<br>`way/260930237` (unnamed) · 13 m · reface victorian | |
| 118 | 22 | `way/256086585` (unnamed) · 6 m · generic | |
| 119 | 22 | `way/148668320` (unnamed) · ? · reface brick<br>`way/148668315` (unnamed) · 11 m · reface brick<br>`way/148668307` (unnamed) · ? · reface brick | |
| 120 | 22 | `way/256088139` 406;408 Jackson Street · ? · reface brick<br>`way/256088145` (unnamed) · 12 m · reface brick<br>`way/260937906` (unnamed) · 9 m · reface brick | |
| 121 | 21 | `way/148666784` (unnamed) · 12 m · reface brick<br>`way/260937901` (unnamed) · 10 m · reface brick | |
| 122 | 21 | `way/148668310` (unnamed) · 11 m · reface brick | |
| 123 | 21 | `way/588363946` (unnamed) · ? · generic<br>`way/588363948` (unnamed) · ? · generic<br>`way/588363947` (unnamed) · ? · generic | |
| 124 | 21 | `way/690663635` (unnamed) · ? · generic | |
| 125 | 21 | `way/148712649` (unnamed) · 12 m · reface chicago<br>`way/690644021` (unnamed) · 11 m · reface None<br>`way/690644022` (unnamed) · 7 m · reface None | |
| 126 | 20 | `way/256088652` 831 Montgomery Street · 7 m · reface brick<br>`way/256088650` 501;503 Pacific Avenue · 5 m · reface brick | |
| 127 | 19 | `way/940068788` (unnamed) · ? · generic | |
| 128 | 19 | `way/256088149` 48 Gold Street · 6 m · reface brick<br>`way/260937903` 440;444 Jackson Street · 5 m · reface brick<br>`way/260937910` 458 Jackson Street · 5 m · reface brick | |
| 129 | 18 | `way/260930238` (unnamed) · 13 m · reface victorian<br>`way/260930235` (unnamed) · ? · reface victorian<br>`way/260930254` (unnamed) · 13 m · reface victorian | |
| 130 | 16 | `way/260937904` (unnamed) · 9 m · reface brick<br>`way/260937899` (unnamed) · 11 m · reface brick<br>`way/260937908` (unnamed) · 8 m · reface classical | |
| 131 | 15 | `way/260288459` (unnamed) · 11 m · generic | |
| 132 | 15 | `way/260280328` (unnamed) · 13 m · reface brick | |
| 133 | 12 | `way/260930245` (unnamed) · 13 m · reface victorian<br>`way/260930251` (unnamed) · 13 m · reface victorian<br>`way/260930253` (unnamed) · 12 m · reface victorian | |
| 134 | 12 | `way/260930248` (unnamed) · 13 m · reface victorian<br>`way/260930247` (unnamed) · ? · reface victorian<br>`way/260930242` (unnamed) · 13 m · reface victorian | |
| 135 | 12 | `way/260930255` (unnamed) · 13 m · reface victorian | |
| 136 | 12 | `way/260930256` (unnamed) · 13 m · reface victorian<br>`way/260930250` (unnamed) · 13 m · reface victorian | |
| 137 | 6 | `way/944039726` (unnamed) · 4 m · generic | |
| 138 | 6 | `way/944032193` (unnamed) · 4 m · generic | |
| 139 | 5 | `way/1279459280` (unnamed) · 4 m · generic | |
| 140 | 5 | `way/1240834459` (unnamed) · 4 m · generic | |
