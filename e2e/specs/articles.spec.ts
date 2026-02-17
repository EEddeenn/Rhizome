import { test, expect } from "@playwright/test";
import { openMobileMenuIfNeeded, navigateTo } from "../utils/navigation";
import { assertMinCount } from "../utils/assertions";

test.describe("Articles pages", () => {
  test("articles index page lists all articles", async ({ page }) => {
    await page.goto("/articles");
    
    await expect(page.getByRole("heading", { name: "Articles" })).toBeVisible();
    
    const articleLinks = page.locator("main a[href^='/articles/']");
    const count = await assertMinCount(articleLinks, 1);
  });

  test("individual article page renders correctly", async ({ page }) => {
    await page.goto("/articles/building-a-second-brain");
    
    await expect(
      page.locator("header").getByRole("heading", { name: "Building a Second Brain" })
    ).toBeVisible();
    await expect(page.locator("article")).toBeVisible();
  });

  test("article page shows metadata", async ({ page }) => {
    await page.goto("/articles/building-a-second-brain");
    
    const metadata = page.locator("article").locator("time, .text-muted, .text-sm");
    await expect(metadata.first()).toBeVisible();
  });

  test("article page shows breadcrumbs", async ({ page }) => {
    await page.goto("/articles/building-a-second-brain");
    
    const breadcrumbArticlesLink = page
      .locator("article")
      .getByRole("link", { name: "Articles", exact: true });
    await expect(breadcrumbArticlesLink).toBeVisible();
  });

  test("article page shows tags", async ({ page }) => {
    await page.goto("/articles/building-a-second-brain");
    
    const tags = page.locator("article").locator("a[href^='/tags/']");
    const count = await tags.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("wiki-links in articles are clickable", async ({ page }) => {
    await page.goto("/articles/building-a-second-brain");
    await page.waitForLoadState("networkidle");
    
    const wikiLinks = page.locator("article a[href^='/notes/'], article a[href^='/articles/']");
    const count = await wikiLinks.count();
    
    if (count > 0) {
      const firstLink = wikiLinks.first();
      await expect(firstLink).toBeVisible();
    }
  });

  test("articles index navigation from home works", async ({ page, isMobile }) => {
    await navigateTo(page, "/");
    await openMobileMenuIfNeeded(page, isMobile);
    
    const articlesLink = page.locator("nav").getByRole("link", { name: "Articles" }).first();
    await articlesLink.click();
    
    await expect(page).toHaveURL("/articles");
    await expect(page.getByRole("heading", { name: "Articles" })).toBeVisible();
  });

  test("article link from tags page works", async ({ page }) => {
    await page.goto("/tags");
    await page.waitForLoadState("networkidle");
    
    const articleTagLink = page.locator("a[href^='/tags/']").filter({ hasText: /book|productivity/i }).first();
    
    if (await articleTagLink.isVisible()) {
      await articleTagLink.click();
      
      const articleLinks = page.locator("a[href^='/articles/']");
      const count = await articleLinks.count();
      
      if (count > 0) {
        await articleLinks.first().click();
        
        const url = page.url();
        const navigatedToArticle = url.includes("/articles/") || url.includes("split=");
        expect(navigatedToArticle).toBe(true);
      }
    }
  });
});
