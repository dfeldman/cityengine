# Ride routes — DRAFT, needs the owner's correction

The owner, 2026-09-24: *"we didn't really define routes"* — and without them the criterion "buildings the user
is extremely likely to bike by" cannot be applied. Measured against the full bike graph it is useless: 1023 of
1092 queued buildings sit within 100 m of a rideable edge, because the graph is every street in the city.

**The vocabulary, from the owner:** *"we defined paths, which are POSSIBLE routes. routes are recommended sets
of paths."* So the 8406 rideable edges in `ride-bike.json` are the PATHS — everything a rider physically can
ride. A ROUTE is a curated set of those paths: a recommendation, not a capability. Defining one is therefore
not drawing a new polyline, it is selecting a sequence of edges that already exist.

That also explains why my proximity measurement was meaningless: I measured against the paths, which cover
every street, so of course almost every building was "near" one. Proximity only discriminates once it is
measured against a route.

This is a first draft assembled from things the owner has actually said, not a proposal of my own. Each line
is theirs. **Nothing here is settled; correct it and it becomes the ranking key.**

## Corridors the owner has named

| route | what they said | status |
|---|---|---|
| **Waterfront** | *"we'll also have a route along the waterfront"* | named, not traced |
| **Golden Gate Park & the Presidio** | *"I'm very interested in buildings in or near golden gate or the presidio btw. In the final app, those will be part of the ride route."* | named, not traced |
| **Golden Gate Bridge** | *"remember i want to bike across the bay bridge (east span) and golden gate bridge as well"* | named, not traced |
| **Bay Bridge (east span)** | as above | named; note the east span is outside the current box |
| **Market Street** | *"buildings the user is extremely likely to bike by (eg Market Street)"* | named, not traced |
| **Embarcadero** | implied throughout — the Embarcadero Center work, the Ferry Building, the piers | implied |

## What a defined route needs

A name and an ordered set of path edges — edge ids from the ride graph, or a handful of waypoints the graph can
be routed through, whichever is easier to author and to keep correct when the bake changes. Once one route
exists, ranking the queue by distance to it is a few lines, and the selection rule in `docs/LADDER.md` gains
its fourth test in a usable form.

## Why this matters more than it looks

Three of the four selection tests — significant, prominent, weird — are judgements about a building. This one
is a fact about geography, so it is the only one that can be computed, and it is the one that decides whether
a plain building deserves effort. A dull block on Market Street is worth more than a fine one on a street
nobody rides down, and at present we have no way to tell those apart.
