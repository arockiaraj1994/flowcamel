package com.flowcamel.generator;

import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.ProjectMeta;
import com.flowcamel.core.registry.BlockRegistry;
import com.flowcamel.core.registry.CatalogRegistry;
import com.flowcamel.core.yaml.RouteYamlEmitter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public final class ProjectZipGenerator {
  private ProjectZipGenerator() {}

  public static byte[] generate(FlowGraph graph, ProjectMeta meta) throws IOException {
    String projectName = meta.name;
    String artifactId = projectName.toLowerCase().replaceAll("[^a-z0-9-]", "-");
    String packageName = artifactId.replace("-", "");

    boolean hasKafka =
        graph.nodes.stream().anyMatch(n -> "kafka-source".equals(n.blockType) || "kafka-dest".equals(n.blockType));
    boolean hasActiveMQ =
        graph.nodes.stream().anyMatch(n -> "jms-source".equals(n.blockType) || "jms-dest".equals(n.blockType));

    Set<String> deps = new LinkedHashSet<>();
    for (var node : graph.nodes) {
      String starter = CatalogRegistry.getMavenStarter(node.blockType);
      if (starter != null) deps.add(starter);
    }

    Map<String, Object> pomCtx = new HashMap<>();
    pomCtx.put("projectName", projectName);
    pomCtx.put("artifactId", artifactId);
    pomCtx.put("packageName", packageName);
    pomCtx.put("dependencies", deps.stream().toList());

    String pomXml = TemplateRenderer.render("pom.xml.hbs", pomCtx);
    String routesYaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    String appYml = buildConfig(graph, projectName);
    String readme = TemplateRenderer.render("README.md.hbs", Map.of(
        "projectName", projectName,
        "artifactId", artifactId,
        "camelVersion", "4.5.0"));

    Map<String, Object> appCtx = Map.of("packageName", packageName);
    String appJava = TemplateRenderer.render("Application.java.hbs", appCtx);

    Map<String, Object> dockerCtx = new HashMap<>();
    dockerCtx.put("artifactId", artifactId);
    dockerCtx.put("includeKafka", hasKafka);
    dockerCtx.put("includeActiveMQ", hasActiveMQ);
    String dockerCompose = TemplateRenderer.render("docker-compose.yml.hbs", dockerCtx);

    String srcBase = "src/main/java/com/flowcamel/" + packageName;

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    try (ZipOutputStream zip = new ZipOutputStream(baos)) {
      putText(zip, "README.md", readme);
      putText(zip, "pom.xml", pomXml);
      appendMavenWrapper(zip);
      putText(zip, "src/main/resources/application.yml", appYml);
      putText(zip, "src/main/resources/camel/routes.camel.yaml", routesYaml);
      putText(zip, srcBase + "/Application.java", appJava);
      putText(zip, "docker-compose.yml", dockerCompose);
    }
    return baos.toByteArray();
  }

  private static String buildConfig(FlowGraph graph, String projectName) throws IOException {
    StringBuilder lines = new StringBuilder();
    for (var node : graph.nodes) {
      var block = BlockRegistry.getBlock(node.blockType).orElse(null);
      if (block == null || node.props == null || node.props.isEmpty()) continue;
      String prefix = node.blockType.replace('-', '.');
      for (var e : node.props.entrySet()) {
        if (e.getValue() != null && !e.getValue().isEmpty()) {
          lines.append("  ").append(prefix).append('.').append(e.getKey()).append(": ").append(e.getValue()).append('\n');
        }
      }
    }
    Map<String, Object> ctx = new HashMap<>();
    ctx.put("projectName", projectName);
    if (!lines.isEmpty()) {
      ctx.put("config", "# Generated node properties\n" + lines);
    }
    return TemplateRenderer.render("application.yml.hbs", ctx);
  }

  private static void putText(ZipOutputStream zip, String name, String content) throws IOException {
    ZipEntry entry = new ZipEntry(name);
    zip.putNextEntry(entry);
    zip.write(content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    zip.closeEntry();
  }

  private static void appendMavenWrapper(ZipOutputStream zip) throws IOException {
    addResourceFile(zip, "mvnw", "maven-wrapper/mvnw");
    addResourceFile(zip, "mvnw.cmd", "maven-wrapper/mvnw.cmd");
    addResourceFile(zip, ".mvn/wrapper/maven-wrapper.properties", "maven-wrapper/.mvn/wrapper/maven-wrapper.properties");
  }

  private static void addResourceFile(ZipOutputStream zip, String zipPath, String resource) throws IOException {
    try (InputStream in = ProjectZipGenerator.class.getClassLoader().getResourceAsStream(resource)) {
      if (in == null) throw new IOException("Missing resource: " + resource);
      ZipEntry entry = new ZipEntry(zipPath);
      zip.putNextEntry(entry);
      in.transferTo(zip);
      zip.closeEntry();
    }
  }
}
