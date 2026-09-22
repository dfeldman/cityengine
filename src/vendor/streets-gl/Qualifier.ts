import type {VectorDescriptor} from "./descriptors.ts";
import type {Modifier} from "./modifiers.ts";

export enum QualifierType {
	Descriptor,
	Modifier
}

interface ModifierContainer {
	type: QualifierType.Modifier;
	data: Modifier;
}

interface DescriptorContainer<T extends VectorDescriptor> {
	type: QualifierType.Descriptor;
	data: T;
}

export type Qualifier<T extends VectorDescriptor> = ModifierContainer | DescriptorContainer<T>;