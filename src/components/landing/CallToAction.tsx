import { Button } from "@/components/ui";
import { BoltIcon } from "@/components/icons";

/** Final call-to-action section before footer */
export function CallToAction() {
  return (
    <section className="relative z-10 px-6 py-24 md:px-12 lg:px-20">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-5xl font-bold mb-6">
          Ready to Battle?
        </h2>
        <p className="text-[var(--foreground-muted)] text-lg mb-8">
          Your pod is waiting. Create a game and send the link to your friends.
        </p>
        <Button href="/game-finder" className="inline-flex px-10">
          <BoltIcon className="w-5 h-5" />
          Enter the Stadium
        </Button>
      </div>
    </section>
  );
}

