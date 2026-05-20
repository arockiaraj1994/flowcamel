package com.flowcamel.core.yaml;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
    FlowGraph graph = new FlowGraph();
    graph.id = "test-project";
    graph.name = "test";
    graph.nodes =
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
                    "subject", "done")));
    graph.edges = List.of(edge("e1", "s1", "a1"), edge("e2", "a1", "d1"));

    String yaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    assertFalse(yaml.isBlank());
    assertTrue(yaml.contains("route:"));
    assertTrue(yaml.contains("from:"));
    assertTrue(yaml.contains("steps:"));
    assertTrue(yaml.contains("log:"));
    assertTrue(yaml.contains("tick"));
    // List items must be indented under `steps:` or Camel JBang YAML parser fails.
    assertTrue(yaml.contains("steps:\n          - log:"), yaml);
  }

  @Test
  void setBodyActionEmitsSetBodyStep() {
    FlowGraph graph = new FlowGraph();
    graph.nodes =
        List.of(
            node("s1", "timer-source", "Timer", Map.of("period", "1s")),
            node(
                "b1",
                "set-body-action",
                "Set body",
                Map.of("language", "constant", "expression", "Hello from FlowCamel")));
    graph.edges = List.of(edge("e1", "s1", "b1"));

    String yaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    assertTrue(yaml.contains("setBody:"), yaml);
    assertTrue(yaml.contains("constant: Hello from FlowCamel"), yaml);
  }

  @Test
  void logDestUsesFullLoggerUri() {
    FlowGraph graph = new FlowGraph();
    graph.nodes =
        List.of(
            node("s1", "timer-source", "Timer", Map.of("period", "1s")),
            node("d1", "log-dest", "Logger", Map.of("level", "INFO")));
    graph.edges = List.of(edge("e1", "s1", "d1"));

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
    FlowGraph graph = new FlowGraph();
    graph.nodes =
        List.of(
            node("s1", "timer-source", "Timer", Map.of("period", "1s")),
            node("a1", "log-action", "Log", Map.of("message", message)));
    graph.edges = List.of(edge("e1", "s1", "a1"));
    String yaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    assertTrue(yaml.contains("log:"));
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
