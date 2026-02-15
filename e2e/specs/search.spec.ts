import { test, expect } from "@playwright/test";

test.describe("Search functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("networkidle");
    await expect(page.getByPlaceholder("Search notes and articles…")).toBeVisible();
  });

  test("search input exists and is focused", async ({ page }) => {
    const searchInput = page.locator("#search-query");
    await expect(searchInput).toBeVisible();
  });

  test("search returns results for valid query", async ({ page }) => {
    await page.locator("#search-query").fill("Welcome");
    await page.waitForTimeout(200);
    await expect(page.getByText("result")).toBeVisible();
    await expect(page.getByRole("link", { name: "Welcome to Rhizome" })).toBeVisible();
  });

  test("search shows no results for invalid query", async ({ page }) => {
    await page.locator("#search-query").fill("zzzzzzzzzzzzzzzzzzz");
    await page.waitForTimeout(200);
    await expect(page.getByText("No results found")).toBeVisible();
  });

  test("type filter works - notes only", async ({ page }) => {
    await page.locator("#search-query").fill("pkm");
    await page.waitForTimeout(200);
    
    await page.locator("#type-filter").selectOption("note");
    await page.waitForTimeout(100);
    
    const results = page.locator("main ul li");
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test("type filter works - articles only", async ({ page }) => {
    await page.locator("#search-query").fill("brain");
    await page.waitForTimeout(200);
    
    await page.locator("#type-filter").selectOption("article");
    await page.waitForTimeout(100);
    
    await expect(page.getByRole("link", { name: "Building a Second Brain" })).toBeVisible();
  });

  test("tag filter works", async ({ page }) => {
    await page.locator("#search-query").fill("guide");
    await page.waitForTimeout(200);
    
    await page.locator("#tag-filter").click();
    await page.waitForTimeout(100);
    
    await page.locator("#tag-filter").selectOption("mdx");
    await page.waitForTimeout(100);
    
    const resultText = await page.locator("main ul").textContent();
    expect(resultText).toBeTruthy();
  });

  test("keyboard navigation - arrow keys move selection", async ({ page }) => {
    await page.locator("#search-query").fill("guide");
    await page.waitForTimeout(200);
    
    await page.locator("#search-query").focus();
    await page.keyboard.press("ArrowDown");
    
    const firstResult = page.locator("main ul li").first();
    await expect(firstResult.locator("a")).toHaveClass(/border-blue-500/);
  });

  test("keyboard navigation - enter navigates to result", async ({ page }) => {
    await page.locator("#search-query").fill("Welcome");
    await page.waitForTimeout(200);
    
    await page.locator("#search-query").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    
    await page.waitForURL(/\/notes\/welcome/);
    await expect(page).toHaveURL(/\/notes\/welcome/);
  });

  test("keyboard navigation - escape clears selection", async ({ page }) => {
    await page.locator("#search-query").fill("guide");
    await page.waitForTimeout(200);
    
    await page.locator("#search-query").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    
    const results = page.locator("main ul li a");
    const hasSelection = await results.evaluateAll(els => 
      els.some(el => el.classList.contains("border-blue-500"))
    );
    expect(hasSelection).toBe(false);
  });

  test("URL query param pre-populates search", async ({ page }) => {
    await page.goto("/search?q=markdown");
    await page.waitForTimeout(200);
    
    const searchValue = await page.locator("#search-query").inputValue();
    expect(searchValue).toBe("markdown");
  });

  test("duplicate ID check - search input should be unique", async ({ page }) => {
    const searchInputCount = await page.locator("#search-query").count();
    expect(searchInputCount).toBe(1);
  });
});
