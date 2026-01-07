import {
  UsersIcon,
  SparklesIcon,
  BoltIcon,
  ShieldIcon,
} from "@/components/icons";
import { FeatureCard } from "./FeatureCard";

const FEATURES = [
  {
    icon: <UsersIcon className="w-6 h-6 text-[var(--accent-primary)]" />,
    iconColor: "from-[var(--accent-primary)]/20",
    title: "4-Player Games",
    description:
      "True Commander experience with up to 4 players battling it out in real-time.",
  },
  {
    icon: <SparklesIcon className="w-6 h-6 text-[var(--accent-secondary)]" />,
    iconColor: "from-[var(--accent-secondary)]/20",
    title: "Open Tabletop",
    description:
      "You control the board. Move cards freely, just like playing on a real table.",
  },
  {
    icon: <BoltIcon className="w-6 h-6 text-[var(--accent-tertiary)]" />,
    iconColor: "from-[var(--accent-tertiary)]/20",
    title: "Instant Play",
    description:
      "No account required. Jump into a game as a guest and start playing immediately.",
  },
  {
    icon: <ShieldIcon className="w-6 h-6 text-[var(--mana-green)]" />,
    iconColor: "from-[var(--mana-green)]/20",
    title: "All Cards Free",
    description:
      "Access every Commander-legal card. Build your dream deck without spending a dime.",
  },
];

/** Features section showcasing key capabilities */
export function Features() {
  return (
    <section className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold text-center mb-4">
          Built for Commander
        </h2>
        <p className="text-[var(--foreground-muted)] text-center mb-16 max-w-2xl mx-auto">
          Everything you need for the ultimate multiplayer Magic experience
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

