// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import type {VectorAreaDescriptor} from "../descriptors.ts";

const lookup: Record<string, VectorAreaDescriptor['buildingRoofType']> = {
	flat: 'flat',
	hipped: 'hipped',
	gabled: 'gabled',
	gambrel: 'gambrel',
	pyramidal: 'pyramidal',
	onion: 'onion',
	dome: 'dome',
	round: 'round',
	skillion: 'skillion',
	mansard: 'mansard',
	quadruple_saltbox: 'quadrupleSaltbox',
	saltbox: 'saltbox',
};

export default function getRoofTypeFromOSMRoofShape(
	shape: string,
	fallback: VectorAreaDescriptor['buildingRoofType'] = 'flat'
): VectorAreaDescriptor['buildingRoofType'] {
	return lookup[shape] ?? fallback;
}