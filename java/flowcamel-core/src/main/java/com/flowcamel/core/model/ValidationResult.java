package com.flowcamel.core.model;

import java.util.ArrayList;
import java.util.List;

public record ValidationResult(boolean valid, List<String> errors) {
  public static ValidationResult ok() {
    return new ValidationResult(true, List.of());
  }

  public static ValidationResult fail(List<String> errors) {
    return new ValidationResult(false, new ArrayList<>(errors));
  }
}
