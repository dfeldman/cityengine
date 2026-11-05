# Église Américaine / American Church in Paris (2026-11-04, claude-sonnet-5-5)

OSM way/69049385 (building=chapel, the building itself, not a plot; ~1170 m2). Builder `egliseAmericaine` in
src/render/landmarks/paris/protestant.ts, entry in public/landmarks/paris/protestant.json; the generic parisCivic entry
was removed from civic.json. The footprint is registered through museums/enframe.ts (`registerRing`) from OSM nodes in
metres east/north of (2.3069 E, 48.8621 N), so rotation of the box does not matter. North is the quai d'Orsay.

Refs (Commons, geosearch 5 m): ext-01 (crocketed pointed portal), ext-02 (brick walls, pointed window, pierced parapet),
ext-03 (brick hall wing), tower-a / tower-b (stone belfry, corner pinnacles, green copper spire). Shots: model-quai-ne,
model-quai-nw (in-city, paris-centre, lowres). The courtyard site is hemmed in by flats, so only the quai side shows.

Modelled: brick-below/stone-above nave with buttresses, pinnacles and pointed windows; hipped slate roof; quai gable with
great window, portal and cross; chamfered apse end; tower at the west corner with belfry openings, corner buttresses and
pinnacles, octagonal green spire with cross. Not modelled: tracery, crockets, the pierced parapet, the brick hall wing
(not in this OSM way), dormers. Constants are AC_* at the top of the block; `ogive` and `gothicWindow` are exported helpers
for the next Protestant Gothic church.
Unverified: the tower's place (west corner of the quai front) is inferred from the ring's NW block and the shots, not from
a plan; the brick/stone split on the nave is from ext-02/03, which may show the hall wing.
