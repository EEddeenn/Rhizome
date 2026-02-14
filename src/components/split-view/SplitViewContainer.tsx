"use client";

import { useSplitView } from "@/lib/context/SplitViewContext";
import { SplitPane } from "./SplitPane";

export function SplitViewContainer() {
  const { panes } = useSplitView();

  if (panes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {panes.length === 1 && <div className="w-1/2 bg-black/50" />}
      {panes.map((slug, index) => (
        <SplitPane key={slug} slug={slug} index={index} />
      ))}
    </div>
  );
}
