// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
const buildingExceptions: string[] = [
	'roof',
	'stadium',
	'houseboat',
	'castle',
	'greenhouse',
	'storage_tank',
	'silo',
	'stadium',
	'ship',
	'bridge',
	'digester',
	'water_tower',
	'shed'
];

export default function isBuildingSupportsDefaultRoof(tags: Record<string, string>): boolean {
	if (
		!!tags['bridge:support'] ||
		!!tags['ship:type'] ||
		tags.man_made === 'storage_tank' ||
		tags.man_made === 'chimney' ||
		tags.man_made === 'stele'
	) {
		return false;
	}

	return !buildingExceptions.includes(tags.building);
}