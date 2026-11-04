"""
assets_to_model/INDEX.md (one row per folder with a picked photo) and needs-photo.md (candidates the pick found no
usable photo for, and any folder left from the first pass that the pick never saw — those move to _nophoto/).

  python3 -I tools/assets-to-model/index.py assets_to_model candidates.json[,more.json] [suffix]
With a suffix (e.g. -outside-paris) only those candidates are listed, in INDEX<suffix>.md and needs-photo<suffix>.md,
and the main lists are left alone.
"""
import json, os, shutil, sys


def main(dest, cand_paths, suffix=''):
    cands = [c for p in cand_paths.split(',') for c in json.load(open(p))]
    subset = {c['id'] for c in cands} if suffix else None
    rows, need = [], []
    os.makedirs(os.path.join(dest, '_nophoto'), exist_ok=True)
    for folder in sorted(os.listdir(dest)):
        mp = os.path.join(dest, folder, 'meta.json')
        if folder.startswith('_') or not os.path.exists(mp):
            continue
        m = json.load(open(mp))
        if subset is not None and m['id'] not in subset:
            continue
        r = m.get('review') or {}
        if 'art' not in m or r.get('verdict') != 'ok':
            shutil.rmtree(os.path.join(dest, '_nophoto', folder), ignore_errors=True)
            shutil.move(os.path.join(dest, folder), os.path.join(dest, '_nophoto', folder))
            continue
        rows.append((m, folder, r))
    # every candidate neither kept nor dropped needs a photo, folder or not
    done = {m['id'] for m, _, _ in rows}
    for folder in os.listdir(os.path.join(dest, '_dropped')):
        mp = os.path.join(dest, '_dropped', folder, 'meta.json')
        if os.path.exists(mp):
            done.add(json.load(open(mp))['id'])
    for c in cands:
        if c['id'] not in done:
            done.add(c['id'])
            need.append({**c, 'osm': None if c['id'].startswith('wd/') else f"https://www.openstreetmap.org/{c['id']}"})

    cell = lambda s: str(s or '').replace('|', '/')
    with open(os.path.join(dest, f'INDEX{suffix}.md'), 'w') as f:
        f.write(f'# Paris statues, sculptures and fountains to model ({len(rows)})\n\n'
                'Freestanding objects from OSM and Wikidata, one folder each: `photo.jpg` (Wikimedia Commons, 1920 px; '
                'credit in meta.json `photo.author` / `photo.license`) and `meta.json` (OSM id, Wikidata, position, '
                '`review`, unpicked `alternates`). Review: `parts` = GLBs the photo implies; `material` = the untextured '
                'shader (render/statues.ts SHADERS; `gilt` and `steel` have none yet); `plinth` = `skip` for an ordinary '
                'plinth, `model` when it is distinctive or has figures around it. Reliefs are kept, tagged `relief` in Issues. Building-sized pieces, plain '
                'basins and indoor pieces are in `_dropped/`; candidates with no usable photo in `_nophoto/` '
                '(needs-photo.md).\n\n'
                '| Name | Kind | Parts | Material | Plinth | Issues / note | Lat, lon |\n|---|---|---|---|---|---|---|\n')
        for m, folder, r in sorted(rows, key=lambda x: -(x[0].get('score') or 0)):
            issues = ', '.join(i for i in r.get('issues') or [])
            f.write(f"| [{cell(m['name'])}]({folder}/photo.jpg) | {cell(m.get('sub') or m['kind'])} | {r.get('parts') or 1} | "
                    f"{r.get('material') or '?'} | {r.get('plinth') or ''} | {cell(issues)} {cell(r.get('note'))} | "
                    f"{m['lat']:.5f}, {m['lon']:.5f} |\n")
    with open(os.path.join(dest, f'needs-photo{suffix}.md'), 'w') as f:
        f.write(f'# Candidates with no usable photo ({len(need)})\n\nCommons had no photo of the object itself fit to '
                'model from. Sorted by importance score.\n\n| Name | Kind | Wikidata | OSM | Lat, lon |\n|---|---|---|---|---|\n')
        for m in sorted(need, key=lambda m: -(m.get('score') or 0)):
            f.write(f"| {cell(m['name'])} | {cell(m.get('sub') or m['kind'])} | {m.get('wikidata') or ''} | "
                    f"{m.get('osm') or ''} | {m['lat']:.5f}, {m['lon']:.5f} |\n")
    print(len(rows), 'to model;', len(need), 'need a photo')


if __name__ == '__main__':
    main(*sys.argv[1:4])
