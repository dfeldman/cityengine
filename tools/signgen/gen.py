"""Extruded sign lettering in a REAL typeface, as a GLB a landmark can load.

The shared `signText` in render/landmarks/parts.ts draws a 3x5 block font. That is right for a small painted
name on a facade, where a few cells read as writing and cost almost nothing. It is wrong for a landmark whose
lettering IS the landmark — Ghirardelli's sign is read from across the bay, and blocky capitals give away that
it is a game the moment you look at it. Those want real letterforms with real curves.

Blender is already the project's asset pipeline (trailtrainer's tree and rock generators), so this uses it
headless: make a text object in a chosen font, extrude it, centre it, scale it so its capitals are exactly the
height asked for, and write a GLB.

    blender -b -P tools/signgen/gen.py -- --text=Ghirardelli --height=5 \
        --font="/System/Library/Fonts/Supplemental/Georgia.ttf" --out=public/models/signs/ghirardelli.glb

Only for letters that genuinely STAND OFF the wall and catch the light. Almost every sign is flat, and a flat
sign is two triangles and a texture made in the browser with no Blender at all -- see render/sign-plates.ts
and the `flat` type in render/landmarks/signage.ts. This path costs thousands of triangles per word.

The mesh is Y-up, centred on the origin in x and y, with its front face at z = 0 and the extrusion going back
into -z, so a landmark entry can place it against a scaffold without fiddling with offsets.
"""
import bpy
import sys
import os
from mathutils import Vector


def arg(name: str, default: str = '') -> str:
    for a in sys.argv:
        if a.startswith(f'--{name}='):
            return a.split('=', 1)[1]
    return default


def colour(text: str, default: tuple) -> tuple:
    """#rrggbb to linear-ish floats; empty gives the default."""
    t = text.strip().lstrip('#')
    if len(t) != 6:
        return default
    return tuple((int(t[i:i + 2], 16) / 255.0) ** 2.2 for i in (0, 2, 4))


