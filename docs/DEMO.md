# The demo — five corridors, and nothing else has to be good

The owner, 2026-09-24, defining the whole of what the demo must show:

> *"for the demo - i want to bike and have great graphics biking down the hill on california street (very
> fast motion), down market street and around fidi (huge unique buildings), chinatown (relatively basic but
> unique architectural style) the waterfront (water and unique buildings like piers and the two bridges),
> presidio and golden gate park (mostly vegetation and ground texture, with some good buildings and landmark
> staircases). that would be more than good enough for the demo."*

**Read that as a scope BOUNDARY, not a wish list.** It is the most economical thing said in this project: it
means a defect outside these five corridors does not block the demo, and polish outside them is waste. With
the budget at 75% on a Thursday, that is the difference between shipping and not.

Each corridor also names *what it is for* — they test five different things, which is why five and not one.

## 1. California Street, downhill, at speed

What it proves: **motion**. Nob Hill down to the Financial District is the steepest sustained thing a rider
will do, and the owner has said before that fast descents must stay smooth and that there are deliberately no
brakes (`streetrunner-descent-goal`). So this corridor is a FRAME-TIME test, not a modelling test.

At speed the failure modes are stutter and pop-in, which is exactly where the tile streaming and the loading
profile land. **This is the corridor the performance work is for.** Measure it at speed, downhill, not
standing still.

## 2. Market Street and the Financial District

What it proves: **the big buildings**, and the most-modelled part of the city. Nearly every tower built this
week is here, and the Market Street corridor is the one the owner named early as the place a rider is
overwhelmingly likely to be (the "on a route" arm of the selection rule).

Largely done. Needs looking at, not building.

## 3. Chinatown

What it proves: **a style, cheaply**. The owner's own framing — *"relatively basic but unique architectural
style"* — is permission to do this with the tag layer and recipes rather than hand models. If Chinatown reads
as Chinatown from the saddle, it is finished. Do not model individual buildings here.

## 4. The waterfront

What it proves: **water, and the silhouettes**. The Embarcadero waterfront, the piers, the Golden Gate and
the Bay Bridge. Note what is NOT in this list: **Embarcadero Center**, the office complex, which the owner
postponed as *"one building out of hundreds"*. The waterfront is the piers and the bridges.

Recently and heavily worked: the ocean (#159), the sea level (#161), all sixteen piers (#181), and graded
subdivision on both bridges (#154). **Most of that is fixed but NOT verified** — the piers need a screenshot
and the bridges need the `BUGS154 —` views with real water. This corridor is where the outstanding
verification debt is concentrated, and it is verification, not new work.


### Corridor 4, amended 2026-09-25: show the bridges, do not ride them

The owner, after riding the Golden Gate: *"Close up, the GG bridge now renders BOTH as a single solid wall
(presumably guessed from OSM) AND the huge low-poly one that renders in the sky... It doesn't look like a
bridge though, it looks like you're biking on a giant wall in the ocean."* And on scope: *"We WILL do Golden
Gate as a realistic rideable route. This is a huge project though and let's get the parks good enough
first."*

So for THIS demo, corridor 4 is the bridges as silhouettes from the waterfront, which is what it was
originally described as — *"water, and the silhouettes"*. That reading still holds and still shows well: the
ocean, the piers, and both bridges across the bay. What has changed is only that the demo should not invite
anyone to ride onto a bridge deck, because #211 is not being fixed before the parks.

The one thing worth doing in the meantime, if it is cheap, is killing the DOUBLE draw (#211) so the bridge
reads as one object rather than two. That is a supersession fix, not a modelling one.

## 5. The Presidio and Golden Gate Park

What it proves: **nature** — and the owner is explicit that here it is *"mostly vegetation and ground
texture, with some good buildings and landmark staircases"*. So the priority order inside this corridor is:

1. **Ground texture.** *"The beach is just grass."* Sand at Ocean Beach and Baker Beach, dirt and duff under
   the Presidio forest. `docs/PARKS.md` section A. Cheap and it is half of what he asked for.
2. **Vegetation.** The trees DO render (verified 2026-09-24 deep inside both parks). What is left is variety
   and the understorey — and the strong suspicion that the "dark shadows with nothing on them" are the
   `ground:occluder` quads, i.e. bug #169, not a planting problem at all.
3. **The landmark staircases.** The Lyon Street Steps, which the owner rates in the city's top ten. Doing the
   stair kit properly serves Filbert, Greenwich, Lincoln Park and the rest for free.

## What this scope excludes

Everything not on the list, and it is worth naming the expensive ones so they are not drifted back into:

- More buildings. The 250 target is closed at ~235-240.
- Embarcadero Center. Postponed by name.
- The island buildings (#175). Needs a bake; not on any corridor.
- Any neighbourhood not listed — the Mission, the Sunset, the Richmond, Twin Peaks, SoMa south of Market.

## How to check the demo is ready

Ride the five corridors, in order, and look. Stills have repeatedly failed to show the defects that matter
here (`docs/STATUS.md`, "a render is a weak instrument"), and corridor 1 is a frame-time problem that a still
cannot show at all. `views/san-francisco.json` should carry a view on each corridor as a cheap regression
check, but the demo itself is judged from the saddle at speed.
