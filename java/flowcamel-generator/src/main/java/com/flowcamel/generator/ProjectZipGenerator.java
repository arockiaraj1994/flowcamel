package com.flowcamel.generator;

import com.flowcamel.core.config.ApplicationConfigEmitter;
import com.flowcamel.core.graph.GraphValidator;
import com.flowcamel.core.model.ConfigProfile;
import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.ProjectConfig;
import com.flowcamel.core.model.ProjectMeta;
import com.flowcamel.core.model.ValidationResult;
import com.flowcamel.core.model.VaultConfig;
import com.flowcamel.core.registry.CatalogRegistry;
import com.flowcamel.core.yaml.RouteYamlEmitter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public final class ProjectZipGenerator {
  private ProjectZipGenerator() {}

  public static byte[] generate(FlowGraph graph, ProjectMeta meta) throws IOException {
    ValidationResult validation = GraphValidator.validateForYamlExport(graph);
    if (!validation.valid()) {
      throw new IOException(String.join("\n", validation.errors()));
    }

    String projectName = meta.name;
    String artifactId = projectName.toLowerCase().replaceAll("[^a-z0-9-]", "-");
    String packageName = artifactId.replace("-", "");

    var allNodes =
        com.flowcamel.core.graph.GraphNormalizer.getFlows(graph).stream()
            .flatMap(f -> f.nodes.stream())
            .toList();

    boolean hasKafka =
        allNodes.stream().anyMatch(n -> "kafka-source".equals(n.blockType) || "kafka-dest".equals(n.blockType));
    boolean hasActiveMQ =
        allNodes.stream().anyMatch(n -> "jms-source".equals(n.blockType) || "jms-dest".equals(n.blockType));

    Set<String> deps = new LinkedHashSet<>();
    for (var node : allNodes) {
      String starter = CatalogRegistry.getMavenStarter(node.blockType);
      if (starter != null) deps.add(starter);
    }
    addVaultDependencies(graph.config, deps);

    Map<String, Object> pomCtx = new HashMap<>();
    pomCtx.put("projectName", projectName);
    pomCtx.put("artifactId", artifactId);
    pomCtx.put("packageName", packageName);
    pomCtx.put("dependencies", deps.stream().toList());

    String pomXml = TemplateRenderer.render("pom.xml.hbs", pomCtx);
    String routesYaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    String appYml = ApplicationConfigEmitter.buildApplicationYml(projectName, graph.config, true);

    ProjectConfig config = graph.config;
    List<String> exportProfiles =
        config != null && config.exportProfiles != null ? config.exportProfiles : List.of();
    String vaultProvider =
        config != null && config.vault != null && config.vault.provider != null
            ? config.vault.provider
            : "none";

    Map<String, Object> readmeCtx = new HashMap<>();
    readmeCtx.put("projectName", projectName);
    readmeCtx.put("artifactId", artifactId);
    readmeCtx.put("camelVersion", "4.5.0");
    readmeCtx.put("exportProfiles", exportProfiles);
    readmeCtx.put("devProfile", exportProfiles.isEmpty() ? "" : exportProfiles.getFirst());
    readmeCtx.put("vaultProvider", vaultProvider);
    readmeCtx.put("hasVault", !"none".equals(vaultProvider));
    String readme = TemplateRenderer.render("README.md.hbs", readmeCtx);

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
      for (String profileName : exportProfiles) {
        ApplicationConfigEmitter.findProfile(config, profileName)
            .ifPresent(
                profile -> {
                  try {
                    putText(
                        zip,
                        "src/main/resources/application-" + profile.name + ".yml",
                        ApplicationConfigEmitter.buildProfileYml(profile, true));
                  } catch (IOException e) {
                    throw new RuntimeException(e);
                  }
                });
      }
      putText(zip, "src/main/resources/camel/routes.camel.yaml", routesYaml);
      putText(zip, srcBase + "/Application.java", appJava);
      putText(zip, "docker-compose.yml", dockerCompose);
    }
    return baos.toByteArray();
  }

  private static void addVaultDependencies(ProjectConfig config, Set<String> deps) {
    if (config == null || config.vault == null) return;
    String provider = config.vault.provider;
    if ("aws".equals(provider)) {
      deps.add("camel-aws-secrets-manager-starter");
    } else if ("azure".equals(provider)) {
      deps.add("camel-azure-key-vault-starter");
    }
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
