import dynamic from "next/dynamic";
import { Shimmer } from "@/components/ui/Shimmer";

const Hero = dynamic(() => import("@/components/landing/Hero").then(m => ({ default: m.Hero })), {
  loading: () => <div className="h-96 shimmer" />,
  ssr: true,
});

const Stats = dynamic(() => import("@/components/landing/Stats").then(m => ({ default: m.Stats })), {
  loading: () => (
    <div className="section-compact border-t border-slate-200 dark:border-slate-800">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Shimmer key={i} className="h-24" />
        ))}
      </div>
    </div>
  ),
  ssr: false,
});

const ProtocolShowcase = dynamic(() => import("@/components/landing/ProtocolShowcaseWrapper").then(m => ({ default: m.ProtocolShowcase })), {
  loading: () => (
    <div className="section border-t border-slate-200 dark:border-slate-800">
      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3, 4].map(i => <Shimmer key={i} className="h-32" />)}
      </div>
    </div>
  ),
  ssr: false,
});

const Features = dynamic(() => import("@/components/landing/Features").then(m => ({ default: m.Features })), {
  loading: () => (
    <div className="section">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => <Shimmer key={i} className="h-40" />)}
      </div>
    </div>
  ),
  ssr: false,
});

const HowItWorks = dynamic(() => import("@/components/landing/HowItWorks").then(m => ({ default: m.HowItWorks })), {
  loading: () => (
    <div className="section-narrow">
      <div className="space-y-8">
        {[1, 2, 3].map(i => <Shimmer key={i} className="h-24" />)}
      </div>
    </div>
  ),
  ssr: false,
});

const PolicyTypes = dynamic(() => import("@/components/landing/PolicyTypes").then(m => ({ default: m.PolicyTypes })), {
  loading: () => (
    <div className="section">
      <div className="grid gap-6 lg:grid-cols-3">
        {[1, 2, 3].map(i => <Shimmer key={i} className="h-40" />)}
      </div>
    </div>
  ),
  ssr: false,
});

const Pricing = dynamic(() => import("@/components/landing/Pricing").then(m => ({ default: m.Pricing })), {
  loading: () => (
    <div className="section">
      <Shimmer className="h-64" />
    </div>
  ),
  ssr: false,
});

const Testimonials = dynamic(() => import("@/components/landing/Testimonials").then(m => ({ default: m.Testimonials })), {
  loading: () => (
    <div className="section border-t border-slate-200 dark:border-slate-800">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <Shimmer key={i} className="h-32" />)}
      </div>
    </div>
  ),
  ssr: false,
});

const FAQ = dynamic(() => import("@/components/landing/FAQ").then(m => ({ default: m.FAQ })), {
  loading: () => (
    <div className="section-narrow">
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => <Shimmer key={i} className="h-16" />)}
      </div>
    </div>
  ),
  ssr: false,
});

const CTA = dynamic(() => import("@/components/landing/CTA").then(m => ({ default: m.CTA })), {
  loading: () => (
    <div className="section">
      <Shimmer className="h-48" />
    </div>
  ),
  ssr: false,
});

const Footer = dynamic(() => import("@/components/landing/Footer").then(m => ({ default: m.Footer })), {
  loading: () => <div className="h-64 shimmer" />,
  ssr: true,
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProtocolShowcase />
      <Stats />
      <Features />
      <HowItWorks />
      <PolicyTypes />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}
