package com.flowcamel.core.graph;

import com.flowcamel.core.config.ApplicationConfigEmitter;
import com.flowcamel.core.config.ConfigRefs;
import com.flowcamel.core.model.BlockCategory;
import com.flowcamel.core.model.BlockDefinition;
import com.flowcamel.core.model.FlowDefinition;
import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.FlowNode;
import com.flowcamel.core.model.PropSchema;
import com.flowcamel.core.model.ValidationResult;
import com.flowcamel.core.properties.ComponentProperties;
import com.flowcamel.core.registry.BlockRegistry;
import com.flowcamel.core.uri.UriBuilder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class GraphValidator {
  private GraphValidator() {}

  public static ValidationResult validateForYamlExport(FlowGraph graph) {
    graph = GraphNormalizer.normalize(graph);
    List<String> errors = new ArrayList<>();
    List<FlowDefinition> flows = graph.flows;

    Map<String, Integer> routeCounts = new HashMap<>();
    Set<String> routeIds = new HashSet<>();
    for (FlowDefinition f : flows) {
      if (f.routeId != null && !f.routeId.isBlank()) {
        routeCounts.merge(f.routeId.trim(), 1, Integer::sum);
        routeIds.add(f.routeId.trim());
      }
    }
    for (var e : routeCounts.entrySet()) {
      if (e.getValue() > 1) errors.add("Duplicate route id \"" + e.getKey() + "\" across flows.");
    }

    boolean anyNodes = false;
    for (FlowDefinition flow : flows) {
      if (flow.nodes == null || flow.nodes.isEmpty()) continue;
      anyNodes = true;
      errors.addAll(validateFlowForYaml(flow, graph, routeIds));
    }
    if (!anyNodes) errors.add("Project has no blocks in any flow.");

    return new ValidationResult(errors.isEmpty(), errors);
  }

  public static ValidationResult validate(FlowGraph graph) {
    graph = GraphNormalizer.normalize(graph);
    List<String> errors = new ArrayList<>();
    Set<String> routeIds = new HashSet<>();
    for (FlowDefinition f : graph.flows) {
      if (f.routeId != null) routeIds.add(f.routeId.trim());
    }
    boolean anyNodes = false;
    for (FlowDefinition flow : graph.flows) {
      if (flow.nodes == null || flow.nodes.isEmpty()) continue;
      anyNodes = true;
      errors.addAll(validateFlow(flow, routeIds));
    }
    if (!anyNodes) errors.add("Add at least one block to a flow.");
    return new ValidationResult(errors.isEmpty(), errors);
  }

  private static List<String> validateFlow(FlowDefinition flow, Set<String> routeIds) {
    List<String> errors = new ArrayList<>();
    String prefix = "[" + flow.name + "] ";

    long sources =
        flow.nodes.stream()
            .filter(n -> BlockRegistry.getBlock(n.blockType).map(b -> b.category == BlockCategory.SOURCE).orElse(false))
            .count();
    boolean hasCallFlow = flow.nodes.stream().anyMatch(n -> "call-flow-action".equals(n.blockType));
    long dests =
        flow.nodes.stream()
            .filter(
                n ->
                    BlockRegistry.getBlock(n.blockType)
                        .map(b -> b.category == BlockCategory.DESTINATION)
                        .orElse(false))
            .count();

    if (!flow.nodes.isEmpty() && sources == 0) {
      errors.add(prefix + "Flow must have at least one source block.");
    }
    if (!flow.nodes.isEmpty() && dests == 0 && !hasCallFlow) {
      errors.add(prefix + "Flow must have a destination or a Call flow block.");
    }

    Map<String, Integer> incoming = new HashMap<>();
    Map<String, Integer> outgoing = new HashMap<>();
    for (FlowNode n : flow.nodes) {
      incoming.put(n.id, 0);
      outgoing.put(n.id, 0);
    }
    for (var e : flow.edges) {
      outgoing.merge(e.source, 1, Integer::sum);
      incoming.merge(e.target, 1, Integer::sum);
    }

    for (FlowNode node : flow.nodes) {
      BlockCategory cat = BlockRegistry.getBlock(node.blockType).map(b -> b.category).orElse(null);
      int inc = incoming.getOrDefault(node.id, 0);
      int out = outgoing.getOrDefault(node.id, 0);
      if (cat == BlockCategory.SOURCE && inc > 0) {
        errors.add(prefix + "Source block \"" + node.label + "\" must not have incoming connections.");
      }
      if (cat == BlockCategory.DESTINATION && out > 0) {
        errors.add(prefix + "Destination block \"" + node.label + "\" must not have outgoing connections.");
      }
      if (cat != BlockCategory.SOURCE && inc == 0) {
        errors.add(prefix + "Block \"" + node.label + "\" has no incoming connection.");
      }
      if (cat != BlockCategory.DESTINATION && cat != BlockCategory.ACTION && out == 0) {
        errors.add(prefix + "Block \"" + node.label + "\" has no outgoing connection.");
      }
      if ("call-flow-action".equals(node.blockType) && out > 0) {
        errors.add(prefix + "\"" + node.label + "\" (Call flow) must not have outgoing connections.");
      }
    }
    if (hasCycle(flow)) errors.add(prefix + "Flow contains a cycle, which is not allowed.");
    return errors;
  }

  private static List<String> validateFlowForYaml(
      FlowDefinition flow, FlowGraph graph, Set<String> routeIds) {
    List<String> errors = new ArrayList<>(validateFlow(flow, routeIds));
    String prefix = "[" + flow.name + "] ";

    for (FlowNode node : flow.nodes) {
      BlockDefinition block = BlockRegistry.getBlock(node.blockType).orElse(null);
      if (block == null) {
        errors.add(prefix + "Unknown block type \"" + node.blockType + "\" on \"" + node.label + "\".");
        continue;
      }
      Map<String, String> props = ComponentProperties.resolveNodeProps(node.blockType, node.props);
      for (PropSchema schema : ComponentProperties.getWizardSteps(node.blockType)) {
        if (!schema.required) continue;
        if (ComponentProperties.resolvePropValue(props, schema).isEmpty()) {
          errors.add(
              prefix
                  + "\""
                  + node.label
                  + "\" ("
                  + block.label
                  + "): missing \""
                  + (schema.label != null ? schema.label : schema.key)
                  + "\".");
        }
      }
      if ("call-flow-action".equals(node.blockType)) {
        String target = props.getOrDefault("targetRouteId", "").trim();
        if (target.isEmpty()) {
          errors.add(prefix + "\"" + node.label + "\" (Call flow): select a target flow.");
        } else if (target.equals(flow.routeId)) {
          errors.add(prefix + "\"" + node.label + "\" (Call flow): cannot call the same flow.");
        } else if (!routeIds.contains(target)) {
          errors.add(prefix + "\"" + node.label + "\" (Call flow): unknown route \"" + target + "\".");
        }
      }
      boolean needsUri =
          block.category == BlockCategory.SOURCE
              || block.category == BlockCategory.DESTINATION
              || (block.camelUri != null && !block.camelUri.isEmpty());
      if (needsUri
          && !"call-flow-action".equals(node.blockType)
          && UriBuilder.buildEndpointUri(node.blockType, props).isEmpty()) {
        errors.add(
            prefix
                + "\""
                + node.label
                + "\" ("
                + block.label
                + "): endpoint URI could not be built — check required settings.");
      }
      if (block.category == BlockCategory.ACTION) {
        String expression = props.get("expression");
        if ("filter-action".equals(node.blockType)
            && (expression == null || expression.trim().isEmpty())
            && !ConfigRefs.isConfigRef(expression)) {
          errors.add(prefix + "\"" + node.label + "\" (Filter): missing filter expression.");
        }
        if ("transform-action".equals(node.blockType)
            && (expression == null || expression.trim().isEmpty())
            && !ConfigRefs.isConfigRef(expression)) {
          errors.add(prefix + "\"" + node.label + "\" (Transform): missing expression.");
        }
        if (node.props != null) {
          for (var e : node.props.entrySet()) {
            if (ConfigRefs.isConfigRef(e.getValue())) {
              String cfgKey = ConfigRefs.configRefKey(e.getValue());
              if (!ApplicationConfigEmitter.configKeyExists(graph.config, cfgKey)) {
                errors.add(
                    prefix
                        + "\""
                        + node.label
                        + "\": property \""
                        + e.getKey()
                        + "\" references unknown config key \""
                        + cfgKey
                        + "\".");
              }
            }
          }
        }
      }
    }
    return errors;
  }

  private static boolean hasCycle(FlowDefinition flow) {
    Map<String, List<String>> adj = new HashMap<>();
    for (FlowNode n : flow.nodes) adj.put(n.id, new ArrayList<>());
    for (var e : flow.edges) adj.computeIfAbsent(e.source, k -> new ArrayList<>()).add(e.target);

    Map<String, Integer> color = new HashMap<>();
    for (FlowNode n : flow.nodes) color.put(n.id, 0);

    for (FlowNode n : flow.nodes) {
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
