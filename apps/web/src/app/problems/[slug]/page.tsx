'use client';
import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useProblem, useSubmitCode, useSubmissions, useSubmission } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth-store';
import { useVerdictUpdates } from '@/hooks/use-websocket';
import { ProblemStatement } from '@/components/problems/ProblemStatement';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { LanguageSelector } from '@/components/editor/LanguageSelector';
import { VerdictBadge } from '@/components/submissions/VerdictBadge';
import { Language } from '@rankforge/shared';
import { api } from '@/lib/api';

const DEFAULT_CODE: Record<string, string> = {
  C: '#include <stdio.h>\n\nint main() {\n\n    return 0;\n}',
  CPP: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\n    return 0;\n}',
  PYTHON: 'import sys\ninput = sys.stdin.readline\n\n',
  JAVA: 'import java.util.*;\n\nclass Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\n    }\n}',
  JAVASCRIPT: 'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\n\nrl.on("line", (line) => lines.push(line));\nrl.on("close", () => {\n\n});',
  TYPESCRIPT: 'import * as readline from "readline";\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines: string[] = [];\n\nrl.on("line", (line) => lines.push(line));\nrl.on("close", () => {\n\n});',
  GO: 'package main\n\nimport "fmt"\n\nfunc main() {\n\n}',
  RUST: 'use std::io::{self, BufRead};\n\nfn main() {\n    let stdin = io::stdin();\n    for line in stdin.lock().lines() {\n        let line = line.unwrap();\n    }\n}',
  KOTLIN: 'fun main() {\n    val br = System.`in`.bufferedReader()\n\n}',
  RUBY: '# Read input\nlines = STDIN.read.split("\\n")\n\n',
};

