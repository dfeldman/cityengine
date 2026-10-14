"""
San Francisco's street trees as models (SF_PLAN.md §5): Trail Trainer's broadleaf generator
(assetkit's tools/treekit, SpeedTree-style generators, Blender headless) with this city's own species
(species/*.json) and leaf pages and barks (pages.py). A species file may extend one of Trail Trainer's
(`"extends": "tt:maple"`); the rest of the botany is shared, unchanged.

    python3 tools/sftrees/pages.py                                   once: SF's leaf pages and barks
    python3 tools/sftrees/library.py                                 (re)write library.json from its table
    blender -b -P tools/sftrees/gen.py -- --library                  build public/sftrees/ (gitignored)
    blender -b -P tools/sftrees/gen.py -- --library \
        --library-file tools/sftrees/library-monterey.json           ...AND THIS ONE, or the park loses its
        trees: Monterey cypress and Monterey pine (BUGS.md #215) are a separate table because they are
        conifers and the park's, not the street register's. The index merges, so the order does not matter —
        but a rebuild of library.json alone leaves render/sf/flora.ts naming `sf_cypress` and `sf_mpine`
        with nothing behind them, which plants the park's two commonest forms as nothing at all.
    blender -b -P tools/sftrees/gen.py -- --species sf_ficus --seed 3 --preview --out /tmp/x

What comes out is exactly what Trail Trainer's trees are (a GLB per tree, LOD0-2, `index.json`), so
render/vegetation.ts loads either library the same way.
"""
import copy
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
# assetkit (github.com/dfeldman/assetkit), checked out beside this repo, or wherever $ASSETKIT points
TT = Path(os.environ.get('ASSETKIT') or Path(__file__).resolve().parents[3] / 'assetkit') / 'tools'
sys.path.insert(0, str(TT))

from treekit import genkit  # noqa: E402
from treekit.genkit import Generator, run  # noqa: E402

TT_CACHE = TT / 'cache' / 'deciduousgen'
# the conifers' own textures: Monterey cypress and Monterey pine are conifers and take their bark and their
# needle pages from Trail Trainer's conifergen, not from the broadleaf cache (see `CONIFER_BARKS`)
TT_CONIFER = TT / 'cache' / 'conifergen'
CACHE = HERE.parent / 'cache' / 'sftrees'
OWN_BARKS = {'plane', 'gum', 'ficus'}
CONIFER_BARKS = {'cedar', 'knotted', 'pine', 'fir', 'spruce_bark'}


def bark(spec: dict, size: int) -> tuple[Path, Path, Path]:
    key = spec.get('bark', 'brown')
    sfx = '' if size == 1024 else '_512'
    if key in CONIFER_BARKS:
        return (TT_CONIFER / f'bark_{key}_diff{sfx}.jpg', TT_CONIFER / f'bark_{key}_arm{sfx}.jpg', TT_CONIFER / f'bark_{key}_nor_gl{sfx}.jpg')
    if key in OWN_BARKS:
        # the colour is SF's own; the relief (normal, occlusion/roughness) is the platanus photograph it was graded from
        return (CACHE / f'bark_{key}_diff{sfx}.jpg', TT_CACHE / f'bark_platanus_arm{sfx}.jpg', TT_CACHE / f'bark_platanus_nor_gl{sfx}.jpg')
    return (TT_CACHE / f'bark_{key}_diff{sfx}.jpg', TT_CACHE / f'bark_{key}_arm{sfx}.jpg', TT_CACHE / f'bark_{key}_nor_gl{sfx}.jpg')


def leaves(spec: dict, size: int) -> Path:
    sfx = '' if size == 1024 else '_512'
    page = spec.get('leaves_page', 'broad')
    # a conifer's foliage is a NEEDLE page, painted by conifergen; `needles` says so rather than guessing
    # from the page's name, because 'larch' names a leaf page here and a needle page there
    if spec.get('needles'):
        return TT_CONIFER / f'needle_{page}_atlas{sfx}.png'
    own = CACHE / f'leaf_{page}_atlas{sfx}.png'
    return own if own.exists() else TT_CACHE / f'leaf_{page}_atlas{sfx}.png'


_load = genkit.load_species


def load_species(gen: Generator, name: str) -> dict:
    """`tt:<name>` is one of Trail Trainer's deciduous species, `ttc:<name>` one of its conifers; anything
    else is ours."""
    if name.startswith('ttc:'):
        return json.loads((TT / 'conifergen' / 'species' / f'{name[4:]}.json').read_text())
    if name.startswith('tt:'):
        return json.loads((TT / 'deciduousgen' / 'species' / f'{name[3:]}.json').read_text())
    spec = json.loads((gen.here / 'species' / f'{name}.json').read_text())
    if 'extends' in spec:
        merged = copy.deepcopy(load_species(gen, spec['extends']))
        genkit._deep_update(merged, {k: v for k, v in spec.items() if k != 'extends'})
        spec = merged
    # `compact`: a street tree is half a forest tree's height, and density is per metre of parent, so it would get an
    # eighth of the twigs over three levels — every level's density times k, the leaves' spacing over it
    if 'compact' in spec:
        k = float(spec.pop('compact'))
        for level in spec.get('levels') or []:
            d = level.get('density', 3.0)
            level['density'] = [d[0] * k, d[1] * k] if isinstance(d, list) else ({**d, 'curve': [c * k for c in d['curve']]} if isinstance(d, dict) else d * k)
        lv = spec.setdefault('leaves', {})
        lv['spacing'] = float(lv.get('spacing', 0.35)) / k
    # `set`: --set-style overrides in the file, for what a merge cannot reach (one level's length, one angle)
    if 'set' in spec:
        spec = genkit.apply_overrides({k: v for k, v in spec.items() if k != 'set'}, spec['set'])
    return spec


genkit.load_species = load_species

if __name__ == '__main__':
    run(Generator(name='sftrees', here=HERE, cache=CACHE, default_out=HERE.parent.parent / 'public' / 'sftrees',
                  doc=__doc__, bark=bark, leaves=leaves))
