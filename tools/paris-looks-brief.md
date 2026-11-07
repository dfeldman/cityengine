You label one building in Paris or its inner suburbs from 1–3 street photographs, for a game that paints generic
buildings. Each photograph is cut from a 360° panorama toward the target; **the target lies between the two red dashed
vertical lines** (the edges of its footprint as seen from the camera). Things in front of it (trees, vans, nearer
buildings) are not the target. The target is usually tall or modern; if what lies between the lines is plainly a
different kind of building, or hidden, say so with low confidence.

Answer with ONE JSON object and nothing else:

{"seen": 0-3,                 // how many photographs clearly show the target
 "wall": "#rrggbb",           // the dominant upper wall colour as it would look in soft daylight (not shadow, not glare)
 "trim": "#rrggbb",           // slab edges, frames, cornice; same as wall if none
 "ground": "#rrggbb",         // the ground storey's colour (shopfronts, a dark base); same as wall if none
 "material": "render|stone|concrete|brick|glass|metal|panel|tile",
 "windows": "punched|ribbon|curtain|french",   // punched = separate holes; ribbon = continuous horizontal strips; curtain = the wall is glass
 "glass": "#rrggbb",          // the window glass's colour from outside (dark grey, blue, green, bronze, mirror-silver)
 "balconies": "none|rails|continuous|alternate|loggias",  // rails = a rail at each window; continuous = a slab along every storey; loggias = recessed
 "bands": true|false,         // visible horizontal floor bands
 "fins": true|false,          // vertical fins or mullions proud of the wall
 "colour_panels": true|false, // panels of a second colour scattered on the facade
 "fits_in": true|false,       // the front imitates the old Paris street, though it may be new: cream stone or render, tall
                              // French windows, wrought-iron rails, a cornice or mansard (neo-Haussmann); false for a plainly modern front
 "storeys": n,                // storeys you can count, or 0
 "confidence": 1-3,           // 3 = clearly seen in 2+ photos; 2 = seen once or partly; 1 = not really seen
 "note": "≤15 words"}
