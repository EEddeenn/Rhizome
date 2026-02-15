"use client";

import { useEffect, useRef } from "react";
import { Mermaid } from "./Mermaid";
import { useMermaidTracker } from "@/components/context/MermaidTrackerContext";

interface TrackedMermaidProps {
  code: string;
  title?: string;
}

export function TrackedMermaid({ code, title }: TrackedMermaidProps) {
  const tracker = useMermaidTracker();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (code && !registeredRef.current && tracker) {
      registeredRef.current = true;
      tracker.register();
    }
  }, [code, tracker]);

  if (!tracker) {
    return <Mermaid code={code} title={title} />;
  }

  return <Mermaid code={code} title={title} onRender={tracker.markReady} />;
}
