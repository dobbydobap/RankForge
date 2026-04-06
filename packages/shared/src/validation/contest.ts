import { z } from 'zod';

export const createContestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  duration: z.number().int().min(10).max(600),
  isPublic: z.boolean().default(true),
  penaltyTime: z.number().int().min(0).max(60).default(20),
  freezeTime: z.number().int().min(0).optional(),
});

export const addContestProblemSchema = z.object({
  problemId: z.string().min(1),
  label: z.string().min(1).max(2),
  points: z.number().int().min(0).default(100),
  order: z.number().int().min(0),
});

export type CreateContestInput = z.infer<typeof createContestSchema>;
export type AddContestProblemInput = z.infer<typeof addContestProblemSchema>;
