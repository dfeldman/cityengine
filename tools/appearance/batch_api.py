#!/usr/bin/env python3
"""
Label buildings through the Anthropic Message Batches API, one request per building (appearance research, 2026-10-24;
owner: "Labelling directly… Focus on tier 1 buildings"). The Claude Code subagents spend ~15k tokens a building
(their own reading and writing); a direct request is the brief (cached), the photographs and the answer — about
$0.0003 a building at batch prices (docs/APPEARANCE-RESEARCH.md §10).

  - the brief: data/appearance/research/BRIEF-HAIKU-v11-api.md (v11's questions word for word; the menus inline, the
    photographs attached, one JSON line back), with the menus, as a cached system prompt;
  - the photographs: tools/cache/appearance-r2/way-<n>/*.jpg, each scaled to 1024 px on its long side (≈1,000 tokens
    rather than ≈1,500 at the API's own limit);
  - claude-haiku-5-5, thinking off (the agents' labels had none either), a few hundred tokens out.

    python -I tools/appearance/batch_api.py plan --tier 1 --n 200 --labelled      # pick, build, size, price; sends nothing
    python -I tools/appearance/batch_api.py submit --run h55-v11-api               # sends the planned batch (ANTHROPIC_API_KEY)
    python -I tools/appearance/batch_api.py collect --run h55-v11-api              # waits, writes raw output and usage
    python -I tools/appearance/batch_api.py label --run h55-v11-t1 --tier 1 --thinking medium --follow
                                                                                    # the city's tier-1 buildings, as captured
    python -I tools/appearance/batch_api.py openrouter --run h55-v11-api           # or: the planned requests one by one
                                                                                    # through OpenRouter (~/.cityengine_openrouter_key)

OpenRouter (owner, 2026-10-24: "use the Openrouter api key") speaks the Messages API, so the same requests go through the
same SDK pointed at it. Its own batch endpoint takes only public image URLs, and these photographs carry the red target
lines drawn on them, so they go one request at a time at the full price (twice the batch's), four in flight.

`plan` writes runs/<run>/plan.json (the buildings and why); `submit` records the batch id there and the run in runs.json;
`collect` writes runs/<run>/raw/api-<batch>.jsonl (collect.py reads it like any raw batch) and the tokens and dollars spent.
Needs the anthropic SDK and Pillow (a venv).
"""
import argparse
import base64
import hashlib
import io
import json
import os
import random
import time

D = 'data/appearance/dataset'
PHOTOS = 'tools/cache/appearance-r2'
MODEL = 'claude-haiku-5-5'
# per million tokens, Claude Haiku 5.5 (prompts of 100k tokens or fewer); the Batch API halves every rate
PRICE = {'input': 0.10, 'output': 0.50, 'cache_read': 0.01, 'cache_write': 0.125}
BATCH = 0.5

ap = argparse.ArgumentParser()
ap.add_argument('step', choices=['plan', 'submit', 'collect', 'openrouter', 'label'])
ap.add_argument('--workers', type=int, default=4)
# `label`: the population's buildings of --tier that capture has photographed, through OpenRouter, until done or the money
# runs out; --follow keeps picking up what capture brings in until capture has finished the tier
ap.add_argument('--population', default='tools/cache/appearance-population.jsonl')
ap.add_argument('--follow', action='store_true')
ap.add_argument('--reserve', type=float, default=0.15)
ap.add_argument('--run', default='h55-v11-api')
ap.add_argument('--brief', default='data/appearance/research/BRIEF-HAIKU-v11-api.md')
ap.add_argument('--menus', default='data/appearance/research/menus-v11.json')
ap.add_argument('--tier', default='1')
ap.add_argument('--n', type=int, default=200)
# pick buildings the subagents already labelled (run h55-v11-a), so the two can be compared answer by answer
ap.add_argument('--labelled', action='store_true')
ap.add_argument('--against', default='h55-v11-a')
ap.add_argument('--px', type=int, default=1024)
# Haiku 5.5's own thinking (adaptive, at this effort) instead of none: the subagents' labels were made with it on
ap.add_argument('--thinking', choices=['off', 'low', 'medium', 'high'], default='off')
ap.add_argument('--seed', type=int, default=20261024)
args = ap.parse_args()
RUN = f'{D}/runs/{args.run}'
os.makedirs(f'{RUN}/raw', exist_ok=True)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16]


