interface LogoProps {
  size?: "sm" | "md";
}

const sizes = {
  sm: { container: "w-8 h-8", text: "text-sm" },
  md: { container: "w-10 h-10", text: "text-lg" },
};

/** Commander Stadium logo with gradient background */
export function Logo({ size = "md" }: LogoProps) {
  const { container, text } = sizes[size];

  return (
    <div
      className={`${container} rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center`}
    >
      <span className={`text-white font-bold ${text}`}>CS</span>
    </div>
  );
}

