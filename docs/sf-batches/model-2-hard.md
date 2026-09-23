| name | osm | height | lat, lon | what makes it hard | reference photo URL |
|---|---|---|---|---|---|
| 601 Van Ness Avenue | way/256477865 | 73 m | (see OSM) | Named building (601 Van Ness = Opera Plaza) is a well-documented 9-storey (~30 m) complex per multiple listing sources — nowhere near the 73 m on the list. Both street photographs also show only low mid-rise buildings (a colonnaded ~6-storey block and a tree-obscured facade), never a ~20-storey tower. Height, name and photos all disagree with each other; not modelled rather than guess which is wrong. | docs/shots/refs/model2/way-256477865.jpg, way-256477865-2.jpg |

## 601 Van Ness Avenue — Opera Plaza (way/256477865), resolved 2026-09-22

Not unresolvable after all, just genuinely strange, which is why no source agreed:

- A large SQUARE block around a raised central courtyard, filling the Van Ness / Turk / Franklin / Golden Gate
  block. The perimeter block is about six storeys of pale precast concrete with punched windows and recessed
  balconies, and a shallow green metal roof band along the top.
- **The whole perimeter block stands on stilts.** The ground level is open: columns, parking under most of the
  footprint, and the cinema (Landmark's Opera Plaza) and shops facing Van Ness. That open undercroft is why
  the street photographs show "low mid-rise walls, never a tower" — the tower is set back and above.
- **Three squarish towers of about eleven storeys** rise out of the block at the corners of the courtyard,
  same pale precast, with rounded-off corners and balconies. These are what the 73 m height refers to.
- The courtyard on top of the podium is a garden deck: paved, planters and small trees, a conservatory, and a
  **swimming pool** at the east end.

Modelling notes: the shape is a podium with a void, so it needs its own geometry rather than a recipe — the
courtyard has to be a real hole and the ground floor has to be open. Worth doing well: it is a 73 m landmark
on Van Ness.

Two things it wants that the game does not have yet, both on the backlog:
- **swimming pools** as a feature (this one, hotel roofs, the Bay Club);
- **riding through the courtyard** — the undercroft and the deck are publicly walkable, so the ride graph
  should be able to cross the block rather than going round it.
