# Blender headless: Tripo's brown bear (a grizzly). Its own armature, skin and clips are thrown away (the source here
# carries none, but anything that is not the mesh is deleted anyway); this builds a spine (pelvis, chest, neck, head),
# a two-bone leg and a flat foot at each corner (hip->knee->ankle, solved by a 2-bone IK each frame), skins it by where
# each vertex is, and writes the clips render/zoo.ts plays:
#   blender -b -P tools/animals/bear-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — standing: the head swinging round and sniffing the air, now and then a shake and a shift of weight
#   browse — foraging: the head and neck go down to the ground, nose and fore paw working the dirt (one fore paw
#            scraping, three strokes), and come back up
#   walk   — the rolling, pigeon-toed amble: a four-beat walk (LH, LF, RH, RF a quarter stride apart) baked in place;
#            the game moves the animal at WALK_SPEED, the stance's foot travel is matched to it. Shoulders and pelvis
#            roll, the hump rises and falls, the head hangs low and swings
#
# Source (measured 2026-11-20): 4513 triangles, no skin; the head at +x, nose turned ~30 degrees to +y; the mesh sits
# on z = 0, 0.98 long (x), 0.38 wide, 0.53 tall to the hump. This script turns it a quarter turn so it faces −y and
# straightens the head. Then: nose at y −0.49 (z 0.33–0.41), head z 0.27–0.53 over y −0.49…−0.29, hump at y −0.1…0.05
# (z 0.52), rump y 0.49. Feet (flat, |x| 0.074–0.17): fore y −0.24…−0.09, hind y 0.29…0.45, both ankle-high 0.06; belly
# at z 0.15. SIZE 2.1 m per unit: 2.06 m nose to tail, 1.1 m at the shoulder.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigkit import *
from mathutils import Matrix

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview_dir = a[2] if len(a) > 2 else None

FPS = 24
SIZE = 2.1                 # metres per model unit (render/zoo.ts SPECIES.bear.size)
IDLE_S = 12.0
BROWSE_S = 10.0
WALK_PERIOD = 1.05
WALK_SPEED = 0.65          # m/s the game moves it; the stance's foot travel is matched to it
DUTY = 0.72                # four-beat walk: three feet down at a time
LIFT = 0.035               # the swinging foot's height (units)
CROUCH = 0.03              # the hips sit this low in the walk so the legs can reach (units); small, the knees stay open
TOE_DOWN = 0.25            # rad the toe dips in mid-swing
PIGEON = 0.12              # rad the feet toe in
HEAD_FIX = -0.5            # rad: the mesh's head is turned; this swings it round to the front (about z)
HIP_Z = 0.42
ANKLE_Z = 0.06             # the foot bone starts here; it stays flat on the ground
FOOT_X = 0.12
FEET = {'FR': (FOOT_X, -0.15, 0.09), 'FL': (-FOOT_X, -0.15, 0.09), 'HR': (FOOT_X, 0.39, 0.10), 'HL': (-FOOT_X, 0.39, 0.10)}  # x, y, toe reach
LEG_E = {'F': (0.075, 0.10), 'H': (0.075, 0.13)}   # the leg column's half-width in x and in y
JOINT = 0.14               # the skin blends over this much height at the knee and ankle (units); wide, the legs are thick
LEG_TOP = (0.14, 0.22)     # the skin eases from the leg to the body between HIP_Z-this[0] ... and this[1] further up
# idle
IDLE_SWING = 0.5           # rad the head swings round either side
SNIFF = 0.14               # rad the head lifts to sniff
ROLL = 0.025               # weight shift (rad)
# browse
BR_PITCH = 0.12           # rad the body pitches forward about the pelvis while foraging; the fore hips sink with it
BR_CHEST = 0.08            # rad the chest dips
BR_NECK = 0.5             # rad the neck bows
BR_HEAD = 0.5             # rad the head bows
PAW_LIFT = 0.045           # the scraping paw's height (units)
PAW_FWD = 0.08             # how far forward it reaches before dragging back
# walk
WALK_ROLL = 0.045          # chest roll (rad)
WALK_HUMP = 0.035          # pitch of the shoulders (rad)
WALK_HEAD = 0.2            # the head hangs this low (rad), swinging side to side

