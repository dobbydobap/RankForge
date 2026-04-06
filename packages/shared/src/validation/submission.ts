import { z } from 'zod';
import { Language } from '../constants';

export const submitCodeSchema = z.object({
  problemId: z.string().min(1),
  contestId: z.string().optional(),
  language: z.nativeEnum(Language),
  sourceCode: z.string().min(1, 'Source code is required').max(65536, 'Source code too large'),
});

export type SubmitCodeInput = z.infer<typeof submitCodeSchema>;
