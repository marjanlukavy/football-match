import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Field';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import type { Player } from '@futbol/shared/types';

export type PlayerSort = 'skill' | 'name';

export interface PlayerFilterState {
  query: string;
  sort: PlayerSort;
}

export const INITIAL_FILTERS: PlayerFilterState = { query: '', sort: 'skill' };

const SORT_OPTIONS: SegmentOption<PlayerSort>[] = [
  { value: 'skill', label: 'За рівнем' },
  { value: 'name', label: 'За іменем' },
];

interface PlayerFiltersProps {
  value: PlayerFilterState;
  onChange: (value: PlayerFilterState) => void;
}

export function PlayerFilters({ value, onChange }: PlayerFiltersProps) {
  const set = (patch: Partial<PlayerFilterState>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-0 flex-1 basis-56">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
        <Input
          type="search"
          aria-label="Пошук гравця"
          placeholder="Пошук за іменем"
          value={value.query}
          onChange={(e) => set({ query: e.target.value })}
          className="h-10 rounded-full pr-9 pl-10 [&::-webkit-search-cancel-button]:hidden"
        />
        {value.query && (
          <button
            type="button"
            aria-label="Очистити пошук"
            onClick={() => set({ query: '' })}
            className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <SegmentedControl
        ariaLabel="Сортування"
        size="sm"
        value={value.sort}
        options={SORT_OPTIONS}
        onChange={(sort) => set({ sort })}
      />
    </div>
  );
}

export function applyPlayerFilters(players: readonly Player[], { query, sort }: PlayerFilterState): Player[] {
  const needle = query.trim().toLocaleLowerCase('uk');
  const byName = (a: Player, b: Player) => a.name.localeCompare(b.name, 'uk');

  return players
    .filter((p) => !needle || p.name.toLocaleLowerCase('uk').includes(needle))
    .sort(sort === 'skill' ? (a, b) => b.skill - a.skill || byName(a, b) : byName);
}
