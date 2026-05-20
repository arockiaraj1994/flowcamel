package com.flowcamel.api.db;

import io.agroal.api.AgroalDataSource;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.sql.Connection;
import java.sql.Statement;

@ApplicationScoped
public class DatabaseInitializer {
  @Inject AgroalDataSource dataSource;

  void onStart(@Observes StartupEvent event) throws Exception {
    try (Connection c = dataSource.getConnection(); Statement st = c.createStatement()) {
      st.executeUpdate(
          """
          CREATE TABLE IF NOT EXISTS projects (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            graph_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
          """);
    }
  }
}
