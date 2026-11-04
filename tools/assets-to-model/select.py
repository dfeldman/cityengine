"""
Freestanding Paris statues, sculptures, fountains and monuments worth an image-to-GLB model, from OSM.

Image-to-GLB only does standalone objects, so this drops reliefs, murals, plaques, anything whose point lies
inside a building footprint larger than a pedestal, wall- and roof-mounted pieces, and building-sized
structures (arches, columns, gates, anything tagged over 15 m). Plain unnamed basins, Wallace fountains and
the statues already modelled (public/landmarks/paris-statues.json) are left out too; cemetery sculpture is
kept but ranked last, since it is not what a rider sees from the street.

  python3 -I tools/assets-to-model/select.py paris-overpass.json candidates.json
The input is `nwr[tourism=artwork] / [historic~memorial|monument] / [amenity=fountain]` in the Paris area,
`out center tags`. Building footprints near the candidates come from Overpass (written beside the output).
"""
import json, math, os, re, sys, unicodedata, urllib.parse, urllib.request

UA = 'cityengine-assets-to-model/1.0 (https://github.com/dfeldman/cityengine)'
KEEP_ART = {'sculpture', 'statue', 'bust', '', 'fountain', 'installation', 'statues', 'group'}
KEEP_MEM = {'statue', 'sculpture', 'bust', 'war_memorial', ''}
BAD_NAME = re.compile(r"\b(arc de|arc du|arc d'|colonne|column|porte |tour |pyramide|plaque|st[eè]le|mur |fresque|mosa\w*|"
                      r"vitrail|bas-relief|haut-relief|relief|m[eé]daillon|cadran|horloge|kiosque|wallace|ob[eé]lisque)\b", re.I)
# made already: (name pattern, lat, lon, radius m) — None means anywhere in Paris
DONE = [(r'clemenceau', None), (r'de gaulle', None), (r'charlemagne', None), (r'[eé]tienne marcel', None),
        (r'danton', None), (r'r[eé]publique', (48.8675, 2.3637, 150)), (r'g[eé]nie', (48.8532, 2.3691, 100)),
        (r'henri iv', (48.8571, 2.3412, 200)), (r"jeanne d.arc", (48.8635, 2.3329, 150))]


def dist(a, b, c, d):
    return math.hypot((a - c) * 111320, (b - d) * 111320 * math.cos(math.radians(a)))


def inside(lat, lon, ring):
    x = False
    for (y1, x1), (y2, x2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > lat) != (y2 > lat) and lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
            x = not x
    return x


def area(ring):
    lat0 = ring[0][0]
    pts = [(lo * 111320 * math.cos(math.radians(lat0)), la * 111320) for la, lo in ring]
    return abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]))) / 2


def norm(s):
    return re.sub(r'[^a-z0-9]+', ' ', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()).strip()


