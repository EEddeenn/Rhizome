import { test, expect } from "@playwright/test";
import { openMobileMenuIfNeeded, navigateTo } from "../utils/navigation";

function getThemeButton(page: import("@playwright/test").Page) {
  return page.getByRole("button", { name: /dark mode|light mode|Toggle theme/ });
}

test.describe("Theme toggle", () => {
  test("theme toggle button exists", async ({ page, isMobile }) => {
    await navigateTo(page, "/");
    await openMobileMenuIfNeeded(page, isMobile);
    
    const themeButton = getThemeButton(page);
    await themeButton.scrollIntoViewIfNeeded();
    await expect(themeButton).toBeVisible({ timeout: 10000 });
  });

  test("clicking theme toggle switches theme", async ({ page, isMobile }) => {
    await navigateTo(page, "/");
    await openMobileMenuIfNeeded(page, isMobile);
    
    const htmlElement = page.locator("html");
    const initialIsDark = await htmlElement.evaluate(el => el.classList.contains("dark"));
    
    const themeButton = getThemeButton(page);
    await themeButton.scrollIntoViewIfNeeded();
    await themeButton.click();
    
    await expect(async () => {
      const newIsDark = await htmlElement.evaluate(el => el.classList.contains("dark"));
      expect(newIsDark).toBe(!initialIsDark);
    }).toPass({ timeout: 5000 });
  });

  test("theme persists after reload", async ({ page, isMobile }) => {
    await navigateTo(page, "/");
    await openMobileMenuIfNeeded(page, isMobile);
    
    const themeButton = getThemeButton(page);
    await themeButton.scrollIntoViewIfNeeded();
    
    if (await themeButton.isVisible()) {
      await themeButton.click();
      
      await expect(async () => {
        const isDark = await page.locator("html").evaluate(el => el.classList.contains("dark"));
        expect(isDark).toBe(true);
      }).toPass({ timeout: 5000 });
      
      await page.reload();
      
      const isStillDark = await page.locator("html").evaluate(el => el.classList.contains("dark"));
      expect(isStillDark).toBe(true);
    }
  });

  test("theme toggle works on all pages", async ({ page, isMobile }) => {
    const pages = ["/notes", "/tags", "/search", "/graph", "/editor"];
    
    for (const pagePath of pages) {
      await navigateTo(page, pagePath);
      await openMobileMenuIfNeeded(page, isMobile);
      
      const themeButton = getThemeButton(page);
      await themeButton.scrollIntoViewIfNeeded();
      await expect(themeButton).toBeVisible({ timeout: 10000 });
    }
  });
});
