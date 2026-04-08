/**
 * Codeforces-style rating calculation.
 *
 * Simplified version of the algorithm described at:
 * https://codeforces.com/blog/entry/20762
 *
 * Each participant has an expected rank based on their rating.
 * If they perform better than expected, rating goes up; worse, it goes down.
 */

interface Participant {
  userId: string;
  currentRating: number;
  rank: number; // 1-indexed actual rank in the contest
}

interface RatingChange {
  userId: string;
  oldRating: number;
  newRating: number;
  change: number;
  rank: number;
}

/**
 * Calculate the probability that participant A performs better than B.
 */
function winProbability(ratingA: number, ratingB: number): number {
  return 1.0 / (1.0 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate expected rank for a participant given all participants' ratings.
 */
function expectedRank(participant: Participant, allParticipants: Participant[]): number {
  let expectedRank = 1;
  for (const other of allParticipants) {
    if (other.userId === participant.userId) continue;
    expectedRank += winProbability(other.currentRating, participant.currentRating);
  }
  return expectedRank;
}

/**
 * Calculate rating changes for all participants after a contest.
 */
export function calculateRatingChanges(participants: Participant[]): RatingChange[] {
  if (participants.length === 0) return [];

  const n = participants.length;
  const changes: RatingChange[] = [];

  for (const participant of participants) {
    const expected = expectedRank(participant, participants);
    const actual = participant.rank;

    // The seed (expected performance) determines the expected rating
    // We calculate what rating would give the actual rank as expected
    const midRank = Math.sqrt(expected * actual);

    // Binary search for the rating that would give midRank as expected rank
    let lo = 1;
    let hi = 8000;
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      const fakeParticipant: Participant = {
        userId: 'fake',
        currentRating: mid,
        rank: 0,
      };
      const eRank = expectedRank(fakeParticipant, participants);
      if (eRank < midRank) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    const performanceRating = lo;

    // Rating change is a fraction of the difference between performance and current
    let change = Math.floor((performanceRating - participant.currentRating) / 2);

    // Cap the change to prevent extreme swings
    change = Math.max(-150, Math.min(150, change));

    // New participants get a boost (first 6 contests)
    // For simplicity, we don't track contest count here, but we prevent
    // ratings from going below 100
    const newRating = Math.max(100, participant.currentRating + change);

    changes.push({
      userId: participant.userId,
      oldRating: participant.currentRating,
      newRating,
      change: newRating - participant.currentRating,
      rank: participant.rank,
    });
  }

  // Adjustment: ensure total rating change sums to roughly 0
  // (inflation control)
  const totalChange = changes.reduce((sum, c) => sum + c.change, 0);
  const adjustment = Math.round(totalChange / n);

  for (const change of changes) {
    change.newRating = Math.max(100, change.newRating - adjustment);
    change.change = change.newRating - change.oldRating;
  }

  return changes;
}
