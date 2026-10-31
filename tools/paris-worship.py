#!/usr/bin/env python3
"""Writes docs/landmarks/PARIS-WORSHIP.md: every named place of worship in the Paris box, biggest and best known first, and which model each
has (owner, 2026-10-31: "we should make a list of all places of worship, and audit those... they are almost always unique buildings, and
paris has many of them"). Reads an osmium geojsonseq export of the box's amenity=place_of_worship and building=church etc.:
  python3 tools/paris-worship.py <export.geojsonseq>"""
import glob, json, re, sys
ROOT = 'public/landmarks/'
def strip(s):
    for a, b in zip('éèêëàâçôîïûùÉÈ', 'eeeeaacoiiuuEE'): s = s.replace(a, b)
    return re.sub(r'[^a-z0-9]+', ' ', s.lower()).strip()
model, restyle, ids = [], [], {}
for f in glob.glob(ROOT + 'paris/*.json') + [ROOT + 'paris.json']:
    if f.endswith('portals.json'): continue
    d = json.load(open(f))
    for e in (d if isinstance(d, list) else d.get('landmarks', d.get('entries', []))):
        if not isinstance(e, dict) or not e.get('name'): continue
        kind = 'model' if e.get('procedural') or e.get('glb') or e.get('model') else 'restyle' if e.get('restyle') else None
        if not kind: continue
        (model if kind == 'model' else restyle).append(strip(e['name']))
        for o in e.get('osm', []) or []: ids[str(o)] = (kind, e['name'])
X = lambda lo: (lo - 2.332) * 73270
Z = lambda la: (la - 48.8605) * 111320
seen = {}
for l in open(sys.argv[1]):
    l = l.strip().lstrip('\x1e')
    if not l: continue
    f = json.loads(l); p = f['properties']; g = f['geometry']
    if not (p.get('amenity') == 'place_of_worship' or p.get('building') in ('cathedral', 'church', 'chapel', 'synagogue', 'mosque', 'temple', 'basilica', 'shrine')): continue
    n = p.get('name')
    if not n: continue
    co = g['coordinates']
    while g['type'] != 'Point' and isinstance(co[0][0], list): co = co[0]
    pts = [co] if g['type'] == 'Point' else co
    lo = sum(q[0] for q in pts) / len(pts); la = sum(q[1] for q in pts) / len(pts)
    a = 0
    if len(pts) > 2:
        r = [(X(q[0]), Z(q[1])) for q in pts]
        a = abs(sum(r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1] for i in range(len(r) - 1))) / 2
    k = strip(n) + f'|{round(la, 3)}|{round(lo, 3)}'
    fame = (3 if p.get('wikipedia') else 0) + (2 if p.get('wikidata') else 0) + (2 if p.get('heritage') or p.get('ref:mhs') else 0)
    rec = dict(name=n, religion=p.get('religion', ''), denom=p.get('denomination', ''), lat=round(la, 6), lon=round(lo, 6), area=round(a), fame=fame, building=bool(p.get('building')))
    old = seen.get(k)
    if not old or rec['area'] > old['area']: seen[k] = rec
rows = list(seen.values())
for r in rows:
    s = strip(r['name'])
    match = lambda L: any(s == m or (len(s) > 9 and (s in m or m in s)) for m in L)
    r['has'] = 'model' if match(model) else 'restyle' if match(restyle) else ''
rows.sort(key=lambda r: -(r['fame'] * 200 + min(r['area'], 3000)))
out = ['# Paris\'s places of worship', '', 'Written by tools/paris-worship.py. To audit after the landmark batches (owner: "they are almost always unique buildings, and paris has many of them"). `has`: a model or restyle whose name matches, loosely: check. An entry with no footprint is a chapel mapped as a point, often inside something else.', '', f'{len(rows)} places: {sum(1 for r in rows if r["has"]=="model")} with a model by name, {sum(1 for r in rows if r["has"]=="restyle")} with a restyle, {sum(1 for r in rows if not r["has"])} neither.', '', '| # | Name | Faith | m² | Fame | Has | lat, lon |', '|---|---|---|---|---|---|---|']
for i, r in enumerate(rows, 1):
    out.append(f"| {i} | {r['name']} | {r['religion']} {r['denom']} | {r['area'] or ''} | {r['fame']} | {r['has']} | {r['lat']}, {r['lon']} |")
open('docs/landmarks/PARIS-WORSHIP.md', 'w').write('\n'.join(out) + '\n')
print(out[4]); print('\n'.join(out[8:22]))
