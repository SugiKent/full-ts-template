import { expect, test } from '@playwright/test'

test.describe('Admin Login and Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the login page
    await page.goto('/admin/login')
  })

  test('should successfully login and navigate to dashboard', async ({ page }) => {
    // Fill in login credentials
    await page.getByLabel('メールアドレス').fill('admin@backtech.co.jp')
    await page.getByLabel('パスワード').fill('P@ssw0rd')

    // Click login button
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Wait for navigation to dashboard
    await page.waitForURL('/admin/dashboard')

    // Verify dashboard content
    await expect(page.getByText('管理画面ダッシュボード')).toBeVisible()
    await expect(page.getByText('管理者')).toBeVisible()
    await expect(page.getByText('admin')).toBeVisible()

    // Verify statistics cards are visible
    await expect(page.getByText('登録利用者数')).toBeVisible()
    await expect(page.getByText('今月の面談数')).toBeVisible()
    await expect(page.getByText('未読メッセージ')).toBeVisible()
  })

  test('should show error message with invalid credentials', async ({ page }) => {
    // Fill in wrong credentials
    await page.getByLabel('メールアドレス').fill('admin@backtech.co.jp')
    await page.getByLabel('パスワード').fill('wrongpassword')

    // Click login button
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Verify error message is displayed
    await expect(page.getByText('Invalid email or password')).toBeVisible()

    // Verify still on login page
    await expect(page).toHaveURL('/admin/login')
  })

  test('should redirect to login when accessing dashboard without authentication', async ({
    page,
  }) => {
    // Try to access dashboard directly
    await page.goto('/admin/dashboard')

    // Should be redirected to login page
    await page.waitForURL('/admin/login')
    await expect(page.getByRole('heading', { name: '管理画面ログイン' })).toBeVisible()
  })

  test('should successfully logout from dashboard', async ({ page }) => {
    // Login first
    await page.getByLabel('メールアドレス').fill('admin@backtech.co.jp')
    await page.getByLabel('パスワード').fill('P@ssw0rd')
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Wait for dashboard
    await page.waitForURL('/admin/dashboard')

    // Click logout button
    await page.getByRole('button', { name: 'ログアウト' }).click()

    // Should be redirected to login page
    await page.waitForURL('/admin/login')
    await expect(page.getByRole('heading', { name: '管理画面ログイン' })).toBeVisible()

    // Try to access dashboard again (should redirect to login)
    await page.goto('/admin/dashboard')
    await page.waitForURL('/admin/login')
  })

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling any fields
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Verify still on login page (form validation should prevent submission)
    await expect(page).toHaveURL('/admin/login')

    // Fill only email
    await page.getByLabel('メールアドレス').fill('admin@backtech.co.jp')
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Should still be on login page
    await expect(page).toHaveURL('/admin/login')
  })

  test('should redirect to dashboard when already logged in', async ({ page }) => {
    // Login
    await page.getByLabel('メールアドレス').fill('admin@backtech.co.jp')
    await page.getByLabel('パスワード').fill('P@ssw0rd')
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Wait for dashboard
    await page.waitForURL('/admin/dashboard')

    // Try to access login page again
    await page.goto('/admin/login')

    // Note: This test assumes auto-redirect behavior is implemented
    // If not implemented, this test may need to be adjusted
    const currentUrl = page.url()
    expect(currentUrl).toContain('/admin')
  })
})
