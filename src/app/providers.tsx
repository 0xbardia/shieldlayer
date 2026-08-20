"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { I18nProvider } from "@/i18n/provider";
import { PendingWritesProvider } from "@/hooks/usePendingWrites";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <I18nProvider>
      <QueryClientProvider client={client}>
        <PendingWritesProvider>{children}</PendingWritesProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}
