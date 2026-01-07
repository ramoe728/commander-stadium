const STEPS = [
  {
    number: 1,
    color: "bg-[var(--accent-primary)]",
    title: "Create or Join a Game",
    description:
      "Browse open lobbies or create your own private room. Share the link with friends — no sign-up needed.",
  },
  {
    number: 2,
    color: "bg-[var(--accent-secondary)]",
    title: "Load Your Deck",
    description:
      "Paste a decklist or import from popular deck builders. Cards are automatically fetched with full art and oracle text.",
  },
  {
    number: 3,
    color: "bg-[var(--accent-tertiary)]",
    title: "Play Like Paper",
    description:
      "Drag cards, tap permanents, track life totals. Everything syncs in real-time. You handle the rules — we handle the table.",
  },
];

/** Step-by-step guide section */
export function HowItWorks() {
  return (
    <section className="relative z-10 px-6 py-24 md:px-12 lg:px-20 border-t border-[var(--border)]">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold text-center mb-16">
          Get Started in Seconds
        </h2>

        <div className="space-y-12">
          {STEPS.map((step) => (
            <Step key={step.number} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface StepProps {
  number: number;
  color: string;
  title: string;
  description: string;
}

/** Individual step with number badge */
function Step({ number, color, title, description }: StepProps) {
  return (
    <div className="flex gap-6 items-start">
      <div
        className={`flex-shrink-0 w-12 h-12 rounded-full ${color} flex items-center justify-center font-bold text-white`}
      >
        {number}
      </div>
      <div>
        <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold mb-2">
          {title}
        </h3>
        <p className="text-[var(--foreground-muted)] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

