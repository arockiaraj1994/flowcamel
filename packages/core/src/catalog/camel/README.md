# Camel component catalog

Synced from the same Maven artifact Apache Karavan uses:

`org.apache.camel:camel-catalog:4.5.0`

Sources inside the JAR:

- `org/apache/camel/catalog/components.properties`
- `org/apache/camel/catalog/components/*.json`

Regenerate after bumping `camel.version` in the generator POM:

```bash
pnpm catalog:sync
```

Outputs:

- `components.json` — array of components (deprecated and `kamelet` excluded, `componentProperties` stripped), same rules as Karavan `CamelComponentsGenerator`
- `version.json` — sync metadata

Implementation plan (Karavan-aligned phases): [docs/CATALOG_PLAN.md](../../../../docs/CATALOG_PLAN.md)
