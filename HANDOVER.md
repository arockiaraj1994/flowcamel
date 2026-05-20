# FlowCamel — Agent Handover

Visual Apache Camel flow builder. Users drag blocks onto a canvas, configure them in plain English, and download a Spring Boot + Camel Maven ZIP.

## Quick start

```bash
pnpm install      # also installs Camel JBang for test run when JBang is on PATH
pnpm dev          # frontend :5173, backend :3001
pnpm type-check
```

**Test run runtime** (pick one):

```bash
# A) Auto on pnpm install (tries JBang curl installer + camel app)
pnpm install

# B) Manual JBang + Camel
curl -Ls https://sh.jbang.dev | bash -s - app setup
export PATH="$PATH:$HOME/.jbang/bin"
pnpm setup:camel

# C) Docker only (no JBang) — test run uses apache/camel-jbang:4.5.0 automatically
docker pull apache/camel-jbang:4.5.0

# Skip: SKIP_CAMEL_JBANG=1 pnpm install
```

## API (fully implemented — not stubs)

All routes are wired to SQLite (`better-sqlite3`) and the real generator.

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/projects` | — | `ProjectMeta[]` |
| POST | `/api/projects` | `{ name, graph? }` | `ProjectMeta` (201) |
| GET | `/api/projects/:id` | — | `ProjectMeta` with `graph` |
| PUT | `/api/projects/:id` | `{ name?, graph? }` | `ProjectMeta` |
| DELETE | `/api/projects/:id` | — | `{ success: true }` |
| POST | `/api/generate` | `{ projectId }` | Spring Boot ZIP (`mvnw`, `README.md`, `routes.camel.yaml`, …); 400 if `validateForYamlExport` fails |
| GET | `/api/health` | — | `{ status: "ok" }` |
| GET | `/api/catalog/meta` | — | Catalog version, Maven coords, featured blocks |

Frontend client: [`packages/app/frontend/src/api/backendClient.ts`](packages/app/frontend/src/api/backendClient.ts). Vite proxies `/api` → `http://localhost:3001`.

**Persistence:** The editor syncs canvas state to the API via [`syncGraphFromCanvas`](packages/app/frontend/src/features/project/syncGraphFromCanvas.ts). Use **Save** (when dirty) or **Generate** (saves full graph before ZIP).

**Generated ZIP:** [`graphToYamlRoutes`](packages/core/src/api/RouteYamlEmitter.ts) → `src/main/resources/camel/routes.camel.yaml`; Spring Boot loads via `camel-yaml-dsl-starter`. Includes Maven Wrapper (`mvnw`) and `README.md` with `./mvnw spring-boot:run`. Gated by [`validateForYamlExport`](packages/core/src/api/GraphValidator.ts).

**Test run (dev mode, Karavan-aligned):** `POST /api/test-run` writes `routes.camel.yaml` to a temp dir and runs `camel run` (or `jbang -Dcamel.jbang.version=4.5.0 camel@apache/camel run … --max-messages=5 --logging-level=info`). Camel JBang is installed via `pnpm install` / `pnpm setup:camel` when JBang is available. Response is NDJSON (`yaml`, `log`, `done` events).

## Property forms UX (canonical)

**Wizard-first** (not per-block React Hook Form panels):

- Right panel: [`WizardPanel`](packages/designer/src/panel/WizardPanel.tsx) — schema-driven steps from `blocks.json` (`q`, `help`, `props`)
- Wizard only (default) in the right panel
- Advanced: [`ConfigModal`](packages/app/frontend/src/features/project/ConfigModal.tsx) — all fields in one grid

Legacy RHF forms under [`packages/designer/src/forms/`](packages/designer/src/forms/) exist for reference/tests but are **not** mounted in `PropertyPanel`. Do not re-wire without an explicit product decision.

## Block catalog (19 blocks — current MVP)

Source of truth: [`packages/core/src/catalog/blocks.json`](packages/core/src/catalog/blocks.json).

### SOURCE (6)

| type | label |
|------|-------|
| `sftp-source` | SFTP / FTP |
| `timer-source` | Timer |
| `http-source` | HTTP Endpoint |
| `file-source` | File Watcher |
| `kafka-source` | Kafka Consumer |
| `jms-source` | JMS / ActiveMQ |

### ACTION (7)

| type | label |
|------|-------|
| `filter-action` | Filter |
| `transform-action` | Transform |
| `split-action` | Split records |
| `log-action` | Log / Print |
| `rest-call-action` | REST call |
| `xslt-action` | XSLT transform |
| `json-xml-action` | JSON ↔ XML |

### DESTINATION (6)

| type | label |
|------|-------|
| `email-dest` | Send email |
| `log-dest` | Logger |
| `db-dest` | Save to DB |
| `kafka-dest` | Kafka topic |
| `http-dest` | HTTP call |
| `jms-dest` | JMS / ActiveMQ |

Prop field types in catalog: `text`, `number`, `password`, `select`, `chips`, `radio`, `textarea` (extends original handover `PropSchema`).

## Package map

| Package | Role |
|---------|------|
| `@flowcamel/core` | Models, `blocks.json`, BlockRegistry, GraphValidator, GraphSerializer |
| `@flowcamel/generator` | Handlebars templates → ZIP |
| `@flowcamel/designer` | React Flow canvas, BlockPanel, PropertyPanel |
| `backend` | Express + SQLite |
| `frontend` | Vite SPA |

## Camel catalog (Maven — same as Karavan)

Karavan loads `org.apache.camel:camel-catalog` from Maven and materializes `metadata/components.json`. FlowCamel does the same at build time:

```bash
pnpm catalog:sync   # downloads camel-catalog-4.5.0.jar, writes packages/core/src/catalog/camel/components.json
```

- **Maven:** `org.apache.camel:camel-catalog:4.5.0` (matches generator `camel.version`)
- **Registry:** `CatalogRegistry.ts` — `consumerOnly` / `producerOnly` → SOURCE / DESTINATION
- **POM deps:** `getMavenStarter()` uses catalog `artifactId`
- **URI / DSL:** `blocks.json` `camelUri` templates + `RouteDsl.ts` EIP registry (not Kamelets)
- **Full roadmap:** [docs/CATALOG_PLAN.md](docs/CATALOG_PLAN.md) — Karavan parity phases 0–6

## Adding a block

1. Entry in `blocks.json` (with `scheme` matching catalog)
2. EIP entry in `eips.json` if ACTION with custom DSL
3. Optional subtitle logic in `ProjectPage.tsx` `deriveSubtitle`
4. Run `pnpm catalog:sync` after Camel version bumps

## Out of scope (MVP)

Auth, Git, deploy, K8s, real LLM backend. Chat/explain panels are lightweight UI helpers only.
