export { BlockCategory } from './model/BlockCategory.js';
export type { BlockDefinition, PropSchema } from './model/BlockDefinition.js';
export type { FlowEdge } from './model/FlowEdge.js';
export type { FlowGraph } from './model/FlowGraph.js';
export type { FlowNode } from './model/FlowNode.js';
export type { ProjectMeta } from './model/ProjectMeta.js';

export { getAllBlocks, getBlock, getByCategory } from './api/BlockRegistry.js';
export {
  CAMEL_CATALOG_VERSION,
  CAMEL_CATALOG_MAVEN,
  getCatalogComponent,
  getAllCatalogSchemes,
  getAllCatalogComponents,
  rolesForScheme,
  getMavenStarter,
  getBlockWithCatalog,
  getEipType,
  enrichBlock,
} from './api/CatalogRegistry.js';
export type { CatalogComponentEntry } from './api/CatalogRegistry.js';
export {
  buildEndpointUri,
  buildEndpointDescriptor,
  fillUriTemplate,
  getBlockUriTemplate,
} from './api/UriBuilder.js';
export type { EndpointDescriptor } from './api/ComponentUri.js';
export { splitEndpointUri } from './api/ComponentUri.js';
export {
  getComponentProperties,
  getWizardSteps,
  getDefaultPropsForBlock,
  resolveNodeProps,
  resolvePropValue,
  getConfigPropertiesForBlock,
  catalogPropToSchema,
  roleForBlockCategory,
} from './api/ComponentProperties.js';
export type { ComponentRole } from './api/ComponentProperties.js';
export {
  buildUriFromCatalog,
  getUriParts,
  parseSyntax,
  getSyntaxSeparators,
} from './api/ComponentUri.js';
export {
  getFeaturedBlocks,
  getSupportedBlockTypes,
  isFeaturedBlock,
  isBlockedScheme,
} from './api/PaletteRegistry.js';
export { emitRouteStep } from './api/RouteDsl.js';
export type { CamelComponentMeta, CamelComponentDescriptor, CamelCatalogProperty } from './model/CamelCatalog.js';
export { validate, validateForYamlExport } from './api/GraphValidator.js';
export type { ValidationResult } from './api/GraphValidator.js';
export { graphToYamlRoutes } from './api/RouteYamlEmitter.js';
export { buildYamlRoute } from './api/YamlRouteBuilder.js';
export { orderedNodesFromGraph } from './api/graphOrder.js';
export { fromJSON, toJSON } from './api/GraphSerializer.js';
