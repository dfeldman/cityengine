# What the Blender clip scripts for Tripo's UNRIGGED animals share (swan, goose, rabbit): load and cut down the
# mesh, build a skeleton, skin it from a per-vertex weight function, bake clips as glTF actions, render a preview.
# The older scripts (peacock-clips.py, flamingo-clips.py) carry their own copies of the same steps.
#
# Every one of these animals faces −y, z up, feet at z = 0. Rotations are about WORLD axes of the rest pose, turned
# into each bone's own frame (as bison-clips.py):
#   about +X (SIDE): positive bends an upward bone (a neck) FORWARD, tips a forward bone (a head) DOWN, swings a
#                    downward bone's tip (a leg) BACK
#   about +Z (UP):   a turn to the animal's right… or left; only the sign of a sway matters
#   about +Y (FWD):  a roll
import bpy, bmesh, math, os, subprocess
from mathutils import Quaternion, Vector
from mathutils.geometry import intersect_point_line

SIDE, FWD, UP = (1, 0, 0), (0, 1, 0), (0, 0, 1)
TAU = 2 * math.pi


def smooth(t):
    t = min(1, max(0, t)); return t * t * (3 - 2 * t)


def bump(t, a0, a1, b0, b1):
    return smooth((t - a0) / (a1 - a0)) * (1 - smooth((t - b0) / (b1 - b0)))


def load(src, tris, cut=None, pick=None, turn=0.0):
    """the mesh, its transforms applied; `cut(co)` → True deletes a vertex before decimating to `tris`. `pick(name)` →
    True keeps only the mesh object(s) so named (everything else, rigs and helper meshes, is thrown away); `turn`
    degrees about +Z is applied to the mesh"""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)
    if pick:
        for o in list(bpy.context.scene.objects):
            if not (o.type == 'MESH' and pick(o.name)): bpy.data.objects.remove(o)
        for o in bpy.context.scene.objects:
            o.parent = None; o.rotation_mode = "XYZ"; o.rotation_euler[2] += math.radians(turn)
    mesh = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bm = bmesh.new(); bm.from_mesh(mesh.data)
    # Tripo's triangles can come unwelded, which stops the decimator short: weld first (UVs live on the loops)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    if cut:
        gone = [v for v in bm.verts if cut(v.co)]
        bmesh.ops.delete(bm, geom=gone, context='VERTS')
        print('cut', len(gone), 'verts')
    bm.to_mesh(mesh.data); bm.free()
    count = lambda: sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    n0 = count()
    # a cut leaves open edges the decimator is shy of: it stops short, so go again
    for _ in range(4):
        n = count()
        if n < tris * 1.15: break
        m = mesh.modifiers.new('dec', 'DECIMATE'); m.ratio = tris / n
        bpy.ops.object.modifier_apply(modifier='dec')
    print('tris', n0, '->', count())
    return mesh


def bends(chain_dirs, target, depth):
    """each bone's own bend about +X so a chain ends pointing at `target` (degrees, 0 forward, 90 up), `depth` of
    the way: chain_dirs [(bone, rest degrees)]; a parent's bend carries its children, so each subtracts the sum"""
    out, acc = {}, 0
    for n, rest in chain_dirs:
        want = math.radians(rest - target[n]) * depth
        out[n] = want - acc; acc = want
    return out


def deg(h, t):
    """a bone's direction in the y–z plane, degrees: 0 forward (−y), 90 up"""
    return math.degrees(math.atan2(t[1] - h[1], -(t[0] - h[0])))


def armature(name, bones):
    """bones: [(name, head, tail, parent or None)], heads and tails as (x, y, z)"""
    data = bpy.data.armatures.new(name)
    arm = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    for n, h, t, parent in bones:
        b = data.edit_bones.new(n); b.head = Vector(h); b.tail = Vector(t); b.roll = 0
        if parent: b.parent = data.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm


def skin(mesh, arm, weights):
    """weights(co) → {bone: weight}; each vertex's weights are normalised"""
    groups = {b.name: mesh.vertex_groups.new(name=b.name) for b in arm.data.bones}
    for v in mesh.data.vertices:
        w = {k: x for k, x in weights(v.co.copy()).items() if x > 0.001}
        tot = sum(w.values()) or 1
        for k, x in w.items(): groups[k].add([v.index], x / tot, 'REPLACE')
    mesh.parent = arm
    mod = mesh.modifiers.new('arm', 'ARMATURE'); mod.object = arm


