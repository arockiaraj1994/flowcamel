package com.flowcamel.core.catalog;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CatalogComponentEntry {
  public CamelComponentMeta component;
  public Map<String, JsonNode> properties;
}
