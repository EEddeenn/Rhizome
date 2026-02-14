"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";

interface SplitViewContextValue {
  panes: string[];
  openPane: (slug: string) => void;
  closePane: (index: number) => void;
  closeAll: () => void;
  isMobile: boolean;
}

const SplitViewContext = createContext<SplitViewContextValue | null>(null);

export function useSplitView(): SplitViewContextValue {
  const ctx = useContext(SplitViewContext);
  if (!ctx) {
    throw new Error("useSplitView must be used within SplitViewProvider");
  }
  return ctx;
}

interface SplitViewProviderProps {
  children: ReactNode;
}

const MOBILE_BREAKPOINT = 768;

function parseSplitParam(param: string | null): string[] {
  if (!param) return [];
  return param.split(",").filter(Boolean);
}

function buildSplitParam(panes: string[]): string | null {
  if (panes.length === 0) return null;
  return panes.join(",");
}

export function SplitViewProvider({ children }: SplitViewProviderProps) {
  const [panes, setPanes] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile && panes.length > 0) {
        setPanes([]);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [panes.length]);

  useEffect(() => {
    if (isMobile) return;

    const params = new URLSearchParams(window.location.search);
    const splitParam = params.get("split");
    const parsed = parseSplitParam(splitParam);
    if (parsed.length > 0) {
      setPanes(parsed);
    }
    setInitialized(true);
  }, [isMobile]);

  const syncUrl = useCallback((newPanes: string[]) => {
    if (isMobile || typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const splitParam = buildSplitParam(newPanes);

    if (splitParam) {
      url.searchParams.set("split", splitParam);
    } else {
      url.searchParams.delete("split");
    }

    window.history.replaceState(null, "", url.toString());
  }, [isMobile]);

  const openPane = useCallback((slug: string) => {
    if (isMobile) {
      window.location.href = `/${slug}`;
      return;
    }

    setPanes((prev) => {
      if (prev.includes(slug)) return prev;
      const newPanes = [...prev, slug].slice(-2);
      syncUrl(newPanes);
      return newPanes;
    });
  }, [isMobile, syncUrl]);

  const closePane = useCallback((index: number) => {
    setPanes((prev) => {
      const newPanes = prev.filter((_, i) => i !== index);
      syncUrl(newPanes);
      return newPanes;
    });
  }, [syncUrl]);

  const closeAll = useCallback(() => {
    setPanes([]);
    syncUrl([]);
  }, [syncUrl]);

  useEffect(() => {
    if (initialized && !isMobile && panes.length > 0) {
      syncUrl(panes);
    }
  }, [panes, initialized, isMobile, syncUrl]);

  const value = useMemo(() => ({
    panes,
    openPane,
    closePane,
    closeAll,
    isMobile,
  }), [panes, openPane, closePane, closeAll, isMobile]);

  return (
    <SplitViewContext.Provider value={value}>
      {children}
    </SplitViewContext.Provider>
  );
}
