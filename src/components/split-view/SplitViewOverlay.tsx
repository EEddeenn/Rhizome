"use client";

import dynamic from "next/dynamic";

const SplitViewProviderInner = dynamic(
  () => import("./SplitViewProviderInner").then((mod) => mod.SplitViewProviderInner),
  { ssr: false }
);

export function SplitViewOverlay() {
  return <SplitViewProviderInner />;
}
