import { Metadata } from "next";
import { AuthForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Create Account | Commander Stadium",
  description: "Create your Commander Stadium account to save decks and track games",
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="font-[family-name:var(--font-cinzel)] text-2xl font-bold text-center mb-2">
        Create Account
      </h1>
      <p className="text-[var(--foreground-muted)] text-center mb-8">
        Save your decks, track games, and add friends
      </p>
      <AuthForm mode="register" />
    </>
  );
}

