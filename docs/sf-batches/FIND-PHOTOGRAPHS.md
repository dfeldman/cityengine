# Find photographs of ONE building

Your whole job is to come back with **pictures good enough to model a building from**. You do not model
anything, and you do not describe the architecture — a separate agent does that, and it must do its own
seeing. Judge the PICTURE, not the building.

This exists because research, not modelling, turned out to be the bottleneck: two models handed a one-line
description of a building both produced a featureless box, and the owner's verdict on being shown one clear
street-level photograph was *"given THIS image, I'm pretty confident that even Haiku could do a good model.
But this image is hard to find."*

---

## What a good result looks like

**Two to four images**, saved to the output directory you are given, and a `photos.md` beside them.

**Which view is best depends on where the building STANDS.** Work this out first — from the footprint, a
map, or the pictures themselves — because asking for the wrong kind of view wastes the whole search.

**A building on a corner site** (its footprint meets two streets — the end of a block, an intersection):
a **three-quarter / corner view** showing both elevations and the corner between them is the best possible
image. Massing, depth and corner treatment are all visible at once, and for some buildings the corner IS the
building.

**A building mid-block** (neighbours on both sides): ask for a **front-on elevation of its street face**.
There is no corner to see and its flanks are buried against its neighbours, so a front-on shot is not a
compromise — it is the whole of what a rider will ever see. Do not go hunting for a three-quarter view that
cannot exist.

**A very large building, or one with a complicated footprint**: an **aerial or oblique aerial** is worth
having in addition, for the massing, the roof and the shape of the plan. A street-level camera cannot see
any of those on a big building, and the roof of a low building is visible from the towers around it.

Then, in rough order of usefulness once you have the main view:

1. the opposite side, if the building presents two different faces;
2. a detail of the ground floor or the entrance, where a rider's eye actually goes;
3. anything showing the top — a crown, a parapet, plant — which street-level views usually cut off.

**Reject** pictures that are: mostly trees, cars or scaffolding; night shots; heavily wide-angle or
fish-eyed; interiors; the wrong building; so distant the building is a smudge; or historic, if the building
has since changed. A wrong picture is worse than none, because somebody will model from it.

### Beware a TEMPORARY surface

Buildings get wrapped. Decals, advertising wraps, scaffolding shrouds, banners, art installations and
seasonal decoration all photograph well and all disappear. The ICA's building was covered in decals for a
period, and a good many of the pictures on the web show that version — model it and you have modelled a
poster, not a building.

**So cross-check across images taken at different dates.** If a striking surface treatment appears in some
photographs and not others, it is temporary and you want the pictures WITHOUT it. Prefer the version that
several images from different sources and different years agree on, and say in `photos.md` if you saw a
wrapped version, so the modeller knows not to go looking for it.

---

## Batch mode — several buildings in one session

You will usually be given a LIST of buildings, because the setup cost is the same for one as for ten and
paying it ten times is the main thing that makes this expensive. Work them in order, and keep each
building's images in its own directory under the output root:

    <OUT>/<osm-id>/            the kept images and that building's photos.md
    <OUT>/REPORT.md            one table for the whole batch

**Do the cheap thing first, for every building, before any web searching:**

    node --experimental-strip-types tools/sf-photos.ts --osm=way/<ID> --out=<OUT>/<osm-id>

Then **open what it returned and judge it**: is this good enough to model a building from? Be strict — the
test is whether a modeller could get the massing, the corner treatment and the proportions from it. Mapillary
is a dashcam-and-phone corpus; it is often distant, off-axis, or pointed at the wrong side of the street.

- **Good enough** → keep it, note it, move to the next building. You are done and it cost nothing.
- **Not good enough** → go to the web for THAT building, as below.

Report which buildings needed the web and which did not. That ratio is the single most useful number this
exercise produces, because it says whether the built-in fetch is earning its place.

## Keep the good, DELETE the rest

**Every file left in the output directory will be handed to a modelling agent as if it were reference.** So
an unusable image is not neutral, it is actively harmful: it wastes the modeller's attention and may get
modelled.

- Delete images that are distant, off-axis, obstructed, of the wrong building, or simply worse than
  something else you kept. `rm` them — do not leave them "just in case".
- Two to four good images per building. If you have six, keep the best three.
- If a building ends with NOTHING usable, that is a legitimate result: leave its directory empty, say so in
  `photos.md`, and flag it in the report. Do not pad it with weak images.

---

## Try WIKIMEDIA COMMONS FIRST — it is an API, not a web search

**This is the cheapest and most reliable source found, and it should be your first move after Mapillary.**
Commons serves bots by design, is public domain, needs no key, and — crucially — its **HABS collection**
(the Historic American Buildings Survey) holds large-format architectural photographs of exactly the kind of
building we model. Their filenames state the view: *"EXTERIOR, CORNER DETAIL VIEW, LOOKING NORTHWEST"*.

