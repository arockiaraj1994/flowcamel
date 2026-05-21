package com.flowcamel.generator;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.flowcamel.core.model.ConfigEntry;
import com.flowcamel.core.model.ConfigProfile;
import com.flowcamel.core.model.FlowDefinition;
import com.flowcamel.core.model.FlowEdge;
import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.FlowNode;
import com.flowcamel.core.model.NodePosition;
import com.flowcamel.core.model.ProjectConfig;
import com.flowcamel.core.model.ProjectMeta;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipInputStream;
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
    FlowDefinition flow = new FlowDefinition();
    flow.id = "f1";
    flow.name = "Flow 1";
    flow.routeId = "flow-1";
    flow.nodes = List.of(timer, log);
    flow.edges = List.of(edge("e1", "t1", "l1"));
    graph.flows = List.of(flow);

    ProjectMeta meta = new ProjectMeta();
    meta.name = "demo-flow";

    byte[] zip = ProjectZipGenerator.generate(graph, meta);
    assertTrue(zip.length > 1000);
  }

  @Test
  void zipContainsApplicationConfigNotNodeProps() throws Exception {
    FlowNode sftp = new FlowNode();
    sftp.id = "s1";
    sftp.blockType = "sftp-source";
    sftp.label = "SFTP";
    sftp.position = new NodePosition(0, 0);
    sftp.props =
        new LinkedHashMap<>(
            Map.of(
                "host",
                "@config:sftp.host",
                "username",
                "@config:sftp.username",
                "password",
                "@config:sftp.password",
                "folder",
                "/inbox"));

    FlowNode log = new FlowNode();
    log.id = "l1";
    log.blockType = "log-dest";
    log.label = "Logger";
    log.position = new NodePosition(200, 0);
    log.props = new LinkedHashMap<>(Map.of("loggerName", "flowcamel", "level", "INFO"));

    ProjectConfig config = new ProjectConfig();
    ConfigEntry host = new ConfigEntry();
    host.key = "sftp.host";
    host.value = "files.example.com";
    ConfigEntry pass = new ConfigEntry();
    pass.key = "sftp.password";
    pass.value = "local-dev";
    pass.secret = true;
    ConfigEntry user = new ConfigEntry();
    user.key = "sftp.username";
    user.value = "flowuser";
    config.defaultEntries = List.of(host, user, pass);
    config.exportProfiles = List.of("dev");
    ConfigProfile dev = new ConfigProfile();
    dev.name = "dev";
    ConfigEntry devHost = new ConfigEntry();
    devHost.key = "sftp.host";
    devHost.value = "localhost";
    dev.entries = List.of(devHost);
    config.profiles = List.of(dev);

    FlowGraph graph = new FlowGraph();
    graph.id = "g2";
    graph.name = "config-flow";
    FlowDefinition flow = new FlowDefinition();
    flow.id = "f1";
    flow.name = "Flow 1";
    flow.routeId = "flow-1";
    flow.nodes = List.of(sftp, log);
    flow.edges = List.of(edge("e1", "s1", "l1"));
    graph.flows = List.of(flow);
    graph.config = config;

    ProjectMeta meta = new ProjectMeta();
    meta.name = "config-flow";

    byte[] zip = ProjectZipGenerator.generate(graph, meta);
    String appYml = readZipEntry(zip, "src/main/resources/application.yml");
    assertTrue(appYml.contains("sftp:"));
    assertTrue(appYml.contains("host: files.example.com"));
    assertTrue(appYml.contains("password: ${sftp.password}"));
    assertTrue(!appYml.contains("local-dev"));
    assertTrue(readZipEntry(zip, "src/main/resources/application-dev.yml").contains("localhost"));
  }

  private static String readZipEntry(byte[] zipBytes, String name) throws Exception {
    try (ZipInputStream zis = new ZipInputStream(new java.io.ByteArrayInputStream(zipBytes))) {
      java.util.zip.ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        if (name.equals(entry.getName())) {
          return new String(zis.readAllBytes(), StandardCharsets.UTF_8);
        }
      }
    }
    throw new AssertionError("Missing zip entry: " + name);
  }

  private static FlowEdge edge(String id, String source, String target) {
    FlowEdge e = new FlowEdge();
    e.id = id;
    e.source = source;
    e.target = target;
    return e;
  }
}
