export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  text: string;
  avatar: string;
  verified: boolean;
  isSample: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sample User",
    role: "Operations Manager",
    company: "Example Corp",
    text: "Sample copy only. Claims still require oracle consensus and pool liquidity.",
    avatar: "S",
    verified: false,
    isSample: true,
  },
  {
    id: 2,
    name: "Sample User",
    role: "CFO",
    company: "Example Inc",
    text: "Storm cover that does not wait for an adjuster. We model it as cash.",
    avatar: "S",
    verified: false,
    isSample: true,
  },
  {
    id: 3,
    name: "Sample User",
    role: "Treasury Lead",
    company: "Example LLC",
    text: "Bankruptcy rider settled on the same block the filing hit the wire.",
    avatar: "S",
    verified: false,
    isSample: true,
  },
];

/**
 * Get testimonials to display.
 * Replace isSample entries with real testimonials as they are collected.
 */
export function getTestimonials(): Testimonial[] {
  return testimonials;
}
