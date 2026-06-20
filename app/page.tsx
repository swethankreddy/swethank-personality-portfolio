import PortfolioPage from '@/components/PortfolioPage';
import { getCurrentStatus, getPublishedProjects, getPublishedWriting, getWorkspaceCards } from '@/lib/data';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ persona?: string }>;
}) {
  const { persona } = await searchParams;
  const initialPersona = persona === 'creator' ? 'creator' : 'builder';
  const currentStatus = getCurrentStatus();
  const workspaceCards = getWorkspaceCards();
  const recentWork = getPublishedProjects().slice(0, 3).map((p) => ({
    id: p.id,
    title: p.title,
    year: p.year,
    link: p.link || undefined,
  }));
  const publishedWriting = getPublishedWriting();
  const latestWriting = publishedWriting[0]
    ? {
        title: publishedWriting[0].title,
        slug: publishedWriting[0].slug,
        tags: publishedWriting[0].tags ?? [],
      }
    : null;
  return (
    <PortfolioPage
      initialPersona={initialPersona}
      currentStatus={currentStatus}
      recentWork={recentWork}
      latestWriting={latestWriting}
      workspaceCards={workspaceCards}
    />
  );
}
