# Refacing a building from one photograph

Street Runner is a cycling game with a cartoon-flat, stylised look. Its classifier has already given every
building in San Francisco a facade style, guessed from height, district, footprint and the Assessor's record.
It has no idea what any building actually looks like. You do — you have a photograph.

Your job, per building, is to answer three questions from that photograph:

1. **Is the classifier's style right?** If yes, write nothing.
2. **If not, which style is it?** Write a restyle entry.
3. **What colour is it?** If the photograph shows the paint clearly, give the colours with the style.

The colours matter as much as the style. San Francisco's buildings are half paint: a blue-and-white Victorian
and a grey one are the same style and different buildings, and the style alone will never get you the blue.

## Your files

- `public/landmarks/san-francisco/reface-haiku.json` — a JSON array. Append your entries here.
- `docs/sf-queue-log.csv` — append exactly one row per building, whatever you decided.

Nothing else. No git, no bake, no dev server, no other file.

## The photographs

They are already fetched, and there are **TWO for each building**, taken from viewpoints at least eighteen
metres apart. Your list gives both filenames. **Open both.** They exist because one is often spoiled — a
street tree across the front, a lorry, deep shade, the building half out of frame — and the other viewpoint
usually is not. Judge from whichever shows the building better, and use both together where each shows a
different part. Only log `wrong-image` or `no-image` when NEITHER is usable. **Never search for or download an image, and never write a filename you were not given** — an earlier
pass reported buildings "confirmed" against files that do not exist, and all of it was thrown away.

Three things about these pictures:

- **They are reprojected from 360° street-level panoramas.** Straight lines really are straight, so trust what
  you see: a curve in the picture is a curve in the building. (An earlier batch saw fisheye-bowed crops and
  reported flat buildings as "cylindrical".)
- **Red dashed lines mark roughly where the building should be.** They come from geometry, not from the image,
  and the aim is good but not perfect. If the building is plainly beside them rather than between them, go by
  the picture and the height your list gives. Use the whole frame for context.
- **The edges of the frame are often something else** — a slab of wall from a building right beside the camera.
  The building you want is the one at street distance near the middle.

## Deciding

Two questions, in this order: is this building too interesting for a style at all — and if not, which style?
Both are answered from what you can SEE. Do not try to name an architectural period; you will get it wrong,
and it is not what we need.

### First: is this building too interesting for a style at all?

**Ask this before anything else.** Our styles draw a box with a repeating facade on it. Most buildings are
that. Some are not, and giving one of those a style throws away the thing that makes it itself — so the
answer for those is `model-worthy`, which hands it to someone who will build it properly.

Say `model-worthy` if ANY of these is true:

- **The shape is not a box.** A curved or rounded front, a faceted or angled plan, a taper, a strong setback or
  step, a rotunda, a turret, a wing that is plainly a different shape from the rest.
- **The roofline does something.** A dome, a spire, a sculpted or stepped crown, a pyramid, a clock, a big
  mast, masts and railings, a deep mansard with dormers.
- **The openings are remarkable.** Giant arches, a monumental doorway or portico, round windows or portholes,
  a theatre marquee, a wall of windows that is not a repeating grid.
- **The material is unusual.** Bare or polished metal, marble or polished stone, very clear frameless glass,
  glazed tile or mosaic, copper, anything that is plainly not brick, render, concrete or ordinary glass.
- **The facade is not a mostly-flat surface.** Our styles draw a flat wall with windows in it. Bay windows and
  balconies are the two exceptions we can also draw — everything else that sticks out or cuts in defeats them:
  projecting boxes or blocks, deep recesses and voids, fins or blades standing off the wall, angled or folded
  panels, a canopy or brise-soleil across the front, a section of wall set back behind another. If you can see
  real depth in the front of the building beyond a bay or a balcony, no style will reproduce it.
- **There is architecture-as-signage.** Big fixed lettering, a blade sign, a sculpted emblem built into the
  building.

A good test: **describe the building to someone in one sentence. If the thing you would mention is not "a
brick wall with windows in it", it is `model-worthy`.**

Worked examples.

**501 Fulton Street** is a modern block of green and grey glass whose front is not flat: boxes project from it,
parts of the wall are set back behind others, and a banded stone section stands proud beside the glass. It has
no ornament, no cornice and no bay windows, so the list below would reach for `bauhaus` or `skyscraper` — and
both would draw a flat wall, losing the only thing anyone would describe about it. `model-worthy`.

**The National Maritime Museum.** It is white, smoothly rendered, flat-roofed and has horizontal
window bands, so the list below would call it `bauhaus` and move on. But it is shaped like a ship: a curved
prow, a curved deck rail, masts, porthole windows, a stepped upper deck. Every one of those is in the list
above. It is `model-worthy`, and a style entry for it would be a small disaster.

Do not worry that you are escalating too much — a `model-worthy` costs us nothing but a line in a log, and
something further up the ladder decides whether it earns the work. Forcing a remarkable building into a style
is the expensive mistake, because nobody looks at it again.

