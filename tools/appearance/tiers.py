"""
The priority tiers for labelling buildings from their photographs (docs/APPEARANCE-RESEARCH.md §10; owner, 2026-10-24:
"we could aggressively prioritize by size and location"): where people look, and where the photographs are.

  1  shopping and main streets: an OSM shop or amenity on it, 3+ within 50 m, within 25 m of a main street, or a
     commercial roll use
  2  historic or old in the central districts: CEQA A, a historic district, or built before 1930 outside the Sunset
  3a other residential   3b the Sunset   4 no street face (set back 15 m+) or under 60 m²   5 outside San Francisco
"""


def tier(b):
    if b.get('district') in ('marin', 'angel', 'treasure'):
        return '5'
    if (b.get('geo_setback_m') or 99) >= 15 or (b.get('footprint_m2') or 0) < 60:
        return '4'
    if (b.get('poi_on') or 0) > 0 or (b.get('poi_50') or 0) >= 3 or (b.get('nb_main_street_m') or 999) < 25 \
            or str(b.get('roll_use') or '').startswith('COM'):
        return '1'
    if b.get('hist_ceqa') == 'A' or b.get('hist_district') or ((b.get('year_built') or 9999) < 1930 and b.get('district') != 'sunset'):
        return '2'
    return '3b' if b.get('district') == 'sunset' else '3a'
