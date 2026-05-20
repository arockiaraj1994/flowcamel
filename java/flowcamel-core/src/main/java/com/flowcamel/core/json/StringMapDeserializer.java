package com.flowcamel.core.json;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/** Coerce wizard props to strings (frontend may send numbers/booleans). */
public class StringMapDeserializer extends JsonDeserializer<Map<String, String>> {
  @Override
  public Map<String, String> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
    JsonNode node = p.getCodec().readTree(p);
    Map<String, String> out = new LinkedHashMap<>();
    if (node == null || !node.isObject()) return out;
    node.fields()
        .forEachRemaining(
            e -> {
              JsonNode v = e.getValue();
              if (v == null || v.isNull()) out.put(e.getKey(), "");
              else if (v.isTextual()) out.put(e.getKey(), v.asText());
              else out.put(e.getKey(), v.asText());
            });
    return out;
  }
}
