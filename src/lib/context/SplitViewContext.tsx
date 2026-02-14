"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";

export interface PaneData {
  id: string;
  slug: string;
  searchParams?: Record<string, string>;
}

export function getPaneKey(pane: PaneData): string {
  return pane.id;
}

interface SplitViewContextValue {
  panes: PaneData[];
  openPane: (slug: string, searchParams?: Record<string, string>, force?: boolean) => void;
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

function parseSplitParam(param: string | null): PaneData[] {
  if (!param) return [];
  return param.split(",").filter(Boolean).map((segment, index) => {
    const [slug, queryString] = segment.split("?");
    const id = `pane-${Date.now()}-${index}`;
    if (!queryString) return { id, slug };
    const searchParams: Record<string, string> = {};
    new URLSearchParams(queryString).forEach((v, k) => {
      searchParams[k] = v;
    });
    return { id, slug, searchParams };
  });
}

function buildSplitParam(panes: PaneData[]): string | null {
  if (panes.length === 0) return null;
  return panes
    .map((p) => {
      if (!p.searchParams || Object.keys(p.searchParams).length === 0) {
        return p.slug;
      }
      const qs = new URLSearchParams(p.searchParams).toString();
      return `${p.slug}?${qs}`;
    })
    .join(",");
}

export function SplitViewProvider({ children }: SplitViewProviderProps) {
  const [panes, setPanes] = useState<PaneData[]>([]);
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

  const syncUrl = useCallback((newPanes: PaneData[]) => {
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

  useEffect(() => {
    if (initialized && !isMobile) {
      syncUrl(panes);
    }
  }, [panes, initialized, isMobile, syncUrl]);

  const openPane = useCallback((slug: string, searchParams?: Record<string, string>, force?: boolean) => {
    if (isMobile) {
      const url = searchParams
        ? `/${slug}?${new URLSearchParams(searchParams).toString()}`
        : `/${slug}`;
      window.location.href = url;
      return;
    }

    setPanes((prev) => {
      const newPane: PaneData = {
        id: `pane-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        slug,
      };
      if (searchParams && Object.keys(searchParams).length > 0) {
        newPane.searchParams = searchParams;
      }
      
      if (!force) {
        const newParams = newPane.searchParams || {};
        const newKeys = Object.keys(newParams).sort().join(",");
        const newValues = Object.keys(newParams).sort().map(k => newParams[k]).join(",");
        const newSignature = `${newKeys}:${newValues}`;
        
        const exactMatch = prev.find((p) => {
          if (p.slug !== slug) return false;
          const pParams = p.searchParams || {};
          const pKeys = Object.keys(pParams).sort().join(",");
          const pValues = Object.keys(pParams).sort().map(k => pParams[k]).join(",");
          return `${pKeys}:${pValues}` === newSignature;
        });
        
        if (exactMatch) {
          return prev;
        }
      }
      
      return [...prev, newPane].slice(-2);
    });
  }, [isMobile]);

  const closePane = useCallback((index: number) => {
    setPanes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const closeAll = useCallback(() => {
    setPanes([]);
  }, []);

  const value = useMemo(
    () => ({
      panes,
      openPane,
      closePane,
      closeAll,
      isMobile,
    }),
    [panes, openPane, closePane, closeAll, isMobile]
  );

  return (
    <SplitViewContext.Provider value={value}>
      {children}
    </SplitViewContext.Provider>
  );
}
