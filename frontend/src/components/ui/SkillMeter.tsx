import { SKILL_LABELS, SKILL_LEVELS } from '@futbol/shared/constants';
import type { SkillLevel } from '@futbol/shared/types';
import { cn } from '@/lib/cn';

interface SkillMeterProps {
  value: SkillLevel;
  showLabel?: boolean;
  className?: string;
}

/** Рівень гри у вигляді п'яти сходинок. */
export function SkillMeter({ value, showLabel = false, className }: SkillMeterProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)} title={`Рівень ${value} — ${SKILL_LABELS[value]}`}>
      <span className="flex items-end gap-[3px]" aria-hidden>
        {SKILL_LEVELS.map((level) => (
          <span
            key={level}
            className={cn('w-[4px] rounded-full', level <= value ? 'bg-accent' : 'bg-black/10')}
            style={{ height: 5 + level * 2 }}
          />
        ))}
      </span>
      {showLabel && <span className="text-xs font-medium text-muted">{SKILL_LABELS[value]}</span>}
      <span className="sr-only">
        Рівень {value} з 5, {SKILL_LABELS[value]}
      </span>
    </span>
  );
}

interface SkillPickerProps {
  value: SkillLevel;
  onChange: (value: SkillLevel) => void;
  disabled?: boolean;
}

/** Редагування рівня: п'ять кнопок-сходинок. */
export function SkillPicker({ value, onChange, disabled }: SkillPickerProps) {
  return (
    <div role="radiogroup" aria-label="Рівень гри" className="inline-flex items-end gap-1">
      {SKILL_LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          role="radio"
          aria-checked={level === value}
          aria-label={`${level} — ${SKILL_LABELS[level]}`}
          title={SKILL_LABELS[level]}
          disabled={disabled}
          onClick={() => onChange(level)}
          className={cn(
            'w-3 rounded-full transition-colors disabled:cursor-not-allowed',
            level <= value ? 'bg-accent hover:bg-accent-ink' : 'bg-black/10 hover:bg-black/20',
          )}
          style={{ height: 8 + level * 3 }}
        />
      ))}
    </div>
  );
}
