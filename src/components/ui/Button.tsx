import Link from "next/link";
import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "btn-primary text-white font-semibold",
  secondary: "btn-secondary text-[var(--foreground)]",
};

/**
 * Styled link button component with primary/secondary variants.
 * Uses Next.js Link for client-side navigation.
 */
export function Button({
  href,
  variant = "primary",
  children,
  className = "",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`px-8 py-4 rounded-xl text-lg flex items-center justify-center gap-2 ${variantStyles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

