import { Navigation, Footer } from "@/components/layout";
import {
  Hero,
  Features,
  HowItWorks,
  CallToAction,
} from "@/components/landing";

export default function Home() {
  return (
    <div className="animated-gradient min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="particles absolute inset-0 pointer-events-none opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)] pointer-events-none" />

      <Navigation />
      <Hero />
      <Features />
      <HowItWorks />
      <CallToAction />
      <Footer />
    </div>
  );
}
