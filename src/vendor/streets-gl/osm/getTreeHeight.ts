// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import {parseMeters} from "./tagHelpers.ts";

export default function getTreeHeight(tags: Record<string, string>): number | undefined {
	const minHeight = parseMeters(tags['min_height']) || 0.0;
	let height = (parseMeters(tags['height']) || parseMeters(tags['est_height'])) - minHeight;

	if (!height) {
		// estimate height from width
		let width = parseMeters(tags['diameter_crown']);

		// estimate width from trunk diameter / circumference
		if (!width) {
			const diameter = parseMeters(tags['diameter'], 0.001) || parseMeters(tags['circumference']) / Math.PI;
			width = diameter * 23.0;
		}

		// check if width is reasonable
		if (width > 0.5 && width < 100) {
			height = width * 2.0;
		}
	}

	return height || undefined;
}