mesh = load(src, 6000)
# anything that is not the mesh (Tripo's armature) goes; the mesh keeps no skin
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
mesh.parent = None
for m in list(mesh.modifiers): mesh.modifiers.remove(m)
for g in list(mesh.vertex_groups): mesh.vertex_groups.remove(g)
mesh.data.transform(Matrix.Rotation(-math.pi / 2, 4, 'Z'))   # faces −y
for v in mesh.data.vertices:                                 # straighten the head about the neck
    w = smooth((-v.co.y - 0.22) / 0.1)
    if w > 0:
        c, s, ang = v.co.x - 0.02, v.co.y + 0.25, HEAD_FIX * w
        v.co.x = 0.02 + c * math.cos(ang) - s * math.sin(ang); v.co.y = -0.25 + c * math.sin(ang) + s * math.cos(ang)
mesh.data.update()
print('mesh z', round(min(v.co.z for v in mesh.data.vertices), 3), round(max(v.co.z for v in mesh.data.vertices), 3),
      'y', round(min(v.co.y for v in mesh.data.vertices), 3), round(max(v.co.y for v in mesh.data.vertices), 3))

bones = [('Root', (0, 0, 0), (0, -0.05, 0), None), ('Body', (0, 0.3, 0.40), (0, 0.05, 0.42), 'Root'),
         ('Chest', (0, 0.0, 0.42), (0, -0.19, 0.44), 'Body'), ('Neck', (0, -0.19, 0.45), (0, -0.31, 0.43), 'Chest'),
         ('Head', (0, -0.31, 0.43), (0, -0.49, 0.36), 'Neck')]
LEGS = {}
for k, (fx, fy, toe) in FEET.items():
    hip, foot = (fx, fy, HIP_Z), (fx, fy, ANKLE_Z)
    knee = (fx, fy, (HIP_Z + ANKLE_Z) / 2)
    LEGS[k] = (hip, knee, foot)
    bones += [(f'{k}_0', hip, knee, 'Root'), (f'{k}_1', knee, foot, f'{k}_0'), (f'{k}_F', foot, (fx, fy - toe, 0.0), f'{k}_1')]
arm = armature('bear', bones)

def weights(p):
    rem, out = 1.0, {}
    for k, (hip, knee, foot) in LEGS.items():
        if (p.x < 0) != (foot[0] < 0): continue
        ex, ey = LEG_E[k[0]]
        f = min(1, max(0, (HIP_Z - p.z) / (HIP_Z - ANKLE_Z)))
        e = math.hypot((p.x - (hip[0] + f * (foot[0] - hip[0]))) / ex, (p.y - (hip[1] + f * (foot[1] - hip[1]))) / ey)
        lm = min(rem, (1 - smooth((e - 1) / 0.3)) * (1 - smooth((p.z - (HIP_Z - LEG_TOP[0])) / LEG_TOP[1])))
        if lm > 0:
            fw = 1 - smooth((p.z - (ANKLE_Z - JOINT / 2)) / JOINT)
            kw = smooth(((HIP_Z + ANKLE_Z) / 2 + JOINT / 2 - p.z) / JOINT)
            out[f'{k}_F'] = lm * fw; out[f'{k}_1'] = lm * (1 - fw) * kw; out[f'{k}_0'] = lm * (1 - fw) * (1 - kw); rem -= lm
    c1 = smooth(-p.y / 0.2)                      # front of the body
    c2 = smooth((-p.y - 0.20) / 0.14)            # neck and head
    c3 = smooth((-p.y - 0.30) / 0.10)            # head
    out['Body'] = rem * (1 - c1); out['Chest'] = rem * c1 * (1 - c2)
    out['Neck'] = rem * c1 * c2 * (1 - c3); out['Head'] = rem * c1 * c2 * c3
    return out
