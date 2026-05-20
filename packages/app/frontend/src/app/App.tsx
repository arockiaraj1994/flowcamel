import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout.js';
import { ProjectsPage } from '../features/projects/ProjectsPage.js';
import { ProjectPage } from '../features/project/ProjectPage.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ProjectsPage />} />
          <Route path="project/:id" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
