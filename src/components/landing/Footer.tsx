import { CONTRACT_ADDRESS } from "@/lib/constants";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-12">
          {/* Brand — takes more space */}
          <div className="md:col-span-5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Logo className="h-7 w-7 transition-transform duration-300 group-hover:rotate-12" />
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                ShieldLayer
              </span>
            </Link>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Parametric insurance on GenLayer. Automated claims subject to
              pool liquidity and oracle consensus.
            </p>
            <div className="mt-4 flex gap-3">
              <SocialLink
                href="https://x.com/genlayer"
                label="X / Twitter"
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              />
              <SocialLink
                href="https://github.com/genlayer"
                label="GitHub"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
              <SocialLink
                href="https://studio.genlayer.com/"
                label="GenLayer Studio"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </div>
          </div>

          {/* Links — compact columns */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Product
            </h3>
            <nav className="mt-3 flex flex-col gap-2" aria-label="Product">
              {[
                ["/policies", "Policies"],
                ["/claims", "Claims"],
                ["/dashboard", "Dashboard"],
                ["/new-policy", "New Policy"],
                ["/explorer", "Explorer"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Resources
            </h3>
            <nav className="mt-3 flex flex-col gap-2" aria-label="Resources">
              <a
                href="https://studio.genlayer.com/"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand transition-colors"
              >
                GenLayer Studio
              </a>
              <Link
                href="/privacy"
                className="text-sm text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-slate-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand transition-colors"
              >
                Terms
              </Link>
            </nav>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Contract
            </h3>
            <p className="mt-3 font-mono text-xs text-slate-400 dark:text-slate-500 break-all leading-relaxed">
              {CONTRACT_ADDRESS}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} ShieldLayer
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Chain 61999
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, d }: { href: string; label: string; d: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-brand hover:scale-110 dark:hover:bg-slate-800 dark:hover:text-brand"
      aria-label={label}
    >
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d={d} />
      </svg>
    </a>
  );
}
