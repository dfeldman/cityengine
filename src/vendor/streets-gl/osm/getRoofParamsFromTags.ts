// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import type {VectorAreaDescriptor} from "../descriptors.ts";
import getRoofTypeFromOSMRoofShape
	from "./getRoofTypeFromOSMRoofShape.ts";
import getRoofMaterialFromOSMMaterial
	from "./getRoofMaterialFromOSMMaterial.ts";
import {parseColor} from "./tagHelpers.ts";
import isBuildingSupportsDefaultRoof
	from "./isBuildingSupportsDefaultRoof.ts";

export default function getRoofParamsFromTags(tags: Record<string, string>): {
	type: VectorAreaDescriptor['buildingRoofType'];
	material: VectorAreaDescriptor['buildingRoofMaterial'];
	color: number;
} {
	const type = getRoofTypeFromOSMRoofShape(tags['roof:shape'], 'flat');
	const noDefault = !isBuildingSupportsDefaultRoof(tags) || type !== 'flat';

	const materialTagValue = tags['roof:material'];
	const colorTagValue = tags['roof:colour'];

	let material = getRoofMaterialFromOSMMaterial(materialTagValue, 'default');
	let color = parseColor(colorTagValue, null);

	if ((color !== null || noDefault) && material === 'default') {
		material = 'concrete';
	}

	if (color === null) {
		switch (material) {
			case 'concrete': {
				color = 0xBBBBBB;
				break;
			}
			case 'metal': {
				color = materialTagValue === 'copper' ? 0xA3CABD : 0xC3D2DD;
				break;
			}
			case 'tiles': {
				color = materialTagValue === 'slate' ? 0x8C8C97 : 0xCB7D64;
				break;
			}
			default: {
				color = 0xffffff;
			}
		}
	}

	return {
		type: type,
		material: material,
		color: color
	};
}