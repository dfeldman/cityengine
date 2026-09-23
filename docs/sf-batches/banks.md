# Batch: the bank temples of the Financial District

**Asked by the user, 2026-09-22:** "we should mark every bank in that area for re-modeling as they are nearly
all neoclassical, and that's the whole vibe of the area."

That is the case for doing them as a group rather than one at a time. A neoclassical bank is not interesting
on its own; a street of them is the Financial District. Getting one right and leaving its neighbours in a
generic style would barely register.

Depends on **PLAN item Z** (decent columns in the shared kit) and produces **item AA** (a neoclassical
recipe). Do not start these before Z lands: every one of them is a colonnade, and today `colonnade()` draws
square posts.

## What each of them gets today

Taken from `docs/sf-buildings.csv` and the manifests, not from memory.

| OSM | building | now | wants |
|---|---|---|---|
| `way/149335980` | **Union Trust Bank Building** (Market at Grant, 20 m) | restyle → `classical` | model |
| `way/32946683` | **Savings Union Bank Building** (1 Grant, 1910, 26 m) | restyle → `classical` | model — the purest of them: an Ionic colonnade and a domed banking hall |
| `way/32946665` | **First National Bank of N. California** (43 m) | restyle → `classical` | model |
| `way/941649434` | **Bank of America Building** (14 levels) | restyle → **`chicago`** | model — wrong family today |
| `way/32947380` | **Wells Fargo** (12 levels) | restyle → **`chicago`**, and via `reface-haiku-3.json` | model — wrong family, and assigned by a model reading one line of text |
| `way/32946083` | **Fugazi Bank Building** (16 m, 2 levels) | **nothing at all** | model |
| `way/32947510` | **Old Federal Reserve Bank** (301 Battery, 7 levels) | **nothing at all** | model — a full temple front |
| `way/942303806` | **Anglo Bank Building** | **nothing at all** | model |
| `way/332384276` | Humboldt Bank Building (8 levels) | model `humboldtBankBuilding` | ✅ already done — check it against the new kit |
| `way/256067740` | California Bank and Trust (61 m) | model `californiaBankAndTrust` | ✅ already done |
| `way/32612362` | Federal Reserve Bank of SF (66 m) | model `federalReserve` | ✅ done — see BUGS.md #78 |

**Not neoclassical, leave alone:** 555 California (`way/288511106`, 226 m), 50 California
(`way/32612484`), Citibank, East West Bank, svb. Modern towers that happen to have a bank in them.

## The pattern worth noticing

Three of these have **no manifest entry at all**, and two more are in the `chicago` family, which is a
different architecture entirely — steel-framed, wide bays, no order. The two that a model assigned by name
alone got wrong are exactly the two the refacing ladder was warned about: a bank's name says nothing about
its architecture, and `Wells Fargo` in particular is a name attached to buildings of every period.

## Method

The usual one (`docs/sf-batches/BRIEF.md`): **photographs first**, then the recipe, then the handful of
per-building overrides — the order, the column count, whether they are free-standing or engaged, where the
cornice sits, the stone's colour. See item AA in PLAN.md for the blocks a neoclassical building is made of.

Shoot each one with `tools/model-shots.ts` and look at it. A bank temple that reads as a box with stripes is
the failure to watch for.
