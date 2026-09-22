import type {VectorAreaDescriptor, VectorDescriptor, VectorNodeDescriptor} from "./descriptors.ts";

export enum ModifierType {
	NodeRow,
	CircleArea
}

interface BaseModifier {
	type: ModifierType;
	descriptor: VectorDescriptor;
}

export interface NodeRowModifier extends BaseModifier {
	type: ModifierType.NodeRow;
	spacing: number;
	randomness: number;
	descriptor: VectorNodeDescriptor;
}

export interface CircleAreaModifier extends BaseModifier {
	type: ModifierType.CircleArea;
	radius: number;
	descriptor: VectorAreaDescriptor;
}

export type Modifier = NodeRowModifier | CircleAreaModifier;