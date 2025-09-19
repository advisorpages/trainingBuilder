import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form on homepage', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Use test credentials that should exist in test environment
    await page.fill('input[type="email"]', 'content.developer@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'content.developer@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/dashboard/);

    // Refresh page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'content.developer@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/dashboard/);

    // Find and click logout button
    await page.click('[data-testid="logout-button"]');

    // Should redirect to login page
    await expect(page).toHaveURL('/');
    await expect(page.locator('form')).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/');
    await expect(page.locator('form')).toBeVisible();
  });

  test('should handle different user roles', async ({ page }) => {
    // Test different role access patterns
    const roles = [
      { email: 'content.developer@test.com', expectedNav: 'Sessions' },
      { email: 'broker@test.com', expectedNav: 'Reports' },
      { email: 'trainer@test.com', expectedNav: 'My Sessions' },
    ];

    for (const role of roles) {
      await page.goto('/');
      await page.fill('input[type="email"]', role.email);
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*\/dashboard/);
      await expect(page.locator(`text=${role.expectedNav}`)).toBeVisible();

      // Logout for next iteration
      await page.click('[data-testid="logout-button"]');
    }
  });
});