def tier(b):
    """the priority tiers (docs/APPEARANCE-RESEARCH.md §10): where people look, and where the photographs are"""
    if b.get('district') in ('marin', 'angel', 'treasure'):
        return '5'
    if (b.get('geo_setback_m') or 99) >= 15 or (b.get('footprint_m2') or 0) < 60:
        return '4'
    if (b.get('poi_on') or 0) > 0 or (b.get('poi_50') or 0) >= 3 or (b.get('nb_main_street_m') or 999) < 25 \
            or str(b.get('roll_use') or '').startswith('COM'):
        return '1'
    central = b.get('district') not in ('sunset',)
    if b.get('hist_ceqa') == 'A' or b.get('hist_district') or ((b.get('year_built') or 9999) < 1930 and central):
        return '2'
    return '3b' if b.get('district') == 'sunset' else '3a'


def photos(osm):
    d = f"{PHOTOS}/{osm.replace('/', '-')}"
    return sorted(f'{d}/{f}' for f in os.listdir(d) if f.endswith('.jpg')) if os.path.isdir(d) else []


def image_block(path):
    from PIL import Image
    im = Image.open(path).convert('RGB')
    s = args.px / max(im.size)
    if s < 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=85)
    return {'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': base64.b64encode(buf.getvalue()).decode()}}, im.size


def system_blocks():
    menus = json.load(open(args.menus))
    return [{'type': 'text', 'text': open(args.brief).read() + '\n\nMENUS:\n' + json.dumps(menus, separators=(',', ':')),
             'cache_control': {'type': 'ephemeral'}}]


def request(b):
    imgs = [image_block(p) for p in photos(b['osm'])]
    h = f", {round(b['height_m'])} m tall" if b.get('height_m') else ''
    text = (f"{b['osm']} (footprint about {round(b['narrow_m'])} x {round(b['long_m'])} m{h}). "
            f"{len(imgs)} photograph{'s' if len(imgs) != 1 else ''} follow, in order.")
    think = {'thinking': {'type': 'disabled'}} if args.thinking == 'off' else {'thinking': {'type': 'adaptive'}, 'output_config': {'effort': args.thinking}}
    params = {'model': MODEL, 'max_tokens': 1500 if args.thinking == 'off' else 12000, **think, 'system': system_blocks(),
              'messages': [{'role': 'user', 'content': [{'type': 'text', 'text': text}] + [blk for blk, _ in imgs]}]}
    return {'custom_id': b['osm'].replace('/', '-'), 'params': params}, [sz for _, sz in imgs]


if args.step == 'plan':
    B = [json.loads(l) for l in open(f'{D}/buildings.jsonl')]
    caps = {}
    for line in open(f'{D}/captures.jsonl'):
        c = json.loads(line)
        if c['capture'] == 'r2-strict-original':
            caps[c['osm']] = c
    done = set()
    if args.labelled:
        done = {json.loads(l)['osm'] for l in open(f'{D}/labels/{args.against}.jsonl')}
    pick = [b for b in B if tier(b) == args.tier and caps.get(b['osm'], {}).get('frames', 0) > 0 and photos(b['osm'])
            and (not args.labelled or b['osm'] in done)]
    random.Random(args.seed).shuffle(pick)
    pick = pick[:args.n]
    reqs = [request(b) for b in pick]
    size = len(json.dumps([r for r, _ in reqs]))
    img_tokens = sum(w * h / 750 for _, szs in reqs for w, h in szs)
    sys_tokens = len(system_blocks()[0]['text']) / 3.0  # (≈3 characters a token for this JSON-heavy text, newer tokenizer)
    est = {'input': img_tokens + 60 * len(reqs), 'cache_read': sys_tokens * (len(reqs) - 1), 'cache_write': sys_tokens, 'output': 450 * len(reqs)}
    dollars = sum(est[k] * PRICE[k] for k in est) / 1e6 * BATCH
    json.dump({'run': args.run, 'model': MODEL, 'tier': args.tier, 'labelled_only': args.labelled, 'against': args.against,
               'px': args.px, 'buildings': [b['osm'] for b in pick], 'estimate': {'tokens': est, 'dollars': dollars, 'bytes': size}},
              open(f'{RUN}/plan.json', 'w'), indent=1)
    print(f'{len(pick)} tier-{args.tier} buildings{" (already labelled by " + args.against + ")" if args.labelled else ""}, '
          f'{sum(len(s) for _, s in reqs)} photographs at {args.px} px; batch {size / 1e6:.1f} MB of 256')
    print(f'estimate: {img_tokens / len(reqs):.0f} image tokens a building; ${dollars:.2f} for the batch, '
          f'${dollars / max(1, len(reqs)):.5f} a building -> {RUN}/plan.json')

