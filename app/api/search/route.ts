// Deterministic retrieval, exposed directly.
//
// Same code path the searchPortfolio tool uses — no LLM involved. Lets the
// evaluation harness (and a human with curl) score retrieval in isolation:
//   curl 'localhost:3000/api/search?q=computer+vision'

import { searchIndex } from '@/lib/retrieval';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return Response.json({ error: 'Missing ?q=' }, { status: 400 });

  const year = searchParams.get('year');
  const topK = searchParams.get('topK');

  return Response.json(
    searchIndex(q, {
      year: year ? Number(year) : undefined,
      category: searchParams.get('category') ?? undefined,
      topK: topK ? Number(topK) : undefined,
    }),
  );
}
