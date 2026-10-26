import { test, expect } from "@playwright/test";

test.describe("citizen journeys", () => {
  test("homepage discovery CTA reaches searchable register", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Understand the policies shaping India." })).toBeVisible();
    await page.getByRole("button", { name: "Ask Anvaya" }).click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(page.getByLabel("Search the local register")).toBeVisible();
  });

  test("search filters and results open the correct policy", async ({ page }) => {
    await page.goto("/explore");
    await page.getByLabel("Search the local register").fill("Digital Personal");
    await expect(page.getByRole("link", { name: /Digital Personal Data Protection Act/ })).toBeVisible();
    await page.getByRole("link", { name: /Digital Personal Data Protection Act/ }).click();
    await expect(page).toHaveURL(/\/policies\/dpdp-act-2023$/);
    await expect(page.getByRole("heading", { name: "Act provision commencement" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rules commencement \(separate schedule\)" })).toBeVisible();
  });

  test("policy timeline exposes source links and impact page is functional", async ({ page }) => {
    await page.goto("/policies/dpdp-act-2023");
    await expect(page.getByText("Presidential assent recorded in the Act")).toBeVisible();
    await expect(page.getByRole("link", { name: /Open Digital Personal Data Protection Act/ }).first()).toHaveAttribute("href", /meity\.gov\.in/);
    await page.goto("/impact");
    await expect(page.getByRole("heading", { name: "Who could be affected?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Analyze stakeholders" })).toBeVisible();
  });

  test("public pages do not overflow at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ["/", "/explore", "/policies/dpdp-act-2023", "/impact"]) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow, `${route} has horizontal overflow`).toBe(false);
    }
  });

  test("internal QA dashboard persists its registry", async ({ page }) => {
    await page.goto("/internal/qa");
    await expect(page.getByRole("heading", { name: "Anvaya QA" })).toBeVisible();
    await expect(page.getByText("NOT TESTED").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Export Markdown" })).toBeVisible();
  });

  test("scroll story and impact explorer remain connected journeys", async ({ page }) => {
    await page.goto("/");
    await page.locator("#legislative-story").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: "Status is a sequence, not a shortcut." })).toBeVisible();
    await page.getByRole("button", { name: "Select Commencement stage" }).click();
    await expect(page.getByText("Stage 6 / 6")).toBeVisible();
    await page.goto("/impact");
    await expect(page.getByRole("heading", { name: "Who could be affected?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Analyze stakeholders" })).toBeVisible();
  });

  test("reduced motion keeps direct stage controls available", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.locator("#legislative-story").scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Select Draft stage" })).toBeVisible();
    await page.getByRole("button", { name: "Select Draft stage" }).click();
    await expect(page.getByText("Stage 1 / 6")).toBeVisible();
  });
});
