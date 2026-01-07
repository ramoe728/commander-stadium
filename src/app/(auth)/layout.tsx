import Link from "next/link";
import { Logo } from "@/components/layout";

/**
 * Shared layout for auth pages (login, register).
 * Centered card design with background effects.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="animated-gradient min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="particles absolute inset-0 pointer-events-none opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)] pointer-events-none" />

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-8"
        >
          <Logo />
          <span className="font-[family-name:var(--font-cinzel)] text-2xl font-semibold tracking-wide">
            Commander Stadium
          </span>
        </Link>

        {/* Card */}
        <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

