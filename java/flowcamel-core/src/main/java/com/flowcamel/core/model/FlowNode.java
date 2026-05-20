package com.flowcamel.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.flowcamel.core.json.FlowNodeDeserializer;
import com.flowcamel.core.json.StringMapDeserializer;
import java.util.LinkedHashMap;
import java.util.Map;

/** Matches TypeScript {@code FlowNode} (position object, not flat x/y). */
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonDeserialize(using = FlowNodeDeserializer.class)
public class FlowNode {
  public String id;
  public String blockType;
  public String label;
  public String subtitle;
  public NodePosition position;

  @JsonDeserialize(using = StringMapDeserializer.class)
  public Map<String, String> props = new LinkedHashMap<>();
}
