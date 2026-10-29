# The HUD and the pause menu (design, 2026-10-14)

The owner's brief:
- A rider cares about **speed, energy, time, delivery status and the options in front of them**, and maybe the
  money. Everything else is rarely used: it goes in a **pause menu with submenus** (map, look around, avatar,
  settings, session details…), the same on every device.
- Devices vary widely: laptops, tablets, PCs with limited input, phones, and maybe TV boxes with almost no input
  later. Exercise-room equipment is cheap and old.
- Touch controls are not needed when there is a keyboard.

## Principles

1. **One look, every device.** The phone layout is the layout. A desktop gets the same elements, a little larger,
   not more of them.
2. **On screen only what changes what you do in the next ten seconds.** Anything you look up, rather than react
   to, goes in the menu.
3. **Each thing has its own place.** Fixed slots: nothing stacks onto something else, and two things never fight
   over one spot.
4. **Every action is reachable with only Up/Down/Enter/Back** (a TV remote, a D-pad, a keyboard), and also with
   touch and a mouse. Keyboard shortcuts stay as shortcuts, never as the only way in.
5. **Hands-off must work.** On a trainer with no input at all, the ride, the offers and recovering from gridlock
   go on by themselves (already a rule: feedback-trainer-hands-off).

## What stays on screen

| slot | element | when |
|---|---|---|
| top centre | **speed** (+ watts while riding) | always |
| top right | **☰ menu button** (pauses) | always |
| top left | **job**: compass, distance, clock; under it, the job line ("1 · Pick up …") | during a job |
| top, full width | **offer**: dish, where, Take it / No thanks, countdown | while an offer is up |
| under the speed | **toast**: one line at a time, 1.5–3 s (notes, banners, transit and observe events) | on events |
| bottom centre | **route pill**: distance to go, next turn; in tour mode "Stop 2/9 · 1.3 mi · 0.4 of 10.3 mi" (the next stop, how far to it, ridden of the tour's length); on a phone it wraps, above the energy bar | while a route is set, not during a job |
| bottom centre | **action chip**: the one thing you can do right now (eat, board/get off, travel, observe, a star junction's exits) | when something is actionable |
| bottom centre, above the chip | **turn buttons**: ← ↑ → (offered, picked, locked) and ↩ turn round, tappable | always while riding: without them the rider has no idea what's going on (owner) |
| bottom left | **energy bar**, with the **cash** small beside it | energy in couch mode (a trainer rider has real legs); cash always |
| bottom corners | **touch controls**: ◀ ▶ and the effort slider | after the screen is touched; gone again after a key press; always with Settings → Controls → Touch on any device (a phone streaming the desktop, e.g. Moonlight: clicks count as touches, lists scroll by dragging) |
| bottom edge | credit line: "© OpenStreetMap contributors" only | always (licence) |

## What moves to the menu, or goes

| today | goes to |
|---|---|
| small minimap (desktop) | Settings → Minimap, **off by default** (M and Menu → Map open the big map) |
| "77 m · Sutter Street" (next junction and street name) | gone: "a rider neither knows nor cares about street names" (owner) |
| GPS route line | the job pill (distance, next turn) |
| stats line "21.5 km/h 180 W 0.11 km" (duplicates the speedometer, always metric) | gone; Menu → Session |
| distance on the speedometer | Menu → Session |
| the credit line's debug counts (vehicles, people, trees…) | only with `?mem=1` / debug |
| big centre banners ("Bonk!") | the toast slot, smaller |
| landmark card + ⓘ toggle | Settings → Display → Facts about nearby landmarks (I) |
| travel pill (ferry, Metro) | the action chip |
| debug buttons (copy location, go to, paths), K fog, [ ] distance, V view | Menu → Developer (only with `?dev=1`) |
| welcome screen's mode picker | still on the welcome, and Settings → Mode |

## The pause menu

Opened by ☰ (tap or click), Esc, P, or the remote's Menu/Back. The ride pauses. It's a vertical list with one
item highlighted: Up/Down moves, Enter chooses, Back/Esc goes up a level, and the mouse and touch work as usual.
The type is big enough to read from a bike.

- **Resume**
- **Map**: the large map, set a destination
- **Search** (`/`): every landmark in the city, filtered as you type; choose one to go there. Each row shows the
  entry's builder, OSM ids, manifest file and coordinates, and all of those are searchable (src/ui/search.ts)
- **Look around**: the free camera (today's P)
- **🏁 End ride**: the summary (src/ui/end-screen.ts). On Dandyhorse it asks first, then completes the session, as the
  bridge's End does; standalone, Done rides on. In tour mode the tour-complete card offers it too, and on Dandyhorse
  the phone shows 🏁 End ride / 🚲 Keep riding as buttons until the rider chooses
- **Ride**: turn round, get off / board, coast tips, travel (at a station)
- **Deliveries**: earnings, level, stars; skip the current job
- **Session**: time, distance, average watts, energy, climbing
- **Rider**: avatar (later)
- **Settings**: units (mph/km/h), steering (held / at junctions), quality (auto/phone/desktop), traffic and
  crowds, landmark notes, motion effects (speed lines), on-screen controls (auto/always/never), touch on any device (off/on), mode (couch /
  trainer). Saved per browser, and URL parameters still win.
- **Help**: the controls for this device
- **Gamepad** (ui/gamepad.ts): the standard layout sends the keys — stick or d-pad steers, d-pad ▲ ▼ effort and menu rows,
  RT/LT the effort outright, A Enter, B / Menu Esc, Y X take / skip, LB U-turn, RB board, View the map
- **Developer** (`?dev=1`): copy location, go to, paths, fog, draw distance, copy view

## Order of work

1. ui/menu.ts: the menu, submenus and focus navigation; pause hooked to it; ☰ replaces the touch ⏸.
2. Cut the HUD to the slots above, on every device: toast slot, action chip, speedometer top centre everywhere.
3. Show touch controls on touch input only, and hide them again when a key is pressed.
4. Settings saved to localStorage (URL parameters override), starting with units, steering, quality and on-screen
   controls.
5. Fix the welcome screen's stale key list (P is now pause, photo/fog is K).

## The settings system (src/ui/settings.ts)

Each setting is a field of `Settings` plus one entry in `SETTING_DEFS`: its group (Display, World, Graphics,
Controls, Gameplay, Sound, Equipment), its label, its choices and when it applies (`now`, or `ride`: on the next
start, and the menu offers a restart). Menu → Settings builds a submenu per group from that list, so a new setting
needs no menu code. Values are kept per browser. A URL parameter beats a setting, and a setting beats the device's
tier.

World settings (trees and plants, people, traffic, signs and furniture) are `auto` / `on` / `off`. `auto` is what
the tier carries; on and off switch the game's subsystems by their `?without=` names (`FEATURE_OFF`). Turning trees
on for an iPhone can exceed its memory: that is the rider's call, and Auto stays the safe default.

Still to come: Sound, Equipment (trainer and treadmill: speed and incline limits, units of the machine), and
Gameplay (energy, delivery pace, offers on or off).
