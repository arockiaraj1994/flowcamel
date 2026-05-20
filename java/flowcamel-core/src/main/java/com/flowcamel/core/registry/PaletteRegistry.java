package com.flowcamel.core.registry;

import com.flowcamel.core.catalog.CatalogJson;
import com.flowcamel.core.model.BlockDefinition;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class PaletteRegistry {
  private static final Set<String> FEATURED = loadFeatured();
  private static final Set<String> BLOCKED = loadBlocked();

  private PaletteRegistry() {}

  private static Set<String> loadFeatured() {
    JsonNode root = CatalogJson.readTree("catalog/supported-components.json");
    Set<String> out = new HashSet<>();
    for (JsonNode n : root.get("featured")) out.add(n.asText());
    return out;
  }

  private static Set<String> loadBlocked() {
    JsonNode root = CatalogJson.readTree("catalog/blocked-components.json");
    Set<String> out = new HashSet<>();
    for (JsonNode n : root.get("schemes")) out.add(n.asText());
    return out;
  }

  public static boolean isFeaturedBlock(String blockType) {
    return FEATURED.contains(blockType);
  }

  public static boolean isBlockedScheme(String scheme) {
    return BLOCKED.contains(scheme);
  }

  public static List<BlockDefinition> getFeaturedBlocks() {
    return BlockRegistry.getAllBlocks().stream()
        .filter(b -> FEATURED.contains(b.type))
        .filter(b -> b.scheme == null || !BLOCKED.contains(b.scheme))
        .toList();
  }

  public static List<String> getSupportedBlockTypes() {
    return List.copyOf(FEATURED);
  }
}
