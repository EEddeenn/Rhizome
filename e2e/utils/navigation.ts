import type { Page } from "@playwright/test";

/**
 * Opens the mobile menu if on mobile viewport
 * Call this before interacting with nav links on mobile
 */
export async function openMobileMenuIfNeeded(page: Page, isMobile: boolean): Promise<void> {
  if (isMobile) {
    const menuButton = page.locator("button[aria-label='Toggle menu']");
    await menuButton.click();
    // Wait for nav to be visible with proper assertion instead of timeout
    await page.locator("nav").getByRole("link", { name: "Notes" }).waitFor({ state: "visible" });
  }
}

/**
 * Navigate to a page and wait for it to be ready
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for a specific element to be visible (replaces waitForTimeout)
 */
export async function waitForElement(
  page: Page, 
  selector: string, 
  timeout = 10000
): Promise<void> {
  await page.locator(selector).waitFor({ state: "visible", timeout });
}
