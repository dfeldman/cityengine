# skp2glb — getting a landmark model into the game

The landmark loader (`src/render/landmarks.ts`) takes glTF. Most 3D Warehouse models are SketchUp files.
This is the repeatable route from a download to `public/landmarks/<city>/<name>.glb`.

**Downloads are the user's, per file.** 3D Warehouse needs your own signed-in session; nothing here
fetches anything. Record the source URL, author and licence of every model in the manifest entry and in
`CREDITS.md`.

## 1. Prefer a non-SKP download

The model page's download menu often offers glTF (`.glb`), Collada (`.dae`) or `.kmz` (a zip with a `.dae`
inside) beside the SketchUp versions. Take one of those if it is there — it skips step 3 entirely.

## 2. Convert with Blender headless

```
blender -b --python tools/skp2glb/convert.py -- ~/Downloads/model.dae public/landmarks/paris-marais/pont-marie.glb --tris=60000
```

Reads `.dae`, `.kmz`, `.glb`/`.gltf` (and `.skp` with the add-on in route b). Applies transforms, fixes the
units (SketchUp exports are often inches with the unit dropped — `--unit=inch` forces it; `auto` assumes
inches when the model is over 400 m tall), stands the model centred on the origin with its base at 0, joins
it into one mesh, triangulates, decimates to the budget, caps textures at 2048², and exports `.glb` Y-up.

Tested: a synthetic 10 × 20 × 46 m block written in inches converts to 10.0 × 20.0 × 46.0 m, base 0.

## 3. `.skp` only — two routes, your choice

- **(a) SketchUp on the Mac.** Open the file, *File → Export → 3D Model → Collada (.dae)* (the free desktop
  versions can; Pro can also export glTF directly), then step 2. The fallback when (b) cannot read a newer
  file version.
- **(b) Blender's community SketchUp Importer add-on**, which wraps the free SketchUp C SDK. Install it once
  (Edit → Preferences → Add-ons → Install from disk); `convert.py` then reads `.skp` directly. This is the
  route to script.

## 4. Check it before it goes in the manifest

```
node --experimental-strip-types tools/skp2glb/check.ts public/landmarks/paris-marais/pont-marie.glb --footprint=34x92 --height=15
```

Prints the size in metres, triangles, textures and where the base is. With `--footprint` (the OSM building's
two plan dimensions) and `--height` it fails when the model is more than 15% off — which means wrong units
(×39: inches) or wrong axis (the z extent matches the height: exported Z-up), not "a bit off".

## 5. The licence

3D Warehouse's General Model Licence is **not** a Creative Commons licence. It permits use in a project and
limits redistributing the model file itself — and shipping a `.glb` under `public/` is redistribution. Put the
licence text and author in the manifest entry (`licence`, `author`, `source`); `npm run landmarks` prints the
credit lines and flags every non-CC licence so it can be decided per model. Prefer models whose author set a
CC licence.

## The manifest entry

```json
{ "osm": ["way/…"], "name": "Pont Marie", "file": "pont-marie.glb", "scale": 1, "rotateDeg": 0,
  "offset": [0, 0, 0], "source": "https://3dwarehouse.sketchup.com/model/…", "licence": "…", "author": "…" }
```
