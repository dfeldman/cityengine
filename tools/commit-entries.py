"""Commit one agent's work alone in the shared cityengine checkout (several sessions edit here at once).
  python3 tools/commit-entries.py MSGFILE --whole a.ts b.md --hunks file.json:MARKER file.ts:re:REGEX ...
--whole: files committed as they are (new files, or files only you touched).
--hunks: only your entries in a shared file, picked from its diff against HEAD by MARKER (a substring, or re:REGEX):
  inserted lines, or whole JSON objects; in a hunk that also holds others' changes only the marker lines are taken and
  placed by rule (an import after the last import, a PARIS_MONUMENTS line just before that object closes; registry
  files, *index.ts, always go this way).
Guards (nothing is committed if one fails): every committed JSON file parses; no line ends up more often than in both HEAD
and the working copy; an index.ts imports only files the commit holds, imports every name it registers, and has no
registry lines outside PARIS_MONUMENTS. Typecheck HEAD in a scratch worktree after a run of these commits: the guards
catch the failures seen so far, not every one.
Uses a temp index; afterwards the real index entries for these paths are set to the new HEAD, but only for paths that
had nothing staged before (so another session's staging is never touched)."""
import os, re, subprocess, sys
import tempfile
S = tempfile.mkdtemp(prefix='commit-entries-')
os.chdir(os.path.expanduser('~/cityengine'))
a = sys.argv[1:]; msg = a[0]
whole = a[a.index('--whole') + 1:a.index('--hunks') if '--hunks' in a else None] if '--whole' in a else []
hunks = [x.split(':', 1) for x in a[a.index('--hunks') + 1:]] if '--hunks' in a else []
paths = whole + [f for f, _ in hunks]
clean = [p for p in paths if subprocess.run(['git', 'diff', '--cached', '--quiet', '--', p]).returncode == 0
         and subprocess.run(['git', 'ls-files', '--error-unmatch', p], capture_output=True).returncode == 0 or
         subprocess.run(['git', 'ls-files', '--error-unmatch', p], capture_output=True).returncode != 0]
env = {**os.environ, 'GIT_INDEX_FILE': S + '/idx'}
run = lambda *c, **k: subprocess.run(c, env=env, check=True, **k)
run('git', 'read-tree', 'HEAD')
BOUND = re.compile(r'\s*([\]}],?|[\[{])\s*')


def units(added):
    """Split a pure insertion into the entries several agents may have put side by side: single lines (imports, list
    lines), or JSON objects with the boundary lines ('},' '{') that belong to them."""
    b = [i for i, l in enumerate(added) if BOUND.fullmatch(l)]
    if not b:
        return [[l] for l in added]
    ind = min(len(added[i]) - len(added[i].lstrip()) for i in b)
    isb = [BOUND.fullmatch(l) is not None and len(l) - len(l.lstrip()) == ind for l in added]
    runs = []  # (is boundary, lines), alternating
    for l, x in zip(added, isb):
        if runs and runs[-1][0] == x: runs[-1][1].append(l)
        else: runs.append((x, [l]))
    out, pend = [], []
    closer = lambda l: l.strip()[:1] in (']', '}')
    if closer(added[0]):  # '},' '{' before each new object (appended after the last one): each body owns the run before it
        for x, ls in runs:
            if x: pend = ls
            else: out.append(pend + ls); pend = []
        if pend: out.append(pend)
    else:  # '{' body '},' objects: in a boundary run the closers end the body before, the openers start the next
        for x, ls in runs:
            if not x: out.append(pend + ls); pend = []; continue
            if out: out[-1] = out[-1] + [l for l in ls if closer(l)]
            pend = [l for l in ls if not closer(l)]
        if pend: out.append(pend)
    return out


has = lambda m, t: bool(re.search(m[3:], t)) if m.startswith('re:') else m in t  # MARKER, or re:REGEX


def anchored(f, m):
    """Lines of the working copy that carry MARKER and HEAD lacks, each put after the nearest line before it that the
    temp index already has: for hunks that also hold other sessions' changes (a reordered list), where a -U0 patch
    would carry their lines too."""
    blob = subprocess.run(['git', 'show', ':' + f], env=env, capture_output=True, text=True).stdout.split('\n')
    work = open(f).read().split('\n')
    have = set(blob)
    for i, l in enumerate(work):
        if not has(m, l) or l in have:
            continue
        reg = next((k for k, x in enumerate(blob) if x.startswith('export const PARIS_MONUMENTS')), None)
        if l.startswith('import '):  # an import: after the last import
            at = max(k for k, x in enumerate(blob) if x.startswith('import ')) + 1
        elif reg is not None and re.fullmatch(r'  [A-Za-z0-9]+,', l):  # a registry line: just before the object closes
            at = next(k for k in range(reg + 1, len(blob)) if blob[k] == '}')
        else:  # after the nearest earlier working line the blob has (its last copy)
            j = i - 1
            while j >= 0 and work[j] not in have:
                j -= 1
            at = (len(blob) - 1 - blob[::-1].index(work[j])) + 1 if j >= 0 else 0
        blob.insert(at, l)
        have.add(l)
    h = subprocess.run(['git', 'hash-object', '-w', '--stdin'], input='\n'.join(blob), capture_output=True, text=True).stdout.strip()
    run('git', 'update-index', '--cacheinfo', f'100644,{h},{f}')


