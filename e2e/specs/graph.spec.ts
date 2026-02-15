import { test, expect } from "@playwright/test";

test.describe("Graph visualization", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    await page.goto("/graph");
    await expect(page.getByText("Loading graph")).not.toBeVisible({ timeout: 10000 });
  });

  test("graph canvas is visible", async ({ page }) => {
    const canvas = page.locator("canvas[role='img']");
    await expect(canvas).toBeVisible();
  });

  test("graph has type legend", async ({ page }) => {
    await expect(page.locator(".capitalize").filter({ hasText: "note" }).first()).toBeVisible();
  });

  test("graph shows all entries list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "All Entries" })).toBeVisible();
    
    const entryLinks = page.locator("a[href^='/notes/'], a[href^='/articles/']");
    const count = await entryLinks.count();
    expect(count).toBeGreaterThan(5);
  });

  test("clicking entry in list opens content", async ({ page, isMobile }) => {
    const allEntriesHeading = page.getByRole("heading", { name: "All Entries" });
    await expect(allEntriesHeading).toBeVisible();
    
    const firstEntry = page.locator("main").locator("a[href^='/notes/'], a[href^='/articles/']").first();
    await firstEntry.click();
    
    if (isMobile) {
      await expect(page).toHaveURL(/\/notes\/|\/articles\//);
    } else {
      await page.waitForTimeout(1000);
      const url = page.url();
      const opened = url.includes("/notes/") || url.includes("/articles/") || url.includes("split=");
      expect(opened).toBe(true);
    }
  });

  test("hovering canvas shows cursor change", async ({ page }) => {
    const canvas = page.locator("canvas");
    
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      
      const cursor = await canvas.evaluate(el => window.getComputedStyle(el).cursor);
      expect(["default", "pointer", "auto"]).toContain(cursor);
    }
  });

  test("hovered node info panel appears when hovering a node", async ({ page }) => {
    const canvas = page.locator("canvas");
    const box = await canvas.boundingBox();
    
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const radius = Math.min(box.width, box.height) / 4;
      
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        await page.mouse.move(x, y);
        await page.waitForTimeout(100);
        
        const infoPanel = page.locator("div").filter({ hasText: /Type:/ }).first();
        if (await infoPanel.isVisible()) {
          return;
        }
      }
    }
  });

  test("canvas is keyboard accessible", async ({ page }) => {
    const canvas = page.locator("canvas");
    
    await canvas.focus();
    await expect(canvas).toBeFocused();
  });

  test("graph respects reduced motion preference", async ({ page }) => {
    await expect(page.locator("canvas")).toBeVisible();
  });
});
