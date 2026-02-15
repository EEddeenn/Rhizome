"use client";

import { SplitViewProvider as Provider } from "@/components/context/SplitViewContext";
import { SplitViewContainer } from "./SplitViewContainer";

interface SplitViewProviderProps {
  children: React.ReactNode;
}

export function SplitViewProvider({ children }: SplitViewProviderProps) {
  return (
    <Provider>
      {children}
      <SplitViewContainer />
    </Provider>
  );
}
