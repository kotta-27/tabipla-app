import { test, expect } from "@playwright/test";

test.describe("認証", () => {
  test("未ログイン状態で / にアクセスするとログインページにリダイレクト", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("ログインページが正しく表示される", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /ログイン|tabipla/i })).toBeVisible();
    await expect(page.getByLabel(/メールアドレス|email/i)).toBeVisible();
    await expect(page.getByLabel(/パスワード/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /ログイン/i })).toBeVisible();
  });

  test("不正な認証情報でエラーが表示される", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/メールアドレス|email/i).fill("invalid@example.com");
    await page.getByLabel(/パスワード/i).fill("wrongpassword");
    await page.getByRole("button", { name: /ログイン/i }).click();
    await expect(page.getByText(/メールアドレスまたはパスワードが正しくありません|認証に失敗/i)).toBeVisible({ timeout: 5000 });
  });

  test("新規登録ページへのリンクが存在する", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /新規登録|アカウント作成/i })).toBeVisible();
  });
});
