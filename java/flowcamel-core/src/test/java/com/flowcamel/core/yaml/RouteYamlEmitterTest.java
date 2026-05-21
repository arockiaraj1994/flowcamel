package com.flowcamel.core.yaml;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.flowcamel.core.model.FlowDefinition;
import com.flowcamel.core.model.FlowEdge;
import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.FlowNode;
import com.flowcamel.core.model.NodePosition;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;

class RouteYamlEmitterTest {

  @Test
  void emitsRouteWithFromAndSteps() {
    FlowGraph graph =
        graphWithNodes(
            List.of(
                node("s1", "timer-source", "Timer", Map.of("period", "1m")),
                node("a1", "log-action", "Log", Map.of("message", "tick")),
                node(
                    "d1",
                    "email-dest",
                    "Email",
                    Map.of(
                        "host", "smtp.example.com",
                        "port", "587",
                        "username", "u",
                        "password", "p",
                        "to", "ops@example.com",
                        "subject", "done"))),
            List.of(edge("e1", "s1", "a1"), edge("e2", "a1", "d1")));

    String yaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    assertFalse(yaml.isBlank());
    assertTrue(yaml.contains("route:"));
    assertTrue(yaml.contains("from:"));
    assertTrue(yaml.contains("steps:"));
    assertTrue(yaml.contains("log:"));
    assertTrue(yaml.contains("tick"));
    assertTrue(yaml.contains("steps:\n          - log:"), yaml);
  }

  @Test
  void emitsMultipleRoutes() {
    FlowGraph graph = new FlowGraph();
    FlowDefinition f1 = flow("f1", "Flow 1", "flow-1");
    f1.nodes = List.of(node("s1", "timer-source", "T", Map.of("period", "1s")));
    f1.edges = List.of();

    FlowDefinition f2 = flow("f2", "Flow 2", "flow-2");
    f2.nodes =
        List.of(
            node("s2", "timer-source", "T2", Map.of("period", "2s")),
            node("d2", "log-dest", "Log", Map.of("loggerName", "flowcamel", "level", "INFO")));
    f2.edges = List.of(edge("e1", "s2", "d2"));

    graph.flows = List.of(f1, f2);
    String yaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    assertTrue(yaml.contains("id: flow-1"), yaml);
    assertTrue(yaml.contains("id: flow-2"), yaml);
  }

  @Test
  void callFlowEmitsDirectUri() {
    FlowGraph graph = new FlowGraph();
    FlowDefinition f1 = flow("f1", "Flow 1", "flow-1");
    f1.nodes =
        List.of(
            node("s1", "timer-source", "T", Map.of("period", "1s")),
            node("c1", "call-flow-action", "Call", Map.of("targetRouteId", "flow-2")));
    f1.edges = List.of(edge("e1", "s1", "c1"));

    FlowDefinition f2 = flow("f2", "Flow 2", "flow-2");
    f2.nodes =
        List.of(
            node("s2", "timer-source", "T2", Map.of("period", "2s")),
            node("d2", "log-dest", "Log", Map.of("loggerName", "flowcamel", "level", "INFO")));
    f2.edges = List.of(edge("e2", "s2", "d2"));

    graph.flows = List.of(f1, f2);
    String yaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    assertTrue(yaml.contains("uri: direct:flow-2"), yaml);
  }

  @Test
  void setBodyActionEmitsSetBodyStep() {
    FlowGraph graph =
        graphWithNodes(
            List.of(
                node("s1", "timer-source", "Timer", Map.of("period", "1s")),
                node(
                    "b1",
                    "set-body-action",
                    "Set body",
                    Map.of("language", "constant", "expression", "Hello from FlowCamel"))),
            List.of(edge("e1", "s1", "b1")));

    String yaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    assertTrue(yaml.contains("setBody:"), yaml);
    assertTrue(yaml.contains("constant: Hello from FlowCamel"), yaml);
  }

  @Test
  void logDestUsesFullLoggerUri() {
    FlowGraph graph =
        graphWithNodes(
            List.of(
                node("s1", "timer-source", "Timer", Map.of("period", "1s")),
                node("d1", "log-dest", "Logger", Map.of("level", "INFO"))),
            List.of(edge("e1", "s1", "d1")));

    String yaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    assertTrue(yaml.contains("uri: log:flowcamel"), yaml);
    assertFalse(yaml.contains("uri: log\n") || yaml.matches("(?s).*uri: log\\s*$"), yaml);
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "line1\nline2",
        "  leading space",
        "line1\n  indented line2",
        "${body}",
        "true && ${header.foo} == 'bar'",
        "\\n"
      })
  void dumpsLogMessageWithoutSnakeYamlIndentError(String message) {
    FlowGraph graph =
        graphWithNodes(
            List.of(
                node("s1", "timer-source", "Timer", Map.of("period", "1s")),
                node("a1", "log-action", "Log", Map.of("message", message))),
            List.of(edge("e1", "s1", "a1")));
    String yaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    assertTrue(yaml.contains("log:"));
  }

  private static FlowGraph graphWithNodes(List<FlowNode> nodes, List<FlowEdge> edges) {
    FlowGraph g = new FlowGraph();
    FlowDefinition f = flow("f1", "Flow 1", "flow-1");
    f.nodes = nodes;
    f.edges = edges;
    g.flows = List.of(f);
    return g;
  }

  private static FlowDefinition flow(String id, String name, String routeId) {
    FlowDefinition f = new FlowDefinition();
    f.id = id;
    f.name = name;
    f.routeId = routeId;
    return f;
  }

  private static FlowEdge edge(String id, String source, String target) {
    FlowEdge e = new FlowEdge();
    e.id = id;
    e.source = source;
    e.target = target;
    return e;
  }

  private static FlowNode node(String id, String blockType, String label, Map<String, String> props) {
    FlowNode n = new FlowNode();
    n.id = id;
    n.blockType = blockType;
    n.label = label;
    n.position = new NodePosition(0, 0);
    n.props = new LinkedHashMap<>(props);
    return n;
  }
}
