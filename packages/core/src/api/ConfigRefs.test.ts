import { describe, expect, it } from 'vitest';
import { CONFIG_REF_PREFIX, isConfigRef, resolvePropForEmit } from './ConfigRefs.js';
import { fillUriTemplate } from './UriBuilder.js';

describe('ConfigRefs', () => {
  it('detects designer references', () => {
    expect(isConfigRef(`${CONFIG_REF_PREFIX}sftp.password`)).toBe(true);
    expect(isConfigRef('plain')).toBe(false);
  });

  it('emits Spring placeholders in URIs', () => {
    const uri = fillUriTemplate('sftp://{{props.host}}?password={{props.password}}', {
      host: 'localhost',
      password: `${CONFIG_REF_PREFIX}sftp.password`,
    });
    expect(uri).toContain('password=${sftp.password}');
    expect(resolvePropForEmit(`${CONFIG_REF_PREFIX}sftp.password`)).toBe('${sftp.password}');
  });
});
