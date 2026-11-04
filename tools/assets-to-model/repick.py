"""
Replaces the photo of every folder whose review verdict is `poor` with its next alternate (meta.json
`alternates`), keeping the rejected one as rejected-N.jpg and clearing `review` so the next sheet pass sees it.
Folders with no alternates left are listed for needs-photo.md and keep their poor photo.

  python3 -I tools/assets-to-model/repick.py assets_to_model
"""
import json, os, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_photos import get  # noqa: E402


def main(dest):
    swapped, stuck = 0, []
    for folder in sorted(os.listdir(dest)):
        mp = os.path.join(dest, folder, 'meta.json')
        if folder.startswith('_') or not os.path.exists(mp):
            continue
        m = json.load(open(mp))
        if (m.get('review') or {}).get('verdict') != 'poor':
            continue
        if not m.get('alternates'):
            stuck.append(folder)
            continue
        nxt = m['alternates'].pop(0)
        b = get(nxt['thumb'], raw=True)
        if not b:
            stuck.append(folder)
            continue
        n = len(m.setdefault('rejected', [])) + 1
        os.replace(os.path.join(dest, folder, 'photo.jpg'), os.path.join(dest, folder, f'rejected-{n}.jpg'))
        open(os.path.join(dest, folder, 'photo.jpg'), 'wb').write(b)
        m['rejected'].append({**m['photo'], 'review': m.pop('review')})
        m['photo'] = nxt
        json.dump(m, open(mp, 'w'), ensure_ascii=False, indent=1)
        swapped += 1
        time.sleep(0.3)
    print(swapped, 'swapped;', len(stuck), 'with no alternates left')
    json.dump(stuck, open(os.path.join(dest, 'no-alternates.json'), 'w'), indent=0)


if __name__ == '__main__':
    main(sys.argv[1])
