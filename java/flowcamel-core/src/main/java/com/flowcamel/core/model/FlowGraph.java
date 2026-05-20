package com.flowcamel.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FlowGraph {
  public String id = "";
  public String name = "";
  public List<FlowNode> nodes = new ArrayList<>();
  public List<FlowEdge> edges = new ArrayList<>();
}
