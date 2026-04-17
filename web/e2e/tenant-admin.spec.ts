import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/tenantadmin.json' });

test.describe('Tenant Admin', () => {
  test('should display tenant dashboard', async ({ page }) => {
    await page.goto('/admin/tenant/dashboard');
    await expect(page.locator('h1:has-text("企业概览")')).toBeVisible();
    await expect(page.locator('text=已用/总用户数')).toBeVisible();
  });

  test('should navigate to users page', async ({ page }) => {
    await page.goto('/admin/tenant/dashboard');
    await page.click('text=用户管理');
    await expect(page).toHaveURL('/admin/tenant/users');
    await expect(page.locator('h1:has-text("用户管理")')).toBeVisible();
  });

  test('should navigate to roles page', async ({ page }) => {
    await page.goto('/admin/tenant/dashboard');
    await page.click('text=角色管理');
    await expect(page).toHaveURL('/admin/tenant/roles');
    await expect(page.locator('h1:has-text("角色管理")')).toBeVisible();
  });

  test('should navigate to modules page', async ({ page }) => {
    await page.goto('/admin/tenant/dashboard');
    await page.click('text=模块权限');
    await expect(page).toHaveURL('/admin/tenant/modules');
    await expect(page.locator('h1:has-text("模块权限")')).toBeVisible();
  });

  test('should redirect to login when accessing platform pages', async ({ page }) => {
    await page.goto('/admin/platform/tenants');
    await expect(page).toHaveURL('/login');
  });
});
