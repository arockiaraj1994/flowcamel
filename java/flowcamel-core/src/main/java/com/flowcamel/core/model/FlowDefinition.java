package com.flowcamel.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FlowDefinition {
  public String id = "";
  public String name = "";
  public String routeId = "";
  public List<FlowNode> nodes = new ArrayList<>();
  public List<FlowEdge> edges = new ArrayList<>();
}
