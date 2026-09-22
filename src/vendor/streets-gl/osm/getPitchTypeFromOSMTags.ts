// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import type {VectorAreaDescriptor} from "../descriptors.ts";
import {getTagValues} from "./tagHelpers.ts";

const lookup: Record<string, VectorAreaDescriptor['pitchType']> = {
	soccer: 'football',
	tennis: 'tennis',
	basketball: 'basketball'
}

export default function getPitchTypeFromOSMTags(tags: Record<string, string>): VectorAreaDescriptor['pitchType'] {
	const values = getTagValues(tags, 'sport');

	for (const value of values) {
		const type = lookup[value];

		if (type === 'basketball' && getTagValues(tags, 'hoops')[0] == '1') {
			return 'generic';
		}

		if (type !== undefined) {
			return type;
		}
	}

	return 'generic';
}