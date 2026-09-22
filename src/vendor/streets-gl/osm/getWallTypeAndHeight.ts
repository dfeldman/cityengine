// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import type {VectorPolylineDescriptor} from "../descriptors.ts";
import {parseHeight} from "./tagHelpers.ts";

const lookup: Record<string, [VectorPolylineDescriptor['wallType'], number]> = {
	dry_stone: ['stone', 3],
	stone: ['stone', 3],
	brick: ['stone', 3],
	concrete: ['concrete', 3],
	concrete_block: ['concrete', 3],
};

export default function getWallTypeAndHeight(tags: Record<string, string>): {
	material: VectorPolylineDescriptor['wallType'];
	height: number;
} {
	const wallTagValue = tags.wall;
	const entry = lookup[wallTagValue] ?? lookup.concrete;

	const material = entry[0];
	const height = parseHeight(tags.height, entry[1]);

	return {material, height};
}