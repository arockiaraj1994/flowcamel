package com.flowcamel.core.json;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;

/** Coerce JSON number/boolean/string to String (blocks.json defaultValue: 22, etc.). */
public class FlexibleStringDeserializer extends JsonDeserializer<String> {
  @Override
  public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
    JsonNode node = p.getCodec().readTree(p);
    if (node == null || node.isNull()) return null;
    return node.asText();
  }
}
