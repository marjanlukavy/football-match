import { useLayoutEffect, useState, type RefObject } from 'react';

const GAP = 12;
const MARGIN = 12;

export interface FloatingPosition {
  top: number;
  left: number;
}

/**
 * Позиція плаваючого елемента біля якоря (position: fixed):
 * праворуч → ліворуч → під/над якорем, завжди в межах вікна.
 * Стежить за скролом, ресайзом і зміною розміру самого елемента.
 */
export function useAnchoredPosition(
  anchor: HTMLElement | null,
  floatingRef: RefObject<HTMLElement | null>,
): FloatingPosition | null {
  const [position, setPosition] = useState<FloatingPosition | null>(null);

  useLayoutEffect(() => {
    const floating = floatingRef.current;
    if (!anchor || !floating) return;

    const update = () => {
      const a = anchor.getBoundingClientRect();
      // offset* не залежать від transform, тож анімація появи не збиває розміри.
      const width = floating.offsetWidth;
      const height = floating.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

      let left: number;
      let top: number;
      if (a.right + GAP + width <= vw - MARGIN) {
        left = a.right + GAP;
        top = a.top;
      } else if (a.left - GAP - width >= MARGIN) {
        left = a.left - GAP - width;
        top = a.top;
      } else {
        // Вузький екран: центруємо по якорю, під ним або над ним.
        left = a.left + a.width / 2 - width / 2;
        top = a.bottom + GAP + height <= vh - MARGIN ? a.bottom + GAP : a.top - GAP - height;
      }

      setPosition({
        left: clamp(left, MARGIN, vw - MARGIN - width),
        top: clamp(top, MARGIN, vh - MARGIN - height),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(floating);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchor, floatingRef]);

  return position;
}
