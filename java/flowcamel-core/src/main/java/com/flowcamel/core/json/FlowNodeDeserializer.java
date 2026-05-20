package com.flowcamel.core.json;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.flowcamel.core.model.FlowNode;
import com.flowcamel.core.model.NodePosition;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/** Accepts TS shape ({@code position}) and legacy flat {@code x}/{@code y}. */
public class FlowNodeDeserializer extends JsonDeserializer<FlowNode> {
  @Override
  public FlowNode deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
    JsonNode node = p.getCodec().readTree(p);
    FlowNode fn = new FlowNode();
    if (node == null || !node.isObject()) return fn;

    fn.id = text(node, "id");
    fn.blockType = text(node, "blockType");
    fn.label = text(node, "label");
    fn.subtitle = text(node, "subtitle");

    JsonNode pos = node.get("position");
    if (pos != null && pos.isObject()) {
      fn.position = new NodePosition(pos.path("x").asDouble(0), pos.path("y").asDouble(0));
    } else if (node.has("x") || node.has("y")) {
      fn.position = new NodePosition(node.path("x").asDouble(0), node.path("y").asDouble(0));
    } else {
      fn.position = new NodePosition(0, 0);
    }

    fn.props = new LinkedHashMap<>();
    JsonNode props = node.get("props");
    if (props != null && props.isObject()) {
      props
          .fields()
          .forEachRemaining(
              e -> {
                JsonNode v = e.getValue();
                if (v == null || v.isNull()) fn.props.put(e.getKey(), "");
                else fn.props.put(e.getKey(), v.asText());
              });
    }
    return fn;
  }

  private static String text(JsonNode node, String field) {
    JsonNode v = node.get(field);
    return v == null || v.isNull() ? null : v.asText();
  }
}
