"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { TwoPaneResizer } from "@/components/ui/Resizable";
import { SPLIT_VIEW, loadUIPrefs, saveUIPrefs } from "./constants/storage";

interface SplitViewResizerProps {
  children: [ReactNode, ReactNode];
}

export function SplitViewResizer({ children }: SplitViewResizerProps) {
  const [previewPercent, setPreviewPercent] = useState<number>(() => {
    if (typeof window === "undefined") return SPLIT_VIEW.DEFAULT_PERCENT;
    return loadUIPrefs().splitPercent;
  });

  const handleWidthsChange = (widths: [number, number]) => {
    const newPreviewPercent = widths[1];
    setPreviewPercent(newPreviewPercent);
    saveUIPrefs({ splitPercent: newPreviewPercent });
  };

  return (
    <TwoPaneResizer
      initialWidths={[100 - previewPercent, previewPercent]}
      minWidthPercent={100 - SPLIT_VIEW.MAX_PERCENT}
      maxWidthPercent={100 - SPLIT_VIEW.MIN_PERCENT}
      onWidthsChange={handleWidthsChange}
      className="flex-1 min-w-0"
    >
      {children}
    </TwoPaneResizer>
  );
}
