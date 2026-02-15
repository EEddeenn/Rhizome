import { test, expect } from "@playwright/test";

async function openMobileMenuIfNeeded(page: import("@playwright/test").Page, isMobile: boolean) {
  if (isMobile) {
    const menuButton = page.locator("button[aria-label='Toggle menu']");
    await menuButton.click();
    await page.waitForTimeout(300);
    await page.locator("nav").getByRole("link", { name: "Notes" }).waitFor({ state: "visible" });
  }
}

test.describe("Smoke tests", () => {
  test("home page loads and displays title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Rhizome" })).toBeVisible();
  });

  test("navigation to notes page works", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await openMobileMenuIfNeeded(page, isMobile);
    
    const notesLink = page.locator("nav").getByRole("link", { name: "Notes" }).first();
    await notesLink.click();
    await expect(page).toHaveURL("/notes");
    await expect(page.getByRole("heading", { name: "Notes" })).toBeVisible();
  });

  test("navigation to articles page works", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await openMobileMenuIfNeeded(page, isMobile);
    
    const articlesLink = page.locator("nav").getByRole("link", { name: "Articles" }).first();
    await articlesLink.click();
    await expect(page).toHaveURL("/articles");
    await expect(page.getByRole("heading", { name: "Articles" })).toBeVisible();
  });

  test("navigation to tags page works", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await openMobileMenuIfNeeded(page, isMobile);
    
    const tagsLink = page.locator("nav").getByRole("link", { name: "Tags" }).first();
    await tagsLink.click();
    await expect(page).toHaveURL("/tags");
    await expect(page.getByRole("heading", { name: "Tags" })).toBeVisible();
  });

  test("navigation to graph page works", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    await openMobileMenuIfNeeded(page, isMobile);
    
    const graphLink = page.locator("nav").getByRole("link", { name: "Graph" }).first();
    await graphLink.click();
    await expect(page).toHaveURL("/graph");
    await expect(page.getByRole("heading", { name: "Knowledge Graph" })).toBeVisible();
  });

  test("404 page shows for invalid routes", async ({ page }) => {
    await page.goto("/notes/this-note-does-not-exist");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });
});
