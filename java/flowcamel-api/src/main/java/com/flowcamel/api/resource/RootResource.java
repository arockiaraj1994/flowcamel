package com.flowcamel.api.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import java.net.URI;

@Path("/")
public class RootResource {
  @GET
  public Response redirect() {
    return Response.temporaryRedirect(URI.create("http://localhost:5173")).build();
  }
}
