package com.flowcamel.core.registry;

import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;

class BlockRegistryTest {
  @Test
  void loadsBlocksFromClasspath() {
    assertFalse(BlockRegistry.getAllBlocks().isEmpty());
  }
}
