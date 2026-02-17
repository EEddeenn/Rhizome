import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Assert that an element has specific CSS class
 */
export async function hasClass(locator: Locator, className: string): Promise<void> {
  await expect(locator).toHaveClass(new RegExp(className));
}

/**
 * Assert that the page is in dark mode
 */
export async function assertDarkMode(page: Page): Promise<boolean> {
  return page.locator("html").evaluate(el => el.classList.contains("dark"));
}

/**
 * Assert that URL contains a specific path segment
 */
export async function assertUrlContains(page: Page, segment: string): Promise<void> {
  const url = page.url();
  expect(url).toContain(segment);
}

/**
 * Count elements and assert minimum count
 */
export async function assertMinCount(locator: Locator, minCount: number): Promise<number> {
  const count = await locator.count();
  expect(count).toBeGreaterThanOrEqual(minCount);
  return count;
}

/**
 * Assert that all IDs in a locator list are unique
 */
export async function assertUniqueIds(locator: Locator): Promise<void> {
  const ids = await locator.evaluateAll(els => els.map(el => el.id).filter(id => id));
  const uniqueIds = new Set(ids);
  expect(uniqueIds.size).toBe(ids.length);
}
