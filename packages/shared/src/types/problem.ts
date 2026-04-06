import { Difficulty } from '../constants';

export interface ProblemSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  solvedCount?: number;
  acceptanceRate?: number;
}

export interface ProblemDetail {
  id: string;
  title: string;
  slug: string;
  statement: string;
  constraints: string | null;
  inputFormat: string;
  outputFormat: string;
  difficulty: Difficulty;
  timeLimit: number;
  memoryLimit: number;
  tags: string[];
  sampleTestCases: TestCasePublic[];
}

export interface TestCasePublic {
  input: string;
  output: string;
  order: number;
}