elif args.step == 'submit':
    import anthropic
    plan = json.load(open(f'{RUN}/plan.json'))
    if plan.get('batch'):
        raise SystemExit(f"{args.run}: already submitted as {plan['batch']}")
    B = {json.loads(l)['osm']: json.loads(l) for l in open(f'{D}/buildings.jsonl')}
    client = anthropic.Anthropic()
    batch = client.messages.batches.create(requests=[request(B[o])[0] for o in plan['buildings']])
    plan['batch'] = batch.id
    plan['submitted'] = time.strftime('%Y-%m-%d %H:%M')
    json.dump(plan, open(f'{RUN}/plan.json', 'w'), indent=1)
    runs = json.load(open(f'{D}/runs.json'))
    if not any(e['run'] == args.run for e in runs):
        runs.append({'run': args.run, 'started': time.strftime('%Y-%m-%d'), 'model': f'{MODEL} (Message Batches API, thinking off)',
                     'brief': {'path': args.brief, 'sha256': sha(args.brief)}, 'menus': {'path': args.menus, 'sha256': sha(args.menus)},
                     'capture': 'r2-strict-original', 'ranks': [], 'buildings': 0, 'px': plan['px'],
                     'notes': f"tier {plan['tier']}; the API route, against the subagents' {plan['against']}"})
        json.dump(runs, open(f'{D}/runs.json', 'w'), indent=1)
    print(f'submitted {len(plan["buildings"])} requests as {batch.id} ({batch.processing_status})')

