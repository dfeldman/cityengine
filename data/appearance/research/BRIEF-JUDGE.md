# Does the render look like the building? (judge brief)

The end goal of the appearance research is a game city whose ordinary buildings look somewhat like their street
photographs. Each image you are given is one building, three panels left to right:

1. **photo**: a Mapillary street photograph; the building meant is between the two RED DASHED lines;
2. **today**: the game's render of that building as the city is drawn now;
3. **from labels**: the same view, the building redrawn from a cheap model's labels of the photograph.

The renders stand square in front of the building's street wall, usually from a little further away than the photo.
The labelled building is the one that CHANGED between panels 2 and 3; find it first. Neighbours are not judged.

## For each building
- `found`: can you match the building in panels 2/3 to the one in the photo? yes / no (wrong building, out of frame,
  hidden). If no, answer only `why_not` and stop.
- `today`, `labels`: how much each render looks like the photo's building: 0 nothing alike, 1 a little (one or two
  things right), 2 recognisably the same kind of building in roughly the right colour, 3 a passer-by would say it is that
  building.
- `better`: labels / same / today: which render is closer.
- `misses`: up to four things that most separate panel 3 from the photo, most important first, each as
  `{"what": "...", "cause": "label" | "renderer" | "shot"}`:
  - `label`: the labels said the wrong thing (wrong colour, a garage that is not there, the wrong type);
  - `renderer`: the game cannot draw what the photo shows, whatever the labels say (e.g. "arched brick garage
    openings", "white garage doors", "tile roof at the front", "curved bay", "stoop with side stairs");
  - `shot`: the comparison view itself (a tree or pole in front, too far, a different side).
- `note`: under 25 words.

## Output
ONE JSON Lines file at the path in your task, one line per building, e.g.
{"osm":"way/123","found":"yes","today":1,"labels":2,"better":"labels","misses":[{"what":"bay windows are rounded, render has angled","cause":"renderer"}],"note":"colour and garages now right"}
Open each image with the Read tool, one at a time. Do not edit any other file and do not run git.
