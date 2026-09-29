# Marriott Marquis — the "jukebox", and why the preset must go

Mission at 4th. `relation/6483285`, 133 m, 33 levels.

**Deferred by the owner, 2026-09-23, but recorded now because the observation was in hand:** *"we can
postpone this building, but it needs hand modeling at some point… supplying a pic while it's on my mind."*

## Why it matters

It **dominates the area**. It stands on the Mission frontage a block from Yerba Buena, it is visible from the
gardens, from both decks and from most of SoMa, and its silhouette is the single most recognisable roofline
in the district. A rider anywhere in this part of the city has it in view.

## Its current treatment is wrong

`marriottMarquis` is a **`setbacks` preset** from the tierA recipes, and `docs/sf-queue.csv` marks it
**`done`**. It is not done: a parametric setback recipe cannot produce any of what follows, and the crown is
the whole point of the building.

This is the clearest instance of the pattern the surroundings audit found — *"Marriott Marquis, Moscone West
and St Regis are presets, not models"* — where a `done` row hides a recipe standing in for a landmark.

**Re-staged to `scratch`.**

## The form, from the owner's obliques

**A ziggurat made of many boxes.** Individually trivial geometry; the difficulty is quantity and rhythm, not
curvature — so it needs **hand modelling but not exotic tools**, unlike the Yerba Buena work.

1. **A stepped ziggurat** of rectangular masses, setting back repeatedly as it rises, with the steps reading
   as stacked boxes rather than a smooth taper.
2. **A smaller second tower to the left, connected, L-SHAPED in plan** — part of the same building, not a
   neighbour. Easy to drop and it would leave the composition lopsided.
3. **The top of the ziggurat is a GLASS BOX.**
4. **Vertical window slits topped with HALF-CIRCLE LIDS on each setback** — a tall narrow slot capped by a
   fan/half-round head, repeated at every step. This is the building's signature motif and the thing that
   makes it recognisable at distance. Nothing in the kit says it; `archedPane` is the nearest relative and
   draws facing −z (BUGS.md #101, #135 — check the convention).
5. **The final setback — the main tower's core — is OFFSET from the ziggurat below it**, and that offset
   opens **an enormous vertical window slit near the corner**, running the building's full upper height.
   This is the detail that would never be guessed and is the most striking thing about it close up.

## How to build it when the time comes

- The boxes want a **loop over a setback table**, not fifty hand-placed calls — derive each step's inset and
  height from the one below.
- The **slit-with-half-round-head** wants to be a small reusable part; it repeats at every setback and will
  recur on other American towers of this vintage.
- Get the **offset core and its corner slit** right before any detail: it is the silhouette.
- The `notch` kit part (added 2026-09-23) is the right tool for the offset, and `offsetRing` — **not**
  `insetRing`, which is provably wrong on a notched ring — for the setbacks.
