import { test as base, type Page, type BrowserContext } from "@playwright/test";

/**
 * Custom test fixtures for Rhizome e2e tests
 */

type RhizomeFixtures = {
  /**
   * Page with mobile viewport (Pixel 5)
   */
  mobilePage: Page;
  
  /**
   * Page with dark mode pre-enabled
   */
  darkModePage: Page;
  
  /**
   * Page with network idle already waited
   */
  readyPage: Page;
};

export const test = base.extend<RhizomeFixtures>({
  mobilePage: async ({ browser }, use) => {
    const context = await browser.newContext({
      viewport: { width: 393, height: 851 }, // Pixel 5
      isMobile: true,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  darkModePage: async ({ page }, use) => {
    // Set dark mode in localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
    });
    await use(page);
  },

  readyPage: async ({ page }, use) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await use(page);
  },
});

export { expect } from "@playwright/test";
