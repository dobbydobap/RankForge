declare module 'monaco-vim' {
  // monaco-vim has no official type definitions.
  export function initVimMode(
    editor: unknown,
    statusBar?: HTMLElement | null,
  ): { dispose: () => void };
}
