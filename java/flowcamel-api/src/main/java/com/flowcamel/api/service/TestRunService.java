package com.flowcamel.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowcamel.core.config.ApplicationConfigEmitter;
import com.flowcamel.core.graph.GraphValidator;
import com.flowcamel.core.model.FlowGraph;
import com.flowcamel.core.model.ProjectMeta;
import com.flowcamel.core.model.ValidationResult;
import com.flowcamel.core.yaml.RouteYamlEmitter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class TestRunService {
  private static final String CAMEL_JBANG_VERSION = "4.5.0";
  private static final String CAMEL_DOCKER_IMAGE = "apache/camel-jbang:" + CAMEL_JBANG_VERSION;
  private static final List<String> RUN_TRAILING = List.of("--max-messages=5", "--logging-level=info");
  /** Karavan / Unix convention when the user stops a dev run. */
  private static final int EXIT_USER_STOPPED = 130;

  @ConfigProperty(name = "flowcamel.test-run.timeout-seconds", defaultValue = "300")
  long timeoutSeconds;

  @Inject ProjectService projectService;
  @Inject ObjectMapper objectMapper;

  private final ConcurrentHashMap<String, ActiveRun> activeByProject = new ConcurrentHashMap<>();

  public void stream(String projectId, LineWriter writer) throws Exception {
    Optional<ProjectMeta> meta = projectService.get(projectId);
    if (meta.isEmpty()) {
      writeEvent(writer, Map.of("type", "error", "message", "Project not found: " + projectId));
      return;
    }
    streamGraph(projectId, meta.get().graph, writer);
  }

  /** Stop the active test run for a project (Karavan-style Stop / JBang {@code run --stop}). */
  public boolean stop(String projectId) {
    if (projectId == null || projectId.isBlank()) return false;
    ActiveRun run = activeByProject.remove(projectId);
    if (run == null) return false;
    run.stopped = true;
    terminateRun(run);
    return true;
  }

  public boolean isRunning(String projectId) {
    return projectId != null && activeByProject.containsKey(projectId);
  }

  public void streamGraph(String projectId, FlowGraph graph, LineWriter writer) throws Exception {
    stop(projectId);

    ValidationResult validation = GraphValidator.validateForYamlExport(graph);
    if (!validation.valid()) {
      writeEvent(writer, Map.of("type", "error", "message", String.join("\n", validation.errors())));
      return;
    }
    String yaml = RouteYamlEmitter.graphToYamlRoutes(graph);
    writeEvent(writer, Map.of("type", "yaml", "content", yaml));

    Path workDir = Files.createTempDirectory("flowcamel-run-");
    Path yamlPath = workDir.resolve("routes.camel.yaml");
    ActiveRun run = new ActiveRun(projectId, workDir);
    activeByProject.put(projectId, run);
    try {
      Files.writeString(yamlPath, yaml);
      String propsContent = ApplicationConfigEmitter.buildApplicationProperties(graph.config, "dev");
      if (!propsContent.isBlank()) {
        Files.writeString(workDir.resolve("application.properties"), propsContent);
        writeEvent(
            writer,
            Map.of(
                "type",
                "log",
                "time",
                formatTime(),
                "level",
                "info",
                "msg",
                "[flowcamel] Wrote application.properties (dev profile defaults for JBang)"));
      }
      RunInvocation inv = resolveRunInvocation("routes.camel.yaml", workDir);
      run.invocation = inv;
      writeEvent(
          writer,
          Map.of(
              "type",
              "log",
              "time",
              formatTime(),
              "level",
              "info",
              "msg",
              "[flowcamel] " + inv.runtime + ": " + inv.command + " " + String.join(" ", inv.args)));

      if ("docker".equals(inv.runtime) || "podman".equals(inv.runtime)) {
        writeEvent(
            writer,
            Map.of(
                "type",
                "log",
                "time",
                formatTime(),
                "level",
                "info",
                "msg",
                "[flowcamel] First " + inv.runtime + " run may pull " + CAMEL_DOCKER_IMAGE));
      } else if ("jbang".equals(inv.runtime) || "camel".equals(inv.runtime)) {
        writeEvent(
            writer,
            Map.of(
                "type",
                "log",
                "time",
                formatTime(),
                "level",
                "info",
                "msg",
                "[flowcamel] First "
                    + inv.runtime
                    + " run downloads Camel "
                    + CAMEL_JBANG_VERSION
                    + " (up to "
                    + timeoutSeconds
                    + "s). Warm cache once: pnpm setup:camel"));
      }

      long timeoutMs = timeoutSeconds * 1000;
      ProcessBuilder pb = new ProcessBuilder();
      pb.command(buildCommand(inv));
      pb.directory(workDir.toFile());
      pb.redirectErrorStream(false);
      Process process = pb.start();
      run.process = process;

      Thread out =
          new Thread(
              () -> pump(process.getInputStream(), "stdout", writer, run),
              "flowcamel-testrun-stdout");
      Thread err =
          new Thread(
              () -> pump(process.getErrorStream(), "stderr", writer, run),
              "flowcamel-testrun-stderr");
      out.start();
      err.start();

      long started = System.currentTimeMillis();
      long deadline = started + timeoutMs;
      while (process.isAlive() && System.currentTimeMillis() < deadline) {
        if (run.stopped) break;
        process.waitFor(250, TimeUnit.MILLISECONDS);
      }

      boolean timedOut = process.isAlive() && !run.stopped && System.currentTimeMillis() >= deadline;
      if (process.isAlive()) {
        destroyProcess(process);
      }
      out.join(2000);
      err.join(2000);

      int exitCode;
      if (run.stopped) {
        exitCode = EXIT_USER_STOPPED;
      } else if (timedOut) {
        exitCode = 124;
      } else {
        exitCode = process.exitValue();
      }
      long durationMs = System.currentTimeMillis() - started;

      if (run.stopped) {
        writeEvent(
            writer,
            Map.of(
                "type",
                "log",
                "time",
                formatTime(),
                "level",
                "warn",
                "msg",
                "[flowcamel] Test run stopped by user."));
      } else if (timedOut) {
        writeEvent(
            writer,
            Map.of(
                "type",
                "log",
                "time",
                formatTime(),
                "level",
                "warn",
                "msg",
                "[flowcamel] Test run stopped after "
                    + timeoutSeconds
                    + "s timeout. If JBang was still resolving dependencies, run `pnpm setup:camel` and try again."));
      }
      writeEvent(
          writer,
          Map.of(
              "type",
              "log",
              "time",
              formatTime(),
              "level",
              exitCode == 0 ? "info" : "err",
              "msg",
              "[flowcamel] Process exited with code " + exitCode + " (" + durationMs + "ms)"));
      writeEvent(writer, Map.of("type", "done", "exitCode", exitCode, "durationMs", durationMs));
    } catch (Exception e) {
      if (!run.stopped) {
        writeEvent(
            writer,
            Map.of("type", "error", "message", e.getMessage() != null ? e.getMessage() : "Test run failed"));
      }
    } finally {
      activeByProject.remove(projectId, run);
      if (run.stopped) {
        runCamelJbangStop();
      }
      deleteRecursive(workDir);
    }
  }

  private void terminateRun(ActiveRun run) {
    Process process = run.process;
    if (process != null && process.isAlive()) {
      destroyProcess(process);
    }
    runCamelJbangStop();
  }

  /** Karavan: {@code camel run --stop} tears down JBang dev processes. */
  private void runCamelJbangStop() {
    Optional<String> jbang = findJbang();
    if (jbang.isEmpty()) {
      findOnPath("camel").ifPresent(cmd -> runStopCommand(cmd, List.of("run", "--stop")));
      return;
    }
    runStopCommand(
        jbang.get(),
        List.of(
            "-Dcamel.jbang.version=" + CAMEL_JBANG_VERSION,
            "camel@apache/camel",
            "run",
            "--stop"));
  }

  private void runStopCommand(String command, List<String> args) {
    try {
      List<String> cmd = new ArrayList<>();
      cmd.add(command);
      cmd.addAll(args);
      Process p = new ProcessBuilder(cmd).redirectErrorStream(true).start();
      p.waitFor(20, TimeUnit.SECONDS);
    } catch (Exception ignored) {
    }
  }

  private static void destroyProcess(Process process) {
    try {
      process.descendants().forEach(h -> h.destroyForcibly());
    } catch (Exception ignored) {
    }
    process.destroyForcibly();
  }

  private List<String> buildCommand(RunInvocation inv) {
    List<String> cmd = new ArrayList<>();
    cmd.add(inv.command);
    cmd.addAll(inv.args);
    return cmd;
  }

  private void pump(
      java.io.InputStream stream, String streamName, LineWriter writer, ActiveRun run) {
    try (BufferedReader reader =
        new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
      String line;
      while ((line = reader.readLine()) != null && !run.stopped) {
        if (line.isBlank()) continue;
        String level =
            "stderr".equals(streamName) && !line.contains("INFO") ? logLevel(line) : logLevel(line);
        writeEvent(writer, Map.of("type", "log", "time", formatTime(), "level", level, "msg", line));
      }
    } catch (Exception ignored) {
    }
  }

  private RunInvocation resolveRunInvocation(String yamlFileName, Path workDir) throws Exception {
    Optional<String> camel = findOnPath("camel");
    if (camel.isPresent()) {
      List<String> args = new ArrayList<>();
      args.add("run");
      args.add(yamlFileName);
      args.addAll(RUN_TRAILING);
      return new RunInvocation(camel.get(), args, "camel");
    }

    Optional<String> jbang = findJbang();
    if (jbang.isPresent()) {
      List<String> args = new ArrayList<>();
      args.add("-Dcamel.jbang.version=" + CAMEL_JBANG_VERSION);
      args.add("camel@apache/camel");
      args.add("run");
      args.add(yamlFileName);
      args.addAll(RUN_TRAILING);
      return new RunInvocation(jbang.get(), args, "jbang");
    }

    List<String> dockerArgs = new ArrayList<>();
    dockerArgs.add("run");
    dockerArgs.add("--rm");
    dockerArgs.add("-v");
    dockerArgs.add(workDir.toAbsolutePath() + ":/work");
    dockerArgs.add("-w");
    dockerArgs.add("/work");
    dockerArgs.add(CAMEL_DOCKER_IMAGE);
    dockerArgs.add("run");
    dockerArgs.add(yamlFileName);
    dockerArgs.addAll(RUN_TRAILING);

    if (commandExists("docker")) return new RunInvocation("docker", dockerArgs, "docker");
    if (commandExists("podman")) return new RunInvocation("podman", dockerArgs, "podman");

    throw new IllegalStateException(installHint());
  }

  private Optional<String> findOnPath(String cmd) {
    String path = System.getenv("PATH");
    if (path == null) return Optional.empty();
    for (String dir : path.split(":")) {
      Path p = Path.of(dir, cmd);
      if (Files.isExecutable(p)) return Optional.of(p.toString());
    }
    return Optional.empty();
  }

  private Optional<String> findJbang() {
    Optional<String> onPath = findOnPath("jbang");
    if (onPath.isPresent()) return onPath;
    Path home = Path.of(System.getProperty("user.home"), ".jbang", "bin", "jbang");
    if (Files.isExecutable(home)) return Optional.of(home.toString());
    return Optional.empty();
  }

  private boolean commandExists(String cmd) {
    try {
      Process p = new ProcessBuilder(cmd, "version").start();
      return p.waitFor(8, TimeUnit.SECONDS) && p.exitValue() == 0;
    } catch (Exception e) {
      return false;
    }
  }

  private static String installHint() {
    return """
        Camel JBang is required for Test run.

        Option A — install JBang + Camel:
          curl -Ls https://sh.jbang.dev | bash -s - app setup
          jbang app install -Dcamel.jbang.version=%s camel@apache/camel

        Option B — Docker:
          docker pull %s
        """
        .formatted(CAMEL_JBANG_VERSION, CAMEL_DOCKER_IMAGE);
  }

  private static String formatTime() {
    LocalTime t = LocalTime.now();
    return t.format(DateTimeFormatter.ofPattern("HH:mm:ss"))
        + "."
        + String.format("%03d", t.getNano() / 1_000_000);
  }

  private static String logLevel(String line) {
    String u = line.toUpperCase();
    if (u.contains(" ERROR ") || u.startsWith("ERROR") || u.contains("EXCEPTION")) return "err";
    if (u.contains(" WARN ") || u.startsWith("WARN")) return "warn";
    return "info";
  }

  private void writeEvent(LineWriter writer, Map<String, Object> event) throws Exception {
    writer.writeLine(objectMapper.writeValueAsString(event));
  }

  private void deleteRecursive(Path dir) {
    try {
      if (Files.exists(dir)) {
        Files.walk(dir)
            .sorted(Comparator.reverseOrder())
            .forEach(
                p -> {
                  try {
                    Files.deleteIfExists(p);
                  } catch (Exception ignored) {
                  }
                });
      }
    } catch (Exception ignored) {
    }
  }

  public interface LineWriter {
    void writeLine(String line) throws Exception;
  }

  private static final class ActiveRun {
    final String projectId;
    final Path workDir;
    volatile boolean stopped;
    volatile Process process;
    volatile RunInvocation invocation;

    ActiveRun(String projectId, Path workDir) {
      this.projectId = projectId;
      this.workDir = workDir;
    }
  }

  private record RunInvocation(String command, List<String> args, String runtime) {}
}
