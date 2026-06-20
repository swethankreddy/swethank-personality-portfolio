'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';

// Card dimensions — roughly 12:7 (laptop-screen proportions)
const PREVIEW_W = 192;
const PREVIEW_H = 112;
// How far above the cursor the card floats
const OFFSET_Y = 20;

interface Props {
  /** Internal Next.js route OR external URL (set external=true) */
  href?: string;
  /** External link — renders <a target="_blank"> instead of <Link> */
  external?: boolean;
  /** The image/content to show in the floating card.
   *  Pass null or undefined to fall back to a plain link with no preview. */
  preview?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps any project row or tile with a cursor-following floating image preview.
 *
 * Key motion tricks (from the reference):
 * - motionValue.jump()  on mouseenter → card teleports to cursor, no spring-from-zero
 * - motionValue.set()   on mousemove  → spring chases the new target smoothly
 * - tilt driven by VELOCITY (deltaX), not cursor position — feels like paper in air
 *
 * When preview is null/undefined, renders a plain link with no portal — safe fallback
 * for projects that don't yet have a thumbnail.
 */
export default function HoverPreviewLink({
  href = '#',
  external = false,
  preview,
  className,
  children,
}: Props) {
  const rm = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const prevX = useRef<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Raw motion values — update instantly without triggering React renders
  const rawTop    = useMotionValue(0);
  const rawLeft   = useMotionValue(0);
  const rawRotate = useMotionValue(0);

  // Spring-wrapped values — lag behind the raw target with elastic physics
  const springTop    = useSpring(rawTop,    { stiffness: 300, damping: 30 });
  const springLeft   = useSpring(rawLeft,   { stiffness: 300, damping: 30 });
  const springRotate = useSpring(rawRotate, { stiffness: 300, damping: 20 });

  const onMouseEnter = (e: React.MouseEvent) => {
    // jump() bypasses the spring — card appears at cursor with zero lag,
    // not springing in from wherever it was when the component last rendered.
    rawTop.jump(e.clientY - PREVIEW_H - OFFSET_Y);
    rawLeft.jump(e.clientX - PREVIEW_W / 2);
    setShow(true);
    prevX.current = null;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    // set() gives the spring a new target to chase on every mousemove frame
    rawTop.set(e.clientY - PREVIEW_H - OFFSET_Y);
    rawLeft.set(e.clientX - PREVIEW_W / 2);

    // Velocity-based tilt: the FASTER the horizontal movement, the more it tilts.
    // Clamped to ±15° so it never looks absurd.
    if (prevX.current !== null) {
      const dx = e.clientX - prevX.current;
      rawRotate.set(Math.max(-15, Math.min(15, dx * 1.2)));
    }
    prevX.current = e.clientX;
  };

  const onMouseLeave = () => {
    setShow(false);
    prevX.current = null;
    rawRotate.set(0);
  };

  const handlers = preview ? { onMouseEnter, onMouseMove, onMouseLeave } : {};

  // Portal — renders to document.body so parent overflow:hidden never clips it
  const portal =
    mounted && preview
      ? createPortal(
          <AnimatePresence>
            {show && !rm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.86, y: -6 }}
                animate={{ opacity: 1, scale: 1,    y:  0 }}
                exit={{    opacity: 0, scale: 0.86, y: -6 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'fixed',
                  top:      springTop,
                  left:     springLeft,
                  rotate:   springRotate,
                  zIndex:   9999,
                  pointerEvents: 'none', // never intercept mouse events
                }}
              >
                <div className="overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.16)] ring-1 ring-ink/[0.07]">
                  {preview}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )
      : null;

  if (external) {
    return (
      <>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          {...handlers}
        >
          {children}
        </a>
        {portal}
      </>
    );
  }

  return (
    <>
      <Link href={href} className={className} {...handlers}>
        {children}
      </Link>
      {portal}
    </>
  );
}
