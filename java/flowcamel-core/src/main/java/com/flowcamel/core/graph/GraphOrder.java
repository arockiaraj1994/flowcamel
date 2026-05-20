package com.flowcamel.core.graph;

import com.flowcamel.core.model.BlockCategory;
import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.FlowNode;
import com.flowcamel.core.registry.BlockRegistry;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class GraphOrder {
  private GraphOrder() {}

  public static List<FlowNode> orderedNodesFromGraph(FlowGraph graph) {
    FlowNode source =
        graph.nodes.stream()
            .filter(n -> BlockRegistry.getBlock(n.blockType).map(b -> b.category == BlockCategory.SOURCE).orElse(false))
            .findFirst()
            .orElse(null);
    if (source == null) return List.of();

    Map<String, List<String>> adj = new HashMap<>();
    for (FlowNode n : graph.nodes) adj.put(n.id, new ArrayList<>());
    for (var e : graph.edges) adj.computeIfAbsent(e.source, k -> new ArrayList<>()).add(e.target);

    Map<String, FlowNode> nodeMap = new HashMap<>();
    for (FlowNode n : graph.nodes) nodeMap.put(n.id, n);

    List<FlowNode> ordered = new ArrayList<>();
    Set<String> visited = new HashSet<>();
    dfs(source.id, adj, nodeMap, visited, ordered);
    return ordered;
  }

  private static void dfs(
      String id,
      Map<String, List<String>> adj,
      Map<String, FlowNode> nodeMap,
      Set<String> visited,
      List<FlowNode> ordered) {
    if (visited.contains(id)) return;
    visited.add(id);
    FlowNode node = nodeMap.get(id);
    if (node != null) ordered.add(node);
    for (String child : adj.getOrDefault(id, List.of())) dfs(child, adj, nodeMap, visited, ordered);
  }
}
