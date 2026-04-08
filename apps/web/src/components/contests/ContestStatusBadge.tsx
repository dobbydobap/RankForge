'use client';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-rf-border text-rf-gray border-rf-iron',
  PUBLISHED: 'bg-blue-900/50 text-blue-400 border-blue-800',
  REGISTRATION_OPEN: 'bg-cyan-900/50 text-cyan-400 border-cyan-800',
  LIVE: 'bg-rf-dark/80 text-rf-sage border-rf-iron',
  FROZEN: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  ENDED: 'bg-rf-border text-rf-gray border-rf-iron',
  RESULTS_PUBLISHED: 'bg-purple-900/50 text-purple-400 border-purple-800',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  REGISTRATION_OPEN: 'Registration Open',
  LIVE: 'Live',
  FROZEN: 'Frozen',
  ENDED: 'Ended',
  RESULTS_PUBLISHED: 'Results',
};

export function ContestStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${STATUS_STYLES[status] || STATUS_STYLES.DRAFT}`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}
