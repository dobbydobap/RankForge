export enum Role {
  USER = 'USER',
  PROBLEM_SETTER = 'PROBLEM_SETTER',
  CONTEST_ORGANIZER = 'CONTEST_ORGANIZER',
  ADMIN = 'ADMIN',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

export enum ContestStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  LIVE = 'LIVE',
  FROZEN = 'FROZEN',
  ENDED = 'ENDED',
  RESULTS_PUBLISHED = 'RESULTS_PUBLISHED',
}

export enum Language {
  CPP = 'CPP',
  JAVA = 'JAVA',
  PYTHON = 'PYTHON',
  JAVASCRIPT = 'JAVASCRIPT',
  GO = 'GO',
}

export enum Verdict {
  PENDING = 'PENDING',
  JUDGING = 'JUDGING',
  ACCEPTED = 'ACCEPTED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
}

export enum ScoreEventType {
  ACCEPTED = 'ACCEPTED',
  WRONG_ATTEMPT = 'WRONG_ATTEMPT',
  PARTIAL_SCORE = 'PARTIAL_SCORE',
}

export const LANGUAGE_DISPLAY: Record<Language, string> = {
  [Language.CPP]: 'C++',
  [Language.JAVA]: 'Java',
  [Language.PYTHON]: 'Python',
  [Language.JAVASCRIPT]: 'JavaScript',
  [Language.GO]: 'Go',
};

export const VERDICT_DISPLAY: Record<Verdict, string> = {
  [Verdict.PENDING]: 'Pending',
  [Verdict.JUDGING]: 'Judging',
  [Verdict.ACCEPTED]: 'Accepted',
  [Verdict.WRONG_ANSWER]: 'Wrong Answer',
  [Verdict.TIME_LIMIT_EXCEEDED]: 'Time Limit Exceeded',
  [Verdict.MEMORY_LIMIT_EXCEEDED]: 'Memory Limit Exceeded',
  [Verdict.RUNTIME_ERROR]: 'Runtime Error',
  [Verdict.COMPILATION_ERROR]: 'Compilation Error',
};

export const VERDICT_SHORT: Record<Verdict, string> = {
  [Verdict.PENDING]: 'PD',
  [Verdict.JUDGING]: 'JG',
  [Verdict.ACCEPTED]: 'AC',
  [Verdict.WRONG_ANSWER]: 'WA',
  [Verdict.TIME_LIMIT_EXCEEDED]: 'TLE',
  [Verdict.MEMORY_LIMIT_EXCEEDED]: 'MLE',
  [Verdict.RUNTIME_ERROR]: 'RE',
  [Verdict.COMPILATION_ERROR]: 'CE',
};

export const DEFAULT_RATING = 1200;
export const DEFAULT_PENALTY_MINUTES = 20;
export const LEADERBOARD_SNAPSHOT_INTERVAL_MINUTES = 5;
