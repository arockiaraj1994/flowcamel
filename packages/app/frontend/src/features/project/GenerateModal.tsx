import { useState } from 'react';
import type { FlowGraph } from '@flowcamel/core';
import { validateForYamlExport } from '@flowcamel/core';
import { generateProjectZip, updateProject } from '../../api/backendClient.js';
import { useAppStore } from '../../stores/appStore.js';
import axios from 'axios';

interface Props {
  projectId: string;
  graph: FlowGraph;
  onClose: () => void;
  onSaved?: (graph: FlowGraph) => void;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: '8px 10px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'lowercase' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

export function GenerateModal({ projectId, graph, onClose, onSaved }: Props) {
  const notify = useAppStore((s) => s.notify);
  const [generating, setGenerating] = useState(false);
  const yamlValidation = validateForYamlExport(graph);
  const projectName = graph.name;
  const blockCount = graph.flows.reduce((n, f) => n + f.nodes.length, 0);
  const connectionCount = graph.flows.reduce((n, f) => n + f.edges.length, 0);
  const flowCount = graph.flows.length;
  const slug = (projectName || 'flow-project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const pkg = `com.flowcamel.${slug.replace(/-/g, '')}`;
  const sizeKB = 28 + blockCount * 2 + connectionCount + flowCount;

  const pkgPath = pkg.replace(/\./g, '/');
  const tree = [
    { name: slug, type: 'dir', depth: 0 },
    { name: 'README.md', type: 'file', depth: 1, size: '1.2 KB' },
    { name: 'mvnw', type: 'file', depth: 1, size: '12 KB' },
    { name: 'pom.xml', type: 'file', depth: 1, size: '2.1 KB' },
    { name: 'docker-compose.yml', type: 'file', depth: 1, size: '0.6 KB' },
    { name: 'src', type: 'dir', depth: 1 },
    { name: 'main', type: 'dir', depth: 2 },
    { name: 'java', type: 'dir', depth: 3 },
    { name: pkgPath, type: 'dir', depth: 4 },
    { name: 'Application.java', type: 'file', depth: 5, size: '0.5 KB' },
    { name: 'resources', type: 'dir', depth: 3 },
    { name: 'application.yml', type: 'file', depth: 4, size: '0.9 KB' },
    ...(graph.config?.exportProfiles ?? []).map((p) => ({
      name: `application-${p}.yml`,
      type: 'file' as const,
      depth: 4,
      size: '0.4 KB',
    })),
    { name: 'camel', type: 'dir', depth: 4 },
    { name: 'routes.camel.yaml', type: 'file', depth: 5, size: `${(0.8 + flowCount * 0.4 + blockCount * 0.15).toFixed(1)} KB` },
  ];

  async function handleDownload() {
    if (!yamlValidation.valid) {
      notify('error', yamlValidation.errors[0] ?? 'Fix validation errors before generating.');
      return;
    }
    setGenerating(true);
    try {
      const updated = await updateProject(projectId, { name: projectName, graph });
      onSaved?.(updated.graph);
      const blob = await generateProjectZip(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      notify('success', 'Project ZIP downloaded. Run with ./mvnw spring-boot:run');
      onClose();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && typeof err.response?.data?.error === 'string'
          ? err.response.data.error
          : 'Failed to generate project.';
      notify('error', msg.split('\n')[0] ?? msg);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 540 }}>
        <div className="modal-head">
          <div className="node-icon" style={{ background: 'var(--teal-bg)', color: 'var(--accent)', width: 32, height: 32, fontSize: 16 }}>
            <i className="ti ti-package-export" />
          </div>
          <div className="modal-title" style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>Generate project</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 400 }}>Spring Boot 3 · Apache Camel 4.x</div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div className="field-label">project name</div>
              <div style={{ padding: '8px 10px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', fontSize: 12 }}>{slug}</div>
            </div>
            <div>
              <div className="field-label">package</div>
              <div style={{ padding: '8px 10px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>{pkg}</div>
            </div>
          </div>

          <div className="field-label">what's in the zip</div>
          <div className="zip-tree" style={{ marginTop: 4 }}>
            {tree.map((row, i) => (
              <div key={i} className={`zip-row ${row.type}`} style={{ '--depth': row.depth } as React.CSSProperties}>
                <i className={`ti ${row.type === 'dir' ? 'ti-folder' : 'ti-file-code'}`} />
                <span className="name">{row.name}{row.type === 'dir' ? '/' : ''}</span>
                {row.size && <span className="size">{row.size}</span>}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Stat label="flows" value={flowCount} />
            <Stat label="blocks" value={blockCount} />
            <Stat label="connections" value={connectionCount} />
            <Stat label="zip size" value={`~${sizeKB} KB`} />
          </div>

          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', fontSize: 11, lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
            Includes <code style={{ fontSize: 10 }}>mvnw</code>, <code style={{ fontSize: 10 }}>README.md</code>,{' '}
            <code style={{ fontSize: 10 }}>application.yml</code>
            {(graph.config?.exportProfiles?.length ?? 0) > 0 && (
              <>
                {' '}
                and profile files ({graph.config?.exportProfiles?.join(', ')})
              </>
            )}
            . Secrets export as <code style={{ fontSize: 10 }}>{'${property.key}'}</code> placeholders.
            {(graph.config?.vault?.provider ?? 'none') !== 'none' && (
              <> Vault: {graph.config?.vault?.provider}.</>
            )}
            {' '}After unzip: <code style={{ fontSize: 10 }}>./mvnw spring-boot:run</code>
          </div>

          {!yamlValidation.valid && (
            <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--color-danger-muted, #fef2f2)', borderRadius: 'var(--border-radius-md)', fontSize: 11, color: 'var(--color-danger, #b91c1c)' }}>
              {yamlValidation.errors.slice(0, 3).map((e, i) => (
                <div key={i}>{e}</div>
              ))}
              {yamlValidation.errors.length > 3 && (
                <div>…and {yamlValidation.errors.length - 3} more</div>
              )}
            </div>
          )}
        </div>
        <div className="modal-foot" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleDownload}
            disabled={generating || !yamlValidation.valid}
            title={!yamlValidation.valid ? 'Fix validation errors first' : undefined}
          >
            <i className="ti ti-download" /> {generating ? 'Building…' : `Download ${slug}.zip`}
          </button>
        </div>
      </div>
    </div>
  );
}
