export { BlockCategory } from './model/BlockCategory.js';
export type { BlockDefinition, PropSchema } from './model/BlockDefinition.js';
export type { FlowEdge } from './model/FlowEdge.js';
export type { FlowDefinition } from './model/FlowDefinition.js';
export type { FlowGraph } from './model/FlowGraph.js';
export type {
  ConfigEntry,
  ConfigProfile,
  ProjectConfig,
  VaultConfig,
  VaultProvider,
} from './model/ProjectConfig.js';
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
export {
  CONFIG_REF_PREFIX,
  configRefKey,
  isConfigRef,
  listConfigRefsInProps,
  resolvePropForEmit,
} from './api/ConfigRefs.js';
export {
  buildApplicationYamlPreview,
  buildProfileYaml,
  blockConfigPrefix,
  configKeyExists,
  defaultProjectConfig,
  entriesToYamlMap,
  getDefinedConfigKeys,
  getDefinedConfigKeyNames,
  suggestConfigKeys,
  suggestPropertyKeyForField,
} from './api/ApplicationConfigYaml.js';
export { isFieldLinkableToConfig } from './api/PropertyBinding.js';
export {
  canConnect,
  getSuccessorBlocks,
  getSuccessorCategories,
  hasSuccessors,
} from './api/connectionRules.js';
export { validate, validateForYamlExport } from './api/GraphValidator.js';
export type { ValidationResult } from './api/GraphValidator.js';
export { graphToYamlRoutes } from './api/RouteYamlEmitter.js';
export {
  buildYamlRoute,
  buildYamlRouteFromFlow,
  buildAllYamlRoutes,
} from './api/YamlRouteBuilder.js';
export { orderedNodesFromFlow, orderedNodesFromGraph } from './api/graphOrder.js';
export {
  normalizeGraph,
  createFlowDefinition,
  allocateRouteId,
  getFlows,
  flowById,
} from './api/normalizeGraph.js';
export { fromJSON, toJSON } from './api/GraphSerializer.js';
