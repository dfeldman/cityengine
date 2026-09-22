// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import type {VectorAreaDescriptor} from "../descriptors.ts";

const lookup: Record<string, VectorAreaDescriptor['buildingRoofMaterial']> = {
	tile: 'tiles',
	tiles: 'tiles',
	roof_tiles: 'tiles',
	slate: 'tiles',
	metal: 'metal',
	metal_sheet: 'metal',
	'metal sheet': 'metal',
	tin: 'metal',
	copper: 'metal',
	zinc: 'metal',
	concrete: 'concrete',
	asphalt: 'concrete',
	eternit: 'eternit',
	asbestos: 'eternit',
	thatch: 'thatch',
	grass: 'grass',
	glass: 'glass',
	tar_paper: 'tar'
};

export default function getRoofMaterialFromOSMMaterial(
	material: string,
	fallback: VectorAreaDescriptor['buildingRoofMaterial'] = 'concrete'
): VectorAreaDescriptor['buildingRoofMaterial'] {
	return lookup[material] ?? fallback;
}