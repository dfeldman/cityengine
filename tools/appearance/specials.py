#!/usr/bin/env python3
"""
The special-case buildings OSM names outright (appearance research, 2026-10-22): fuel station canopies and shops, and car
washes. They look alike everywhere and the generic facade draws them badly (a pump canopy came out as a half-metre band
of Victorian windows floating 3.5 m up), so the city draws them from a recipe (src/city/specials.ts). Read from the
cached Overpass responses; no network.

    python3 -I tools/appearance/specials.py data/appearance/specials.json
"""
import glob
import json
import sys

pkg = json.load(open('tools/cache/bake/san-francisco/package.json'))
ids = {b['id'] for b in pkg['buildings']}
out = {}
for p in sorted(glob.glob('tools/cache/overpass-*.json')):
    try:
        d = json.load(open(p))
    except (json.JSONDecodeError, UnicodeDecodeError):
        continue
    for e in d.get('elements', []):
        t = e.get('tags', {})
        kind = {'fuel': 'fuel', 'car_wash': 'car_wash'}.get(t.get('amenity', ''))
        if not kind or e.get('type') != 'way' or e['id'] not in ids:
            continue
        # a `building=roof` is a canopy (over the pumps, or over a car wash's bays); a fuel station's walled building is
        # its shop, a car wash's its wash hall
        part = 'canopy' if t.get('building') == 'roof' else 'shop' if kind == 'fuel' else 'wash'
        out[str(e['id'])] = {'kind': kind, 'part': part, 'brand': t.get('brand') or t.get('name') or ''}
json.dump(dict(sorted(out.items())), open(sys.argv[1], 'w'), indent=1)
print(len(out), 'buildings:', {k: sum(1 for v in out.values() if v['part'] == k) for k in ('canopy', 'shop', 'wash')})
