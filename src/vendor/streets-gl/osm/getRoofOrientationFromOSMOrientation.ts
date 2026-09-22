// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import type {VectorAreaDescriptor} from "../descriptors.ts";

export default function getRoofOrientationFromOSMOrientation(str: string): VectorAreaDescriptor['buildingRoofOrientation'] {
	if (str === 'along' || str === 'across') {
		return str;
	}

	return null;
}