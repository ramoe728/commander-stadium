import { Metadata } from "next";
import { AuthForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Sign In | Commander Stadium",
  description: "Sign in to your Commander Stadium account",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-bold text-center mb-2">
        Welcome Back
      </h1>
      <p className="text-[var(--foreground-muted)] text-center mb-8">
        Sign in to access your decks and game history
      </p>
      <AuthForm mode="login" />
    </>
  );
}

