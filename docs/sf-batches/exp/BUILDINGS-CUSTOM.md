# The custom-path sample — buildings the kit cannot say

**Status: swept 2026-09-23.** Five entries: the three seeded by hand, plus two found by sweeping the downtown
core against the triage criteria in `PLAN.md` §Soon.0 — `tools/ring-forms.ts` scoring every footprint in the
core, then photographs for the forms a footprint cannot see. Every row says what its evidence is. Three of
the five criteria turned up no unclaimed downtown example, and the two the footprint *can* see turned up
nothing in the core that is not already hand-modelled; see *What the sweep found*, which is the more
important half of this document.

## Why this sample exists

`facade()` and the slot kit are a grammar for **flat-walled, roughly rectangular masonry blocks**. That is
most of a city and about half of downtown San Francisco. The other half was never going to fit, and
stretching the slots to cover it would damage the common case to serve the rare one. Those buildings go to a
stronger model working with raw primitives — the way `sf/transamerica.ts` (260 m, tapering triangular shaft,
two wings) and `sf/salesforce-tower.ts` (superellipse plan, closing curve, lattice crown) were written.

The ten buildings in `BUILDINGS.md` cannot test this. Seven of them are flat-walled masonry, the ICA is the
`frame` slot's reason for existing, and only the two Exchanges are the half the kit cannot express. So E10
measures the kit on its home ground and is nearly silent on whether a model will correctly choose to walk
away from it. **This sample is where that gets measured.**

## The triage criteria

A building belongs here when its defining form is one of:

- **Curved or round plan** — a slot facade is flat walls on polygon edges by construction. Detectable from
  the footprint alone — but not by counting vertices: downtown is full of 40-vertex outlines that are pure
  right-angle jogs, and the only round building in the core is mapped as a hundred right-angled 1 m steps.
  `tools/ring-forms.ts --around=docs/sf-batches/exp/BUILDINGS-20.md` is the scan; its header says what each
  score means.
- **Twisted or continuously tapering massing** — anything whose plan changes with height.
- **Vaulted or shell roofs** — a barrel vault is not a `crown` kind.
- **Per-bay depth** — a checkerboard in–out grid, or a sawtooth of projecting bays. The kit varies depth per
  *storey*, never per *bay*.
- **Full temple fronts** where the facade *is* the columns, with no wall behind to slot into.

The criterion is a **form feature visible in the photograph or in the footprint**, never a difficulty word.
"Complicated" is not a reason; "the plan is a circle" is.

## The sample

| # | way | name | height | footprint | why it is custom |
|---|---|---|---|---|---|
| 1 | `132125164` | **Crocker Galleria** | 15 m | 46 × 82 m | A **barrel-vaulted glass arcade** running the length of the block. The vault is the building; no `crown` kind says it and no face draws a glazed half-cylinder. The masonry shell around it is kit-shaped, which makes this a good test of **mixing** `facade()` with hand-built geometry on one building. |
| 2 | `256066230` | **Pacific Exchange** (301 Pine) | 16 m | 26 × 40 m | A neoclassical banking temple whose facade **is** a row of columns, nearly full height, with no wall behind. Carried over from `BUILDINGS.md` #8, where every run either bailed or boxed it — both of which the brief permitted and neither of which is right. |
| 3 | `151185875` | **Curb Exchange** (350 Bush) | 16 m | 13 × 23 m | Neoclassical, same failure in E1–E9. Carried over from `BUILDINGS.md` #10. Smaller and simpler than the Pacific Exchange, so it is the control: if a model can do one temple front and not the other, that is about scale, not about the path. |
| 4 | `32946683` | **Savings Union Bank Building** (1 Grant) | 26 m | 24 × 27 m | **Photo-confirmed.** A **dome** over a circular banking hall, behind a pedimented Ionic temple front of free-standing columns. No `crown` kind is a hemisphere. This is the case for the photograph half of the triage: the footprint is a plain 24 × 27 m rectangle with four right angles, so no ring score will ever flag it. What flagged it was OSM's own `roof:shape=dome` on a `building:part` starting at 26 m; a geotagged Commons photograph from 30 m away (Grant at Market, 1915) shows the dome and the colonnade together. It carries a `restyle` entry only, which per `LADDER.md` §3a means *not done*. |
| 5 | `260921975` | — (Jackson Street, Chinatown edge) | 18 m | 11 × 22 m | **Photo-confirmed.** A **full-height rounded corner turret** of curved glazing — the footprint holds 13 consecutive 0.6 m edges turning −14° each, 9 m of true arc on a 67 m perimeter — **and** square projecting bay windows marching down both flanks, which the footprint does *not* hold. Two of the five criteria on one unremarkable building, and that is why it is here: every other footprint hit in the core is a famous tower somebody has already taken off the kit by hand. If a model only reaches for the custom path when the building is famous, this is where that shows. |

**Five, not ten — and the reason is the finding.** Three of the five criteria have no unclaimed downtown
example at all, and the two the footprint *can* see turned up nothing in the core that is not already
hand-modelled. A short list with evidence under every row is worth more here than ten rows with five
guesses in them.

