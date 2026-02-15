const SCROLL_OFFSET = 80;

export function scrollElementIntoContainer(
  container: Element,
  element: Element,
  offset: number = SCROLL_OFFSET
): void {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) - offset;
  container.scrollTo({ top: scrollTop, behavior: "smooth" });
}

export function scrollElementIntoView(
  element: Element,
  block: ScrollLogicalPosition = "start"
): void {
  element.scrollIntoView({ behavior: "smooth", block });
}
