"""
Numbered contact sheets of assets_to_model/*/photo.jpg for a quick review pass, 30 to a sheet, with a
sheets.json mapping each sheet cell to its folder.

  python3 -I tools/assets-to-model/sheets.py assets_to_model out_dir
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageOps

COLS, ROWS, CELL = 6, 5, 300


def main(src, out):
    os.makedirs(out, exist_ok=True)
    # only folders not yet reviewed (a re-picked photo has its review cleared)
    folders = sorted(f for f in os.listdir(src) if os.path.exists(os.path.join(src, f, 'photo.jpg'))
                     and 'review' not in json.load(open(os.path.join(src, f, 'meta.json'))))
    font = ImageFont.load_default(size=22)
    index = {}
    per = COLS * ROWS
    for s in range(0, len(folders), per):
        sheet = Image.new('RGB', (COLS * CELL, ROWS * CELL), 'white')
        d = ImageDraw.Draw(sheet)
        for i, f in enumerate(folders[s:s + per]):
            try:
                im = ImageOps.exif_transpose(Image.open(os.path.join(src, f, 'photo.jpg'))).convert('RGB')
                im.thumbnail((CELL - 6, CELL - 30))
            except Exception:
                im = Image.new('RGB', (10, 10), 'red')
            x, y = (i % COLS) * CELL, (i // COLS) * CELL
            sheet.paste(im, (x + 3, y + 28))
            d.text((x + 4, y + 2), f'{i + 1}', fill='red', font=font)
            d.text((x + 44, y + 6), f[:30], fill='black', font=ImageFont.load_default(size=13))
        name = f'sheet-{s // per + 1:02d}.jpg'
        sheet.save(os.path.join(out, name), quality=80)
        index[name] = folders[s:s + per]
    json.dump(index, open(os.path.join(out, 'sheets.json'), 'w'), indent=0)
    print(len(index), 'sheets')


if __name__ == '__main__':
    main(*sys.argv[1:3])
