"use client";

import dynamic from "next/dynamic";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const ProtocolShowcaseInner = dynamic(
  () => import("@/components/landing/ProtocolShowcase").then((m) => m.ProtocolShowcase),
  { ssr: false }
);

export function ProtocolShowcase() {
  return (
    <AnimatedSection>
      <ProtocolShowcaseInner />
    </AnimatedSection>
  );
}
