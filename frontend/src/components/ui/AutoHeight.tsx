import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Плавно змінює висоту під вміст (інша форма, поява помилки).
 * overflow: hidden вмикається лише на час анімації, щоб не обрізати тіні й фокус.
 */
export function AutoHeight({ children, className }: { children: ReactNode; className?: string }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const [animating, setAnimating] = useState(false);

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    let current: number | undefined;
    const observer = new ResizeObserver(() => {
      const next = inner.offsetHeight;
      if (next === current) return;
      if (current !== undefined) setAnimating(true);
      current = next;
      setHeight(next);
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn('transition-[height] duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)]', animating && 'overflow-hidden', className)}
      style={{ height }}
      onTransitionEnd={(event) => event.target === event.currentTarget && setAnimating(false)}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
