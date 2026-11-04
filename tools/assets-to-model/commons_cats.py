"""
Candidates from Commons categories of single works (Category:Statue of X (Paris), Fontaine Y …) that OSM and
Wikidata did not give us. Position = median of the files' coordinates; the nearest OSM artwork, memorial or
fountain within MATCH_M lends its id (skipped when that id is already in assets_to_model), else the id is
cm/<pageid>. Writes pool.json and picking sheets in pool.py's shape, so finalize.py applies the pick.

  python3 -I tools/assets-to-model/commons_cats.py cats.txt paris-overpass.json assets_to_model out_dir
cats.txt: one category title per line (with or without "Category:"); "title | name" overrides the name.
"""
import json, math, os, re, statistics, sys, glob, zlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_photos import API, IMG_EXT, get  # noqa: E402
from pool import imageinfo, sheets, PER_ROW, dist  # noqa: E402

MATCH_M = 60
MIN_SIDE = 800


def files(cat):
    r = get(API, {'action': 'query', 'generator': 'categorymembers', 'gcmtitle': cat, 'gcmtype': 'file', 'gcmlimit': 50,
                  'prop': 'coordinates|pageprops', 'coprop': 'type', 'colimit': 'max'})
    pages = (r or {}).get('query', {}).get('pages', {}).values()
    out = []
    for p in pages:
        if IMG_EXT.search(p['title']):
            co = (p.get('coordinates') or [{}])[0]
            out.append((p['title'], co.get('lat'), co.get('lon')))
    return out


def main(cats_path, osm_path, dest, out):
    have = set()
    for mp in glob.glob(os.path.join(dest, '**', 'meta.json'), recursive=True):
        have.add(json.load(open(mp))['id'])
    osm = []
    for e in json.load(open(osm_path))['elements']:
        t = e['tags']
        lat, lon = e.get('lat') or e.get('center', {}).get('lat'), e.get('lon') or e.get('center', {}).get('lon')
        if lat and (t.get('artwork_type') or t.get('memorial') or t.get('amenity') == 'fountain' or t.get('historic')):
            osm.append((f"{e['type']}/{e['id']}", lat, lon, t))
    cands = []
    for line in open(cats_path):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        cat, _, name = (s.strip() for s in line.partition('|'))
        cat = cat if cat.startswith('Category:') else 'Category:' + cat
        fs = files(cat)
        pts = [(a, b) for _, a, b in fs if a]
        if not fs or not pts:
            print('skip (no files/coords)', cat)
            continue
        lat, lon = statistics.median(p[0] for p in pts), statistics.median(p[1] for p in pts)
        near = sorted((dist(lat, lon, o[1], o[2]), o) for o in osm)
        near = [o for d, o in near if d < MATCH_M]
        oid, tags = (near[0][0], near[0][3]) if near else (None, {})
        if oid in have:
            print('have', cat, oid)
            continue
        name = name or re.sub(r'\s*\((Paris|[^)]*arrondissement[^)]*)\)\s*$', '', cat[9:])
        cid = oid or f"cm/{zlib.crc32(cat.encode())}"
        info = imageinfo([t for t, _, _ in fs])
        opts = []
        for t, _, _ in fs:
            i = info.get(t)
            if not i or min(i['w'], i['h']) < MIN_SIDE or not i.get('thumb'):
                continue
            opts.append({**i, 'src': 'category', 'rank': round((i['h'] >= i['w']) + min(i['w'] * i['h'] / 12e6, 1), 2)})
        opts = sorted(opts, key=lambda o: -o['rank'])[:PER_ROW]
        if not opts:
            print('skip (no big photo)', cat)
            continue
        cands.append({'id': cid, 'name': name, 'kind': tags.get('tourism') or tags.get('historic') or 'artwork',
                      'sub': tags.get('artwork_type') or tags.get('memorial') or ('fountain' if 'ontaine' in name else 'statue'),
                      'lat': lat, 'lon': lon, 'wikidata': tags.get('wikidata'), 'artist': tags.get('artist_name'),
                      'score': 5, 'tags': {**tags, 'wikimedia_commons': cat}, 'art': None, 'opts': opts})
        have.add(cid)
        print(f"{name[:40]}: {len(opts)} {oid or 'no osm'}", flush=True)
    os.makedirs(os.path.join(out, 'thumbs'), exist_ok=True)
    for c in cands:
        for k, o in enumerate(c['opts']):
            p = os.path.join(out, 'thumbs', f"{c['id'].replace('/', '')}-{k + 1}.jpg")
            if not os.path.exists(p):
                b = get(o['thumb'], raw=True)
                if b:
                    open(p, 'wb').write(b)
    json.dump(cands, open(os.path.join(out, 'pool.json'), 'w'), ensure_ascii=False, indent=0)
    json.dump(cands, open(os.path.join(out, 'candidates.json'), 'w'), ensure_ascii=False, indent=0)
    sheets(cands, out)


if __name__ == '__main__':
    main(*sys.argv[1:5])
