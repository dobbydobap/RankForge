'use client';
import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useProblem, useSubmitCode, useSubmissions } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth-store';
import { useVerdictUpdates } from '@/hooks/use-websocket';
import { ProblemStatement } from '@/components/problems/ProblemStatement';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { LanguageSelector } from '@/components/editor/LanguageSelector';
import { VerdictBadge } from '@/components/submissions/VerdictBadge';
import { Language } from '@rankforge/shared';
import { api } from '@/lib/api';

const DEFAULT_CODE: Record<string, string> = {
  C: `#include <stdio.h>\n\nint main() {\n\n    return 0;\n}`,
  CPP: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\n    return 0;\n}`,
  PYTHON: `import sys\ninput = sys.stdin.readline\n\n`,
  JAVA: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\n    }\n}`,
  JAVASCRIPT: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\n\nrl.on('line', (line) => lines.push(line));\nrl.on('close', () => {\n\n});`,
  TYPESCRIPT: `import * as readline from 'readline';\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines: string[] = [];\n\nrl.on('line', (line) => lines.push(line));\nrl.on('close', () => {\n\n});`,
  GO: `package main\n\nimport "fmt"\n\nfunc main() {\n\n}`,
  RUST: `use std::io::{self, BufRead};\n\nfn main() {\n    let stdin = io::stdin();\n    for line in stdin.lock().lines() {\n        let line = line.unwrap();\n    }\n}`,
  KOTLIN: `fun main() {\n    val br = System.in.bufferedReader()\n\n}`,
  RUBY: `# Read input\nlines = STDIN.read.split("\\n")\n\n`,
};

