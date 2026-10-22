#!/usr/bin/env python3
"""
Summarise a render round's judge files (BRIEF-JUDGE.md): resemblance of today's render and the labelled one to the
photograph, 0-3, and what the remaining differences were blamed on. Appearance research, 2026-10-22.

    python3 -I tools/appearance/judged.py data/appearance/research/labels/judge6-*.jsonl
"""
import collections
import json
import sys

rows = [json.loads(l) for p in sys.argv[1:] for l in open(p) if l.strip()]
found = [r for r in rows if r.get('found') == 'yes']
n = max(len(found), 1)
print(f'judged {len(rows)}, matched {len(found)}')
print(f"resemblance: today {sum(r['today'] for r in found) / n:.2f}, labels {sum(r['labels'] for r in found) / n:.2f}"
      f"; labels >= 2: {sum(r['labels'] >= 2 for r in found)}; labels = 3: {sum(r['labels'] == 3 for r in found)}")
print('closer:', dict(collections.Counter(r['better'] for r in found)))
print('misses by cause:', dict(collections.Counter(m['cause'] for r in found for m in r.get('misses', []))))
