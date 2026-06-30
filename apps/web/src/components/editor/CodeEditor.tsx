'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const LANGUAGE_MAP: Record<string, string> = {
  CPP: 'cpp',
  JAVA: 'java',
  PYTHON: 'python',
  JAVASCRIPT: 'javascript',
  GO: 'go',
};

export function CodeEditor({ language, value, onChange, readOnly }: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const vimRef = useRef<{ dispose: () => void } | null>(null);
  const [fontSize, setFontSize] = useState(14);
  const [vim, setVim] = useState(false);

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    if (!readOnly) editor.focus();
  }, [readOnly]);

  // Toggle Vim keybindings (monaco-vim) with a status bar.
  useEffect(() => {
    let cancelled = false;
    if (vim && editorRef.current && statusRef.current && !vimRef.current) {
      import('monaco-vim')
        .then((m) => {
          if (cancelled) return;
          vimRef.current = m.initVimMode(editorRef.current, statusRef.current);
        })
        .catch(() => {});
    } else if (!vim && vimRef.current) {
      vimRef.current.dispose();
      vimRef.current = null;
    }
    return () => {
      cancelled = true;
    };
  }, [vim]);

  useEffect(() => () => vimRef.current?.dispose(), []);

  return (
    <div className="relative h-full border border-[var(--c-border-2)] overflow-hidden">
      <div className="absolute top-2 right-3 z-10 flex items-center gap-1 font-mono">
        {!readOnly && (
          <button
            type="button"
            onClick={() => setVim((v) => !v)}
            className={`h-6 px-1.5 text-[10px] border transition-colors ${
              vim
                ? 'bg-[var(--c-fg)] text-[var(--c-bg)] border-[var(--c-fg)]'
                : 'border-[var(--c-border-2)] bg-[var(--c-surface)] text-[var(--c-fg)] hover:bg-[var(--c-surface-2)]'
            }`}
            title="Toggle Vim keybindings"
          >
            VIM
          </button>
        )}
        <button
          type="button"
          onClick={() => setFontSize((s) => Math.max(11, s - 1))}
          className="w-6 h-6 flex items-center justify-center text-[11px] border border-[var(--c-border-2)] bg-[var(--c-surface)] text-[var(--c-fg)] hover:bg-[var(--c-surface-2)] transition-colors"
          title="Decrease font size"
        >
          A-
        </button>
        <button
          type="button"
          onClick={() => setFontSize((s) => Math.min(22, s + 1))}
          className="w-6 h-6 flex items-center justify-center text-[11px] border border-[var(--c-border-2)] bg-[var(--c-surface)] text-[var(--c-fg)] hover:bg-[var(--c-surface-2)] transition-colors"
          title="Increase font size"
        >
          A+
        </button>
      </div>
      <Editor
        height="100%"
        language={LANGUAGE_MAP[language] || 'plaintext'}
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          fontSize,
          fontFamily: "'Geist Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          lineNumbers: 'on',
          readOnly,
          wordWrap: 'on',
          tabSize: 4,
          automaticLayout: true,
        }}
      />
      {vim && (
        <div
          ref={statusRef}
          className="absolute bottom-0 left-0 right-0 z-10 bg-[var(--c-surface)] border-t border-[var(--c-border-2)] px-3 py-1 text-[11px] font-mono text-rf-gray"
        />
      )}
    </div>
  );
}