type BottomTab = 'testcases' | 'output' | 'submissions';

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isAuthenticated } = useAuthStore();
  const token = useAuthStore((s) => s.accessToken);
  const { data: problem, isLoading } = useProblem(slug);

  const [language, setLanguage] = useState<string>(Language.CPP);
  const [code, setCode] = useState(DEFAULT_CODE[Language.CPP]);
  const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');
  const [bottomTab, setBottomTab] = useState<BottomTab>('testcases');

  // Custom run state
  const [customInput, setCustomInput] = useState('');
  const [runOutput, setRunOutput] = useState<{ error: string | null; output: string } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Submit state
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const [liveVerdict, setLiveVerdict] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const submitMutation = useSubmitCode();
  const { data: submissionsData } = useSubmissions(
    problem ? { problemId: problem.id } : undefined,
  );

  useVerdictUpdates(lastSubmissionId, useCallback((data) => {
    setLiveVerdict(data.verdict);
    queryClient.invalidateQueries({ queryKey: ['submissions'] });
  }, [queryClient]));

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang] || '');
  };

  // Run code against custom input
  const handleRun = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setRunOutput(null);
    setBottomTab('output');

    try {
      const input = customInput || problem?.sampleTestCases?.[0]?.input || '';
      const result = await api.post<{ error: string | null; output: string }>(
        '/submissions/run',
        { language, sourceCode: code, input },
        { token: token ?? undefined },
      );
      setRunOutput(result);
    } catch (err: any) {
      setRunOutput({ error: err.message || 'Run failed', output: '' });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit for judging against all test cases
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!problem) return;

    setLiveVerdict(null);
    setBottomTab('output');
    const result = await submitMutation.mutateAsync({
      problemId: problem.id,
      language,
      sourceCode: code,
    });
    setLastSubmissionId(result.id);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-rf-black">
        <div className="text-rf-gray">Loading problem...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-screen flex items-center justify-center bg-rf-black">
        <div className="text-rf-gray">Problem not found.</div>
      </div>
    );
  }

  // Auto-fill custom input with first sample test case
  const sampleInput = problem.sampleTestCases?.[0]?.input || '';
  const sampleOutput = problem.sampleTestCases?.[0]?.output || '';

  return (
    <div className="h-screen flex flex-col bg-rf-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-rf-border bg-rf-black/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/problems" className="text-sm text-rf-gray hover:text-white">
            &larr; Problems
          </Link>
          <span className="text-sm font-medium text-white">{problem.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector value={language} onChange={handleLanguageChange} />
          <button
            onClick={handleRun}
            disabled={isRunning || !code.trim()}
            className="px-4 py-1.5 text-sm font-medium border border-rf-border hover:border-rf-iron disabled:opacity-50 text-rf-light rounded-lg transition-colors"
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !code.trim()}
            className="px-4 py-1.5 text-sm font-medium bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-rf-black rounded-lg transition-colors"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Problem / Submissions */}
        <div className="w-[45%] border-r border-rf-border flex flex-col min-h-0">
          <div className="flex border-b border-rf-border shrink-0">
            <button
              onClick={() => setActiveTab('problem')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'problem'
                  ? 'text-white border-b-2 border-white'
                  : 'text-rf-gray hover:text-white'
              }`}
            >
              Problem
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'submissions'
                  ? 'text-white border-b-2 border-white'
                  : 'text-rf-gray hover:text-white'
              }`}
            >
              Submissions
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'problem' ? (
              <ProblemStatement problem={problem} />
            ) : (
              <div className="space-y-2">
                {!submissionsData?.submissions.length ? (
                  <p className="text-sm text-rf-gray">No submissions yet.</p>
                ) : (
                  submissionsData.submissions.map((sub: any) => (
                    <Link
                      key={sub.id}
                      href={`/submissions/${sub.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-rf-border bg-rf-dark/50 hover:border-rf-iron transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <VerdictBadge verdict={sub.verdict} />
                        <span className="text-xs text-rf-gray">{sub.language}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-rf-gray">
                        {sub.timeUsed !== null && <span>{sub.timeUsed}ms</span>}
                        <span>{new Date(sub.createdAt).toLocaleString()}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor + Bottom panel */}
        <div className="w-[55%] flex flex-col min-h-0">
          {/* Code editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor language={language} value={code} onChange={setCode} />
          </div>

          {/* Bottom panel: Test Cases / Output / Submissions */}
          <div className="h-[35%] border-t border-rf-border flex flex-col shrink-0">
            <div className="flex border-b border-rf-border shrink-0">
              <button
                onClick={() => setBottomTab('testcases')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  bottomTab === 'testcases' ? 'text-white border-b-2 border-white' : 'text-rf-gray hover:text-white'
                }`}
              >
                Test Cases
              </button>
              <button
                onClick={() => setBottomTab('output')}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  bottomTab === 'output' ? 'text-white border-b-2 border-white' : 'text-rf-gray hover:text-white'
                }`}
              >
                Output
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {bottomTab === 'testcases' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-rf-gray mb-1 block">Custom Input (or edit sample below)</label>
                    <textarea
                      value={customInput || sampleInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="w-full h-20 px-3 py-2 bg-rf-dark border border-rf-border rounded-lg text-white text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-rf-iron"
                      placeholder="Enter custom input..."
                    />
                  </div>
                  {sampleOutput && (
                    <div>
                      <label className="text-xs text-rf-gray mb-1 block">Expected Output</label>
                      <pre className="px-3 py-2 bg-rf-dark border border-rf-border rounded-lg text-rf-light text-xs font-mono">
                        {sampleOutput}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {bottomTab === 'output' && (
                <div className="space-y-2">
                  {/* Run output */}
                  {isRunning && (
                    <div className="flex items-center gap-2 text-xs text-rf-gray">
                      <div className="w-3 h-3 border-2 border-rf-gray border-t-transparent rounded-full animate-spin" />
                      Running your code...
                    </div>
                  )}

                  {runOutput && (
                    <div>
                      {runOutput.error ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-900/50 text-red-400 border border-red-800 rounded">
                              {runOutput.error}
                            </span>
                          </div>
                          {runOutput.output && (
                            <pre className="px-3 py-2 bg-rf-dark border border-red-800/30 rounded-lg text-red-300 text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {runOutput.output}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-900/50 text-green-400 border border-green-800 rounded">
                            Executed Successfully
                          </span>
                          <pre className="px-3 py-2 bg-rf-dark border border-rf-border rounded-lg text-white text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {runOutput.output || '(no output)'}
                          </pre>
                          {sampleOutput && (
                            <div className="text-xs">
                              {runOutput.output.trim() === sampleOutput.trim() ? (
                                <span className="text-green-400">Output matches expected</span>
                              ) : (
                                <span className="text-yellow-400">Output differs from expected</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit verdict */}
                  {submitMutation.isPending && (
                    <div className="flex items-center gap-2 text-xs text-rf-gray">
                      <div className="w-3 h-3 border-2 border-rf-gray border-t-transparent rounded-full animate-spin" />
                      Judging against all test cases...
                    </div>
                  )}

                  {submitMutation.isSuccess && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-rf-gray">Verdict:</span>
                        <VerdictBadge verdict={liveVerdict || submitMutation.data?.verdict || 'PENDING'} />
                        {!liveVerdict && submitMutation.data?.verdict === 'PENDING' && (
                          <div className="flex items-center gap-1 text-xs text-rf-gray">
                            <div className="w-3 h-3 border-2 border-rf-gray border-t-transparent rounded-full animate-spin" />
                            Judging...
                          </div>
                        )}
                      </div>
                      {liveVerdict === 'ACCEPTED' && (
                        <div className="text-xs text-green-400">
                          All test cases passed!
                        </div>
                      )}
                    </div>
                  )}

                  {submitMutation.isError && (
                    <div className="text-xs text-red-400">
                      Submission failed: {(submitMutation.error as any)?.message || 'Unknown error'}
                    </div>
                  )}

                  {!isRunning && !runOutput && !submitMutation.isPending && !submitMutation.isSuccess && !submitMutation.isError && (
                    <div className="text-xs text-rf-gray">
                      Click &quot;Run&quot; to test your code, or &quot;Submit&quot; to judge against all test cases.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
