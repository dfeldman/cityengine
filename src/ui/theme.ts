/**
 * Street Runner's look, taken from the Dandyhorse console (dandyhorse/consoles/web/src/style.css) so the game
 * sits inside the platform as one of its own: the deep navy panels, the saturated accents, the rounded cards,
 * the system font, big tap targets. Dark is primary, as on the console; every piece of the game's own UI —
 * the menus, the HUD, the minimap frame, the banners, the loading screen, the landmark card — uses these
 * variables and nothing else, so a change of theme is a change here.
 *
 * The game's page is Street Runner's accent: `--page` is the console's cyan (the colour of its travel pages).
 */
export const THEME_CSS = `
:root {
  color-scheme: dark;
  --bg: #0b0f24;
  --panel: rgba(17, 22, 52, 0.84);
  --panel-solid: #111634;
  --panel-2: rgba(29, 36, 78, 0.9);
  --border: rgba(125, 140, 210, 0.32);
  --text: #eef1ff;
  --muted: #a3acd6;
  --c-blue: #3b82ff;    --on-blue: #ffffff;
  --c-magenta: #f0368f; --on-magenta: #ffffff;
  --c-lime: #8ad52a;    --on-lime: #0b1a00;
  --c-amber: #fbb024;   --on-amber: #1c1300;
  --c-cyan: #22c7ee;    --on-cyan: #04212b;
  --c-red: #ff5a5a;     --on-red: #ffffff;
  --page: var(--c-cyan); --on-page: var(--on-cyan);
  --radius: 18px;
  --radius-sm: 12px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.35), 0 14px 36px rgba(0, 0, 0, 0.35);
  --font: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --tap: 44px;
}
html, body { background: var(--bg); font-family: var(--font); color: var(--text); }

/* the menus down the top: city, landmarks, routes — one column of chunky selects */
select.sr-city {
  font: 600 15px/1.2 var(--font); color: var(--text); background: var(--panel); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 9px 14px; min-height: var(--tap); box-shadow: var(--shadow);
  backdrop-filter: blur(6px); cursor: pointer; appearance: none; -webkit-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%);
  background-position: calc(100% - 18px) 55%, calc(100% - 13px) 55%; background-size: 5px 5px; background-repeat: no-repeat;
  padding-right: 34px;
}
select.sr-city:focus-visible { outline: 3px solid var(--page); outline-offset: 2px; }
select.sr-city { top: 14px; width: 250px; max-width: 70vw; }
/*
 * The landmarks menu used to sit at 66px and the routes menu below it at 118px. The menu is gone (#168) but
 * its ROW was still reserved, so the routes menu hung 52px below the city menu with nothing between them
 * (owner: "we still have the spot for the landmarks dropdown, even though it is empty"). These are fixed
 * elements with their own tops, not a stack, so closing the gap means moving routes up into the free row.
 */

/*
 * The landmark SEARCH (BUGS.md #168), over the top of the large map and only there: a dropdown of several
 * hundred names is unusable, and the owner did not want it sitting over the city all ride either.
 */
input.sr-mapsearch {
  position: fixed; left: 50%; top: 50%; transform: translate(-50%, calc(-50% - 43vmin - 26px)); z-index: 7;
  display: none; width: min(330px, 70vw); font: 600 15px/1.2 var(--font); color: var(--text);
  background: var(--panel-solid); border: 1px solid var(--border); border-radius: var(--radius-sm);
  padding: 10px 14px; min-height: var(--tap); box-shadow: var(--shadow); appearance: none; -webkit-appearance: none;
}
input.sr-mapsearch.on { display: block; }
input.sr-mapsearch::placeholder { color: var(--muted); }
input.sr-mapsearch:focus-visible { outline: 3px solid var(--page); outline-offset: 2px; }
select.sr-routes { top: 66px !important; }

/* bike or run: a two-way switch under the menus (reloads into the other ride graph) */
.sr-mode { position: fixed; top: 170px; left: 50%; transform: translateX(-50%); z-index: 5; display: flex;
  background: var(--panel); border: 1px solid var(--border); border-radius: 999px; padding: 4px; box-shadow: var(--shadow);
  backdrop-filter: blur(6px); }
.sr-mode button { font: 700 14px/1 var(--font); color: var(--muted); background: none; border: none; border-radius: 999px;
  padding: 9px 18px; min-height: 36px; cursor: pointer; }
.sr-mode button.on { background: var(--page); color: var(--on-page); }
.sr-mode button:focus-visible { outline: 3px solid var(--page); outline-offset: 2px; }

#label { font: 10px/1.3 var(--font) !important; color: var(--muted) !important; opacity: .75 }

/* a card: the landmark box, the banners, the loading panel */
.sr-card {
  background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow);
  backdrop-filter: blur(8px); color: var(--text);
}
.sr-pill {
  display: inline-block; font: 700 12px/1 var(--font); letter-spacing: .06em; text-transform: uppercase;
  background: var(--page); color: var(--on-page); border-radius: 999px; padding: 5px 10px;
}
`
