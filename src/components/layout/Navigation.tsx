import Link from "next/link";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";

/** Main navigation bar with logo and auth-aware menu */
export function Navigation() {
  return (
    <nav className="relative z-40 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
      <Link href="/" className="flex items-center gap-2">
        <Logo />
        <span className="font-[family-name:var(--font-cinzel)] text-xl font-semibold tracking-wide">
          Commander Stadium
        </span>
      </Link>

      <UserMenu />
    </nav>
  );
}

