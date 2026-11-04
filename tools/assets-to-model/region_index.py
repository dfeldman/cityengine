"""
The index of a region outside Paris (LIST.md's sibling): every assets_to_model folder whose object stands in one
of the region's communes — made by this region's pass (meta.json `commune`) or by an earlier one (placed by
outlines.json) — then the region's candidates with no usable photo, grouped by commune and, inside the estates
(Versailles gardens, Saint-Cloud…), by estate. Nothing here is in the game yet.

  python3 -I tools/assets-to-model/region_index.py assets_to_model assets_to_model/_data/versailles "Paris → Versailles" assets_to_model/LIST-versailles.md
"""
import json, os, sys

ORDER = ['Boulogne-Billancourt', 'Saint-Cloud', 'Sèvres', 'Meudon', 'Garches', 'Marnes-la-Coquette', 'Vaucresson',
         "Ville-d'Avray", 'Chaville', 'Viroflay', 'Le Chesnay-Rocquencourt', 'Versailles', "Saint-Cyr-l'École"]


def inside(lat, lon, ring):
    x = False
    for (y1, x1), (y2, x2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > lat) != (y2 > lat) and lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
            x = not x
    return x


def main(dest, data, title, out):
    ol = json.load(open(os.path.join(data, 'outlines.json')))
    cands = json.load(open(os.path.join(data, 'candidates.json')))
    place = lambda la, lo: next((n for n, rs in ol['communes'].items() if any(inside(la, lo, r) for r in rs)), None)
    estate = lambda la, lo: next((z for z, rs in ol['estates'] if any(inside(la, lo, r) for r in rs)), 'town')
    rows, done = [], set()
    for sub in ('', '_dropped', '_nophoto'):
        d = os.path.join(dest, sub)
        for folder in sorted(os.listdir(d)):
            mp = os.path.join(d, folder, 'meta.json')
            if folder.startswith('_') and not sub or not os.path.exists(mp):
                continue
            m = json.load(open(mp))
            town = m.get('commune') or place(m['lat'], m['lon'])
            if not town:
                continue
            if sub == '_nophoto':
                continue  # listed below as a candidate that needs a photo
            done.add(m['id'])
            if sub:
                continue
            r = m.get('review') or {}
            if r.get('verdict') != 'ok':
                continue
            src = (m.get('photo') or {}).get('src') or ''
            who = 'owner' if 'owner' in src else 'Google' if 'google' in src.lower() else 'Openverse' if 'openverse' in src.lower() \
                else 'Mapillary' if 'mapillary' in src.lower() else 'Commons'
            rows.append(dict(m=m, folder=folder, r=r, town=town, zone=m.get('zone') or estate(m['lat'], m['lon']),
                             status=f'photo ✓ ({who})', prior=not m.get('commune')))
    for c in cands:
        if c['id'] not in done:
            rows.append(dict(m=c, folder=None, r={}, town=c['commune'], zone=c['zone'], status='needs photo', prior=False))
    cell = lambda s: str(s or '').replace('|', '/')
    ref = lambda m: f"[{m['id']}](https://www.openstreetmap.org/{m['id']})" if not m['id'].startswith('wd/') else \
        f"[{m['id'][3:]}](https://www.wikidata.org/wiki/{m['id'][3:]})"
    n_ok = sum(1 for x in rows if x['folder'])
    towns = sorted({x['town'] for x in rows}, key=lambda t: ORDER.index(t) if t in ORDER else 99)
    with open(out, 'w') as f:
        f.write(f'# {title}: statues, sculptures, monuments and fountains to model ({len(rows)})\n\n'
                f'Outdoor objects from OSM and Wikidata in the communes along the route, {n_ok} with a photo, '
                f'{len(rows) - n_ok} without. One folder each in assets_to_model, as for Paris (LIST.md): `photo.jpg` '
                '(credit in meta.json `photo`) and `meta.json` (`commune`, `zone`, `review`, `alternates`). Parts = GLBs '
                'the photo implies; Material = the untextured shader; Plinth `skip` = ordinary, `model` = distinctive. '
                'Indoor pieces (anything inside a building footprint over 150 m², e.g. the château) are left out; '
                'building-sized pieces, plain basins, reliefs and duplicates the pick dropped are in `_dropped/`. *photo found by '
                'proximity* = no Wikidata item or OSM tag names the photo; it came from a 30 m search, and in the Versailles '
                'parterres that can be the neighbouring statue. *earlier pass* = a '
                'folder made by the outside-Paris pass, already in LIST.md. Regenerate with tools/assets-to-model/region_index.py; '
                'candidates from tools/assets-to-model/region.py.\n\n')
        f.write('| Commune | Zone | With photo | Needs photo |\n|---|---|---|---|\n')
        for t in towns:
            for z in sorted({x['zone'] for x in rows if x['town'] == t}, key=lambda z: z != 'town'):
                g = [x for x in rows if x['town'] == t and x['zone'] == z]
                f.write(f"| {t} | {z} | {sum(1 for x in g if x['folder'])} | {sum(1 for x in g if not x['folder'])} |\n")
        for t in towns:
            for z in sorted({x['zone'] for x in rows if x['town'] == t}, key=lambda z: z != 'town'):
                g = sorted([x for x in rows if x['town'] == t and x['zone'] == z],
                           key=lambda x: (not x['folder'], -(x['m'].get('score') or 0), x['m']['name']))
                f.write(f"\n## {t}{'' if z == 'town' else ' — ' + z} ({len(g)})\n\n"
                        '| Status | Name | Kind | Parts | Material | Plinth | Issues / note | OSM / Wikidata | Lat, lon |\n'
                        '|---|---|---|---|---|---|---|---|---|\n')
                for x in g:
                    m, r = x['m'], x['r']
                    name = f"[{cell(m['name'])}]({x['folder']}/photo.jpg)" if x['folder'] else cell(m['name'])
                    note = ', '.join(r.get('issues') or []) + ' ' + cell(r.get('note')) + (' *earlier pass*' if x['prior'] else '') + \
                (' *photo found by proximity: check it is this statue*' if (m.get('photo') or {}).get('src') == 'geo' else '')
                    f.write(f"| {x['status']} | {name} | {cell(m.get('sub') or m['kind'])} | {r.get('parts') or ''} | "
                            f"{r.get('material') or ''} | {r.get('plinth') or ''} | {cell(note.strip())} | {ref(m)} | "
                            f"{m['lat']:.5f}, {m['lon']:.5f} |\n")
    print(len(rows), 'rows;', n_ok, 'with a photo')


if __name__ == '__main__':
    main(*sys.argv[1:5])
