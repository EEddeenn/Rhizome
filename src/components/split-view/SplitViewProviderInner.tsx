"use client";

import { SplitViewProvider as Provider } from "@/components/context/SplitViewContext";
import { ResizableSplitViewContainer } from "./ResizableSplitViewContainer";
import { LinkInterceptor } from "@/components/navigation";

export function SplitViewProviderInner() {
  return (
    <Provider>
      <LinkInterceptor />
      <ResizableSplitViewContainer />
    </Provider>
  );
}
