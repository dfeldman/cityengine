"""
Stills of a GLB, in Blender, headless. Run by Blender, not by the venv:

    blender -b -P render.py -- <in.glb> <out.png> [azimuth_deg] [elevation_deg] [width_m] [cx] [cz] [lift_m]

Workbench engine, vertex colours, shadows and cavity on — an orthographic model shot, the same frame every
time, so two stills differ only by what changed.
"""
import math
import sys

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
src, out = args[0], args[1]
az = math.radians(float(args[2])) if len(args) > 2 else math.radians(215)
el = math.radians(float(args[3])) if len(args) > 3 else math.radians(38)
width = float(args[4]) if len(args) > 4 else 0
tx = float(args[5]) if len(args) > 5 else 0.0
tz = float(args[6]) if len(args) > 6 else 0.0
lift = float(args[7]) if len(args) > 7 else None      # frame centre this far above the lowest point

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
lo = Vector((1e9, 1e9, 1e9)); hi = -lo
for o in objs:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
# glTF (x, y up, z) arrives in Blender as (x, -z, y): east is +x, north is +y, up is +z
centre = Vector((tx, -tz, lo.z + lift if lift is not None else (lo.z + hi.z) / 2)) if width else (lo + hi) / 2
span = width or max(hi.x - lo.x, hi.y - lo.y) * 1.05

# a ground plane to catch the shadows
bpy.ops.mesh.primitive_plane_add(size=4000, location=(0, 0, lo.z - 0.05))
bpy.context.object.color = (0.16, 0.18, 0.17, 1)

cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
bpy.context.scene.collection.objects.link(cam)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = span
d = Vector((math.sin(az) * math.cos(el), math.cos(az) * math.cos(el), math.sin(el)))   # az from north, clockwise
cam.location = centre + d * 1500
cam.data.clip_end = 5000
cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
sc = bpy.context.scene
sc.camera = cam
sc.render.engine = 'BLENDER_WORKBENCH'
sh = sc.display.shading
sh.light = 'STUDIO'
sc.view_settings.view_transform = 'Standard'
sc.view_settings.exposure = 1.1
sh.color_type = 'VERTEX'
sh.show_shadows = True
sh.shadow_intensity = 0.55
sh.show_cavity = True
sh.cavity_type = 'BOTH'
sh.show_object_outline = False
sc.display.light_direction = (0.45, 0.35, 0.82)
sc.display.render_aa = '8'
sc.render.resolution_x, sc.render.resolution_y = 1800, 1100
sc.render.film_transparent = False
sc.world = bpy.data.worlds.new('w')
sc.world.color = (0.6, 0.7, 0.8)
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print('wrote', out)
