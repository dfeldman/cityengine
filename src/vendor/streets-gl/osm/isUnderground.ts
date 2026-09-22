// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import {readTagAsFloat} from "./tagHelpers.ts";

export default function isUnderground(tags: Record<string, string>): boolean {
	const isInTunnel = tags.tunnel !== undefined && tags.tunnel !== 'no';

	return (
		tags.location === 'underground' ||
		readTagAsFloat(tags, 'level') < 0 ||
		isInTunnel ||
		tags.parking === 'underground'
	);
}