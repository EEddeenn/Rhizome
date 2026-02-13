"use client";

import dynamic from "next/dynamic";

const MermaidInner = dynamic(
  () => import("./Mermaid").then((mod) => mod.Mermaid),
  {
    ssr: false,
    loading: () => (
      <div className="my-4 flex justify-center">
        <div className="animate-pulse h-32 w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    ),
  }
);

interface MermaidProps {
  code: string;
}

export function MermaidLazy({ code }: MermaidProps) {
  return <MermaidInner code={code} />;
}
