import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  iconColor: string;
  title: string;
  description: string;
}

/** Feature card with icon, title, and description */
export function FeatureCard({
  icon,
  iconColor,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="feature-card rounded-2xl p-6">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconColor} to-transparent flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold mb-2">
        {title}
      </h3>
      <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

