# The Japanese Tea Garden's plants, individually (2026-10-27)

Owner: "work on improving the plants in the tea garden. you'll need reference photos and to make custom models for some
individual plants, not just species."

## Reference photographs
Twenty-six from Wikimedia Commons, in `~/assetkit/items_to_model/tea-garden-plants/` (gitignored, as the other photo
sets are) with `sources.json` naming each file, its licence (CC0 for Daderot's DSC series; CC BY-SA 2.0/3.0 for the
rest) and its Commons page. What they show that the garden lacked:

| photo | what |
|---|---|
| 11, 17 | the great black pine leaning out over the Main Pond: a thick trunk reaching over the water, long near-level limbs, big flat clouds of needles |
| 24 | the cloud-clipped juniper (tamazukuri) on a lawn: a thick twisted trunk carrying dense dark domed masses |
| 6, 26 | red Japanese maples (Acer palmatum atropurpureum) by the Temple Gate and the tea house pond |
| 20 | a weeping tree arching over the drum bridge pond |
| 11, 16, 17 | karikomi: clusters of clipped balls of different sizes packed together, massed round the ponds |
| 10 | mondo grass: low dark tufts of fine arching blades edging the banks and paths |
| 3 | stepping stones across a pond; 15: moss as the ground under the trees |

## The models (assetkit)
Each individual is its own library species, built from the photographs, placed where the photographs put it:
- `black_pine_grand` (bushgen, from `niwaki`): 6–7 m, trunk leaning 22°, eight long limbs, 36-twig clouds. treekit gained
  `trunk.lean_dir` so the lean has a fixed direction in the model, and the layout spins each tree to lean over the water.
- `tamazukuri_juniper` (bushgen): 4 m, fir-needle pages in dense crossed cards, nine limbs curving up into domes.
- `red_japanese_maple` (bushgen, from `hazel`): 4–5 m, three stems, the `dark_copper` leaf page tinted crimson.
- `weeping_cherry` (bushgen, from `willow_scrub`): 3.6 m, one trunk, limbs with negative tropism so they arch and hang.
- `karikomi` (plantgen, a NEW `cluster` form): six to ten card domes of different sizes packed within 1.7 m; `bush()` took an
  offset for it.
- `mondo_grass` (plantgen tuft): 0.3 m, dark fine blades.
All are in `OWN_SIZE` (render/plants.ts): a tree-sized bush with the leafy core would carry a green blob.

## Where they stand (`tools/teagarden/layout.py`, its own rng, exported as `HERO`, `KARIKOMI`, `MONDO`)
Two great pines on the Main Pond's west and south banks leaning toward the water; three junipers on the lawns (below the
Temple Gate, by the gift shop, the Sunken Garden); five maples (Temple Gate, tea house pond, Buddha, drum bridge, the
Hagiwara terrace); the weeping tree on the drum pond's west bank; nine karikomi clusters 3–5 m back from the banks and
on Waterfall Hill; 260 mondo tufts along the banks and the path edges. The builder stays at 3,824 triangles; it places
about 900 library plants and rocks.
