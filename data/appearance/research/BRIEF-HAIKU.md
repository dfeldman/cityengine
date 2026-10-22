# Labelling buildings from street photographs

For each building you answer eleven questions, each from a fixed menu. Say `cannot_tell` whenever the photograph does
not actually show the answer — it is a correct answer, and a confident wrong answer is the worst outcome.

## Files
- Menus and what each value means: `/Users/dfeldman/cityengine/data/appearance/research/menus.json`. Read it first.
- Your buildings and which photograph(s) of each to open are given in your task. Open each with the Read tool.
  A building with no photograph: `usable: no`.

## The target
The target building is the one between the two RED DASHED VERTICAL LINES (it may run slightly past them; the
buildings outside them are neighbours). Answer only about the target's street-facing wall(s) you can see.
If you are given several photographs of one building, they are different viewpoints of the SAME building: combine
them, and use the clearest.

## Questions
`usable`, `storeys`, `shops`, `awnings`, `balconies`, `bay_windows`, `fire_escape`, `main_colour`, `era`, `form`, `material` — exactly
as menus.json defines them. If `usable` is `no`, answer `cannot_tell` for everything else.

## Output
Write ONE JSON Lines file at the path given in your task, one line per building, in list order:
{"osm":"way/123","usable":"yes","storeys":"3","shops":"some","awnings":"none","balconies":"none","bay_windows":"some","fire_escape":"no","main_colour":"cream","era":"edwardian","form":"house","material":"wood"}
If your task says DESCRIBE FIRST, add a field `"seen"` BEFORE the answers: 2-4 sentences describing exactly what you
see on the target (floors, ground floor, windows, projections, railings, colour), and base the answers on it.
Use only menu values. Do not edit any other file and do not run git.
