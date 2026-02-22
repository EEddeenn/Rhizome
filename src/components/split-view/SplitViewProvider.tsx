"use client";

import { SplitViewProvider as Provider } from "@/components/context/SplitViewContext";
import { ResizableSplitViewContainer } from "./ResizableSplitViewContainer";
import { LinkInterceptor } from "@/components/navigation";

export function SplitViewProvider() {
  return (
    <Provider>
      <LinkInterceptor />
      <ResizableSplitViewContainer />
    </Provider>
  );
}
