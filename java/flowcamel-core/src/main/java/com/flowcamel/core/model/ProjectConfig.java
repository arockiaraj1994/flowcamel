package com.flowcamel.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ProjectConfig {
  @JsonProperty("default")
  public List<ConfigEntry> defaultEntries = new ArrayList<>();
  public List<String> exportProfiles = new ArrayList<>();
  public List<ConfigProfile> profiles = new ArrayList<>();
  public VaultConfig vault;
}
