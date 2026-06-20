'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Adds `.is-scrolling` to the element while scrolling and removes it
 * after `fadeDelay` ms of inactivity, enabling the CSS scroll-fade pattern.
 */
export function useScrollFade(
  ref: RefObject<HTMLDivElement | null>,
  fadeDelay = 1200,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout>;

    function onScroll() {
      el!.classList.add('is-scrolling');
      clearTimeout(timer);
      timer = setTimeout(() => {
        el!.classList.remove('is-scrolling');
      }, fadeDelay);
    }

    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [ref, fadeDelay]);
}
