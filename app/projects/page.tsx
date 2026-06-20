export const dynamic = 'force-dynamic';

import { getPublishedProjects } from '@/lib/data';
import Nav from '@/components/Nav';
import ProjectsClient from '@/components/ProjectsClient';

export const metadata = {
  title: 'Projects | Swethank',
  description: 'AI systems, research tools, and things built at IIT Bombay.',
};

export default function ProjectsPage() {
  const projects = getPublishedProjects();

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <Nav />
      <ProjectsClient projects={projects} />
    </div>
  );
}
