import { BlockCategory } from './BlockCategory.js';

/** Subset of Apache Camel catalog component JSON */
export interface CamelComponentMeta {
  kind?: string;
  name: string;
  title: string;
  description?: string;
  scheme: string;
  syntax: string;
  consumerOnly: boolean;
  producerOnly: boolean;
  artifactId: string;
  groupId: string;
  deprecated: boolean;
}

export interface CamelCatalogProperty {
  name: string;
  displayName: string;
  type: string;
  required: boolean;
  secret: boolean;
  defaultValue?: string | number | boolean;
  enum?: string[];
  description?: string;
  label?: string;
  group?: string;
  kind?: string;
}

export interface CamelComponentDescriptor {
  scheme: string;
  component: CamelComponentMeta;
  /** Endpoint-level options (URI query) */
  properties: CamelCatalogProperty[];
}

export interface EipDefinition {
  type: string;
  label: string;
  category: typeof BlockCategory.ACTION;
  /** EIP id used by generator emitters */
  eipId: string;
}