skin(mesh, arm, weights)

# ---- legs: 2-bone IK in the y–z plane; angles are from straight down, positive swinging the tip BACK (+y)
LG = {}
for k, (hip, knee, foot) in LEGS.items():
    L1 = math.hypot(knee[1] - hip[1], knee[2] - hip[2]); L2 = math.hypot(foot[1] - knee[1], foot[2] - knee[2])
    LG[k] = (L1, L2)
REST_D = HIP_Z - ANKLE_Z
D0 = REST_D - CROUCH                # hip-to-ground when crouched
SWEEP = WALK_SPEED * WALK_PERIOD * DUTY / 2 / SIZE   # half the stance's foot travel, units
print('leg', round(sum(LG['FR']), 3), 'units  hip height', D0)
print('half stride', round(SWEEP, 3), 'units; max reach', round(math.sqrt(sum(LG['FR']) ** 2 - D0 ** 2), 3))

def ik(k, ty, d, toe=0.0):
    """leg k with the foot `ty` behind the hip and `d` below it → {bone: rotation about SIDE}"""
    L1, L2 = LG[k]
    D = min(math.hypot(ty, d), (L1 + L2) * 0.999)
    A = math.acos(max(-1, min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))))
    a1 = math.atan2(ty, d) - A                       # the knee forward
    ky, kz = L1 * math.sin(a1), L1 * math.cos(a1)
    b1 = math.atan2(ty - ky, d - kz)
    toein = -PIGEON if k[1] == 'R' else PIGEON       # toes toward the midline
    return {f'{k}_0': [(SIDE, a1)], f'{k}_1': [(SIDE, b1 - a1)], f'{k}_F': [(SIDE, -b1 + toe), (UP, toein)]}

def stand(d=REST_D):
    r = {}
    for k in LEGS: r.update(ik(k, 0.0, d))
    return r

def sway(s, ph, n=1): return math.sin(TAU * n * s + ph)

def pose_idle(t):
    s = t / IDLE_S
    r = stand()
    shift = bump(s, 0.18, 0.26, 0.36, 0.44) - bump(s, 0.80, 0.88, 0.94, 1.0)
    shake = bump(s, 0.60, 0.62, 0.68, 0.71) * math.sin(TAU * 11 * s * IDLE_S / 12)
    r['Body'] = [(FWD, ROLL * shift), (UP, 0.01 * sway(s, 0) + 0.10 * shake)]
    r['Chest'] = [(FWD, 0.5 * ROLL * shift + 0.06 * shake), (UP, -0.16 * shake)]
    swing = IDLE_SWING * sway(s, 0.3, 1) * (0.55 + 0.45 * sway(s, 1.3, 2))
    sniff = SNIFF * (0.5 + 0.5 * sway(s, -1.2, 2)) * (0.4 + 0.6 * smooth(abs(sway(s, 0.3, 1)) * 1.4))
    twitch = 0.03 * sway(s, 0, 9) * smooth(sniff / SNIFF)
    r['Neck'] = [(UP, 0.55 * swing), (SIDE, -0.6 * sniff + 0.04 * sway(s, 0.5, 3))]
    r['Head'] = [(UP, 0.45 * swing + 0.4 * shake), (SIDE, -0.5 * sniff + twitch)]
    return r, -0.002 * shift

