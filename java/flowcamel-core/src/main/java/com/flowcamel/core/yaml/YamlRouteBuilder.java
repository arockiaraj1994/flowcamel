package com.flowcamel.core.yaml;

import com.flowcamel.core.config.ConfigRefs;
import com.flowcamel.core.graph.GraphNormalizer;
import com.flowcamel.core.graph.GraphOrder;
import com.flowcamel.core.model.BlockCategory;
import com.flowcamel.core.model.BlockDefinition;
import com.flowcamel.core.model.FlowDefinition;
import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.FlowNode;
import com.flowcamel.core.registry.BlockRegistry;
import com.flowcamel.core.registry.CatalogRegistry;
import com.flowcamel.core.uri.UriBuilder;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class YamlRouteBuilder {
  private YamlRouteBuilder() {}

  public static List<Map<String, Object>> buildAllYamlRoutes(FlowGraph graph) {
    List<Map<String, Object>> routes = new ArrayList<>();
    for (FlowDefinition flow : GraphNormalizer.getFlows(graph)) {
      Map<String, Object> route = buildYamlRouteFromFlow(flow);
      if (route != null) routes.add(route);
    }
    return routes;
  }

  public static Map<String, Object> buildYamlRoute(FlowGraph graph) {
    List<Map<String, Object>> all = buildAllYamlRoutes(graph);
    return all.isEmpty() ? null : all.getFirst();
  }

  @SuppressWarnings("unchecked")
  public static Map<String, Object> buildYamlRouteFromFlow(FlowDefinition flow) {
    List<FlowNode> ordered = GraphOrder.orderedNodesFromFlow(flow);
    if (ordered.isEmpty()) return null;

    String routeId =
        flow.routeId != null && !flow.routeId.isBlank() ? flow.routeId.trim() : "flow-1";
    FlowNode source = ordered.getFirst();
    List<Map<String, Object>> steps = new ArrayList<>();
    for (int i = 1; i < ordered.size(); i++) {
      steps.addAll(emitYamlStep(ordered.get(i), false));
    }

    Map<String, Object> from = toYamlEndpoint(source.blockType, source.props);
    from.put("steps", steps);

    Map<String, Object> route = new LinkedHashMap<>();
    route.put("id", routeId);
    route.put("from", from);

    Map<String, Object> wrapper = new LinkedHashMap<>();
    wrapper.put("route", route);
    return wrapper;
  }

  private static List<Map<String, Object>> emitYamlStep(FlowNode node, boolean isFirst) {
    if (isFirst) return List.of();
    BlockDefinition block = BlockRegistry.getBlock(node.blockType).orElse(null);
    if (block == null) return List.of();

    String endpointUri = UriBuilder.buildEndpointUri(node.blockType, node.props);
    Optional<String> eip = CatalogRegistry.getEipType(node.blockType);
    if (eip.isPresent()) return emitYamlEipStep(eip.get(), node.blockType, node.props);
    if (block.category == BlockCategory.DESTINATION || !endpointUri.isEmpty()) {
      return List.of(Map.of("to", toYamlEndpoint(node.blockType, node.props)));
    }
    return List.of();
  }

  private static List<Map<String, Object>> emitYamlEipStep(
      String eipId, String blockType, Map<String, String> props) {
    return switch (eipId) {
      case "filter" ->
          List.of(
              Map.of(
                  "filter",
                  Map.of(
                      "expression",
                      Map.of(
                          "simple",
                          ConfigRefs.resolvePropForEmit(props.get("expression")).isEmpty()
                              ? "true"
                              : ConfigRefs.resolvePropForEmit(props.get("expression"))))));
      case "log" -> List.of(Map.of("log", Map.of("message", props.getOrDefault("message", "${body}"))));
      case "transform" -> {
        String lang = props.getOrDefault("language", "simple");
        String expr = ConfigRefs.resolvePropForEmit(props.get("expression"));
        yield List.of(Map.of("transform", Map.of(lang, expr.isEmpty() ? "${body}" : expr)));
      }
      case "set-body" -> {
        String lang = props.getOrDefault("language", "simple");
        String expr = ConfigRefs.resolvePropForEmit(props.get("expression"));
        yield List.of(Map.of("setBody", Map.of(lang, expr.isEmpty() ? "${body}" : expr)));
      }
      case "call-flow" -> {
        String target = props.getOrDefault("targetRouteId", "").trim();
        if (target.isEmpty()) yield List.of();
        yield List.of(Map.of("to", Map.of("uri", "direct:" + target)));
      }
      case "split" -> {
        String delimiter = props.get("delimiter");
        if ("json-array".equals(delimiter) || "array".equals(delimiter)) {
          yield List.of(Map.of("split", Map.of("jsonpath", "$[*]")));
        }
        if ("comma".equals(delimiter)) yield List.of(Map.of("split", Map.of("tokenize", ",")));
        yield List.of(Map.of("split", Map.of("tokenize", "\\n")));
      }
      case "json-xml" -> {
        if ("xml-to-json".equals(props.get("direction"))) {
          yield List.of(Map.of("unmarshal", Map.of("jacksonXml", Map.of())), Map.of("marshal", Map.of("json", Map.of())));
        }
        yield List.of(Map.of("unmarshal", Map.of("json", Map.of())), Map.of("marshal", Map.of("jacksonXml", Map.of())));
      }
      case "to-uri" -> List.of(Map.of("to", toYamlEndpoint(blockType, props)));
      default -> {
        String uri = UriBuilder.buildEndpointUri(blockType, props);
        yield uri.isEmpty() ? List.of() : List.of(Map.of("to", toYamlEndpoint(blockType, props)));
      }
    };
  }

  private static Map<String, Object> toYamlEndpoint(String blockType, Map<String, String> props) {
    Map<String, Object> ep = new LinkedHashMap<>();
    ep.put("uri", UriBuilder.buildEndpointUri(blockType, props));
    return ep;
  }
}
