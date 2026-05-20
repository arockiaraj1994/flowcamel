import { useState } from 'react';
import { useProjectStore } from './ProjectStore.js';
import { generateProjectZip, updateProject } from '../../api/backendClient.js';
import { useAppStore } from '../../stores/appStore.js';

interface Props {
  projectId: string;
}

export function ProjectToolbar({ projectId }: Props) {
  const { graph, setGraphName, isDirty, loadGraph } = useProjectStore();
  const notify = useAppStore((s) => s.notify);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateProject(projectId, { name: graph.name, graph });
      loadGraph(updated.graph);
      notify('success', 'Project saved.');
    } catch {
      notify('error', 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      await updateProject(projectId, { graph });
      const blob = await generateProjectZip(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${graph.name.replace(/\s+/g, '-').toLowerCase()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      notify('success', 'Project ZIP downloaded.');
    } catch {
      notify('error', 'Failed to generate project.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fc-toolbar">
      <input
        className="fc-toolbar__name"
        value={graph.name}
        onChange={(e) => setGraphName(e.target.value)}
        placeholder="Flow name"
      />
      <div className="fc-toolbar__actions">
        {isDirty && (
          <button className="fc-btn fc-btn--secondary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
        <button className="fc-btn fc-btn--primary" onClick={handleGenerate} disabled={generating}>
          <i className="ti ti-download" />
          {generating ? 'Generating…' : 'Generate ZIP'}
        </button>
      </div>
    </div>
  );
}
