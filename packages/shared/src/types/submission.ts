import { Language, Verdict } from '../constants';

export interface SubmissionSummary {
  id: string;
  problemTitle: string;
  problemSlug: string;
  language: Language;
  verdict: Verdict;
  timeUsed: number | null;
  memoryUsed: number | null;
  createdAt: string;
}

export interface SubmissionDetail {
  id: string;
  userId: string;
  username: string;
  problemId: string;
  problemTitle: string;
  problemSlug: string;
  contestId: string | null;
  language: Language;
  sourceCode: string;
  verdict: Verdict;
  timeUsed: number | null;
  memoryUsed: number | null;
  score: number | null;
  createdAt: string;
  judgedAt: string | null;
  testResults: TestResultPublic[];
}

export interface TestResultPublic {
  order: number;
  verdict: Verdict;
  timeUsed: number | null;
  memoryUsed: number | null;
}
