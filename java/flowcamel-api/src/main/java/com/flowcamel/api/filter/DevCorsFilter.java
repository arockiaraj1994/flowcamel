package com.flowcamel.api.filter;

import jakarta.annotation.Priority;
import jakarta.ws.rs.HttpMethod;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.io.IOException;

/**
 * Permissive CORS for the local designer (Vite ports 5173, 5174, …).
 * Quarkus built-in CORS regex origins are unreliable across versions; this filter echoes the request Origin.
 */
@Provider
@PreMatching
@Priority(1)
public class DevCorsFilter implements ContainerRequestFilter, ContainerResponseFilter {

  private static String resolveOrigin(ContainerRequestContext request) {
    String origin = request.getHeaderString("Origin");
    if (origin == null || origin.isBlank()) {
      return "http://localhost:5173";
    }
    return origin;
  }

  private static void applyCors(ContainerRequestContext request, MultivaluedMap<String, Object> headers) {
    String origin = resolveOrigin(request);
    headers.putSingle("Access-Control-Allow-Origin", origin);
    headers.putSingle("Vary", "Origin");
    headers.putSingle("Access-Control-Allow-Credentials", "true");
    headers.putSingle("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    headers.putSingle(
        "Access-Control-Allow-Headers",
        "accept, authorization, content-type, x-requested-with, origin");
    headers.putSingle("Access-Control-Expose-Headers", "Content-Disposition");
    headers.putSingle("Access-Control-Max-Age", "86400");
  }

  @Override
  public void filter(ContainerRequestContext request) throws IOException {
    if (HttpMethod.OPTIONS.equalsIgnoreCase(request.getMethod())) {
      String origin = resolveOrigin(request);
      request.abortWith(
          Response.status(Response.Status.NO_CONTENT)
              .header("Access-Control-Allow-Origin", origin)
              .header("Vary", "Origin")
              .header("Access-Control-Allow-Credentials", "true")
              .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
              .header(
                  "Access-Control-Allow-Headers",
                  "accept, authorization, content-type, x-requested-with, origin")
              .header("Access-Control-Expose-Headers", "Content-Disposition")
              .header("Access-Control-Max-Age", "86400")
              .build());
    }
  }

  @Override
  public void filter(ContainerRequestContext request, ContainerResponseContext response) {
    applyCors(request, response.getHeaders());
  }
}
