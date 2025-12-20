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
  })
})
