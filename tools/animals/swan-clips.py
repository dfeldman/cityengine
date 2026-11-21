# Blender headless: Tripo's mute swan has NO rig and stands on its feet. A swan in the game only swims: this cuts
# the legs off (they would be under the water), builds a body and a three-bone neck with the head, skins it by
# distance to the neck's centreline, and writes the clips render/zoo.ts plays:
#   blender -b -P tools/animals/swan-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — floating: the neck swaying, the head turning, a slow rock on the water
#   browse — FEEDING: the neck bends forward and the head dips into the water, twice, and comes back up
#   walk   — GLIDING (the clip keeps the name render/zoo.ts plays): the body rocks a little, the neck eases forward
#            and back with each stroke of the unseen feet; baked in place, the game moves the bird at WALK_SPEED
#
# Faces −y, z up, normalised 0.976 tall and 0.98 long (beak to tail). Measured (2026-11-20): feet below z 0.10 at
# |x| 0.10–0.26; the neck rises from the breast (y −0.27, z 0.48), back to (−0.16, 0.76), the head on top at
# z 0.85–0.97 with the beak forward and down to (−0.49, 0.78). Raised wings at y > −0.15, out of the neck's way.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigkit import *

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview_dir = a[2] if len(a) > 2 else None

TRIS = 15000
FPS = 24
SIZE = 1.4                 # metres per model unit (render/zoo.ts SPECIES.swan.size): 1.4 m beak to tail
LEG_CUT_Z = 0.10           # the feet and shanks, under the body's underside, go
IDLE_S = 12.0
FEED_S = 9.0
GLIDE_S = 2.4              # one stroke of the feet
WATERLINE = 0.2            # (preview only) where the water reaches, model units: zoo.ts SWAN_SINK / SIZE
# feeding: where each bone points, degrees from forward (90 up): the neck reaches forward and down, the bill under
FEED_DIR = {'Neck0': 40, 'Neck1': -10, 'Neck2': -50, 'Head': -80}
DIP = 1.0                  # how far toward that pose
BLEND = 0.025

# the neck, (y, z) on the centre plane x = 0: bone, head, tail, radius
NECK = [('Neck0', (-0.27, 0.48), (-0.19, 0.62), 0.06), ('Neck1', (-0.19, 0.62), (-0.16, 0.76), 0.05),
        ('Neck2', (-0.16, 0.76), (-0.19, 0.87), 0.05), ('Head', (-0.19, 0.87), (-0.47, 0.80), 0.06)]
HEAD_Z, HEAD_Y = 0.84, -0.17   # above and ahead of this, all head
NECK_BASE_Z = 0.44         # below this, all body
WING_TOP = 0.62            # the raised wings' top, a little over
V = lambda p: (0, p[0], p[1])

mesh = load(src, TRIS, cut=lambda co: co.z < LEG_CUT_Z)
arm = armature('swan', [('Root', (0, 0, 0), (0, -0.05, 0), None), ('Body', (0, 0, 0.25), (0, 0, 0.45), 'Root')] +
               [(n, V(h), V(t), 'Body' if i == 0 else NECK[i - 1][0]) for i, (n, h, t, r) in enumerate(NECK)])
segs = [(n, V(h), V(t), r) for n, h, t, r in NECK]
REST = [(n, deg(h, t)) for n, h, t, r in NECK]

def weights(p):
    w, near = chain(p, segs, BLEND)
    if p.z > HEAD_Z and p.y < HEAD_Y: w, near = {'Head': 1}, -1
    # the raised wings reach forward to y −0.12 but only up to z 0.58; above that the neck's back is at y −0.11
    clear = max(smooth((-p.y - 0.12) / 0.04), smooth((p.z - WING_TOP) / 0.04))
    member = (1 - smooth(near / 0.02)) * smooth((p.z - NECK_BASE_Z) / 0.04) * clear
    out = {k: x * member for k, x in w.items()}
    out['Body'] = 1 - member
    return out
skin(mesh, arm, weights)

def pose_idle(t):
    s = t / IDLE_S
    look = math.sin(TAU * s + 0.4) ** 3
    return {
        'Body': [(FWD, 0.03 * math.sin(TAU * 2 * s)), (SIDE, 0.02 * math.sin(TAU * 3 * s + 1))],
        'Neck0': [(UP, 0.12 * look), (SIDE, 0.05 * math.sin(TAU * 2 * s))],
        'Neck1': [(UP, 0.15 * look)],
        'Neck2': [(UP, 0.2 * look), (SIDE, -0.05 * math.sin(TAU * 2 * s))],
        'Head': [(UP, 0.25 * math.sin(TAU * 3 * s + 1.1) ** 3)],
    }, 0.004 * math.sin(TAU * 3 * s)

def pose_feed(t):
    s = t / FEED_S
    # down twice: in, a pause under, up, a look round, in again
    down = max(bump(s, 0.05, 0.2, 0.38, 0.5), bump(s, 0.55, 0.68, 0.85, 0.97))
    work = math.sin(TAU * 10 * s) * down
    b = bends(REST, FEED_DIR, DIP * down)
    return {
        'Body': [(SIDE, 0.12 * down)],
        'Neck0': [(SIDE, b['Neck0'] - 0.12 * down)],
        'Neck1': [(SIDE, b['Neck1'])],
        'Neck2': [(SIDE, b['Neck2']), (UP, 0.06 * work)],
        'Head': [(SIDE, b['Head'])],
    }, -0.01 * down

def pose_glide(t):
    s = t / GLIDE_S
    stroke = math.sin(TAU * s)
    return {
        'Body': [(SIDE, 0.02 * stroke), (FWD, 0.015 * math.sin(TAU * s + 0.7))],
        'Neck0': [(SIDE, -0.04 * stroke)],
        'Neck1': [(SIDE, 0.03 * stroke)],
        'Head': [(UP, 0.05 * math.sin(TAU * 0.5 * s))],
    }, 0.003 * math.cos(TAU * s)

CLIPS = [('idle', IDLE_S, pose_idle), ('browse', FEED_S, pose_feed), ('walk', GLIDE_S, pose_glide)]
bake(arm, CLIPS, FPS)
export(dst)
if preview_dir: preview(arm, CLIPS, FPS, preview_dir, 0.5, 1.2, water=WATERLINE)
