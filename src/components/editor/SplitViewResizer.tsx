"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { TwoPaneResizer } from "@/components/ui/Resizable";

const STORAGE_KEY = "rhizome_editor_split_percent";
const DEFAULT_PERCENT = 40;
const MIN_PERCENT = 20;
const MAX_PERCENT = 60;

interface SplitViewResizerProps {
  children: [ReactNode, ReactNode];
}

export function SplitViewResizer({ children }: SplitViewResizerProps) {
  const [previewPercent, setPreviewPercent] = useState(DEFAULT_PERCENT);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setPreviewPercent(parseInt(saved, 10));
  }, []);

  const handleWidthsChange = (widths: [number, number]) => {
    const newPreviewPercent = widths[1];
    setPreviewPercent(newPreviewPercent);
    localStorage.setItem(STORAGE_KEY, String(newPreviewPercent));
  };

  return (
    <TwoPaneResizer
      initialWidths={[100 - previewPercent, previewPercent]}
      minWidthPercent={100 - MAX_PERCENT}
      maxWidthPercent={100 - MIN_PERCENT}
      onWidthsChange={handleWidthsChange}
      className="flex-1 min-w-0"
    >
      {children}
    </TwoPaneResizer>
  );
}
