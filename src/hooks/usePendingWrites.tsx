"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Ctx = {
  pending: number;
  begin: () => void;
  end: () => void;
};

const PendingWritesContext = createContext<Ctx | null>(null);

export function PendingWritesProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0);
  const begin = useCallback(() => setPending((n) => n + 1), []);
  const end = useCallback(() => setPending((n) => Math.max(0, n - 1)), []);
  const value = useMemo(() => ({ pending, begin, end }), [pending, begin, end]);
  return <PendingWritesContext.Provider value={value}>{children}</PendingWritesContext.Provider>;
}

export function usePendingWrites() {
  const ctx = useContext(PendingWritesContext);
  if (!ctx) {
    return { pending: 0, begin: () => undefined, end: () => undefined };
  }
  return ctx;
}
