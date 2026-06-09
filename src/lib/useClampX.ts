import { useLayoutEffect, useRef } from 'react';

/**
 * Keeps an absolutely-positioned popover within the viewport horizontally.
 * Anchor the element with `left: 0` in CSS; this shifts it (translateX) so it
 * never spills past either screen edge. Pass enabled=false to skip (e.g. when
 * the element is a full-width mobile bottom sheet).
 */
export function useClampX<T extends HTMLElement = HTMLDivElement>(open: boolean, enabled = true) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!open || !enabled || !el) return;
    el.style.transform = '';
    const r = el.getBoundingClientRect();
    const pad = 8;
    const vw = document.documentElement.clientWidth;
    let dx = 0;
    if (r.right > vw - pad) dx = vw - pad - r.right;
    if (r.left + dx < pad) dx = pad - r.left;
    el.style.transform = dx ? `translateX(${dx}px)` : '';
  }, [open, enabled]);
  return ref;
}
