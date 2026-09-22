// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import type {VectorAreaDescriptor} from "../descriptors.ts";
import {parseColor} from "./tagHelpers.ts";

const lookup: Record<string, {
	type: VectorAreaDescriptor['buildingFacadeMaterial'];
	defaultColor: number;
}> = {
	brick: {type: 'brick', defaultColor: 0x8c4834},
	cement_block: {type: 'cementBlock', defaultColor: 0xffffff},
	block: {type: 'cementBlock', defaultColor: 0xffffff},
	wood: {type: 'wood', defaultColor: 0xffffff},
	plaster: {type: 'plaster', defaultColor: 0xffffff},
	plastered: {type: 'plaster', defaultColor: 0xffffff},
	concrete: {type: 'plaster', defaultColor: 0xdddddd},
	hard: {type: 'plaster', defaultColor: 0xdddddd},
	glass: {type: 'glass', defaultColor: 0xffffff},
	mirror: {type: 'glass', defaultColor: 0xffffff},
};

export default function getFacadeParamsFromTags(
	tags: Record<string, string>
): {
	material: VectorAreaDescriptor['buildingFacadeMaterial'];
	color: number;
} {
	const materialTagValue = tags['building:material'];
	const colorTagValue = tags['building:colour'];
	const config = lookup[materialTagValue] ?? lookup.plaster;
	const color = parseColor(colorTagValue, config.defaultColor);

	return {
		material: config.type,
		color: color
	};
}