Three calls. Find the category, list its files, get a JPEG thumbnail.

```bash
UA='streetrunner-refs/1.0 (research)'

# 1. find a category or file — try the building name, the address, and "HABS"
curl -s -G -H "User-Agent: $UA" 'https://commons.wikimedia.org/w/api.php' \
  --data-urlencode 'action=query' --data-urlencode 'list=search' \
  --data-urlencode 'srsearch=Anglo London Paris National Bank San Francisco' \
  --data-urlencode 'srnamespace=6|14' --data-urlencode 'format=json'

# 2. list the files in a category
curl -s -G -H "User-Agent: $UA" 'https://commons.wikimedia.org/w/api.php' \
  --data-urlencode 'action=query' --data-urlencode 'list=categorymembers' \
  --data-urlencode 'cmtitle=Category:<NAME>' --data-urlencode 'cmtype=file' \
  --data-urlencode 'cmlimit=50' --data-urlencode 'format=json'

# 3. get a PREVIEW-SIZED JPEG — this works for TIFFs too, which is the trick
curl -s -G -H "User-Agent: $UA" 'https://commons.wikimedia.org/w/api.php' \
  --data-urlencode 'action=query' --data-urlencode 'prop=imageinfo' \
  --data-urlencode 'titles=File:<EXACT NAME>.tif' \
  --data-urlencode 'iiprop=url|size|mime' --data-urlencode 'iiurlwidth=1280' \
  --data-urlencode 'format=json'
# → imageinfo[0].thumburl, a .jpg even when the original is a .tif. Then curl -L -o that URL.
```

**Do not be put off by a TIFF.** `iiurlwidth` makes Commons render any file to a JPEG of the width you ask
for, so a 200 MB HABS scan becomes a 300 KB 1280 px JPEG. A research run on 2026-09-22 found a 33-image HABS
collection for a building and abandoned it as "large format, preview JPEGs not accessible" — they were three
API calls away, and one of them turned out to be the best photograph of that building anywhere.

**Read the filename before downloading.** HABS names say the view, so you can pick the corner or elevation
shot without fetching everything. Prefer `GENERAL VIEW` and `ELEVATION` over `DETAIL` and any `INTERIOR`.

The photographs are often decades old, so **check nothing important has changed** — but for a stone bank
built in 1909, a 1960s survey photograph is frequently better than anything taken since, and it is properly
lit, square-on and unobstructed.

---

## Where to look, in order

1. **`tools/sf-photos.ts`** — the project's own street-level fetch, from Mapillary.

       ln -s /Users/dfeldman/streetrunner/.mapillary_token .mapillary_token 2>/dev/null || true
       node --experimental-strip-types tools/sf-photos.ts --osm=way/<ID> --out=<YOUR_OUT_DIR>

   It writes `<osm>.jpg`, `<osm>-2.jpg` … and a `photos.csv`. **Open every one with the Read tool.** These
   are often thin, and are frequently flat-on rather than three-quarter, which is the known weakness.

2. **The web** — this is where the good pictures are, and you are expected to go here, not to treat it as a
   fallback. Search on, in roughly this order:
   - the street ADDRESS plus the city, plus a word like `exterior` or `corner`. **Try this first.** It beat
     every name-based query on the ICA, because buildings get renamed and re-tenanted and addresses do not;
   - the building's NAME — **always with the city**. Institutional names repeat across cities: an
     "Institute of Contemporary Art" exists in Boston, London, Philadelphia, Los Angeles and Miami, and a
     search without "San Francisco" returns somebody else's building entirely;
   - the ARCHITECT plus the building, if OSM or Wikipedia names one;
   - any former name (`old_name`, `alt_name` in OSM).

   **News and press photography is the richest source found so far.** A newspaper's article about the
   building — an opening, a sale, a tenant moving in — carries a header image that is recent, high
   resolution, and shot from the angle a professional photographer chose, which is usually the
   three-quarter view a modeller wants. The best image of the ICA came from exactly that.

   **Go SEVERAL results deep, and do not stop at the first hit.** Our web search is Bing-backed, not
   Google, and the two rank differently: the best available photograph of the ICA is the SIXTH image on
   Google Images, while Bing's first is merely acceptable. The good picture is routinely below the fold. Pull
   a dozen candidates, open them, and choose on the VIEW — a lower-ranked three-quarter shot beats a
   top-ranked flat elevation every time. Ranking reflects popularity, not usefulness for modelling.

3. **Sources worth trying by name**, roughly in order of how reliable the pictures are:
   Wikipedia and Wikimedia Commons (check the article, not just a geosearch — see the warning below);
   the building's own or its owner's site; architecture press and databases; a city or heritage register;
   commercial real-estate listings, which are full of clean, well-lit three-quarter exteriors; SkyscraperPage
   and similar enthusiast databases; a tourism or walking-tour page.

