"use client";

import { useEffect, useRef } from "react";

export function AnchorScroller() {
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (scrolledRef.current) return;

    const hash = window.location.hash;
    if (!hash) return;

    const anchorId = hash.slice(1);
    if (!anchorId) return;

    const tryScroll = (attempts: number) => {
      if (attempts <= 0 || scrolledRef.current) return;

      const element = document.getElementById(anchorId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        scrolledRef.current = true;
      } else if (attempts > 1) {
        setTimeout(() => tryScroll(attempts - 1), 100);
      }
    };

    setTimeout(() => tryScroll(10), 50);
  }, []);

  return null;
}
