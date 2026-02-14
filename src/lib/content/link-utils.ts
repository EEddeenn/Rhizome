export interface LinkClassification {
  isExternal: boolean;
  isAnchor: boolean;
  isInternalNote: boolean;
}

export function classifyLink(href: string | undefined): LinkClassification {
  if (!href) {
    return { isExternal: false, isAnchor: false, isInternalNote: false };
  }

  const isExternal = href.startsWith("http") || href.startsWith("//");
  const isAnchor = href.startsWith("#");
  const isInternalNote =
    !isExternal && !isAnchor && (href.startsWith("/notes/") || href.startsWith("/articles/"));

  return { isExternal, isAnchor, isInternalNote };
}

export function parseSlugFromHref(href: string): {
  slug: string;
  searchParams?: Record<string, string>;
  anchor?: string;
} {
  const url = new URL(href, "http://dummy.local");
  const slug = url.pathname.replace(/^\//, "");
  const searchParams: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    searchParams[k] = v;
  });
  const anchor = url.hash ? url.hash.slice(1) : undefined;
  return {
    slug,
    searchParams: Object.keys(searchParams).length > 0 ? searchParams : undefined,
    anchor,
  };
}
