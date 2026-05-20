package com.flowcamel.core.catalog;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.List;

public final class CatalogJson {
  private static final ObjectMapper MAPPER = createMapper();

  private static ObjectMapper createMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
    mapper.enable(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_AS_NULL);
    mapper.findAndRegisterModules();
    return mapper;
  }

  private CatalogJson() {}

  public static <T> T read(String path, Class<T> type) {
    try (InputStream in = CatalogJson.class.getClassLoader().getResourceAsStream(path)) {
      if (in == null) throw new IllegalStateException("Missing classpath resource: " + path);
      return MAPPER.readValue(in, type);
    } catch (Exception e) {
      throw new IllegalStateException("Failed to read " + path, e);
    }
  }

  public static JsonNode readTree(String path) {
    try (InputStream in = CatalogJson.class.getClassLoader().getResourceAsStream(path)) {
      if (in == null) throw new IllegalStateException("Missing classpath resource: " + path);
      return MAPPER.readTree(in);
    } catch (Exception e) {
      throw new IllegalStateException("Failed to read " + path, e);
    }
  }

  public static List<CatalogComponentEntry> loadComponents() {
    try (InputStream in = CatalogJson.class.getClassLoader().getResourceAsStream("catalog/camel/components.json")) {
      if (in == null) throw new IllegalStateException("Missing catalog/camel/components.json");
      return MAPPER.readerForListOf(CatalogComponentEntry.class).readValue(in);
    } catch (Exception e) {
      throw new IllegalStateException("Failed to load components.json", e);
    }
  }
}
