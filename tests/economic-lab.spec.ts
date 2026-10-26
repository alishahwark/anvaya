import { test, expect } from "@playwright/test";

test.describe("economic evidence lab", () => {
  test("homepage navigation reaches real MoSPI data and updates controls", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /^Evidence lab/ }).click();
    await expect(page).toHaveURL(/\/evidence$/);
    await expect(page.getByRole("note", { name: "Preview notice" })).toContainText("This lab is a preview");
    await expect(page.getByRole("heading", { name: "Consumer Price Index — General Index, All India" })).toBeVisible();
    const before = await page.locator(".evidence-stat-row").innerText();
    await page.locator("select").nth(0).selectOption("inflation_al");
    await page.locator("select").nth(1).selectOption("36");
    await expect(page.locator(".evidence-stat-row")).not.toHaveText(before);
    await expect(page.getByText("Unit: % year-on-year.")).toBeVisible();
  });

  test("download and scenario calculator work", async ({ page }) => {
    await page.goto("/evidence");
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: /Download JSON/ }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("anvaya-economic-evidence.json");
    const initial = await page.locator(".scenario-number").innerText();
    await page.locator(".scenario-inputs input").first().fill("2000");
    await expect(page.locator(".scenario-inputs input").first()).toHaveValue("2000");
    await page.locator(".scenario-inputs input").first().press("Tab");
    await expect(page.locator(".scenario-number")).not.toHaveText(initial);
    await expect(page.getByText(/Illustrative scenario — not an estimate/)).toBeVisible();
  });

  test("mobile homepage menu reaches evidence without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /^Evidence lab/ }).click();
    await expect(page).toHaveURL(/\/evidence$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
  });
});
