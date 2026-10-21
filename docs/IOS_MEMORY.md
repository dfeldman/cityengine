# The iOS crash: what was actually wrong, and what still is not explained

Owner, 2026-10-20: *"Still always crashes on iOS. It's fine at the beginning but if I go a few blocks down
the hill (even slowly) it always crashes. We did have this working at one point so I know it's possible."*
And earlier: *"it usually works right until we have to display custom buildings... instant crash when heap
exceeds 384mb."*

Everything below is measured with a production build in Chromium at a 390x844 viewport on the `ultra` tier,
because Safari exposes no instrumentation at all. Scripts are in the session scratchpad; the method matters
more than the files, so it is written out here.

## The one measurement that changed the picture

Three numbers get confused in this area, and conflating them sent me down a wrong path for a while:

| | what it is | on this tier |
|---|---|---|
| **retained heap** | what survives a forced collection — what a phone must actually hold | **138–185 MB** |
| **live heap** | retained plus whatever garbage V8 has not felt like collecting yet | sawtooths to ~700 MB |
| **footprint** | retained heap plus every GPU buffer and texture | ~470–550 MB |

The live heap figure is close to worthless for predicting a phone. Desktop V8 has gigabytes to play with,
so it lets rubbish pile up; JSC with a hard 384 MB ceiling collects instead. I spent a round of work trying
to slow allocation down (`buildMs`, below) on the strength of that number, and it bought nothing.

The honest measurement is to force a collection every ~120 ms for five minutes of riding, so garbage never
accumulates, and watch the floor. Doing that:

```
618 forced-GC samples over 300s, 1.34 km ridden, down Nob Hill into the Financial District
retained heap: min 138 | median 147 | p95 153 | PEAK 161 MB
over 300 MB: 0 samples | over 384: 0
```

**There is no transient spike, and there is no leak.** Riding 5 km, tiles held plateau at 63, geometries at
~2650, meshes at ~4030, textures at 90 MB, and retained heap sits still. 12 landmark models loaded during
the run above and not one of them moved the floor. So "a few blocks down the hill" is not the heap growing.

## What was genuinely wrong, and is now fixed

Three real things, worth about 157 MB of GPU and 47 MB of heap between them:

1. **The buildings' name plates — 133 MB of GPU texture.** Each plate is a `DynamicTexture` sized to its
   own text, and some are enormous: "UNITED STATES POST OFFICE" at 2552x280, "CHANCELLOR HOTEL" at
   192x2659. 53 of them came to 110 MB. The tier's `without` already said `'signs'`, but that is a
   different system — the text atlas in `render/signs.ts` — so `render/sign-plates.ts` had never been gated
   by anything at all. Textures 225 -> 90 MB, GPU total 430 -> 297 MB.

2. **Orphaned morph target managers — 23.7 MB of GPU texture.** A `MorphTargetManager` keeps its targets in
   a float texture array and registers itself on the scene. Neither `mesh.dispose()` nor nulling
   `mesh.morphTargetManager` releases it, so every kit body built to bake an animation from left its
   expression targets uploaded for the life of the ride. 61 of them, none reachable. Fixed here and in
   avatarkit, so a disposed avatar takes its morphs with it.

3. **Twelve people nobody asked for.** The tier asks for `bodies: 0` and no crowd, and was still building
   four cable car passengers (gated only on `off.has('life')`) and eight beach loungers (gated by its own
   name rather than by `'crowd'`). Each is a full MakeHuman body carrying a copy of the body's vertex moves
   per expression unit per face part. Array buffers 74.0 -> 34.3 MB, morph data 22.7 -> 1.2 MB, **retained
   heap total 230.0 -> 183.1 MB**.

## What did not work, recorded so nobody tries it twice

- **Throttling the tile build budget.** The theory was that if the live heap sawtooths past 384 while
  retained sits still, the city is making garbage faster than the collector takes it away, so building more
  slowly would lower the peak. Dropping the phone's budget from 7 ms to 2 moved the peak from 737 to 687 MB
  and put *more* samples over 384. `?buildms=` is still there to try on a real device, but it is not the
  lever. Every tier is back at 7.
- **A general texture ceiling** (`textureMax`, for textures that arrive inside a model file and have no URL
  for the existing rules to match). Correct in principle and kept as insurance, but worth nothing today:
  with the name plates gone, exactly one texture on the whole tier is over 1024, at 5.5 MB. The 110 MB of
  oversized textures that sent me looking here were the plates, and a `DynamicTexture` never passes through
  the upload hook this works by.

## What is still not explained

The retained heap is now ~150 MB with more than 200 MB of headroom under the owner's 384, and it does not
grow with distance. So if the crash is still a *heap* limit, the mechanism is not anything measured here.

The likelier reading is that the 384 MB ceiling is being hit as a **process footprint**, not as a JS heap:
footprint was ~660 MB before this work and is ~500 MB after, and the biggest single item left is **205 MB
of GPU vertex buffers** for 63 tiles held. That is where to look next, and the lever is the mid ring
(`minMid`, currently 1) rather than anything in the heap.

What would settle it: a real device. Everything above is Chromium pretending to be a phone, and the one
number that matters — whether an actual iPhone still dies a few blocks down the hill — cannot be measured
from here.
