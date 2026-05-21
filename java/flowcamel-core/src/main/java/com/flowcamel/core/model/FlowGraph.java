package com.flowcamel.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FlowGraph {
  public String id = "";
  public String name = "";
  public List<FlowDefinition> flows = new ArrayList<>();
  public ProjectConfig config;
  /** Legacy single-flow; migrated by {@link com.flowcamel.core.graph.GraphNormalizer}. */
  public List<FlowNode> nodes;
  public List<FlowEdge> edges;
}
