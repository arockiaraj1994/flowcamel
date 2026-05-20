package com.flowcamel.generator;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.flowcamel.core.model.FlowEdge;
import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.FlowNode;
import com.flowcamel.core.model.NodePosition;
import com.flowcamel.core.model.ProjectMeta;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ProjectZipGeneratorTest {
  @Test
  void generatesZip() throws Exception {
    FlowNode timer = new FlowNode();
    timer.id = "t1";
    timer.blockType = "timer-source";
    timer.label = "Timer";
    timer.position = new NodePosition(0, 0);
    timer.props = new LinkedHashMap<>(Map.of("period", "1000", "timerName", "tick"));

    FlowNode log = new FlowNode();
    log.id = "l1";
    log.blockType = "log-dest";
    log.label = "Logger";
    log.position = new NodePosition(200, 0);
    log.props = new LinkedHashMap<>(Map.of("loggerName", "flowcamel", "level", "INFO"));

    FlowGraph graph = new FlowGraph();
    graph.id = "g1";
    graph.name = "demo-flow";
    graph.nodes = List.of(timer, log);
    graph.edges = List.of(edge("e1", "t1", "l1"));

    ProjectMeta meta = new ProjectMeta();
    meta.name = "demo-flow";

    byte[] zip = ProjectZipGenerator.generate(graph, meta);
    assertTrue(zip.length > 1000);
  }

  private static FlowEdge edge(String id, String source, String target) {
    FlowEdge e = new FlowEdge();
    e.id = id;
    e.source = source;
    e.target = target;
    return e;
  }
}
