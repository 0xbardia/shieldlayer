import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function CTA() {
  return (
    <section className="section">
      <AnimatedSection>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-8 py-12 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="heading-section">Cover the next delay.</h2>
            <p className="mt-3 max-w-xl text-brand-100 text-lg">
              Connect a wallet, buy a policy, and let GenLayer settle the rest.
            </p>
            <Link href="/new-policy" prefetch={true} className="mt-6 inline-block">
              <Button className="bg-white text-brand-700 hover:bg-brand-50 shadow-lg">
                Get insured
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
