import { test, expect } from "@playwright/test";
import { navigateTo } from "../utils/navigation";
import { assertUniqueIds } from "../utils/assertions";

test.describe("PDF Viewer", () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, "/notes/pdf-viewer");
    await expect(page.locator("header").getByRole("heading", { name: "PDF Viewer" })).toBeVisible();
  });

  test("PDF viewer controls are visible", async ({ page }) => {
    const pdfViewer = page.locator(".pdf-viewer").first();
    await expect(pdfViewer).toBeVisible();
    
    await expect(pdfViewer.locator("button[aria-label*='Previous'], button[aria-label*='Prev']")).toBeVisible();
    await expect(pdfViewer.locator("button[aria-label*='Next']")).toBeVisible();
  });

  test("page input shows current page", async ({ page }) => {
    const pdfViewer = page.locator(".pdf-viewer").first();
    
    const pageInput = pdfViewer.locator("input[type='number']");
    await expect(pageInput).toBeVisible();
    
    const value = await pageInput.inputValue();
    expect(value).toBe("1");
  });

  test("next button changes page", async ({ page }) => {
    const pdfViewer = page.locator(".pdf-viewer").first();
    const pageInput = pdfViewer.locator("input[type='number']");
    
    await pdfViewer.locator("button[aria-label*='Next']").click();
    
    await expect(async () => {
      const value = await pageInput.inputValue();
      expect(parseInt(value)).toBeGreaterThanOrEqual(2);
    }).toPass({ timeout: 5000 });
  });

  test("previous button decreases page", async ({ page }) => {
    const pdfViewer = page.locator(".pdf-viewer").first();
    const pageInput = pdfViewer.locator("input[type='number']");
    
    await pdfViewer.locator("button[aria-label*='Next']").click();
    await expect(async () => {
      const value = await pageInput.inputValue();
      expect(parseInt(value)).toBeGreaterThanOrEqual(2);
    }).toPass({ timeout: 5000 });
    
    await pdfViewer.locator("button[aria-label*='Previous'], button[aria-label*='Prev']").click();
    
    await expect(pageInput).toHaveValue("1", { timeout: 5000 });
  });

  test("page inputs have unique generated IDs", async ({ page }) => {
    const pageInputs = page.locator(".pdf-viewer input[type='number']");
    await assertUniqueIds(pageInputs);
  });

  test("fullscreen button exists", async ({ page }) => {
    const pdfViewer = page.locator(".pdf-viewer").first();
    
    const fullscreenBtn = pdfViewer.locator("button[aria-label*='fullscreen'], button[aria-label*='Full']");
    await expect(fullscreenBtn.first()).toBeVisible();
  });
});
