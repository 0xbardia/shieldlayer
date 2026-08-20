import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand dark:bg-brand-900/30 dark:text-brand-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">404</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">This page doesn&apos;t exist.</p>
        <p className="mt-2 text-sm font-medium text-brand-600 dark:text-brand-400">Protection, On-Chain</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
