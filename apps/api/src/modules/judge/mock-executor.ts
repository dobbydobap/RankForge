import { ExecutionResult } from './executor';

/**
 * Load-test mock: replaces the Wandbox call with a fixed delay and returns the
 * expected output, so the ACCEPTED path (the most expensive one) is exercised
 * without load-testing a free third-party service. Enabled per-process via
 * JUDGE_EXECUTOR=mock; delay via JUDGE_MOCK_DELAY_MS (default 200, calibrated
 * against real Wandbox medians — see README "Load Testing").
 */
export const isMockExecutor = () => process.env.JUDGE_EXECUTOR === 'mock';

const delayMs = () => parseInt(process.env.JUDGE_MOCK_DELAY_MS ?? '200', 10);

export async function mockExecuteCode(expectedOutput: string): Promise<ExecutionResult> {
  await new Promise((r) => setTimeout(r, delayMs()));
  return {
    success: true,
    stdout: expectedOutput,
    stderr: '',
    compilationError: null,
    exitCode: 0,
    signal: '',
  };
}
