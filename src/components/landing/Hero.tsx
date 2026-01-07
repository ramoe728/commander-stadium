import { Badge, Button } from "@/components/ui";
import { BoltIcon } from "@/components/icons";

/** Hero section with main headline, tagline, and CTAs */
export function Hero() {
  return (
    <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 md:pt-32 md:pb-40">
      <Badge>
        <span className="text-[var(--accent-secondary)]">✦</span> Free & Open
        Source
      </Badge>

      <h1 className="mt-6 font-[family-name:var(--font-cinzel)] text-5xl md:text-7xl lg:text-8xl font-bold text-center max-w-5xl leading-tight tracking-tight">
        <span className="glow-text text-[var(--foreground)]">Command the</span>
        <br />
        <span className="bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-primary-glow)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
          Battlefield
        </span>
      </h1>

      <p className="mt-8 text-xl md:text-2xl text-[var(--foreground-muted)] text-center max-w-2xl leading-relaxed">
        Play Magic: The Gathering Commander with friends online. An open
        tabletop where you control the game — just like paper Magic.
      </p>

      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        <Button href="/lobby" className="min-w-[200px]">
          <BoltIcon className="w-5 h-5" />
          Play Now
        </Button>
        <Button href="/how-it-works" variant="secondary" className="min-w-[200px]">
          How It Works
        </Button>
      </div>

      <QuickStats />
    </main>
  );
}

/** Stats row showing key metrics */
function QuickStats() {
  const stats = [
    { value: "4", label: "Players per game" },
    { value: "∞", label: "Cards supported" },
    { value: "$0", label: "Forever free" },
  ];

  return (
    <div className="mt-16 flex gap-12 text-center">
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex items-center gap-12">
          {index > 0 && <div className="w-px h-10 bg-[var(--border)]" />}
          <div>
            <div className="text-3xl font-bold text-[var(--foreground)]">
              {stat.value}
            </div>
            <div className="text-sm text-[var(--foreground-muted)]">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

