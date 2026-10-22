# What to draw for a building, from street photographs (v10)

A game draws this building from your answers, as a simple cartoon of it: the shape of its front, its ground floor, its
bays and ornament, roughly its colour. Say `cannot_tell` whenever the photographs do not actually show the answer — a
confident wrong answer is the worst outcome.

## Files
- Menus and what each value means: `/Users/dfeldman/cityengine/data/appearance/research/menus-v10.json`. Read it first.
- Your buildings are listed in your task, each with its MAPPED SIZE (footprint narrow side x long side, and height; the
  street front is usually the narrow side). Photographs for `way/123`:
  `/Users/dfeldman/cityengine/tools/cache/appearance-r2/way-123/` (one to three .jpg). Do ONE building at a time: list
  its folder, open all its photographs with the Read tool, write its line, then go on to the next.

## Step 1: find the target
The target is between the two RED DASHED VERTICAL LINES. Several photographs of one building are different
viewpoints of the same building; use the one that shows the target best. Answer:
- `target`: `one` if one building fills most of the space between the lines (slivers of neighbours at the edges do
  not matter); `best_fit` if two or more share the space but one of them clearly fits the MAPPED SIZE (a 7 m wide,
  10 m tall target is a narrow three-storey house, not the wide block beside it) — then describe THAT one; `none` if
  you cannot tell which building is meant;
- `target_hidden`: no / partly / mostly.

Always answer `unusual_kind`, `special_structure` and `sign_text` for what is between the lines. If `target` is none,
or `target_hidden` is mostly, answer `cannot_tell` for everything else.

## Step 2: look before you answer
Write four short evidence fields, a few words each, from what you can see:
- `seen_top`: what the top edge of the front looks like (e.g. "deep cornice on big paired brackets", "flat coping");
- `seen_ground`: everything at street level, left to right (e.g. "garage door, door up steps, garage door");
- `seen_bays`: go across the WHOLE front, corners included, and count the vertical stacks of projecting bay windows
  and their shape. Most San Francisco flats and apartment blocks HAVE bays (angled, square or curved windows standing
  out of the wall over the garage or the shops): look at every storey before writing none;
- `seen_ornament`: trim, hoods over windows, brackets, turret, shingles — or "plain".

For `ground_colour`, look at the ground floor on its own: a dark base, a painted shop band or a stone plinth under
lighter floors is common, and is not `same_as_wall`. For `roof`, a steep slope with dormers above the top cornice is a
mansard.

For `storeys`, count the full floors on the street front, the ground floor included; do not count a roof, a parapet or
a set-back penthouse. For `balconies`, answer only what you can see on several floors; a fire escape is not one.

## Step 3: answer
`unusual_kind`, `special_structure`, `sign_text`, `homes_above`, `storeys`, `roof`, `dormers`, `type`, `victorian_kind`, `ornament`, `wall_colour`,
`trim_colour`, `ground_colour`, `surface`, `windows`, `garage_doors`, `garage_door_colour`, `garage_door_style`, `shopfronts`, `shop_glass`, `sign_band`, `service_bays`, `entrance`, `entrance_arch`, `top`, `bays`,
`bay_shape`, `balconies`, `fire_escape`, `awnings`, `awning_colour`, `colour_panels` — exactly as menus-v10.json
defines them, about the target's street-facing wall(s), consistent with your evidence fields. `sign_text` is free text.

## Output
ONE JSON Lines file at the path in your task, one line per building, in list order, fields in this order, e.g.
{"osm":"way/123","target":"one","target_hidden":"no","seen_top":"flat top, deep cornice on paired brackets","seen_ground":"garage door, front door up steps","seen_bays":"one angled stack, two storeys","seen_ornament":"hoods over windows, white trim","unusual_kind":"none","special_structure":"none","sign_text":"","homes_above":"yes","storeys":"3","roof":"flat","dormers":"no","type":"painted_wood_rowhouse","victorian_kind":"italianate","ornament":"rich","wall_colour":"green","trim_colour":"white","ground_colour":"same_as_wall","surface":"wood_siding","windows":"tall_sash","garage_doors":"one","garage_door_colour":"white","garage_door_style":"solid","shopfronts":"none","shop_glass":"little","sign_band":"none","service_bays":"none","entrance":"stoop","entrance_arch":"no","top":"bracketed_cornice","bays":"one","bay_shape":"angled","balconies":"none","fire_escape":"no","awnings":"none","awning_colour":"none","colour_panels":"no"}
Use only menu values (the seen_ fields and sign_text are free text). Do not edit any other file and do not run git.
