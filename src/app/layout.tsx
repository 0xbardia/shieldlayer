import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/shared/Navbar";
import { BottomNav } from "@/components/shared/BottomNav";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { GlobalErrorListener } from "@/components/shared/GlobalErrorListener";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: {
    default: "ShieldLayer: Protection, On-Chain",
    template: "%s | ShieldLayer",
  },
  description:
    "ShieldLayer is a parametric insurance protocol on GenLayer. AI-powered oracles, instant claims, real protection. Protection, On-Chain.",
  keywords: ["parametric insurance", "ShieldLayer", "GenLayer", "AI claims", "blockchain", "flight delay", "storm insurance"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ShieldLayer",
    title: "ShieldLayer: Protection, On-Chain",
    description: "ShieldLayer is a parametric insurance protocol on GenLayer. AI-powered oracles, instant claims, real protection. Protection, On-Chain.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShieldLayer: Protection, On-Chain",
    description: "ShieldLayer is a parametric insurance protocol on GenLayer. AI-powered oracles, instant claims, real protection. Protection, On-Chain.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ShieldLayer",
  description: "ShieldLayer is a parametric insurance protocol on GenLayer. Protection, On-Chain.",
  url: "https://shieldlayer.io",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GEN",
  },
  featureList: [
    "AI-verified claims",
    "Automated settlement subject to reserve",
    "No middlemen",
    "Flight delay insurance",
    "Storm insurance",
    "Bankruptcy insurance",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1E40AF" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <GlobalErrorListener />
        <ErrorBoundary>
          <Providers>
            <ToastProvider>
              <Navbar />
              <main className="pb-20 md:pb-0">{children}</main>
              <BottomNav />
            </ToastProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
