# Reference labels v3: what to draw for a building, from street photographs

You are making the REFERENCE labels that cheaper models will be scored against, so care matters more than speed.
Each question below sets one thing the game's renderer draws (a colour, a kind of window, a cornice, bay windows…).
Say `cannot_tell` whenever the photographs do not actually show the answer; a confident wrong answer is the worst
outcome, and `cannot_tell` is never wrong when the evidence is not there.

## Files
- Menus and what each value means: `/Users/dfeldman/cityengine/data/appearance/research/menus-v3.json`. Read it first.
  `colours` gives the hex of every colour name.
- Your buildings are listed in your task, each with its MAPPED SIZE (its footprint, narrow side x long side, and its height; the street front is usually the narrow side). Photographs:
  `/Users/dfeldman/cityengine/tools/cache/appearance-r2/way-123/way-123-01.jpg`, `-02.jpg`, `-03.jpg` for `way/123`
  (some have fewer). List the folder, then open EVERY photograph with the Read tool before answering.

## The target
Each photograph has two RED DASHED VERTICAL LINES at the projected edges of the target's camera-facing walls. Use the
mapped size to pick the target out from its neighbours: a 7 m wide, 10 m tall target is a narrow three-storey house,
not the six-storey block beside it. The photographs are different viewpoints of the SAME building; some are poor.
Combine them. If the lines clearly hold two or more different buildings and none is the target alone, answer
`usable: several_buildings`. If the target is hidden, `usable: no`. Either way, everything else is `cannot_tell`.

## Questions
`usable`, `type`, `wall_colour`, `trim_colour`, `ground_colour`, `surface`, `windows`, `ground_floor`, `top`, `bays`,
`bay_shape`, `balconies`, `fire_escape`, `awnings`, `awning_colour`, `piers`, `colour_panels` — as menus-v3.json
defines them, about the target's STREET-FACING wall(s). For each, also give `conf`: `high` (plainly visible),
`medium` (small, partly hidden or ambiguous) or `low` (a guess — prefer `cannot_tell`).

## Output
ONE JSON Lines file at the path in your task, one line per building, in list order, e.g.
{"osm":"way/123","usable":"yes","best":"way-123-02.jpg","type":"painted_wood_rowhouse","wall_colour":"paleGreen","trim_colour":"white","ground_colour":"same_as_wall","surface":"wood_siding","windows":"tall_sash","ground_floor":"garages","top":"bracketed_cornice","bays":"one_stack","bay_shape":"angled","balconies":"none","fire_escape":"no","awnings":"none","awning_colour":"none","piers":"no","colour_panels":"no","conf":{"type":"high","wall_colour":"high","trim_colour":"medium","ground_colour":"high","surface":"high","windows":"high","ground_floor":"high","top":"high","bays":"high","bay_shape":"medium","balconies":"high","fire_escape":"high","awnings":"high","awning_colour":"high","piers":"medium","colour_panels":"high"},"note":"under 25 words: what decided the hard ones"}
Use only menu values. Do not edit any other file and do not run git. Finish with one line: usable / total.
