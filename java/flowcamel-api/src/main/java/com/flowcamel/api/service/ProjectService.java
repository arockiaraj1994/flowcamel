package com.flowcamel.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.ProjectMeta;
import io.agroal.api.AgroalDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ProjectService {
  @Inject AgroalDataSource dataSource;
  @Inject ObjectMapper objectMapper;

  public List<ProjectMeta> list() throws SQLException {
    try (var c = dataSource.getConnection();
        var st = c.prepareStatement("SELECT * FROM projects ORDER BY updated_at DESC");
        ResultSet rs = st.executeQuery()) {
      List<ProjectMeta> out = new ArrayList<>();
      while (rs.next()) out.add(mapRow(rs));
      return out;
    }
  }

  public Optional<ProjectMeta> get(String id) throws SQLException {
    try (var c = dataSource.getConnection();
        var st = c.prepareStatement("SELECT * FROM projects WHERE id = ?")) {
      st.setString(1, id);
      try (ResultSet rs = st.executeQuery()) {
        if (!rs.next()) return Optional.empty();
        return Optional.of(mapRow(rs));
      }
    }
  }

  public ProjectMeta create(String name, FlowGraph graph) throws SQLException {
    String id = UUID.randomUUID().toString();
    String now = Instant.now().toString();
    if (graph == null) graph = emptyGraph(name);
    graph.id = id;
    graph.name = name;
    insert(id, name, graph, now, now);
    return get(id).orElseThrow(() -> new SQLException("Failed to load created project"));
  }

  public Optional<ProjectMeta> update(String id, String name, FlowGraph graph) throws SQLException {
    Optional<ProjectMeta> existing = get(id);
    if (existing.isEmpty()) return Optional.empty();
    ProjectMeta ex = existing.get();
    String newName = name != null ? name : ex.name;
    FlowGraph newGraph = graph != null ? graph : ex.graph;
    newGraph.id = id;
    newGraph.name = newName;
    String now = Instant.now().toString();
    try (var c = dataSource.getConnection();
        var st =
            c.prepareStatement("UPDATE projects SET name = ?, graph_json = ?, updated_at = ? WHERE id = ?")) {
      st.setString(1, newName);
      try {
        st.setString(2, objectMapper.writeValueAsString(newGraph));
      } catch (Exception e) {
        throw new SQLException("Failed to serialize graph", e);
      }
      st.setString(3, now);
      st.setString(4, id);
      st.executeUpdate();
    }
    return get(id);
  }

  public boolean delete(String id) throws SQLException {
    try (var c = dataSource.getConnection();
        var st = c.prepareStatement("DELETE FROM projects WHERE id = ?")) {
      st.setString(1, id);
      return st.executeUpdate() > 0;
    }
  }

  private void insert(String id, String name, FlowGraph graph, String created, String updated)
      throws SQLException {
    try (var c = dataSource.getConnection();
        var st =
            c.prepareStatement(
                "INSERT INTO projects (id, name, graph_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")) {
      st.setString(1, id);
      st.setString(2, name);
      st.setString(3, objectMapper.writeValueAsString(graph));
      st.setString(4, created);
      st.setString(5, updated);
      st.executeUpdate();
    } catch (Exception e) {
      throw new SQLException("Failed to serialize graph", e);
    }
  }

  private ProjectMeta mapRow(ResultSet rs) throws SQLException {
    try {
      ProjectMeta m = new ProjectMeta();
      m.id = rs.getString("id");
      m.name = rs.getString("name");
      m.createdAt = rs.getString("created_at");
      m.updatedAt = rs.getString("updated_at");
      m.graph = objectMapper.readValue(rs.getString("graph_json"), FlowGraph.class);
      return m;
    } catch (Exception e) {
      throw new SQLException("Failed to parse project graph", e);
    }
  }

  private static FlowGraph emptyGraph(String name) {
    FlowGraph g = new FlowGraph();
    g.name = name;
    return g;
  }
}