### Otherwise: which style?

Work down this list and **take the first one that is clearly yes**. Four features decide most buildings on
their own, so look for these first:

- **a glass skin** — floor-to-ceiling panes, thin metal between, no wall to speak of;
- **bay windows** — the front pushing out in a box or an angle, storey after storey;
- **a fire escape** — iron stairs zig-zagging down the FRONT of the building;
- **very wide window bays** — a big fixed pane with a narrow sash each side, repeated up a tall grid.

### 0. STOP FIRST: is this an institution? Then do not reface it at all.

**Before question 1**, check what the building *is*. If it is a **place of worship of any kind** (church,
cathedral, chapel, synagogue, mosque, temple), a **museum or gallery**, a **library**, a **university or
college building**, or a **cultural centre or theatre** — **do not choose a style.** Write
`SKIP — institution` and the OSM id, and move on.

**Why**, measured 2026-09-23 from the owner's review of 240 renders (BUGS.md #118):

- Refaced buildings needed rework **57%** of the time against **25%** for modelled ones.
- **Churches failed under every rule that touched them** — Old Saint Mary's Cathedral, Saint Agnes, Nuestra
  Señora de Guadalupe, the Shrine of St Francis of Assisi, the Chinese Independent Baptist Church.
- The **ICA**, a modernist glass museum, and **Kong Chow Temple** were the two worst scores in the sample.

The reason is structural, not a mis-tuned threshold. **An institution's architecture is chosen to DIFFER
from its neighbourhood** — that is what makes it a landmark — so a decision tree reading the neighbourhood
reads the wrong signal. And a church's problem is **massing**, not style: it is a gabled hall with a tower,
and there is no style in the table with a tower, a spire or a gable in it. Old Saint Mary's is not a
Chinatown building because it stands in Chinatown.

These go to a model, not a style — see `docs/INSTITUTIONS.md`. **301 institutional buildings** exist in San
Francisco and only 42 are modelled.

**The exception, and check for it:** plenty of `amenity=place_of_worship` tags sit on **ordinary buildings
with a congregation inside** — a shopfront, an office floor, a converted hall. If the photograph shows an
ordinary street building, reface it normally. The test is what the **photograph** shows, never the tag.

---

1. **Is the wall mostly glass?** Floor-to-ceiling panes with only thin metal between them, so the building
   reads as a glass skin rather than a wall with holes in it — and usually many narrow vertical strips running
   the full height. → **`skyscraper`** (offices; if you cannot see glass, it is not this)

2. **Do the windows run in continuous horizontal ribbons that turn the corner?** Smooth white or pale render,
   flat roof, no ornament at all, thin metal railings. → **`bauhaus`**

3. **Is it raw grey concrete, with deep-set windows in a thick wall and the floor slabs showing as horizontal
   bands?** Heavy, repetitive, unpainted. → **`brutalist`**

4. **Does the front of the building push OUT in a bay through every storey?** (A bay window: the wall steps
   forward in a box or an angle, floor after floor, up the front.)
   - low, timber, brackets and ornament, a gable or a flat false front → **`victorian`**
   - low, boxy and plainer, little ornament → **`edwardian`**
   - taller, stucco, stacked bays, usually a fire escape → **`sfapartment`**

5. **Is there a fire escape zig-zagging down the FRONT, over shops, in brick, with no bays?**
   → **`tenement`**

6. **Are there iron balconies running right across the front on the upper floors, over shops?** Often strong
   colours, sometimes Chinese lettering. → **`chinatown`**

7. **Are the window openings very WIDE — a big fixed pane with a narrow opening sash each side — repeated in a
   regular grid up a tall building?** Usually a fine glazed-terracotta or brick
   grid with a heavy cornice on top. → **`chicago`**

8. **Are there columns or pilasters, a heavy stone base you can read from across the street, and pediments
   over the windows?** A civic or bank-like block, four to eight storeys. → **`classical`**

9. **Is there a stoop — a flight of steps up to the front door above a basement?** Three to five storeys, tall
   sash windows. → **`brownstone`**

10. **Is it smooth pale stucco with arched windows and a garage door in the front at pavement level?** Two or
    three storeys. → **`stucco`**

11. **Individual punched windows or balconies in a pale concrete or rendered wall, a flat top, no cornice, no
    shopfront?** → **`towerblock`** (flats. Most of San Francisco's tall buildings are these, and it is NOT
    `skyscraper` unless you can see a glass skin — but it does not have to be tall: a three-storey one counts)

12. **Otherwise**: plain brick or rendered wall, windows punched into it as holes, a parapet at the top.
    → **`brick`**

If two of these fit, prefer the one higher up the list. If none of them fits, that is another way of arriving
at `model-worthy` — do not force the nearest style onto a building the list cannot describe.

