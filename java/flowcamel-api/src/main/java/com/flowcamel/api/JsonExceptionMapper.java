package com.flowcamel.api;

import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.util.Map;

@Provider
public class JsonExceptionMapper implements ExceptionMapper<JsonProcessingException> {
  @Override
  public Response toResponse(JsonProcessingException exception) {
    String message = exception.getOriginalMessage();
    if (message == null || message.isBlank()) {
      message = "Invalid JSON request body";
    }
    return Response.status(400).entity(Map.of("error", message)).build();
  }
}
