/** Single application property (Spring Boot / Camel externalized config). */
export interface ConfigEntry {
  key: string;
  value: string;
  secret?: boolean;
  description?: string;
}

export type VaultProvider = 'none' | 'aws' | 'azure';

export interface VaultConfig {
  provider: VaultProvider;
  /** AWS Secrets Manager secret id prefix or Azure vault name hint for generated README/import. */
  secretId?: string;
}

/** Per-environment overrides emitted as application-{profile}.yml at export. */
export interface ConfigProfile {
  name: string;
  label?: string;
  entries: ConfigEntry[];
}

export interface ProjectConfig {
  default: ConfigEntry[];
  /** Profile names to include at export (e.g. dev, prod). */
  exportProfiles?: string[];
  profiles?: ConfigProfile[];
  vault?: VaultConfig;
}
