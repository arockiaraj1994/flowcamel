package com.flowcamel.core.config;

public final class ConfigRefs {
  public static final String PREFIX = "@config:";

  private ConfigRefs() {}

  public static boolean isConfigRef(String value) {
    return value != null && value.startsWith(PREFIX);
  }

  public static String configRefKey(String value) {
    return value.substring(PREFIX.length());
  }

  public static String resolvePropForEmit(String value) {
    if (value == null || value.isEmpty()) return "";
    if (isConfigRef(value)) return "${" + configRefKey(value) + "}";
    return value;
  }
}
