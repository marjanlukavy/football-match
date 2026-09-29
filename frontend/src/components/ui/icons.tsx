import type { SVGProps } from 'react';

/** Футбольний м'яч у стилі lucide (у lucide-react такої іконки немає). */
export function BallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m12 7 4.3 3.1-1.6 5H9.3l-1.6-5Z" />
      <path d="M12 7V2.5M16.3 10.1l4.5-1.5M14.7 15.1l2.8 3.9M9.3 15.1 6.5 19M7.7 10.1 3.2 8.6" />
    </svg>
  );
}
