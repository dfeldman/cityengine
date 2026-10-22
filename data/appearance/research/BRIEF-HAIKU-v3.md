# What to draw for a building, from street photographs

Each question below sets one thing a game draws for this building. Say `cannot_tell` whenever the photographs do not
actually show the answer — it is a correct answer, and a confident wrong answer is the worst outcome.

## Files
- Menus and what each value means: `/Users/dfeldman/cityengine/data/appearance/research/menus-v3.json`. Read it first.
- Your buildings are listed in your task, each with its MAPPED SIZE (footprint narrow side x long side, and height; the street front is usually the narrow side). Photographs for `way/123`:
  `/Users/dfeldman/cityengine/tools/cache/appearance-r2/way-123/` (one to three .jpg). Do ONE building at a time: list
  its folder, open all its photographs with the Read tool, write its line, then go on to the next.

## The target
The target is between the two RED DASHED VERTICAL LINES. Use its mapped size to tell it from its neighbours (a 7 m
wide, 10 m tall target is a narrow three-storey house, not the tall block beside it). Several photographs of one
building are different viewpoints of the same building: combine them. If the lines clearly hold two or more different
buildings and none is the target alone: `usable: several_buildings`. If it is hidden: `usable: no`. In both cases
everything else is `cannot_tell`.

## Questions
`usable`, `type`, `wall_colour`, `trim_colour`, `ground_colour`, `surface`, `windows`, `ground_floor`, `top`, `bays`,
`bay_shape`, `balconies`, `fire_escape`, `awnings`, `awning_colour`, `piers`, `colour_panels` — exactly as
menus-v3.json defines them, about the target's street-facing wall(s).

## Output
ONE JSON Lines file at the path in your task, one line per building, in list order, e.g.
{"osm":"way/123","usable":"yes","type":"painted_wood_rowhouse","wall_colour":"paleGreen","trim_colour":"white","ground_colour":"same_as_wall","surface":"wood_siding","windows":"tall_sash","ground_floor":"garages","top":"bracketed_cornice","bays":"one_stack","bay_shape":"angled","balconies":"none","fire_escape":"no","awnings":"none","awning_colour":"none","piers":"no","colour_panels":"no"}
Use only menu values. Do not edit any other file and do not run git.
