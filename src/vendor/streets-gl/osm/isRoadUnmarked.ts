// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
export default function isRoadUnmarked(
	tags: Record<string, string>,
	totalLanes: number,
	defaultValue: boolean
): boolean {
	if (
		totalLanes === 1 ||
		tags.placement === 'transition' ||
		tags.lane_markings === 'no'
	) {
		return false;
	}

	if (tags.lane_markings === 'yes') {
		return true;
	}

	return defaultValue;
}