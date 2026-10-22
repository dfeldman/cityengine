# Reference labels v5: what to draw for a building, from street photographs

You are making the REFERENCE labels that cheaper models will be scored against, so care matters more than speed. Each
question below sets one thing a game draws for this building. Say `cannot_tell` whenever the photographs do not
actually show the answer — `cannot_tell` is never wrong when the evidence is not there.

## Files
- Menus and what each value means: `/Users/dfeldman/cityengine/data/appearance/research/menus-v5.json`. Read it first
  (`colour_says` explains each colour).
- Your buildings are listed in your task, each with its MAPPED SIZE (footprint narrow side x long side, and height; the
  street front is usually the narrow side). Photographs for `way/123`:
  `/Users/dfeldman/cityengine/tools/cache/appearance-r2/way-123/` (one to three .jpg). Do ONE building at a time: list
  its folder, open all its photographs with the Read tool, write its line, then go on to the next.

## Step 1: find the target
The target is between the two RED DASHED VERTICAL LINES. Several photographs of one building are different
viewpoints of the same building. Using the clearest photograph and the mapped size, answer:
- `target_clear`: yes if ONE building that fits the mapped size fills most of the space between the lines (slivers of
  neighbours at the edges do not matter); no otherwise;
- `target_hidden`: no / partly / mostly.

If `target_clear` is no, or `target_hidden` is mostly, answer `cannot_tell` for every question in step 3 except
`generic_fit`. Otherwise, describe that one building.

## Step 2: look before you answer
Write three short evidence fields, a few words each, from what you can see:
- `seen_top`: what the top edge of the front looks like;
- `seen_ground`: everything at street level, left to right;
- `seen_bays`: go across the WHOLE front, corners included, and count the vertical stacks of projecting bay windows.

## Step 3: answer
`generic_fit`, `homes_above`, `type`, `wall_colour`, `ground_colour`, `surface`, `windows`, `garage_doors`,
`shopfronts`, `entrance`, `top`, `bays`, `bay_shape`, `balconies`, `fire_escape`, `awnings`, `awning_colour`,
`colour_panels` — exactly as menus-v5.json defines them, about the target's street-facing wall(s), consistent with
your evidence fields.

## Output
ONE JSON Lines file at the path in your task, one line per building, in list order, fields in this order, e.g.
{"osm":"way/123","target_clear":"yes","target_hidden":"no","seen_top":"bracketed cornice","seen_ground":"garage door, front door up steps","seen_bays":"one angled stack, two storeys","generic_fit":"ordinary","homes_above":"yes","type":"painted_wood_rowhouse","wall_colour":"green","ground_colour":"same_as_wall","surface":"wood_siding","windows":"tall_sash","garage_doors":"one","shopfronts":"none","entrance":"stoop","top":"bracketed_cornice","bays":"one","bay_shape":"angled","balconies":"none","fire_escape":"no","awnings":"none","awning_colour":"none","colour_panels":"no"}
Also add `best` (the clearest photograph's file name), `conf` (an object giving `high`, `medium` or `low` for every
step-3 answer except cannot_tell) and `note` (under 25 words: what decided the hard ones), after the answers.
Use only menu values (the seen_ fields are free text). Do not edit any other file and do not run git. Finish with one
line: how many buildings have a clear target that is not mostly hidden, out of the total.
