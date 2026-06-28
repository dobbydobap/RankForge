// Codeforces-style rating tiers (monochrome — name carries meaning, not color).
export type Tier = { name: string; min: number };

export const TIERS: Tier[] = [
  { name: 'Newbie', min: 0 },
  { name: 'Pupil', min: 1000 },
  { name: 'Specialist', min: 1300 },
  { name: 'Expert', min: 1500 },
  { name: 'Candidate Master', min: 1700 },
  { name: 'Master', min: 1900 },
  { name: 'Grandmaster', min: 2200 },
];

export function rankTier(rating: number): {
  tier: Tier;
  next: Tier | null;
  progress: number;
} {
  let tier = TIERS[0];
  let next: Tier | null = null;
  for (let i = 0; i < TIERS.length; i++) {
    if (rating >= TIERS[i].min) {
      tier = TIERS[i];
      next = TIERS[i + 1] ?? null;
    }
  }
  const ceil = next ? next.min : tier.min + 300;
  const progress = next ? Math.min(1, Math.max(0, (rating - tier.min) / (ceil - tier.min))) : 1;
  return { tier, next, progress };
}
