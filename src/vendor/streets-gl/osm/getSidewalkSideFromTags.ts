// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import type {VectorPolylineDescriptor} from "../descriptors.ts";

export default function getSidewalkSideFromTags(tags: Record<string, string>): VectorPolylineDescriptor['side'] {
	const isBoth = tags['sidewalk:both'] === 'yes' || tags['sidewalk'] === 'both';
	const isOnLeft = tags['sidewalk:left'] === 'yes' || tags['sidewalk'] === 'left' || isBoth;
	const isOnRight = tags['sidewalk:right'] === 'yes' || tags['sidewalk'] === 'right' || isBoth;

	if (isOnLeft && isOnRight) {
		return 'both';
	}

	if (isOnLeft) {
		return 'left';
	}

	if (isOnRight) {
		return 'right';
	}

	return null;
}