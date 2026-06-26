export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  totalScore: number;
  penalty: number;
  solvedCount: number;
  problemResults: ProblemResult[];
}

export interface ProblemResult {
  label: string;
  score: number;
  attempts: number;
  solvedAt: string | null;
  isFirstBlood: boolean;
}

export interface LeaderboardResponse {
  contestId: string;
  entries: LeaderboardEntry[];
  isFrozen: boolean;
  minuteOffset?: number;
}

export interface ScoreEventPublic {
  userId: string;
  username: string;
  problemLabel: string;
  score: number;
  minuteOffset: number;
  eventType: string;
}
