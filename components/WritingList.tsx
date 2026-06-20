'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from '@/lib/motion';

interface Post {
  id: string;
  title: string;
  date: string;
  excerpt?: string | null;
  tags: string[];
}

export default function WritingList({ posts }: { posts: Post[] }) {
  const rm = useReducedMotion();

  return (
    <div className="divide-y divide-ink/[0.07]">
      {posts.map((post, i) => (
        <motion.article
          key={post.id}
          initial={rm ? { opacity: 0 } : { opacity: 0, y: 16 }}
          whileInView={rm ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={rm ? { duration: 0 } : { duration: 0.42, delay: i * 0.04, ease: EASE_OUT }}
          className="group -mx-3 rounded-xl px-3 py-8 transition-colors duration-200 first:pt-0 hover:bg-ink/[0.025]"
        >
          <time className="mb-2 block text-[12px] tracking-[0.04em] text-muted/50">
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <h2 className="mb-2 text-[20px] font-semibold leading-[1.25] tracking-[-0.015em] text-ink transition-colors duration-200 group-hover:text-ink/80">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mb-4 text-[16px] leading-[1.55] tracking-[-0.01em] text-muted">
              {post.excerpt}
            </p>
          )}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] tracking-[0.04em] text-muted/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.article>
      ))}
    </div>
  );
}
