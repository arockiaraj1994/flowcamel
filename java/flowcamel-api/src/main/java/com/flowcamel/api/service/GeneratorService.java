package com.flowcamel.api.service;

import com.flowcamel.core.graph.GraphValidator;
import com.flowcamel.core.model.ProjectMeta;
import com.flowcamel.core.model.ValidationResult;
import com.flowcamel.generator.ProjectZipGenerator;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Optional;

@ApplicationScoped
public class GeneratorService {
  @Inject ProjectService projectService;

  public byte[] generateZip(String projectId) throws Exception {
    Optional<ProjectMeta> meta = projectService.get(projectId);
    if (meta.isEmpty()) throw new IllegalArgumentException("Project not found: " + projectId);
    ValidationResult validation = GraphValidator.validateForYamlExport(meta.get().graph);
    if (!validation.valid()) {
      throw new IllegalArgumentException(String.join("\n", validation.errors()));
    }
    return ProjectZipGenerator.generate(meta.get().graph, meta.get());
  }
}
