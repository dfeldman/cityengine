// beacons client: drop-in ESM, no dependencies.
//
//   import { Beacons } from './beacons.js';
//   const b = Beacons.init({
//     endpoint: 'https://example.com/v1/beacon', appId: 'cityengine', appVersion: '0.1.0', buildId: 'bake-2026-11-07',
//     interval: 15000,                         // heartbeat ms (randomised ±20%)
//     getState: () => ({ lat, lon, alt, world: 'paris', options: { city: 'paris', mode: 'tour' }, params: {...} }),  // params default to the URL query (?mode=tour)
//     canvas,                                  // optional: used for GPU string and bug screenshots
//   });
//   b.event('load:terrain');  ...  b.ready(); // 'ready' marks loading complete (crash detection)
//   b.bug('Building floats above road', { screenshot: true, category: 'visual' });
//
// Wire format (POST text/plain JSON, so no CORS preflight):
//   { v:1, app, ver, build?, sk, uid?, url, tz, tzo, env:{ua,browser,os,mobile,gpu,screen}, params?, options?,
//     items:[{ type:'heartbeat'|'event'|'bug'|'error'|'unload', name?, ts, el, lat?, lon?, alt?, world?,
//              fps?, p95?, heap?, heapMax?, extra?, bug?:{text, category?, shot?:dataURL} }] }

const urlParams = () => Object.fromEntries(new URLSearchParams(location.search));

const rand = () => {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (x) => x.toString(36).padStart(2, '0')).join('');
};

function platform() {
  const ua = navigator.userAgent;
  const d = navigator.userAgentData;
  const mobile = d?.mobile ?? (/Mobi|Android|iPhone|iPad/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)));
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /OPR\//.test(ua) ? 'Opera'
    : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) || (mobile && /Macintosh/.test(ua)) ? 'iOS'
    : /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
  return { ua, browser, os, mobile };
}

