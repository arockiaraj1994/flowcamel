package com.flowcamel.core.catalog;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CamelComponentMeta {
  public String name;
  public String scheme;
  public String syntax;
  public String artifactId;
  public Boolean consumerOnly;
  public Boolean producerOnly;
}
