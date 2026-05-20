package com.flowcamel.api.resource;

import com.flowcamel.core.registry.CatalogRegistry;
import com.flowcamel.core.registry.PaletteRegistry;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

@Path("/api/catalog")
@Produces(MediaType.APPLICATION_JSON)
public class CatalogResource {
  @GET
  @Path("/meta")
  public Map<String, Object> meta() {
    return Map.of(
        "version", CatalogRegistry.CAMEL_CATALOG_VERSION,
        "maven", CatalogRegistry.CAMEL_CATALOG_MAVEN,
        "schemeCount", CatalogRegistry.getAllCatalogSchemes().size(),
        "featuredBlocks", PaletteRegistry.getSupportedBlockTypes());
  }
}
