package com.flowcamel.api.resource;

import com.flowcamel.api.dto.GenerateRequest;
import com.flowcamel.api.service.GeneratorService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@Path("/api/generate")
public class GenerateResource {
  @Inject GeneratorService generatorService;

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces("application/zip")
  public Response generate(GenerateRequest body) {
    if (body == null || body.projectId == null || body.projectId.isBlank()) {
      return Response.status(400).entity(Map.of("error", "projectId is required")).build();
    }
    try {
      byte[] zip = generatorService.generateZip(body.projectId);
      return Response.ok(zip)
          .header("Content-Disposition", "attachment; filename=\"flowcamel-project.zip\"")
          .build();
    } catch (IllegalArgumentException e) {
      int status = isClientError(e.getMessage()) ? 400 : 500;
      return Response.status(status).entity(Map.of("error", e.getMessage())).build();
    } catch (Exception e) {
      String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
      if (e.getCause() != null && e.getCause().getMessage() != null) {
        msg = msg + ": " + e.getCause().getMessage();
      }
      return Response.status(500).entity(Map.of("error", "Generation failed: " + msg)).build();
    }
  }

  private static boolean isClientError(String msg) {
    if (msg == null) return false;
    String m = msg.toLowerCase();
    return m.contains("missing") || m.contains("must have") || m.contains("required") || m.contains("not found");
  }
}
