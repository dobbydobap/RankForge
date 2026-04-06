'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ProblemStatementProps {
  problem: {
    title: string;
    statement: string;
    constraints: string | null;
    inputFormat: string;
    outputFormat: string;
    timeLimit: number;
    memoryLimit: number;
    difficulty: string;
    tags: string[];
    sampleTestCases: { input: string; output: string; order: number }[];
  };
}

export function ProblemStatement({ problem }: ProblemStatementProps) {
  return (
    <div className="space-y-6 overflow-y-auto pr-2">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-bold text-zinc-100">{problem.title}</h1>
          <DiffBadge difficulty={problem.difficulty} />
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span>Time: {problem.timeLimit}ms</span>
          <span>Memory: {problem.memoryLimit}MB</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {problem.tags.map((t) => (
            <span key={t} className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.statement}</ReactMarkdown>
      </div>

      {problem.constraints && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Constraints</h3>
          <pre className="text-xs text-zinc-400 bg-zinc-900 p-3 rounded-lg whitespace-pre-wrap">
            {problem.constraints}
          </pre>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-1">Input Format</h3>
        <p className="text-sm text-zinc-400">{problem.inputFormat}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-1">Output Format</h3>
        <p className="text-sm text-zinc-400">{problem.outputFormat}</p>
      </div>

      {problem.sampleTestCases.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">Examples</h3>
          {problem.sampleTestCases.map((tc, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Input</div>
                <pre className="text-xs text-zinc-300 bg-zinc-900 p-3 rounded-lg whitespace-pre font-mono overflow-x-auto">
                  {tc.input}
                </pre>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Output</div>
                <pre className="text-xs text-zinc-300 bg-zinc-900 p-3 rounded-lg whitespace-pre font-mono overflow-x-auto">
                  {tc.output}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiffBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    EASY: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
    MEDIUM: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
    HARD: 'bg-orange-900/50 text-orange-400 border-orange-800',
    EXPERT: 'bg-red-900/50 text-red-400 border-red-800',
  };
  const cls = colors[difficulty] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${cls}`}>
      {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
    </span>
  );
}
