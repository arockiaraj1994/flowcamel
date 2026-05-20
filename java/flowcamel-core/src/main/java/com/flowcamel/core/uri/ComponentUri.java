package com.flowcamel.core.uri;

import com.flowcamel.core.catalog.CamelCatalogProperty;
import com.flowcamel.core.catalog.CatalogComponentEntry;
import com.flowcamel.core.model.EndpointDescriptor;
import com.flowcamel.core.properties.ComponentProperties;
import com.flowcamel.core.properties.ComponentProperties.ComponentRole;
import com.flowcamel.core.registry.CatalogRegistry;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class ComponentUri {
  private static final String[] SEPARATORS = {"://", "//", ":", "/", "#"};

  private ComponentUri() {}

  public static List<String> parseSyntax(String syntax) {
    String simplified = syntax;
    for (String s : SEPARATORS) simplified = simplified.replace(s, ":");
    List<String> parts = new ArrayList<>();
    for (String p : simplified.split(":")) if (!p.isEmpty()) parts.add(p);
    return parts;
  }

  public static List<String> getSyntaxSeparators(String syntax) {
    List<String> parts = parseSyntax(syntax);
    List<String> result = new ArrayList<>();
    String str = "";
    for (int index = 0; index < parts.size() - 1; index++) {
      String part = parts.get(index);
      String next = parts.get(index + 1);
      int start = syntax.indexOf(part, str.length()) + part.length();
      int end = syntax.indexOf(next, start);
      result.add(syntax.substring(start, end));
      str = str + part + syntax.substring(start, end);
    }
    return result;
  }

  public static Map<String, String> getUriParts(String uri, String scheme) {
    Map<String, String> result = new LinkedHashMap<>();
    CatalogComponentEntry desc = CatalogRegistry.resolveEntry(scheme).orElse(null);
    if (desc == null || uri == null || uri.isEmpty()) return result;

    String name = desc.component.name;
    if ("salesforce".equals(name)) {
      String[] parts = uri.split(":");
      if (parts.length == 2) {
        result.put("operationName", parts[1]);
        result.put("topicName", "");
      } else if (parts.length == 3) {
        result.put("operationName", parts[1]);
        result.put("topicName", parts[2]);
      }
      return result;
    }
    if ("cxf".equals(name)) {
      String[] cxfParts = uri.split(":");
      if (cxfParts.length == 3 && "bean".equals(cxfParts[1]) && cxfParts[2] != null) {
        result.put("beanId", cxfParts[1] + ":" + cxfParts[2]);
      }
      if (cxfParts.length == 2 && cxfParts[1] != null && cxfParts[1].startsWith("//")) {
        result.put("address", cxfParts[1]);
      }
      return result;
    }
    if ("jt400".equals(name)) {
      String[] jt = uri.replace(".", ":").replace("/", ":").replace("@", ":").split(":");
      if (jt.length > 1) result.put("userID", jt[1]);
      if (jt.length > 2) result.put("password", jt[2]);
      if (jt.length > 3) result.put("systemName", jt[3]);
      if (jt.length > 4) result.put("objectPath", jt[4]);
      if (jt.length > 5) result.put("type", jt[5]);
      return result;
    }

    String syntax = desc.component.syntax;
    List<String> syntaxParts = parseSyntax(syntax);
    List<String> syntaxSeparators = getSyntaxSeparators(syntax);
    String newUri = uri.equals(name) ? name + String.join("", syntaxSeparators) : uri;

    for (int index = 0; index < syntaxParts.size() - 1; index++) {
      if (index == 0) continue;
      String part = syntaxParts.get(index);
      String startSeparator = syntaxSeparators.get(index - 1);
      String endSeparator = index < syntaxSeparators.size() ? syntaxSeparators.get(index) : "";
      int start = newUri.indexOf(startSeparator) + startSeparator.length();
      int end = endSeparator.isEmpty() ? newUri.length() : newUri.indexOf(endSeparator, start);
      result.put(part, newUri.substring(start, end));
      newUri = newUri.substring(end);
    }
    return result;
  }

  public static EndpointDescriptor splitEndpointUri(String fullUri, String scheme) {
    if (fullUri == null || fullUri.isEmpty()) return EndpointDescriptor.of(scheme);
    String base = fullUri.split("\\?")[0];
    Map<String, String> parameters = new LinkedHashMap<>(getUriParts(base, scheme));
    parameters.putAll(parseQueryParams(fullUri));
    String schemeOnly = scheme != null && !scheme.isEmpty() ? scheme : fullUri.split(":")[0].split("\\?")[0];
    boolean hasComplexPath = fullUri.contains("://") || fullUri.contains("@");
    if (parameters.isEmpty() || hasComplexPath) return EndpointDescriptor.of(fullUri);
    return EndpointDescriptor.withParams(schemeOnly, parameters);
  }

  private static Map<String, String> parseQueryParams(String fullUri) {
    int qIdx = fullUri.indexOf('?');
    if (qIdx < 0) return Map.of();
    Map<String, String> out = new LinkedHashMap<>();
    for (String pair : fullUri.substring(qIdx + 1).split("&")) {
      if (pair.isEmpty()) continue;
      int eq = pair.indexOf('=');
      String key = URLDecoder.decode(eq >= 0 ? pair.substring(0, eq) : pair, StandardCharsets.UTF_8);
      String val = URLDecoder.decode(eq >= 0 ? pair.substring(eq + 1) : "", StandardCharsets.UTF_8);
      if (!key.isEmpty()) out.put(key, val);
    }
    return out;
  }

  public static String buildUriFromCatalog(String scheme, ComponentRole role, Map<String, String> props) {
    CatalogComponentEntry desc = CatalogRegistry.resolveEntry(scheme).orElse(null);
    if (desc == null) return "";
    List<String> parts = parseSyntax(desc.component.syntax);
    List<String> separators = getSyntaxSeparators(desc.component.syntax);
    Set<String> pathNames = new HashSet<>(getPathParamNames(scheme));

    StringBuilder uri = new StringBuilder(parts.getFirst());
    for (int i = 1; i < parts.size(); i++) {
      String param = parts.get(i);
      String val = props.get(param);
      if (val == null || val.isEmpty()) return "";
      uri.append(separators.get(i - 1)).append(val);
    }
    return appendQuery(uri.toString(), props, ComponentProperties.getComponentProperties(scheme, role), pathNames);
  }

  private static List<String> getPathParamNames(String scheme) {
    CatalogComponentEntry desc = CatalogRegistry.resolveEntry(scheme).orElse(null);
    if (desc == null) return List.of();
    List<String> fromKind = ComponentProperties.getComponentProperties(scheme, ComponentRole.consumer).stream()
        .filter(p -> "path".equals(p.kind))
        .map(p -> p.name)
        .toList();
    if (!fromKind.isEmpty()) return fromKind;
    List<String> syntaxParts = parseSyntax(desc.component.syntax);
    return syntaxParts.size() > 1 ? syntaxParts.subList(1, syntaxParts.size()) : List.of();
  }

  private static String appendQuery(
      String uri, Map<String, String> props, List<CamelCatalogProperty> catalogProps, Set<String> pathNames) {
    List<String> params = new ArrayList<>();
    for (CamelCatalogProperty p : catalogProps) {
      if (pathNames.contains(p.name) || "path".equals(p.kind)) continue;
      String val = props.get(p.name);
      if (val == null || val.isEmpty()) continue;
      params.add(p.name + "=" + java.net.URLEncoder.encode(val, StandardCharsets.UTF_8));
    }
    if (params.isEmpty()) return uri;
    return uri + (uri.contains("?") ? "&" : "?") + String.join("&", params);
  }
}
