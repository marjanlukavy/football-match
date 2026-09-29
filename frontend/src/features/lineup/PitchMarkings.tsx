/**
 * Розмітка футбольного поля в метрах (68 × 105): штрафні, воротарські,
 * центральне коло, «дуги» штрафних і кутові сектори.
 */
export const PITCH_WIDTH = 68;
export const PITCH_LENGTH = 105;

export function PitchMarkings({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${PITCH_WIDTH} ${PITCH_LENGTH}`}
      className={className}
      fill="none"
      stroke="var(--color-pitch-line)"
      strokeWidth={0.22}
      aria-hidden
    >
      <rect x={0.11} y={0.11} width={PITCH_WIDTH - 0.22} height={PITCH_LENGTH - 0.22} rx={0.6} />

      {/* Центр */}
      <line x1={0} y1={52.5} x2={68} y2={52.5} />
      <circle cx={34} cy={52.5} r={9.15} />
      <circle cx={34} cy={52.5} r={0.3} fill="var(--color-pitch-line)" stroke="none" />

      {/* Верхня половина */}
      <rect x={13.84} y={0} width={40.32} height={16.5} />
      <rect x={24.84} y={0} width={18.32} height={5.5} />
      <circle cx={34} cy={11} r={0.3} fill="var(--color-pitch-line)" stroke="none" />
      <path d="M 26.69 16.5 A 9.15 9.15 0 0 0 41.31 16.5" />

      {/* Нижня половина */}
      <rect x={13.84} y={88.5} width={40.32} height={16.5} />
      <rect x={24.84} y={99.5} width={18.32} height={5.5} />
      <circle cx={34} cy={94} r={0.3} fill="var(--color-pitch-line)" stroke="none" />
      <path d="M 26.69 88.5 A 9.15 9.15 0 0 1 41.31 88.5" />

      {/* Кутові сектори */}
      <path d="M 0 1.5 A 1.5 1.5 0 0 0 1.5 0" />
      <path d="M 66.5 0 A 1.5 1.5 0 0 0 68 1.5" />
      <path d="M 1.5 105 A 1.5 1.5 0 0 0 0 103.5" />
      <path d="M 68 103.5 A 1.5 1.5 0 0 0 66.5 105" />
    </svg>
  );
}
