import { Logo } from "./Logo";

/** Site footer with branding and legal disclaimer */
export function Footer() {
  return (
    <footer className="relative z-10 border-t border-[var(--border)] px-6 py-8 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
          <Logo size="sm" />
          <span className="font-[family-name:var(--font-cinzel)]">
            Commander Stadium
          </span>
        </div>
        <p className="text-sm text-[var(--foreground-subtle)]">
          Not affiliated with Wizards of the Coast. Card data provided by
          Scryfall.
        </p>
      </div>
    </footer>
  );
}

