import Link from "next/link";
import { Logo } from "./Logo";

/** Main navigation bar with logo and auth links */
export function Navigation() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
      <Link href="/" className="flex items-center gap-2">
        <Logo />
        <span className="font-[family-name:var(--font-cinzel)] text-xl font-semibold tracking-wide">
          Commander Stadium
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/lobby"
          className="btn-secondary px-5 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Browse Games
        </Link>
        <Link
          href="/login"
          className="btn-primary px-5 py-2 rounded-lg text-white font-medium"
        >
          Sign In
        </Link>
      </div>
    </nav>
  );
}

