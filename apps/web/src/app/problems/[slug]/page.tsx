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

const DEFAULT_CODE: Record<string, string> = {
  C: `#include <stdio.h>

int main() {

    return 0;
}`,
  CPP: `#include <bits/stdc++.h>
using namespace std;

int main() {

    return 0;
}`,
  PYTHON: `import sys
input = sys.stdin.readline

`,
  JAVA: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

    }
}`,
  JAVASCRIPT: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];

rl.on('line', (line) => lines.push(line));
rl.on('close', () => {

});`,
  TYPESCRIPT: `import * as readline from 'readline';
const rl = readline.createInterface({ input: process.stdin });
const lines: string[] = [];

rl.on('line', (line) => lines.push(line));
rl.on('close', () => {

});`,
  GO: `package main

import "fmt"

func main() {

}`,
  RUST: `use std::io::{self, BufRead};

fn main() {
    let stdin = io::stdin();
    for line in stdin.lock().lines() {
        let line = line.unwrap();
    }
}`,
  KOTLIN: `fun main() {
    val br = System.in.bufferedReader()

}`,
  RUBY: `# Read input
lines = STDIN.read.split("\\n")

`,
};

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, isAuthenticated } = useAuthStore();
  const { data: problem, isLoading } = useProblem(slug);

  const [language, setLanguage] = useState<string>(Language.CPP);
  const [code, setCode] = useState(DEFAULT_CODE[Language.CPP]);
  const [activeTab, setActiveTab] = useState<'problem' | 'submissions'>('problem');

  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const [liveVerdict, setLiveVerdict] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const submitMutation = useSubmitCode();
  const { data: submissionsData } = useSubmissions(
    problem ? { problemId: problem.id } : undefined,
  );

  // Live verdict updates via WebSocket
  useVerdictUpdates(lastSubmissionId, useCallback((data) => {
    setLiveVerdict(data.verdict);
    // Refresh submissions list when verdict arrives
    queryClient.invalidateQueries({ queryKey: ['submissions'] });
  }, [queryClient]));

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang] || '');
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!problem) return;

    setLiveVerdict(null);
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

  return (
    <div className="h-screen flex flex-col bg-rf-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-rf-border bg-rf-black/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/problems" className="text-sm text-rf-gray hover:text-rf-cream">
            &larr; Problems
          </Link>
          <span className="text-sm font-medium text-rf-cream">{problem.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector value={language} onChange={handleLanguageChange} />
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !code.trim()}
            className="px-4 py-1.5 text-sm font-medium bg-rf-accent hover:bg-rf-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Problem statement / submissions */}
        <div className="w-1/2 border-r border-rf-border flex flex-col min-h-0">
          <div className="flex border-b border-rf-border shrink-0">
            <button
              onClick={() => setActiveTab('problem')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'problem'
                  ? 'text-rf-sage border-b-2 border-rf-sage'
                  : 'text-rf-gray hover:text-rf-cream'
              }`}
            >
              Problem
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'submissions'
                  ? 'text-rf-sage border-b-2 border-rf-sage'
                  : 'text-rf-gray hover:text-rf-cream'
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
                  <p className="text-sm text-rf-muted">No submissions yet.</p>
                ) : (
                  submissionsData.submissions.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-rf-border bg-rf-dark/50"
                    >
                      <div className="flex items-center gap-3">
                        <VerdictBadge verdict={sub.verdict} />
                        <span className="text-xs text-rf-muted">{sub.language}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-rf-muted">
                        {sub.timeUsed !== null && <span>{sub.timeUsed}ms</span>}
                        {sub.memoryUsed !== null && <span>{sub.memoryUsed}KB</span>}
                        <span>{new Date(sub.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Code editor */}
        <div className="w-1/2 flex flex-col min-h-0">
          <div className="flex-1">
            <CodeEditor language={language} value={code} onChange={setCode} />
          </div>

          {/* Submission result — shows live verdict via WebSocket */}
          {submitMutation.isSuccess && (
            <div className="shrink-0 p-3 border-t border-rf-border bg-rf-dark/50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-rf-gray">Verdict:</span>
                <VerdictBadge verdict={liveVerdict || submitMutation.data?.verdict || 'PENDING'} />
                {!liveVerdict && submitMutation.data?.verdict === 'PENDING' && (
                  <span className="text-xs text-rf-muted animate-pulse">Judging...</span>
                )}
              </div>
            </div>
          )}
          {submitMutation.isError && (
            <div className="shrink-0 p-3 border-t border-rf-border bg-red-900/10">
              <p className="text-xs text-red-400">
                Submission failed: {(submitMutation.error as any)?.message || 'Unknown error'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
