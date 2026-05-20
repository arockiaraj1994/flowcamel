package com.flowcamel.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.flowcamel.core.json.FlexibleStringDeserializer;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PropSchema {
  public String key;
  public String label;
  public String type;
  public String placeholder;
  public boolean required;

  @JsonDeserialize(using = FlexibleStringDeserializer.class)
  public String defaultValue;

  public String q;
  public String help;

  /** Present in blocks.json (string[] or option objects); not used server-side. */
  public JsonNode options;
}
