import { getChatContext } from '@/lib/chat-context';

export async function GET() {
  const context = getChatContext();
  return new Response(context, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
