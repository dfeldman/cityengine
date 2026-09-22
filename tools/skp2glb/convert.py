"""
A downloaded landmark model → a .glb the game can load, with Blender headless.

    blender -b --python tools/skp2glb/convert.py -- in.(dae|kmz|glb|gltf|skp) out.glb [--tris=60000] [--unit=auto|inch|m]

What it does, in order:
  1. imports by extension — Collada (.dae, and .kmz, which is a zip with a .dae in it), glTF, or SketchUp
     (.skp, only with the community "SketchUp Importer" add-on installed; see README.md);
  2. applies every object's transform, so the geometry IS the model and nothing rides on a node;
  3. fixes the units: Collada carries a <unit> and Blender honours it, but SketchUp exports are often in
     inches with the unit dropped — `--unit=inch` forces a ×0.0254 scale, and `auto` guesses inches when the
     model is over 400 m tall (no landmark in these cities is);
  4. joins everything into one mesh (materials survive as slots), triangulates, and decimates to the
     triangle budget;
  5. shrinks any texture over 2048² to 2048²;
  6. exports .glb, Y up (glTF's convention; the game's loader bakes the handedness flip, see vegetation.ts),
     and prints the bounding box in metres so it can be checked against the OSM footprint.
"""
import sys
import zipfile
import tempfile
from pathlib import Path

import bpy
import mathutils


def args() -> dict:
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    pos = [a for a in argv if not a.startswith('--')]
    opt = dict(a[2:].split('=', 1) for a in argv if a.startswith('--') and '=' in a)
    if len(pos) < 2:
        raise SystemExit('usage: blender -b --python convert.py -- in.dae out.glb [--tris=60000] [--unit=auto|inch|m]')
    return {'src': Path(pos[0]), 'out': Path(pos[1]), 'tris': int(opt.get('tris', 60000)), 'unit': opt.get('unit', 'auto')}


def import_any(src: Path) -> None:
    ext = src.suffix.lower()
    if ext == '.kmz':
        tmp = Path(tempfile.mkdtemp())
        with zipfile.ZipFile(src) as z:
            z.extractall(tmp)
        daes = sorted(tmp.rglob('*.dae'))
        if not daes:
            raise SystemExit(f'{src}: no .dae inside the .kmz')
        src, ext = daes[0], '.dae'
    if ext == '.dae':
        bpy.ops.wm.collada_import(filepath=str(src), import_units=True)
    elif ext in ('.glb', '.gltf'):
        bpy.ops.import_scene.gltf(filepath=str(src))
    elif ext == '.skp':
        if not hasattr(bpy.ops.import_scene, 'skp'):
            raise SystemExit('.skp needs the SketchUp Importer add-on (README.md, route b), or export Collada '
                             'from SketchUp and convert that (route a)')
        bpy.ops.import_scene.skp(filepath=str(src))
    else:
        raise SystemExit(f'{src}: unsupported type {ext}')


def main() -> None:
    a = args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    import_any(a['src'])

    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    if not meshes:
        raise SystemExit('no mesh in the file')
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    # parents first: a child's transform is relative to its parent, so clear parents keeping the world matrix
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    # location too: then mesh coordinates ARE world coordinates, and the recentring below means what it says
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join()
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj = bpy.context.view_layer.objects.active

    def bbox():
        pts = [obj.matrix_world @ v.co for v in obj.data.vertices]
        lo = mathutils.Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
        hi = mathutils.Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        return lo, hi

    lo, hi = bbox()
    height = hi.z - lo.z   # Blender is Z-up; the Collada importer has already turned Y-up files upright
    scale = 1.0
    if a['unit'] == 'inch' or (a['unit'] == 'auto' and height > 400):
        scale = 0.0254
        print(f'  units: treating as INCHES (height {height:.0f} "m" is implausible), ×0.0254')
    if scale != 1.0:
        obj.scale = (scale, scale, scale)
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=True)
        lo, hi = bbox()

    # stand it on the origin: centred in plan, base at 0 — the manifest's offset is then relative to that
    shift = mathutils.Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    obj.data.transform(mathutils.Matrix.Translation(-shift))
    obj.location = (0, 0, 0)

    tri = obj.modifiers.new('tri', 'TRIANGULATE')
    bpy.ops.object.modifier_apply(modifier=tri.name)
    n = len(obj.data.polygons)
    if n > a['tris']:
        dec = obj.modifiers.new('dec', 'DECIMATE')
        dec.ratio = a['tris'] / n
        bpy.ops.object.modifier_apply(modifier=dec.name)
        print(f'  decimated {n} → {len(obj.data.polygons)} triangles')

    for img in bpy.data.images:
        if img.size[0] > 2048 or img.size[1] > 2048:
            f = 2048 / max(img.size[0], img.size[1])
            img.scale(int(img.size[0] * f), int(img.size[1] * f))
            print(f'  texture {img.name} → {img.size[0]}×{img.size[1]}')

    lo, hi = bbox()
    a['out'].parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(a['out']), export_format='GLB', export_yup=True,
                              use_selection=False, export_apply=True)
    print(f'  → {a["out"]}  {len(obj.data.polygons)} triangles, '
          f'{hi.x - lo.x:.1f} × {hi.y - lo.y:.1f} m in plan, {hi.z - lo.z:.1f} m tall, '
          f'{len(bpy.data.images)} textures')


main()
