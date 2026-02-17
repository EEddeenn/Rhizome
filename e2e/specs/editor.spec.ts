import { test, expect } from "@playwright/test";
import { navigateTo } from "../utils/navigation";

test.describe("Editor page", () => {
  test("editor page loads", async ({ page }) => {
    await page.goto("/editor");
    await expect(page).toHaveURL("/editor");
  });

  test("editor shows connection panel when not authenticated", async ({ page }) => {
    await navigateTo(page, "/editor");
    
    await expect(page.getByRole("heading", { name: "Editor" })).toBeVisible();
    
    await expect(
      page.getByText(/Connect to your GitHub repository/)
    ).toBeVisible();
  });

  test("editor has GitHub token input", async ({ page }) => {
    await navigateTo(page, "/editor");
    
    const tokenInput = page.locator("input[type='password']").first();
    await expect(tokenInput).toBeVisible();
  });

  test("editor has connect button", async ({ page }) => {
    await navigateTo(page, "/editor");
    
    const connectButton = page.getByRole("button", { name: /Connect|Sign in/i }).first();
    await expect(connectButton).toBeVisible();
  });

  test("theme toggle works in editor", async ({ page }) => {
    await navigateTo(page, "/editor");
    
    const themeButton = page.getByRole("button", { name: /dark mode|light mode|Toggle theme/ });
    await themeButton.scrollIntoViewIfNeeded();
    
    if (await themeButton.isVisible()) {
      const initialIsDark = await page.locator("html").evaluate(el => el.classList.contains("dark"));
      await themeButton.click();
      
      await expect(async () => {
        const newIsDark = await page.locator("html").evaluate(el => el.classList.contains("dark"));
        expect(newIsDark).toBe(!initialIsDark);
      }).toPass({ timeout: 5000 });
    }
  });

  test("editor layout is responsive on mobile", async ({ page, isMobile }) => {
    await navigateTo(page, "/editor");
    
    await expect(page.getByRole("heading", { name: "Editor" })).toBeVisible();
    
    const connectionPanel = page.locator("main");
    await expect(connectionPanel).toBeVisible();
  });
});

test.describe("Editor - authenticated state placeholder", () => {
  test.skip("note list shows entries when connected", async ({ page }) => {
    await navigateTo(page, "/editor");
    
    const noteSearch = page.locator("input[name='note-search']");
    await expect(noteSearch).toBeVisible();
  });

  test.skip("note search filters entries", async ({ page }) => {
    await navigateTo(page, "/editor");
    
    const noteSearch = page.locator("input[name='note-search']");
    await noteSearch.fill("welcome");
    
    const entries = page.locator("button").filter({ hasText: /welcome/i });
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);
  });

  test.skip("note filter buttons work", async ({ page }) => {
    await navigateTo(page, "/editor");
    
    const notesFilter = page.getByRole("button", { name: "Notes" }).first();
    await notesFilter.click();
    
    await expect(notesFilter).toHaveClass(/bg-blue/);
  });

  test.skip("CodeMirror editor is present", async ({ page }) => {
    await navigateTo(page, "/editor");
    
    const codeMirror = page.locator(".cm-editor");
    await expect(codeMirror).toBeVisible();
  });

  test.skip("preview pane toggle button exists", async ({ page }) => {
    await navigateTo(page, "/editor");
    
    const toggleButton = page.getByRole("button", { name: /Hide preview|Show preview/ });
    await expect(toggleButton).toBeVisible();
  });

  test.skip("preview pane toggles visibility", async ({ page }) => {
    await navigateTo(page, "/editor");
    
    const toggleButton = page.getByRole("button", { name: /Hide preview|Show preview/ });
    const initialState = await toggleButton.getAttribute("aria-label");
    
    await toggleButton.click();
    
    const newState = await toggleButton.getAttribute("aria-label");
    expect(newState).not.toBe(initialState);
  });
});
