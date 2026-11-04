"""
Applies the Google Photos pick (gphotos.py sheets): where the pick chose a Google photo (cell 2+), it becomes the
folder's photo.jpg, the old one kept as photo-commons.jpg; an object that had no usable photo moves out of
_nophoto/ (or is created). needs-photo.md keeps every row and gains a first column saying what this pass did.

  python3 -I tools/assets-to-model/gphotos_apply.py gp_dir assets_to_model candidates.json[,more.json]
"""
import glob, json, os, re, shutil, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_photos import slug  # noqa: E402

OBJECT_DROPS = {'relief', 'building-sized', 'procedural-fountain', 'indoor'}


def main(gp_dir, dest, cand_paths):
    cands = {c['id']: c for p in cand_paths.split(',') for c in json.load(open(p))}
    rows = {r['id']: r for r in json.load(open(os.path.join(gp_dir, 'gp.json')))}
    sheets = json.load(open(os.path.join(gp_dir, 'pick.json')))
    labels = {}
    for l in json.load(open(os.path.join(gp_dir, 'labels.json'))):
        try:
            labels[sheets[l['sheet']]['ABCDE'.index(str(l['row']).upper())]] = l
        except (KeyError, IndexError, ValueError):
            pass
    outcome = {}
    for cid, r in rows.items():
        l = labels.get(cid)
        if not l:
            continue
        best = int(l.get('best') or 0)
        gp = {int(re.search(r'-(\d+)\.jpg$', p).group(1)): p for p in r['gp']}
        if best < 2 or best not in gp:
            outcome[cid] = 'Google checked: kept current' if best == 1 and r['current'] else 'Google checked: none usable'
            continue
        if OBJECT_DROPS & set(l.get('issues') or []):
            outcome[cid] = 'Google checked: not freestanding'
            continue
        key = cid.replace('/', '')
        folder = os.path.basename(r['folder']) if r['folder'] else f"{slug(r['name'])}--{key}"
        path = os.path.join(dest, folder)
        if r['folder'] and r['folder'] != folder:  # in _nophoto/ or _dropped/: back into the set
            shutil.rmtree(path, ignore_errors=True)
            shutil.move(os.path.join(dest, r['folder']), path)
        os.makedirs(path, exist_ok=True)
        mp = os.path.join(path, 'meta.json')
        c = cands[cid]
        meta = json.load(open(mp)) if os.path.exists(mp) else {
            **{k: c.get(k) for k in ('id', 'name', 'kind', 'sub', 'lat', 'lon', 'wikidata', 'artist', 'height', 'score')},
            'osm': f'https://www.openstreetmap.org/{cid}'}
        old = os.path.join(path, 'photo.jpg')
        if os.path.exists(old):
            os.replace(old, os.path.join(path, 'photo-commons.jpg'))
            if meta.get('photo'):
                meta.setdefault('alternates', []).insert(0, {**meta['photo'], 'file': 'photo-commons.jpg'})
        shutil.copy(gp[best], old)
        meta.setdefault('art', None)
        meta['photo'] = {'src': 'google-photos', 'page': r['link'], 'license': 'none stated — private modelling reference only'}
        meta['review'] = {'verdict': 'ok', **{k: l.get(k) for k in ('issues', 'parts', 'material', 'plinth', 'note')}}
        json.dump(meta, open(mp, 'w'), ensure_ascii=False, indent=1)
        outcome[cid] = 'Google photo ✓'
    print({v: list(outcome.values()).count(v) for v in set(outcome.values())})

    # needs-photo.md: same rows, a first column for this pass
    np = os.path.join(dest, 'needs-photo.md')
    out = []
    for line in open(np).read().split('\n'):
        if line.startswith('| Name |'):
            line = '| Google Photos |' + line[1:]
        elif line.startswith('|---'):
            line = '|---|' + line[1:]
        elif line.startswith('| '):
            m = re.search(r'openstreetmap\.org/(node|way|relation)/(\d+)', line)
            line = f"| {outcome.get(f'{m.group(1)}/{m.group(2)}', '') if m else ''} |" + line[1:]
        out.append(line)
    open(np, 'w').write('\n'.join(out))


if __name__ == '__main__':
    main(*sys.argv[1:4])
