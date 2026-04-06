/**
 * Segment tree for temporal leaderboard analytics.
 *
 * Operates over the contest timeline (indexed by minute offset).
 * Each node stores aggregated score/submission data for a time range,
 * enabling efficient queries like:
 *   - Total score gained in [minute A, minute B]
 *   - Number of submissions in a time range
 *   - Peak scoring minute (max single-minute score gain)
 */

export interface TimeRangeData {
  totalScore: number;
  submissionCount: number;
  acceptedCount: number;
  maxScoreGain: number;
}

const EMPTY: TimeRangeData = {
  totalScore: 0,
  submissionCount: 0,
  acceptedCount: 0,
  maxScoreGain: 0,
};

function merge(a: TimeRangeData, b: TimeRangeData): TimeRangeData {
  return {
    totalScore: a.totalScore + b.totalScore,
    submissionCount: a.submissionCount + b.submissionCount,
    acceptedCount: a.acceptedCount + b.acceptedCount,
    maxScoreGain: Math.max(a.maxScoreGain, b.maxScoreGain),
  };
}

export class ContestSegmentTree {
  private tree: TimeRangeData[];
  private n: number;

  constructor(durationMinutes: number) {
    this.n = durationMinutes + 1;
    this.tree = new Array(4 * this.n).fill(null).map(() => ({ ...EMPTY }));
  }

  /** Record a score event at the given minute offset. */
  update(minute: number, scoreGain: number, accepted: boolean): void {
    this._update(1, 0, this.n - 1, minute, scoreGain, accepted);
  }

  /** Query aggregated data for the time range [left, right] (inclusive, in minutes). */
  query(left: number, right: number): TimeRangeData {
    if (left > right || left < 0 || right >= this.n) {
      return { ...EMPTY };
    }
    return this._query(1, 0, this.n - 1, left, right);
  }

  /** Get the size (duration) of this segment tree. */
  get size(): number {
    return this.n;
  }

  private _update(
    node: number,
    start: number,
    end: number,
    idx: number,
    scoreGain: number,
    accepted: boolean,
  ): void {
    if (start === end) {
      this.tree[node].totalScore += scoreGain;
      this.tree[node].submissionCount += 1;
      if (accepted) this.tree[node].acceptedCount += 1;
      this.tree[node].maxScoreGain = this.tree[node].totalScore;
      return;
    }

    const mid = Math.floor((start + end) / 2);
    if (idx <= mid) {
      this._update(2 * node, start, mid, idx, scoreGain, accepted);
    } else {
      this._update(2 * node + 1, mid + 1, end, idx, scoreGain, accepted);
    }
    this.tree[node] = merge(this.tree[2 * node], this.tree[2 * node + 1]);
  }

  private _query(
    node: number,
    start: number,
    end: number,
    left: number,
    right: number,
  ): TimeRangeData {
    if (left > end || right < start) {
      return { ...EMPTY };
    }
    if (left <= start && end <= right) {
      return this.tree[node];
    }

    const mid = Math.floor((start + end) / 2);
    return merge(
      this._query(2 * node, start, mid, left, right),
      this._query(2 * node + 1, mid + 1, end, left, right),
    );
  }
}
