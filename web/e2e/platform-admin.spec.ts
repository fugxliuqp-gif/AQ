import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/superadmin.json' });

test.describe('Platform Admin', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      } else {
        console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => console.error(`[PAGE ERROR] ${err.message}`));
    page.on('response', async res => {
      if (res.url().includes(':3451/')) {
        console.log(`[API RESPONSE] ${res.status()} ${res.request().method()} ${res.url()}`);
      }
    });
  });

  test('should display platform dashboard', async ({ page }) => {
    await page.goto('/admin/platform/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=平台运营看板')).toBeVisible();
    await expect(page.locator('text=租户总数')).toBeVisible();
  });

  test('direct goto tenants page', async ({ page }) => {
    await page.goto('/admin/platform/tenants');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    console.log('Direct goto tenants URL:', url);
    const token = await page.evaluate(() => localStorage.getItem('chemical_saas_token'));
    console.log('Token present:', !!token);
    await expect(page).toHaveURL('/admin/platform/tenants');
    await expect(page.locator('h1:has-text("租户管理")')).toBeVisible();
  });

  test('should navigate to tenants page', async ({ page }) => {
    await page.goto('/admin/platform/dashboard');
    await page.waitForLoadState('networkidle');
    const token = await page.evaluate(() => localStorage.getItem('chemical_saas_token'));
    console.log('Token before click:', !!token);
    await page.getByRole('link', { name: '租户管理' }).click();
    await expect(page).toHaveURL('/admin/platform/tenants');
    await expect(page.locator('h1:has-text("租户管理")')).toBeVisible();
  });

  test('should navigate to licenses page', async ({ page }) => {
    await page.goto('/admin/platform/dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: '授权管理' }).click();
    await expect(page).toHaveURL('/admin/platform/licenses');
    await expect(page.locator('h1:has-text("授权管理")')).toBeVisible();
  });

  test('should navigate to modules page', async ({ page }) => {
    await page.goto('/admin/platform/dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: '模块管理' }).click();
    await expect(page).toHaveURL('/admin/platform/modules');
    await expect(page.locator('h1:has-text("模块管理")')).toBeVisible();
  });
});
