# URL parameters and debug handles

Read in `src/main.ts` unless noted. Scraped from source, not from memory.

## Where you are

| param | values | notes |
|---|---|---|
| `city` | a city id | default `san-francisco`; ids are in `tools/cities.ts` |
| `at` | `lat,lon` | starts on the rideable street nearest the point |
| `start` | edge id | start on a specific edge instead of the city's own start |
| `advance` | metres | walk the navigator forward before the first frame, in 0.25 m steps at 4.2 m/s |
| `turn` | `left` `straight` `right` | the turn `advance` takes at the first junction |
| `view` | `high` `ride` | `high` is a raised camera for judging the city rather than riding it |
| `freeze` | `1` | hold the rider still — the shot harness needs the same frame every time |
| `device` | `bike` `treadmill` | |

## What is drawn

| param | values | notes |
|---|---|---|
| `crowd` | `none` `some` `busy` `crowded` | `perKm` 0 / 26 / 58 / 95, spawn range 0 / 150 / 165 / 260 m. Defaults to the traffic level. One value for the whole city. |
| `bodies` | N | baked avatar-kit variants, **default 10**. Built serially on a worker, so more costs load time. Drawn to `RANGE = 115` m; extra detail (eyes, brows) inside `NEAR = 22` m. |
| `traffic` | `none` `some` `busy` | `TRAFFIC` in `sim/traffic.ts` |
| `cars` | `1` | cars are OFF by default — *"their straight-line driving looked wrong, and a city without them is a better ride"*. Trains and trams are unaffected. |
| `veg` | N | canopy level, **default 3** |
| `vegmerge` | `0` | turn off the vegetation merging of BUGS #205, to measure without it |
| `without` | comma list | `ao` `fountains` `fringe` `furniture` `landmarks` `life` `plants` `rain` `rider` `signs` `sky` `trees` — `?without=rider` is how the city is compared with and without the avatar kit |
| `time` | `dawn` `day` `dusk` `night` | |
| `weather` | `clear` `overcast` `rain` | |
| `far` | metres | view distance (`render/photo.ts`) |
| `fog` | `off` | (`render/photo.ts`) |

## Debug overlays

| param | values | notes |
|---|---|---|
| `paths` | `1` | ride-graph overlay; `J` toggles it (`render/pathmap.ts`) |
| `pick` | `1` | make meshes pickable, for `window.__pick` |
| `profile` | `1` | `src/profile.ts` |
| `burst` | `1` | unbounded tile building |

## Showcases — separate entry points, no city loaded

| param | extras | what |
|---|---|---|
| `model=<name>` | `size` (default 200), `time` | one builder on its own plot. Needs `planFor` to get a real footprint, or it builds on a square. |
| `trees` | `lod` (0/1/2) | the tree library |
| `palms` | `lod`, `view=close` | the palm generators |
| `showcase` | `style` | the facade styles |

## Platform

`session`, `dandyhorse` — Dandyhorse integration (`src/platform.ts`).

## Not a URL param

`VITE_CACHE=<name>` is an environment variable giving a dev server its own `cacheDir`. Needed because Vite
serves dep chunks immutable and a hard reload does NOT clear them — **only an incognito window does**. Never
run a second `vite --force` against a live project.

## `window.__*` handles

```
__Ray  __board  __boats  __bringStats  __cityIdle  __cityObj  __clock  __crowd  __heightAt  __here
__jump  __landmarks  __life  __marks  __pick  __pickBuilding  __pkg  __placed  __plants  __ride
__route  __routeLeft  __scene  __signs  __statues  __t  __terrainStats  __tiles  __trains
__transit  __travelled  __view  __viewHere  __viewLocal
```

The ones that come up most: `__marks` (load stages and heap), `__pick(x, y)` (what mesh is under a screen
point — needs `?pick=1`), `__jump(lat, lon)` and `__view`/`__viewLocal` (move the camera; these call
`streamAt` so tiles follow), `__bringStats()` (per-tile ingest timing), `__terrainStats`, `__heightAt(x, z)`,
`__pkg` (the loaded package), `__life.addStops([{x, z}])` (put a transit stop on a line that has none,
without a bake).
