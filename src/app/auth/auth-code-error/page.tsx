import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication Error | Commander Stadium",
};

export default function AuthCodeErrorPage() {
  return (
    <div className="animated-gradient min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold mb-4">
          Authentication Error
        </h1>
        <p className="text-[var(--foreground-muted)] mb-8 max-w-md">
          There was a problem verifying your email. The link may have expired or
          already been used.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="btn-primary px-6 py-3 rounded-lg text-white font-medium"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="btn-secondary px-6 py-3 rounded-lg text-[var(--foreground)]"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

