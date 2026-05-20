package com.flowcamel.core.model;

import java.util.LinkedHashMap;
import java.util.Map;

public record EndpointDescriptor(String uri, Map<String, String> parameters) {
  public EndpointDescriptor(String uri) {
    this(uri, null);
  }

  public static EndpointDescriptor of(String uri) {
    return new EndpointDescriptor(uri, null);
  }

  public static EndpointDescriptor withParams(String uri, Map<String, String> parameters) {
    return new EndpointDescriptor(uri, parameters == null || parameters.isEmpty() ? null : new LinkedHashMap<>(parameters));
  }
}
