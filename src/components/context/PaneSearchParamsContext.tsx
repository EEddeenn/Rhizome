"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

interface PaneSearchParamsContextValue {
  searchParams: Record<string, string>;
}

const PaneSearchParamsContext = createContext<PaneSearchParamsContextValue>({
  searchParams: {},
});

export function usePaneSearchParams(): Record<string, string> {
  return useContext(PaneSearchParamsContext).searchParams;
}

interface PaneSearchParamsProviderProps {
  searchParams?: Record<string, string>;
  children: ReactNode;
}

export function PaneSearchParamsProvider({
  searchParams = {},
  children,
}: PaneSearchParamsProviderProps) {
  const value = useMemo(() => ({ searchParams }), [searchParams]);
  return (
    <PaneSearchParamsContext.Provider value={value}>
      {children}
    </PaneSearchParamsContext.Provider>
  );
}
