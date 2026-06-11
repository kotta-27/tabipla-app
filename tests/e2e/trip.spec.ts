import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_EMAIL ?? "test@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "password123";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/メールアドレス|email/i).fill(TEST_EMAIL);
  await page.getByLabel(/パスワード/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /ログイン/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

test.describe("トリップ", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("ダッシュボードが表示される", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /tabipla|マイトリップ/i })).toBeVisible();
  });

  test("トリップを作成してプランページに遷移する", async ({ page }) => {
    // PC のヘッダーボタン or モバイル FAB
    const createBtn = page.getByRole("button", { name: /新規作成|トリップを作成|作成/i }).first();
    await createBtn.click();

    await page.getByLabel(/トリップ名/i).fill("テスト旅行");
    await page.getByLabel(/目的地/i).fill("北海道");
    await page.getByRole("button", { name: /作成する/i }).click();

    await page.waitForURL(/\/trips\/.+\/poll/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/trips\/.+\/poll/);
  });
});
