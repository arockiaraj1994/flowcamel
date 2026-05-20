package com.flowcamel.api.resource;

import com.flowcamel.api.dto.TestRunRequest;
import com.flowcamel.api.service.TestRunService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import java.io.IOException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Path("/api/test-run")
public class TestRunResource {
  @Inject TestRunService testRunService;

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces("application/x-ndjson")
  public Response testRun(TestRunRequest body) {
    if (body == null || body.projectId == null || body.projectId.isBlank()) {
      return Response.status(400).entity(Map.of("error", "projectId is required")).build();
    }
    StreamingOutput stream =
        output -> {
          TestRunService.LineWriter writer = line -> {
            output.write((line + "\n").getBytes(StandardCharsets.UTF_8));
            output.flush();
          };
          try {
            testRunService.stream(body.projectId, writer);
          } catch (IOException e) {
            testRunService.stop(body.projectId);
          } catch (Throwable e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Test run failed";
            try {
              writer.writeLine("{\"type\":\"error\",\"message\":" + jsonEscape(msg) + "}");
            } catch (Exception ignored) {
            }
          }
        };
    return Response.ok(stream).build();
  }

  /** Karavan-style Stop: kill the active JBang/Docker test run for this project. */
  @POST
  @Path("/stop")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response stop(TestRunRequest body) {
    if (body == null || body.projectId == null || body.projectId.isBlank()) {
      return Response.status(400).entity(Map.of("error", "projectId is required")).build();
    }
    boolean stopped = testRunService.stop(body.projectId);
    return Response.ok(Map.of("stopped", stopped)).build();
  }

  private static String jsonEscape(String s) {
    return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\"";
  }
}
