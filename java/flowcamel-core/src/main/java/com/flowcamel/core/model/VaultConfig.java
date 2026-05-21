package com.flowcamel.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class VaultConfig {
  public String provider = "none";
  public String secretId;
}