function gpuString(canvas) {
  try {
    const ctx = (c) => c?.getContext('webgl2') ?? c?.getContext('webgl');
    const gl = ctx(canvas) ?? ctx(document.createElement('canvas'));
    if (!gl) return 'no-webgl';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch { return null; }
}

/** Frame timer: fps over the heartbeat window and the 95th-percentile frame time. */
function frameMeter() {
  let times = [], last = 0, on = true;
  const tick = (t) => { if (last) times.push(t - last); last = t; if (times.length > 5000) times.shift(); if (on) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  return {
    read() {
      if (!times.length || document.hidden) { times = []; return {}; }
      const sum = times.reduce((a, b) => a + b, 0);
      const s = [...times].sort((a, b) => a - b);
      const r = { fps: Math.round((times.length / sum) * 10000) / 10, p95: Math.round(s[Math.floor(s.length * 0.95)] * 10) / 10 };
      times = [];
      return r;
    },
    stop() { on = false; },
  };
}

export const Beacons = {
  init(opts) {
    const o = { interval: 15000, maxQueue: 200, captureErrors: true, ...opts };
    const sk = o.sessionKey ?? rand();
    const t0 = performance.timeOrigin;
    const env = { ...platform(), gpu: o.gpu ?? gpuString(o.canvas),
      screen: `${screen.width}x${screen.height}@${devicePixelRatio}` };
    const meter = o.measureFps === false ? null : frameMeter();
    let queue = [], sentEnv = false, timer = 0, disabled = false, backoff = 1000;

    const state = () => { try { return o.getState?.() ?? {}; } catch { return {}; } };
    const item = (type, extra = {}) => {
      const s = state();
      const m = performance.memory;
      return { type, ts: Date.now(), el: Math.round(performance.now()),
        lat: s.lat, lon: s.lon, alt: s.alt, world: s.world,
        heap: m?.usedJSHeapSize, heapMax: m?.jsHeapSizeLimit, ...extra };
    };
    const envelope = (items) => {
      const s = state();
      const b = { v: 1, app: o.appId, ver: o.appVersion, build: o.buildId, sk, uid: o.userId?.() ?? o.userId, url: location.href,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone, tzo: -new Date().getTimezoneOffset(),
        params: s.params ?? urlParams(), options: s.options, items };
      if (!sentEnv) b.env = env;
      return JSON.stringify(b);
    };

    const flush = async (useBeacon = false) => {
      if (!queue.length || disabled) return;
      const items = queue.splice(0, 50);
      const body = envelope(items);
      try {
        if (useBeacon && navigator.sendBeacon) { navigator.sendBeacon(o.endpoint, body); return; }
        const r = await fetch(o.endpoint, { method: 'POST', body, keepalive: body.length < 60000,
          headers: { 'content-type': 'text/plain' } });
        if (r.ok) sentEnv = true;
        else if (r.status === 429 || r.status >= 500) { queue.unshift(...items.filter((i) => i.type !== 'heartbeat')); backoff = o.interval; }
        else if (r.status === 400) console.warn('[beacons] rejected', await r.text());
      } catch {
        queue.unshift(...items.filter((i) => i.type !== 'heartbeat'));
      }
      if (queue.length > o.maxQueue) queue = queue.slice(-o.maxQueue);
      if (queue.length) setTimeout(flush, backoff);
      backoff = 1000;
    };
    const push = (it, now = false) => { queue.push(it); if (now) flush(); };

    const beat = () => {
      push(item('heartbeat', meter ? meter.read() : o.getFps?.() ?? {}));
      flush();
      timer = setTimeout(beat, o.interval * (0.8 + Math.random() * 0.4));
    };

    if (o.captureErrors) {
      addEventListener('error', (e) => push(item('error', { name: String(e.message).slice(0, 300),
        extra: { src: e.filename, line: e.lineno, col: e.colno, stack: e.error?.stack?.slice(0, 2000) } }), true));
      addEventListener('unhandledrejection', (e) => push(item('error', { name: 'unhandled: ' + String(e.reason?.message ?? e.reason).slice(0, 280),
        extra: { stack: e.reason?.stack?.slice(0, 2000) } }), true));
      o.canvas?.addEventListener?.('webglcontextlost', () => push(item('error', { name: 'webglcontextlost' }), true));
    }
    addEventListener('pagehide', () => { push(item('unload')); flush(true); });
    document.addEventListener('visibilitychange', () => {
      push(item('event', { name: document.hidden ? 'hidden' : 'visible' }), document.hidden);
    });

    push(item('event', { name: 'start' }), true);
    timer = setTimeout(beat, Math.min(o.interval, 5000));

    const api = {
      sessionKey: sk,
      /** Record a named event (loading phases, mode switches...). */
      event(name, extra) { push(item('event', { name, extra }), true); },
      /** Mark loading complete. Sessions that never send this and go silent show as lost-loading. */
      ready(extra) { push(item('event', { name: 'ready', extra }), true); },
      error(name, extra) { push(item('error', { name, extra }), true); },
      /** Human-written bug report tied to the current position, or to `at: {lat, lon, alt}`. Resolves with the server's bug id(s). */
      async bug(text, { screenshot = false, category, extra, at, quality = 0.7, maxWidth = 1280 } = {}) {
        let shot;
        if (screenshot && o.canvas) shot = await snap(o.canvas, quality, maxWidth, o.beforeScreenshot);
        const it = item('bug', { name: category ?? 'bug', ...at, extra, bug: { text, category, shot } });
        const r = await fetch(o.endpoint, { method: 'POST', body: envelope([it]), headers: { 'content-type': 'text/plain' } });
        sentEnv = true;
        return r.ok ? (await r.json()).bugs : Promise.reject(new Error('beacons bug: ' + r.status));
      },
      /** The data build (bake) can arrive after init; later posts carry it. */
      setBuild(id) { o.buildId = id; },
      flush,
      stop() { disabled = true; clearTimeout(timer); meter?.stop(); },
    };
    return api;
  },
};

/** Canvas -> downscaled JPEG data URL. WebGL canvases need preserveDrawingBuffer, or a render in beforeScreenshot. */
async function snap(canvas, quality, maxWidth, before) {
  try {
    await before?.();
    const k = Math.min(1, maxWidth / canvas.width);
    const c = document.createElement('canvas');
    c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k);
    c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  } catch { return undefined; }
}
