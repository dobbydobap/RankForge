'use client';

import { Difficulty } from '@rankforge/shared';

interface ProblemFiltersProps {
  difficulty: string;
  tag: string;
  search: string;
  onDifficultyChange: (d: string) => void;
  onTagChange: (t: string) => void;
  onSearchChange: (s: string) => void;
  tags: { id: string; name: string; _count: { problems: number } }[];
}

const DIFFICULTIES = ['', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'];
const DIFF_COLORS: Record<string, string> = {
  EASY: 'text-rf-pink',
  MEDIUM: 'text-yellow-400',
  HARD: 'text-orange-400',
  EXPERT: 'text-red-400',
};

export function ProblemFilters({
  difficulty,
  tag,
  search,
  onDifficultyChange,
  onTagChange,
  onSearchChange,
  tags,
}: ProblemFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search problems..."
        className="flex-1 px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-white placeholder-rf-iron focus:outline-none focus:ring-2 focus:ring-rf-sage focus:border-transparent text-sm"
      />
      <select
        value={difficulty}
        onChange={(e) => onDifficultyChange(e.target.value)}
        className="px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-pink text-sm focus:outline-none focus:ring-2 focus:ring-rf-sage"
      >
        <option value="">All Difficulties</option>
        {DIFFICULTIES.filter(Boolean).map((d) => (
          <option key={d} value={d}>
            {d.charAt(0) + d.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
      <select
        value={tag}
        onChange={(e) => onTagChange(e.target.value)}
        className="px-3 py-2 bg-rf-dark border border-rf-iron rounded-lg text-rf-pink text-sm focus:outline-none focus:ring-2 focus:ring-rf-sage"
      >
        <option value="">All Tags</option>
        {tags.map((t) => (
          <option key={t.id} value={t.name}>
            {t.name} ({t._count.problems})
          </option>
        ))}
      </select>
    </div>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color = DIFF_COLORS[difficulty] || 'text-rf-gray';
  return (
    <span className={`text-xs font-medium ${color}`}>
      {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
    </span>
  );
}
