import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
}

/** Small pill badge for highlighting labels */
export function Badge({ children }: BadgeProps) {
  return (
    <div className="px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground-muted)]">
      {children}
    </div>
  );
}

