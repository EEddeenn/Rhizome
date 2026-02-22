"use client";

import dynamic from "next/dynamic";

const SplitViewProvider = dynamic(
  () => import("./SplitViewProvider").then((mod) => mod.SplitViewProvider),
  { ssr: false }
);

export function SplitViewOverlay() {
  return <SplitViewProvider />;
}