def main() -> None:
    text = arg('text', 'SIGN')
    height = float(arg('height', '5'))          # cap height in metres
    depth = float(arg('depth', '0.35'))         # how far the letters stand off the frame
    font_path = arg('font', '/System/Library/Fonts/Supplemental/Georgia.ttf')
    out = arg('out', 'sign.glb')
    bevel = float(arg('bevel', '0.02'))

    bpy.ops.wm.read_factory_settings(use_empty=True)

    # scale so the CAPITALS are `height` tall: measure a capital on its own, not the whole string, or a
    # descender in a lowercase letter would shrink the word
    bpy.ops.object.text_add()
    probe = bpy.context.object
    probe.data.body = 'H'
    if os.path.exists(font_path):
        probe.data.font = bpy.data.fonts.load(font_path)
    bpy.ops.object.convert(target='MESH')
    cap = max(v.co.y for v in probe.data.vertices) - min(v.co.y for v in probe.data.vertices)
    bpy.data.objects.remove(probe, do_unlink=True)
    # (the scale first, so the bevel and the bulbs' spacing can be given in METRES: set in font units and then scaled up
    # ~10x with the letters, a 0.03 bevel swelled every stroke by 0.3 m and filled the word in, 2026-10-17)
    s = height / max(cap, 1e-6)

    bpy.ops.object.text_add()
    ob = bpy.context.object
    ob.data.body = text
    if os.path.exists(font_path):
        ob.data.font = bpy.data.fonts.load(font_path)
    else:
        print(f'signgen: no font at {font_path}, using Blender\'s default')
    # extrude is half-depth each way in Blender, and a small bevel catches the light on the letter edges
    ob.data.extrude = depth / 2
    ob.data.bevel_depth = bevel / s
    ob.data.align_x = 'CENTER'
    ob.data.align_y = 'CENTER'

    # bulbs along the letters, sampled from the curve while it is still a curve
    bulb_gap = float(arg('bulbs', '0'))
    bulb_pts = []
    if bulb_gap > 0:
        # Sample the LETTER OUTLINES before the text becomes a mesh: the real sign carries a line of bulbs
        # along each letter, which is what lights up at night, and following the curve is the only way to get
        # them on the letterforms rather than in a grid near them.
        # a TextCurve has no splines of its own — the letter outlines only exist once it is a CURVE, so
        # convert to that first and take the geometry, then carry on to the mesh
        bpy.ops.object.convert(target='CURVE')
        ob = bpy.context.object
        for spline in ob.data.splines:
            pts = [p.co for p in (spline.bezier_points if spline.type == 'BEZIER' else spline.points)]
            for i in range(len(pts)):
                a = pts[i]
                b = pts[(i + 1) % len(pts)]
                seg = ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) ** 0.5
                n = max(1, int(seg / max(bulb_gap / s, 1e-4)))
                for k in range(n):
                    t = k / n
                    bulb_pts.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))

    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.object

    # (x and y only: the extrusion was set in metres, and scaled with the letters a 0.35 m sign came out 3.9 m deep)
    ob.scale = (s, s, 1)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # centred in x and y, its front face pushed to z = 0 (stood up just before export, below)
    ob.rotation_euler = (0, 0, 0)
    lo = Vector((min(v.co.x for v in ob.data.vertices), min(v.co.y for v in ob.data.vertices), min(v.co.z for v in ob.data.vertices)))
    hi = Vector((max(v.co.x for v in ob.data.vertices), max(v.co.y for v in ob.data.vertices), max(v.co.z for v in ob.data.vertices)))
    ob.location = (-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -hi.z)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    # the bulbs, now that the letters have been scaled and centred: the same transform puts each sampled
    # outline point on the face of its letter. They are their own object with an emissive material, so the
    # game can light them at night without lighting the metal.
    if bulb_pts:
        lit = bpy.data.materials.new('bulb')
        lit.use_nodes = True
        b = lit.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = (1.0, 0.95, 0.85, 1)
        b.inputs['Emission Color'].default_value = (1.0, 0.93, 0.78, 1)
        b.inputs['Emission Strength'].default_value = 3.0
        r = max(0.06, height * 0.035)
        made = []
        for (bx, by) in bulb_pts:
            bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=8, ring_count=6,
                                                 location=(bx * s - (lo.x + hi.x) / 2, by * s - (lo.y + hi.y) / 2, r * 0.4))
            sp = bpy.context.object
            sp.data.materials.append(lit)
            made.append(sp)
        if made:
            bpy.ops.object.select_all(action='DESELECT')
            for m in made:
                m.select_set(True)
            bpy.context.view_layer.objects.active = made[0]
            bpy.ops.object.join()
            print(f'signgen: {len(bulb_pts)} bulbs along the letters')

    mat = bpy.data.materials.new('sign')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    # the letters' own colour, and what they are made of. Painted wooden or plastic letters want metallic 0
    # and a high roughness; polished steel or gilt wants the opposite, which is the default here.
    col = colour(arg('colour', ''), (0.80, 0.80, 0.81))
    bsdf.inputs['Base Color'].default_value = (col[0], col[1], col[2], 1)
    bsdf.inputs['Metallic'].default_value = float(arg('metallic', '0.6'))
    bsdf.inputs['Roughness'].default_value = float(arg('roughness', '0.45'))
    # `--lit=self`: the letter FACES emit, which is what a channel-letter or neon sign does after dark. The
    # bulbs already emit on their own. (Rigged with the flat path's `lit` field; there is no night view yet.)
    if arg('lit', 'none') == 'self':
        bsdf.inputs['Emission Color'].default_value = (col[0], col[1], col[2], 1)
        bsdf.inputs['Emission Strength'].default_value = 2.0
    ob.data.materials.append(mat)
    bpy.context.view_layer.objects.active = ob

    # STAND IT UP (2026-10-17). Blender's text lies in its XY plane, face to +Z; the glTF exporter turns Blender's Z-up into
    # Y-up, which left every sign lying on its back, face to the sky (Ghirardelli's was switched off for it, 2026-10-04,
    # and Ripley's lay flat over its door). Turned +90 degrees about X: the letters' up (+Y) becomes +Z — glTF's up — and
    # their face (+Z) becomes -Y — glTF's +z — with the front still at 0. The bulbs turn with them.
    import math
    for o in bpy.data.objects:
        if o.type != 'MESH':
            continue
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=True)
        o.data.transform(__import__('mathutils').Matrix.Rotation(math.pi / 2, 4, 'X'))
        o.data.update()
    bpy.context.view_layer.objects.active = ob

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=False)
    w = hi.x - lo.x
    print(f'signgen: "{text}" {w:.1f} m wide, caps {height} m -> {out}')


main()
