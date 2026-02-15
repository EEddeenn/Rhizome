"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

interface MermaidTrackerContextValue {
  register: () => void;
  markReady: () => void;
  isAllReady: boolean;
  hasPending: boolean;
}

const MermaidTrackerContext = createContext<MermaidTrackerContextValue | null>(null);

export function useMermaidTracker() {
  return useContext(MermaidTrackerContext);
}

export function MermaidTrackerProvider({ children }: { children: ReactNode }) {
  const [registeredCount, setRegisteredCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);

  const register = useCallback(() => {
    setRegisteredCount((c) => c + 1);
  }, []);

  const markReady = useCallback(() => {
    setReadyCount((c) => c + 1);
  }, []);

  const hasPending = registeredCount > 0;
  const isAllReady = registeredCount > 0 && readyCount >= registeredCount;

  const value = useMemo(
    () => ({ register, markReady, isAllReady, hasPending }),
    [register, markReady, isAllReady, hasPending]
  );

  return (
    <MermaidTrackerContext.Provider value={value}>
      {children}
    </MermaidTrackerContext.Provider>
  );
}
