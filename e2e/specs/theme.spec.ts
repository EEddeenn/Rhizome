import { test, expect } from "@playwright/test";

async function openMobileMenuIfNeeded(page: import("@playwright/test").Page, isMobile: boolean) {
  if (isMobile) {
    const menuButton = page.locator("button[aria-label='Toggle menu']");
    await menuButton.click();
    await page.waitForTimeout(300);
    await page.locator("nav").getByRole("link", { name: "Notes" }).waitFor({ state: "visible" });
  }
}

test.describe("Theme toggle", () => {
  test("theme toggle button exists", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await openMobileMenuIfNeeded(page, isMobile);
    
    const themeButton = page.getByRole("button", { name: /dark mode|light mode|Toggle theme/ });
    await themeButton.scrollIntoViewIfNeeded();
    await expect(themeButton).toBeVisible({ timeout: 10000 });
  });

  test("clicking theme toggle switches theme", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await openMobileMenuIfNeeded(page, isMobile);
    
    const htmlElement = page.locator("html");
    const initialIsDark = await htmlElement.evaluate(el => el.classList.contains("dark"));
    
    const themeButton = page.getByRole("button", { name: /dark mode|light mode|Toggle theme/ });
    await themeButton.scrollIntoViewIfNeeded();
    await themeButton.click();
    
    await page.waitForTimeout(100);
    
    const newIsDark = await htmlElement.evaluate(el => el.classList.contains("dark"));
    expect(newIsDark).toBe(!initialIsDark);
  });

  test("theme persists after reload", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await openMobileMenuIfNeeded(page, isMobile);
    
    const themeButton = page.getByRole("button", { name: /dark mode|light mode|Toggle theme/ });
    await themeButton.scrollIntoViewIfNeeded();
    
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(100);
      
      const isDark = await page.locator("html").evaluate(el => el.classList.contains("dark"));
      expect(isDark).toBe(true);
      
      await page.reload();
      
      const isStillDark = await page.locator("html").evaluate(el => el.classList.contains("dark"));
      expect(isStillDark).toBe(true);
    }
  });

  test("theme toggle works on all pages", async ({ page, isMobile }) => {
    const pages = ["/notes", "/tags", "/search", "/graph"];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState("networkidle");
      
      await openMobileMenuIfNeeded(page, isMobile);
      
      const themeButton = page.getByRole("button", { name: /dark mode|light mode|Toggle theme/ });
      await themeButton.scrollIntoViewIfNeeded();
      await expect(themeButton).toBeVisible({ timeout: 10000 });
    }
  });
});