4. **Google Street View** is where the best of these pictures usually live, and it is worth saying in your
   report if you could not reach it — that is a gap worth knowing about.

---

## Preview resolution is enough, and some hosts will not serve you

**There is no image-search tool.** You have `WebSearch`, which returns page titles and URLs, and
`WebFetch`/`curl`, which fetch a URL. There is no thumbnail grid to skim. So the actual loop per candidate
is: search → open a promising PAGE → find an image URL in it → fetch that image → look at it. That is
several calls per picture, and it is the reason this step is expensive.

Two things make it cheaper:

- **Go for the page's `og:image` / preview first.** Most news and museum pages declare one, it is already
  preview-sized, and it is usually the article's lead photograph — which is the picture you wanted anyway.
- **Search for pages likely to have ONE good photograph** rather than galleries. A news article about the
  building beats an image-heavy listing site you then have to dig through.

**You are not making a print.** A modelling reference has to show massing, proportions, the corner
treatment and the colour, and all of that is readable at roughly **600–1200 px on the long edge**. The image
the search result hands you, or a page's `og:image` preview, is almost always sufficient. Take it and move
on.

Do NOT chase a full-resolution original, hunt for a CDN path, or try to get round a paywall for a bigger
file. **A clean 800 px three-quarter view beats a 4000 px one you spent ten tool calls failing to fetch.**

**Hosts known not to work, as of 2026-09-22 — do not spend attempts on them:**

**Assume a PHOTOGRAPHY site will not serve you.** Flickr, the stock libraries, the print-sales sites and
most galleries now block automated fetches as a matter of policy. Do not plan a search around them.

| host | what happens |
|---|---|
| **Flickr and photo-sharing sites generally** | block automated fetches. Skip the results; do not try to derive a file URL |
| **Bing image search, fetched directly** | serves a DECOY: a query about a San Francisco building returned a page of rabbit photographs. It is not a block page, it just ignores the query, so it looks like it worked. Tested 2026-09-22 |
| stock libraries (Getty, Alamy, Shutterstock …) | detail pages are heavy and usually gated; a direct `media.gettyimages.com` JPEG has worked once |
| LoopNet and listing sites | HTTP 403 to bots |
| an architect's own CMS site (e.g. SOM) | 140 px lazy-loaded thumbnails; the real photographs are not in the static HTML |

**So aim at pages that are not primarily about photographs**, because those are the ones that still serve:

- **news and local press** — an article about the building, whose `og:image` is the lead photograph. This has
  been the single richest source so far;
- **Wikimedia Commons and Wikipedia**, which serve bots by design and are freely licensed;
- a city, heritage or landmark register;
- the building owner's or occupant's own site, where it is not a lazy-loaded gallery.

There is no image search available to you, so you cannot skim thumbnails — you are choosing a PAGE and
hoping its lead image is good. Choose pages accordingly.

**One attempt per host, then move on.** If two or three fetches in a row fail for a building, keep the best
image you already have, note it, and go to the next building. The cost of this exercise is being measured,
and time spent fighting a host is the exact waste to avoid.

---

## Verify every image is actually the building

**This is the part that has gone wrong before.** A Commons geosearch on this project once scored "20 of 20
found" and not one image was of the building asked for — geosearch returns whatever is geotagged within
90 m, which in a dense city is street festivals, interiors and somebody's lunch. A name search returned a
postcard of San Jose for one query and a 1930s exhibition programme for another.

So for every image you keep:

- **Open it with the Read tool and look at it.** No exceptions.
- Check it against something independent: the street corner it should be on, a neighbour you can identify,
  the number of storeys, the address on the door.
- If you are not confident it is the right building, **do not keep it**, and say so.

---

## What to write

A `photos.md` in the output directory. For each image, three lines:

    ## <filename>
    - view: three-quarter from the north-east corner / flat-on elevation / ground floor detail
    - source: <URL, or "Mapillary via sf-photos.ts">
    - quality: what is clear, and what is obscured (trees across the base, top cut off, …)

**Describe the VIEW, not the architecture.** "Three-quarter view showing the east and south elevations, top
cut off" is what is wanted. "Massive corner piers framing recessed glazing" is NOT — that is the modeller's
job, and doing it for them removes the very judgement being tested.

---

## Your report

1. How many usable images you found, and whether one of them is a three-quarter/corner view.
2. **Which search actually worked** — the exact query and source. This is the most valuable line in your
   report, because it is what makes the next building cheaper.
3. What you tried that did NOT work, for the same reason.
4. Anything you rejected and why (wrong building, obscured, too old).
5. Whether `tools/sf-photos.ts` gave you anything usable, since that tells us whether the built-in pipeline
   is earning its place.

Keep it short. Do not commit anything.
