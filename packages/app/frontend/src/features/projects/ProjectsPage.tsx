import { useEffect, useState } from 'react';
import { ProjectMeta } from '@flowcamel/core';
import { useNavigate } from 'react-router-dom';
import { createProject, deleteProject, listProjects } from '../../api/backendClient.js';
import { useAppStore } from '../../stores/appStore.js';
import { NewProjectModal } from './NewProjectModal.js';
import { ProjectCard } from './ProjectCard.js';

// TODO: add tests for project CRUD interactions

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const notify = useAppStore((s) => s.notify);
  const navigate = useNavigate();

  useEffect(() => {
    listProjects().then(setProjects).catch(() => notify('error', 'Failed to load projects.'));
  }, [notify]);

  async function handleCreate(name: string) {
    try {
      const project = await createProject(name);
      navigate(`/project/${project.id}`);
    } catch {
      notify('error', 'Failed to create project.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProject(id);
      setProjects((ps) => ps.filter((p) => p.id !== id));
      notify('success', 'Project deleted.');
    } catch {
      notify('error', 'Failed to delete project.');
    }
  }

  return (
    <div className="fc-projects-page">
      <div className="fc-projects-page__header">
        <h1>My flows</h1>
        <button className="fc-btn fc-btn--primary" onClick={() => setModalOpen(true)}>
          <i className="ti ti-plus" /> New flow
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="fc-projects-page__empty">
          <p>No flows yet. Create your first integration flow.</p>
        </div>
      ) : (
        <div className="fc-projects-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
