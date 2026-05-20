package com.flowcamel.core.catalog;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CamelCatalogProperty {
  public String name;
  public String displayName;
  public String type = "string";
  public boolean required;
  public boolean secret;
  public Object defaultValue;
  public String[] enumValues;
  public String description;
  public String label;
  public String kind;
}
