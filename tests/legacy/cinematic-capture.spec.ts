import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";

test("capture Anvaya cinematic story states", async ({ page }) => {
  mkdirSync("docs/screenshots/cinematic", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const states = [["01-hero", 0], ["02-editorial-image", 0.2], ["03-featured-legislation", 0.42], ["04-story-entry", 0.62], ["05-story-end", 0.78], ["06-final-cta", 1]] as const;
  for (const [name, progress] of states) { await page.evaluate((ratio) => window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) * ratio), progress); await page.waitForTimeout(250); await page.screenshot({ path: `docs/screenshots/cinematic/${name}.png`, fullPage: false }); }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: "docs/screenshots/cinematic/08-mobile-hero.png", fullPage: false });
  await page.locator("#legislative-story").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "docs/screenshots/cinematic/09-mobile-story.png", fullPage: false });
});
