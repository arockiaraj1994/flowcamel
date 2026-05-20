import { ProjectMeta } from '@flowcamel/core';
import { useNavigate } from 'react-router-dom';

interface Props {
  project: ProjectMeta;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: Props) {
  const navigate = useNavigate();

  return (
    <div className="fc-project-card" onClick={() => navigate(`/project/${project.id}`)}>
      <div className="fc-project-card__name">{project.name}</div>
      <div className="fc-project-card__meta">
        {project.graph.nodes.length} blocks · Updated {new Date(project.updatedAt).toLocaleDateString()}
      </div>
      <button
        className="fc-project-card__delete"
        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
        title="Delete"
      >
        <i className="ti ti-trash" />
      </button>
    </div>
  );
}
