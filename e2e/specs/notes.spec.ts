import { test, expect } from "@playwright/test";

test.describe("Notes pages", () => {
  test("notes index page lists all notes", async ({ page }) => {
    await page.goto("/notes");
    
    await expect(page.getByRole("heading", { name: "Notes" })).toBeVisible();
    
    const noteLinks = page.locator("main a[href^='/notes/']");
    const count = await noteLinks.count();
    expect(count).toBeGreaterThan(5);
  });

  test("individual note page renders correctly", async ({ page }) => {
    await page.goto("/notes/welcome");
    
    await expect(page.locator("header").getByRole("heading", { name: "Welcome to Rhizome" })).toBeVisible();
    await expect(page.locator("article")).toBeVisible();
  });

  test("note page shows tags", async ({ page }) => {
    await page.goto("/notes/welcome");
    
    const tags = page.locator("article").locator("text=/welcome|pkm|guide/");
    await expect(tags.first()).toBeVisible();
  });

  test("note page shows breadcrumbs", async ({ page }) => {
    await page.goto("/notes/welcome");
    
    const breadcrumbNotesLink = page.locator("article").getByRole("link", { name: "Notes", exact: true });
    await expect(breadcrumbNotesLink).toBeVisible();
  });

  test("note page shows table of contents when headings exist", async ({ page }) => {
    await page.goto("/notes/markdown-guide");
    
    await expect(page.getByRole("navigation").filter({ hasText: "Table of Contents" })).toBeVisible();
  });

  test("backlinks panel shows linking notes", async ({ page }) => {
    await page.goto("/notes/welcome");
    
    const backlinksH2 = page.locator("h2").filter({ hasText: "Backlinks" });
    await expect(backlinksH2).toBeVisible();
    
    const backlinkLinks = backlinksH2.locator("..").locator("a");
    const count = await backlinkLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("wiki-links are clickable and navigate", async ({ page }) => {
    await page.goto("/notes/welcome");
    
    const wikiLink = page.locator("article a[href^='/notes/']").first();
    await expect(wikiLink).toBeVisible();
    
    await wikiLink.click();
    await page.waitForURL(/\/notes\//);
    await expect(page).toHaveURL(/\/notes\//);
  });
});
