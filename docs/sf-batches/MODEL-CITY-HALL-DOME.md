# Model: the dome of San Francisco City Hall (Arthur Brown Jr., 1915)

Evidence pack, 2026-10-26, for the dome stage of `cityHall` in `src/render/landmarks/sf/city-hall.ts` (the block,
portico and pavilions were already modelled; the dome, drum and lantern were a kit `dome()` over a prism and were
rebuilt from these photographs). Manifest entry: `public/landmarks/san-francisco.json`, OSM relation/7261820,
`front: 90` (the Polk Street portico faces the plaza on local −z), `height: 94`.

## Photographs (Wikimedia Commons; reference only, never material)

| file | what it shows | author · licence · date |
|---|---|---|
| [Dome of San Francisco City Hall - San Francisco, CA - DSC01290.JPG](https://commons.wikimedia.org/wiki/File:Dome_of_San_Francisco_City_Hall_-_San_Francisco,_CA_-_DSC01290.JPG) | the whole dome stage three-quarter from the plaza corner: drum, attic, dome, lantern and spire with the block's cornice and a pavilion pediment | Daderot · CC0 · 2013-11-05 |
| [Dome of San Francisco City Hall - San Francisco, CA - DSC01299.JPG](https://commons.wikimedia.org/wiki/File:Dome_of_San_Francisco_City_Hall_-_San_Francisco,_CA_-_DSC01299.JPG) | the dome stage close, straight on: the paired columns, pedimented windows, the garland attic with its urn pedestals, the ribs, cartouches and oculi, the crown balustrade and the lantern | Daderot · CC0 · 2013-11-05 |
| [San Francisco City Hall - Dec. 2025.jpg](https://commons.wikimedia.org/wiki/File:San_Francisco_City_Hall_-_Dec._2025.jpg) | the Polk Street front in elevation (long lens): the dome over the portico, used for the stage heights | 9yz · CC BY-SA 4.0 · 2025-12-23 |
| [San Francisco City Hall dome.jpg](https://commons.wikimedia.org/wiki/File:San_Francisco_City_Hall_dome.jpg) | the dome from the far end of Civic Center Plaza, as a rider sees it: what has to read at 300 m | Torbjörn Jörgensen (Flickr) · CC BY-SA 2.0 · 2009-12-18 |

All four opened and looked at. No wraps or scaffolding in any; the 2009, 2013 and 2025 pictures agree.

## What the dome is, top down (from the photographs)

1. **Finial and spire.** A gilt urn-and-ball finial on a slim dark lead spire, octagonal, with a gilt ornament collar
   where it leaves the lantern roof.
2. **Lantern.** A small square tempietto: gilt columns in pairs at its four corners (eight), a dark lead core with an
   arched opening on each face, a gilt entablature, gilt urns at the corners, then a concave lead roof rising into
   the spire.
3. **Crown.** A gilt-and-blue iron balustrade rings the dome's top round the lantern's foot.
4. **The dome.** Lead-grey (pale blue-grey in sun), taller than a hemisphere, rising nearly vertically off its foot. Its
   ribs are gilt mouldings in PAIRS — two gilt lines about a metre apart over each column pair — so 16 rib pairs.
   Between them, in each of the 16 panels, a round oculus with a gilt frame high up and a gilt cartouche with
   swags below it. A gilt band runs round the foot of the dome, and the ribs' feet stand on it.
5. **The attic.** A plain stone band above the entablature with a sculpted garland panel in each bay and, over each
   column pair, a pedestal carrying a tall stone urn; the dome's foot is set in from the attic.
6. **The drum.** SIXTEEN bays (counted from the Dec. 2025 elevation: window centres at 0°, ±22.5°, ±45°, ±67.5°):
   a window with a triangular pediment in each bay between PAIRS of fluted Doric columns standing proud of the
   drum wall, each pair under its own break (ressaut) in the entablature. A stone balustrade rings the foot of the
   drum on the podium.
7. **The podium.** A square base with a pedestal at each corner carrying an urn, on the block's roof.

## Measurements used

Total 93.7 m (307 ft) to the finial. Dome diameter about 34 m across the drum, taken as: dome foot 32 m across
(r 16), drum wall r 17, column ring r 18.6, entablature r 18.2 / 19.1 over the pairs, foot balustrade r 20.4.

Stage heights read off the Dec. 2025 elevation in proportion (block cornice to finial = 1155 px = 65.2 m,
0.0565 m/px), rounded and fitted to the builder's block (roof attic at 28.5 m):

| stage | metres | from |
|---|---|---|
| podium (square base and corner pedestals) | 28.5 – 36.5 | 160 px |
| drum plinth and foot balustrade | 36.5 – 39.5 | 50 px |
| colonnade (paired Doric, 16 pairs) | 39.5 – 51.5 | 220 px |
| entablature | 51.5 – 54 | 45 px |
| attic (garlands, urn pedestals; urns to 61) | 54 – 58 | 70 px |
| dome, foot band to crown rim | 58 – 72.8 | 220 px foreshortened; built taller than a hemisphere (rise 14.8 on r 16) |
| crown balustrade and lantern foot | 72.8 – 74.5 | 30 px |
| lantern (columns 74.5–80, entablature to 81.5, roof to 84.5) | 74.5 – 84.5 | 195 px |
| spire | 84.5 – 91.5 | 90 px |
| finial | 91.5 – 93.7 | 65 px |

Colours: gilt `[0.82, 0.66, 0.24]` (the `GILT` the other SF builders use); the dome's lead `[0.5, 0.55, 0.62]`;
the spire and lantern roof a darker lead `[0.38, 0.42, 0.48]`; stone as the block's `GRANITE`.

## Recognisability test (written before the first screenshot)

1. a lead-grey dome with gilt ribs, taller than a hemisphere, over a colonnaded drum;
2. paired columns with pedimented windows between them, and urns on the attic over the pairs;
3. a gilt tempietto lantern with a dark spire and gilt finial.

## Cost

`tests/landmarks.test.ts` holds every builder under 25,000 triangles; the whole of City Hall, dome included, must
stay under it (it was 16,464 with the kit dome).
