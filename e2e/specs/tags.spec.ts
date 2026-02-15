import { test, expect } from "@playwright/test";

test.describe("Tags functionality", () => {
  test("tags index page shows all tags", async ({ page }) => {
    await page.goto("/tags");
    
    await expect(page.getByRole("heading", { name: "Tags" })).toBeVisible();
    
    const tagLinks = page.locator("a[href^='/tags/']");
    const count = await tagLinks.count();
    expect(count).toBeGreaterThan(3);
  });

  test("clicking a tag shows entries with that tag", async ({ page }) => {
    await page.goto("/tags");
    await page.waitForLoadState("networkidle");
    
    const pkmTag = page.getByRole("link", { name: "#pkm" });
    
    if (await pkmTag.isVisible()) {
      await pkmTag.click();
      await page.waitForURL("/tags/pkm");
      
      const entries = page.locator("a[href^='/notes/'], a[href^='/articles/']");
      const count = await entries.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("tag page shows tag name in heading", async ({ page }) => {
    await page.goto("/tags/guide");
    
    const heading = page.getByRole("heading").first();
    await expect(heading).toContainText("guide");
  });

  test("tag page entries are clickable", async ({ page }) => {
    await page.goto("/tags/guide");
    await page.waitForLoadState("networkidle");
    
    const firstEntry = page.locator("main a[href^='/notes/']").first();
    
    if (await firstEntry.isVisible()) {
      const href = await firstEntry.getAttribute("href");
      await firstEntry.click();
      await page.waitForTimeout(500);
      
      const url = page.url();
      const navigatedToNote = url.includes("/notes/") || url.includes("split=");
      expect(navigatedToNote).toBe(true);
    }
  });

  test("tag links from note page work", async ({ page }) => {
    await page.goto("/notes/welcome");
    await page.waitForLoadState("networkidle");
    
    const tagLink = page.locator("article a[href^='/tags/']").first();
    
    if (await tagLink.isVisible()) {
      const tagHref = await tagLink.getAttribute("href");
      await tagLink.click();
      await page.waitForURL(tagHref || /\/tags\//);
      await expect(page).toHaveURL(/\/tags\//);
    }
  });
});
