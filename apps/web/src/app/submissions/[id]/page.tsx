'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { VerdictBadge } from '@/components/submissions/VerdictBadge';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { useSubmission } from '@/hooks/use-api';
import { LANGUAGE_DISPLAY } from '@rankforge/shared';

export default function SubmissionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: submission, isLoading } = useSubmission(id);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Loading submission...</div>
        </div>
      </>
    );
  }

  if (!submission) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-400">Submission not found.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-zinc-100">
                Submission #{id.slice(0, 8)}
              </h1>
              <VerdictBadge verdict={submission.verdict} />
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <Link
                href={`/problems/${submission.problemSlug}`}
                className="hover:text-emerald-400 transition-colors"
              >
                {submission.problemTitle}
              </Link>
              <span>by {submission.username}</span>
              <span>{(LANGUAGE_DISPLAY as any)[submission.language]}</span>
              <span>{new Date(submission.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Verdict" value={submission.verdict.replace(/_/g, ' ')} />
          <StatCard
            label="Time"
            value={submission.timeUsed !== null ? `${submission.timeUsed}ms` : '—'}
          />
          <StatCard
            label="Memory"
            value={submission.memoryUsed !== null ? `${submission.memoryUsed}KB` : '—'}
          />
          <StatCard
            label="Score"
            value={submission.score !== null ? String(submission.score) : '—'}
          />
        </div>

        {/* Test Results */}
        {submission.testResults.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">Test Results</h2>
            <div className="flex flex-wrap gap-2">
              {submission.testResults.map((tr: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-900/50"
                >
                  <span className="text-xs text-zinc-500">#{tr.order + 1}</span>
                  <VerdictBadge verdict={tr.verdict} short />
                  {tr.timeUsed !== null && (
                    <span className="text-xs text-zinc-500">{tr.timeUsed}ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Code */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-200 mb-3">Source Code</h2>
          <div className="h-96">
            <CodeEditor
              language={submission.language}
              value={submission.sourceCode}
              onChange={() => {}}
              readOnly
            />
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 border border-zinc-800 rounded-lg bg-zinc-900/50">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-zinc-200 mt-0.5">{value}</p>
    </div>
  );
}
