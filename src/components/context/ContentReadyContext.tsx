"use client";

import { createContext, useContext, useRef, useCallback, useMemo, type ReactNode } from "react";

interface ContentReadyContextValue {
  isReady: (slug: string) => boolean;
  markReady: (slug: string) => void;
  reset: (slug: string) => void;
  waitForReady: (slug: string, callback: () => void, timeout?: number) => () => void;
}

const ContentReadyContext = createContext<ContentReadyContextValue | null>(null);

export function useContentReady(): ContentReadyContextValue {
  const ctx = useContext(ContentReadyContext);
  if (!ctx) {
    throw new Error("useContentReady must be used within ContentReadyProvider");
  }
  return ctx;
}

export function useContentReadyOptional(): ContentReadyContextValue | null {
  return useContext(ContentReadyContext);
}

export function ContentReadyProvider({ children }: { children: ReactNode }) {
  const readyStateRef = useRef<Record<string, boolean>>({});
  const pendingCallbacksRef = useRef<Map<string, Set<() => void>>>(new Map());

  const isReady = useCallback((slug: string): boolean => {
    return readyStateRef.current[slug] === true;
  }, []);

  const markReady = useCallback((slug: string) => {
    readyStateRef.current[slug] = true;

    const callbacks = pendingCallbacksRef.current.get(slug);
    if (callbacks) {
      callbacks.forEach((cb) => cb());
      pendingCallbacksRef.current.delete(slug);
    }
  }, []);

  const reset = useCallback((slug: string) => {
    delete readyStateRef.current[slug];
    pendingCallbacksRef.current.delete(slug);
  }, []);

  const waitForReady = useCallback(
    (slug: string, callback: () => void, timeout = 500): (() => void) => {
      if (readyStateRef.current[slug] === true) {
        callback();
        return () => {};
      }

      if (!pendingCallbacksRef.current.has(slug)) {
        pendingCallbacksRef.current.set(slug, new Set());
      }
      pendingCallbacksRef.current.get(slug)!.add(callback);

      const timeoutId = setTimeout(() => {
        const callbacks = pendingCallbacksRef.current.get(slug);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            pendingCallbacksRef.current.delete(slug);
          }
        }
        callback();
      }, timeout);

      return () => {
        clearTimeout(timeoutId);
        const callbacks = pendingCallbacksRef.current.get(slug);
        if (callbacks) {
          callbacks.delete(callback);
        }
      };
    },
    []
  );

  const value = useMemo(
    () => ({ isReady, markReady, reset, waitForReady }),
    [isReady, markReady, reset, waitForReady]
  );

  return (
    <ContentReadyContext.Provider value={value}>
      {children}
    </ContentReadyContext.Provider>
  );
}
