import { ContestStatus } from '../constants';

export interface ContestSummary {
  id: string;
  title: string;
  slug: string;
  status: ContestStatus;
  startTime: string;
  endTime: string;
  duration: number;
  isPublic: boolean;
  participantCount: number;
  problemCount: number;
}

export interface ContestDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: ContestStatus;
  startTime: string;
  endTime: string;
  duration: number;
  isPublic: boolean;
  penaltyTime: number;
  freezeTime: number | null;
  problems: ContestProblemInfo[];
  isRegistered: boolean;
}

export interface ContestProblemInfo {
  label: string;
  title: string;
  slug: string;
  points: number;
  solvedCount: number;
}
