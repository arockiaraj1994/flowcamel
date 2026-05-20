package com.flowcamel.core.properties;

import com.flowcamel.core.catalog.CamelCatalogProperty;
import com.flowcamel.core.model.BlockCategory;
import com.flowcamel.core.model.BlockDefinition;
import com.flowcamel.core.model.PropSchema;
import com.flowcamel.core.registry.BlockRegistry;
import com.flowcamel.core.registry.CatalogRegistry;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class ComponentProperties {
  public enum ComponentRole {
    consumer,
    producer
  }

  private ComponentProperties() {}

  public static List<PropSchema> getWizardSteps(String blockType) {
    return BlockRegistry.getBlock(blockType).map(b -> b.props).orElse(List.of());
  }

  public static Map<String, String> getDefaultPropsForBlock(String blockType) {
    Map<String, String> out = new LinkedHashMap<>();
    for (PropSchema step : getWizardSteps(blockType)) {
      if (step.defaultValue != null && !step.defaultValue.isEmpty()) {
        out.put(step.key, step.defaultValue);
      }
    }
    return out;
  }

  public static Map<String, String> resolveNodeProps(String blockType, Map<String, String> props) {
    Map<String, String> merged = new LinkedHashMap<>(getDefaultPropsForBlock(blockType));
    if (props != null) merged.putAll(props);
    return merged;
  }

  public static String resolvePropValue(Map<String, String> props, PropSchema schema) {
    String v = props.get(schema.key);
    if (v != null && !v.isEmpty()) return v;
    if (schema.defaultValue != null && !schema.defaultValue.isEmpty()) return schema.defaultValue;
    return "";
  }

  public static ComponentRole roleForBlockCategory(BlockCategory category) {
    return switch (category) {
      case SOURCE -> ComponentRole.consumer;
      case DESTINATION -> ComponentRole.producer;
      default -> null;
    };
  }

  public static List<CamelCatalogProperty> getComponentProperties(String scheme, ComponentRole role) {
    List<CamelCatalogProperty> raw = CatalogRegistry.getCatalogProperties(scheme);
    String inverted = role == ComponentRole.consumer ? "producer" : "consumer";
    List<CamelCatalogProperty> path = new ArrayList<>();
    List<CamelCatalogProperty> required = new ArrayList<>();
    List<CamelCatalogProperty> common = new ArrayList<>();
    List<CamelCatalogProperty> rest = new ArrayList<>();

    for (CamelCatalogProperty p : raw) {
      if ("path".equals(p.kind)) path.add(p);
      else if (p.required) required.add(p);
      else if (!labelHas(p, inverted) && !labelHas(p, "advanced")) common.add(p);
      else if (!labelHas(p, inverted)) rest.add(p);
    }

    List<CamelCatalogProperty> ordered = new ArrayList<>();
    ordered.addAll(path);
    ordered.addAll(required);
    ordered.addAll(common);
    ordered.addAll(rest);
    return dedupe(ordered);
  }

  private static boolean labelHas(CamelCatalogProperty p, String token) {
    String lab = p.label == null ? "" : p.label.toLowerCase();
    return lab.contains(token);
  }

  private static List<CamelCatalogProperty> dedupe(List<CamelCatalogProperty> props) {
    List<CamelCatalogProperty> out = new ArrayList<>();
    var seen = new java.util.HashSet<String>();
    for (CamelCatalogProperty p : props) {
      if (seen.add(p.name)) out.add(p);
    }
    return out;
  }
}
