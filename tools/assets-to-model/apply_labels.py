"""
Folds the review labels (one per contact-sheet cell) into each folder's meta.json as `review`, moves dropped
folders to assets_to_model/_dropped/, and writes assets_to_model/INDEX.md and needs-photo.md.

  python3 -I tools/assets-to-model/apply_labels.py assets_to_model sheets_dir
Labels: sheets_dir/labels-*.json, cells keyed by sheets_dir/sheets.json.
"""
import glob, json, os, shutil, sys

OBJECT_DROPS = {'relief', 'building-sized', 'procedural-fountain'}


def main(dest, sheets):
    index = json.load(open(os.path.join(sheets, 'sheets.json')))
    labels = [l for f in sorted(glob.glob(os.path.join(sheets, 'labels-*.json'))) for l in json.load(open(f))]
    os.makedirs(os.path.join(dest, '_dropped'), exist_ok=True)
    seen = set()
    for l in labels:
        try:
            folder = index[l['sheet']][int(l['cell']) - 1]
        except (KeyError, IndexError, ValueError):
            continue
        path = os.path.join(dest, folder)
        if folder in seen or not os.path.isdir(path):
            continue
        seen.add(folder)
        meta = json.load(open(os.path.join(path, 'meta.json')))
        meta['review'] = {k: l.get(k) for k in ('verdict', 'issues', 'parts', 'material', 'plinth', 'note')}
        json.dump(meta, open(os.path.join(path, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
        # a wrong, tiny or night photo condemns the photo, not the object: it goes back for a re-pick
        if l.get('verdict') == 'drop' and not OBJECT_DROPS & set(l.get('issues') or []):
            meta['review']['verdict'] = 'poor'
            json.dump(meta, open(os.path.join(path, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
        elif l.get('verdict') == 'drop':
            shutil.move(path, os.path.join(dest, '_dropped', folder))

    rows, unreviewed = [], 0
    for folder in sorted(os.listdir(dest)):
        mp = os.path.join(dest, folder, 'meta.json')
        if folder.startswith('_') or not os.path.exists(mp):
            continue
        m = json.load(open(mp))
        r = m.get('review') or {}
        unreviewed += not r
        rows.append(f"| [{m['name']}]({folder}/photo.jpg) | {m['kind']} {m['sub'] or ''} | {r.get('verdict', '?')} | "
                    f"{r.get('parts', '')} | {r.get('material', '')} | {r.get('plinth', '')} | "
                    f"{', '.join(r.get('issues') or [])} {r.get('note') or ''} | {m['lat']:.5f}, {m['lon']:.5f} |")
    with open(os.path.join(dest, 'INDEX.md'), 'w') as f:
        f.write('# Paris statues, sculptures and fountains to model\n\n'
                'One folder each: photo.jpg (Wikimedia Commons, credit in meta.json `photo.author` / `photo.license`), '
                'meta.json (OSM id, position, `review`). `poor` photos have `alternates` in meta.json. Dropped folders '
                'are in _dropped/.\n\n'
                '| Name | Kind | Verdict | Parts | Material | Plinth | Issues / note | Lat, lon |\n|---|---|---|---|---|---|---|---|\n')
        f.write('\n'.join(rows) + '\n')
    print(len(rows), 'kept;', unreviewed, 'unreviewed;', len(os.listdir(os.path.join(dest, '_dropped'))), 'dropped')


if __name__ == '__main__':
    main(*sys.argv[1:3])
