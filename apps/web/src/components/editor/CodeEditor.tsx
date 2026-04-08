'use client';

import { useRef, useCallback } from 'react';
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

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
  }, []);

  return (
    <div className="h-full border border-rf-border rounded-lg overflow-hidden">
      <Editor
        height="100%"
        language={LANGUAGE_MAP[language] || 'plaintext'}
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
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
    </div>
  );
}
