// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import type {VectorPolylineDescriptor} from "../descriptors.ts";

export default function getCyclewaySideFromTags(tags: Record<string, string>): VectorPolylineDescriptor['side'] {
	const isBoth = tags['cycleway:both'] === 'lane';
	const isOnLeft = tags['cycleway:left'] === 'lane' || isBoth;
	const isOnRight = tags['cycleway:right'] === 'lane' || isBoth;

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