## What the sweep found

`tools/ring-forms.ts` scans every building outline already on disk inside a box derived from the twenty ways
in `BUILDINGS-20.md` plus 250 m, and scores each ring for the two criteria a footprint can see: `arc` and
`stair` for a curved plan, `saw` for per-bay depth, with `ortho` as the negative filter. Its header says what
each score means and why vertex count alone is worthless.

**621 buildings over 10 m in the core → 4 flagged → 1 unclaimed → 1 added.**

The three flagged buildings that are *already hand-modelled* are the most useful part of the result, because
they are the tool's proof:

- **101 California** (`way/1279505488`) — 47 m of staircased curve, the only true cylinder downtown.
- **555 California** (`way/288511106`) — 76 m of sawtooth, 21 regular faceted bays, `ortho` 0.11.
- **388 Market** (`way/1279504526`) — a curved front on a flatiron plan.

and, when the box is widened, **Salesforce Tower** (19 m of arc) and the **Salesforce Transit Center**. Every
one of those was routed off the kit by a person, independently, before this scan existed; the scan finds them
from geometry alone, with no name, no photograph and no knowledge of what the building is. **That is the
half that generalises to Chicago and New York**, where nobody has gone through the core by hand. What it
also means is that in San Francisco's core the footprint-detectable work is done: the curved and sawtooth
buildings downtown are the famous ones, and the famous ones have already been taken.

Criteria with **no unclaimed downtown example**:

- **Twisted or continuously tapering massing.** All three downtown examples are already hand-modelled:
  Transamerica, Salesforce Tower, and the Hyatt Regency at 5 Embarcadero (`way/28319370`, builder
  `hyattRegency`), whose sloping terraced wedge a Mapillary frame confirms and whose builder already draws
  it. There is no fourth. **The kit does not need to worry about taper in San Francisco** — but Chicago and
  New York will differ, so the criterion stays in the triage.
- **Vaulted or shell roofs**, beyond Crocker Galleria and the Savings Union dome. The tag lead over the core
  box returns one other curved roof, `way/616222775`, a dome on the Salesforce Transit Center's roof deck —
  a park structure, not a building the rider passes. Every other dome (Columbus Tower's cupola, the Humboldt
  Bank) is outside the core. The lead is weak in both directions: Crocker's vault is not tagged at all.
- **A checkerboard in–out grid.** Nothing downtown. 555 California is a sawtooth, not a checkerboard, and the
  deep precast grids on the Embarcadero Center slabs are uniform window reveals, which the kit's own facade
  depth already says. **This criterion may not earn its place in San Francisco.**

Looked at and **rejected**, so the next sweep does not re-spend the tokens:

- `way/32947380` (Wells Fargo, 464 California) and `way/260286446` (400 California) — one of the two carries
  a full Corinthian peristyle and three Mapillary frames plus a Commons search could not settle which. Not
  added rather than added wrongly; `banks.md` already queues `way/32947380` for a model on other grounds.
- `way/149335980` (Union Trust, 2 Grant) and the other classical banks in `banks.md` — genuine temple fronts,
  but two are seeded already and a fourth teaches nothing new.
- `way/149837256` (49 Stevenson) — flagged by an early version of the `stair` score, and on inspection an
  11 m rear light well whose odd-length run of right angles summed to a false net rotation. The score now
  requires a long run. This is why the tool prints metres and counts rather than a verdict.
- The **Sentinel Building**, the **Pacific Union Club** and the **Mason O'Farrell Garage** all score well on
  `arc`, and all three are outside the downtown core. Worth having when the sweep moves to the rest of SF.

## What this sample measures

Different questions from E1–E9, so score it differently:

1. **Does the model choose the custom path at all?** The written `kit | custom | bail` line comes first, and
   on this sample the right answer is `custom` every time. A model that declares these kit-shaped has failed
   before it writes any geometry — and that is the single most important number here.
2. **Is the resulting geometry better than what the kit would have produced?** Compare against the E1–E9
   renders of the Pacific Exchange and the Curb Exchange, which exist.
3. **What does it cost?** Custom modelling is expected to cost more; the question is how much more, because
   that sets the size of the downtown core that can afford it.
4. **Does mixing work?** Crocker Galleria specifically: a kit shell with a hand-built vault. If `facade()`
   cannot be combined with hand-placed parts on one building, the escape hatch is not a hatch.

## Two cautions

**Do not let the sample be chosen by the same judgement it is meant to test.** The buildings here were
picked because the kit visibly failed on them, which is fair for a first pass but biases toward failures
already seen. The sweep that fills the rest should work from footprint geometry and photographs against the
written criteria, so it can turn up buildings nobody has looked at.

**Custom does not mean "ignore the kit".** A hand-modelled building should still reach for `colonnade`,
`pediment`, `beam`, `roundRing` and the rest wherever they fit; what it stops doing is forcing the whole
massing through a grammar that cannot hold it. `tower()` still raises the real OSM outline, and **no
dimension is ever typed** — everything derives from `fit`.
