package com.flowcamel.core.yaml;

import com.flowcamel.core.model.FlowGraph;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

public final class RouteYamlEmitter {
  private static final Yaml YAML = new Yaml(dumperOptions());

  private RouteYamlEmitter() {}

  public static String graphToYamlRoutes(FlowGraph graph) {
    List<Map<String, Object>> routes = YamlRouteBuilder.buildAllYamlRoutes(graph);
    if (routes.isEmpty()) return "[]\n";
    return YAML.dump(routes);
  }

  /** Block-style YAML with list items indented under {@code steps} (matches js-yaml / Camel JBang). */
  private static DumperOptions dumperOptions() {
    DumperOptions options = new DumperOptions();
    options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
    options.setIndent(2);
    options.setIndicatorIndent(2);
    options.setIndentWithIndicator(true);
    options.setWidth(120);
    options.setPrettyFlow(true);
    return options;
  }
}