def pose_browse(t):
    s = t / BROWSE_S
    down = bump(s, 0.02, 0.2, 0.78, 0.95)                  # head to the ground, held, back up
    sink = 0.45 * math.sin(BR_PITCH * down)                # the fore hips sink with the pitch (0.45 = pelvis to shoulder)
    r = stand()
    for k in ('FR', 'FL'): r.update(ik(k, 0.0, REST_D - sink))
    nose = down * smooth((s - 0.2) / 0.05)
    # one fore paw (FR) scrapes three strokes in 0.30-0.64: reaches forward in the air, drags back on the ground
    sc = (s - 0.30) / 0.34
    paw = 0.0; ty = 0.0; lift = 0.0
    if 0 <= sc <= 1:
        c = (sc * 3) % 1
        up = smooth(min(sc, 1 - sc) * 14)
        if c < 0.4:
            u = c / 0.4; ty = -PAW_FWD * (0.5 - 0.5 * math.cos(math.pi * u)); lift = math.sin(math.pi * u) * PAW_LIFT + 0.012
        else:
            u = (c - 0.4) / 0.6; ty = -PAW_FWD + (PAW_FWD + 0.05) * u; lift = 0.012 * (1 - u)
        paw = up; ty *= up; lift *= up
    r.update(ik('FR', ty, REST_D - sink - lift, TOE_DOWN * lift / PAW_LIFT * 0.5))
    r['Body'] = [(SIDE, BR_PITCH * down), (UP, 0.01 * sway(s, 0)), (FWD, 0.015 * paw)]
    r['Chest'] = [(SIDE, BR_CHEST * down), (FWD, -0.03 * paw + 0.015 * nose * sway(s, 0, 5))]
    r['Neck'] = [(SIDE, BR_NECK * down + 0.05 * nose * sway(s, 0, 4)), (UP, 0.18 * nose * sway(s, 0.7, 3))]
    r['Head'] = [(SIDE, BR_HEAD * down + 0.08 * nose * sway(s, 1.0, 6)), (UP, 0.22 * nose * sway(s, 1.9, 3))]
    return r, 0.0

def pose_walk(t):
    s = t / WALK_PERIOD
    r = {}
    PH = {'HL': 0.0, 'FL': 0.25, 'HR': 0.5, 'FR': 0.75}
    for k in LEGS:
        ph = (s - PH[k]) % 1
        if ph < DUTY:
            ty = -SWEEP + 2 * SWEEP * ph / DUTY; lift = 0
        else:
            u = (ph - DUTY) / (1 - DUTY)
            ty = SWEEP - 2 * SWEEP * (0.5 - 0.5 * math.cos(math.pi * u)); lift = math.sin(math.pi * u) * LIFT
        r.update(ik(k, ty, D0 - lift, TOE_DOWN * lift / LIFT))
    roll = WALK_ROLL * sway(s, 0.4, 2)
    r['Body'] = [(FWD, -0.5 * roll), (UP, -0.05 * sway(s, 0.4, 2)), (SIDE, 0.012 * sway(s, 1.0, 2))]
    r['Chest'] = [(FWD, roll), (UP, 0.06 * sway(s, 0.4, 2)), (SIDE, WALK_HUMP * sway(s, 0.0, 2))]
    r['Neck'] = [(SIDE, 0.6 * WALK_HEAD + 0.03 * sway(s, 0.8, 2)), (UP, 0.14 * sway(s, 1.6, 2))]
    r['Head'] = [(SIDE, 0.4 * WALK_HEAD + 0.03 * sway(s, 1.4, 2)), (UP, 0.10 * sway(s, 2.0, 2))]
    return r, -CROUCH + 0.006 * sway(s, 0.2, 2)

CLIPS = [('idle', IDLE_S, pose_idle), ('browse', BROWSE_S, pose_browse), ('walk', WALK_PERIOD, pose_walk)]
bake(arm, CLIPS, FPS)
export(dst)
if preview_dir: preview(arm, CLIPS, FPS, preview_dir, 0.27, float(os.environ.get('PV_SCALE', 1.2)), per=int(os.environ.get('PV_PER', 6)), res=int(os.environ.get('PV_RES', 200)))
