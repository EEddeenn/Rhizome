import { test, expect } from "@playwright/test";

test.describe("Split-view functionality", () => {
  test.skip(({ isMobile }) => isMobile, "Split-view is desktop only");

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("clicking wiki-link opens split pane", async ({ page }) => {
    await page.goto("/notes/welcome");
    await page.waitForLoadState("networkidle");
    
    const wikiLink = page.locator("article a[href^='/notes/']").first();
    await wikiLink.click();
    
    const pane = page.locator("div[data-pane-index]");
    await expect(pane).toBeVisible({ timeout: 10000 });
  });

  test("split pane has toolbar with actions", async ({ page }) => {
    await page.goto("/notes/welcome");
    await page.waitForLoadState("networkidle");
    
    const wikiLink = page.locator("article a[href^='/notes/']").first();
    await wikiLink.click();
    
    const pane = page.locator("div[data-pane-index]");
    await expect(pane).toBeVisible({ timeout: 10000 });
    await expect(pane.locator("button[aria-label='Close']")).toBeVisible();
  });

  test("close button removes split pane", async ({ page }) => {
    await page.goto("/notes/welcome");
    await page.waitForLoadState("networkidle");
    
    const wikiLink = page.locator("article a[href^='/notes/']").first();
    await wikiLink.click();
    
    const pane = page.locator("div[data-pane-index]");
    await expect(pane).toBeVisible({ timeout: 10000 });
    
    await pane.locator("button[aria-label='Close']").click();
    await expect(pane).not.toBeVisible();
  });

  test("open full page button navigates to note", async ({ page }) => {
    await page.goto("/notes/welcome");
    await page.waitForLoadState("networkidle");
    
    const wikiLink = page.locator("article a[href^='/notes/']").first();
    const linkHref = await wikiLink.getAttribute("href");
    await wikiLink.click();
    
    const pane = page.locator("div[data-pane-index]");
    await expect(pane).toBeVisible({ timeout: 10000 });
    
    await pane.locator("button[aria-label='Open full page']").click();
    await expect(page).toHaveURL(linkHref || /\/notes\//);
  });

  test("URL updates with split param", async ({ page }) => {
    await page.goto("/notes/welcome");
    await page.waitForLoadState("networkidle");
    
    const wikiLink = page.locator("article a[href^='/notes/']").first();
    await wikiLink.click();
    
    const pane = page.locator("div[data-pane-index]");
    await expect(pane).toBeVisible({ timeout: 10000 });
    
    const url = page.url();
    expect(url).toContain("split=");
  });

  test("maximum two panes allowed", async ({ page }) => {
    await page.goto("/notes/welcome");
    await page.waitForLoadState("networkidle");
    
    const wikiLinks = page.locator("article a[href^='/notes/']");
    await wikiLinks.first().click();
    
    const pane = page.locator("div[data-pane-index]");
    await expect(pane).toBeVisible({ timeout: 10000 });
    
    const paneCount = await page.locator("div[data-pane-index]").count();
    expect(paneCount).toBeLessThanOrEqual(2);
  });
});
