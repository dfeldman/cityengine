# Blender headless: a Tripo animal's rest pose and a rig test — every bone's rest head (world, Blender z-up),
# then renders: rest side view, and the same with one bone turned, to see whether the weights deform cleanly.
#   blender -b -P tools/animals/rigcheck.py -- <in.glb> <out-prefix> [bone] [degrees]
import bpy, sys, math, mathutils
a = sys.argv[sys.argv.index('--') + 1:]
src, out = a[0], a[1]
bone = a[2] if len(a) > 2 else None
deg = float(a[3]) if len(a) > 3 else 30
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
mesh = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bb = [mesh.matrix_world @ mathutils.Vector(c) for c in mesh.bound_box]
lo = [min(v[i] for v in bb) for i in range(3)]; hi = [max(v[i] for v in bb) for i in range(3)]
print('BOUNDS', [round(v, 3) for v in lo], [round(v, 3) for v in hi])
for b in arm.data.bones:
    h = arm.matrix_world @ b.head_local; t = arm.matrix_world @ b.tail_local
    print('BONE', b.name, 'parent', b.parent.name if b.parent else '-', 'head', [round(v, 3) for v in h], 'tail', [round(v, 3) for v in t])
for img in bpy.data.images: print('IMAGE', img.name, img.size[:])
# camera from the side (-y looking +y, Blender), ortho, framing the bounds
cx, cz = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
span = max(hi[0] - lo[0], hi[2] - lo[2]) * 1.15
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
cam.data.type = 'ORTHO'; cam.data.ortho_scale = span
cam.location = (cx, lo[1] - 10 * span, cz); cam.rotation_euler = (math.pi / 2, 0, 0)
bpy.context.scene.camera = cam
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); bpy.context.scene.collection.objects.link(sun)
sun.rotation_euler = (0.8, 0.2, 0.6); sun.data.energy = 3
w = bpy.data.worlds.new('w'); bpy.context.scene.world = w; w.color = (0.6, 0.6, 0.6)
sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.color_type = 'TEXTURE'
sc.render.resolution_x, sc.render.resolution_y = 320, 240; sc.render.film_transparent = False
sc.render.filepath = out + '-rest.png'; bpy.ops.render.render(write_still=True)
if bone:
    pb = arm.pose.bones[bone]; pb.rotation_mode = 'XYZ'; pb.rotation_euler = (math.radians(deg), 0, 0)
    bpy.context.view_layer.update()
    sc.render.filepath = out + '-bent.png'; bpy.ops.render.render(write_still=True)
