import Link from "next/link";

// Icon components for features
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="animated-gradient min-h-screen relative overflow-hidden">
      {/* Particle overlay */}
      <div className="particles absolute inset-0 pointer-events-none opacity-50" />

      {/* Radial glow behind hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
            <span className="text-white font-bold text-lg font-[var(--font-cinzel)]">
              CS
            </span>
          </div>
          <span className="font-[family-name:var(--font-cinzel)] text-xl font-semibold tracking-wide">
            Commander Stadium
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/lobby"
            className="btn-secondary px-5 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            Browse Games
          </Link>
          <Link
            href="/login"
            className="btn-primary px-5 py-2 rounded-lg text-white font-medium"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 md:pt-32 md:pb-40">
        {/* Badge */}
        <div className="mb-6 px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground-muted)]">
          <span className="text-[var(--accent-secondary)]">✦</span> Free &
          Open Source
        </div>

        {/* Main heading */}
        <h1 className="font-[family-name:var(--font-cinzel)] text-5xl md:text-7xl lg:text-8xl font-bold text-center max-w-5xl leading-tight tracking-tight">
          <span className="glow-text text-[var(--foreground)]">
            Command the
          </span>
          <br />
          <span className="bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-primary-glow)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
            Battlefield
          </span>
        </h1>

        {/* Subheading */}
        <p className="mt-8 text-xl md:text-2xl text-[var(--foreground-muted)] text-center max-w-2xl leading-relaxed">
          Play Magic: The Gathering Commander with friends online. An open
          tabletop where you control the game — just like paper Magic.
        </p>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link
            href="/lobby"
            className="btn-primary px-8 py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-2 min-w-[200px]"
          >
            <BoltIcon className="w-5 h-5" />
            Play Now
          </Link>
          <Link
            href="/how-it-works"
            className="btn-secondary px-8 py-4 rounded-xl text-[var(--foreground)] font-medium text-lg flex items-center justify-center min-w-[200px]"
          >
            How It Works
          </Link>
        </div>

        {/* Quick stats */}
        <div className="mt-16 flex gap-12 text-center">
          <div>
            <div className="text-3xl font-bold text-[var(--foreground)]">4</div>
            <div className="text-sm text-[var(--foreground-muted)]">
              Players per game
            </div>
          </div>
          <div className="w-px bg-[var(--border)]" />
          <div>
            <div className="text-3xl font-bold text-[var(--foreground)]">∞</div>
            <div className="text-sm text-[var(--foreground-muted)]">
              Cards supported
            </div>
          </div>
          <div className="w-px bg-[var(--border)]" />
          <div>
            <div className="text-3xl font-bold text-[var(--foreground)]">$0</div>
            <div className="text-sm text-[var(--foreground-muted)]">
              Forever free
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold text-center mb-4">
            Built for Commander
          </h2>
          <p className="text-[var(--foreground-muted)] text-center mb-16 max-w-2xl mx-auto">
            Everything you need for the ultimate multiplayer Magic experience
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="feature-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-transparent flex items-center justify-center mb-4">
                <UsersIcon className="w-6 h-6 text-[var(--accent-primary)]" />
              </div>
              <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold mb-2">
                4-Player Games
              </h3>
              <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">
                True Commander experience with up to 4 players battling it out
                in real-time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-secondary)]/20 to-transparent flex items-center justify-center mb-4">
                <SparklesIcon className="w-6 h-6 text-[var(--accent-secondary)]" />
              </div>
              <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold mb-2">
                Open Tabletop
              </h3>
              <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">
                You control the board. Move cards freely, just like playing on a
                real table.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-tertiary)]/20 to-transparent flex items-center justify-center mb-4">
                <BoltIcon className="w-6 h-6 text-[var(--accent-tertiary)]" />
              </div>
              <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold mb-2">
                Instant Play
              </h3>
              <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">
                No account required. Jump into a game as a guest and start
                playing immediately.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--mana-green)]/20 to-transparent flex items-center justify-center mb-4">
                <ShieldIcon className="w-6 h-6 text-[var(--mana-green)]" />
              </div>
              <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold mb-2">
                All Cards Free
              </h3>
              <p className="text-[var(--foreground-muted)] text-sm leading-relaxed">
                Access every Commander-legal card. Build your dream deck without
                spending a dime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 px-6 py-24 md:px-12 lg:px-20 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold text-center mb-16">
            Get Started in Seconds
          </h2>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--accent-primary)] flex items-center justify-center font-bold text-white">
                1
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold mb-2">
                  Create or Join a Game
                </h3>
                <p className="text-[var(--foreground-muted)] leading-relaxed">
                  Browse open lobbies or create your own private room. Share the
                  link with friends — no sign-up needed.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--accent-secondary)] flex items-center justify-center font-bold text-white">
                2
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold mb-2">
                  Load Your Deck
                </h3>
                <p className="text-[var(--foreground-muted)] leading-relaxed">
                  Paste a decklist or import from popular deck builders. Cards
                  are automatically fetched with full art and oracle text.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--accent-tertiary)] flex items-center justify-center font-bold text-white">
                3
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold mb-2">
                  Play Like Paper
                </h3>
                <p className="text-[var(--foreground-muted)] leading-relaxed">
                  Drag cards, tap permanents, track life totals. Everything
                  syncs in real-time. You handle the rules — we handle the
                  table.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-5xl font-bold mb-6">
            Ready to Battle?
          </h2>
          <p className="text-[var(--foreground-muted)] text-lg mb-8">
            Your pod is waiting. Create a game and send the link to your
            friends.
          </p>
          <Link
            href="/lobby"
            className="btn-primary inline-flex px-10 py-4 rounded-xl text-white font-semibold text-lg items-center gap-2"
          >
            <BoltIcon className="w-5 h-5" />
            Enter the Stadium
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)] px-6 py-8 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <span className="font-[family-name:var(--font-cinzel)]">
              Commander Stadium
            </span>
          </div>
          <div className="text-sm text-[var(--foreground-subtle)]">
            Not affiliated with Wizards of the Coast. Card data provided by
            Scryfall.
          </div>
        </div>
      </footer>
    </div>
  );
}
