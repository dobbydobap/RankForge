/**
 * Code execution engine using Wandbox API (free, no auth required).
 * https://wandbox.org/
 *
 * Supports: C, C++, Python, Java, JavaScript, TypeScript, Go, Rust, Ruby
 * Kotlin is not available on Wandbox — falls back to error message.
 */

const WANDBOX_API = 'https://wandbox.org/api/compile.json';

interface CompilerConfig {
  compiler: string;
  /** For Java: class must not be public since Wandbox uses prog.java */
  javaFix?: boolean;
}

const COMPILERS: Record<string, CompilerConfig> = {
  C:          { compiler: 'gcc-13.2.0-c' },
  CPP:        { compiler: 'gcc-13.2.0' },
  PYTHON:     { compiler: 'cpython-3.12.7' },
  JAVA:       { compiler: 'openjdk-jdk-22+36', javaFix: true },
  JAVASCRIPT: { compiler: 'nodejs-20.17.0' },
  TYPESCRIPT: { compiler: 'typescript-5.6.2' },
  GO:         { compiler: 'go-1.23.2' },
  RUST:       { compiler: 'rust-1.82.0' },
  RUBY:       { compiler: 'ruby-3.4.9' },
  KOTLIN:     { compiler: '' }, // Not supported on Wandbox
};

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  compilationError: string | null;
  exitCode: number;
  signal: string;
}

export async function executeCode(
  language: string,
  sourceCode: string,
  stdin: string,
  timeoutMs: number = 10000,
): Promise<ExecutionResult> {
  const config = COMPILERS[language];

  if (!config || !config.compiler) {
    return {
      success: false,
      stdout: '',
      stderr: `Language "${language}" is not supported for online execution.`,
      compilationError: null,
      exitCode: 1,
      signal: '',
    };
  }

  // Java fix: Wandbox saves as prog.java, so class must not be public
  let code = sourceCode;
  if (config.javaFix) {
    code = code.replace(/public\s+class\s+Solution/g, 'class Solution');
    code = code.replace(/public\s+class\s+Main/g, 'class Main');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs + 5000);

    const response = await fetch(WANDBOX_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        compiler: config.compiler,
        stdin,
        'runtime-option-raw': `-t${Math.ceil(timeoutMs / 1000)}`, // timeout in seconds
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        success: false,
        stdout: '',
        stderr: `Execution service returned ${response.status}`,
        compilationError: null,
        exitCode: 1,
        signal: '',
      };
    }

    const result = await response.json();

    // Check compilation error
    if (result.compiler_error && result.status !== '0' && !result.program_output) {
      return {
        success: false,
        stdout: '',
        stderr: result.compiler_error,
        compilationError: result.compiler_error,
        exitCode: parseInt(result.status) || 1,
        signal: result.signal || '',
      };
    }

    // Check runtime error / signal
    const exitCode = parseInt(result.status) || 0;
    const hasRuntimeError = exitCode !== 0 || !!result.signal;

    return {
      success: !hasRuntimeError,
      stdout: result.program_output || '',
      stderr: result.program_error || result.compiler_error || '',
      compilationError: null,
      exitCode,
      signal: result.signal || '',
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        stdout: '',
        stderr: 'Execution timed out',
        compilationError: null,
        exitCode: -1,
        signal: 'SIGKILL',
      };
    }
    return {
      success: false,
      stdout: '',
      stderr: err.message || 'Execution failed',
      compilationError: null,
      exitCode: 1,
      signal: '',
    };
  }
}
