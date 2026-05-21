package com.flowcamel.core.graph;

import com.flowcamel.core.model.FlowDefinition;
import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.ProjectConfig;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public final class GraphNormalizer {
  private GraphNormalizer() {}

  public static FlowGraph normalize(FlowGraph graph) {
    if (graph == null) return emptyGraph("");
    FlowGraph g = graph;

    if (g.flows != null && !g.flows.isEmpty()) {
      for (FlowDefinition f : g.flows) {
        if (f.nodes == null) f.nodes = new ArrayList<>();
        if (f.edges == null) f.edges = new ArrayList<>();
        if (f.routeId == null || f.routeId.isBlank()) {
          f.routeId = allocateRouteId(f.name != null ? f.name : "flow", g.flows);
        }
      }
      return g;
    }

    FlowDefinition flow = new FlowDefinition();
    flow.id = UUID.randomUUID().toString();
    flow.name = "Flow 1";
    flow.routeId = "flow-1";
    flow.nodes = g.nodes != null ? new ArrayList<>(g.nodes) : new ArrayList<>();
    flow.edges = g.edges != null ? new ArrayList<>(g.edges) : new ArrayList<>();

    g.flows = new ArrayList<>(List.of(flow));
    g.nodes = null;
    g.edges = null;
    return g;
  }

  public static List<FlowDefinition> getFlows(FlowGraph graph) {
    return normalize(graph).flows;
  }

  public static String allocateRouteId(String name, List<FlowDefinition> existing) {
    String base = slugRouteId(name);
    Set<String> used = new HashSet<>();
    for (FlowDefinition f : existing) {
      if (f.routeId != null) used.add(f.routeId);
    }
    if (!used.contains(base)) return base;
    for (int i = 2; i < 1000; i++) {
      String candidate = base + "-" + i;
      if (!used.contains(candidate)) return candidate;
    }
    return base + "-" + System.currentTimeMillis();
  }

  private static String slugRouteId(String name) {
    String base = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    return base.isEmpty() ? "flow" : base;
  }

  public static FlowGraph emptyGraph(String projectName) {
    FlowGraph g = new FlowGraph();
    g.name = projectName != null ? projectName : "";
    g.flows = new ArrayList<>();
    FlowDefinition flow = new FlowDefinition();
    flow.id = UUID.randomUUID().toString();
    flow.name = "Flow 1";
    flow.routeId = "flow-1";
    g.flows.add(flow);
    g.config = new ProjectConfig();
    return g;
  }
}
