export const dynamic = 'force-dynamic';

import { getPublishedWriting } from '@/lib/data';
import Nav from '@/components/Nav';
import WritingClient from '@/components/WritingClient';

export const metadata = {
  title: 'Writing | Swethank',
  description: 'Essays on AI, research, systems, and craft.',
};

export default function WritingPage() {
  const posts = getPublishedWriting();

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <Nav />
      <WritingClient posts={posts} />
    </div>
  );
}
