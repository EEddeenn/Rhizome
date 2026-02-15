"use client";

import { useEffect, useRef } from "react";
import { useContentReadyOptional } from "@/components/context/ContentReadyContext";
import type { Entry } from "@/lib/content/types";

interface EntryPageClientProps {
  entry: Entry;
  children: React.ReactNode;
}

export function EntryPageClient({ entry, children }: EntryPageClientProps) {
  const contentReadyCtx = useContentReadyOptional();
  const containerRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!contentReadyCtx) return;

    contentReadyCtx.reset(entry.slug);
    readyRef.current = false;

    const checkReady = () => {
      if (readyRef.current) return true;
      
      const placeholders = containerRef.current?.querySelectorAll(".animate-pulse");
      if (!placeholders || placeholders.length === 0) {
        readyRef.current = true;
        contentReadyCtx.markReady(entry.slug);
        return true;
      }
      return false;
    };

    if (checkReady()) return;

    const observer = new MutationObserver(() => {
      if (checkReady()) {
        observer.disconnect();
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    const timeoutId = setTimeout(() => {
      if (!readyRef.current) {
        readyRef.current = true;
        contentReadyCtx.markReady(entry.slug);
      }
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [entry.slug, contentReadyCtx]);

  return <div ref={containerRef}>{children}</div>;
}
