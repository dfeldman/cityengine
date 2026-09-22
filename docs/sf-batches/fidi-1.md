# fidi-1: buildings to model one by one


Generated from docs/sf-targets.json (tools/sf-targets.ts). Every unmodelled tall or civic building and every named park or plaza in the district, tallest first. The user's bar: every building in downtown/FiDi, the waterfront and Chinatown gets a decision — its own generator, or which facade style (see docs/sf-batches/BRIEF.md).

| # | kind | name | osm | height m | levels | lat, lon | tags | status |
|---|---|---|---|---|---|---|---|---|
| 1 | tall | California Center | way/588355355 | 212 | 48 | 37.792608, -122.400423 | building=yes | BAILED — see fidi-1-hard.md (twin needle-spire crown) |
| 2 | tall | 50 Fremont Center | way/288716396 | 183 | 43 | 37.790517, -122.397244 | building=office | DONE — model fiftyFremontCenter (granite-eighties) |
| 3 | tall | Park Tower at Transbay | way/611390934 | 183 | 43 | 37.790427, -122.394302 | building=office | DONE — model parkTowerTransbay (modern-slender) |
| 4 | tall | Chevron Tower | way/32963382 | 175 | 40 | 37.789605, -122.400457 | building=yes | done by market-east — removed from fidi-1.json per lead's note (Market St building); builder left in fidi-1.ts, unused |
| 5 | tall | 44 Montgomery Street | way/32963370 | 172 | 43 | 37.789681, -122.401838 | building=office | done by market-east — removed from fidi-1.json per lead's note; builder left in fidi-1.ts, unused |
| 6 | tall | One Sansome Street | way/32963344 | 171 | 0 | 37.790471, -122.401236 | building=yes | done by market-east — removed from fidi-1.json per lead's note; builder left in fidi-1.ts, unused |
| 7 | tall | One Front Street | way/148710877 | 171 | 0 | 37.791691, -122.398764 | building=office | done by market-east — removed from fidi-1.json per lead's note; builder left in fidi-1.ts, unused |
| 8 | tall | First Market Tower | way/32946570 | 169 | 39 | 37.790398, -122.399276 | building=yes | done by market-east — removed from fidi-1.json per lead's note (Market St building); builder left in fidi-1.ts, unused |
| 9 | tall | McKesson Plaza | way/32946671 | 161 | 38 | 37.788792, -122.402683 | building=office | already modelled — market-mid.json ("onePostStreet"), same way id; not duplicated here |
| 10 | tall | 50 California Street | way/32612484 | 159 | 37 | 37.794056, -122.397297 | building=commercial | done by market-east — removed from fidi-1.json per lead's note; builder left in fidi-1.ts, unused |
| 11 | tall | 425 Market | way/32946526 | 156 | 38 | 37.791218, -122.398233 | building=office roof=flat | done by market-east — removed from fidi-1.json per lead's note (Market St building); builder left in fidi-1.ts, unused |
| 12 | tall | Pacific Gas & Electric Building | way/260291405 | 154 | 34 | 37.791789, -122.395797 | building=office | DONE — model pgeBuilding (granite-eighties) |
| 13 | tall | One Montgomery Tower | way/148716020 | 152 | 38 | 37.789201, -122.403399 | building=office | already modelled — market-mid.json ("oneMontgomeryTower"), same way id |
| 14 | tall | 333 Bush | way/132125167 | 151 | 43 | 37.790603, -122.403076 | building=yes | DONE — model threeThreeThreeBush (deco-setback) |
| 15 | tall | 58 Main Street | way/260291408 | 151 | 3 | 37.792051, -122.395866 | building=yes | DONE — restyle bauhaus (OSM height/levels disagree; no photo; treated as low block) |
| 16 | tall | 45 Fremont Center | way/32946535 | 149 | 0 | 37.791247, -122.397253 | building=office | already modelled — market-east.json ("fremont45"), same way id |
| 17 | tall | 333 Market | way/288505729 | 149 | 33 | 37.791938, -122.397406 | building=office | already modelled — market-east.json ("market333"), same way id |
| 18 | tall | 555 Mission Street | way/80296761 | 148 | 34 | 37.788519, -122.398443 | building=yes | DONE — model fiveFiveFiveMission (glass-tower) |
| 19 | tall | 100 Pine Center | way/944025918 | 145 | 32 | 37.792679, -122.398996 | building=yes | already modelled — market-east.json ("pine100"), same way id |
| 20 | tall | 650 California Street | way/260520160 | 142 | 33 | 37.792907, -122.405183 | building=yes | DONE — model sixFiftyCalifornia (granite-eighties) |
| 21 | tall | One California Street Building | way/32612471 | 140 | 0 | 37.793215, -122.397177 | building=yes | already modelled — market-east.json ("oneCalifornia"), same way id |
| 22 | tall | Providian Financial Building | way/32862919 | 138 | 30 | 37.791029, -122.394921 | building=yes | BAILED — see fidi-1-hard.md (sawtooth crenellated crown) |
| 23 | tall | 505 Montgomery Street | way/260925344 | 134 | 24 | 37.793977, -122.40336 | building=yes | BAILED — see fidi-1-hard.md (angled sliced crown with lattice cresting) |
| 24 | tall | 123 Mission Street | way/192026933 | 133 | 29 | 37.791773, -122.394431 | building=office roof=flat | DONE — model oneTwentyThreeMission (granite-eighties) |
| 25 | tall | 350 Mission Street | way/226514310 | 129 | 27 | 37.79085, -122.396749 | building=commercial | DONE — model threeFiftyMission (glass-tower) |
| 26 | tall | JPMorgan Chase Building | way/79377216 | 128 | 30 | 37.78879, -122.399555 | building=yes | DONE — model jpMorganChase (glass-tower, heavy grid) |
| 27 | tall | 595 Market Street | way/941649701 | 125 | 28 | 37.789233, -122.400796 | building=yes | already modelled — market-mid.json ("fiveNinetyFiveMarket"), same way id |
| 28 | tall | 101 Montgomery | way/132125159 | 123 | 28 | 37.790364, -122.40249 | building=yes | BAILED — see fidi-1-hard.md (wavy curved-bay facade, rounded pointed crown) |
| 29 | tall | 601 California Street | way/32859640 | 122 | 20 | 37.792243, -122.404785 | building=yes | DONE — model sixZeroOneCalifornia (midcentury-slab) |
| 30 | tall | 388 Market Building | way/1279504526 | 118 | 24 | 37.79227, -122.398066 | building=yes | already modelled — market-east.json ("market388"), same way id (also covers way/288505730, way/288505726) |
| 31 | tall | 535 Mission Street | way/127460048 | 115 | 27 | 37.788885, -122.398104 | building=yes | DONE — model fiveThreeFiveMission (modern-slender) |
| 32 | tall | 199 Fremont | way/192883913 | 115 | 0 | 37.789948, -122.394785 | building=yes | BAILED — see fidi-1-hard.md (crenellated sawtooth top) |
| 33 | tall | 456 Montgomery Street | way/151183779 | 114 | 22 | 37.793542, -122.402606 | building=yes | DONE — model fourFiftySixMontgomery (concrete-piers) |
| 34 | tall | Hilton San Francisco Financial District | way/260922316 | 111 | 32 | 37.795142, -122.404297 | building=hotel | BAILED — see fidi-1-hard.md (flared brutalist base, twin chimney crown) |
| 35 | tall | 401;425 California Street | way/260283289 | 109 | 0 | 37.792829, -122.401405 | building=yes | DONE — model fourZeroOneCalifornia (midcentury-slab) |
| 36 | tall | 100 Montgomery | way/132125166 | 108 | 25 | 37.790381, -122.401791 | building=yes | already modelled — market-mid.json ("hundredMontgomery"), same way id |
| 37 | tall | 50 Beale Street | way/256065251 | 105 | 23 | 37.791307, -122.396505 | building=commercial | DONE — model fiftyBeale (glass-tower) |
| 38 | tall | (unnamed) | way/132125163 | 104 | 0 | 37.79077, -122.40194 | building=yes | DONE — model oneThirtyMontgomery (deco-setback); this is 130 Montgomery Street |
| 39 | tall | 555 Market Street | way/32946577 | 104 | 0 | 37.789978, -122.400009 | building=yes | already modelled — market-east.json ("market555"), same way id |
| 40 | tall | 135 Main Street | way/192026935 | 104 | 0 | 37.791574, -122.394206 | building=yes | DONE — model oneThirtyFiveMain (glass-tower); no reference photo found |
| 41 | tall | Stevenson Place | way/149840694 | 103 | 0 | 37.789303, -122.399777 | building=yes | already modelled — market-east.json (restyle skyscraper), same way id |
| 42 | tall | 655 Montgomery Street | way/256072715 | 103 | 22 | 37.795244, -122.403714 | building=office | BAILED — see fidi-1-hard.md (pyramidal tent-shaped massing, Le Méridien hotel) |
| 43 | tall | Commercial Union Assurance Building | way/32859357 | 101 | 16 | 37.792111, -122.403053 | building=yes | DONE — model commercialUnionAssurance (edwardian-terracotta) |