def overpass(q, cache):
    if os.path.exists(cache):
        return json.load(open(cache))
    for url in ('https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'):
        try:
            req = urllib.request.Request(url, data=urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': UA})
            d = json.loads(urllib.request.urlopen(req, timeout=300).read())
            json.dump(d, open(cache, 'w'))
            return d
        except Exception as e:
            print('overpass', url, e)
    sys.exit('overpass unavailable')


def first_pass(els):
    out = []
    for e in els:
        t = e['tags']
        ty = t.get('tourism') or t.get('historic') or t.get('amenity')
        sub = (t.get('artwork_type') or t.get('memorial') or t.get('fountain') or '').strip()
        name = t.get('name') or t.get('name:fr') or ''
        if t.get('indoor') == 'yes' or t.get('location') in ('indoor', 'underground', 'roof', 'wall', 'facade'):
            continue
        if t.get('support') in ('wall_mounted', 'wall', 'roof', 'building') or t.get('wall') == 'yes' or t.get('level', '0') != '0':
            continue
        if ty == 'artwork' and sub not in KEEP_ART or ty == 'memorial' and sub not in KEEP_MEM:
            continue
        if ty not in ('artwork', 'memorial', 'fountain', 'monument'):
            continue
        if ty == 'fountain' and (sub in ('drinking', 'bubbler', 'wallace', 'toilet') or t.get('drinking_water') == 'yes'):
            continue
        if BAD_NAME.search(name + ' ' + sub):
            continue
        try:
            if float(re.sub(r'[^0-9.]', '', t.get('height', '')) or 0) > 15:
                continue
        except ValueError:
            pass
        lat = e.get('lat') or e['center']['lat']
        lon = e.get('lon') or e['center']['lon']
        if any(re.search(p, name, re.I) and (w is None or dist(lat, lon, w[0], w[1]) < w[2]) for p, w in DONE):
            continue
        score = 3 * ('wikidata' in t) + 3 * ('wikipedia' in t) + ('artist_name' in t or 'artist:wikidata' in t) \
            + bool(name) + (sub in ('statue', 'sculpture') or ty == 'monument') + ('image' in t or 'wikimedia_commons' in t)
        if ty == 'fountain' and not (name and ('wikidata' in t or 'image' in t or 'wikimedia_commons' in t)):
            continue  # a plain basin the procedural fountains already cover
        if not (name or 'wikidata' in t or 'image' in t):
            continue
        out.append(dict(id=f"{e['type']}/{e['id']}", kind=ty, sub=sub, name=name or t.get('description', '')[:60] or sub,
                        lat=lat, lon=lon, score=score, wikidata=t.get('wikidata'), artist=t.get('artist_name'),
                        height=t.get('height'), tags=t))
    return out


def main(src, dst):
    cands = first_pass(json.load(open(src))['elements'])
    print('tag filter', len(cands))
    # dedup: one wikidata item, or one name within 50 m (node + way of the same statue)
    cands.sort(key=lambda c: -c['score'])
    keep, seen = [], set()
    for c in cands:
        if c['wikidata'] and c['wikidata'] in seen:
            continue
        if any(norm(c['name']) == norm(k['name']) and dist(c['lat'], c['lon'], k['lat'], k['lon']) < 50 for k in keep):
            continue
        seen.add(c['wikidata'])
        keep.append(c)
    print('dedup', len(keep))

    q = f"[out:json][timeout:300];(" + ''.join(f"way[building](around:3,{c['lat']},{c['lon']});" for c in keep) + \
        ");out geom;(area[\"name\"=\"Paris\"][\"admin_level\"=\"8\"];)->.p;nwr[landuse=cemetery](area.p);out geom;"
    geo = overpass(q, os.path.join(os.path.dirname(os.path.abspath(dst)), 'buildings-near.json'))['elements']
    rings = lambda e: [[(p['lat'], p['lon']) for p in e['geometry']]] if 'geometry' in e else \
        [[(p['lat'], p['lon']) for p in m['geometry']] for m in e.get('members', []) if m.get('role') == 'outer' and 'geometry' in m]
    blds = [r for e in geo if 'building' in e.get('tags', {}) for r in rings(e)]
    cems = [r for e in geo if e.get('tags', {}).get('landuse') == 'cemetery' for r in rings(e)]
    out = []
    for c in keep:
        # a footprint over 150 m² is a building the piece sits on or in; smaller ones are mapped pedestals
        if c['tags'].get('building') is None and any(area(r) > 150 and inside(c['lat'], c['lon'], r) for r in blds):
            continue
        c['cemetery'] = any(inside(c['lat'], c['lon'], r) for r in cems)
        if c['cemetery']:
            c['score'] -= 6
        out.append(c)
    out.sort(key=lambda c: -c['score'])
    print('not in buildings', len(out), 'of which cemetery', sum(c['cemetery'] for c in out))
    json.dump(out, open(dst, 'w'), ensure_ascii=False, indent=0)


if __name__ == '__main__':
    main(*sys.argv[1:3])
