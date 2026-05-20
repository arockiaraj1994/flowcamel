package com.flowcamel.core.registry;

import com.flowcamel.core.catalog.CamelCatalogProperty;
import com.flowcamel.core.catalog.CamelComponentMeta;
import com.flowcamel.core.catalog.CatalogComponentEntry;
import com.flowcamel.core.catalog.CatalogJson;
import com.flowcamel.core.model.BlockCategory;
import com.flowcamel.core.model.BlockDefinition;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class CatalogRegistry {
  public static final String CAMEL_CATALOG_VERSION =
      CatalogJson.readTree("catalog/camel/version.json").get("version").asText();
  public static final String CAMEL_CATALOG_MAVEN =
      CatalogJson.readTree("catalog/camel/version.json").get("maven").asText();

  private static final List<CatalogComponentEntry> ENTRIES = CatalogJson.loadComponents();
  private static final Map<String, CatalogComponentEntry> BY_SCHEME = new HashMap<>();
  private static final Map<String, CatalogComponentEntry> BY_NAME = new HashMap<>();
  private static final Map<String, String> EIP_BY_TYPE = loadEips();

  static {
    for (CatalogComponentEntry e : ENTRIES) {
      BY_SCHEME.put(e.component.scheme, e);
      BY_NAME.put(e.component.name, e);
    }
  }

  private CatalogRegistry() {}

  private static Map<String, String> loadEips() {
    JsonNode arr = CatalogJson.readTree("catalog/eips.json");
    Map<String, String> map = new HashMap<>();
    for (JsonNode row : arr) map.put(row.get("type").asText(), row.get("eipId").asText());
    return map;
  }

  public static Optional<CatalogComponentEntry> resolveEntry(String schemeOrName) {
    return Optional.ofNullable(BY_SCHEME.get(schemeOrName)).or(() -> Optional.ofNullable(BY_NAME.get(schemeOrName)));
  }

  public static List<CamelCatalogProperty> getCatalogProperties(String scheme) {
    return resolveEntry(scheme)
        .map(e -> toCatalogProperties(e.properties))
        .orElse(List.of());
  }

  private static List<CamelCatalogProperty> toCatalogProperties(Map<String, JsonNode> props) {
    if (props == null) return List.of();
    List<CamelCatalogProperty> out = new ArrayList<>();
    for (var e : props.entrySet()) {
      JsonNode v = e.getValue();
      if (v.has("deprecated") && v.get("deprecated").asBoolean()) continue;
      CamelCatalogProperty p = new CamelCatalogProperty();
      p.name = e.getKey();
      p.displayName = text(v, "displayName", p.name);
      p.type = text(v, "type", "string");
      p.required = v.has("required") && v.get("required").asBoolean();
      p.secret = v.has("secret") && v.get("secret").asBoolean();
      if (v.has("defaultValue") && !v.get("defaultValue").isNull()) {
        JsonNode dv = v.get("defaultValue");
        p.defaultValue = dv.isBoolean() ? dv.asBoolean() : dv.asText();
      }
      if (v.has("enum")) {
        List<String> en = new ArrayList<>();
        for (JsonNode item : v.get("enum")) en.add(item.asText());
        p.enumValues = en.toArray(String[]::new);
      }
      p.description = text(v, "description", null);
      p.label = v.has("label") && v.get("label").isTextual() ? v.get("label").asText() : null;
      p.kind = text(v, "kind", null);
      out.add(p);
    }
    return out;
  }

  private static String text(JsonNode n, String field, String def) {
    return n.has(field) && !n.get(field).isNull() ? n.get(field).asText() : def;
  }

  public static List<String> getAllCatalogSchemes() {
    return BY_SCHEME.keySet().stream().sorted().toList();
  }

  public static Optional<String> getEipType(String blockType) {
    return Optional.ofNullable(EIP_BY_TYPE.get(blockType));
  }

  public static String getMavenStarter(String blockType) {
    BlockDefinition block = BlockRegistry.getBlock(blockType).orElse(null);
    if (block == null) return null;
    if (block.category == BlockCategory.ACTION && block.scheme == null) {
      if ("json-xml".equals(getEipType(blockType).orElse(null))) return "camel-jacksonxml-starter";
      if ("camel-core".equals(block.camelComponent)) return null;
    }
    if (block.scheme == null) return legacyStarter(block.camelComponent);
    CatalogComponentEntry entry = resolveEntry(block.scheme).orElse(null);
    if (entry == null) return legacyStarter(block.camelComponent);
    String id = entry.component.artifactId;
    if (id == null || id.isEmpty() || "camel-core".equals(id)) return null;
    return id.endsWith("-starter") ? id : id + "-starter";
  }

  private static String legacyStarter(String camelComponent) {
    return switch (camelComponent) {
      case "camel-ftp-starter" -> "camel-ftp-starter";
      case "camel-kafka" -> "camel-kafka-starter";
      case "camel-activemq" -> "camel-activemq-starter";
      case "camel-undertow" -> "camel-undertow-starter";
      case "camel-file" -> "camel-file-starter";
      case "camel-mail" -> "camel-mail-starter";
      case "camel-jdbc" -> "camel-jdbc-starter";
      case "camel-http" -> "camel-http-starter";
      case "camel-xslt" -> "camel-xslt-starter";
      case "camel-jacksonxml" -> "camel-jacksonxml-starter";
      case "camel-timer" -> "camel-timer-starter";
      default -> null;
    };
  }
}
