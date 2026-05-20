package com.flowcamel.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BlockDefinition {
  public String type;
  public String label;
  @JsonProperty("short")
  public String shortDescription;
  public BlockCategory category;
  public String icon;
  public String glyph;
  public String explain;
  public String camelComponent;
  public String scheme;
  public String camelUri;
  public String description;
  public List<PropSchema> props = new ArrayList<>();
}
