// Re-mounts on every navigation → gives a lightweight crossfade page transition.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="h-full rf-page-enter">{children}</div>;
}
