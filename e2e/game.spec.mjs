import { expect, test } from "@playwright/test";

test("simulation moves and emergency stop stays latched", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => pageErrors.push(`request: ${request.url()} ${request.failure()?.errorText}`));
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "SIGNAL//SEEK" })).toBeVisible();
  await expect(page.locator("#rival-score")).toHaveText("00");
  await expect(page.locator("#rival-readout")).toContainText("RIVAL X");
  await page.waitForTimeout(1_500);
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  const canvas = page.locator("#canvas-host canvas");
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((element) => element.toDataURL().length)).toBeGreaterThan(1_000);

  await page.getByRole("button", { name: "探索を開始" }).click();
  await expect(page.locator("#field-message")).toContainText("NEW SIGNAL");
  const before = await page.locator("#position-readout").textContent();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(450);
  await page.keyboard.up("ArrowRight");
  const afterMove = await page.locator("#position-readout").textContent();
  expect(afterMove).not.toBe(before);

  await page.getByRole("button", { name: "緊急停止" }).click();
  await page.waitForTimeout(100);
  const stopped = await page.locator("#position-readout").textContent();
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(350);
  await page.keyboard.up("ArrowDown");
  expect(await page.locator("#position-readout").textContent()).toBe(stopped);
  expect(pageErrors).toEqual([]);
});

test("mobile layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator("#canvas-host canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "探索を開始" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("camera starts and loads the hand model", async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto("/");
  await page.getByRole("button", { name: "カメラ開始" }).click();

  await expect(page.getByRole("button", { name: "カメラ接続済み" })).toBeVisible({ timeout: 35_000 });
  await expect(page.locator("#camera-dot")).toHaveClass(/active/);
});