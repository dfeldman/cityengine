# Reference labels: what a building looks like, from street photographs

You are making the REFERENCE labels that cheaper models will be scored against, so care matters more than speed.
For each building you answer eleven questions, each from a fixed menu, and you say `cannot_tell` whenever the
photographs do not actually show the answer. A confident wrong answer is the worst outcome here; `cannot_tell`
is never wrong when the evidence is not there.

## Files
- The menus and what each value means: `/Users/dfeldman/cityengine/data/appearance/research/menus.json`. Read it first.
- Your buildings: the list in your task. For `way/123` the photographs are `<folder>/way-123/way-123-01.jpg`, `-02.jpg`,
  `-03.jpg` (some have fewer, some none), where `<folder>` is given in your task. List the building's folder first.
  Open EVERY photograph of a building with the Read tool before answering. A folder with no jpg: `usable: no`.

## The target
Each photograph has two RED DASHED VERTICAL LINES. The target building is the one between them (they mark its
footprint's projected edges, so it may run slightly past them, and neighbours appear outside them). The photographs
are different viewpoints of the SAME building; some are poor (a truck, a tree, a different face of the building).
Combine them: an attribute seen clearly in one good photograph is known, even if the others cannot show it. If the
photographs disagree about which building is between the lines, trust the majority and say so in `note`.

## Questions
`usable`, `storeys`, `shops`, `awnings`, `balconies`, `bay_windows`, `fire_escape`, `main_colour`, `era`, `form`, `material` — exactly
as menus.json defines them. Answer only about the target's STREET-FACING wall(s) you can see. If `usable` is `no`,
answer `cannot_tell` for everything else.

For each attribute also give `conf`: `high` (plainly visible), `medium` (visible but small, partly hidden or
ambiguous) or `low` (a guess — prefer `cannot_tell`).

## Output
Write ONE JSON Lines file at the path given in your task, one line per building, in list order:
{"osm":"way/123","usable":"yes","best":"way-123-02.jpg","storeys":"3","shops":"some","awnings":"none","balconies":"none","bay_windows":"some","fire_escape":"no","main_colour":"cream","era":"edwardian","form":"house","material":"wood","conf":{"storeys":"high","shops":"high","awnings":"high","balconies":"medium","bay_windows":"high","fire_escape":"high","main_colour":"medium","era":"medium","form":"high","material":"high"},"note":"under 25 words: what decided the hard ones"}
`best` is the photograph that shows the target most clearly. Use only menu values. Do not edit any other file and do
not run git. Finish with one line: usable / total.