elif args.step == 'openrouter':
    import anthropic
    from concurrent.futures import ThreadPoolExecutor
    plan = json.load(open(f'{RUN}/plan.json'))
    B = {json.loads(l)['osm']: json.loads(l) for l in open(f'{D}/buildings.jsonl')}
    client = anthropic.Anthropic(base_url='https://openrouter.ai/api', max_retries=4,
                                 api_key=open(os.path.expanduser('~/.cityengine_openrouter_key')).read().strip())
    raw = f"{RUN}/raw/openrouter-{plan.get('started_or') or time.strftime('%Y%m%d-%H%M')}.jsonl"
    plan['started_or'] = os.path.basename(raw)[11:-6]
    have = {json.loads(l)['osm'] for l in open(raw)} if os.path.exists(raw) else set()
    todo = [o for o in plan['buildings'] if o not in have]

    def one(osm):
        req = request(B[osm])[0]['params']
        req['model'] = 'anthropic/claude-haiku-5.5'
        m = client.messages.create(**req)
        text = next((blk.text for blk in m.content if blk.type == 'text'), '').strip()
        return osm, text[text.find('{'):text.rfind('}') + 1], m.usage

    use = plan.get('usage_or', {}).get('tokens') or {'input': 0, 'output': 0, 'cache_read': 0, 'cache_write': 0, 'thinking': 0}
    cost = plan.get('usage_or', {}).get('dollars', 0.0)
    bad = []
    with ThreadPoolExecutor(args.workers) as ex, open(raw, 'a') as f:
        for n, fut in enumerate([ex.submit(one, o) for o in todo], 1):
            try:
                osm, text, u = fut.result()
            except Exception as e:  # noqa: BLE001 - one building's failure is recorded, not fatal
                bad.append(str(e)[:120])
                continue
            use['input'] += u.input_tokens
            use['output'] += u.output_tokens
            use['cache_read'] += u.cache_read_input_tokens or 0
            use['cache_write'] += u.cache_creation_input_tokens or 0
            use['thinking'] += getattr(getattr(u, 'output_tokens_details', None), 'thinking_tokens', 0) or 0
            cost += float(getattr(u, 'cost', 0) or 0)
            try:
                row = json.loads(text)
            except json.JSONDecodeError:
                bad.append(f'{osm}: unparsable')
                continue
            row['osm'] = osm
            f.write(json.dumps(row) + '\n')
            f.flush()
            if n % 25 == 0:
                print(f'  {n}/{len(todo)}, ${cost:.3f} so far', flush=True)
    answered = sum(1 for _ in open(raw))
    plan['usage_or'] = {'tokens': use, 'dollars': cost, 'per_building': cost / max(1, answered), 'answered': answered, 'failed': bad}
    json.dump(plan, open(f'{RUN}/plan.json', 'w'), indent=1)
    runs = json.load(open(f'{D}/runs.json'))
    if not any(e['run'] == args.run for e in runs):
        runs.append({'run': args.run, 'started': time.strftime('%Y-%m-%d'), 'model': 'claude-haiku-5-5 (OpenRouter, Messages API, thinking off)',
                     'brief': {'path': args.brief, 'sha256': sha(args.brief)}, 'menus': {'path': args.menus, 'sha256': sha(args.menus)},
                     'capture': 'r2-strict-original', 'ranks': [], 'buildings': 0, 'px': plan['px'],
                     'notes': f"tier {plan['tier']}; the API route, against the subagents' {plan['against']}"})
        json.dump(runs, open(f'{D}/runs.json', 'w'), indent=1)
    print(f'{answered} answered, {len(bad)} failed {bad[:3]}; tokens {use}; ${cost:.3f} (${cost / max(1, answered):.5f} a building, as OpenRouter reports it)')

