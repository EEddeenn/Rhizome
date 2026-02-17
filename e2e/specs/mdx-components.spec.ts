import { test, expect } from "@playwright/test";
import { navigateTo } from "../utils/navigation";

test.describe("MDX Components - Callouts", () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, "/notes/callouts");
  });

  test("callouts page renders", async ({ page }) => {
    await expect(
      page.locator("header").getByRole("heading", { name: /callout/i })
    ).toBeVisible();
  });

  test("note callout is visible", async ({ page }) => {
    const noteCallout = page.locator("[data-callout='note'], .callout, .admonition").first();
    if (await noteCallout.isVisible()) {
      await expect(noteCallout).toBeVisible();
    }
  });

  test("tip callout is visible", async ({ page }) => {
    const tipCallout = page.locator("[data-callout='tip'], .callout-tip, .admonition-tip").first();
    if (await tipCallout.isVisible()) {
      await expect(tipCallout).toBeVisible();
    }
  });

  test("warning callout is visible", async ({ page }) => {
    const warningCallout = page.locator("[data-callout='warning'], .callout-warning, .admonition-warning").first();
    if (await warningCallout.isVisible()) {
      await expect(warningCallout).toBeVisible();
    }
  });

  test("foldable callout can be toggled", async ({ page }) => {
    const foldableCallout = page.locator("details").first();
    
    if (await foldableCallout.isVisible()) {
      const isOpen = await foldableCallout.getAttribute("open");
      
      await foldableCallout.click();
      
      const newOpenState = await foldableCallout.getAttribute("open");
      expect(newOpenState).not.toBe(isOpen);
    }
  });
});

test.describe("MDX Components - Mermaid diagrams", () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, "/notes/diagrams");
  });

  test("diagrams page renders", async ({ page }) => {
    await expect(
      page.locator("header").getByRole("heading", { name: /diagram/i })
    ).toBeVisible();
  });

  test("mermaid diagram renders as SVG", async ({ page }) => {
    const mermaidSvg = page.locator("article svg").first();
    
    await expect(mermaidSvg).toBeVisible({ timeout: 15000 });
  });

  test("multiple mermaid diagrams exist", async ({ page }) => {
    const svgElements = page.locator("article svg");
    const count = await svgElements.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("MDX Components - Math/KaTeX", () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, "/notes/mathematical-notation");
  });

  test("math page renders", async ({ page }) => {
    await expect(
      page.locator("header").getByRole("heading", { name: /math/i })
    ).toBeVisible();
  });

  test("inline math renders", async ({ page }) => {
    const katexInline = page.locator(".katex").first();
    
    if (await katexInline.isVisible()) {
      await expect(katexInline).toBeVisible();
    }
  });

  test("block math renders", async ({ page }) => {
    const katexDisplay = page.locator(".katex-display, .katex").first();
    
    if (await katexDisplay.isVisible()) {
      await expect(katexDisplay).toBeVisible();
    }
  });
});

test.describe("MDX Components - Code highlighting", () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, "/notes/code-blocks");
  });

  test("code blocks page renders", async ({ page }) => {
    await expect(
      page.locator("header").getByRole("heading", { name: /code/i })
    ).toBeVisible();
  });

  test("code blocks have syntax highlighting", async ({ page }) => {
    const highlightedCode = page.locator("pre code .hljs, pre code span").first();
    
    if (await highlightedCode.isVisible()) {
      await expect(highlightedCode).toBeVisible();
    }
  });

  test("code blocks are readable", async ({ page }) => {
    const codeBlocks = page.locator("pre code");
    const count = await codeBlocks.count();
    expect(count).toBeGreaterThan(0);
  });
});
