"""
Openverse (Creative Commons photos, mostly Flickr) for candidates Commons cannot help with — modern French
sculpture, which Commons deletes for want of freedom of panorama. Writes a pool.json and picking sheets in the same
shape as pool.py, so finalize.py applies the pick.

The API is slow for anonymous clients (~45 s a search): La Défense first, by importance, one search each, a second
only when the first finds fewer than three photos.

  python3 -I tools/assets-to-model/openverse.py candidates.json[,more.json] assets_to_model out_dir
"""
import json, os, sys, time, urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_photos import get, words  # noqa: E402
from pool import sheets, PER_ROW  # noqa: E402

API = 'https://api.openverse.org/v1/images/'
DEFENSE = (48.884, 48.898, 2.222, 2.256)  # lat0, lat1, lon0, lon1


def search(q):
    r = get(API, {'q': q, 'page_size': 12, 'mature': 'false'}, tries=2, timeout=150)
    return (r or {}).get('results', [])


def placed(dest):
    """ids that already have a photo or were dropped: nothing to search for."""
    ids = set()
    for sub in ('', '_dropped'):
        base = os.path.join(dest, sub) if sub else dest
        for f in os.listdir(base):
            mp = os.path.join(base, f, 'meta.json')
            if '--' in f and os.path.exists(mp):
                m = json.load(open(mp))
                if sub or (m.get('review') or {}).get('verdict') == 'ok':
                    ids.add(m['id'])
    return ids


def main(cand_paths, dest, out):
    done = placed(dest)
    cands = [c for p in cand_paths.split(',') for c in json.load(open(p)) if c['id'] not in done]
    at_defense = lambda c: DEFENSE[0] < c['lat'] < DEFENSE[1] and DEFENSE[2] < c['lon'] < DEFENSE[3]
    cands.sort(key=lambda c: (not at_defense(c), -(c.get('score') or 0)))
    print(len(cands), 'to search;', sum(map(at_defense, cands)), 'at La Défense', flush=True)
    os.makedirs(os.path.join(out, 'thumbs'), exist_ok=True)
    pool_path = os.path.join(out, 'pool.json')
    found = json.load(open(pool_path)) if os.path.exists(pool_path) else []
    seen = {c['id'] for c in found}
    for c in cands:
        if c['id'] in seen:
            continue
        where = 'La Défense' if at_defense(c) else c.get('commune') or 'Paris'
        artist = (c.get('artist') or c['tags'].get('artist_name') or '').split(';')[0]
        hits = search(f"{c['name']} {artist or where}")
        if len(hits) < 3:
            hits += search(f"{c['name']} {where}")
        w = words(c['name'])
        opts, urls = [], set()
        for h in hits:
            if h['url'] in urls or not (h.get('width') or 0) or min(h['width'], h.get('height') or 0) < 600:
                continue
            urls.add(h['url'])
            text = ' '.join([h.get('title') or ''] + [t.get('name', '') for t in h.get('tags') or []])
            opts.append({'title': h.get('title') or '', 'w': h['width'], 'h': h['height'], 'url': h['url'], 'thumb': h['url'],
                         'page': h.get('foreign_landing_url'), 'author': h.get('creator') or '',
                         'license': f"CC {h.get('license', '').upper()} {h.get('license_version') or ''}".strip(),
                         'src': 'openverse', 'rank': len(w & words(text))})
        opts = sorted(opts, key=lambda o: -o['rank'])[:PER_ROW]
        kept = []
        for k, o in enumerate(opts):
            p = os.path.join(out, 'thumbs', f"{c['id'].replace('/', '')}-{k + 1}.jpg")
            b = get(o['url'], raw=True)
            if b:
                open(p, 'wb').write(b)
                kept.append(o)
            else:
                break
        if kept:
            found.append({**c, 'opts': kept})
            json.dump(found, open(pool_path, 'w'), ensure_ascii=False, indent=0)
        print(f"{c['name'][:40]}: {len(kept)}", flush=True)
        time.sleep(2)
    sheets(found, out)


if __name__ == '__main__':
    main(*sys.argv[1:4])
