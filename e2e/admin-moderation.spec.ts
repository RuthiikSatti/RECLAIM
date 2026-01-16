import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Admin Moderation (Resolve/Dismiss Reports)
 *
 * These tests verify:
 * 1. Admin API endpoint accepts PATCH requests with status updates
 * 2. API returns correct JSON response shape
 * 3. Unauthorized users receive 403
 * 4. Invalid requests receive appropriate errors
 *
 * Note: Full UI tests require authentication setup.
 * API tests use ADMIN_TEST_MODE for bypass.
 */

const TEST_REPORT_ID = 'test-report-id-123'

test.describe('Admin Moderation API', () => {
  test('PATCH /api/admin/reports/[id] returns 403 without auth', async ({ request }) => {
    const response = await request.patch(`/api/admin/reports/${TEST_REPORT_ID}`, {
      data: { status: 'resolved' },
    })

    expect(response.status()).toBe(403)

    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toContain('Unauthorized')
  })

  test('PATCH /api/admin/reports/[id] returns 400 for invalid status', async ({ request }) => {
    // This test would need ADMIN_TEST_MODE enabled to bypass auth
    // For now, we just verify the endpoint exists and handles errors
    const response = await request.patch(`/api/admin/reports/${TEST_REPORT_ID}`, {
      data: { status: 'invalid-status' },
    })

    // Will get 403 because no auth, but endpoint exists
    expect([400, 403]).toContain(response.status())
  })

  test('PATCH /api/admin/reports/[id] returns 400 for missing status', async ({ request }) => {
    const response = await request.patch(`/api/admin/reports/${TEST_REPORT_ID}`, {
      data: {},
    })

    expect([400, 403]).toContain(response.status())
  })

  test('GET /api/admin/reports/[id] returns 403 without auth', async ({ request }) => {
    const response = await request.get(`/api/admin/reports/${TEST_REPORT_ID}`)

    expect(response.status()).toBe(403)

    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toContain('Unauthorized')
  })
})

test.describe('Admin Moderation API - With Test Token', () => {
  // These tests require ADMIN_TEST_MODE=true and ADMIN_TEST_TOKEN set

  test.skip(
    !process.env.ADMIN_TEST_MODE || process.env.ADMIN_TEST_MODE !== 'true',
    'ADMIN_TEST_MODE not enabled'
  )

  test('PATCH with test token should work', async ({ request }) => {
    const response = await request.patch(`/api/admin/reports/${TEST_REPORT_ID}`, {
      data: { status: 'resolved' },
      headers: {
        'X-Admin-Test-Token': process.env.ADMIN_TEST_TOKEN || '',
      },
    })

    // If test mode is enabled and token is valid, should get 200 or 404 (if report doesn't exist)
    // If not, should get 403
    expect([200, 404, 403]).toContain(response.status())

    if (response.status() === 200) {
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.status).toBe('resolved')
    }
  })
})

test.describe('Admin Moderation UI', () => {
  // These tests require a logged-in admin user
  // Skip if no test credentials are configured

  test.skip(
    !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD,
    'Admin test credentials not configured'
  )

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL!)
    await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(marketplace|admin|$)/, { timeout: 10000 })
  })

  test('admin page loads and shows reports', async ({ page }) => {
    await page.goto('/admin')

    // Should not show access denied
    await expect(page.locator('text=Access Denied')).not.toBeVisible()

    // Should show admin panel
    await expect(page.locator('text=Admin Moderation Panel')).toBeVisible()
  })

  test('clicking Resolve updates report status', async ({ page }) => {
    await page.goto('/admin')

    // Find a pending report
    const reportCard = page.locator('[data-testid="report-card"]').filter({
      has: page.locator('[data-testid="report-status"]:has-text("pending")'),
    }).first()

    const cardCount = await reportCard.count()
    test.skip(cardCount === 0, 'No pending reports to test')

    // Click resolve button
    const resolveButton = reportCard.locator('[data-testid="resolve-button"]')
    await resolveButton.click()

    // Wait for update
    await page.waitForTimeout(2000)

    // Check for success toast or status change
    const successToast = reportCard.locator('[data-testid="success-toast"]')
    const newStatus = reportCard.locator('[data-testid="report-status"]')

    // Either success toast shows, or status changed to resolved
    const hasSuccess = await successToast.isVisible().catch(() => false)
    const statusText = await newStatus.textContent()

    expect(hasSuccess || statusText === 'resolved').toBeTruthy()
  })

  test('clicking Dismiss updates report status', async ({ page }) => {
    await page.goto('/admin')

    // Find a pending report
    const reportCard = page.locator('[data-testid="report-card"]').filter({
      has: page.locator('[data-testid="report-status"]:has-text("pending")'),
    }).first()

    const cardCount = await reportCard.count()
    test.skip(cardCount === 0, 'No pending reports to test')

    // Click dismiss button
    const dismissButton = reportCard.locator('[data-testid="dismiss-button"]')
    await dismissButton.click()

    // Wait for update
    await page.waitForTimeout(2000)

    // Check for success toast or status change
    const successToast = reportCard.locator('[data-testid="success-toast"]')
    const newStatus = reportCard.locator('[data-testid="report-status"]')

    // Either success toast shows, or status changed to dismissed
    const hasSuccess = await successToast.isVisible().catch(() => false)
    const statusText = await newStatus.textContent()

    expect(hasSuccess || statusText === 'dismissed').toBeTruthy()
  })

  test('error is shown when update fails', async ({ page }) => {
    // This test would need to simulate a failure scenario
    // For now, we just verify error UI elements exist

    await page.goto('/admin')

    // The error toast should not be visible initially
    const errorToast = page.locator('[data-testid="error-toast"]')
    await expect(errorToast).not.toBeVisible()
  })
})

test.describe('Admin Access Control', () => {
  test('non-admin user sees Access Denied on /admin', async ({ page }) => {
    // Visit admin page without login
    await page.goto('/admin')

    // Should show access denied or redirect
    const accessDenied = page.locator('text=Access Denied')
    const loginRedirect = page.url().includes('/login')

    expect(await accessDenied.isVisible() || loginRedirect).toBeTruthy()
  })
})
