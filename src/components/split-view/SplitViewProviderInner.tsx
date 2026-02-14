"use client";

import { SplitViewProvider as Provider } from "@/lib/context/SplitViewContext";
import { SplitViewContainer } from "./SplitViewContainer";
import { LinkInterceptor } from "./LinkInterceptor";

export function SplitViewProviderInner() {
  return (
    <Provider>
      <LinkInterceptor />
      <SplitViewContainer />
    </Provider>
  );
}
