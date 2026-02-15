import { test, expect } from "@playwright/test";

test.describe("Theme toggle", () => {
  test("theme toggle button exists", async ({ page }) => {
    await page.goto("/");
    
    const themeButton = page.locator("button[aria-label*='dark mode'], button[aria-label*='light mode']");
    await expect(themeButton).toBeVisible();
  });

  test("clicking theme toggle switches theme", async ({ page }) => {
    await page.goto("/");
    
    const htmlElement = page.locator("html");
    const initialIsDark = await htmlElement.evaluate(el => el.classList.contains("dark"));
    
    const themeButton = page.locator("button[aria-label*='dark mode'], button[aria-label*='light mode']");
    await themeButton.click();
    
    await page.waitForTimeout(100);
    
    const newIsDark = await htmlElement.evaluate(el => el.classList.contains("dark"));
    expect(newIsDark).toBe(!initialIsDark);
  });

  test("theme persists after reload", async ({ page }) => {
    await page.goto("/");
    
    const darkModeButton = page.locator("button[aria-label*='dark mode']");
    
    if (await darkModeButton.isVisible()) {
      await darkModeButton.click();
      await page.waitForTimeout(100);
      
      const isDark = await page.locator("html").evaluate(el => el.classList.contains("dark"));
      expect(isDark).toBe(true);
      
      await page.reload();
      
      const isStillDark = await page.locator("html").evaluate(el => el.classList.contains("dark"));
      expect(isStillDark).toBe(true);
    }
  });

  test("theme toggle works on all pages", async ({ page }) => {
    const pages = ["/notes", "/tags", "/search", "/graph"];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      const themeButton = page.locator("button[aria-label*='dark mode'], button[aria-label*='light mode']");
      await expect(themeButton).toBeVisible();
    }
  });
});