def seg_dist(p, h, t):
    _, f = intersect_point_line(p, Vector(h), Vector(t))
    f = min(1, max(0, f))
    return (p - (Vector(h) + (Vector(t) - Vector(h)) * f)).length


def chain(p, segs, blend):
    """distance-to-capsule weights along a chain: segs [(bone, head, tail, radius)] → ({bone: w}, how far outside)"""
    d = {}
    for n, h, t, r in segs: d[n] = min(d.get(n, 9), seg_dist(p, h, t) - r)
    near = min(d.values())
    raw = {k: math.exp(-max(0, x - near) / blend * 3) for k, x in d.items()}
    tot = sum(raw.values())
    return {k: x / tot for k, x in raw.items()}, near


def bake(arm, clips, fps):
    """clips: [(name, seconds, fn)], fn(t) → ({bone: [(axis, angle)…]}, root lift in model units); one NLA track each"""
    bpy.context.scene.render.fps = fps
    P = {b.name: b for b in arm.pose.bones}
    for pb in P.values(): pb.rotation_mode = 'QUATERNION'
    def q(pb, axis, ang):
        return Quaternion((pb.bone.matrix_local.to_3x3().inverted() @ Vector(axis)).normalized(), ang)
    arm.animation_data_create()
    names = set()
    for _, dur, fn in clips:
        for f in range(int(dur * fps) + 1): names |= set(fn(f / fps)[0])
    for name, dur, fn in clips:
        act = bpy.data.actions.new(name)
        arm.animation_data.action = act
        frames = int(round(dur * fps))
        for f in range(frames + 1):
            r, lift = fn((f % frames) / fps)
            for bn in names:
                pb = P[bn]
                rot = Quaternion()
                for ax, ang in r.get(bn, []): rot = q(pb, ax, ang) @ rot
                pb.rotation_quaternion = rot
                pb.keyframe_insert('rotation_quaternion', frame=f)
            P['Root'].location = P['Root'].bone.matrix_local.to_3x3().inverted() @ Vector((0, 0, lift))
            P['Root'].keyframe_insert('location', frame=f)
        track = arm.animation_data.nla_tracks.new(); track.name = name
        track.strips.new(name, 0, act)
        arm.animation_data.action = None


def export(dst):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS',
                              export_force_sampling=True, export_frame_step=1)
    print('exported', dst)


def preview(arm, clips, fps, out, z, scale, per=6, water=None, res=200):
    """a contact sheet per view (side, 3/4): `per` frames of each clip in a row; `water` draws a plane at that z"""
    os.makedirs(out, exist_ok=True)
    sc = bpy.context.scene
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam)
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = scale
    sc.camera = cam
    w = bpy.data.worlds.new('w'); sc.world = w; w.color = (0.55, 0.62, 0.7)
    if water is not None:
        bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, water))
        mat = bpy.data.materials.new('water'); mat.diffuse_color = (0.15, 0.3, 0.4, 1)
        bpy.context.object.data.materials.append(mat)
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.color_type = 'TEXTURE'
    sc.display.shading.light = 'STUDIO'
    sc.render.resolution_x, sc.render.resolution_y = res, res
    for view, loc, rot in [('side', (3, 0, z), (90, 0, 90)), ('q', (2.1, -2.1, z + 1.2), (66, 0, 45))]:
        cam.location = loc; cam.rotation_euler = [math.radians(a) for a in rot]
        i = 0
        for name, dur, _ in clips:
            arm.animation_data.action = bpy.data.actions[name]
            frames = int(round(dur * fps))
            for k in range(per):
                sc.frame_set(int(frames * k / per))
                sc.render.filepath = os.path.join(out, f'{view}-{i:03d}.png'); i += 1
                bpy.ops.render.render(write_still=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(out, f'{view}-%03d.png'),
                        '-vf', f'tile={per}x{len(clips)}', os.path.join(out, f'{view}.png')])
    print('preview', out)