Above about eight storeys, most buildings are one of `chicago`, `brutalist`, `towerblock` or `skyscraper` —
glass skin → `skyscraper`; raw concrete with slab bands → `brutalist`; wide window bays in a fine terracotta
or brick grid → `chicago`; punched windows or balconies in a pale wall → `towerblock`. **But go by the
photograph, not the height.** A ten-storey classical block is unusual, not impossible, and you are the one
looking at it. Only a handful of styles are genuinely tied to being low: a `tenement` is a walk-up, a
`victorian` is a timber house, a `brownstone` has a stoop — those cannot be twenty storeys whatever else they
look like.

### How tall a style can go

**Height is not how you choose a style — the features are.** A building can perfectly well be SHORTER than a
style's usual range: a three-storey block of flats with punched windows in a plain rendered wall and a flat
top is a `towerblock`, even though most towerblocks are ten storeys and up, and calling it something else to
fit a number gets you a worse building.

What does not work is going far OVER, because there is nothing for the generator to draw up there: a Victorian
has one bay window and a cornice, and stretched over thirty storeys it is a mess. So read this column as a
CEILING, not a target — the tooling rejects an entry well above it and ignores one below.

| style | usual storeys | | style | usual storeys |
|---|---|---|---|---|
| `victorian` | 2–3 | | `classical` | 4–8 |
| `edwardian` | 2–3 | | `chicago` | 8–16 |
| `stucco` | 2–3 | | `bauhaus` | 3–6 |
| `sfapartment` | 4–7 | | `brutalist` | 4–12 |
| `chinatown` | 3–5 | | `towerblock` | 10–35 |
| `tenement` | 5–6 | | `skyscraper` | 12–45 |
| `brownstone` | 3–5 | | `brick` | 2–6 |

## The colours

When the photograph shows them clearly, add any or all of `wall`, `trim` and `accent` as hex:

- **`wall`** — the main body colour.
- **`trim`** — the picked-out colour on window surrounds, cornice, columns, corner boards. Usually white or
  cream on a painted house.
- **`accent`** — the third colour: sashes, doors, ironwork, the deepest shade of a painted Victorian.
- **`groundWall`** — the ground floor, where it is painted differently from the floors above. This is very
  common and worth looking for: a dark shopfront under pale flats, a stone or tiled base under render, a
  garage front in another colour. Leave it out when the ground floor is the same colour as the rest.

A blue-and-white Victorian: `"restyle": "victorian", "wall": "#3f6f9c", "trim": "#f4f2ea", "accent": "#1d3550"`.

Name the colour you can see, in daylight terms; do not try to correct for sun or shadow. If the photograph is
backlit, in deep shadow, or the colour is genuinely unclear, leave them out — the style's own palette is used,
and that is a perfectly good outcome. Do not guess a colour.

**If the style is right but the colour is clearly wrong, that is still an entry**: give the same style the
classifier chose, plus the colours, and log it as `restyle`.

## The entry

```json
{"osm": ["way/123"], "name": "…", "restyle": "towerblock",
 "wall": "#d9d6cc", "trim": "#f2f0ea", "groundWall": "#4a4540",
 "by": "haiku", "image": "way-123.jpg", "note": "what the photo shows"}
```

`osm`, `restyle`, `by` and `image` are required; the colours and `note` are optional. **Do not write a
`height`** — you cannot know metres from a photograph, and the tooling fills it in from survey data.

**`levels` is the exception.** Where your row's height column says the size is UNKNOWN, count the floors in
the photograph and give `"levels": 3`. You cannot judge metres, but you can count storeys, and for those
buildings the alternative is a guess that puts three floors of windows on a hall with one tall room. Count
what you can see: a row of windows is a floor, a tall church nave or a theatre auditorium is ONE floor however
high it is, and an attic or a basement showing at the pavement counts. Where the row gives a height, leave
`levels` out — the survey wins and the tooling discards it.

## The log

One row appended to `docs/sf-queue-log.csv` for every building, including the ones you decided nothing about:

```
way/123,haiku,haiku,confirm,"way-123.jpg",2026-09-22
```

The outcome is one of:

| outcome | when | writes an entry? |
|---|---|---|
| `confirm` | the classifier's style and the colours are both fine | no |
| `restyle` | the style is wrong, or the style is right and the colour is wrong | yes |
| `model-worthy` | the shape, roofline, openings or material are remarkable — see the first section | no |
| `wrong-image` | the building genuinely is not in the picture | no |
| `no-image` | no usable file | no |

The log is append-only. Never rewrite it.

## What goes wrong

- **Writing an entry you are not sure of.** Your entry overrides the classifier permanently and nobody will
  re-examine it. When in doubt, `confirm`.
- **Reaching for `skyscraper` because a building is tall.** See above.
- **Reading a passing truck, a tree or a shadow as architecture.** Judge the things that do not change:
  material, window rhythm, storey count, colour, cornice, bays, shopfront.

## Report

Counts for each outcome, how many you gave colours to, and — plainly — how many photographs were badly aimed
even where you could still judge the building. That last number is about our tooling, not about you.
