# FlowCamel

Visual builder for [Apache Camel](https://camel.apache.org/) integrations. Design flows on a canvas, configure components with guided wizards, test routes locally, and export a runnable **Spring Boot 3 + Camel 4** Maven project.

## Features

- **Drag-and-drop canvas** — 19 MVP blocks (SFTP, Kafka, HTTP, JMS, EIP processors, and more)
- **Catalog-driven URIs** — aligned with Camel 4.5 catalog (Karavan-style `uri` + `parameters` in YAML)
- **Test run** — streams logs from Camel JBang (`camel run`) in the designer
- **Generate project** — ZIP with `mvnw`, `README.md`, `routes.camel.yaml`, and Spring Boot wiring (`camel-yaml-dsl-starter`)

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Java 21+** — only needed to run a *generated* project locally (not for the designer itself)

Optional for **test run** in the designer (pick one):

- JBang + Camel app (`pnpm setup:camel`), or
- Docker / Podman with `apache/camel-jbang:4.5.0`

## Quick start

```bash
git clone git@github.com:arockiaraj1994/flowcamel.git
cd flowcamel
pnpm install
pnpm build
pnpm dev
```

Open **http://localhost:5173** (frontend). API runs on **http://localhost:3001**.

| Command | Description |
|---------|-------------|
| `pnpm dev` | Frontend + backend (watch mode) |
| `pnpm build` | Build core, generator, and frontend |
| `pnpm type-check` | TypeScript across packages |
| `pnpm catalog:sync` | Refresh Camel catalog JSON from Maven |
| `pnpm setup:camel` | Install Camel via JBang for test run |

Skip JBang on install: `SKIP_CAMEL_JBANG=1 pnpm install`

## Using the designer

1. Create a project and add blocks from the palette.
2. Connect nodes and complete the **wizard** in the right panel.
3. **Save** the graph, then **Test run** to validate with JBang (optional).
4. **Generate project** → download a ZIP.

### Generated project

After unzip:

```bash
chmod +x mvnw
./mvnw spring-boot:run
```

Routes live at `src/main/resources/camel/routes.camel.yaml` and are loaded automatically by Spring Boot.

## Monorepo layout

```
flowcamel/
├── packages/
│   ├── core/           # Flow graph, catalog, YAML/Java route emitters, validation
│   ├── generator/      # Spring Boot ZIP + Maven wrapper templates
│   ├── designer/       # React Flow canvas and property UI
│   └── app/
│       ├── backend/    # Express API + SQLite
│       └── frontend/   # Vite SPA
├── scripts/            # Catalog sync, JBang/Camel setup
└── docs/               # Catalog parity plan (CATALOG_PLAN.md)
```

## API (summary)

| Method | Path | Purpose |
|--------|------|---------|
| `GET/POST` | `/api/projects` | List / create projects |
| `GET/PUT/DELETE` | `/api/projects/:id` | Load / update / delete |
| `POST` | `/api/generate` | Download Spring Boot ZIP |
| `POST` | `/api/test-run` | Stream JBang test run (NDJSON) |
| `GET` | `/api/catalog/meta` | Catalog version and featured blocks |

See [HANDOVER.md](HANDOVER.md) for full API notes, block list, and contributor guidance.

## Catalog and Camel version

- **Camel / Spring Boot in generated apps:** 4.5.0 / 3.2.5
- Sync catalog: `pnpm catalog:sync` (writes `packages/core/src/catalog/camel/components.json`)
- Roadmap: [docs/CATALOG_PLAN.md](docs/CATALOG_PLAN.md)

## Contributing

Internal handover and architecture notes: [HANDOVER.md](HANDOVER.md).

## License

Apache Camel and related components are licensed under the Apache License 2.0. This repository’s license file may be added separately; check the repo root for `LICENSE` if present.
