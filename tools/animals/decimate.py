# Blender headless: one Tripo GLB cut down to TARGET triangles, UVs and texture kept.
#   blender -b -P tools/animals/decimate.py -- <in.glb> <out.glb> [target_tris]
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
target = int(a[2]) if len(a) > 2 else 3000
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.context.view_layer.objects.active = meshes[0]
for o in meshes: o.select_set(True)
if len(meshes) > 1: bpy.ops.object.join()
o = bpy.context.view_layer.objects.active
tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
m = o.modifiers.new('dec', 'DECIMATE'); m.ratio = min(1, target / tris)
bpy.ops.object.modifier_apply(modifier='dec')
print('tris', tris, '->', sum(len(p.vertices) - 2 for p in o.data.polygons))
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', use_selection=True, export_yup=True)
