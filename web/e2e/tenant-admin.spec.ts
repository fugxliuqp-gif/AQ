import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/tenantadmin.json' });

test.describe('Tenant Admin', () => {
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

  test('should display tenant dashboard', async ({ page }) => {
    await page.goto('/admin/tenant/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("企业概览")')).toBeVisible();
    await expect(page.locator('text=已用/总用户数')).toBeVisible();
  });

  test('should navigate to users page', async ({ page }) => {
    await page.goto('/admin/tenant/dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: '用户管理' }).click();
    await expect(page).toHaveURL('/admin/tenant/users');
    await expect(page.locator('h1:has-text("用户管理")')).toBeVisible();
  });

  test('should navigate to roles page', async ({ page }) => {
    await page.goto('/admin/tenant/dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: '角色管理' }).click();
    await expect(page).toHaveURL('/admin/tenant/roles');
    await expect(page.locator('h1:has-text("角色管理")')).toBeVisible();
  });

  test('should navigate to modules page', async ({ page }) => {
    await page.goto('/admin/tenant/dashboard');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: '模块权限' }).click();
    await expect(page).toHaveURL('/admin/tenant/modules');
    await expect(page.locator('h1:has-text("模块权限")')).toBeVisible();
  });

  test('should redirect to login when accessing platform pages', async ({ page }) => {
    await page.goto('/admin/platform/tenants');
    await expect(page).toHaveURL('/login');
  });
});
