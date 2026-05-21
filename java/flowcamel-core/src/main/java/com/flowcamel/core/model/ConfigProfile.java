package com.flowcamel.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ConfigProfile {
  public String name = "";
  public String label;
  public List<ConfigEntry> entries = new ArrayList<>();
}
