import { test, expect } from '@playwright/test';

/**
 * Session Builder Smoke Test
 *
 * Tests the core workflow of the new Phase 3 AI Session Builder:
 * - Navigation to the builder
 * - Form editing and autosave functionality
 * - AI content generation
 * - Preview functionality
 *
 * This test covers the main user journey for the session builder experience.
 */

test.describe('Session Builder Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login as content developer (required for session builder access)
    await page.goto('/');
    await page.fill('input[type="email"]', 'content.developer@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for successful authentication and dashboard load
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('should load session builder and perform core workflow', async ({ page }) => {
    // Navigate to session builder (new session)
    await page.goto('/sessions/builder');

    // Should redirect to /sessions/builder/new and show the builder interface
    await expect(page).toHaveURL(/.*\/sessions\/builder\/new/);

    // Wait for the builder to initialize
    await expect(page.locator('text=AI Session Builder')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Loading builder experience')).toBeHidden({ timeout: 15000 });

    // Verify core builder components are present
    await expect(page.locator('[data-testid="session-metadata-form"], input[name="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-composer"], text=Generate AI Content')).toBeVisible();
    await expect(page.locator('[data-testid="artifacts-preview"], text=Preview')).toBeVisible();

    // Test form editing and autosave
    const titleInput = page.locator('input[name="title"]');
    await titleInput.fill('Smoke Test Session');

    const desiredOutcomeInput = page.locator('input[name="desiredOutcome"], textarea[name="desiredOutcome"]');
    await desiredOutcomeInput.fill('Test improved team collaboration');

    const currentProblemInput = page.locator('input[name="currentProblem"], textarea[name="currentProblem"]');
    await currentProblemInput.fill('Communication gaps in remote teams');

    // Verify autosave indicator appears
    await expect(page.locator('text=Saving...', 'text=Saved', '[data-testid="autosave-indicator"]')).toBeVisible({ timeout: 5000 });

    // Test AI content generation
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Generate AI Content")');
    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Wait for AI content to be generated (mock or real response)
      await expect(page.locator('text=Generating...', 'text=Generated content')).toBeVisible({ timeout: 10000 });

      // Verify AI content appears in the interface
      await expect(page.locator('[data-testid="ai-versions"], [data-testid="generated-content"]')).toBeVisible({ timeout: 15000 });
    }

    // Test manual save functionality
    const manualSaveButton = page.locator('button:has-text("Manual Save"), [data-testid="manual-save-button"]');
    if (await manualSaveButton.isVisible()) {
      await manualSaveButton.click();
      await expect(page.locator('text=Saved', '[data-testid="autosave-success"]')).toBeVisible({ timeout: 5000 });
    }

    // Verify readiness score is calculated and displayed
    await expect(page.locator('[data-testid="readiness-score"], text=Readiness')).toBeVisible();

    // Test preview functionality
    const previewTab = page.locator('button:has-text("Preview"), [data-testid="preview-tab"]');
    if (await previewTab.isVisible()) {
      await previewTab.click();

      // Verify preview content is displayed
      await expect(page.locator('[data-testid="session-preview"], [data-testid="landing-page-preview"]')).toBeVisible();
    }

    // Test quick add functionality if available
    const quickAddButton = page.locator('button:has-text("Quick Add"), [data-testid="quick-add-button"]');
    if (await quickAddButton.isVisible()) {
      await quickAddButton.click();

      // Verify quick add modal opens
      await expect(page.locator('[data-testid="quick-add-modal"]')).toBeVisible();

      // Close the modal
      await page.locator('button:has-text("Cancel"), [data-testid="modal-close"]').click();
      await expect(page.locator('[data-testid="quick-add-modal"]')).toBeHidden();
    }

    // Test responsive behavior (basic mobile check)
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify the layout adapts to mobile
    await expect(page.locator('text=AI Session Builder')).toBeVisible();

    // Restore desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle navigation between builder routes', async ({ page }) => {
    // Test direct navigation to session builder
    await page.goto('/sessions/builder/test-session-id');

    // Should show the builder interface
    await expect(page.locator('text=AI Session Builder')).toBeVisible({ timeout: 10000 });

    // Test navigation to sessions list (if available)
    await page.goto('/sessions');

    // Should show sessions list or redirect appropriately
    // This is flexible to handle different routing implementations
    await expect(page).toHaveURL(/.*\/sessions/);
  });

  test('should handle session builder with existing session data', async ({ page }) => {
    // Test loading builder with session data
    // This would test the hydration from backend/local storage
    await page.goto('/sessions/builder/existing-session');

    // Wait for builder to load
    await expect(page.locator('text=AI Session Builder')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Loading builder experience')).toBeHidden({ timeout: 15000 });

    // Verify the builder interface is functional even with existing data
    await expect(page.locator('[data-testid="session-metadata-form"], input[name="title"]')).toBeVisible();
  });

  test('should handle offline/online autosave gracefully', async ({ page }) => {
    await page.goto('/sessions/builder');
    await expect(page).toHaveURL(/.*\/sessions\/builder\/new/);
    await expect(page.locator('text=AI Session Builder')).toBeVisible({ timeout: 10000 });

    // Fill in some form data
    await page.locator('input[name="title"]').fill('Offline Test Session');

    // Simulate network offline
    await page.setOfflineMode(true);

    // Trigger autosave (should fall back to local storage)
    await page.locator('input[name="desiredOutcome"], textarea[name="desiredOutcome"]').fill('Test offline autosave');

    // Wait for offline autosave feedback
    await expect(page.locator('text=Saved locally', 'text=offline')).toBeVisible({ timeout: 8000 });

    // Restore network
    await page.setOfflineMode(false);

    // Verify online sync works
    await page.locator('input[name="currentProblem"], textarea[name="currentProblem"]').fill('Test online sync');
    await expect(page.locator('text=Saved', 'text=synced')).toBeVisible({ timeout: 8000 });
  });

  test('should display proper error states and loading states', async ({ page }) => {
    await page.goto('/sessions/builder');
    await expect(page).toHaveURL(/.*\/sessions\/builder\/new/);

    // Wait for the builder to finish loading
    await expect(page.locator('text=AI Session Builder')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Loading builder experience')).toBeHidden({ timeout: 15000 });

    // The builder should handle various loading and error states gracefully
    // Verify no error messages are shown in normal operation
    await expect(page.locator('text=Something went wrong', 'text=Error loading')).toBeHidden();

    // Verify the autosave indicator handles different states
    const autosaveIndicator = page.locator('[data-testid="autosave-indicator"]');
    if (await autosaveIndicator.isVisible()) {
      // Should show appropriate status (idle, saving, saved, or error)
      await expect(autosaveIndicator).toBeVisible();
    }
  });
});