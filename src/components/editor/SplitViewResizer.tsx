"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { TwoPaneResizer } from "@/components/ui/Resizable";
import { STORAGE_KEYS, SPLIT_VIEW } from "./constants/storage";

interface SplitViewResizerProps {
  children: [ReactNode, ReactNode];
}

export function SplitViewResizer({ children }: SplitViewResizerProps) {
  const [previewPercent, setPreviewPercent] = useState<number>(SPLIT_VIEW.DEFAULT_PERCENT);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SPLIT_PERCENT);
    if (saved) setPreviewPercent(parseInt(saved, 10));
  }, []);

  const handleWidthsChange = (widths: [number, number]) => {
    const newPreviewPercent = widths[1];
    setPreviewPercent(newPreviewPercent);
    localStorage.setItem(STORAGE_KEYS.SPLIT_PERCENT, String(newPreviewPercent));
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
