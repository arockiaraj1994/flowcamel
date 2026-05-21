package com.flowcamel.core.config;

import com.flowcamel.core.model.ConfigEntry;
import com.flowcamel.core.model.ConfigProfile;
import com.flowcamel.core.model.ProjectConfig;
import com.flowcamel.core.model.VaultConfig;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

public final class ApplicationConfigEmitter {
  private ApplicationConfigEmitter() {}

  public static String buildApplicationYml(String projectName, ProjectConfig config, boolean forExport) {
    StringBuilder sb = new StringBuilder();
    sb.append("spring:\n");
    sb.append("  application:\n");
    sb.append("    name: ").append(escapeScalar(projectName)).append('\n');

    String vaultProvider = config != null && config.vault != null ? config.vault.provider : "none";
    if ("aws".equals(vaultProvider)) {
      String secretId =
          config.vault.secretId != null && !config.vault.secretId.isBlank()
              ? config.vault.secretId.trim()
              : "my-app/";
      sb.append("  config:\n");
      sb.append("    import: optional:aws-secretsmanager:").append(secretId).append('\n');
    } else if ("azure".equals(vaultProvider)) {
      sb.append("  config:\n");
      sb.append("    import: optional:azure-keyvault:\n");
    }

    sb.append("\ncamel:\n");
    sb.append("  springboot:\n");
    sb.append("    main-run-controller: true\n");
    sb.append("  main:\n");
    sb.append("    routes-include-pattern: classpath:camel/**\n");
    sb.append("\nlogging:\n");
    sb.append("  level:\n");
    sb.append("    org.apache.camel: INFO\n");
    sb.append("    com.flowcamel: DEBUG\n");

    List<ConfigEntry> entries =
        config != null && config.defaultEntries != null ? config.defaultEntries : List.of();
    String body = entriesToYaml(entries, forExport);
    if (!body.isEmpty()) {
      sb.append('\n').append(body);
    }
    return sb.toString().trim() + "\n";
  }

  public static String buildProfileYml(ConfigProfile profile, boolean forExport) {
    StringBuilder sb = new StringBuilder();
    sb.append("spring:\n");
    sb.append("  config:\n");
    sb.append("    activate:\n");
    sb.append("      on-profile: ").append(profile.name).append('\n');
    String body = entriesToYaml(profile.entries != null ? profile.entries : List.of(), forExport);
    if (!body.isEmpty()) {
      sb.append('\n').append(body);
    }
    return sb.toString().trim() + "\n";
  }

  public static Optional<ConfigProfile> findProfile(ProjectConfig config, String name) {
    if (config == null || config.profiles == null) return Optional.empty();
    return config.profiles.stream().filter(p -> name.equals(p.name)).findFirst();
  }

  public static String buildApplicationProperties(ProjectConfig config, String profileName) {
    Map<String, String> flat = new LinkedHashMap<>();
    if (config != null && config.defaultEntries != null) {
      for (ConfigEntry e : config.defaultEntries) {
        if (e.key != null && !e.key.isBlank()) {
          flat.put(e.key.trim(), e.value != null ? e.value : "");
        }
      }
    }
    findProfile(config, profileName)
        .ifPresent(
            p -> {
              if (p.entries != null) {
                for (ConfigEntry e : p.entries) {
                  if (e.key != null && !e.key.isBlank()) {
                    flat.put(e.key.trim(), e.value != null ? e.value : "");
                  }
                }
              }
            });
    StringBuilder sb = new StringBuilder();
    flat.entrySet().stream()
        .sorted(Map.Entry.comparingByKey())
        .forEach(e -> sb.append(e.getKey()).append('=').append(e.getValue()).append('\n'));
    return sb.toString();
  }

  public static boolean configKeyExists(ProjectConfig config, String key) {
    if (config == null || config.defaultEntries == null) return false;
    return config.defaultEntries.stream().anyMatch(e -> key.equals(e.key));
  }

  public static List<String> listConfigRefsInProps(Map<String, String> props) {
    if (props == null) return List.of();
    List<String> keys = new ArrayList<>();
    for (String v : props.values()) {
      if (ConfigRefs.isConfigRef(v)) keys.add(ConfigRefs.configRefKey(v));
    }
    return keys;
  }

  private static String entriesToYaml(List<ConfigEntry> entries, boolean forExport) {
    Map<String, Object> root = nestedFromEntries(entries, forExport);
    return objectToYaml(root, 0).trim();
  }

  private static Map<String, Object> nestedFromEntries(List<ConfigEntry> entries, boolean forExport) {
    Map<String, Object> root = new TreeMap<>();
    List<ConfigEntry> sorted = new ArrayList<>(entries);
    sorted.sort(Comparator.comparing(e -> e.key != null ? e.key : ""));
    for (ConfigEntry e : sorted) {
      if (e.key == null || e.key.isBlank()) continue;
      setNested(root, e.key.trim(), emitValue(e, forExport));
    }
    return root;
  }

  private static String emitValue(ConfigEntry entry, boolean forExport) {
    if (forExport && Boolean.TRUE.equals(entry.secret)) {
      return "${" + entry.key + "}";
    }
    return entry.value != null ? entry.value : "";
  }

  @SuppressWarnings("unchecked")
  private static void setNested(Map<String, Object> target, String key, String value) {
    String[] parts = key.split("\\.");
    Map<String, Object> cur = target;
    for (int i = 0; i < parts.length - 1; i++) {
      String p = parts[i];
      Object next = cur.get(p);
      if (!(next instanceof Map)) {
        next = new TreeMap<String, Object>();
        cur.put(p, next);
      }
      cur = (Map<String, Object>) next;
    }
    cur.put(parts[parts.length - 1], value);
  }

  private static String objectToYaml(Map<String, Object> obj, int indent) {
    StringBuilder lines = new StringBuilder();
    for (String key : new TreeMap<>(obj).keySet()) {
      Object val = obj.get(key);
      String pad = " ".repeat(indent);
      if (val instanceof Map) {
        lines.append(pad).append(key).append(":\n");
        lines.append(objectToYaml((Map<String, Object>) val, indent + 2));
      } else {
        lines.append(pad).append(key).append(": ").append(escapeScalar(String.valueOf(val))).append('\n');
      }
    }
    return lines.toString();
  }

  private static String escapeScalar(String s) {
    if (s.startsWith("${") && s.endsWith("}")) return s;
    if (s.matches("-?\\d+(\\.\\d+)?")) return s;
    if ("true".equals(s) || "false".equals(s)) return s;
    if (s.matches("^[a-zA-Z0-9._/@-]+$") && !s.contains(":")) return s;
    return "\"" + s.replace("\"", "\\\"") + "\"";
  }

  public static Map<String, String> flattenEntries(List<ConfigEntry> entries) {
    Map<String, String> flat = new LinkedHashMap<>();
    for (ConfigEntry e : entries) {
      if (e.key != null && !e.key.isBlank()) {
        flat.put(e.key.trim(), e.value != null ? e.value : "");
      }
    }
    return flat;
  }
}
