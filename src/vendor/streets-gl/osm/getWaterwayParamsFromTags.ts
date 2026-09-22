// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import {parseHeight} from "./tagHelpers.ts";

const lookup: Record<string, number> = {
	river: 10,
	stream: 2,
	canal: 8,
	drain: 1,
	ditch: 1,
};

export default function getWaterwayParamsFromTags(tags: Record<string, string>): {
	width: number;
} {
	const defaultWidth = lookup[tags.waterway];

	if (defaultWidth === undefined) {
		return null;
	}

	return {
		width: parseHeight(tags.width, defaultWidth)
	};
}