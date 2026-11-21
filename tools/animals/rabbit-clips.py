# Blender headless: Tripo's rabbit has NO rig and sits crouched. This builds a body, the head, both ears, the fore
# paws and the haunches, skins it by where each vertex is, and writes the clips render/zoo.ts plays:
#   blender -b -P tools/animals/rabbit-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — sitting: the nose working, the ears turning one at a time, the head looking round
#   browse — NIBBLING: the head goes down to the grass, chews, comes up to look, goes down again
#   walk   — one HOP (the clip keeps the name render/zoo.ts plays): the haunches push, the body arcs up nose first,
#            the fore paws reach and land, the hind feet come up under; baked in place, the game moves the rabbit at
#            WALK_SPEED (a slide in a hop's ground phase is too short to see)
#
# Faces −y, z up, normalised 0.884 tall with the ears, 0.98 long nose to tail. Measured (2026-11-20): the fore paws
# on the ground at y −0.36 to −0.16, the haunches and hind feet from y −0.04 back to 0.32; the head ahead of y −0.2
# above z 0.3, nose at y −0.49; the ears from z 0.6 to 0.88 over y −0.24 to −0.07, splayed to |x| 0.24; tail at y 0.45.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigkit import *

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview_dir = a[2] if len(a) > 2 else None

TRIS = 8000
FPS = 24
SIZE = 0.42                # metres per model unit (render/zoo.ts SPECIES.rabbit.size): 42 cm nose to tail
IDLE_S = 8.0
NIBBLE_S = 7.0
HOP_S = 0.5
WALK_SPEED = 0.8           # one hop carries it WALK_SPEED × HOP_S
HOP_H = 0.2                # the hop's height, model units
AIR = (0.12, 0.6)          # the hop's airborne part of the cycle
HIND_PUSH = 0.4            # the haunches' kick back at take-off (rad)
FORE_REACH = 0.6           # the fore paws' reach forward before landing (rad)
NIB_PITCH = 0.28           # nibbling: the body's tip forward over the fore paws, and the head's (rad)
NIB_HEAD = 0.6
TILT = 0.3                 # the body's pitch, nose up leaving, nose down landing (rad)

EAR_Z = 0.6
HEAD_Y, HEAD_Z = -0.2, 0.33
FORE_Y, FORE_Z = -0.13, 0.2
HIND_Y, HIND_Z = -0.06, 0.14
EAR_ROOT = (0.05, -0.17, 0.6)
EAR_TIP = (0.2, -0.12, 0.87)

mesh = load(src, TRIS)
arm = armature('rabbit', [
    ('Root', (0, 0, 0), (0, -0.05, 0), None),
    ('Body', (0, 0.18, 0.22), (0, -0.2, 0.4), 'Root'),
    ('Head', (0, -0.2, 0.45), (0, -0.49, 0.4), 'Body'),
    ('Ear_L', (-EAR_ROOT[0], EAR_ROOT[1], EAR_ROOT[2]), (-EAR_TIP[0], EAR_TIP[1], EAR_TIP[2]), 'Head'),
    ('Ear_R', EAR_ROOT, EAR_TIP, 'Head'),
    ('Fore', (0, -0.25, 0.25), (0, -0.28, 0.0), 'Body'),
    ('Hind', (0, 0.18, 0.22), (0, 0.05, 0.0), 'Body'),
])

def weights(p):
    head = smooth((-p.y + HEAD_Y + 0.03) / 0.06) * smooth((p.z - HEAD_Z + 0.03) / 0.06)
    ear = smooth((p.z - EAR_Z) / 0.05) * smooth((p.y + 0.3) / 0.03)
    head = max(head, ear)
    fore = (1 - head) * smooth((FORE_Z - p.z) / 0.06) * smooth((-p.y + FORE_Y) / 0.04)
    hind = (1 - head) * smooth((HIND_Z - p.z) / 0.05) * smooth((p.y - HIND_Y) / 0.04)
    side = 'Ear_L' if p.x < 0 else 'Ear_R'
    return {side: ear, 'Head': head - ear, 'Fore': fore, 'Hind': hind, 'Body': max(0, 1 - head - fore - hind)}
skin(mesh, arm, weights)

def ears(r, s, a=1.0):
    # each ear turns on its own now and then, and both twitch
    r['Ear_L'] = [(UP, 0.35 * a * bump(s % 1, 0.2, 0.25, 0.45, 0.5)), (SIDE, 0.06 * math.sin(TAU * 5 * s) ** 9)]
    r['Ear_R'] = [(UP, -0.35 * a * bump(s % 1, 0.6, 0.65, 0.8, 0.85)), (SIDE, 0.06 * math.sin(TAU * 5 * s + 1) ** 9)]

def pose_idle(t):
    s = t / IDLE_S
    sniff = 0.025 * math.sin(TAU * 7 * t) * (0.5 + 0.5 * math.sin(TAU * s))
    r = {
        'Body': [(SIDE, 0.015 * math.sin(TAU * 2 * s))],
        'Head': [(UP, 0.3 * math.sin(TAU * s + 0.5) ** 3), (SIDE, sniff - 0.08 * bump(s, 0.4, 0.45, 0.6, 0.65))],
    }
    ears(r, s)
    return r, 0

def pose_nibble(t):
    s = t / NIBBLE_S
    down = max(bump(s, 0.0, 0.1, 0.4, 0.5), bump(s, 0.62, 0.72, 0.9, 1.0))
    chew = 0.04 * math.sin(TAU * 5 * t) * down
    r = {
        'Body': [(SIDE, NIB_PITCH * down)],
        'Fore': [(SIDE, -NIB_PITCH * down)],
        'Hind': [(SIDE, -NIB_PITCH * down)],
        'Head': [(SIDE, NIB_HEAD * down + chew), (UP, 0.15 * (1 - down) * math.sin(TAU * 2 * s))],
    }
    ears(r, s * 1.3, 0.6)
    for e in ('Ear_L', 'Ear_R'): r[e].append((SIDE, -0.25 * down))   # laid back a little head down
    return r, 0

def pose_hop(t):
    s = t / HOP_S
    u = (s - AIR[0]) / (AIR[1] - AIR[0])
    air = 0 <= u <= 1
    lift = HOP_H * math.sin(math.pi * u) if air else 0
    push = bump(s, 0.0, 0.1, 0.2, 0.45)                  # the haunches kick back, then trail
    reach = bump(s, 0.25, 0.45, 0.58, 0.68)              # the fore paws reach and land
    tuck = bump(s, 0.5, 0.65, 0.85, 1.0)                 # the hind feet swing up under the body
    tilt = -TILT * math.sin(TAU * u) if air else 0       # nose up leaving, nose down landing
    r = {
        'Body': [(SIDE, tilt)],
        'Hind': [(SIDE, HIND_PUSH * push - 0.3 * tuck)],
        'Fore': [(SIDE, -FORE_REACH * reach)],
        'Head': [(SIDE, -0.5 * tilt)],
        'Ear_L': [(SIDE, 0.2 * lift / HOP_H)], 'Ear_R': [(SIDE, 0.2 * lift / HOP_H)],
    }
    return r, lift

CLIPS = [('idle', IDLE_S, pose_idle), ('browse', NIBBLE_S, pose_nibble), ('walk', HOP_S, pose_hop)]
bake(arm, CLIPS, FPS)
export(dst)
if preview_dir: preview(arm, CLIPS, FPS, preview_dir, 0.45, 1.2, per=8)
