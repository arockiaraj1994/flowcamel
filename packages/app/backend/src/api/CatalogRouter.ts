import { Router, IRouter } from 'express';
import {
  CAMEL_CATALOG_VERSION,
  CAMEL_CATALOG_MAVEN,
  getAllCatalogSchemes,
  getSupportedBlockTypes,
} from '@flowcamel/core';

export const catalogRouter: IRouter = Router();

/** Catalog metadata (full components.json stays in @flowcamel/core for generator). */
catalogRouter.get('/meta', (_req, res) => {
  res.json({
    version: CAMEL_CATALOG_VERSION,
    maven: CAMEL_CATALOG_MAVEN,
    schemeCount: getAllCatalogSchemes().length,
    featuredBlocks: getSupportedBlockTypes(),
  });
});
