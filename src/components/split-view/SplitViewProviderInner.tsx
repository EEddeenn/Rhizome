"use client";

import { SplitViewProvider as Provider } from "@/components/context/SplitViewContext";
import { SplitViewContainer } from "./SplitViewContainer";
import { LinkInterceptor } from "@/components/navigation";

export function SplitViewProviderInner() {
  return (
    <Provider>
      <LinkInterceptor />
      <SplitViewContainer />
    </Provider>
  );
}