elif args.step == 'label':
    # RESILIENT (owner, 2026-10-24: "I am probably running out of $ on my Openrouter account so be sure it is resilient to
    # failures for any reason"):
    #   - every answer is appended and flushed the moment it comes back, and a building is done only when its answer is in
    #     raw/: a run stopped for any reason, rerun, picks up exactly where it was;
    #   - the money: the lower of the account's remaining credit and the key's remaining limit is checked before starting
    #     and every 25 answers, and the run stops with --reserve still unspent; a 402 (out of credit) stops it at once;
    #   - a 401/403 (the key) stops it; rate limits and server errors are retried by the SDK with backoff, then the
    #     building is left for the next pass; ten failures in a row pause the run, longer each time, and three pauses
    #     with nothing answered in between stop it;
    #   - runs/<run>/status.json says how far it got, what it spent and why it stopped.
    import anthropic
    import urllib.request
    import sys as _sys
    _sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from tiers import tier as _tier
    from concurrent.futures import ThreadPoolExecutor
    KEY = open(os.path.expanduser(os.environ.get('OPENROUTER_KEY_FILE', '~/.cityengine_openrouter_key'))).read().strip()
    client = anthropic.Anthropic(base_url='https://openrouter.ai/api', max_retries=4, api_key=KEY, timeout=180)
    pop = {}
    for line in open(args.population):
        b = json.loads(line)
        if _tier(b) == args.tier:
            pop[b['osm']] = b
    status_path = f'{RUN}/status.json'
    status = json.load(open(status_path)) if os.path.exists(status_path) else {'answered': 0, 'dollars': 0.0, 'tokens': {}}
    raw = f'{RUN}/raw/answers.jsonl'

    def remaining():
        """the lower of the account's credit left and the key's limit left, in dollars; None if it cannot be read"""
        left = []
        for path, f in (('credits', lambda d: d['total_credits'] - d['total_usage']), ('key', lambda d: d['limit_remaining'])):
            try:
                r = urllib.request.urlopen(urllib.request.Request(f'https://openrouter.ai/api/v1/{path}', headers={'Authorization': f'Bearer {KEY}'}), timeout=30)
                v = f(json.load(r)['data'])
                if v is not None:
                    left.append(float(v))
            except Exception:  # noqa: BLE001 - an unreadable balance is not a reason to stop; the 402 is the backstop
                pass
        return min(left) if left else None

    def save(stop=None):
        status.update({'run': args.run, 'tier': args.tier, 'updated': time.strftime('%Y-%m-%d %H:%M:%S'), 'stopped': stop})
        json.dump(status, open(status_path, 'w'), indent=1)

    runs = json.load(open(f'{D}/runs.json'))
    if not any(e['run'] == args.run for e in runs):
        runs.append({'run': args.run, 'started': time.strftime('%Y-%m-%d'), 'model': f'claude-haiku-5-5 (OpenRouter, thinking {args.thinking})',
                     'brief': {'path': args.brief, 'sha256': sha(args.brief)}, 'menus': {'path': args.menus, 'sha256': sha(args.menus)},
                     'capture': 'r2-strict-original', 'ranks': [], 'buildings': 0, 'px': args.px,
                     'notes': f'the city\'s tier-{args.tier} buildings (tools/appearance/tiers.py), as capture photographs them'})
        json.dump(runs, open(f'{D}/runs.json', 'w'), indent=1)

    def one(osm):
        req = request(pop[osm])[0]['params']
        req['model'] = 'anthropic/claude-haiku-5.5'
        m = client.messages.create(**req)
        text = next((blk.text for blk in m.content if blk.type == 'text'), '').strip()
        return osm, text[text.find('{'):text.rfind('}') + 1], m.usage

    # (a kill can leave a half line with no newline: end it, so the next answer starts a line of its own)
    if os.path.exists(raw) and os.path.getsize(raw):
        with open(raw, 'rb+') as f:
            f.seek(-1, 2)
            if f.read(1) != b'\n':
                f.write(b'\n')
    stop, pauses = None, 0
    while stop is None:
        done = set()
        if os.path.exists(raw):
            for line in open(raw):
                try:
                    done.add(json.loads(line)['osm'])
                except (json.JSONDecodeError, KeyError):  # (a line half-written when a run was killed: asked again)
                    pass
        captured, finished = set(), True
        for line in open(f'{D}/captures.jsonl'):
            c = json.loads(line)
            if c['capture'] == 'r2-strict-original' and c['osm'] in pop and c.get('frames', 0) > 0:
                captured.add(c['osm'])
        seen = {json.loads(l)['osm'] for l in open(f'{D}/captures.jsonl')}
        finished = all(o in seen for o in pop)
        todo = [o for o in pop if o in captured and o not in done and photos(o)]
        left = remaining()
        print(f'{len(todo)} to label ({len(done)} done, {len(captured)} photographed of {len(pop)}); '
              f'${left:.2f} left' if left is not None else 'balance unknown', flush=True)
        if left is not None and left < args.reserve:
            stop = f'money: ${left:.2f} left, under the ${args.reserve:.2f} reserve'
            break
        fails = 0
        for s0 in range(0, len(todo), 25):
            chunk = todo[s0:s0 + 25]
            with ThreadPoolExecutor(args.workers) as ex, open(raw, 'a') as f:
                for fut in [ex.submit(one, o) for o in chunk]:
                    try:
                        osm, text, u = fut.result()
                    except anthropic.APIStatusError as e:
                        if e.status_code == 402:
                            stop = 'out of credit (402)'
                        elif e.status_code in (401, 403):
                            stop = f'the key was refused ({e.status_code})'
                        fails += 1
                        status['last_error'] = f'{e.status_code}: {str(e)[:160]}'
                        continue
                    except Exception as e:  # noqa: BLE001 - a connection drop, a timeout: leave it for the next pass
                        fails += 1
                        status['last_error'] = str(e)[:160]
                        continue
                    try:
                        row = json.loads(text)
                    except json.JSONDecodeError:
                        fails += 1
                        status['last_error'] = f'{osm}: unparsable answer'
                        continue
                    fails = 0
                    pauses = 0
                    row['osm'] = osm
                    f.write(json.dumps(row) + '\n')
                    f.flush()
                    status['answered'] += 1
                    status['dollars'] += float(getattr(u, 'cost', 0) or 0)
                    t = status['tokens']
                    for k, v in (('input', u.input_tokens), ('output', u.output_tokens), ('cache_read', u.cache_read_input_tokens or 0),
                                 ('thinking', getattr(getattr(u, 'output_tokens_details', None), 'thinking_tokens', 0) or 0)):
                        t[k] = t.get(k, 0) + v
                    save()
            print(f'  {status["answered"]} answered, ${status["dollars"]:.3f} spent', flush=True)
            if stop:
                break
            if fails >= 10:
                pauses += 1
                if pauses > 3:
                    stop = f'three pauses with nothing answered; last error: {status.get("last_error")}'
                    break
                wait = 300 * pauses
                print(f'  {fails} failures in a row ({status.get("last_error")}): pausing {wait} s', flush=True)
                time.sleep(wait)
            left = remaining()
            if left is not None and left < args.reserve:
                stop = f'money: ${left:.2f} left, under the ${args.reserve:.2f} reserve'
                break
        if stop:
            break
        if not args.follow or (finished and not [o for o in pop if o in captured and o not in done]):
            stop = 'done' if finished else 'everything captured so far is labelled'
            if not args.follow or finished:
                break
        print('  waiting for capture: 10 min', flush=True)
        time.sleep(600)
    save(stop)
    print(f'stopped: {stop}; {status["answered"]} answered, ${status["dollars"]:.3f} spent', flush=True)

