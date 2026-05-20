package com.flowcamel.core.graph;

import com.flowcamel.core.model.BlockCategory;
import com.flowcamel.core.model.BlockDefinition;
import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.FlowNode;
import com.flowcamel.core.model.PropSchema;
import com.flowcamel.core.model.ValidationResult;
import com.flowcamel.core.properties.ComponentProperties;
import com.flowcamel.core.registry.BlockRegistry;
import com.flowcamel.core.uri.UriBuilder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class GraphValidator {
  private GraphValidator() {}

  public static ValidationResult validateForYamlExport(FlowGraph graph) {
    ValidationResult base = validate(graph);
    List<String> errors = new ArrayList<>(base.errors());

    for (FlowNode node : graph.nodes) {
      BlockDefinition block = BlockRegistry.getBlock(node.blockType).orElse(null);
      if (block == null) {
        errors.add("Unknown block type \"" + node.blockType + "\" on \"" + node.label + "\".");
        continue;
      }
      Map<String, String> props = ComponentProperties.resolveNodeProps(node.blockType, node.props);
      for (PropSchema schema : ComponentProperties.getWizardSteps(node.blockType)) {
        if (!schema.required) continue;
        if (ComponentProperties.resolvePropValue(props, schema).isEmpty()) {
          errors.add(
              "\"" + node.label + "\" (" + block.label + "): missing \"" + (schema.label != null ? schema.label : schema.key) + "\".");
        }
      }
      boolean needsUri =
          block.category == BlockCategory.SOURCE
              || block.category == BlockCategory.DESTINATION
              || (block.camelUri != null && !block.camelUri.isEmpty());
      if (needsUri && UriBuilder.buildEndpointUri(node.blockType, props).isEmpty()) {
        errors.add("\"" + node.label + "\" (" + block.label + "): endpoint URI could not be built — check required settings.");
      }
      if (block.category == BlockCategory.ACTION) {
        if ("filter-action".equals(node.blockType) && props.getOrDefault("expression", "").trim().isEmpty()) {
          errors.add("\"" + node.label + "\" (Filter): missing filter expression.");
        }
        if ("transform-action".equals(node.blockType) && props.getOrDefault("expression", "").trim().isEmpty()) {
          errors.add("\"" + node.label + "\" (Transform): missing expression.");
        }
      }
    }
    return new ValidationResult(errors.isEmpty(), errors);
  }

  public static ValidationResult validate(FlowGraph graph) {
    List<String> errors = new ArrayList<>();
    long sources =
        graph.nodes.stream()
            .filter(n -> BlockRegistry.getBlock(n.blockType).map(b -> b.category == BlockCategory.SOURCE).orElse(false))
            .count();
    long dests =
        graph.nodes.stream()
            .filter(
                n ->
                    BlockRegistry.getBlock(n.blockType)
                        .map(b -> b.category == BlockCategory.DESTINATION)
                        .orElse(false))
            .count();
    if (sources == 0) errors.add("Flow must have at least one source block.");
    if (dests == 0) errors.add("Flow must have at least one destination block.");

    Map<String, Integer> incoming = new HashMap<>();
    Map<String, Integer> outgoing = new HashMap<>();
    for (FlowNode n : graph.nodes) {
      incoming.put(n.id, 0);
      outgoing.put(n.id, 0);
    }
    for (var e : graph.edges) {
      outgoing.merge(e.source, 1, Integer::sum);
      incoming.merge(e.target, 1, Integer::sum);
    }

    for (FlowNode node : graph.nodes) {
      BlockCategory cat = BlockRegistry.getBlock(node.blockType).map(b -> b.category).orElse(null);
      int inc = incoming.getOrDefault(node.id, 0);
      int out = outgoing.getOrDefault(node.id, 0);
      if (cat == BlockCategory.SOURCE && inc > 0) {
        errors.add("Source block \"" + node.label + "\" must not have incoming connections.");
      }
      if (cat == BlockCategory.DESTINATION && out > 0) {
        errors.add("Destination block \"" + node.label + "\" must not have outgoing connections.");
      }
      if (cat != BlockCategory.SOURCE && inc == 0) {
        errors.add("Block \"" + node.label + "\" has no incoming connection.");
      }
      if (cat != BlockCategory.DESTINATION && out == 0) {
        errors.add("Block \"" + node.label + "\" has no outgoing connection.");
      }
    }
    if (hasCycle(graph)) errors.add("Flow contains a cycle, which is not allowed.");
    return new ValidationResult(errors.isEmpty(), errors);
  }

  private static boolean hasCycle(FlowGraph graph) {
    Map<String, List<String>> adj = new HashMap<>();
    for (FlowNode n : graph.nodes) adj.put(n.id, new ArrayList<>());
    for (var e : graph.edges) adj.computeIfAbsent(e.source, k -> new ArrayList<>()).add(e.target);

    Map<String, Integer> color = new HashMap<>();
    for (FlowNode n : graph.nodes) color.put(n.id, 0);

    for (FlowNode n : graph.nodes) {
      if (color.get(n.id) == 0 && dfsCycle(n.id, adj, color)) return true;
    }
    return false;
  }

  private static boolean dfsCycle(String id, Map<String, List<String>> adj, Map<String, Integer> color) {
    color.put(id, 1);
    for (String neighbor : adj.getOrDefault(id, List.of())) {
      if (color.get(neighbor) == 1) return true;
      if (color.get(neighbor) == 0 && dfsCycle(neighbor, adj, color)) return true;
    }
    color.put(id, 2);
    return false;
  }
}
