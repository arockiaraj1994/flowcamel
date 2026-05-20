package com.flowcamel.core.uri;

import com.flowcamel.core.model.BlockCategory;
import com.flowcamel.core.model.BlockDefinition;
import com.flowcamel.core.model.EndpointDescriptor;
import com.flowcamel.core.properties.ComponentProperties;
import com.flowcamel.core.properties.ComponentProperties.ComponentRole;
import com.flowcamel.core.registry.BlockRegistry;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class UriBuilder {
  private static final Pattern TEMPLATE = Pattern.compile("\\{\\{props\\.(\\w+)\\}\\}");

  private UriBuilder() {}

  public static String buildEndpointUri(String blockType, Map<String, String> props) {
    BlockDefinition block = BlockRegistry.getBlock(blockType).orElse(null);
    if (block == null) return "";
    Map<String, String> merged = ComponentProperties.resolveNodeProps(blockType, props);
    if (block.scheme != null && !block.scheme.isEmpty()) {
      ComponentRole role = ComponentProperties.roleForBlockCategory(block.category);
      if (role != null) {
        String fromCatalog = ComponentUri.buildUriFromCatalog(block.scheme, role, merged);
        if (!fromCatalog.isEmpty()) return fromCatalog;
      }
    }
    if (block.camelUri != null && !block.camelUri.isEmpty()) return fillUriTemplate(block.camelUri, merged);
    return "";
  }

  public static String fillUriTemplate(String uriTemplate, Map<String, String> props) {
    Matcher m = TEMPLATE.matcher(uriTemplate);
    StringBuilder sb = new StringBuilder();
    while (m.find()) {
      String key = m.group(1);
      m.appendReplacement(sb, Matcher.quoteReplacement(String.valueOf(props.getOrDefault(key, ""))));
    }
    m.appendTail(sb);
    return sb.toString();
  }

  public static EndpointDescriptor buildEndpointDescriptor(String blockType, Map<String, String> props) {
    String full = buildEndpointUri(blockType, props);
    BlockDefinition block = BlockRegistry.getBlock(blockType).orElse(null);
    String scheme = block != null && block.scheme != null ? block.scheme : full.split(":")[0].split("\\?")[0];
    if (full.isEmpty()) return EndpointDescriptor.of("");
    if (scheme == null || scheme.isEmpty()) return EndpointDescriptor.of(full);
    return ComponentUri.splitEndpointUri(full, scheme);
  }
}
