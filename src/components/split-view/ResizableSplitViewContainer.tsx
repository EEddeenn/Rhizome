"use client";

import { useState, useEffect } from "react";
import { SplitPane } from "./SplitPane";
import { useSplitView } from "@/components/context/SplitViewContext";
import { TwoPaneResizer, SinglePaneWithSpacer } from "@/components/ui/Resizable";

const STORAGE_KEY = "rhizome_split_view_widths";
const DEFAULT_PERCENTS: [number, number] = [50, 50];
const MIN_PERCENT = 25;
const MAX_PERCENT = 75;

function loadWidths(): [number, number] {
  if (typeof window === "undefined") return DEFAULT_PERCENTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === 2) {
        return parsed as [number, number];
      }
    }
  } catch {}
  return DEFAULT_PERCENTS;
}

function saveWidths(widths: [number, number]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  } catch {}
}

export function ResizableSplitViewContainer() {
  const { panes } = useSplitView();
  const [widths, setWidths] = useState<[number, number]>(DEFAULT_PERCENTS);

  useEffect(() => {
    setWidths(loadWidths());
  }, []);

  const handleWidthsChange = (newWidths: [number, number]) => {
    setWidths(newWidths);
    saveWidths(newWidths);
  };

  if (panes.length === 0) return null;

  if (panes.length === 1) {
    return (
      <div className="fixed inset-0 z-40 overscroll-contain">
        <SinglePaneWithSpacer spacerPercent={widths[0]}>
          <SplitPane pane={panes[0]} index={0} />
        </SinglePaneWithSpacer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 overscroll-contain">
      <TwoPaneResizer
        initialWidths={widths}
        minWidthPercent={MIN_PERCENT}
        maxWidthPercent={MAX_PERCENT}
        onWidthsChange={handleWidthsChange}
        className="h-full"
      >
        <SplitPane pane={panes[0]} index={0} />
        <SplitPane pane={panes[1]} index={1} />
      </TwoPaneResizer>
    </div>
  );
}
