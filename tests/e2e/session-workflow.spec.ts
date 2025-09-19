import { test, expect } from '@playwright/test';

test.describe('Session Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as content developer
    await page.goto('/');
    await page.fill('input[type="email"]', 'content.developer@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('should create a new session draft', async ({ page }) => {
    // Navigate to session creation
    await page.click('text=Create Session');
    await expect(page).toHaveURL(/.*\/sessions\/new/);

    // Fill out session form
    await page.selectOption('select[name="topicId"]', { index: 1 });
    await page.selectOption('select[name="locationId"]', { index: 1 });
    await page.selectOption('select[name="trainerId"]', { index: 1 });
    await page.fill('input[name="sessionDate"]', '2024-12-31');
    await page.fill('input[name="startTime"]', '10:00');
    await page.fill('input[name="durationMinutes"]', '60');

    // Save as draft
    await page.click('button:has-text("Save Draft")');

    // Should see success message and redirect to drafts
    await expect(page.locator('text=Session saved as draft')).toBeVisible();
    await expect(page).toHaveURL(/.*\/sessions\/drafts/);
  });

  test('should generate AI content for session', async ({ page }) => {
    // Create a draft first (or navigate to existing draft)
    await page.click('text=Create Session');
    await page.selectOption('select[name="topicId"]', { index: 1 });
    await page.selectOption('select[name="locationId"]', { index: 1 });
    await page.selectOption('select[name="trainerId"]', { index: 1 });
    await page.fill('input[name="sessionDate"]', '2024-12-31');
    await page.fill('input[name="startTime"]', '10:00');

    // Click generate AI content
    await page.click('button:has-text("Generate AI Content")');

    // Should show AI prompt interface
    await expect(page.locator('text=AI Prompt Generator')).toBeVisible();

    // Fill additional details for AI generation
    await page.selectOption('select[name="audienceId"]', { index: 1 });
    await page.selectOption('select[name="categoryId"]', { index: 1 });
    await page.selectOption('select[name="toneId"]', { index: 1 });

    // Generate prompt
    await page.click('button:has-text("Generate Prompt")');

    // Should show generated prompt
    await expect(page.locator('[data-testid="generated-prompt"]')).toBeVisible();

    // Review and generate content
    await page.click('button:has-text("Generate Content")');

    // Should show loading state then generated content
    await expect(page.locator('text=Generating content...')).toBeVisible();
    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible({ timeout: 30000 });

    // Accept generated content
    await page.click('button:has-text("Accept Content")');

    // Should save content to session
    await expect(page.locator('text=Content integrated successfully')).toBeVisible();
  });

  test('should publish a session', async ({ page }) => {
    // Navigate to drafts (assuming there's at least one draft)
    await page.click('text=Drafts');
    await expect(page).toHaveURL(/.*\/sessions\/drafts/);

    // Click on first draft
    await page.click('[data-testid="session-card"]:first-child');

    // Should be on session detail page
    await expect(page.locator('text=Session Details')).toBeVisible();

    // Publish session
    await page.click('button:has-text("Publish")');

    // Should show confirmation dialog
    await expect(page.locator('text=Confirm Publishing')).toBeVisible();
    await page.click('button:has-text("Confirm")');

    // Should see success message and status change
    await expect(page.locator('text=Session published successfully')).toBeVisible();
    await expect(page.locator('text=Published')).toBeVisible();
  });

  test('should generate QR code for published session', async ({ page }) => {
    // Navigate to published sessions
    await page.click('text=Published');
    await expect(page).toHaveURL(/.*\/sessions\/published/);

    // Click on first published session
    await page.click('[data-testid="session-card"]:first-child');

    // Generate QR code
    await page.click('button:has-text("Generate QR Code")');

    // Should show QR code
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    await expect(page.locator('text=QR Code generated successfully')).toBeVisible();

    // Download QR code
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download QR Code")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/session-.*-qr\.png/);
  });

  test('should validate session form fields', async ({ page }) => {
    await page.click('text=Create Session');

    // Try to save without required fields
    await page.click('button:has-text("Save Draft")');

    // Should show validation errors
    await expect(page.locator('text=Topic is required')).toBeVisible();
    await expect(page.locator('text=Location is required')).toBeVisible();
    await expect(page.locator('text=Trainer is required')).toBeVisible();
    await expect(page.locator('text=Session date is required')).toBeVisible();

    // Fill partial form
    await page.selectOption('select[name="topicId"]', { index: 1 });
    await page.selectOption('select[name="locationId"]', { index: 1 });

    // Try to save again
    await page.click('button:has-text("Save Draft")');

    // Should still show remaining validation errors
    await expect(page.locator('text=Trainer is required')).toBeVisible();
    await expect(page.locator('text=Session date is required')).toBeVisible();
  });

  test('should handle session date and time validation', async ({ page }) => {
    await page.click('text=Create Session');

    // Fill required fields
    await page.selectOption('select[name="topicId"]', { index: 1 });
    await page.selectOption('select[name="locationId"]', { index: 1 });
    await page.selectOption('select[name="trainerId"]', { index: 1 });

    // Try past date
    await page.fill('input[name="sessionDate"]', '2020-01-01');
    await page.fill('input[name="startTime"]', '10:00');
    await page.click('button:has-text("Save Draft")');

    // Should show date validation error
    await expect(page.locator('text=Session date cannot be in the past')).toBeVisible();

    // Try invalid time format
    await page.fill('input[name="sessionDate"]', '2024-12-31');
    await page.fill('input[name="startTime"]', '25:00');
    await page.click('button:has-text("Save Draft")');

    // Should show time validation error
    await expect(page.locator('text=Invalid time format')).toBeVisible();
  });

  test('should show preview of session content', async ({ page }) => {
    // Navigate to a session with generated content
    await page.click('text=Drafts');
    await page.click('[data-testid="session-card"]:first-child');

    // Toggle preview mode
    await page.click('button:has-text("Preview")');

    // Should show preview modal or page
    await expect(page.locator('[data-testid="session-preview"]')).toBeVisible();
    await expect(page.locator('text=Session Preview')).toBeVisible();

    // Should show formatted content
    await expect(page.locator('[data-testid="preview-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-details"]')).toBeVisible();

    // Close preview
    await page.click('button:has-text("Close Preview")');
    await expect(page.locator('[data-testid="session-preview"]')).not.toBeVisible();
  });
});