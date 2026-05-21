package com.flowcamel.core.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.flowcamel.core.model.ConfigEntry;
import com.flowcamel.core.model.ConfigProfile;
import com.flowcamel.core.model.ProjectConfig;
import com.flowcamel.core.model.VaultConfig;
import java.util.List;
import org.junit.jupiter.api.Test;

class ApplicationConfigEmitterTest {
  @Test
  void emitsSecretsAsPlaceholdersOnExport() {
    ProjectConfig config = new ProjectConfig();
    ConfigEntry e = new ConfigEntry();
    e.key = "sftp.password";
    e.value = "dev-secret";
    e.secret = true;
    config.defaultEntries = List.of(e);

    String yaml = ApplicationConfigEmitter.buildApplicationYml("demo", config, true);
    assertTrue(yaml.contains("password: ${sftp.password}"));
    assertTrue(!yaml.contains("dev-secret"));
  }

  @Test
  void mergesDevProfileIntoProperties() {
    ProjectConfig config = new ProjectConfig();
    ConfigEntry host = new ConfigEntry();
    host.key = "sftp.host";
    host.value = "prod.example.com";
    config.defaultEntries = List.of(host);

    ConfigProfile dev = new ConfigProfile();
    dev.name = "dev";
    ConfigEntry override = new ConfigEntry();
    override.key = "sftp.host";
    override.value = "localhost";
    dev.entries = List.of(override);
    config.profiles = List.of(dev);

    String props = ApplicationConfigEmitter.buildApplicationProperties(config, "dev");
    assertTrue(props.contains("sftp.host=localhost"));
    assertTrue(!props.contains("prod.example.com"));
  }
}
