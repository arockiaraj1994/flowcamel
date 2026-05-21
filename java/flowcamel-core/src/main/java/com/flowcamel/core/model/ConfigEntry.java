package com.flowcamel.core.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ConfigEntry {
  public String key = "";
  public String value = "";
  public Boolean secret;
  public String description;
}
