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


def main() -> None:
    text = arg('text', 'SIGN')
    height = float(arg('height', '5'))          # cap height in metres
    depth = float(arg('depth', '0.35'))         # how far the letters stand off the frame
    font_path = arg('font', '/System/Library/Fonts/Supplemental/Georgia.ttf')
    out = arg('out', 'sign.glb')
    bevel = float(arg('bevel', '0.02'))

    bpy.ops.wm.read_factory_settings(use_empty=True)

    bpy.ops.object.text_add()
    ob = bpy.context.object
    ob.data.body = text
    if os.path.exists(font_path):
        ob.data.font = bpy.data.fonts.load(font_path)
    else:
        print(f'signgen: no font at {font_path}, using Blender\'s default')
    # extrude is half-depth each way in Blender, and a small bevel catches the light on the letter edges
    ob.data.extrude = depth / 2
    ob.data.bevel_depth = bevel
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
                n = max(1, int(seg / max(bulb_gap, 1e-3)))
                for k in range(n):
                    t = k / n
                    bulb_pts.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))

    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.object

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

    s = height / max(cap, 1e-6)
    ob.scale = (s, s, s)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Blender text lies in the XY plane facing +z; the game is Y-up with the sign standing in XY, so rotate
    # the object's -90 degrees about X to stand it up, then push the front face to z = 0
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
                                                 location=(bx * s - (lo.x + hi.x) / 2 * s, by * s - (lo.y + hi.y) / 2 * s, r * 0.4))
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
    bsdf.inputs['Base Color'].default_value = (0.80, 0.80, 0.81, 1)
    bsdf.inputs['Metallic'].default_value = 0.6
    bsdf.inputs['Roughness'].default_value = 0.45
    ob.data.materials.append(mat)
    bpy.context.view_layer.objects.active = ob

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=False)
    w = (hi.x - lo.x) * s
    print(f'signgen: "{text}" {w:.1f} m wide, caps {height} m -> {out}')


main()