for f, m in hunks:
    d = subprocess.run(['git', 'diff', '-U0', 'HEAD', '--', f], capture_output=True, text=True).stdout  # vs HEAD: the real index may lag
    head, *h = re.split(r'(?m)^(?=@@)', d)
    keep, mixed = [], f.endswith('index.ts')  # a registry file: always placed by rule (anchored)
    for x in h:
        if not has(m, x) or f.endswith('index.ts'): continue
        lines = x.split('\n')
        body = [l for l in lines[1:] if l]
        if any(l.startswith('-') for l in body):  # a change hunk: may hold other sessions' edits; take only marker lines
            mixed = True; continue
        old_start = int(re.match(r'@@ -(\d+)', lines[0]).group(1))
        sel = [l for u in units([l[1:] for l in body]) if any(has(m, v) for v in u) for l in u]
        keep.append(f'@@ -{old_start},0 +{old_start + 1},{len(sel)} @@\n' + ''.join('+' + l + '\n' for l in sel))
    if not keep and not mixed: sys.exit(f'no hunk with {m!r} in {f}')
    if keep: run('git', 'apply', '--cached', '--unidiff-zero', '-', input=(head + ''.join(keep)).encode())
    if mixed: anchored(f, m)
if whole: run('git', 'add', '--', *whole)
import json
for p in paths:
    if p.endswith('.json'):
        blob = subprocess.run(['git', 'show', ':' + p], env=env, capture_output=True, text=True).stdout
        try: json.loads(blob)
        except Exception as e: sys.exit(f'{p} would not parse after the commit: {e}; nothing committed')
# no line may appear more often than in both HEAD and the working copy (a misplaced -U0 insertion duplicates lines)
import collections
for p in {f for f, _ in hunks}:
    new = collections.Counter(subprocess.run(['git', 'show', ':' + p], env=env, capture_output=True, text=True).stdout.split('\n'))
    head = collections.Counter(subprocess.run(['git', 'show', 'HEAD:' + p], capture_output=True, text=True).stdout.split('\n'))
    work = collections.Counter(open(p).read().split('\n'))
    extra = [l for l, n in new.items() if l.strip() and n > max(head[l], work[l])]
    if extra: sys.exit(f'{p}: the commit would duplicate {extra[:3]}; nothing committed')
# a registry file (monuments/index.ts) must import every name it registers, from files the commit holds
for p in {f for f, _ in hunks} | set(whole):
    if not p.endswith('index.ts'):
        continue
    s = subprocess.run(['git', 'show', ':' + p], env=env, capture_output=True, text=True).stdout
    tree = set(subprocess.run(['git', 'ls-files'], env=env, capture_output=True, text=True).stdout.split())
    names = set()
    for mm in re.finditer(r"import \{([^}]*)\} from '([^']+)'", s):
        q = os.path.normpath(os.path.join(os.path.dirname(p), mm.group(2)))
        if mm.group(2).startswith('.') and q not in tree: sys.exit(f'{p} would import {q}, which the commit lacks; nothing committed')
        names |= {n.strip().split(' as ')[-1] for n in mm.group(1).split(',') if n.strip()}
    reg = re.search(r'PARIS_MONUMENTS[^{]*\{(.*?)\n\}', s, re.S)
    bad = [n for n in re.findall(r'^\s+([A-Za-z0-9]+),', reg.group(1), re.M) if n not in names] if reg else []
    if bad: sys.exit(f'{p} would register {bad} without importing them; nothing committed')
    pre = s.split('export const PARIS_MONUMENTS')[0] if 'export const PARIS_MONUMENTS' in s else ''
    stray = re.findall(r'(?m)^  [A-Za-z0-9]+,$', pre)
    if stray: sys.exit(f'{p} would have registry lines outside PARIS_MONUMENTS: {stray[:3]}; nothing committed')
print(subprocess.run(['git', 'diff', '--cached', '--stat'], env=env, capture_output=True, text=True).stdout)
run('git', 'commit', '-q', '-F', msg)
subprocess.run(['git', 'reset', '-q', '--', *clean])
print(subprocess.run(['git', 'log', '--oneline', '-1'], capture_output=True, text=True).stdout,
      subprocess.run(['git', 'status', '--short', '--', *paths], capture_output=True, text=True).stdout)
