# Blender headless: Tripo's doe (doe.glb, a red deer hind, unrigged). The shared rig and clips live in deerkit.py (the stag's
# deer-clips.py keeps its own copy); this file is the doe's measurements and tuning constants:
#   blender -b -P tools/animals/doe-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — alert: the head comes up and looks left, then right, the big ears flick one at a time, the tail flicks
#   browse — grazing: the neck and head bend to the grass, the muzzle crops, the head comes up to look round and goes back down
#   walk   — one stride of a four-beat walk (LH, LF, RH, RF), baked in place, stride matched to WALK_SPEED
#
# As imported (2026-11-20): 0.98 long (x), 0.73 tall to the ear tips, head toward −x (so turned +90° about z to face −y), body
# centred 0.088 off x = 0 (shifted +x). Back 0.47 high from the withers (y −0.19) to the rump (y 0.47), belly 0.17, body ~0.17 wide.
# Fore feet at y −0.15 (x −0.05, +0.09), straight legs; hind feet at y 0.42 (x −0.08, +0.05), the hocks far back at y 0.48, z 0.09
# (the hind leg is modelled stretched back). The neck leans +x (the head hangs off to the right, muzzle at x 0.30, y −0.41, z 0.54):
# REST_TURN swings neck and head back round to face −y. The ears: one forward (tip y −0.49, z 0.71), one rounded to the side
# (tip x 0.26). SIZE 2.2 → ~1.04 m at the withers, ~2.15 m long.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import deerkit
from rigkit import FWD, UP, SIDE

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview_dir = a[2] if len(a) > 2 else None
TURN = 90                  # degrees about z to face −y
SHIFT = 0.088
TRIS = 12000
FPS = 24
SIZE = 2.2                 # metres per model unit (render/zoo.ts SPECIES.doe.size)
IDLE_S = 10.0
BROWSE_S = 10.0
WALK_PERIOD = 1.0
WALK_SPEED = 0.7           # m/s the game moves it; the stance's foot travel is matched to it
DUTY = 0.7                 # four-beat walk: three feet down at a time
LIFT = 0.045               # the swinging hoof's height (units)
CROUCH = 0.03              # the hips sit this low in the walk so the legs can reach (units)
BOUNCE = 0.0
TOE_DOWN = 0.3
HEAD_TURN = 0.8
ALERT = 0.2
EAR_FLICK = 0.6
TAIL_FLICK = 0.5
BLEND = 0.04
BROWSE_NECK = (0.6, 0.6, 0.55)
BROWSE_HEAD = -0.6
BROWSE_CHEST = 0.25
CROP = 0.07
CROP_CYC = 6
BOB = 0.035
# straightening of the modelled sideways lean (rad about +z; negative turns the head from +x back to −y): N0, N1, N2, Head
REST_TURN = (-0.25, -0.25, -0.25, -0.4)
HOOF_C = -0.7              # a planted hoof's pitch (rad from straight down, negative = toe forward)
HIP_Z = 0.36
ANKLE_Z = 0.04
XC = 0.02                  # the body's centre line, splitting the left legs from the right
FH_Y = 0.10                # fore legs / hind legs split
FEET = {'FR': (0.09, -0.14), 'FL': (-0.05, -0.15), 'HR': (0.05, 0.42), 'HL': (-0.08, 0.43)}   # (x, ankle y)
ANKLE = {k: ANKLE_Z for k in FEET}
HIP_Y = {'F': -0.135, 'H': 0.33}
KNEE = {'FR': (-0.14, 0.13), 'FL': (-0.14, 0.13), 'HR': (0.40, 0.14), 'HL': (0.40, 0.14)}     # (y, z)
TOEP = {'FR': (-0.035, -0.04), 'FL': (-0.035, -0.04), 'HR': (-0.04, -0.04), 'HL': (-0.04, -0.04)}   # toe tip from the ankle (dy, dz)
STANCE = {'FR': -0.145, 'FL': -0.145, 'HR': 0.41, 'HL': 0.41}                                   # ankle y when standing
LEG_R = {'F': (0.05, 0.03, 0.03), 'H': (0.09, 0.05, 0.03)}
LEG_TOP = (0.14, 0.14)
CHEST_PIV = (-0.03, 0.33)
BODY_PIV = (0.30, 0.33)
CHEST_Y = (0.18, -0.06)
NECK_PTS = [(0.0, -0.17, 0.38), (0.04, -0.23, 0.46), (0.09, -0.28, 0.53), (0.14, -0.33, 0.585)]
NECK_YMAX = -0.10
NECK_Z0 = 0.36
HEAD_TIP = (0.30, -0.41, 0.54)
KNOTS = [-0.25, 0.05, 0.37, 0.68, 1.0]
EARS = {'L': ((0.09, -0.36, 0.63), (0.10, -0.49, 0.71)), 'R': ((0.13, -0.31, 0.62), (0.26, -0.27, 0.67))}
EAR_AX = {'L': [(UP, -1.0), (SIDE, 0.6)], 'R': [(FWD, -1.0), (UP, 0.6)]}
EAR_R = 0.045
EAR_ROOT = (0.0, 0.5)      # ear skin ramps in from this far along the ear (fraction) over this much
TAILB = ((-0.04, 0.44, 0.44), (-0.04, 0.50, 0.36))
TAIL_YZ = (0.40, 0.30)
FLICKS = {'idle': ([0.12, 0.64, 0.92], [0.3, 0.52]), 'tail': [0.25, 0.77],
          'browse': ([0.32, 0.84], [0.17, 0.9], [0.72])}
PV = (0.5, 1.4)            # preview camera height, scale
deerkit.run(sys.modules[__name__])