else:
    import anthropic
    plan = json.load(open(f'{RUN}/plan.json'))
    client = anthropic.Anthropic()
    while True:
        b = client.messages.batches.retrieve(plan['batch'])
        if b.processing_status == 'ended':
            break
        print(f'  {b.processing_status}: {b.request_counts.processing} processing', flush=True)
        time.sleep(60)
    use = {'input': 0, 'output': 0, 'cache_read': 0, 'cache_write': 0}
    out, bad = [], []
    for r in client.messages.batches.results(plan['batch']):
        osm = r.custom_id.replace('-', '/', 1)
        if r.result.type != 'succeeded':
            bad.append((osm, r.result.type))
            continue
        m = r.result.message
        u = m.usage
        use['input'] += u.input_tokens
        use['output'] += u.output_tokens
        use['cache_read'] += getattr(u, 'cache_read_input_tokens', 0) or 0
        use['cache_write'] += getattr(u, 'cache_creation_input_tokens', 0) or 0
        text = next((blk.text for blk in m.content if blk.type == 'text'), '').strip()
        text = text[text.find('{'):text.rfind('}') + 1]
        try:
            row = json.loads(text)
        except json.JSONDecodeError:
            bad.append((osm, 'unparsable'))
            continue
        row['osm'] = osm
        out.append(row)
    with open(f"{RUN}/raw/api-{plan['batch']}.jsonl", 'w') as f:
        for row in out:
            f.write(json.dumps(row) + '\n')
    dollars = sum(use[k] * PRICE[k] for k in use) / 1e6 * BATCH
    plan['usage'] = {'tokens': use, 'dollars': dollars, 'per_building': dollars / max(1, len(out)), 'answered': len(out), 'failed': bad}
    json.dump(plan, open(f'{RUN}/plan.json', 'w'), indent=1)
    print(f'{len(out)} answered, {len(bad)} failed {bad[:5]}; tokens {use}; ${dollars:.3f} (${dollars / max(1, len(out)):.5f} a building)')
