package com.flowcamel.core.registry;

import com.flowcamel.core.catalog.CatalogJson;
import com.flowcamel.core.model.BlockCategory;
import com.flowcamel.core.model.BlockDefinition;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public final class BlockRegistry {
  private static final List<BlockDefinition> BLOCKS = loadBlocks();
  private static final Map<String, BlockDefinition> BY_TYPE =
      BLOCKS.stream().collect(Collectors.toMap(b -> b.type, b -> b));

  private static List<BlockDefinition> loadBlocks() {
    BlockDefinition[] arr = CatalogJson.read("catalog/blocks.json", BlockDefinition[].class);
    return List.of(arr);
  }

  private BlockRegistry() {}

  public static Optional<BlockDefinition> getBlock(String type) {
    return Optional.ofNullable(BY_TYPE.get(type));
  }

  public static List<BlockDefinition> getAllBlocks() {
    return BLOCKS;
  }

  public static List<BlockDefinition> getByCategory(BlockCategory category) {
    return BLOCKS.stream().filter(b -> b.category == category).toList();
  }
}
