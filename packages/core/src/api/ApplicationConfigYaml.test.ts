import { describe, expect, it } from 'vitest';
import {
  buildApplicationYamlPreview,
  buildProfileYaml,
  entriesToYamlMap,
} from './ApplicationConfigYaml.js';
import type { ConfigEntry, ProjectConfig } from '../model/ProjectConfig.js';

describe('ApplicationConfigYaml', () => {
  it('nests dot keys deterministically', () => {
    const entries: ConfigEntry[] = [
      { key: 'sftp.host', value: 'files.example.com' },
      { key: 'sftp.password', value: 'secret', secret: true },
      { key: 'sftp.port', value: '22' },
    ];
    const yaml = entriesToYamlMap(entries, true);
    expect(yaml).toContain('sftp:');
    expect(yaml).toContain('host: files.example.com');
    expect(yaml).toContain('password: ${sftp.password}');
    expect(yaml).toContain('port: 22');
  });

  it('builds application preview with vault import', () => {
    const config: ProjectConfig = {
      default: [{ key: 'sftp.username', value: 'dev-user' }],
      vault: { provider: 'aws', secretId: 'my-app/' },
    };
    const yaml = buildApplicationYamlPreview('demo', config);
    expect(yaml).toContain('import: optional:aws-secretsmanager:my-app/');
    expect(yaml).toContain('sftp:');
    expect(yaml).toContain('username: dev-user');
  });

  it('builds profile yaml with activate block', () => {
    const yaml = buildProfileYaml({
      name: 'dev',
      entries: [{ key: 'sftp.host', value: 'localhost' }],
    });
    expect(yaml).toContain('on-profile: dev');
    expect(yaml).toContain('host: localhost');
  });
});
