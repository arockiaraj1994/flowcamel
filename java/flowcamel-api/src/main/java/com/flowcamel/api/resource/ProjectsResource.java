package com.flowcamel.api.resource;

import com.flowcamel.api.dto.ProjectCreateRequest;
import com.flowcamel.api.dto.ProjectUpdateRequest;
import com.flowcamel.api.service.ProjectService;
import com.flowcamel.core.model.ProjectMeta;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;

@Path("/api/projects")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProjectsResource {
  @Inject ProjectService projectService;

  @GET
  public List<ProjectMeta> list() throws Exception {
    return projectService.list();
  }

  @GET
  @Path("/{id}")
  public Response get(@PathParam("id") String id) throws Exception {
    return projectService
        .get(id)
        .map(p -> Response.ok(p).build())
        .orElse(Response.status(404).entity(Map.of("error", "Not found")).build());
  }

  @POST
  public Response create(ProjectCreateRequest body) throws Exception {
    if (body.name == null || body.name.isBlank()) {
      return Response.status(400).entity(Map.of("error", "name is required")).build();
    }
    ProjectMeta created = projectService.create(body.name, body.graph);
    return Response.status(201).entity(created).build();
  }

  @PUT
  @Path("/{id}")
  public Response update(@PathParam("id") String id, ProjectUpdateRequest body) throws Exception {
    if (body == null) {
      return Response.status(400).entity(Map.of("error", "Request body is required")).build();
    }
    return projectService
        .update(id, body.name, body.graph)
        .map(p -> Response.ok(p).build())
        .orElse(Response.status(404).entity(Map.of("error", "Not found")).build());
  }

  @DELETE
  @Path("/{id}")
  public Response delete(@PathParam("id") String id) throws Exception {
    if (!projectService.delete(id)) {
      return Response.status(404).entity(Map.of("error", "Not found")).build();
    }
    return Response.ok(Map.of("success", true)).build();
  }
}
