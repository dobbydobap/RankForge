import { z } from 'zod';
import { Difficulty } from '../constants';

export const createProblemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  statement: z.string().min(1, 'Problem statement is required'),
  constraints: z.string().optional(),
  inputFormat: z.string().min(1, 'Input format is required'),
  outputFormat: z.string().min(1, 'Output format is required'),
  difficulty: z.nativeEnum(Difficulty),
  timeLimit: z.number().int().min(100).max(30000).default(2000),
  memoryLimit: z.number().int().min(16).max(1024).default(256),
  tags: z.array(z.string()).default([]),
});

export const createTestCaseSchema = z.object({
  input: z.string(),
  output: z.string(),
  isSample: z.boolean().default(false),
  order: z.number().int().min(0),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
