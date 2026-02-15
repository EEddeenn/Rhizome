"use client";

import { SplitViewProvider as Provider } from "@/components/context/SplitViewContext";
import { ResizableSplitViewContainer } from "./ResizableSplitViewContainer";

interface SplitViewProviderProps {
  children: React.ReactNode;
}

export function SplitViewProvider({ children }: SplitViewProviderProps) {
  return (
    <Provider>
      {children}
      <ResizableSplitViewContainer />
    </Provider>
  );
}
