# What to draw for a building, from street photographs (v4)

Each question below sets one thing a game draws for this building. Say `cannot_tell` whenever the photographs do not
actually show the answer — it is a correct answer, and a confident wrong answer is the worst outcome.

## Files
- Menus and what each value means: `/Users/dfeldman/cityengine/data/appearance/research/menus-v4.json`. Read it first.
- Your buildings are listed in your task, each with its MAPPED SIZE (footprint narrow side x long side, and height; the
  street front is usually the narrow side). Photographs for `way/123`:
  `/Users/dfeldman/cityengine/tools/cache/appearance-r2/way-123/` (one to three .jpg). Do ONE building at a time: list
  its folder, open all its photographs with the Read tool, write its line, then go on to the next.

## Step 1: find the target
The target is between the two RED DASHED VERTICAL LINES. Several photographs of one building are different
viewpoints of the same building. In the clearest photograph, answer:
- `buildings_between_lines`: how many separate buildings stand between the lines (a seam where height, colour, roof
  or style changes means a new building);
- `target_hidden`: no / partly / mostly;
- `matches_size`: does the building you will describe match the mapped size given in your task?
If there is more than one building between the lines, describe the one that matches the mapped size, if one does.

## Step 2: look before you answer
Write three short evidence fields, a few words each, from what you can see:
- `seen_top`: what the top edge of the front looks like (e.g. "deep cornice on brackets", "flat coping", "gable");
- `seen_ground`: what is at street level (e.g. "two garage doors and a door", "row of shop windows with signs");
- `seen_bays`: any windows projecting from the wall, and their shape.

## Step 3: answer
`generic_fit`, `homes_above`, `type`, `wall_colour`, `ground_colour`, `surface`, `windows`, `ground_floor`, `top`,
`bays`, `bay_shape`, `balconies`, `fire_escape`, `awnings`, `awning_colour`, `colour_panels` — exactly as
menus-v4.json defines them, about the target's street-facing wall(s), consistent with your evidence fields.
If the target is mostly hidden, answer `cannot_tell` for everything in step 3 except `generic_fit`.

## Output
ONE JSON Lines file at the path in your task, one line per building, in list order, fields in this order, e.g.
{"osm":"way/123","buildings_between_lines":"one","target_hidden":"no","matches_size":"yes","seen_top":"bracketed cornice","seen_ground":"garage and front door up steps","seen_bays":"one angled bay, two storeys","generic_fit":"ordinary","homes_above":"yes","type":"painted_wood_rowhouse","wall_colour":"paleGreen","ground_colour":"same_as_wall","surface":"wood_siding","windows":"tall_sash","ground_floor":"garages","top":"bracketed_cornice","bays":"one_stack","bay_shape":"angled","balconies":"none","fire_escape":"no","awnings":"none","awning_colour":"none","colour_panels":"no"}
Use only menu values (the seen_ fields are free text). Do not edit any other file and do not run git.
