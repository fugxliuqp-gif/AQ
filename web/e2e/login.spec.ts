import { test, expect } from '@playwright/test';

// Ensure each login test starts without any existing auth state
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login as superadmin and redirect to platform dashboard', async ({ page }) => {
    await page.fill('#username', 'superadmin');
    await page.fill('#password', 'admin123');
    await page.click('button:has-text("登录")');

    await expect(page).toHaveURL('/admin/platform/dashboard');
    await expect(page.locator('text=平台运营看板')).toBeVisible();
  });

  test('should login as tenantadmin and redirect to tenant dashboard', async ({ page }) => {
    await page.fill('#username', 'tenantadmin');
    await page.fill('#password', 'tenant123');
    await page.click('button:has-text("登录")');

    await expect(page).toHaveURL('/admin/tenant/dashboard');
    await expect(page.locator('h1:has-text("企业概览")')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.fill('#username', 'nobody');
    await page.fill('#password', 'wrongpass');
    await page.click('button:has-text("登录")');

    await expect(page.locator('text=用户名或密码错误')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