type LeftTab = 'problem' | 'submissions';
type BottomTab = 'testcases' | 'result';

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuthStore();
  const token = useAuthStore((s) => s.accessToken);
  const { data: problem, isLoading } = useProblem(slug);

  const [language, setLanguage] = useState<string>(Language.CPP);
  const [code, setCode] = useState(DEFAULT_CODE[Language.CPP]);
  const [leftTab, setLeftTab] = useState<LeftTab>('problem');
  const [bottomTab, setBottomTab] = useState<BottomTab>('testcases');
  const [activeCase, setActiveCase] = useState(0);

  // Custom input per test case
  const [customInputs, setCustomInputs] = useState<string[]>([]);

  // Run state
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState<{ error: string | null; output: string }[]>([]);

  // Submit state
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const [submitVerdict, setSubmitVerdict] = useState<any>(null);
  const queryClient = useQueryClient();

  const submitMutation = useSubmitCode();
  const { data: submissionsData } = useSubmissions(
    problem ? { problemId: problem.id } : undefined,
  );
  // Fetch full submission detail when we have a lastSubmissionId with verdict
  const { data: submissionDetail } = useSubmission(
    submitVerdict?.verdict && submitVerdict.verdict !== 'PENDING' && submitVerdict.verdict !== 'JUDGING'
      ? lastSubmissionId || ''
      : '',
  );

  useVerdictUpdates(lastSubmissionId, useCallback((data) => {
    setSubmitVerdict(data);
    setBottomTab('result');
    queryClient.invalidateQueries({ queryKey: ['submissions'] });
    if (data.submissionId) {
      queryClient.invalidateQueries({ queryKey: ['submission', data.submissionId] });
    }
  }, [queryClient]));

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang] || '');
  };

  // Initialize custom inputs from sample test cases
  const sampleCases = problem?.sampleTestCases || [];
  if (customInputs.length === 0 && sampleCases.length > 0) {
    // Will be set on first render
  }

  const getInputs = () => {
    if (customInputs.length > 0) return customInputs;
    return sampleCases.map((tc: any) => tc.input);
  };

  // Run against sample test cases
  const handleRun = async () => {
    if (!code.trim() || !problem) return;
    setIsRunning(true);
    setRunResults([]);
    setBottomTab('result');
    setSubmitVerdict(null);

    const inputs = getInputs();
    const results: { error: string | null; output: string }[] = [];

    for (const input of inputs) {
      try {
        const result = await api.post<{ error: string | null; output: string }>(
          '/submissions/run',
          { language, sourceCode: code, input },
          { token: token ?? undefined },
        );
        results.push(result);
      } catch (err: any) {
        results.push({ error: err.message || 'Run failed', output: '' });
      }
      // Update progressively
      setRunResults([...results]);
    }

    setIsRunning(false);
  };

  // Submit for full judging
  const handleSubmit = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!problem || !code.trim()) return;

    setSubmitVerdict(null);
    setRunResults([]);
    setBottomTab('result');

    const result = await submitMutation.mutateAsync({
      problemId: problem.id,
      language,
      sourceCode: code,
    });
    setLastSubmissionId(result.id);
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-rf-black"><div className="text-rf-gray">Loading problem...</div></div>;
  }
  if (!problem) {
    return <div className="h-screen flex items-center justify-center bg-rf-black"><div className="text-rf-gray">Problem not found.</div></div>;
  }

  return (
    <div className="h-screen flex flex-col bg-rf-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-[#2a2a30] bg-rf-black/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/problems" className="text-sm text-rf-gray hover:text-white">&larr; Problems</Link>
          <span className="text-sm font-medium text-white">{problem.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector value={language} onChange={handleLanguageChange} />
          <button
            onClick={handleRun}
            disabled={isRunning || !code.trim()}
            className="px-4 py-1.5 text-sm font-medium border border-[#2a2a30] hover:border-rf-iron disabled:opacity-50 text-rf-light rounded-lg transition-colors"
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !code.trim()}
            className="px-4 py-1.5 text-sm font-medium bg-white hover:bg-gray-200 disabled:opacity-50 text-rf-black rounded-lg transition-colors"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel */}
        <div className="w-[45%] border-r border-[#2a2a30] flex flex-col min-h-0">
          <div className="flex border-b border-[#2a2a30] shrink-0">
            {(['problem', 'submissions'] as LeftTab[]).map((t) => (
              <button key={t} onClick={() => setLeftTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${leftTab === t ? 'text-white border-b-2 border-white' : 'text-rf-gray hover:text-white'}`}
              >{t}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {leftTab === 'problem' ? (
              <ProblemStatement problem={problem} />
            ) : (
              <div className="space-y-2">
                {!submissionsData?.submissions.length ? (
                  <p className="text-sm text-rf-gray">No submissions yet.</p>
                ) : submissionsData.submissions.map((sub: any) => (
                  <Link key={sub.id} href={`/submissions/${sub.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#2a2a30] bg-[#141416] hover:border-rf-iron transition-colors">
                    <div className="flex items-center gap-3">
                      <VerdictBadge verdict={sub.verdict} />
                      <span className="text-xs text-rf-gray">{sub.language}</span>
                    </div>
                    <div className="text-xs text-rf-gray">
                      {sub.timeUsed !== null && <span>{sub.timeUsed}ms &middot; </span>}
                      {new Date(sub.createdAt).toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: editor + bottom */}
        <div className="w-[55%] flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <CodeEditor language={language} value={code} onChange={setCode} />
          </div>

          {/* Bottom panel */}
          <div className="h-[38%] border-t border-[#2a2a30] flex flex-col shrink-0">
            <div className="flex border-b border-[#2a2a30] shrink-0 px-2">
              {(['testcases', 'result'] as BottomTab[]).map((t) => (
                <button key={t} onClick={() => setBottomTab(t)}
                  className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${bottomTab === t ? 'text-white border-b-2 border-white' : 'text-rf-gray hover:text-white'}`}
                >
                  {t === 'testcases' ? 'Testcase' : 'Test Result'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {bottomTab === 'testcases' && (
                <div>
                  {/* Case tabs */}
                  <div className="flex gap-2 mb-3">
                    {sampleCases.map((_: any, i: number) => (
                      <button key={i} onClick={() => setActiveCase(i)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${activeCase === i ? 'bg-[#22222a] text-white' : 'text-rf-gray hover:text-white'}`}
                      >Case {i + 1}</button>
                    ))}
                  </div>
                  {sampleCases[activeCase] && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-rf-gray mb-1 block">Input</label>
                        <textarea
                          value={customInputs[activeCase] ?? sampleCases[activeCase].input}
                          onChange={(e) => {
                            const newInputs = [...(customInputs.length ? customInputs : sampleCases.map((tc: any) => tc.input))];
                            newInputs[activeCase] = e.target.value;
                            setCustomInputs(newInputs);
                          }}
                          className="w-full h-20 px-3 py-2 bg-rf-dark border border-[#2a2a30] rounded-lg text-white text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-rf-iron"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-rf-gray mb-1 block">Expected Output</label>
                        <pre className="px-3 py-2 bg-rf-dark border border-[#2a2a30] rounded-lg text-rf-light text-xs font-mono">{sampleCases[activeCase].output}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {bottomTab === 'result' && (
                <div>
                  {/* Running spinner */}
                  {isRunning && (
                    <div className="flex items-center gap-2 text-xs text-rf-gray mb-3">
                      <div className="w-3 h-3 border-2 border-rf-gray border-t-transparent rounded-full animate-spin" />
                      Running ({runResults.length}/{sampleCases.length})...
                    </div>
                  )}

                  {/* Run results — per test case like LeetCode */}
                  {runResults.length > 0 && !submitVerdict && (
                    <div>
                      {/* Overall status */}
                      {!isRunning && (
                        <div className="flex items-center gap-3 mb-3">
                          {runResults.every((r) => !r.error && sampleCases[runResults.indexOf(r)] &&
                            r.output.trim() === sampleCases[runResults.indexOf(r)].output.trim()) ? (
                            <span className="text-sm font-bold text-green-400">Accepted</span>
                          ) : runResults.some((r) => r.error) ? (
                            <span className="text-sm font-bold text-red-400">{runResults.find((r) => r.error)?.error}</span>
                          ) : (
                            <span className="text-sm font-bold text-red-400">Wrong Answer</span>
                          )}
                          <span className="text-xs text-rf-gray">Runtime: {runResults.length} test(s)</span>
                        </div>
                      )}

                      {/* Case tabs */}
                      <div className="flex gap-2 mb-3">
                        {runResults.map((r, i) => {
                          const passed = !r.error && sampleCases[i] && r.output.trim() === sampleCases[i].output.trim();
                          return (
                            <button key={i} onClick={() => setActiveCase(i)}
                              className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition-colors ${
                                activeCase === i ? 'bg-[#22222a] text-white' : 'text-rf-gray hover:text-white'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${passed ? 'bg-green-400' : 'bg-red-400'}`} />
                              Case {i + 1}
                            </button>
                          );
                        })}
                      </div>

                      {/* Active case detail */}
                      {runResults[activeCase] && (
                        <div className="space-y-2">
                          {runResults[activeCase].error ? (
                            <pre className="px-3 py-2 bg-rf-dark border border-red-800/30 rounded-lg text-red-300 text-xs font-mono whitespace-pre-wrap max-h-28 overflow-y-auto">
                              {runResults[activeCase].output || runResults[activeCase].error}
                            </pre>
                          ) : (
                            <>
                              <div>
                                <label className="text-xs text-rf-gray mb-1 block">Input</label>
                                <pre className="px-3 py-2 bg-rf-dark border border-[#2a2a30] rounded-lg text-rf-light text-xs font-mono">{customInputs[activeCase] ?? sampleCases[activeCase]?.input}</pre>
                              </div>
                              <div>
                                <label className="text-xs text-rf-gray mb-1 block">Output</label>
                                <pre className="px-3 py-2 bg-rf-dark border border-[#2a2a30] rounded-lg text-white text-xs font-mono">{runResults[activeCase].output || '(no output)'}</pre>
                              </div>
                              <div>
                                <label className="text-xs text-rf-gray mb-1 block">Expected</label>
                                <pre className="px-3 py-2 bg-rf-dark border border-[#2a2a30] rounded-lg text-rf-light text-xs font-mono">{sampleCases[activeCase]?.output}</pre>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit result */}
                  {(submitMutation.isPending || submitVerdict) && !runResults.length && (
                    <div>
                      {submitMutation.isPending && !submitVerdict && (
                        <div className="flex items-center gap-2 text-xs text-rf-gray">
                          <div className="w-3 h-3 border-2 border-rf-gray border-t-transparent rounded-full animate-spin" />
                          Judging against all test cases...
                        </div>
                      )}

                      {submitVerdict && (
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <VerdictBadge verdict={submitVerdict.verdict} />
                            {submitVerdict.timeUsed && (
                              <span className="text-xs text-rf-gray">Runtime: {submitVerdict.timeUsed}ms</span>
                            )}
                          </div>

                          {/* Per-test-case results from submission detail */}
                          {submissionDetail?.testResults?.length > 0 && (
                            <div>
                              <div className="flex gap-2 mb-3">
                                {submissionDetail.testResults.map((tr: any, i: number) => (
                                  <button key={i} onClick={() => setActiveCase(i)}
                                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition-colors ${
                                      activeCase === i ? 'bg-[#22222a] text-white' : 'text-rf-gray hover:text-white'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${tr.verdict === 'ACCEPTED' ? 'bg-green-400' : 'bg-red-400'}`} />
                                    Case {i + 1}
                                  </button>
                                ))}
                              </div>
                              {submissionDetail.testResults[activeCase] && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <VerdictBadge verdict={submissionDetail.testResults[activeCase].verdict} short />
                                    {submissionDetail.testResults[activeCase].timeUsed !== null && (
                                      <span className="text-xs text-rf-gray">{submissionDetail.testResults[activeCase].timeUsed}ms</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {submitVerdict.verdict === 'ACCEPTED' && (
                            <div className="mt-2 text-xs text-green-400">All test cases passed!</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty state */}
                  {!isRunning && !runResults.length && !submitVerdict && !submitMutation.isPending && (
                    <div className="text-xs text-rf-gray">
                      Click &quot;Run&quot; to test against sample cases, or &quot;Submit&quot; to judge all test cases.
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
